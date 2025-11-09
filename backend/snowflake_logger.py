"""
Snowflake Logging Handler
Streams all application logs to Snowflake for persistence and analytics
"""
import os
import logging
import threading
import queue
import time
import traceback
import socket
from typing import Optional, Dict, Any
from datetime import datetime

try:
    import snowflake.connector
    from snowflake.connector import DictCursor
    SNOWFLAKE_AVAILABLE = True
except ImportError:
    SNOWFLAKE_AVAILABLE = False


class SnowflakeHandler(logging.Handler):
    """
    Custom logging handler that streams logs to Snowflake in batches.

    Features:
    - Batched inserts for performance
    - Background thread for non-blocking operation
    - Automatic retry on connection failures
    - Graceful degradation if Snowflake is unavailable
    """

    def __init__(
        self,
        account: str,
        user: str,
        password: Optional[str] = None,
        token: Optional[str] = None,
        database: str = "LOG_DB",
        schema: str = "RAW",
        warehouse: str = "LOG_WH",
        role: Optional[str] = None,
        batch_size: int = 100,
        flush_interval: float = 5.0,
        table_name: str = "app_logs"
    ):
        super().__init__()

        if not SNOWFLAKE_AVAILABLE:
            raise ImportError("snowflake-connector-python is not installed")

        if not password and not token:
            raise ValueError("Either password or token must be provided")

        # Connection parameters
        self.account = account
        self.user = user
        self.password = password
        self.token = token
        self.database = database
        self.schema = schema
        self.warehouse = warehouse
        self.role = role
        self.table_name = table_name

        # Batching configuration
        self.batch_size = batch_size
        self.flush_interval = flush_interval

        # Thread-safe queue for log records
        self.log_queue = queue.Queue()

        # Connection and batch buffer
        self.connection: Optional[snowflake.connector.SnowflakeConnection] = None
        self.batch: list = []

        # Background thread control
        self.running = False
        self.worker_thread: Optional[threading.Thread] = None

        # Metadata
        self.hostname = socket.gethostname()

        # Initialize connection and start worker
        self._connect()
        self._start_worker()

    def _connect(self):
        """Establish connection to Snowflake"""
        try:
            conn_params = {
                'account': self.account,
                'user': self.user,
                'database': self.database,
                'schema': self.schema,
                'warehouse': self.warehouse,
            }

            # Use token (PAT) or password authentication
            if self.token:
                conn_params['token'] = self.token
                conn_params['authenticator'] = 'oauth'
            elif self.password:
                conn_params['password'] = self.password

            if self.role:
                conn_params['role'] = self.role

            self.connection = snowflake.connector.connect(**conn_params)
            auth_method = "PAT" if self.token else "password"
            logging.info(f"✓ Connected to Snowflake ({auth_method}): {self.database}.{self.schema}")

        except Exception as e:
            logging.error(f"Failed to connect to Snowflake: {e}")
            self.connection = None

    def _start_worker(self):
        """Start background worker thread for batch processing"""
        self.running = True
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()
        logging.info("Snowflake logging worker thread started")

    def _worker(self):
        """Background worker that processes log queue and flushes batches"""
        last_flush = time.time()

        while self.running:
            try:
                # Try to get log record with timeout
                try:
                    record = self.log_queue.get(timeout=1.0)
                    self.batch.append(self._format_record(record))
                    self.log_queue.task_done()
                except queue.Empty:
                    pass

                # Flush if batch is full or interval elapsed
                current_time = time.time()
                should_flush = (
                    len(self.batch) >= self.batch_size or
                    (self.batch and current_time - last_flush >= self.flush_interval)
                )

                if should_flush:
                    self._flush_batch()
                    last_flush = current_time

            except Exception as e:
                logging.error(f"Error in Snowflake worker: {e}")
                time.sleep(1)  # Back off on error

    def _format_record(self, record: logging.LogRecord) -> Dict[str, Any]:
        """Convert LogRecord to Snowflake row format"""

        # Extract exception info if present
        exception_type = None
        exception_message = None
        stack_trace = None

        if record.exc_info:
            exception_type = record.exc_info[0].__name__ if record.exc_info[0] else None
            exception_message = str(record.exc_info[1]) if record.exc_info[1] else None
            stack_trace = ''.join(traceback.format_exception(*record.exc_info))

        # Extract custom fields from record
        agent_id = getattr(record, 'agent_id', None)
        endpoint = getattr(record, 'endpoint', None)
        execution_context = getattr(record, 'execution_context', None)

        # Build metadata object with extra fields
        metadata = {}
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName',
                          'levelname', 'levelno', 'lineno', 'module', 'msecs',
                          'message', 'pathname', 'process', 'processName', 'relativeCreated',
                          'thread', 'threadName', 'exc_info', 'exc_text', 'stack_info',
                          'agent_id', 'endpoint', 'execution_context']:
                try:
                    # Only include JSON-serializable values
                    metadata[key] = str(value)
                except:
                    pass

        return {
            'log_timestamp': datetime.fromtimestamp(record.created),
            'level': record.levelname,
            'logger_name': record.name,
            'message': record.getMessage(),
            'agent_id': agent_id,
            'endpoint': endpoint,
            'execution_context': execution_context,
            'exception_type': exception_type,
            'exception_message': exception_message,
            'stack_trace': stack_trace,
            'metadata': metadata if metadata else None,
            'host': self.hostname,
            'process_id': record.process,
            'thread_name': record.threadName,
        }

    def _flush_batch(self):
        """Flush current batch to Snowflake"""
        if not self.batch:
            return

        if not self.connection:
            # Try to reconnect
            self._connect()
            if not self.connection:
                logging.warning(f"Cannot flush {len(self.batch)} logs - no Snowflake connection")
                self.batch.clear()
                return

        try:
            cursor = self.connection.cursor()

            # Build INSERT statement
            insert_sql = f"""
                INSERT INTO {self.table_name} (
                    log_timestamp, level, logger_name, message,
                    agent_id, endpoint, execution_context,
                    exception_type, exception_message, stack_trace,
                    metadata, host, process_id, thread_name
                ) VALUES (
                    %(log_timestamp)s, %(level)s, %(logger_name)s, %(message)s,
                    %(agent_id)s, %(endpoint)s, %(execution_context)s,
                    %(exception_type)s, %(exception_message)s, %(stack_trace)s,
                    PARSE_JSON(%(metadata)s), %(host)s, %(process_id)s, %(thread_name)s
                )
            """

            # Convert metadata dicts to JSON strings
            for row in self.batch:
                if row['metadata']:
                    import json
                    row['metadata'] = json.dumps(row['metadata'])

            # Execute batch insert
            cursor.executemany(insert_sql, self.batch)
            cursor.close()

            logging.debug(f"✓ Flushed {len(self.batch)} logs to Snowflake")
            self.batch.clear()

        except Exception as e:
            logging.error(f"Failed to flush logs to Snowflake: {e}")
            # Clear batch to avoid infinite retry
            self.batch.clear()
            # Try to reconnect for next batch
            self.connection = None

    def emit(self, record: logging.LogRecord):
        """
        Handle a log record by adding it to the queue.
        This is called by the logging framework and must be fast.
        """
        try:
            # Avoid infinite loop - don't log our own snowflake operations
            if record.name.startswith('snowflake'):
                return

            self.log_queue.put_nowait(record)

        except queue.Full:
            # Queue is full, drop the log to avoid blocking
            pass
        except Exception:
            self.handleError(record)

    def close(self):
        """Cleanup: stop worker and flush remaining logs"""
        logging.info("Shutting down Snowflake logger...")

        # Stop worker thread
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=10)

        # Flush any remaining logs
        self._flush_batch()

        # Close connection
        if self.connection:
            try:
                self.connection.close()
            except:
                pass

        super().close()


def configure_snowflake_logging(logger: Optional[logging.Logger] = None) -> bool:
    """
    Configure Snowflake logging handler if enabled in environment.

    Args:
        logger: Logger to add handler to (defaults to root logger)

    Returns:
        True if Snowflake logging was configured, False otherwise
    """
    # Check if Snowflake logging is enabled
    enabled = os.getenv('SNOWFLAKE_ENABLED', 'false').lower() == 'true'
    if not enabled:
        logging.info("Snowflake logging is disabled (SNOWFLAKE_ENABLED not set)")
        return False

    if not SNOWFLAKE_AVAILABLE:
        logging.warning("Snowflake logging enabled but snowflake-connector-python not installed")
        return False

    # Get Snowflake configuration from environment
    account = os.getenv('SNOWFLAKE_ACCOUNT')
    user = os.getenv('SNOWFLAKE_USER')
    password = os.getenv('SNOWFLAKE_PASSWORD')
    token = os.getenv('SNOWFLAKE_TOKEN')  # PAT support
    database = os.getenv('SNOWFLAKE_DATABASE', 'LOG_DB')
    schema = os.getenv('SNOWFLAKE_SCHEMA', 'RAW')
    warehouse = os.getenv('SNOWFLAKE_WAREHOUSE', 'LOG_WH')
    role = os.getenv('SNOWFLAKE_ROLE')

    # Validate required configuration
    if not account or not user:
        logging.warning("Snowflake logging enabled but account/user missing")
        return False

    if not password and not token:
        logging.warning("Snowflake logging enabled but no password or token provided")
        return False

    # Get performance settings
    batch_size = int(os.getenv('SNOWFLAKE_BATCH_SIZE', '100'))
    flush_interval = float(os.getenv('SNOWFLAKE_FLUSH_INTERVAL', '5.0'))

    try:
        # Create and configure handler
        handler = SnowflakeHandler(
            account=account,
            user=user,
            password=password,
            token=token,
            database=database,
            schema=schema,
            warehouse=warehouse,
            role=role,
            batch_size=batch_size,
            flush_interval=flush_interval
        )

        # Use same format as console logging
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)

        # Add to logger
        target_logger = logger or logging.getLogger()
        target_logger.addHandler(handler)

        logging.info(f"✓ Snowflake logging enabled: {database}.{schema}")
        return True

    except Exception as e:
        logging.error(f"Failed to configure Snowflake logging: {e}")
        return False

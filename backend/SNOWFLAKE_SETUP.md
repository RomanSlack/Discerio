# Snowflake Logging Setup Guide

This guide explains how to set up Snowflake log ingestion for the FastAPI backend. All logs will be automatically streamed to Snowflake for persistence, analytics, and monitoring.

## Overview

The Snowflake integration captures **every log line** from your FastAPI application and streams it to Snowflake in real-time. This includes:

- Agent registration/removal events
- LLM provider operations
- Tool selection and execution
- Game server communication
- Errors and warnings
- All INFO, WARNING, ERROR, and CRITICAL level logs

## Prerequisites

1. **Snowflake Account** - You need a Snowflake account with ACCOUNTADMIN privileges
2. **SnowSQL CLI** - Install from: https://docs.snowflake.com/en/user-guide/snowsql-install-config
3. **Python Dependencies** - Installed via `uv pip install -r requirements.txt`

## Quick Start

### Step 1: Install SnowSQL (one-time)

```bash
# macOS
brew install snowflake-snowsql

# Linux
curl -O https://sfc-repo.snowflakecomputing.com/snowsql/bootstrap/1.2/linux_x86_64/snowsql-1.2.28-linux_x86_64.bash
bash snowsql-1.2.28-linux_x86_64.bash

# Windows
# Download from: https://developers.snowflake.com/snowsql/
```

### Step 2: Run the automated setup script

```bash
cd backend
./setup_snowflake.sh
```

This will:
- ✓ Test your Snowflake connection
- ✓ Create dedicated role: `LOG_INGESTOR`
- ✓ Create service user: `log_ingest`
- ✓ Create warehouse: `LOG_WH` (XSMALL, auto-suspend 60s)
- ✓ Create database: `LOG_DB`
- ✓ Create schema: `LOG_DB.RAW`
- ✓ Create table: `app_logs` (with clustering)
- ✓ Create analytics views: `recent_errors`, `agent_activity_summary`, `hourly_log_volume`
- ✓ Generate `.env.snowflake` with credentials

### Step 3: Configure your application

```bash
# Merge Snowflake config into your .env
cat .env.snowflake >> .env

# Enable Snowflake logging by editing .env
# Change this line:
# SNOWFLAKE_ENABLED=true
```

### Step 4: Install Python dependencies

```bash
uv pip install -r requirements.txt
```

### Step 5: Start your backend

```bash
python main.py
```

You should see:
```
✓ Connected to Snowflake: LOG_DB.RAW
Snowflake logging worker thread started
✓ Snowflake logging enabled: LOG_DB.RAW
```

## Manual Setup (Alternative)

If you prefer manual setup or need to customize:

### 1. Provision Snowflake resources via CLI

```bash
# Connect to Snowflake
snowsql -a <your_account>.region -u <admin_user>

# Run the provisioning script
snowsql -a <your_account> -u <admin_user> -f snowflake_setup.sql
```

### 2. Configure .env file

Add these lines to your `.env`:

```env
# Snowflake Configuration
SNOWFLAKE_ENABLED=true
SNOWFLAKE_ACCOUNT=abc12345.us-east-1
SNOWFLAKE_USER=log_ingest
SNOWFLAKE_PASSWORD=YourSecurePassword123
SNOWFLAKE_DATABASE=LOG_DB
SNOWFLAKE_SCHEMA=RAW
SNOWFLAKE_WAREHOUSE=LOG_WH
SNOWFLAKE_ROLE=LOG_INGESTOR

# Performance tuning (optional)
SNOWFLAKE_BATCH_SIZE=100
SNOWFLAKE_FLUSH_INTERVAL=5
```

### 3. Install dependencies and run

```bash
uv pip install -r requirements.txt
python main.py
```

## Snowflake Schema

### Table: `LOG_DB.RAW.app_logs`

| Column | Type | Description |
|--------|------|-------------|
| `log_timestamp` | TIMESTAMP_NTZ | When the log was created |
| `ingestion_timestamp` | TIMESTAMP_NTZ | When the log was ingested to Snowflake |
| `level` | VARCHAR(20) | Log level: INFO, WARNING, ERROR, CRITICAL |
| `logger_name` | VARCHAR(255) | Python logger name (e.g., `__main__`) |
| `message` | TEXT | Log message |
| `agent_id` | VARCHAR(100) | Agent ID (if applicable) |
| `endpoint` | VARCHAR(255) | API endpoint (if applicable) |
| `execution_context` | VARCHAR(50) | Execution context |
| `exception_type` | VARCHAR(255) | Exception class name (if error) |
| `exception_message` | TEXT | Exception message (if error) |
| `stack_trace` | TEXT | Full stack trace (if error) |
| `metadata` | VARIANT | Additional structured data (JSON) |
| `host` | VARCHAR(255) | Hostname |
| `process_id` | INTEGER | Process ID |
| `thread_name` | VARCHAR(255) | Thread name |

### Pre-built Views

#### 1. `recent_errors` - Last 24 hours of errors

```sql
SELECT * FROM LOG_DB.RAW.recent_errors LIMIT 100;
```

#### 2. `agent_activity_summary` - Per-agent statistics

```sql
SELECT * FROM LOG_DB.RAW.agent_activity_summary;
```

#### 3. `hourly_log_volume` - Log volume by hour and level

```sql
SELECT * FROM LOG_DB.RAW.hourly_log_volume ORDER BY hour DESC LIMIT 24;
```

## Usage Examples

### Query recent logs

```sql
-- All logs from last hour
SELECT log_timestamp, level, logger_name, message
FROM LOG_DB.RAW.app_logs
WHERE log_timestamp >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
ORDER BY log_timestamp DESC
LIMIT 100;
```

### Find errors for specific agent

```sql
SELECT log_timestamp, message, exception_type, exception_message, stack_trace
FROM LOG_DB.RAW.app_logs
WHERE agent_id = 'your_agent_id'
  AND level = 'ERROR'
ORDER BY log_timestamp DESC;
```

### Analyze LLM provider performance

```sql
SELECT
  DATE_TRUNC('minute', log_timestamp) as minute,
  COUNT(*) as llm_calls,
  COUNT_IF(message LIKE '%timeout%') as timeouts,
  COUNT_IF(level = 'ERROR') as errors
FROM LOG_DB.RAW.app_logs
WHERE logger_name LIKE '%llm%'
  AND log_timestamp >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
GROUP BY minute
ORDER BY minute DESC;
```

### Monitor auto-stepping performance

```sql
SELECT
  log_timestamp,
  message,
  PARSE_JSON(metadata):step_duration::FLOAT as duration_seconds
FROM LOG_DB.RAW.app_logs
WHERE message LIKE '%auto-stepping%'
  AND log_timestamp >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
ORDER BY log_timestamp DESC;
```

## Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│ FastAPI Application (main.py)                                   │
│                                                                  │
│  logging.info("Agent registered") ────┐                         │
│  logging.error("LLM timeout") ────────┼─> Python logging        │
│  logging.warning("Invalid tool") ─────┘       framework         │
│                                                   │              │
└───────────────────────────────────────────────────┼──────────────┘
                                                    │
                                                    ▼
                            ┌───────────────────────────────────────┐
                            │ SnowflakeHandler                      │
                            │ (snowflake_logger.py)                 │
                            │                                       │
                            │  • Thread-safe queue                  │
                            │  • Batching (100 logs / 5 sec)        │
                            │  • Background worker thread           │
                            │  • Auto-retry on failure              │
                            └───────────────────────────────────────┘
                                                    │
                                                    ▼
                            ┌───────────────────────────────────────┐
                            │ Snowflake                             │
                            │ LOG_DB.RAW.app_logs                   │
                            │                                       │
                            │  • Persistent storage                 │
                            │  • SQL analytics                      │
                            │  • Time-travel queries                │
                            │  • Data retention policies            │
                            └───────────────────────────────────────┘
```

### Performance Characteristics

- **Batching**: Logs are batched (default 100 logs or 5 seconds) for efficiency
- **Non-blocking**: Background thread ensures logging doesn't slow down API
- **Memory-safe**: Queue has backpressure to prevent memory exhaustion
- **Auto-retry**: Automatic reconnection on Snowflake connection failures
- **Graceful degradation**: Application continues if Snowflake is unavailable

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SNOWFLAKE_ENABLED` | `false` | Enable/disable Snowflake logging |
| `SNOWFLAKE_ACCOUNT` | - | Snowflake account ID (required) |
| `SNOWFLAKE_USER` | - | Snowflake username (required) |
| `SNOWFLAKE_PASSWORD` | - | Snowflake password (required) |
| `SNOWFLAKE_DATABASE` | `LOG_DB` | Database name |
| `SNOWFLAKE_SCHEMA` | `RAW` | Schema name |
| `SNOWFLAKE_WAREHOUSE` | `LOG_WH` | Warehouse name |
| `SNOWFLAKE_ROLE` | - | Role name (optional) |
| `SNOWFLAKE_BATCH_SIZE` | `100` | Logs per batch |
| `SNOWFLAKE_FLUSH_INTERVAL` | `5.0` | Seconds between flushes |

### Tuning for Different Workloads

**High-volume logging (1000+ logs/sec)**:
```env
SNOWFLAKE_BATCH_SIZE=500
SNOWFLAKE_FLUSH_INTERVAL=2.0
```

**Low-latency (faster visibility)**:
```env
SNOWFLAKE_BATCH_SIZE=10
SNOWFLAKE_FLUSH_INTERVAL=1.0
```

**Cost-optimized (minimize warehouse usage)**:
```env
SNOWFLAKE_BATCH_SIZE=1000
SNOWFLAKE_FLUSH_INTERVAL=30.0
```

## Troubleshooting

### Logs not appearing in Snowflake

1. **Check if enabled**:
   ```bash
   grep SNOWFLAKE_ENABLED .env
   # Should show: SNOWFLAKE_ENABLED=true
   ```

2. **Verify credentials**:
   ```bash
   snowsql -a <account> -u log_ingest
   ```

3. **Check application logs**:
   ```bash
   python main.py 2>&1 | grep -i snowflake
   # Should see: "✓ Connected to Snowflake: LOG_DB.RAW"
   ```

4. **Query Snowflake**:
   ```sql
   SELECT COUNT(*) FROM LOG_DB.RAW.app_logs;
   ```

### Connection errors

- Verify account ID format: `abc12345.us-east-1` (include region)
- Check firewall: Snowflake requires outbound HTTPS (port 443)
- Validate credentials: `snowsql -a <account> -u log_ingest`

### Performance issues

- Increase batch size if CPU usage is high
- Decrease flush interval if memory usage is high
- Check warehouse size: `SHOW WAREHOUSES LIKE 'LOG_WH';`

## Security Best Practices

1. **Use dedicated service account**: Don't use personal credentials
2. **Rotate passwords**: Change `log_ingest` password regularly
3. **Restrict permissions**: Only grant INSERT/SELECT on log table
4. **Use private key auth** (advanced):
   ```bash
   # Generate RSA key pair
   openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out snowflake_key.p8 -nocrypt
   openssl rsa -in snowflake_key.p8 -pubout -out snowflake_key.pub

   # Attach public key to user
   snowsql -a <account> -u <admin> -q "ALTER USER log_ingest SET RSA_PUBLIC_KEY='<base64_pub_key>';"

   # Update Python code to use private key auth
   ```

## Maintenance

### Clean up old logs

```sql
-- Delete logs older than 90 days
DELETE FROM LOG_DB.RAW.app_logs
WHERE log_timestamp < DATEADD(day, -90, CURRENT_TIMESTAMP());
```

### Enable automatic retention

```sql
-- Set 90-day retention (requires Enterprise Edition)
ALTER TABLE LOG_DB.RAW.app_logs SET DATA_RETENTION_TIME_IN_DAYS = 90;
```

### Monitor warehouse usage

```sql
SELECT
  DATE_TRUNC('hour', START_TIME) as hour,
  WAREHOUSE_NAME,
  SUM(CREDITS_USED) as total_credits
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE WAREHOUSE_NAME = 'LOG_WH'
  AND START_TIME >= DATEADD(day, -7, CURRENT_TIMESTAMP())
GROUP BY hour, WAREHOUSE_NAME
ORDER BY hour DESC;
```

## Cost Estimation

**Typical costs for this setup**:

- **Warehouse (XSMALL)**: ~$2/hour when running
  - With auto-suspend (60s): ~$0.10-0.50/day for moderate logging
- **Storage**: ~$23/TB/month
  - 1M logs ≈ 500MB ≈ $0.01/month
- **Data Transfer**: Usually free for same-region

**Cost optimization tips**:
- Use larger batch sizes and longer flush intervals
- Set aggressive auto-suspend (60 seconds)
- Enable table clustering only if needed
- Use XSMALL warehouse (already configured)

## Support

For issues or questions:

1. Check application logs: `python main.py 2>&1 | grep -i snowflake`
2. Verify Snowflake connection: `snowsql -a <account> -u log_ingest`
3. Review [Snowflake documentation](https://docs.snowflake.com/)

## License

This integration is part of the FastAPI MMO game backend project.

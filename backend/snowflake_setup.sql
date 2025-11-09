-- ============================================================================
-- Snowflake Setup Script for Application Logging
-- ============================================================================
-- Run this script via SnowSQL CLI as ACCOUNTADMIN:
--   snowsql -a <account> -u <admin_user> -f snowflake_setup.sql
-- ============================================================================

-- Step 1: Create dedicated role and user for log ingestion
-- ============================================================================
USE ROLE ACCOUNTADMIN;

CREATE ROLE IF NOT EXISTS LOG_INGESTOR
  COMMENT = 'Role for application log ingestion service';

CREATE USER IF NOT EXISTS log_ingest
  PASSWORD = 'ChangeMe123!'  -- CHANGE THIS IMMEDIATELY
  DEFAULT_ROLE = LOG_INGESTOR
  MUST_CHANGE_PASSWORD = FALSE
  COMMENT = 'Service account for streaming application logs';

GRANT ROLE LOG_INGESTOR TO USER log_ingest;

-- Step 2: Create warehouse for log operations
-- ============================================================================
CREATE WAREHOUSE IF NOT EXISTS LOG_WH
  WAREHOUSE_SIZE = XSMALL
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE
  COMMENT = 'Warehouse for log ingestion and queries';

GRANT USAGE ON WAREHOUSE LOG_WH TO ROLE LOG_INGESTOR;

-- Step 3: Create database and schema
-- ============================================================================
CREATE DATABASE IF NOT EXISTS LOG_DB
  COMMENT = 'Database for application logs';

CREATE SCHEMA IF NOT EXISTS LOG_DB.RAW
  COMMENT = 'Raw application logs';

GRANT USAGE ON DATABASE LOG_DB TO ROLE LOG_INGESTOR;
GRANT USAGE ON SCHEMA LOG_DB.RAW TO ROLE LOG_INGESTOR;
GRANT CREATE TABLE ON SCHEMA LOG_DB.RAW TO ROLE LOG_INGESTOR;

-- Step 4: Create main application logs table
-- ============================================================================
USE SCHEMA LOG_DB.RAW;

CREATE TABLE IF NOT EXISTS app_logs (
  -- Timestamp fields
  log_timestamp TIMESTAMP_NTZ NOT NULL,
  ingestion_timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),

  -- Core log fields
  level VARCHAR(20) NOT NULL,
  logger_name VARCHAR(255),
  message TEXT,

  -- Context fields
  agent_id VARCHAR(100),
  endpoint VARCHAR(255),
  execution_context VARCHAR(50),

  -- Error tracking
  exception_type VARCHAR(255),
  exception_message TEXT,
  stack_trace TEXT,

  -- Additional metadata (flexible JSON for any extra data)
  metadata VARIANT,

  -- Source tracking
  host VARCHAR(255),
  process_id INTEGER,
  thread_name VARCHAR(255),

  -- Clustering key for query performance
  CLUSTER BY (log_timestamp, level)
)
COMMENT = 'Application logs from FastAPI backend';

-- Grant permissions on the table
GRANT INSERT, SELECT ON TABLE app_logs TO ROLE LOG_INGESTOR;

-- Step 5: Create aggregated views for common queries
-- ============================================================================

-- View: Recent errors (last 24 hours)
CREATE OR REPLACE VIEW recent_errors AS
SELECT
  log_timestamp,
  logger_name,
  message,
  agent_id,
  endpoint,
  exception_type,
  exception_message
FROM app_logs
WHERE level IN ('ERROR', 'CRITICAL')
  AND log_timestamp >= DATEADD(hour, -24, CURRENT_TIMESTAMP())
ORDER BY log_timestamp DESC;

GRANT SELECT ON VIEW recent_errors TO ROLE LOG_INGESTOR;

-- View: Agent activity summary
CREATE OR REPLACE VIEW agent_activity_summary AS
SELECT
  agent_id,
  COUNT(*) as total_logs,
  COUNT_IF(level = 'ERROR') as error_count,
  COUNT_IF(level = 'WARNING') as warning_count,
  COUNT_IF(level = 'INFO') as info_count,
  MIN(log_timestamp) as first_seen,
  MAX(log_timestamp) as last_seen
FROM app_logs
WHERE agent_id IS NOT NULL
GROUP BY agent_id
ORDER BY last_seen DESC;

GRANT SELECT ON VIEW agent_activity_summary TO ROLE LOG_INGESTOR;

-- View: Hourly log volume
CREATE OR REPLACE VIEW hourly_log_volume AS
SELECT
  DATE_TRUNC('hour', log_timestamp) as hour,
  level,
  COUNT(*) as log_count
FROM app_logs
GROUP BY hour, level
ORDER BY hour DESC, level;

GRANT SELECT ON VIEW hourly_log_volume TO ROLE LOG_INGESTOR;

-- Step 6: Create retention policy (optional - adjust as needed)
-- ============================================================================
-- Keep logs for 90 days
-- ALTER TABLE app_logs SET DATA_RETENTION_TIME_IN_DAYS = 90;

-- Step 7: Verify setup
-- ============================================================================
SELECT 'Setup complete! Verify with these queries:' as status;

SELECT 'Roles created:' as check_type, COUNT(*) as count
FROM SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_USERS
WHERE GRANTEE_NAME = 'LOG_INGEST';

SELECT 'Tables created:' as check_type, COUNT(*) as count
FROM LOG_DB.INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'RAW' AND TABLE_NAME = 'APP_LOGS';

-- ============================================================================
-- Next Steps:
-- 1. Change the password for log_ingest user
-- 2. Add credentials to backend/.env:
--    SNOWFLAKE_ACCOUNT=<your_account>
--    SNOWFLAKE_USER=log_ingest
--    SNOWFLAKE_PASSWORD=<your_password>
--    SNOWFLAKE_DATABASE=LOG_DB
--    SNOWFLAKE_SCHEMA=RAW
--    SNOWFLAKE_WAREHOUSE=LOG_WH
-- 3. Run: uv pip install snowflake-connector-python
-- 4. Restart your FastAPI backend
-- ============================================================================

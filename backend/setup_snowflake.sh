#!/bin/bash
# ============================================================================
# Snowflake Setup Script - CLI-based provisioning
# ============================================================================
# This script provisions all Snowflake resources needed for log ingestion
# Prerequisites:
#   - SnowSQL installed: https://docs.snowflake.com/en/user-guide/snowsql-install-config
#   - Snowflake account with ACCOUNTADMIN privileges
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Snowflake Log Infrastructure Setup${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""

# Step 1: Check if SnowSQL is installed
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"
if ! command -v snowsql &> /dev/null; then
    echo -e "${RED}ERROR: SnowSQL is not installed${NC}"
    echo "Install from: https://docs.snowflake.com/en/user-guide/snowsql-install-config"
    exit 1
fi
echo -e "${GREEN}✓ SnowSQL found${NC}"
echo ""

# Step 2: Get Snowflake credentials
echo -e "${YELLOW}[2/5] Enter Snowflake credentials...${NC}"
read -p "Snowflake Account ID (e.g., abc12345.us-east-1): " SNOWFLAKE_ACCOUNT
read -p "Admin Username: " ADMIN_USER

# Ask for authentication method
echo ""
echo "Authentication method:"
echo "  1) Password"
echo "  2) Personal Access Token (PAT)"
read -p "Choose (1 or 2): " AUTH_METHOD

if [ "$AUTH_METHOD" = "2" ]; then
    read -sp "Admin PAT: " ADMIN_PAT
    echo ""
    USE_PAT=true
else
    read -sp "Admin Password: " ADMIN_PASSWORD
    echo ""
    USE_PAT=false
fi
echo ""

# Step 3: Test connection
echo -e "${YELLOW}[3/5] Testing Snowflake connection...${NC}"
if [ "$USE_PAT" = true ]; then
    # Test with PAT
    if snowsql -a "$SNOWFLAKE_ACCOUNT" -u "$ADMIN_USER" --authenticator=SNOWFLAKE_JWT --private-key-path=<(echo "$ADMIN_PAT") -q "SELECT CURRENT_ACCOUNT();" 2>/dev/null || \
       SNOWSQL_PWD="$ADMIN_PAT" snowsql -a "$SNOWFLAKE_ACCOUNT" -u "$ADMIN_USER" -q "SELECT CURRENT_ACCOUNT();" &> /dev/null; then
        echo -e "${GREEN}✓ Connection successful${NC}"
    else
        echo -e "${RED}ERROR: Failed to connect to Snowflake${NC}"
        echo "Please verify your PAT and try again"
        exit 1
    fi
else
    # Test with password
    if snowsql -a "$SNOWFLAKE_ACCOUNT" -u "$ADMIN_USER" -q "SELECT CURRENT_ACCOUNT();" <<< "$ADMIN_PASSWORD" &> /dev/null; then
        echo -e "${GREEN}✓ Connection successful${NC}"
    else
        echo -e "${RED}ERROR: Failed to connect to Snowflake${NC}"
        echo "Please verify your credentials and try again"
        exit 1
    fi
fi
echo ""

# Step 4: Run provisioning SQL
echo -e "${YELLOW}[4/5] Provisioning Snowflake resources...${NC}"
echo "This will create:"
echo "  - Role: LOG_INGESTOR"
echo "  - User: log_ingest"
echo "  - Warehouse: LOG_WH (XSMALL, auto-suspend 60s)"
echo "  - Database: LOG_DB"
echo "  - Schema: LOG_DB.RAW"
echo "  - Table: app_logs (with clustering)"
echo "  - Views: recent_errors, agent_activity_summary, hourly_log_volume"
echo ""

if [ "$USE_PAT" = true ]; then
    SNOWSQL_PWD="$ADMIN_PAT" snowsql -a "$SNOWFLAKE_ACCOUNT" -u "$ADMIN_USER" -f snowflake_setup.sql
else
    snowsql -a "$SNOWFLAKE_ACCOUNT" -u "$ADMIN_USER" -f snowflake_setup.sql <<< "$ADMIN_PASSWORD"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Snowflake resources provisioned successfully${NC}"
else
    echo -e "${RED}ERROR: Failed to provision resources${NC}"
    exit 1
fi
echo ""

# Step 5: Generate .env configuration
echo -e "${YELLOW}[5/5] Generating environment configuration...${NC}"
echo ""
echo "For the log_ingest service account, choose authentication:"
echo "  1) Use a password"
echo "  2) Use the same PAT"
read -p "Choose (1 or 2): " LOG_AUTH_METHOD

if [ "$LOG_AUTH_METHOD" = "2" ]; then
    if [ "$USE_PAT" = true ]; then
        LOG_PAT="$ADMIN_PAT"
    else
        read -sp "Enter PAT for log_ingest user: " LOG_PAT
        echo ""
    fi
    USE_LOG_PAT=true
else
    read -sp "Set password for log_ingest user: " LOG_PASSWORD
    echo ""
    USE_LOG_PAT=false

    # Update the log_ingest user password
    echo "Updating log_ingest user password..."
    if [ "$USE_PAT" = true ]; then
        SNOWSQL_PWD="$ADMIN_PAT" snowsql -a "$SNOWFLAKE_ACCOUNT" -u "$ADMIN_USER" \
            -q "ALTER USER log_ingest SET PASSWORD='$LOG_PASSWORD';" &> /dev/null
    else
        snowsql -a "$SNOWFLAKE_ACCOUNT" -u "$ADMIN_USER" \
            -q "ALTER USER log_ingest SET PASSWORD='$LOG_PASSWORD';" \
            <<< "$ADMIN_PASSWORD" &> /dev/null
    fi
fi
echo ""

if [ "$USE_LOG_PAT" = true ]; then
    cat > .env.snowflake << EOF
# Snowflake Configuration for Log Ingestion
# Generated: $(date)
# ============================================================================
SNOWFLAKE_ACCOUNT=$SNOWFLAKE_ACCOUNT
SNOWFLAKE_USER=log_ingest
SNOWFLAKE_TOKEN=$LOG_PAT
SNOWFLAKE_DATABASE=LOG_DB
SNOWFLAKE_SCHEMA=RAW
SNOWFLAKE_WAREHOUSE=LOG_WH
SNOWFLAKE_ROLE=LOG_INGESTOR

# Logging configuration
SNOWFLAKE_ENABLED=true
SNOWFLAKE_BATCH_SIZE=100
SNOWFLAKE_FLUSH_INTERVAL=5
EOF
else
    cat > .env.snowflake << EOF
# Snowflake Configuration for Log Ingestion
# Generated: $(date)
# ============================================================================
SNOWFLAKE_ACCOUNT=$SNOWFLAKE_ACCOUNT
SNOWFLAKE_USER=log_ingest
SNOWFLAKE_PASSWORD=$LOG_PASSWORD
SNOWFLAKE_DATABASE=LOG_DB
SNOWFLAKE_SCHEMA=RAW
SNOWFLAKE_WAREHOUSE=LOG_WH
SNOWFLAKE_ROLE=LOG_INGESTOR

# Logging configuration
SNOWFLAKE_ENABLED=true
SNOWFLAKE_BATCH_SIZE=100
SNOWFLAKE_FLUSH_INTERVAL=5
EOF
fi

echo -e "${GREEN}✓ Configuration saved to .env.snowflake${NC}"
echo ""

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Merge .env.snowflake into your .env file:"
echo -e "   ${YELLOW}cat .env.snowflake >> .env${NC}"
echo ""
echo "2. Install Python dependencies:"
echo -e "   ${YELLOW}uv pip install snowflake-connector-python${NC}"
echo ""
echo "3. Restart your FastAPI backend"
echo ""
echo "4. Verify logs are flowing to Snowflake:"
echo -e "   ${YELLOW}snowsql -a $SNOWFLAKE_ACCOUNT -u log_ingest -q 'SELECT COUNT(*) FROM LOG_DB.RAW.app_logs;'${NC}"
echo ""
echo -e "${GREEN}Your logs will now be automatically streamed to Snowflake!${NC}"
echo ""

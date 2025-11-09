#!/usr/bin/env python3
"""
Manual Snowflake Setup Script using Python
Uses PAT authentication directly
"""
import os
import sys

try:
    import snowflake.connector
    from dotenv import load_dotenv
except ImportError:
    print("ERROR: Missing dependencies. Installing...")
    os.system("pip install snowflake-connector-python python-dotenv")
    import snowflake.connector
    from dotenv import load_dotenv

def setup_snowflake():
    """Setup Snowflake logging infrastructure using PAT"""

    print("=" * 80)
    print("Snowflake Log Infrastructure Setup (Python)")
    print("=" * 80)
    print()

    # Get credentials
    print("[1/4] Enter Snowflake credentials...")
    account = input("Snowflake Account ID (e.g., HKIWUHF-IFC26856): ").strip()
    user = input("Admin Username (e.g., ROMANSLACK): ").strip()

    print("\nAuthentication method:")
    print("  1) Password")
    print("  2) Personal Access Token (PAT)")
    auth_method = input("Choose (1 or 2): ").strip()

    if auth_method == "2":
        token = input("Admin PAT: ").strip()
        password = None
    else:
        import getpass
        password = getpass.getpass("Admin Password: ")
        token = None

    print()

    # Test connection
    print("[2/4] Testing Snowflake connection...")
    try:
        conn_params = {
            'account': account,
            'user': user,
        }

        if token:
            conn_params['token'] = token
            conn_params['authenticator'] = 'oauth'
        else:
            conn_params['password'] = password

        conn = snowflake.connector.connect(**conn_params)
        cursor = conn.cursor()
        cursor.execute("SELECT CURRENT_ACCOUNT()")
        result = cursor.fetchone()
        print(f"✓ Connection successful! Account: {result[0]}")
        cursor.close()
    except Exception as e:
        print(f"ERROR: Failed to connect to Snowflake")
        print(f"Details: {e}")
        sys.exit(1)

    print()

    # Run provisioning SQL
    print("[3/4] Provisioning Snowflake resources...")
    print("Creating:")
    print("  - Role: LOG_INGESTOR")
    print("  - User: log_ingest")
    print("  - Warehouse: LOG_WH (XSMALL, auto-suspend 60s)")
    print("  - Database: LOG_DB")
    print("  - Schema: LOG_DB.RAW")
    print("  - Table: app_logs (with clustering)")
    print("  - Views: recent_errors, agent_activity_summary, hourly_log_volume")
    print()

    try:
        cursor = conn.cursor()

        # Read and execute SQL file
        with open('snowflake_setup.sql', 'r') as f:
            sql_content = f.read()

        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

        for stmt in statements:
            # Skip comments and empty statements
            if stmt and not stmt.startswith('--') and 'comment' not in stmt.lower() or 'create' in stmt.lower():
                try:
                    cursor.execute(stmt)
                except Exception as e:
                    # Continue on errors (object might already exist)
                    if 'already exists' not in str(e).lower():
                        print(f"Warning: {e}")

        cursor.close()
        print("✓ Snowflake resources provisioned successfully")

    except Exception as e:
        print(f"ERROR: Failed to provision resources")
        print(f"Details: {e}")
        sys.exit(1)

    print()

    # Generate .env configuration
    print("[4/4] Generating environment configuration...")
    print()

    if token:
        use_same_token = input("Use the same PAT for log_ingest user? (y/n): ").strip().lower()
        if use_same_token == 'y':
            log_token = token
        else:
            log_token = input("Enter PAT for log_ingest user: ").strip()

        env_content = f"""# Snowflake Configuration for Log Ingestion
# Generated automatically
# ============================================================================
SNOWFLAKE_ACCOUNT={account}
SNOWFLAKE_USER=log_ingest
SNOWFLAKE_TOKEN={log_token}
SNOWFLAKE_DATABASE=LOG_DB
SNOWFLAKE_SCHEMA=RAW
SNOWFLAKE_WAREHOUSE=LOG_WH
SNOWFLAKE_ROLE=LOG_INGESTOR

# Logging configuration
SNOWFLAKE_ENABLED=true
SNOWFLAKE_BATCH_SIZE=100
SNOWFLAKE_FLUSH_INTERVAL=5
"""
    else:
        import getpass
        log_password = getpass.getpass("Set password for log_ingest user: ")

        # Update password
        cursor = conn.cursor()
        cursor.execute(f"ALTER USER log_ingest SET PASSWORD='{log_password}';")
        cursor.close()

        env_content = f"""# Snowflake Configuration for Log Ingestion
# Generated automatically
# ============================================================================
SNOWFLAKE_ACCOUNT={account}
SNOWFLAKE_USER=log_ingest
SNOWFLAKE_PASSWORD={log_password}
SNOWFLAKE_DATABASE=LOG_DB
SNOWFLAKE_SCHEMA=RAW
SNOWFLAKE_WAREHOUSE=LOG_WH
SNOWFLAKE_ROLE=LOG_INGESTOR

# Logging configuration
SNOWFLAKE_ENABLED=true
SNOWFLAKE_BATCH_SIZE=100
SNOWFLAKE_FLUSH_INTERVAL=5
"""

    with open('.env.snowflake', 'w') as f:
        f.write(env_content)

    print("✓ Configuration saved to .env.snowflake")

    conn.close()

    print()
    print("=" * 80)
    print("Setup Complete!")
    print("=" * 80)
    print()
    print("Next steps:")
    print("1. Merge .env.snowflake into your .env file:")
    print("   cat .env.snowflake >> .env")
    print()
    print("2. Install Python dependencies (if not already done):")
    print("   uv pip install snowflake-connector-python")
    print()
    print("3. Start your FastAPI backend:")
    print("   python main.py")
    print()
    print("✓ Your logs will now be automatically streamed to Snowflake!")
    print()

if __name__ == "__main__":
    setup_snowflake()

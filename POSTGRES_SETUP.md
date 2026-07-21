# PostgreSQL Setup Guide for Plum.ai

This guide explains how to configure Plum.ai to use PostgreSQL instead of SQLite.

## Prerequisites

- PostgreSQL 12+ installed
- Python 3.11+
- psycopg2-binary (already in requirements.txt)

## Step 1: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE plum_ai_db;

# Create user
CREATE USER plum_user WITH PASSWORD 'your-secure-password';

# Grant privileges
ALTER ROLE plum_user SET client_encoding TO 'utf8';
ALTER ROLE plum_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE plum_user SET default_transaction_deferrable TO on;
ALTER ROLE plum_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE plum_ai_db TO plum_user;

# Exit psql
\q
```

## Step 2: Update .env File

```env
DATABASE_URL=postgresql+psycopg2://plum_user:your-secure-password@localhost:5432/plum_ai_db
```

## Step 3: Apply Migrations

```bash
# Run Alembic migrations
alembic upgrade head
```

## Step 4: Verify Connection

```bash
# Test connection
python -c "from backend.database.session import engine; print(engine.execute('SELECT 1'))"
```

## Production Considerations

1. **Connection Pooling**: Use SQLAlchemy connection pooling
2. **Backups**: Set up regular PostgreSQL backups
3. **Monitoring**: Monitor database performance
4. **Replication**: Set up streaming replication for HA
5. **SSL**: Enable SSL connections in production

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check PostgreSQL is listening on port 5432

### Authentication Failed
- Verify credentials in .env
- Check pg_hba.conf for md5 authentication

### Permission Denied
- Ensure plum_user has correct privileges
- Run GRANT commands from previous section

## Rollback to SQLite

To revert to SQLite:

```env
DATABASE_URL=sqlite:///./plum.db
```

Then restart the application.

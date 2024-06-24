# My Bizarre Adventure Docs

## Database Creation

Creating Servers (for recording messages)
```sql
CREATE TABLE mba_servers(created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP PRIMARY KEY, id TEXT NOT NULL, recording BOOL DEFAULT 'false', messages JSONB DEFAULT '[]');
```

Creating Users (for recording user data)
```sql
CREATE TABLE mba_users(created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP PRIMARY KEY, id TEXT NOT NULL, bal INT DEFAULT '100', stand TEXT DEFAULT 'none', xp INT DEFAULT '0', role TEXT DEFAULT 'student');
```

## Environment Variables Structure

```
CLIENT_TOKEN="discord bot token"
CLIENT_ID="discord bot id"

ADMIN_ID="your admin id"

PRIVATE_PGHOST=""
PRIVATE_PGDATABASE=""
PRIVATE_PGUSER=""
PRIVATE_PGPASSWORD=""
PRIVATE_ENDPOINT_ID=""
```
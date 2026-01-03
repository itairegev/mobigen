# Mobigen Analytics Infrastructure

Time-series database setup for Mobigen analytics using ClickHouse and TimescaleDB.

## Overview

This infrastructure provides:

- **ClickHouse**: Fast OLAP database for analytical queries (aggregations, reports)
- **TimescaleDB**: PostgreSQL with time-series optimizations (continuous aggregates, retention)
- **Grafana**: Visualization and dashboards

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Generated Apps                                                  │
│  (Analytics SDK)                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │   Gateway    │                                                │
│  │   (Ingestion)│                                                │
│  └──────────────┘                                                │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│  ClickHouse  TimescaleDB                                         │
│  (OLAP)      (Time-series)                                       │
│    │              │                                              │
│    └──────┬───────┘                                              │
│           ▼                                                      │
│       Grafana                                                    │
│     (Dashboards)                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of RAM available
- Ports 8123, 5433, 3001 available

### Start Services

```bash
# Navigate to infrastructure directory
cd infrastructure/analytics

# Create .env file
cat > .env << EOF
CLICKHOUSE_PASSWORD=your_secure_password_here
TIMESCALE_PASSWORD=your_secure_password_here
GRAFANA_PASSWORD=admin123
EOF

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Verify Setup

```bash
# Test ClickHouse
curl http://localhost:8123/ping
# Should return: Ok.

# Test TimescaleDB
docker compose exec timescale psql -U mobigen -d mobigen_analytics -c "SELECT version();"

# Access Grafana
# Open http://localhost:3001
# Login: admin / admin123
```

## Database Schemas

### ClickHouse

**Tables:**
- `events` - Main event table (partitioned by month)
- `sessions` - Session-level aggregations
- `users` - User-level aggregations

**Materialized Views:**
- `daily_active_users` - DAU metrics
- `screen_views_by_day` - Screen view analytics
- `events_by_type` - Event type breakdown
- `hourly_metrics` - Real-time hourly metrics
- `platform_metrics` - Platform breakdown (iOS/Android)

**Features:**
- Monthly partitioning for efficient querying
- 24-month data retention
- ZSTD compression
- Skip indexes for fast filtering

### TimescaleDB

**Hypertable:**
- `events` - Time-series event data (1-day chunks)

**Continuous Aggregates:**
- `hourly_metrics` - Hourly rollups (refreshed every 15 min)
- `daily_metrics` - Daily rollups (refreshed hourly)
- `daily_screen_views` - Screen view metrics
- `daily_platform_metrics` - Platform breakdown
- `daily_country_metrics` - Geographic breakdown

**Features:**
- Automatic compression (7+ days old)
- 24-month retention policy
- JSONB indexing for property queries
- Built-in retention rate function

## Data Flow

### Ingestion

Events flow from generated apps to the databases:

```
App (SDK) → Gateway API → ClickHouse + TimescaleDB
                ↓
         Materialized Views
                ↓
            Dashboards
```

### Example Event

```json
{
  "event_type": "screen_view",
  "event_name": "HomeScreen",
  "timestamp": "2024-01-15T10:30:00Z",
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user_123",
  "anonymous_id": "device_abc",
  "session_id": "session_xyz",
  "platform": "ios",
  "os_version": "iOS 17.1",
  "device_model": "iPhone 15 Pro",
  "app_version": "1.0.0",
  "country": "US",
  "properties": {
    "referrer": "push_notification"
  },
  "screen_name": "HomeScreen",
  "duration_ms": 5000
}
```

## Queries

### ClickHouse Queries

```sql
-- Get DAU for last 30 days
SELECT
    date,
    active_users
FROM mobigen_analytics.daily_active_users
WHERE project_id = '123e4567-e89b-12d3-a456-426614174000'
  AND date >= today() - 30
ORDER BY date;

-- Top screens by views
SELECT
    screen_name,
    SUM(view_count) AS total_views,
    AVG(unique_viewers) AS avg_unique_viewers
FROM mobigen_analytics.screen_views_by_day
WHERE project_id = '123e4567-e89b-12d3-a456-426614174000'
  AND date >= today() - 7
GROUP BY screen_name
ORDER BY total_views DESC
LIMIT 10;

-- Event funnel
SELECT
    event_name,
    COUNT(*) AS count,
    COUNT(*) * 100.0 / FIRST_VALUE(COUNT(*)) OVER (ORDER BY timestamp) AS conversion_rate
FROM mobigen_analytics.events
WHERE project_id = '123e4567-e89b-12d3-a456-426614174000'
  AND event_name IN ('view_product', 'add_to_cart', 'checkout', 'purchase')
  AND date >= today() - 7
GROUP BY event_name
ORDER BY timestamp;
```

### TimescaleDB Queries

```sql
-- Get hourly active users
SELECT
    hour,
    unique_users
FROM hourly_metrics
WHERE project_id = '123e4567-e89b-12d3-a456-426614174000'
  AND hour >= NOW() - INTERVAL '24 hours'
ORDER BY hour;

-- 7-day retention rate
SELECT * FROM get_retention_rate(
    '123e4567-e89b-12d3-a456-426614174000'::UUID,
    CURRENT_DATE - 7,
    7
);

-- Platform comparison
SELECT
    day,
    platform,
    users,
    sessions,
    ROUND(events::NUMERIC / sessions, 2) AS events_per_session
FROM daily_platform_metrics
WHERE project_id = '123e4567-e89b-12d3-a456-426614174000'
  AND day >= CURRENT_DATE - 30
ORDER BY day DESC, platform;
```

## Performance Optimization

### ClickHouse

- **Partitioning**: Monthly partitions for efficient data management
- **Compression**: ZSTD level 3 (good balance of speed/ratio)
- **Skip Indexes**: Bloom filters on user_id, screen_name
- **Materialized Views**: Pre-aggregated for common queries

### TimescaleDB

- **Compression**: Automatic after 7 days (60-90% space savings)
- **Continuous Aggregates**: Real-time rollups refreshed every 15min-1hr
- **Chunk Size**: 1-day chunks for optimal query performance
- **Indexes**: B-tree on common filters, GIN on JSONB properties

## Monitoring

### Check Database Sizes

```bash
# ClickHouse
docker compose exec clickhouse clickhouse-client \
  --query="SELECT database, table, formatReadableSize(sum(bytes)) AS size FROM system.parts GROUP BY database, table ORDER BY sum(bytes) DESC"

# TimescaleDB
docker compose exec timescale psql -U mobigen -d mobigen_analytics \
  -c "SELECT hypertable_name, pg_size_pretty(hypertable_size(format('%I.%I', hypertable_schema, hypertable_name)::regclass)) AS size FROM timescaledb_information.hypertables;"
```

### Check Compression

```bash
# TimescaleDB compression stats
docker compose exec timescale psql -U mobigen -d mobigen_analytics \
  -c "SELECT * FROM timescaledb_information.compression_settings WHERE hypertable_name = 'events';"
```

### View Active Queries

```bash
# ClickHouse
docker compose exec clickhouse clickhouse-client \
  --query="SELECT query, elapsed, memory_usage FROM system.processes"

# TimescaleDB
docker compose exec timescale psql -U mobigen -d mobigen_analytics \
  -c "SELECT pid, query_start, state, query FROM pg_stat_activity WHERE datname = 'mobigen_analytics';"
```

## Backup & Restore

### ClickHouse Backup

```bash
# Backup database
docker compose exec clickhouse clickhouse-client \
  --query="BACKUP DATABASE mobigen_analytics TO Disk('backups', 'backup_$(date +%Y%m%d).zip')"

# Restore
docker compose exec clickhouse clickhouse-client \
  --query="RESTORE DATABASE mobigen_analytics FROM Disk('backups', 'backup_20240115.zip')"
```

### TimescaleDB Backup

```bash
# Backup
docker compose exec timescale pg_dump -U mobigen mobigen_analytics > backup.sql

# Restore
docker compose exec -T timescale psql -U mobigen mobigen_analytics < backup.sql
```

## Scaling

### Vertical Scaling

Edit `docker-compose.yml` to increase resources:

```yaml
clickhouse:
  resources:
    limits:
      cpus: '4'
      memory: 8G
```

### Horizontal Scaling (Production)

For production, consider:

- **ClickHouse Cluster**: Sharding and replication across multiple nodes
- **TimescaleDB Multi-node**: Distributed hypertables
- **Read Replicas**: For analytics queries
- **Load Balancer**: Distribute ingestion load

## Troubleshooting

### ClickHouse Won't Start

```bash
# Check logs
docker compose logs clickhouse

# Common issues:
# - Insufficient memory (increase Docker memory limit)
# - Port conflict (change port in docker-compose.yml)
# - Corrupt data (remove volume and restart)
```

### TimescaleDB Extension Issues

```bash
# Verify extension is loaded
docker compose exec timescale psql -U mobigen -d mobigen_analytics \
  -c "SELECT * FROM pg_extension WHERE extname = 'timescaledb';"

# If missing, run:
docker compose exec timescale psql -U mobigen -d mobigen_analytics \
  -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
```

### Slow Queries

```bash
# ClickHouse - enable query profiling
docker compose exec clickhouse clickhouse-client \
  --query="SET log_queries = 1; SET log_query_threads = 1;"

# TimescaleDB - check slow query log
docker compose exec timescale psql -U mobigen -d mobigen_analytics \
  -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## Maintenance

### Cleanup Old Data

Both databases have automatic retention policies (24 months), but you can manually clean:

```sql
-- ClickHouse: Drop old partitions
ALTER TABLE mobigen_analytics.events DROP PARTITION '202301';

-- TimescaleDB: Drop old chunks
SELECT drop_chunks('events', INTERVAL '25 months');
```

### Optimize Tables

```bash
# ClickHouse: Optimize partitions
docker compose exec clickhouse clickhouse-client \
  --query="OPTIMIZE TABLE mobigen_analytics.events PARTITION '202401' FINAL"

# TimescaleDB: Vacuum and analyze
docker compose exec timescale psql -U mobigen -d mobigen_analytics \
  -c "VACUUM ANALYZE events;"
```

## Production Deployment

For production, consider:

1. **Use managed services**:
   - ClickHouse Cloud
   - Timescale Cloud
   - AWS RDS for PostgreSQL + TimescaleDB extension

2. **Enable SSL/TLS** for all connections

3. **Configure backups**:
   - Daily automated backups
   - Point-in-time recovery
   - Cross-region replication

4. **Set up monitoring**:
   - Prometheus + Grafana
   - CloudWatch/Datadog
   - Alert on high query times, disk usage

5. **Tune for your workload**:
   - Adjust chunk intervals
   - Optimize compression settings
   - Configure connection pooling

## Additional Resources

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [TimescaleDB Documentation](https://docs.timescale.com)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards)

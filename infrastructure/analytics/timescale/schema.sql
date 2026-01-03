-- TimescaleDB schema for Mobigen analytics
-- PostgreSQL with time-series optimizations

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- EVENTS HYPERTABLE - Main time-series table
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS events (
    -- Event identification
    event_id UUID DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,

    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- App & Project identification
    project_id UUID NOT NULL,
    app_version VARCHAR(50),
    bundle_id VARCHAR(255),

    -- User identification
    user_id VARCHAR(255),
    anonymous_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,

    -- Device & Platform
    platform VARCHAR(20) NOT NULL,
    os_version VARCHAR(50),
    device_model VARCHAR(100),
    app_build_number INTEGER,

    -- Location
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),

    -- Event properties (JSONB for flexible querying)
    properties JSONB,

    -- Performance metrics
    screen_name VARCHAR(255),
    duration_ms INTEGER,

    -- Primary key includes timestamp for hypertable
    PRIMARY KEY (timestamp, event_id)
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('events', 'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INDEXES - For fast queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index on project_id for filtering
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events (project_id, timestamp DESC);

-- Index on event_type for filtering
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type, timestamp DESC);

-- Index on user_id for user-level queries
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events (user_id, timestamp DESC)
WHERE user_id IS NOT NULL;

-- Index on session_id for session-level queries
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events (session_id, timestamp DESC);

-- Index on screen_name for screen analytics
CREATE INDEX IF NOT EXISTS idx_events_screen_name ON events (screen_name, timestamp DESC)
WHERE screen_name IS NOT NULL;

-- GIN index on properties JSONB for property queries
CREATE INDEX IF NOT EXISTS idx_events_properties ON events USING GIN (properties);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- COMPRESSION POLICIES - Compress old data
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Compress chunks older than 7 days
SELECT add_compression_policy('events', INTERVAL '7 days', if_not_exists => TRUE);

-- Set compression settings
ALTER TABLE events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'project_id, event_type',
    timescaledb.compress_orderby = 'timestamp DESC'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RETENTION POLICIES - Drop old data
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Retain 24 months of data
SELECT add_retention_policy('events', INTERVAL '24 months', if_not_exists => TRUE);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CONTINUOUS AGGREGATES - Pre-computed rollups
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Hourly metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_metrics
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS hour,
    project_id,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS unique_users,
    COUNT(DISTINCT session_id) AS unique_sessions,
    AVG(duration_ms)::INTEGER AS avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::INTEGER AS median_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::INTEGER AS p95_duration_ms
FROM events
WHERE duration_ms IS NOT NULL
GROUP BY hour, project_id, event_type
WITH NO DATA;

-- Daily metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    project_id,
    COUNT(*) AS total_events,
    COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS daily_active_users,
    COUNT(DISTINCT session_id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN event_type = 'screen_view' THEN screen_name END) AS unique_screens_viewed,
    AVG(CASE WHEN duration_ms IS NOT NULL THEN duration_ms END)::INTEGER AS avg_event_duration_ms
FROM events
GROUP BY day, project_id
WITH NO DATA;

-- Screen view metrics by day
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_screen_views
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    project_id,
    screen_name,
    COUNT(*) AS view_count,
    COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS unique_viewers,
    AVG(duration_ms)::INTEGER AS avg_time_on_screen_ms
FROM events
WHERE event_type = 'screen_view' AND screen_name IS NOT NULL
GROUP BY day, project_id, screen_name
WITH NO DATA;

-- Platform breakdown by day
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_platform_metrics
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    project_id,
    platform,
    COUNT(*) AS events,
    COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS users,
    COUNT(DISTINCT session_id) AS sessions
FROM events
GROUP BY day, project_id, platform
WITH NO DATA;

-- Country breakdown by day
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_country_metrics
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    project_id,
    country,
    COUNT(*) AS events,
    COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS users
FROM events
WHERE country IS NOT NULL
GROUP BY day, project_id, country
WITH NO DATA;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- REFRESH POLICIES - Keep continuous aggregates up-to-date
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Refresh hourly metrics every 15 minutes
SELECT add_continuous_aggregate_policy('hourly_metrics',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists => TRUE
);

-- Refresh daily metrics once per hour
SELECT add_continuous_aggregate_policy('daily_metrics',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Refresh screen view metrics once per hour
SELECT add_continuous_aggregate_policy('daily_screen_views',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Refresh platform metrics once per hour
SELECT add_continuous_aggregate_policy('daily_platform_metrics',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Refresh country metrics once per hour
SELECT add_continuous_aggregate_policy('daily_country_metrics',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function to get retention rate
CREATE OR REPLACE FUNCTION get_retention_rate(
    p_project_id UUID,
    p_start_date DATE,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    day_offset INTEGER,
    cohort_size BIGINT,
    returned_users BIGINT,
    retention_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH cohort AS (
        SELECT DISTINCT COALESCE(user_id, anonymous_id) AS user_id
        FROM events
        WHERE project_id = p_project_id
          AND timestamp::DATE = p_start_date
    )
    SELECT
        i AS day_offset,
        (SELECT COUNT(*) FROM cohort) AS cohort_size,
        COUNT(DISTINCT e.user_id) AS returned_users,
        ROUND(COUNT(DISTINCT e.user_id)::NUMERIC / (SELECT COUNT(*) FROM cohort) * 100, 2) AS retention_rate
    FROM generate_series(0, p_days) AS i
    LEFT JOIN (
        SELECT DISTINCT COALESCE(user_id, anonymous_id) AS user_id,
                       (timestamp::DATE - p_start_date) AS days_since_cohort
        FROM events
        WHERE project_id = p_project_id
          AND timestamp::DATE BETWEEN p_start_date AND p_start_date + p_days
    ) e ON e.days_since_cohort = i
    WHERE e.user_id IN (SELECT user_id FROM cohort) OR i = 0
    GROUP BY i
    ORDER BY i;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STATISTICS - Update statistics for query optimization
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYZE events;

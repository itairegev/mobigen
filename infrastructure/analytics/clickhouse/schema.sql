-- ClickHouse schema for Mobigen analytics
-- Optimized for fast analytical queries on event data

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- EVENTS TABLE - Main fact table for all analytics events
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS mobigen_analytics.events
(
    -- Event identification
    event_id UUID DEFAULT generateUUIDv4(),
    event_type LowCardinality(String),        -- 'screen_view', 'button_tap', 'purchase', etc.
    event_name String,                        -- Specific event name

    -- Timestamps
    timestamp DateTime64(3) DEFAULT now64(),  -- Event occurrence time (milliseconds)
    ingested_at DateTime DEFAULT now(),       -- When event was received

    -- App & Project identification
    project_id UUID,                          -- Which Mobigen project
    app_version String,                       -- App version (e.g., "1.0.0")
    bundle_id String,                         -- App bundle ID

    -- User identification
    user_id Nullable(String),                 -- User ID (if authenticated)
    anonymous_id String,                      -- Anonymous device ID
    session_id String,                        -- Session identifier

    -- Device & Platform
    platform LowCardinality(String),          -- 'ios' | 'android'
    os_version String,                        -- e.g., "iOS 17.1", "Android 14"
    device_model String,                      -- e.g., "iPhone 15 Pro", "Pixel 7"
    app_build_number UInt32,                  -- Build number

    -- Location (if available)
    country LowCardinality(String),           -- ISO country code
    region String,                            -- State/region
    city String,                              -- City

    -- Event properties (JSON)
    properties String,                        -- JSON string with event-specific data

    -- Performance metrics
    screen_name Nullable(String),             -- Screen where event occurred
    duration_ms Nullable(UInt32),             -- Duration for performance events

    -- Partitioning key
    date Date DEFAULT toDate(timestamp)       -- Partitioning column

) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)                   -- Monthly partitions
ORDER BY (project_id, date, event_type, timestamp)
TTL date + INTERVAL 24 MONTH DELETE          -- Retain 24 months of data
SETTINGS index_granularity = 8192;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SESSIONS TABLE - Session-level aggregations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS mobigen_analytics.sessions
(
    session_id String,
    project_id UUID,

    -- User identification
    user_id Nullable(String),
    anonymous_id String,

    -- Session timing
    session_start DateTime,
    session_end DateTime,
    duration_seconds UInt32,

    -- Session metrics
    event_count UInt32,
    screen_count UInt16,

    -- Device & Platform
    platform LowCardinality(String),
    os_version String,
    device_model String,
    app_version String,

    -- Location
    country LowCardinality(String),

    -- First/last screens
    first_screen String,
    last_screen String,

    -- Partitioning
    date Date DEFAULT toDate(session_start)

) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, session_id)
TTL date + INTERVAL 24 MONTH DELETE
SETTINGS index_granularity = 8192;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- USERS TABLE - User-level aggregations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS mobigen_analytics.users
(
    project_id UUID,
    user_id String,
    anonymous_id String,

    -- First/last seen
    first_seen DateTime,
    last_seen DateTime,

    -- Device info (last known)
    last_platform LowCardinality(String),
    last_os_version String,
    last_device_model String,
    last_app_version String,

    -- Location (last known)
    last_country LowCardinality(String),

    -- Lifetime metrics
    total_sessions UInt32,
    total_events UInt64,

    date Date DEFAULT toDate(first_seen)

) ENGINE = ReplacingMergeTree(last_seen)
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, user_id, anonymous_id)
TTL date + INTERVAL 24 MONTH DELETE
SETTINGS index_granularity = 8192;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MATERIALIZED VIEWS - Pre-aggregated metrics for fast queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Daily Active Users (DAU)
CREATE MATERIALIZED VIEW IF NOT EXISTS mobigen_analytics.daily_active_users
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date)
POPULATE AS
SELECT
    project_id,
    toDate(timestamp) AS date,
    uniqExact(COALESCE(user_id, anonymous_id)) AS active_users,
    uniqExact(session_id) AS total_sessions,
    count() AS total_events
FROM mobigen_analytics.events
GROUP BY project_id, date;

-- Screen Views by Day
CREATE MATERIALIZED VIEW IF NOT EXISTS mobigen_analytics.screen_views_by_day
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, screen_name)
POPULATE AS
SELECT
    project_id,
    toDate(timestamp) AS date,
    screen_name,
    count() AS view_count,
    uniqExact(COALESCE(user_id, anonymous_id)) AS unique_viewers
FROM mobigen_analytics.events
WHERE event_type = 'screen_view' AND screen_name IS NOT NULL
GROUP BY project_id, date, screen_name;

-- Events by Type (for analytics breakdown)
CREATE MATERIALIZED VIEW IF NOT EXISTS mobigen_analytics.events_by_type
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, event_type, event_name)
POPULATE AS
SELECT
    project_id,
    toDate(timestamp) AS date,
    event_type,
    event_name,
    count() AS event_count,
    uniqExact(COALESCE(user_id, anonymous_id)) AS unique_users,
    uniqExact(session_id) AS unique_sessions
FROM mobigen_analytics.events
GROUP BY project_id, date, event_type, event_name;

-- Hourly metrics (for real-time dashboards)
CREATE MATERIALIZED VIEW IF NOT EXISTS mobigen_analytics.hourly_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, hour)
POPULATE AS
SELECT
    project_id,
    toStartOfHour(timestamp) AS hour,
    toDate(timestamp) AS date,
    uniqExact(COALESCE(user_id, anonymous_id)) AS active_users,
    uniqExact(session_id) AS sessions,
    count() AS events,
    avg(duration_ms) AS avg_duration_ms
FROM mobigen_analytics.events
GROUP BY project_id, hour, date;

-- Platform breakdown
CREATE MATERIALIZED VIEW IF NOT EXISTS mobigen_analytics.platform_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, platform)
POPULATE AS
SELECT
    project_id,
    toDate(timestamp) AS date,
    platform,
    count() AS events,
    uniqExact(COALESCE(user_id, anonymous_id)) AS users,
    uniqExact(session_id) AS sessions
FROM mobigen_analytics.events
GROUP BY project_id, date, platform;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INDEXES - For faster queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Skip index for filtering by user_id
ALTER TABLE mobigen_analytics.events
ADD INDEX idx_user_id user_id TYPE bloom_filter GRANULARITY 4;

-- Skip index for event_type
ALTER TABLE mobigen_analytics.events
ADD INDEX idx_event_type event_type TYPE set(100) GRANULARITY 4;

-- Skip index for screen_name
ALTER TABLE mobigen_analytics.events
ADD INDEX idx_screen_name screen_name TYPE bloom_filter GRANULARITY 4;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DICTIONARIES - For lookups (e.g., country names)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Project metadata dictionary (for fast project info lookups)
CREATE DICTIONARY IF NOT EXISTS mobigen_analytics.project_dict
(
    project_id UUID,
    project_name String,
    template_id String,
    created_at DateTime
)
PRIMARY KEY project_id
SOURCE(HTTP(
    url 'http://api:3000/v1/analytics/projects'
    format 'JSONEachRow'
))
LAYOUT(HASHED())
LIFETIME(MIN 300 MAX 600);  -- Cache 5-10 minutes

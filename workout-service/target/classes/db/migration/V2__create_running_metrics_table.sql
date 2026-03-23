CREATE TABLE running_metrics (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id              UUID NOT NULL UNIQUE REFERENCES workouts (id) ON DELETE CASCADE,
    avg_heart_rate          INTEGER,
    max_heart_rate          INTEGER,
    avg_pace_seconds_per_km INTEGER,
    elevation_gain_meters   INTEGER,
    avg_cadence             INTEGER
);

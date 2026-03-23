CREATE TABLE workouts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL,
    workout_type       VARCHAR(50) NOT NULL,
    title              VARCHAR(255),
    start_time         TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time           TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds   INTEGER NOT NULL,
    distance_meters    INTEGER NOT NULL,
    notes              TEXT,
    metrics_session_id UUID,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_workouts_user_id ON workouts (user_id);
CREATE INDEX idx_workouts_start_time ON workouts (start_time);

CREATE TABLE IF NOT EXISTS deploy_api_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_success_at TIMESTAMP WITH TIME ZONE
);

INSERT INTO deploy_api_state (id, last_success_at)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

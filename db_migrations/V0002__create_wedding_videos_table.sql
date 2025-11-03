CREATE TABLE IF NOT EXISTS wedding_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO wedding_videos (title, url, display_order) VALUES
    ('Церемония', NULL, 1),
    ('Банкет', NULL, 2),
    ('Прогулка', NULL, 3);

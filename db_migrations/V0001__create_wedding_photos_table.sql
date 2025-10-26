CREATE TABLE IF NOT EXISTS wedding_photos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    alt TEXT NOT NULL DEFAULT 'Свадебное фото',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wedding_photos_order ON wedding_photos(display_order);

INSERT INTO wedding_photos (url, alt, display_order) VALUES
('https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/6e2347c1-be61-49a8-8300-97e353d15dbb.jpg', 'Алексей и Дарья', 1),
('https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/2f27d723-cffa-4e60-b28c-355ba35fb4aa.jpg', 'Свадебное оформление', 2),
('https://cdn.poehali.dev/projects/b3d2a9e2-198b-4e75-821e-efa9e6d0a5ee/files/44fcff5f-4eb6-4382-84a9-b1961c0fa188.jpg', 'Обручальные кольца', 3);
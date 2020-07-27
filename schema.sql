Drop TABLE IF EXISTS books;
Create TABLE books(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    thumbnail VARCHAR(255),
    identifier VARCHAR(255)
);
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    item_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted SMALLINT DEFAULT 0,
    is_active SMALLINT DEFAULT 1
);

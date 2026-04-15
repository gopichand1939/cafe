CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    item_image VARCHAR(255),
    price DECIMAL(10, 2) DEFAULT 0.00,
    discount_price DECIMAL(10, 2) DEFAULT NULL,
    preparation_time INT DEFAULT NULL,
    is_popular SMALLINT DEFAULT 0,
    is_new SMALLINT DEFAULT 0,
    is_veg SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted SMALLINT DEFAULT 0,
    is_active SMALLINT DEFAULT 1
);

-- Run this ALTER TABLE query if the table already exists:
-- ALTER TABLE items
--   ADD COLUMN discount_price DECIMAL(10, 2) DEFAULT NULL,
--   ADD COLUMN preparation_time INT DEFAULT NULL,
--   ADD COLUMN is_new SMALLINT DEFAULT 0,
--   ADD COLUMN is_veg SMALLINT DEFAULT 1;

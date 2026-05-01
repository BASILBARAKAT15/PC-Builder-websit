-- Add wishlist table to existing pcbuilder_db.
USE pcbuilder_db;

CREATE TABLE IF NOT EXISTS wishlist (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    product_name  VARCHAR(150) NOT NULL,
    price         DECIMAL(10,2) NOT NULL,
    image         VARCHAR(255) DEFAULT NULL,
    category      VARCHAR(60)  DEFAULT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_product (user_id, product_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

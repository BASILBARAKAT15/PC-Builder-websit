-- ============================================
-- PC Builder Database Schema
-- Run this once in phpMyAdmin
-- ============================================

CREATE DATABASE IF NOT EXISTS pcbuilder_db
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pcbuilder_db;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(60)  NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('user','admin') NOT NULL DEFAULT 'user',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    price      DECIMAL(10,2) NOT NULL,
    category   VARCHAR(60)  NOT NULL,
    stock      INT NOT NULL DEFAULT 0,
    image      VARCHAR(255) DEFAULT NULL,
    specs      TEXT DEFAULT NULL,                   -- JSON-encoded {key: value}
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- COUPONS ----------
CREATE TABLE IF NOT EXISTS coupons (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(40) NOT NULL UNIQUE,
    discount   INT NOT NULL,
    label      VARCHAR(120) NOT NULL,
    is_active  TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    total_price      DECIMAL(10,2) NOT NULL,
    status           ENUM('pending','processing','shipped','delivered','cancelled')
                     NOT NULL DEFAULT 'pending',
    shipping_name    VARCHAR(120) NOT NULL,
    shipping_address VARCHAR(255) NOT NULL,
    payment_method   VARCHAR(40)  NOT NULL DEFAULT 'card',
    coupon_code      VARCHAR(40)  DEFAULT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS order_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    product_name  VARCHAR(150) NOT NULL,
    price         DECIMAL(10,2) NOT NULL,
    quantity      INT NOT NULL DEFAULT 1,
    image         VARCHAR(255) DEFAULT NULL,
    category      VARCHAR(60)  DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA
-- ============================================

-- Default admin user is NOT inserted here — the placeholder password_hash
-- would make login fail silently ("Invalid email or password"). Instead,
-- open api/seed_admin.php ONCE in the browser after running this schema:
--   http://localhost/PC-Builder-websit-akram/api/seed_admin.php
-- It will create the admin with a valid bcrypt hash for Admin@123.

-- Default coupons
INSERT INTO coupons (code, discount, label, is_active) VALUES
('WELCOME10', 10, '10% Off Welcome', 1),
('PCBUILD20', 20, '20% Off PC Build', 1),
('SAVE5',      5, '5% Off Any Order', 1)
ON DUPLICATE KEY UPDATE code=code;

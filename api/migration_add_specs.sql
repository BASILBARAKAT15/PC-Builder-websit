-- ============================================
-- Migration: add 'specs' JSON column to products
-- Run this ONCE if you already have an existing pcbuilder_db.
-- Safe to re-run (IF NOT EXISTS).
-- ============================================

USE pcbuilder_db;

-- MariaDB 10.0+ supports IF NOT EXISTS on ALTER TABLE ADD COLUMN.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS specs TEXT DEFAULT NULL AFTER image;

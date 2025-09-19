-- Migration: create_recommended_categories
-- This table stores category recommendations submitted by tutors. Admins will review
-- and optionally insert approved entries into the main `categories` table.

CREATE TABLE IF NOT EXISTS recommended_categories (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tutor_id VARCHAR(100) DEFAULT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Example categories table definition (columns commonly needed by the app)
-- Adjust types to match your existing categories table if it already exists.

CREATE TABLE IF NOT EXISTS categories (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(150) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

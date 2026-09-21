-- Glanzza — MySQL/MariaDB schema
-- Run na: CREATE DATABASE glanzza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE glanzza;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  plan          ENUM('start','pro') NOT NULL DEFAULT 'start',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE services (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL,
  price_cents INT UNSIGNED NOT NULL,
  duration_min INT UNSIGNED NOT NULL DEFAULT 60,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customers (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(120) NOT NULL,
  phone      VARCHAR(40)  NULL,
  email      VARCHAR(190) NULL,
  notes      TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  service_id  INT UNSIGNED NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  starts_at   DATETIME NOT NULL,
  ends_at     DATETIME NOT NULL,
  deposit_cents INT UNSIGNED NOT NULL DEFAULT 0,
  deposit_paid  TINYINT(1) NOT NULL DEFAULT 0,
  status      ENUM('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
  reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id, starts_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

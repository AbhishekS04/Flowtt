-- Run this SQL in your Neon DB SQL console (or via psql)
-- Trackr — Initial Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  monthly_budget  NUMERIC(10, 2) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT now()
);

-- Table: expenses
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      NUMERIC(10, 2) NOT NULL,
  category    TEXT NOT NULL,
  date        DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

-- Table: category_budgets
CREATE TABLE IF NOT EXISTS category_budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  limit_amount  NUMERIC(10, 2) NOT NULL,
  month         TEXT NOT NULL
);
-- Run this SQL in your Neon DB SQL console (or via psql)
-- Trackr — Initial Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  monthly_budget  NUMERIC(10, 2) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT now()
);

-- Table: expenses
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      NUMERIC(10, 2) NOT NULL,
  category    TEXT NOT NULL,
  date        DATE NOT NULL,
  note        TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

-- Table: category_budgets
CREATE TABLE IF NOT EXISTS category_budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  limit_amount  NUMERIC(10, 2) NOT NULL,
  month         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  auth_provider VARCHAR(64),
  role VARCHAR(32) NOT NULL DEFAULT 'prospect',
  status VARCHAR(32) NOT NULL DEFAULT 'quote_requested',
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS boat_configurations (
  id VARCHAR(36) PRIMARY KEY,
  lead_id VARCHAR(36) NOT NULL,
  model VARCHAR(128) NOT NULL,
  configuration_json JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_config_lead FOREIGN KEY (lead_id) REFERENCES leads(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  requested_role VARCHAR(32) NOT NULL,
  approved_role VARCHAR(32),
  company VARCHAR(255),
  message TEXT,
  auth_provider VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  source VARCHAR(64) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  reviewed_at VARCHAR(32),
  reviewed_by VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

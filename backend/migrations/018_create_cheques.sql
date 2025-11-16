-- Create cheques table
CREATE TABLE IF NOT EXISTS cheques (
  id SERIAL PRIMARY KEY,
  cheque_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'TRY',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  drawer_name VARCHAR(255) NOT NULL,
  drawer_tax_number VARCHAR(50),
  bank_name VARCHAR(255) NOT NULL,
  bank_branch VARCHAR(255),
  account_number VARCHAR(50),
  payee_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'deposited', 'cashed', 'bounced', 'cancelled')),
  type VARCHAR(50) DEFAULT 'receivable' CHECK (type IN ('receivable', 'payable')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_dates CHECK (due_date >= issue_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_type ON cheques(type);
CREATE INDEX IF NOT EXISTS idx_cheques_due_date ON cheques(due_date);
CREATE INDEX IF NOT EXISTS idx_cheques_cheque_number ON cheques(cheque_number);

-- Insert into migrations table
INSERT INTO migrations (name) VALUES ('018_create_cheques')
ON CONFLICT (name) DO NOTHING;

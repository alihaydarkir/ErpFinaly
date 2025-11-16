-- Create cheque_transactions table
CREATE TABLE IF NOT EXISTS cheque_transactions (
  id SERIAL PRIMARY KEY,
  cheque_id INTEGER NOT NULL REFERENCES cheques(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('created', 'deposited', 'cashed', 'bounced', 'cancelled', 'updated', 'status_changed')),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(15, 2),
  notes TEXT,
  performed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cheque_transactions_cheque_id ON cheque_transactions(cheque_id);
CREATE INDEX IF NOT EXISTS idx_cheque_transactions_type ON cheque_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cheque_transactions_date ON cheque_transactions(transaction_date);

-- Insert into migrations table
INSERT INTO migrations (name) VALUES ('019_create_cheque_transactions')
ON CONFLICT (name) DO NOTHING;

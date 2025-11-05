-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(100),
    tax_number VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    location VARCHAR(255),
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    lead_time_days INTEGER DEFAULT 7,
    min_order_quantity INTEGER DEFAULT 1,
    risk_level VARCHAR(50) DEFAULT 'Medium',
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_supplier_tax_number UNIQUE(user_id, tax_number),
    CONSTRAINT check_payment_terms CHECK (payment_terms IN ('Net 30', 'Net 60', 'Peşin', 'Net 15', 'Net 90')),
    CONSTRAINT check_risk_level CHECK (risk_level IN ('Low', 'Medium', 'High')),
    CONSTRAINT check_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(12,2) DEFAULT 0,
    received_amount DECIMAL(12,2) DEFAULT 0,
    expected_delivery DATE,
    actual_delivery DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_status CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'))
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantity CHECK (quantity > 0),
    CONSTRAINT check_unit_price CHECK (unit_price >= 0),
    CONSTRAINT check_received_quantity CHECK (received_quantity >= 0 AND received_quantity <= quantity)
);

-- Create supplier_prices table
CREATE TABLE IF NOT EXISTS supplier_prices (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    minimum_quantity INTEGER DEFAULT 1,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_supplier_product_quantity UNIQUE(supplier_id, product_id, minimum_quantity),
    CONSTRAINT check_price CHECK (price >= 0),
    CONSTRAINT check_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tax_number ON suppliers(tax_number);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_supplier_prices_supplier_id ON supplier_prices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_prices_product_id ON supplier_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_prices_valid_dates ON supplier_prices(valid_from, valid_to);

-- Add comments
COMMENT ON TABLE suppliers IS 'Stores supplier/vendor information for purchase orders';
COMMENT ON TABLE purchase_orders IS 'Stores purchase orders placed with suppliers';
COMMENT ON TABLE purchase_order_items IS 'Stores individual items within purchase orders';
COMMENT ON TABLE supplier_prices IS 'Stores price lists from suppliers for different products';

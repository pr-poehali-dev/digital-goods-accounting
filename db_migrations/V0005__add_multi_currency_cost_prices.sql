-- Add separate cost prices for different currencies in products table
ALTER TABLE t_p6388661_digital_goods_accoun.products
ADD COLUMN cost_price_usd NUMERIC(10, 2);

-- Add separate cost prices for different currencies in expenses table  
ALTER TABLE t_p6388661_digital_goods_accoun.expenses
ADD COLUMN currency VARCHAR(3) DEFAULT 'RUB' NOT NULL;
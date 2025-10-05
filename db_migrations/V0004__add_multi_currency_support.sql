-- Add currency column to transactions table
ALTER TABLE t_p6388661_digital_goods_accoun.transactions 
ADD COLUMN currency VARCHAR(3) DEFAULT 'RUB' NOT NULL;

-- Add exchange_rates table to store historical rates
CREATE TABLE t_p6388661_digital_goods_accoun.exchange_rates (
  id SERIAL PRIMARY KEY,
  currency_from VARCHAR(3) NOT NULL,
  currency_to VARCHAR(3) NOT NULL,
  rate NUMERIC(10, 4) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(currency_from, currency_to, date)
);

-- Insert initial exchange rates
INSERT INTO t_p6388661_digital_goods_accoun.exchange_rates (currency_from, currency_to, rate, date)
VALUES 
  ('USD', 'RUB', 95.50, CURRENT_DATE),
  ('RUB', 'USD', 0.0105, CURRENT_DATE);

-- Add currency to products table
ALTER TABLE t_p6388661_digital_goods_accoun.products
ADD COLUMN currency VARCHAR(3) DEFAULT 'RUB' NOT NULL;
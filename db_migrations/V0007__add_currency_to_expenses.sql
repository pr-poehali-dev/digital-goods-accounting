-- Добавление поддержки валют в расходы
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'RUB';
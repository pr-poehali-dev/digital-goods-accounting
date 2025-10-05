-- Создание таблицы типов расходов
CREATE TABLE IF NOT EXISTS expense_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы расходных транзакций
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_type_id INTEGER REFERENCES expense_types(id),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    distribution_type VARCHAR(50) DEFAULT 'one_time',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_expenses_dates ON expenses(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type_id);
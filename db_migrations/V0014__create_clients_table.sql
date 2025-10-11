CREATE TABLE IF NOT EXISTS t_p6388661_digital_goods_accoun.clients (
  id SERIAL PRIMARY KEY,
  client_telegram VARCHAR(255) UNIQUE NOT NULL,
  client_name VARCHAR(255),
  importance VARCHAR(20) DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p6388661_digital_goods_accoun.client_connections (
  id SERIAL PRIMARY KEY,
  client_id_from INTEGER NOT NULL,
  client_id_to INTEGER NOT NULL,
  connection_type VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id_from, client_id_to)
);

CREATE INDEX IF NOT EXISTS idx_clients_telegram ON t_p6388661_digital_goods_accoun.clients(client_telegram);
CREATE INDEX IF NOT EXISTS idx_client_connections_from ON t_p6388661_digital_goods_accoun.client_connections(client_id_from);
CREATE INDEX IF NOT EXISTS idx_client_connections_to ON t_p6388661_digital_goods_accoun.client_connections(client_id_to);
-- Reset admin password to: admin123
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5HelLhVkFZdVS'
WHERE email = 'ourcryptoway@gmail.com';
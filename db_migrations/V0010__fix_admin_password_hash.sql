-- Fix admin password hash for 'admin123'
UPDATE users 
SET password_hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'ourcryptoway@gmail.com';
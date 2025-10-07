-- Update main admin password to 'admin123'
UPDATE users 
SET password_hash = '$2b$12$KIXwFqKvGzk6kz9F.VqPT.HGYqH8QHZz5vYw8EqO5kY0jW8K8NU/e'
WHERE email = 'ourcryptoway@gmail.com';
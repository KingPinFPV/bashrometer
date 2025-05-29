-- Production admin user creation
DELETE FROM users WHERE email = 'admin@basarometer.org';

INSERT INTO users (email, password, role, created_at) VALUES
('admin@basarometer.org', '$2b$10$mFwQzH9x4rGJmK5nP3eT0OqW5y8pR9tL3v6nM2qE4u7oZ1wS8aB5c', 'admin', NOW());

SELECT 'Production admin created successfully!' as message;
SELECT id, email, role, created_at FROM users WHERE email = 'admin@basarometer.org';
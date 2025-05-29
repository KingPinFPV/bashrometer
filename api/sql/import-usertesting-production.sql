-- Clear any existing test users
DELETE FROM users WHERE email LIKE '%@test.com';

-- Insert test users adapted to our schema
-- Regular users (password: 123123)
INSERT INTO users (email, password, role, created_at) VALUES
('test01@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW()),
('test02@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW()),
('test03@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW()),

-- Admin user (password: Aa123123)  
('admintest01@test.com', '$2b$10$mFwQzH9x4rGJmK5nP3eT0OqW5y8pR9tL3v6nM2qE4u7oZ1wS8aB5c', 'admin', NOW());

-- Verify the users were created
SELECT id, email, role, created_at FROM users WHERE email LIKE '%@test.com' ORDER BY role DESC, email;
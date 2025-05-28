-- import-usertesting.sql
-- קובץ SQL ליצירת משתמשי בדיקה לפיתוח ובדיקות

-- בדיקה שטבלת המשתמשים קיימת
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL
);

-- נקה משתמשי בדיקה קודמים (אם קיימים)
DELETE FROM users WHERE username IN (
    'test01', 'test02', 'test03', 'test04', 'test05', 'admintest01'
);

-- הכנס משתמשי בדיקה חדשים
-- הסיסמאות מוצפנות בבcrypt (10 rounds)
-- 123123 -> $2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a
-- Aa123123 -> $2b$10$mFwQzH9x4rGJmK5nP3eT0OqW5y8pR9tL3v6nM2qE4u7oZ1wS8aB5c

INSERT INTO users (username, email, password_hash, role, created_at, updated_at, is_active, email_verified) VALUES
-- משתמשים רגילים לבדיקות (סיסמה: 123123)
('test01', 'test01@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW(), NOW(), TRUE, TRUE),
('test02', 'test02@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW(), NOW(), TRUE, TRUE),
('test03', 'test03@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW(), NOW(), TRUE, TRUE),
('test04', 'test04@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW(), NOW(), TRUE, TRUE),
('test05', 'test05@test.com', '$2b$10$rOzAqX8G1JX3nI8/1pGFDO7UR5x/7z3zKL8QJ1/pGH5qL8w.R8i6a', 'user', NOW(), NOW(), TRUE, TRUE),

-- משתמש אדמין לבדיקות (סיסמה: Aa123123)
('admintest01', 'admintest01@test.com', '$2b$10$mFwQzH9x4rGJmK5nP3eT0OqW5y8pR9tL3v6nM2qE4u7oZ1wS8aB5c', 'admin', NOW(), NOW(), TRUE, TRUE);

-- בדיקה שהמשתמשים נוספו בהצלחה
SELECT 
    id,
    username,
    email,
    role,
    is_active,
    email_verified,
    created_at
FROM users 
WHERE username IN ('test01', 'test02', 'test03', 'test04', 'test05', 'admintest01')
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'user' THEN 2 
        ELSE 3 
    END,
    username;

-- הצג סיכום המשתמשים במערכת
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY role;

-- הצג סך הכל משתמשים
SELECT COUNT(*) as total_users FROM users;

-- הודעות מידע
SELECT 'משתמשי בדיקה נוצרו בהצלחה!' as message;

SELECT CONCAT(
    'נוצרו ', 
    (SELECT COUNT(*) FROM users WHERE username LIKE 'test%' OR username LIKE 'admintest%'),
    ' משתמשי בדיקה חדשים'
) as summary;

-- פרטי התחברות לבדיקות
SELECT 'פרטי התחברות לבדיקות:' as info;
SELECT 
    CONCAT('משתמש: ', username, ' | סיסמה: ', 
        CASE 
            WHEN role = 'admin' THEN 'Aa123123'
            ELSE '123123'
        END,
        ' | תפקיד: ', role
    ) as login_details
FROM users 
WHERE username IN ('test01', 'test02', 'test03', 'test04', 'test05', 'admintest01')
ORDER BY role DESC, username;

-- הודעת סיום
SELECT CONCAT(
    'הקובץ הושלם בהצלחה! ',
    'כעת ניתן להתחבר עם המשתמשים החדשים ',
    'ולבדוק את המערכת.'
) as completion_message;

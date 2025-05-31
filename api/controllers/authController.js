// controllers/authController.js
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ודא ש-JWT_SECRET נטען מקובץ .env
// ה-Fallback כאן הוא רק למקרה חירום בפיתוח מקומי אם הקובץ חסר,
// אבל בסביבת בדיקות ופרודקשן הוא חייב להיות מוגדר בקבצי ה-.env המתאימים.
const JWT_SECRET = process.env.JWT_SECRET || "unsafe_dev_secret_fallback_please_set_in_env";

// Email transporter configuration
const createEmailTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured - email features will not work');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Register new user
const register = async (req, res, next) => { // הוספת next
  const { name, email, password, role = 'user' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  // ודא שה-role תקין אם הוא נשלח, אחרת השתמש בברירת המחדל
  const validRoles = ['user', 'admin', 'editor']; // התאם לרשימת התפקידים שלך ב-schema.sql
  const finalRole = role && validRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'user';


  try {
    // Debug logging
    console.log('Registration attempt:', { 
      email: email?.toLowerCase(), 
      hasPassword: !!password, 
      passwordLength: password?.length,
      name: name || 'undefined',
      role: finalRole 
    });

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userExists.rows.length > 0) {
      // שים לב: הבדיקה שלך מצפה ל-409 כאן
      return res.status(409).json({ error: 'Email already registered.' }); 
    }

    const password_hash = await bcrypt.hash(password, 10); 
    console.log('Password hashed successfully, length:', password_hash.length);
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email.toLowerCase(), password_hash, finalRole] // שימוש ב-finalRole
    );
    const newUser = result.rows[0]; // שנה את שם המשתנה ל-newUser כדי למנוע בלבול עם user מהטוקן

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, email: newUser.email, name: newUser.name }, // הוסף עוד פרטים רלוונטיים לטוקן אם צריך
      JWT_SECRET,
      { expiresIn: '2h' } 
    );

    // אל תשלח את ה-token בתגובת הרישום אם אתה רוצה שהמשתמש יתחבר בנפרד.
    // אם אתה רוצה שהמשתמש יהיה מחובר מיד לאחר הרישום, אז השאר את הטוקן.
    // לצורך בדיקות, זה יכול להיות נוח להחזיר את הטוקן.
    res.status(201).json({ 
      message: 'User registered successfully.', // עם נקודה, כפי שהבדיקות מצפות עכשיו
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, created_at: newUser.created_at }, 
      token // החזרת הטוקן יכולה להיות שימושית אם אתה רוצה שהמשתמש יהיה מחובר מיד
    });

  } catch (err) {
    console.error('Error in register controller:', err.message); // הסר את err.stack מכאן, הוא יודפס מה-Global Error Handler
    next(err); // העבר ל-Global Error Handler
  }
};

// Login
const login = async (req, res, next) => { // הוספת next
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      // הבדיקה שלך מצפה ל-400 או 401, עם הודעת "Invalid credentials."
      return res.status(401).json({ error: 'Invalid credentials.' }); 
    }
    const userFromDb = result.rows[0]; // שנה שם משתנה כדי למנוע בלבול

    const passwordMatch = await bcrypt.compare(password, userFromDb.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: userFromDb.id, role: userFromDb.role, email: userFromDb.email, name: userFromDb.name }, // הוסף עוד פרטים רלוונטיים לטוקן אם צריך
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // הכן אובייקט משתמש לשליחה, ללא הסיסמה המוצפנת
    const userToReturn = {
        id: userFromDb.id,
        name: userFromDb.name,
        email: userFromDb.email,
        role: userFromDb.role
        // הוסף created_at אם הוא קיים ב-userFromDb והוא רלוונטי כאן
    };
    
    res.json({ 
      message: 'Login successful.', // עם נקודה, כפי שהבדיקות מצפות עכשיו
      user: userToReturn, 
      token 
    });

  } catch (err) {
    console.error('Error in login controller:', err.message);
    next(err);
  }
};

// Get current user info (protected)
const me = async (req, res, next) => { // הוספת next
  // req.user מגיע מ-authenticateToken middleware
  if (!req.user || req.user.userId === undefined) { // שנה לבדיקת userId כפי שמוגדר בטוקן
    console.error("User ID not found in token for /me endpoint");
    return res.status(401).json({ error: "Unauthorized: User ID missing or invalid token." });
  }
  const loggedInUserId = req.user.userId; 

  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [loggedInUserId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in me controller:', err.message);
    next(err);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.userId;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All password fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  // Password complexity check
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumbers = /\d/.test(newPassword);
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return res.status(400).json({ 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' 
    });
  }

  try {
    // Get current user and verify current password
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Check if new password is different from current
    const samePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (samePassword) {
      return res.status(400).json({ error: 'New password must be different from current password.' });
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.json({ message: 'Password changed successfully.' });

  } catch (err) {
    console.error('Error in changePassword controller:', err.message);
    next(err);
  }
};

// Forgot password
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase()]);
    
    // Always return success message for security (don't reveal if email exists)
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If an account with this email exists, we have sent password reset instructions.' });
    }

    const user = userResult.rows[0];

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // Try to send email
    const transporter = createEmailTransporter();
    if (transporter) {
      const resetUrl = `${process.env.RESET_PASSWORD_URL || 'http://localhost:3001/reset-password'}?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'איפוס סיסמה - בשרומטר',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>בקשה לאיפוס סיסמה</h2>
            <p>שלום ${user.name || user.email},</p>
            <p>קיבלנו בקשה לאיפוס הסיסמה שלך באתר בשרומטר.</p>
            <p>לחץ על הקישור הבא כדי לאפס את הסיסמה שלך:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              איפוס סיסמה
            </a>
            <p>הקישור יפוג תוך שעה אחת.</p>
            <p>אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו.</p>
            <hr style="margin: 24px 0;">
            <p style="color: #666; font-size: 12px;">בשרומטר - השוואת מחירי בשר</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } else {
      console.error('SMTP not configured - cannot send password reset email');
    }

    res.json({ message: 'If an account with this email exists, we have sent password reset instructions.' });

  } catch (err) {
    console.error('Error in forgotPassword controller:', err.message);
    next(err);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  // Password complexity check
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumbers = /\d/.test(newPassword);
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return res.status(400).json({ 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' 
    });
  }

  try {
    // Find valid token
    const tokenResult = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const userId = tokenResult.rows[0].user_id;

    // Hash new password and update user
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    // Mark token as used
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);

    res.json({ message: 'Password reset successfully.' });

  } catch (err) {
    console.error('Error in resetPassword controller:', err.message);
    next(err);
  }
};

// Update profile
const updateProfile = async (req, res, next) => {
  const { name, email } = req.body;
  const userId = req.user.userId;

  // Validation
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    // Check if email is already taken by another user
    const emailResult = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), userId]);
    if (emailResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email already taken by another account.' });
    }

    // Update user profile
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role, created_at',
      [name || null, email.toLowerCase(), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updatedUser = result.rows[0];
    res.json({ 
      message: 'Profile updated successfully.',
      user: updatedUser
    });

  } catch (err) {
    console.error('Error in updateProfile controller:', err.message);
    next(err);
  }
};

// ודא שאתה מייצא את הפונקציות לאחר שהוגדרו כמשתנים
module.exports = {
    register,
    login,
    me,
    changePassword,
    forgotPassword,
    resetPassword,
    updateProfile
};
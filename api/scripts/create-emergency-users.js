// scripts/create-emergency-users.js
// Create emergency test users for development and testing

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const emergencyUsers = [
  // Regular test users
  {
    name: 'Test User 01',
    email: 'test01@test.com',
    password: '123123',
    role: 'user'
  },
  {
    name: 'Test User 02',
    email: 'test02@test.com',
    password: '123123',
    role: 'user'
  },
  {
    name: 'Test User 03',
    email: 'test03@test.com',
    password: '123123',
    role: 'user'
  },
  {
    name: 'Test User 04',
    email: 'test04@test.com',
    password: '123123',
    role: 'user'
  },
  {
    name: 'Test User 05',
    email: 'test05@test.com',
    password: '123123',
    role: 'user'
  },
  // Admin test user
  {
    name: 'Admin Test User',
    email: 'admintest01@test.com',
    password: 'Aa123123',
    role: 'admin'
  }
];

async function createEmergencyUsers() {
  let client;
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Test database connection
    const testConnection = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    client = await pool.connect();
    
    console.log('🔄 Creating emergency users...\n');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const user of emergencyUsers) {
      try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        // Check if user already exists
        const existingUsers = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email]
        );
        
        if (existingUsers.rows.length > 0) {
          console.log(`⚠️  User ${user.email} already exists - skipping`);
          skippedCount++;
          continue;
        }
        
        // Insert new user
        const result = await client.query(`
          INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id
        `, [user.name, user.email, hashedPassword, user.role]);
        
        console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
        createdCount++;
        
      } catch (userError) {
        console.error(`❌ Error creating user ${user.email}:`, userError.message);
      }
    }
    
    // Verify users were created
    const totalUsers = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n📊 Total users in database: ${totalUsers.rows[0].count}`);
    console.log(`📊 Users created this run: ${createdCount}`);
    console.log(`📊 Users skipped (already exist): ${skippedCount}`);
    
    // Show all users
    const allUsers = await client.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('\n👥 All users in database:');
    console.log('┌────┬─────────────────────┬─────────────────────────┬───────┬─────────────────────┐');
    console.log('│ ID │ Name                │ Email                   │ Role  │ Created             │');
    console.log('├────┼─────────────────────┼─────────────────────────┼───────┼─────────────────────┤');
    
    allUsers.rows.forEach(user => {
      const id = user.id.toString().padEnd(2);
      const name = (user.name || '').substring(0, 19).padEnd(19);
      const email = user.email.substring(0, 23).padEnd(23);
      const role = user.role.padEnd(5);
      const created = user.created_at.toISOString().substring(0, 19);
      console.log(`│ ${id} │ ${name} │ ${email} │ ${role} │ ${created} │`);
    });
    
    console.log('└────┴─────────────────────┴─────────────────────────┴───────┴─────────────────────┘');
    
    console.log('\n🎉 Emergency users creation completed!');
    
    if (createdCount > 0) {
      console.log('\n📋 Login credentials for newly created users:');
      console.log('─'.repeat(50));
      emergencyUsers.forEach(user => {
        console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
      });
      console.log('─'.repeat(50));
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
      console.log('🔌 Database connection closed');
    }
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createEmergencyUsers()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createEmergencyUsers };
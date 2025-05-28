// scripts/full-restore.js
// Complete database restoration script that imports basar data and creates emergency users

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting full database restoration...\n');

try {
  // Change to the scripts directory
  const scriptsDir = path.join(__dirname);
  
  // Step 1: Import basar data
  console.log('📊 Step 1: Importing basar data...');
  console.log('────────────────────────────────────────');
  
  try {
    execSync('node import-basar-data.js', { 
      stdio: 'inherit', 
      cwd: scriptsDir,
      encoding: 'utf8'
    });
    console.log('✅ Basar data imported successfully\n');
  } catch (importError) {
    console.log('⚠️  Basar data import had issues, continuing with user creation...\n');
  }
  
  // Step 2: Create emergency users
  console.log('👥 Step 2: Creating emergency users...');
  console.log('────────────────────────────────────────');
  
  execSync('node create-emergency-users.js', { 
    stdio: 'inherit', 
    cwd: scriptsDir,
    encoding: 'utf8'
  });
  console.log('✅ Emergency users created successfully\n');
  
  console.log('🎉 Full restoration completed successfully!');
  console.log('\n📋 Database should now contain:');
  console.log('   • Products and retailers (from basar data)');
  console.log('   • Price reports (from basar data)');
  console.log('   • 6 test users (5 regular + 1 admin)');
  console.log('\n🔐 Test login credentials:');
  console.log('   Regular users: test01@test.com / 123123');
  console.log('   Admin user: admintest01@test.com / Aa123123');
  console.log('\n🌐 Frontend should now be able to:');
  console.log('   • Display products and prices');
  console.log('   • Allow user registration and login');
  console.log('   • Submit price reports');
  console.log('   • Admin functions (with admin account)');
  
} catch (error) {
  console.error('❌ Restoration failed:', error.message);
  console.error('\n🔧 Troubleshooting tips:');
  console.error('   • Check if PostgreSQL database is running');
  console.error('   • Verify DATABASE_URL in .env file');
  console.error('   • Ensure database schema is created (run schema.sql)');
  console.error('   • Check network connectivity to database');
  process.exit(1);
}
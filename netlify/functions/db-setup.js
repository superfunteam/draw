// Database setup and schema verification function
const { neon } = require('@neondatabase/serverless');

async function getDbClient() {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('NETLIFY_DATABASE_URL environment variable not set');
    return null;
  }
  return neon(databaseUrl);
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sql = await getDbClient();
    if (!sql) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database client not available' })
      };
    }

    console.log('Testing database connection...');

    // Check if users table exists
    const tableCheck = await sql(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    const tableExists = tableCheck[0].exists;
    console.log('Users table exists:', tableExists);

    let schemaResult = null;
    if (!tableExists) {
      console.log('Creating users table...');
      
      // Create the users table from our schema
      await sql(`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          tokens INTEGER NOT NULL DEFAULT 0,
          auth_code TEXT UNIQUE,
          auth_code_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await sql(`
        CREATE INDEX IF NOT EXISTS idx_auth_code ON users(auth_code) WHERE auth_code_used = FALSE
      `);

      await sql(`
        CREATE INDEX IF NOT EXISTS idx_email ON users(email)
      `);

      schemaResult = 'Schema created successfully';
    } else {
      schemaResult = 'Schema already exists';
    }

    // Get table info
    const tableInfo = await sql(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    // Get current user count
    const userCount = await sql('SELECT COUNT(*) as count FROM users');

    // Get sample users (if any)
    const sampleUsers = await sql('SELECT email, tokens, auth_code_used, created_at FROM users ORDER BY created_at DESC LIMIT 5');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        database_connected: true,
        table_exists: tableExists,
        schema_result: schemaResult,
        table_structure: tableInfo,
        user_count: userCount[0].count,
        sample_users: sampleUsers,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Database setup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Database setup failed',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
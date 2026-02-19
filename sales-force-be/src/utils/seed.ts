import { Pool } from 'pg';
import { hashPassword } from './auth/password';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sales_force_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

/**
 * Seed users with roles
 */
const seedUsers = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting seed...');

    // Get role IDs
    const rolesResult = await client.query('SELECT id, name FROM roles WHERE name IN ($1, $2, $3)', [
      'Admin',
      'Supervisor',
      'Sales',
    ]);

    const roles = Object.fromEntries(rolesResult.rows.map((row) => [row.name, row.id]));

    if (!roles.Admin || !roles.Supervisor || !roles.Sales) {
      throw new Error('Required roles not found. Please run migrations first.');
    }

    // Hash passwords
    const adminPasswordHash = await hashPassword('Admin123');
    const supervisorPasswordHash = await hashPassword('Supervisor123');
    const salesPasswordHash = await hashPassword('Sales123');

    // Insert users
    const users = [
      {
        full_name: 'Admin User',
        email: 'admin@example.com',
        phone: '6281234567800',
        password_hash: adminPasswordHash,
        role_id: roles.Admin,
      },
      {
        full_name: 'Supervisor User',
        email: 'supervisor@example.com',
        phone: '6281234567801',
        password_hash: supervisorPasswordHash,
        role_id: roles.Supervisor,
      },
      {
        full_name: 'Sales User',
        email: 'sales@example.com',
        phone: '6281234567802',
        password_hash: salesPasswordHash,
        role_id: roles.Sales,
      },
    ];

    for (const user of users) {
      await client.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone = EXCLUDED.phone,
           password_hash = EXCLUDED.password_hash,
           role_id = EXCLUDED.role_id,
           updated_at = NOW()`,
        [user.full_name, user.email, user.phone, user.password_hash, user.role_id, true]
      );
      console.log(`✅ User created: ${user.email}`);
    }

    console.log('🎉 Seed completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Admin:      admin@example.com / Admin123');
    console.log('   Supervisor: supervisor@example.com / Supervisor123');
    console.log('   Sales:      sales@example.com / Sales123');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run seed if called directly
if (require.main === module) {
  seedUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedUsers };

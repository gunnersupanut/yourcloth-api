import { Pool } from 'pg'; // ตัวเชื่อมต่อ Postgres 
import dotenv from 'dotenv';

dotenv.config(); // โหลด .env

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// จะใช้ 'pool' ในการยิง Query ทั้งโปรเจกต์!
export default pool;
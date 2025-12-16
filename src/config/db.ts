import { Pool } from 'pg'; // ตัวเชื่อมต่อ Postgres 
import dotenv from 'dotenv';
const isProduction = process.env.NODE_ENV === 'production';
dotenv.config(); // โหลด .env

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false } // สำหรับเชื่อมต่อกับ NeonDB
});

// จะใช้ 'pool' ในการยิง Query ทั้งโปรเจกต์!
export default pool;
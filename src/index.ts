import express from 'express';
import type { Request, Response } from 'express'; // Type
import dotenv from "dotenv";
import cors from 'cors';
import pool from './config/db';
// โหลดตัวแปรจาก .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const nodeEnv = process.env.NODE_ENV

// --Cors
app.use(cors());
app.use(express.json());
// ---Router
// Auth 
import authRouter from './routes/auth';
app.use("/api/v1/auth", authRouter)

// User
import usersRouter from './routes/users'
app.use("/api/v1/users", usersRouter)

// Product
import productsRouter from './routes/products'
app.use("/api/v1/products", productsRouter)

// Cart
import cartsRouter from './routes/cart'
app.use("/api/v1/carts", cartsRouter)

// สั่งให้ Server มันเริ่มฟัง
app.listen(port, () => {
  console.log(`[Server] 🚀Server is running...`);
  console.log(`env: ${nodeEnv}`);
  console.log(`port: ${port}`);
  if (nodeEnv === 'production') {
    // ถ้าอยู่บน Cloud (Render)
    console.log(`🔗 URL: https://yourcloth-api.onrender.com`);
  } else {
    // ถ้าอยู่บนเครื่องเรา (Localhost)
    console.log(`🔗 URL: http://localhost:${port}`);
  }
  console.log(`=================================`);
});

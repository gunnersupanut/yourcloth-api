import express from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import morgan from 'morgan';
import http from "http";
import { initSocket } from "./utils/socket";
// โหลดตัวแปรจาก .env
dotenv.config();

const app = express();
// สร้าง HTTP Server ครอบ Express อีกที
const server = http.createServer(app);
// สร้าง Socket IO Server
const io = initSocket(server);
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
// เชื่อใจ Proxy ตัวแรกสุดที่ส่งมา ( Render Load Balancer)
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;
const nodeEnv = process.env.NODE_ENV

// --Cors
app.use(cors());
app.use(express.json());
// Morgan 
app.use(morgan('dev'));
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

// Address
import addressRouter from './routes/address'
app.use("/api/v1/addresses", addressRouter)
// Order
import orderRouter from './routes/order'
import { errorHandler } from './middleware/errorHandler';
app.use("/api/v1/orders", orderRouter)

// **--Admin--**
import adminAuthRouter from './routes/adminAuthRouter'
app.use("/api/v1/admin/auth", adminAuthRouter)
// Order
import adminOrderRouter from './routes/adminOrderRouter'
app.use("/api/v1/admin/orders", adminOrderRouter)
// Global Hanler Error
app.use(errorHandler);
// สั่งให้ Server มันเริ่มฟัง
server.listen(port, () => {
  console.log(`[Server] Server is running...`);
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

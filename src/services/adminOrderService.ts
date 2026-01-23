import pool from '../config/db';
import { adminOrderRepository } from '../repositories/adminOrderRepository'
import { orderRepository } from '../repositories/orderRepository';
import { CreateRejectionPayLoad } from '../type/adminOrderTypes';
import { AppError } from '../utils/AppError';
export const adminOrderService = {
    getInspectingOrders: async () => {
        // 1. ดึงข้อมูลดิบ
        const rawOrders = await adminOrderRepository.getInspectingOrdersWithSlips();

        if (!rawOrders) return [];

        // 2. 🔥 ใช้ท่าไม้ตาย Reduce จัดกลุ่ม (Grouping)
        const groupedOrders = rawOrders.reduce((acc: any[], row: any) => {
            // หาว่ามี order_id นี้ในตะกร้าหรือยัง?
            let order = acc.find(o => o.orderId === row.order_id);

            if (!order) {
                // ถ้ายังไม่มี ให้สร้าง "กล่อง" Order ใหม่รอไว้
                order = {
                    orderId: row.order_id,
                    userId: row.user_id,
                    status: row.status,
                    orderedAt: row.ordered_at,

                    // คำนวณเงินเริ่มต้น (เอาราคาค่าส่งมาตั้งต้นก่อน หรือจะเริ่ม 0 ก็ได้)
                    totalPrice: 0,
                    shippingCost: Number(row.shipping_cost || 0),

                    //  (สลิป)
                    slip: {
                        url: row.image_url,
                        path: row.file_path
                    },

                    // ข้อมูลลูกค้า
                    customer: {
                        name: row.receiver_name,
                        phone: row.receiver_phone,
                        address: row.address
                    },

                    items: [] // เตรียมถาดใส่สินค้า
                };

                // บวกค่าส่งเข้าไปในยอดรวมก่อนเลย (ถ้า Logic ร้านนายรวมค่าส่งนะ)
                order.totalPrice += order.shippingCost;

                acc.push(order);
            }

            // --- คำนวณราคาสินค้าชิ้นนี้ ---
            const price = Number(row.price_snapshot || 0);
            const quantity = row.quantity || 1;
            const lineTotal = price * quantity;

            // บวกทบเข้าไปในยอดรวมบิล Grand Total
            order.totalPrice += lineTotal;

            // ยัดสินค้าลงใน items ของ Order นั้นๆ
            order.items.push({
                name: row.product_name_snapshot,
                itemId: row.id,
                variantId: row.product_variants_id,
                price: price,
                quantity: quantity,
                lineTotal: lineTotal
            });

            return acc;
        }, []);

        return groupedOrders;
    },
    moveOrderToPacking: async (orderId: number, adminName: string) => {
        const client = await pool.connect();
        try {
            // เปิด Transaction
            await client.query('BEGIN');
            // ดึงข้อมูล Order ปัจจุบัน (จาก Inspecting)
            const orderDetail = await orderRepository.findOrderById(orderId, client);
            if (!orderDetail || orderDetail.length === 0) {
                throw new AppError(`Order not found in Inspecting status`, 404);
            }
            if (orderDetail[0].status !== 'INSPECTING') {
                throw new AppError('Order is not in inspecting status', 400);
            }
            // ---จัดรูป order ใหม่
            const header = orderDetail[0];

            // จัดรูป address
            const addressPayload = {
                recipient_name: header.receiver_name,
                phone: header.receiver_phone,
                address: header.address
            };
            // จัดรูป items
            const readyItems = orderDetail.map(row => ({
                product_name: row.product_name_snapshot,
                variant_id: row.product_variants_id,
                quantity: row.quantity,
                price_snapshot: row.price_snapshot
            }));
            // ---Bulk Insert ลง order_packing
            await orderRepository.createOrderGenericBulk(
                'order_packing',   // Parameter 1: ชื่อตาราง
                header.order_id,      // Parameter 2: ID
                header.user_id,            // Parameter 3: User
                addressPayload,   // Parameter 4: Address Data
                header.payment_method,     // Parameter 5: จ่ายไง 
                header.shipping_method,    // Parameter 6: ส่งไง 
                header.shipping_cost,      // Parameter 7: ค่าส่ง
                readyItems,        // Parameter 8: Items
                header.ordered_at,   // Parameter 9: OrderAt
                client             // Parameter 10: Client
            );
            // สร้าง Log
            // สร้าง order logs
            await orderRepository.createOrderLog(
                orderId,              // เลข Order ID
                'ORDER_APPROVE',           // Action Type
                `ADMIN ${adminName}`, // Actor (เอาชื่อคนรับ หรือ username จาก token ก็ได้)
                `Admin ${adminName} confirm payment waiting for packing order.`, // Description
                client                     // ส่ง client ตัวเดิมไป (ให้มัน Commit พร้อมกัน)
            );
            // ลบ order ออกจาก order_inspecting
            await orderRepository.deleteOrderGeneric(
                "order_inspecting",
                orderId,
                header.user_id,
                client
            )
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    rejectPaymentToPending: async (orderId: number, adminName: string, reason: string) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // ดึงข้อมูล Order ปัจจุบัน (จาก Inspecting)
            const orderDetail = await orderRepository.findOrderById(orderId, client);
            if (!orderDetail || orderDetail.length === 0) {
                throw new AppError(`Order not found in Inspecting status`, 404);
            }
            if (orderDetail[0].status !== 'INSPECTING') {
                throw new AppError('Order is not in inspecting status', 400);
            }
            // ---จัดรูปข้อมูล
            const header = orderDetail[0];
            // จัดรูปลงตาราง order_rejections
            const rejectionPayload: CreateRejectionPayLoad = {
                orderId,
                userId: header.user_id,
                reason,
                adminName
            }
            // ---บันทึกเหตุผลลงตาราง order_rejections
            await adminOrderRepository.createRejection(rejectionPayload, client)
            // ---เตรียมย้ายกลับ Pending
            // จัดรูป address
            const addressPayload = {
                recipient_name: header.receiver_name,
                phone: header.receiver_phone,
                address: header.address
            };
            // จัดรูป items
            const readyItems = orderDetail.map(row => ({
                product_name: row.product_name_snapshot,
                variant_id: row.product_variants_id,
                quantity: row.quantity,
                price_snapshot: row.price_snapshot
            }));
            // Bulk Insert ลง order_pending
            await orderRepository.createOrderGenericBulk(
                'order_pending',   // Parameter 1: ชื่อตาราง
                header.order_id,      // Parameter 2: ID
                header.user_id,            // Parameter 3: User
                addressPayload,   // Parameter 4: Address Data
                header.payment_method,     // Parameter 5: จ่ายไง 
                header.shipping_method,    // Parameter 6: ส่งไง 
                header.shipping_cost,      // Parameter 7: ค่าส่ง
                readyItems,        // Parameter 8: Items
                header.ordered_at,   // Parameter 9: OrderAt
                client             // Parameter 10: Client
            );
            // ---สร้าง Log
            await orderRepository.createOrderLog(
                orderId,
                'ORDER_REJECTED',
                `ADMIN ${adminName}`,
                `Payment rejected. Reason: ${reason}`,
                client
            );
            // ---ลบออกจาก Inspecting
            await orderRepository.deleteOrderGeneric(
                "order_inspecting",
                orderId,
                header.user_id,
                client
            );
            // commit
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
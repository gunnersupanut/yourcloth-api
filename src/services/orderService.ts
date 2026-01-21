import pool from '../config/db';
import { orderRepository } from '../repositories/orderRepository';
import { addressRepository } from '../repositories/addressRepository';
import { CreateOrderPayload, ImageObj, OrderHistoryEntry } from '../type/orderTypes';
import { AppError } from '../utils/AppError';
import { productRepository } from '../repositories/productRepository';
import { cartService } from './cartService';

export const orderService = {
    getOrderDetails: async (orderId: number) => {
        // ไปหาจากทุกตาราง
        const rows = await orderRepository.findOrderById(orderId);

        // า Array ว่างแปลว่าหาไม่เจอสักตาราง
        if (!rows || rows.length === 0) {
            throw new AppError("Order not found", 404);
        }

        // ประกอบร่าง (Data Transformation)
        // ข้อมูล Header (ชื่อ, ที่อยู่, สถานะ) เอามาจากแถวแรกก็พอ (เพราะมันเหมือนกันทุกแถว)
        const firstRow = rows[0];
        // คำนวณราคารวมทั้งบิล (Sum net_total ของทุกแถว)
        const grandTotal = rows.reduce((sum, row) => sum + Number(row.net_total), 0);

        const orderData = {
            orderId: firstRow.order_id,
            status: firstRow.status,
            orderedAt: firstRow.ordered_at,
            shippingCost: firstRow.shipping_cost,
            // สรุปยอดเงิน
            totalAmount: grandTotal,
            itemCount: rows.length,
            // ข้อมูลผู้รับ
            receiver: {
                name: firstRow.receiver_name,
                phone: firstRow.receiver_phone,
                address: firstRow.address
            },

            // รายการสินค้า (Loop เอาเฉพาะข้อมูลสินค้าออกมา)
            items: rows.map((row: any) => ({
                name: row.product_name_snapshot,
                description: row.description,
                price: Number(row.price_snapshot),
                quantity: row.quantity,
                lineTotal: Number(row.net_total),
                image: row.image_url
            }))


        };

        return orderData;
    },
    getAllOrders: async (userId: number): Promise<OrderHistoryEntry[]> => {
        // ดึงข้อมูลดิบ
        const rawRows = await orderRepository.findAllOrdersByUserId(userId);
        //  จัดกลุ่มตาม order_id 
        const groupedOrders = rawRows.reduce((acc: any[], row: any) => {
            // หาว่ามี order_id นี้ในตะกร้าหรือยัง
            let order = acc.find(o => o.orderId === row.order_id);

            if (!order) {
                // ถ้ายังไม่มี ให้สร้างก้อน Order ใหม่
                order = {
                    orderId: row.order_id,
                    status: row.status,
                    orderedAt: row.ordered_at,
                    totalAmount: 0,
                    shippingCost: row.shipping_cost,
                    receiver: {
                        name: row.receiver_name,
                        phone: row.receiver_phone,
                        address: row.address
                    },
                    items: [] // เตรียมถาดใส่สินค้า
                };
                acc.push(order);
            }
            // คำนวณราคารายการนี้
            const lineTotal = Number(row.price_snapshot) * row.quantity;

            // บวกทบเข้าไปในยอดรวมบิล
            order.totalAmount += lineTotal;
            // ยัดสินค้าลงใน items ของ Order นั้นๆ
            order.items.push({
                name: row.product_name_snapshot,
                description: row.description,
                quantity: row.quantity,
                price: Number(row.price_snapshot),
                lineTotal: Number(row.net_total),
                image: row.image_url,

            });

            return acc;
        }, []);

        return groupedOrders;
    },
    createOrder: async (userId: number, userName: string, data: CreateOrderPayload) => {
        const { addressId, items, paymentMethod, shippingMethod, shippingCost, cartItemIds } = data;
        const client = await pool.connect();

        try {
            // ---ดึง Address Snapshot (ต้องเป็นของ User คนนี้เท่านั้น)
            const addressList = await addressRepository.findAddressByUserId(userId);
            const selectedAddress = addressList.find((addr: any) => addr.id === Number(addressId));
            if (!selectedAddress) {
                throw new AppError("Address not found or unauthorized.", 404);
            }
            // ---จัดรูป address data
            // สร้างตัวแปรใหม่! รวมร่างที่อยู่ให้เป็นก้อนเดียว
            const fullAddressString = `${selectedAddress.address_detail} ${selectedAddress.sub_district} ${selectedAddress.district} ${selectedAddress.province} ${selectedAddress.zip_code}`;
            const addressPayload = {
                recipient_name: selectedAddress.recipient_name, // ชื่อตัวแปรใน DB
                phone: selectedAddress.phone_number,           // ชื่อตัวแปรใน DB
                address: fullAddressString                     // 👈 นี่ไง! พระเอกของเรา
            };
            // ---ดึงข้อมูลสินค้า (Variant) + เช็ค Stock
            const variantIds = items.map(item => item.variantId);
            // ---ดึงราคาและชื่อสินค้า ณ ปัจจุบันจาก DB (ห้ามเชื่อ Client)
            const variantsInDb = await orderRepository.getProductVariantDetails(variantIds);

            // ---เตรียมข้อมูลสินค้า + เช็คของหมด
            const readyItems = [];
            let grandTotal = 0;

            for (const item of items) {
                const variant = variantsInDb.find((v: any) => v.id === item.variantId);
                // เช็คว่ามีของไหม
                if (!variant) throw new AppError(`Variant ID ${item.variantId} not found.`, 404);
                if (variant.stock_quantity < item.quantity) {
                    throw new AppError(`Out of stock: ${variant.base_name}`, 400);
                }
                // สร้างชื่อเต็มๆ
                const sizeText = variant.size_name ? `Size: ${variant.size_name}` : '';
                const colorText = variant.color_name ? `Color: ${variant.color_name}` : '';
                // filter ตัด null ออกไป
                const variantInfo = [sizeText, colorText].filter(Boolean).join(' | ');
                const fullProductName = variantInfo
                    ? `${variant.base_name} (${variantInfo})`
                    : variant.base_name;
                // เตรียม Object ให้ตรงกับที่ Repo ต้องการ
                readyItems.push({
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    price_snapshot: variant.price,
                    product_name: fullProductName
                });
                // คำนวณราคารวมทั้งหมด (เอาไว้ Return บอก User)
                grandTotal += (Number(variant.price) * item.quantity);
            }

            // Gen Order Group ID (เลขที่ใบสั่งซื้อ)
            // ใช้ Unix Timestamp (วินาที) + Random 3 หลัก เพื่อไม่ให้เกิน limit
            const orderGroupId = await orderRepository.getNextOrderGroupId(client);

            // เปิด Transaction
            await client.query('BEGIN');

            // Bulk Insert ลง order_pending
            await orderRepository.createOrderGenericBulk(
                'order_pending',   // Parameter 1: ชื่อตาราง
                orderGroupId,      // Parameter 2: ID
                userId,            // Parameter 3: User
                addressPayload,   // Parameter 4: Address Data
                paymentMethod,     // Parameter 5: จ่ายไง 
                shippingMethod,    // Parameter 6: ส่งไง 
                shippingCost,      // Parameter 7: ค่าส่ง
                readyItems,        // Parameter 8: Items
                client             // Parameter 9: Client
            );

            // ตัด Stock ตรงนี
            await productRepository.decreaseStock(readyItems, client);
            // ลบตะกร้าถ้ามาจากตระกร้า
            if (cartItemIds) await cartService.deleteSelectedCarts(cartItemIds, userId);
            await orderRepository.createOrderLog(
                orderGroupId,              // เลข Order ID
                'ORDER_CREATED',           // Action Type
                `USER ${userName}`, // Actor (เอาชื่อคนรับ หรือ username จาก token ก็ได้)
                `User created order via Checkout (Total: ${grandTotal} THB)`, // Description
                client                     // ส่ง client ตัวเดิมไป (ให้มัน Commit พร้อมกัน)
            );
            await client.query('COMMIT');

            return {
                orderId: orderGroupId,
                totalAmount: grandTotal,
                itemCount: readyItems.length,
                status: 'PENDING'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    moveToInspecting: async (orderId: number, userId: number, userName: string, imageObj: ImageObj) => {
        const client = await pool.connect();
        try {
            // เปิด Transaction
            await client.query('BEGIN');
            // ---ดึง order จาก order_pending
            const orderDetail = await orderRepository.findOrderById(orderId);
            if (!orderDetail || orderDetail.length === 0) throw new AppError(`Order not found`, 400);
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
                product_name: row.product_name,
                variant_id: row.product_variants_id,
                quantity: row.quantity,
                price_snapshot: row.price_snapshot
            }));
            // ราคารวม
            const grandTotal = orderDetail.reduce((sum, item) => {
                return sum + Number(item.net_total); // ใส่ Number() ดักไว้ ผื่อ DB ส่งมาเป็น String
            }, 0);
            // ---Bulk Insert ลง order_inspecting
            await orderRepository.createOrderGenericBulk(
                'order_inspecting',   // Parameter 1: ชื่อตาราง
                header.order_id,      // Parameter 2: ID
                header.user_id,            // Parameter 3: User
                addressPayload,   // Parameter 4: Address Data
                header.payment_method,     // Parameter 5: จ่ายไง 
                header.shipping_method,    // Parameter 6: ส่งไง 
                header.shipping_cost,      // Parameter 7: ค่าส่ง
                readyItems,        // Parameter 8: Items
                client             // Parameter 9: Client
            );
            // สร้าง order slips
            await orderRepository.createOrderSlips(orderId, imageObj, client)
            // สร้าง order logs
            await orderRepository.createOrderLog(
                orderId,              // เลข Order ID
                'ORDER_PAID',           // Action Type
                `USER ${userName}`, // Actor (เอาชื่อคนรับ หรือ username จาก token ก็ได้)
                `User Pay via (Total: ${grandTotal} THB)`, // Description
                client                     // ส่ง client ตัวเดิมไป (ให้มัน Commit พร้อมกัน)
            );
            // ลบ order ออกจาก order_pending
            await orderRepository.deleteOrderGeneric(
                "order_pending",
                orderId,
                userId,
                client
            )
            // เซฟทุกอย่างที่ทำ
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};
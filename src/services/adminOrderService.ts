import pool from '../config/db';
import { adminOrderRepository } from '../repositories/adminOrderRepository'
import { orderRepository } from '../repositories/orderRepository';
import { CreateParcelNumberPayLoad, CreateRejectionPayLoad, ShippingDetailPayload } from '../type/adminOrderTypes';
import { AppError } from '../utils/AppError';
import { deleteFileFromCloudinary } from '../utils/cloudinary';
export const adminOrderService = {
    getAdminOrders: async (query: any) => {
        // แตกตัวแปรออกมา พร้อมใส่ Default Value
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const status = query.status ? query.status.toUpperCase() : 'ALL';
        const search = query.search || '';
        const sortBy = query.sortBy
        const startDate = query.startDate
        const endDate = query.endDate
        // เรียก Repo ไปดึงข้อมูลดิบ (Raw Rows) มาก่อน
        // ตรงนี้จะได้ Array ยาวๆ ที่ Order ID ซ้ำกันได้
        const result = await adminOrderRepository.getAllOrdersAdmin(
            status,
            page,
            limit,
            search,
            sortBy,
            startDate,
            endDate);
        const rawOrders = result.orders;
        // Grouping Data 
        const groupedOrders = rawOrders.reduce((acc: any[], row: any) => {
            const rowOrderId = Number(row.order_id);
            // หาว่ามี order_id นี้ในตะกร้าหรือยัง?
            let order = acc.find(o => o.id === rowOrderId);

            if (!order) {
                // ถ้ายังไม่มี ให้สร้าง "กล่อง" Order ใหม่รอไว้
                order = {
                    id: rowOrderId, // key หลัก
                    userId: row.user_id,
                    status: row.status,
                    orderedAt: row.ordered_at,
                    paymentMethod: row.payment_method,
                    shippingMethod: row.shipping_method,

                    // คำนวณเงินเริ่มต้น (เอาค่าส่งมาตั้งต้น)
                    totalPrice: 0,
                    shippingCost: Number(row.shipping_cost || 0),

                    // ข้อมูลลูกค้า (ดึงจาก Snapshot ในตาราง order)
                    customer: {
                        name: row.receiver_name,
                        phone: row.receiver_phone,
                        address: row.address
                    },

                    // เตรียมถาดใส่สินค้า
                    items: []
                };

                // บวกค่าส่งเข้าไปในยอดรวมก่อนเลย
                order.totalPrice += order.shippingCost;

                acc.push(order);
            }

            // --- จัดการ Item (สินค้า) ในแถวนั้นๆ ---
            const price = Number(row.price_snapshot || 0);
            const quantity = row.quantity || 1;
            const lineTotal = price * quantity;

            // บวกทบเข้าไปในยอดรวมบิล Grand Total
            order.totalPrice += lineTotal;

            // ยัดสินค้าลงใน items
            // เช็คก่อนว่าแถวนั้นมีสินค้าจริงไหม (เผื่อเคส order ว่าง ซึ่งไม่น่ามี)
            if (row.product_variants_id) {
                order.items.push({
                    id: row.id, // id ของ row ใน database
                    variantId: row.product_variants_id,
                    productName: row.product_name_snapshot,
                    price: price,
                    quantity: quantity,
                    lineTotal: lineTotal,
                    // รูปภาพจาก View (ถ้าไม่มีรูป ใส่ภาพว่างๆ หรือ null)
                    image: row.image_url || null,
                    description: row.description || ''
                });
            }

            return acc;
        }, []);

        // ส่งกลับไป
        return {
            orders: groupedOrders, // ส่งตัวที่จัดกลุ่มแล้วไป
            currentPage: page,
            // คำนวณ page ใหม่คร่าวๆ จากจำนวน Order ที่จัดกลุ่มได้
            // หรือจะใช้ค่าเดิมจาก Repo ก็ได้
            totalPages: result.totalPages,
            hasMore: result.total > (page * limit)
        };
    },
    getOrderDetails: async (orderId: number) => {
        const rows = await orderRepository.findOrderById(orderId);
        if (!rows || rows.length === 0) {
            throw new AppError("Order not found", 404);
        }

        // จัดรูป
        const firstRow = rows[0];

        // คำนวณราคาสินค้ารวม (Sum net_total ของสินค้าทุกชิ้น)
        const itemsTotal = rows.reduce((sum: number, row: any) => sum + Number(row.net_total), 0);
        // รวมค่าส่งเข้าไปด้วย
        const grandTotal = itemsTotal + Number(firstRow.shipping_cost || 0);

        // --- เตรียมตัวแปรเสริม ---
        let rejectionReason = null;
        let parcelDetail = null;
        let problemDetail = null;
        let slip = null
        //  ดึงเหตุผลการปฏิเสธ 
        if (firstRow.status === 'PENDING') {
            const latestRejection = await orderRepository.findLatestRejectionByOrderId(orderId);
            if (latestRejection) {
                rejectionReason = latestRejection.reason;
            }
        }
        if (firstRow.status !== "PENDING") {
            const slipData = await orderRepository.findOrderSlips(orderId)
            if (slipData) slip = slipData.image_url
        }
        //  ดึงข้อมูลขนส่ง
        if (['SHIPPING', 'COMPLETE', 'CANCEL'].includes(firstRow.status)) {
            const parcelDetailData = await orderRepository.findParcelNumberByOrderId(orderId);
            if (parcelDetailData) {
                parcelDetail = parcelDetailData;
            }
        }

        // ดึงข้อมูลแจ้งปัญหา 
        if (firstRow.status === 'CANCEL') {
            const problemData = await orderRepository.findProblemByOrderId(orderId);
            if (problemData) {
                problemDetail = {
                    description: problemData.problem_text,
                    attachments: problemData.attachments, // รูป/วิดีโอ
                    reportedAt: problemData.created_at
                };
            }
        }

        // Return 
        const orderData = {
            orderId: firstRow.order_id,
            userId: firstRow.user_id, // Admin อาจจะต้องใช้ user_id เผื่อลิงก์ไปหน้า profile ลูกค้า
            status: firstRow.status,
            orderedAt: firstRow.ordered_at,

            // ข้อมูลการเงิน
            paymentMethod: firstRow.payment_method,
            shippingMethod: firstRow.shipping_method,
            shippingCost: Number(firstRow.shipping_cost || 0),
            totalAmount: grandTotal, // ยอดสุทธิ (ของ + ส่ง)
            itemCount: rows.length,

            // ข้อมูลเสริม
            rejectionReason,
            parcelDetail,
            problemDetail,
            slip,
            // ข้อมูลผู้รับ
            receiver: {
                name: firstRow.receiver_name,
                phone: firstRow.receiver_phone,
                address: firstRow.address
            },

            // รายการสินค้า
            items: rows.map((row: any) => ({
                id: row.id, // item id (เผื่อใช้)
                variantId: row.product_variants_id,
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
    getInspectingOrders: async () => {
        // ดึงข้อมูลดิบ
        const rawOrders = await adminOrderRepository.getInspectingOrdersWithSlips();

        if (!rawOrders) return [];

        // ใช้ Reduce จัดกลุ่ม (Grouping)
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
                throw new AppError(`Order not found in inspecting status`, 404);
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
                throw new AppError(`Order not found in inspecting status`, 404);
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
                `Payment rejected, Reason: ${reason}`,
                client
            );
            // ---ลบออกจาก Inspecting
            await orderRepository.deleteOrderGeneric(
                "order_inspecting",
                orderId,
                header.user_id,
                client
            );
            //  ---ลบรูป slips เก่า
            const deletedSlips = await orderRepository.deleteOrderSlips(orderId, client);
            // เช็คว่าลบเจอไหม? (ถ้า deletedSlips มีของ = เคยมีสลิป)
            if (deletedSlips && deletedSlips.length > 0) {
                const slip = deletedSlips[0]; // เอาตัวแรกมา
                // เอา file_path ไปลบรูปใน Cloud
                if (slip.file_path) {
                    deleteFileFromCloudinary(slip.file_path, 'image');
                }
            }
            // commit
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
    moveOrderToShipping: async (orderId: number, adminName: string, shipping: ShippingDetailPayload) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // ดึงข้อมูล Order ปัจจุบัน (จาก PACKING)
            const orderDetail = await orderRepository.findOrderById(orderId, client);
            // เช็คข้อมูล
            // ถ้าไม่เจอ
            if (!orderDetail || orderDetail.length === 0) {
                throw new AppError(`Order not found in packing status`, 404);
            }
            // ถ้าเจอแต่ผิดสถานะ
            if (orderDetail[0].status !== 'PACKING') {
                throw new AppError('Order is not in packing status', 400);
            }
            // ---จัดรูปข้อมูล
            const header = orderDetail[0];
            // จัดรูปลงตาราง parcel_numbers
            const pacelNumberPayload: CreateParcelNumberPayLoad = {
                orderId,
                userId: header.user_id,
                shippingCarrier: shipping.shippingCarrier,
                parcelNumber: shipping.parcelNumber
            }
            // บันทึกข้อมูลการจัดส่งลง parcel_numbers
            await adminOrderRepository.createParcelNumber(pacelNumberPayload, client)
            // ---เตรียมย้ายข้อมูลไป order_shipping
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
            // Bulk Insert ลง order_shipping
            await orderRepository.createOrderGenericBulk(
                'order_shipping',   // Parameter 1: ชื่อตาราง
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
                'ORDER_SHIPPING',
                `ADMIN ${adminName}`,
                `Order is shipping by ${shipping.shippingCarrier},Parcel Number is ${shipping.parcelNumber}.`,
                client
            );
            // ---ลบออกจาก order_packing
            await orderRepository.deleteOrderGeneric(
                "order_packing",
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
    }, moveToComplete: async (orderId: number, adminName: string) => {
        const client = await pool.connect();
        try {
            // เปิด Transaction
            await client.query('BEGIN');
            // ---ดึง order จาก order_shipping
            const orderDetail = await orderRepository.findOrderById(orderId);
            // เช็คข้อมูล
            // ถ้าไม่เจอ
            if (!orderDetail || orderDetail.length === 0) {
                throw new AppError(`Order not found in shipping status`, 404);
            }
            // ถ้าเจอแต่ผิดสถานะ
            if (orderDetail[0].status !== 'SHIPPING') {
                throw new AppError('Order is not in shipping status', 400);
            };
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
            // ราคารวม
            // const grandTotal = orderDetail.reduce((sum, item) => {
            //     return sum + Number(item.net_total); // ใส่ Number() ดักไว้ ผื่อ DB ส่งมาเป็น String
            // }, 0);
            // ---Bulk Insert ลง order_complete
            await orderRepository.createOrderGenericBulk(
                'order_complete',   // Parameter 1: ชื่อตาราง
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
            // สร้าง order logs
            await orderRepository.createOrderLog(
                orderId,              // เลข Order ID
                'ORDER_COMPLETE',           // Action Type
                `ADMIN ${adminName}`, // Actor (เอาชื่อคนรับ หรือ username จาก token ก็ได้)
                `Admin comfirm received order.`, // Description
                client                     // ส่ง client ตัวเดิมไป (ให้มัน Commit พร้อมกัน)
            );
            // ลบ order ออกจาก order_shipping
            await orderRepository.deleteOrderGeneric(
                "order_shipping",
                orderId,
                header.user_id,
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
    },
}
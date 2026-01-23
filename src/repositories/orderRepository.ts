import pool from '../config/db';
import { PoolClient } from 'pg';
import { AppError } from '../utils/AppError';
import { ImageObj } from '../type/orderTypes';

export const orderRepository = {
    // หา order
    findAllOrdersByUserId: async (userId: number) => {
        // เลือก Column ที่จำเป็น (เอามาโชว์หน้า List)
        // payment_method, shipping_method อย่าลืม select มาด้วยถ้าจะใช้
        const fields = `
            order_id, user_id, net_total, receiver_name, receiver_phone, address, product_variants_id,
            product_name_snapshot, quantity, price_snapshot,shipping_cost,
            ordered_at, payment_method, shipping_method
        `;

        // UNION ALL 
        // ใช้ UNION ALL เร็วกว่า UNION ธรรมดา ไม่ต้องเช็คซ้ำ
        const sql = `
        WITH all_orders AS (
            SELECT ${fields}, 'PENDING' as status FROM order_pending WHERE user_id = $1
            UNION ALL
            SELECT ${fields}, 'INSPECTING' as status FROM order_inspecting WHERE user_id = $1
            UNION ALL
            SELECT ${fields}, 'PACKING' as status FROM order_packing WHERE user_id = $1
            UNION ALL
            SELECT ${fields}, 'SHIPPING' as status FROM order_shipping WHERE user_id = $1
            UNION ALL
            SELECT ${fields}, 'COMPLETE' as status FROM order_complete WHERE user_id = $1
            UNION ALL
            SELECT ${fields}, 'CANCEL' as status FROM order_cancel WHERE user_id = $1
        )
        SELECT 
            ao.*,
            p.image_url,
            p.description
        FROM all_orders ao
        LEFT JOIN product_variants pv ON ao.product_variants_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
            ORDER BY ordered_at DESC;
        `;

        const result = await pool.query(sql, [userId]);
        return result.rows;
    },
    findOrderById: async (orderId: number, client?: PoolClient) => {
        // Select Column ที่จำเป็นออกมาให้หมด 
        const fields = `
            order_id, user_id, net_total, receiver_name, receiver_phone, address, product_variants_id, shipping_cost,
            product_name_snapshot, quantity, price_snapshot,payment_method, shipping_method, ordered_at
        `;

        const sql = `
        WITH all_orders AS (
            SELECT ${fields}, 'PENDING' as status FROM order_pending WHERE order_id = $1
            UNION ALL
            SELECT ${fields}, 'INSPECTING' as status FROM order_inspecting WHERE order_id = $1
            UNION ALL
            SELECT ${fields}, 'PACKING' as status FROM order_packing WHERE order_id = $1
            UNION ALL
            SELECT ${fields}, 'SHIPPING' as status FROM order_shipping WHERE order_id = $1
            UNION ALL
            SELECT ${fields}, 'COMPLETE' as status FROM order_complete WHERE order_id = $1
            UNION ALL
            SELECT ${fields}, 'CANCEL' as status FROM order_cancel WHERE order_id = $1
        )
        SELECT 
            ao.*,
            p.image_url,
            p.description
        FROM all_orders ao
        LEFT JOIN product_variants pv ON ao.product_variants_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
            ORDER BY ordered_at DESC;
            `;
        const queryRunner = client || pool;
        const result = await queryRunner.query(sql, [orderId]);

        return result.rows;
    },
    // ดึงข้อมูล Product Variants (ราคา + ชื่อ) เพื่อเอามาทำ Snapshot
    getProductVariantDetails: async (variantIds: number[]) => {
        // ต้อง Join เพื่อเอาชื่อสินค้ามา snapshot ด้วย
        const sql = `
          SELECT 
            v.id, 
            v.price, 
            v.stock_quantity, 
            p.product_name as base_name, 
            s.name as size_name,   
            c.name as color_name   
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        LEFT JOIN sizes s ON v.size_id = s.id
        LEFT JOIN colors c ON v.color_id = c.id
        
        WHERE v.id = ANY($1)
        `;
        const result = await pool.query(sql, [variantIds]);
        return result.rows;
    },
    // Bulk Insert ลง order_pending
    createOrderGenericBulk: async (
        tableName: string,
        orderGroupId: number,
        userId: number,
        addressData: any,
        paymentMethod: string,
        shippingMethod: string,
        shippingCost: number,
        itemsWithDetails: any[],
        orderAt: Date,
        client: PoolClient
    ) => {
        // Security Guard: Whitelist (กัน SQL Injection)
        const allowedTables = [
            'order_pending',
            'order_inspecting',
            'order_packing',
            'order_shipping',
            'order_complete',
            'order_cancel'
        ];
        if (!allowedTables.includes(tableName)) {
            throw new AppError(`Table '${tableName}' is not allowed!`, 400);
        }
        if (itemsWithDetails.length === 0) return;

        const values: any[] = [];
        const placeholders: string[] = [];
        let paramIndex = 1;

        // ดึงตัวแปรออกมา z
        const { recipient_name, phone, address } = addressData;

        itemsWithDetails.forEach((item) => {
            // คำนวณราคารวมต่อชิ้น
            const lineTotal = Number(item.price_snapshot) * item.quantity;

            // สร้างวงเล็บ ($1, $2, ..., $10, NOW())
            placeholders.push(`(
                $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, 
                $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, 
                $${paramIndex + 10}, $${paramIndex + 11},$${paramIndex + 12} ,$${paramIndex + 13}
            )`);

            // ยัดค่าลงถัง (เรียงตามลำดับ INSERT ด้านล่าง)
            values.push(
                orderGroupId,           // $1: order_id
                userId,                 // $2: user_id
                item.variant_id,         // $3: product_variants_id
                item.price_snapshot,    // $4: price_snapshot
                item.quantity,          // $5: quantity
                address,                // $6: address (text)
                recipient_name,         // $7: receiver_name
                phone,                  // $8: receiver_phone
                item.product_name,      // $9: product_name_snapshot (เช็คชื่อเต็มใน DB ให้ชัวร์)
                lineTotal,               // $10: net_total
                paymentMethod,
                shippingMethod,
                shippingCost,
                orderAt
            );

            paramIndex += 13;// ขยับ Index ทีละ 10 ช่อง
        });

        const sql = `
            INSERT INTO ${tableName} (
                order_id, user_id, product_variants_id, price_snapshot, quantity, 
                address, receiver_name, receiver_phone, product_name_snapshot, net_total, 
                payment_method, shipping_method, shipping_cost, ordered_at
            )
            VALUES ${placeholders.join(', ')}
        `;
        await client.query(sql, values);
    },
    deleteOrderGeneric: async (tableName: string,
        orderGroupId: number, userId: number, client: PoolClient) => {
        // Security Guard: Whitelist (กัน SQL Injection)
        const allowedTables = [
            'order_pending',
            'order_inspecting',
            'order_packing',
            'order_shipping',
            'order_complete',
            'order_cancel'
        ];
        if (!allowedTables.includes(tableName)) {
            throw new AppError(`Table '${tableName}' is not allowed!`, 400);
        }
        const sql = `
        DELETE FROM ${tableName}
        WHERE order_id = $1
        AND user_id = $2         
        RETURNING *;
        `
        const result = await client.query(sql, [orderGroupId, userId]);
        return result.rows
    },
    getNextOrderGroupId: async (client: PoolClient) => {
        const sql = "SELECT nextval('order_group_seq') as id";
        const result = await client.query(sql);

        // แปลงเป็น int ส่งกลับไป (DB มันส่งมาเป็น string สำหรับ bigint)
        return parseInt(result.rows[0].id);
    },
    createOrderLog: async (
        orderId: number,
        actionType: string,   // e.g., 'ORDER_CREATED', 'PAYMENT_UPLOADED'
        actorName: string,
        description: string,
        client: PoolClient
    ) => {
        const sql = `
            INSERT INTO order_logs (order_id, action_type, actor_name, description)
            VALUES ($1, $2, $3, $4)
        `;
        await client.query(sql, [orderId, actionType, actorName, description]);
    },
    createOrderSlips: async (orderId: number, imageObj: ImageObj, client: PoolClient) => {
        const sql = `
            INSERT INTO order_slips (order_id, image_url, file_path)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        await client.query(sql, [orderId, imageObj.imageUrl, imageObj.filePath]);
    },
    findLatestRejectionByOrderId: async (orderId: number) => {
        const sql = `
        SELECT reason, created_at 
        FROM order_rejections 
        WHERE order_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
    `;
        const result = await pool.query(sql, [orderId]);
        return result.rows[0] || null;
    }
};
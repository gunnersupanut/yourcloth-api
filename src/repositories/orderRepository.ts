import pool from '../config/db';
import { PoolClient } from 'pg';

export const orderRepository = {
    // หาข้อ order
    findOrderById: async (orderId: number) => {
        // Select Column ที่จำเป็นออกมาให้หมด 
        const fields = `
            order_id, user_id, net_total, receiver_name, receiver_phone, address, 
            product_name_snapshot, quantity, price_snapshot, ordered_at
        `;

        const sql = `
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
        `;

        const result = await pool.query(sql, [orderId]);

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
    createOrderPendingBulk: async (
        orderGroupId: number,
        userId: number,
        addressData: any,
        itemsWithDetails: any[],
        client: PoolClient
    ) => {
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
                $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, NOW()
            )`);

            // ยัดค่าลงถัง (เรียงตามลำดับ INSERT ด้านล่าง)
            values.push(
                orderGroupId,           // $1: order_id
                userId,                 // $2: user_id
                item.variantId,         // $3: product_variants_id
                item.price_snapshot,    // $4: price_snapshot
                item.quantity,          // $5: quantity
                address,                // $6: address (text)
                recipient_name,         // $7: receiver_name
                phone,                  // $8: receiver_phone
                item.product_name,      // $9: product_name_snapshot (เช็คชื่อเต็มใน DB ให้ชัวร์)
                lineTotal               // $10: net_total
            );

            paramIndex += 10; // ขยับ Index ทีละ 10 ช่อง
        });

        const sql = `
            INSERT INTO order_pending (
                order_id, user_id, product_variants_id, price_snapshot, quantity, 
                address, receiver_name, receiver_phone, product_name_snapshot, net_total, ordered_at
            )
            VALUES ${placeholders.join(', ')}
        `;

        await client.query(sql, values);
    },
    getNextOrderGroupId: async (client: PoolClient) => {
        const sql = "SELECT nextval('order_group_seq') as id";
        const result = await client.query(sql);

        // แปลงเป็น int ส่งกลับไป (DB มันส่งมาเป็น string สำหรับ bigint)
        return parseInt(result.rows[0].id);
    },
};
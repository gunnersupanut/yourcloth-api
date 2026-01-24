import pool from '../config/db';
import { PoolClient } from 'pg';
import { AppError } from '../utils/AppError';
import { CreateParcelNumberPayLoad, CreateRejectionPayLoad } from '../type/adminOrderTypes';
import { toSnakeCase } from '../utils/dbHelper';
export const adminOrderRepository = {
    // หา order
    findAllOrders: async (userId: number) => {
        const fields = `
            order_id, user_id, net_total, receiver_name, receiver_phone, address, product_variants_id,
            product_name_snapshot, quantity, price_snapshot,shipping_cost,
            ordered_at, payment_method, shipping_method
        `;

        // UNION ALL 
        // ใช้ UNION ALL เร็วกว่า UNION ธรรมดา ไม่ต้องเช็คซ้ำ
        const sql = `
        WITH all_orders AS (
            SELECT ${fields}, 'PENDING' as status FROM order_pending
            UNION ALL
            SELECT ${fields}, 'INSPECTING' as status FROM order_inspecting
            UNION ALL
            SELECT ${fields}, 'PACKING' as status FROM order_packing
            UNION ALL
            SELECT ${fields}, 'SHIPPING' as status FROM order_shipping
            UNION ALL
            SELECT ${fields}, 'COMPLETE' as status FROM order_complete
            UNION ALL
            SELECT ${fields}, 'CANCEL' as status FROM order_cancel
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
    findOrderByTableName: async (tableName: string) => {
        // Security Guard: Whitelist (กัน SQL Injection)
        const allowedTables = [
            'order_pending',
            'order_inspecting',
            'order_packing',
            'order_shipping',
            'order_complete',
            'order_cancel'
        ];
        // Map Status
        const statusMap: Record<string, string> = {
            'order_pending': 'PENDING',
            'order_inspecting': 'INSPECTING',
            'order_packing': 'PACKING',
            'order_shipping': 'SHIPPING',
            'order_complete': 'COMPLETE',
            'order_cancel': 'CANCEL'
        };
        const status = statusMap[tableName];
        if (!allowedTables.includes(tableName)) {
            throw new AppError(`Table '${tableName}' is not allowed!`, 400);
        }
        const sql = `
        SELECT
        *,
        '${status}' AS status
        FROM ${tableName}
        `

        const result = await pool.query(sql);

        return result.rows;
    },
    getInspectingOrdersWithSlips: async () => {
        const sql = `
        SELECT 
            oi.*,
            'INSPECTING' AS status,
            os.image_url,    
            os.file_path
        FROM order_inspecting oi
        LEFT JOIN order_slips os ON oi.order_id = os.order_id
        ORDER BY oi.ordered_at ASC;
    `;
        const result = await pool.query(sql);
        return result.rows;
    },
    createRejection: async (payload: CreateRejectionPayLoad, client: PoolClient) => {
        const sql = `
        INSERT INTO order_rejections (order_id, user_id, reason, rejected_by, created_at)
                VALUES ($1, $2, $3, $4, NOW()) 
        `;
        const values = [
            payload.orderId,
            payload.userId,
            payload.reason,
            payload.adminName
        ]
        await client.query(sql, values)
    },
    createParcelNumber: async (payload: CreateParcelNumberPayLoad, client: PoolClient) => {
        const sql = `
        INSERT INTO parcel_numbers (order_id, user_id, shipping_carrier, parcel_number, created_at)
                VALUES ($1, $2, $3, $4, NOW()) 
        `;
        const values = [
            payload.orderId,
            payload.userId,
            payload.shippingCarrier,
            payload.parcelNumber
        ]
        await client.query(sql, values)
    }
};
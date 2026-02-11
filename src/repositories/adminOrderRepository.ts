import pool from '../config/db';
import { PoolClient } from 'pg';
import { AppError } from '../utils/AppError';
import { CreateParcelNumberPayLoad, CreateRejectionPayLoad } from '../type/adminOrderTypes';
export const adminOrderRepository = {
    // หา order
    // getAllOrdersAdmin: async (
    //     status: string = 'ALL',
    //     page: number = 1,
    //     limit: number = 10,
    //     search: string = '',
    //     sortBy: string = 'newest',
    //     startDate: string = '',
    //     endDate: string = ''
    // ) => {
    //     const offset = (page - 1) * limit;
    //     const values: any[] = [];
    //     let whereConditions: string[] = [];

    //     // ---Filter Logic ---
    //     if (status !== 'ALL') {
    //         values.push(status);
    //         whereConditions.push(`status = $${values.length}`);
    //     }

    //     if (search) {
    //         values.push(`%${search}%`);
    //         whereConditions.push(`(receiver_name ILIKE $${values.length} OR order_id::text ILIKE $${values.length})`);
    //     }

    //     
    //     if (startDate) {
    //         values.push(startDate); // Format: YYYY-MM-DD
    //         whereConditions.push(`ordered_at >= $${values.length}::timestamp`);
    //     }
    //     if (endDate) {
    //         values.push(endDate + ' 23:59:59'); // เอาถึงสิ้นวัน
    //         whereConditions.push(`ordered_at <= $${values.length}::timestamp`);
    //     }

    //     const whereClause = whereConditions.length > 0
    //         ? `WHERE ${whereConditions.join(' AND ')}`
    //         : '';

    //     // --- Sort Logic (Dynamic ORDER BY) ---
    //     // ต้อง Sort ตั้งแต่ตอนเลือก ID ใน CTE ไม่งั้นหน้าบ้านจะเห็นลำดับมั่ว
    //     let orderByClause = 'ORDER BY MAX(ordered_at) DESC'; // Default Newest

    //     switch (sortBy) {
    //         case 'oldest':
    //             orderByClause = 'ORDER BY MAX(ordered_at) ASC';
    //             break;
    //         case 'price_desc':
    //             // เรียงตามราคารวม (net_total) มาก -> น้อย
    //             orderByClause = 'ORDER BY SUM(net_total) DESC';
    //             break;
    //         case 'price_asc':
    //             // เรียงตามราคารวม น้อย -> มาก
    //             orderByClause = 'ORDER BY SUM(net_total) ASC';
    //             break;
    //         default: // newest
    //             orderByClause = 'ORDER BY MAX(ordered_at) DESC';
    //     }

    //     // ---  นับจำนวน "Order" จริงๆ (Count Distinct) ---
    //     // เพื่อให้ Pagination หน้าบ้านคำนวณหน้าถูก ไม่ใช่นับจำนวนของ
    //     const countSql = `SELECT COUNT(DISTINCT order_id) as total FROM view_admin_orders ${whereClause}`;
    //     const countRes = await pool.query(countSql, values);
    //     const totalOrders = parseInt(countRes.rows[0].total || '0');

    //     // ---  ใช้ CTE ดึงข้อมูล ---
    //     // Step A (target_ids): หา Order ID 10 ใบที่ต้องการก่อน (LIMIT ตัดตรงนี้)
    //     // Step B (Main Query): เอา ID พวกนั้น ไป JOIN เพื่อดึงของทั้งหมดออกมา

    //     const limitIndex = values.length + 1;
    //     const offsetIndex = values.length + 2;

    //     const dataSql = `
    //         WITH target_ids AS (
    //             -- รวมกลุ่ม Order ID เพื่อหา Grand Total ก่อนเรียง 
    //             SELECT order_id
    //             FROM view_admin_orders
    //             ${whereClause}
    //             GROUP BY order_id
    //             ${orderByClause}  -- เรียงตาม SUM หรือ MAX ที่ตั้งไว้ 
    //             LIMIT $${limitIndex} OFFSET $${offsetIndex}
    //         )
    //         SELECT t1.* FROM view_admin_orders t1
    //         JOIN target_ids t2 ON t1.order_id = t2.order_id
    //         -- Sort รอบสุดท้ายเอาสวยงาม 
    //         ORDER BY ${sortBy.includes('price') ? 't1.net_total DESC' : 't1.ordered_at DESC'}, t1.id ASC
    //     `;

    //     const dataRes = await pool.query(dataSql, [...values, limit, offset]);

    //     return {
    //         orders: dataRes.rows,
    //         total: totalOrders,
    //         currentPage: page,
    //         totalPages: Math.ceil(totalOrders / limit)
    //     };
    // },
    getAllOrdersAdmin: async (
        status: string = 'ALL',
        page: number = 1,
        limit: number = 10,
        search: string = '',
        sortBy: string = 'newest',
        startDate: string = '',
        endDate: string = ''
    ) => {
        const offset = (page - 1) * limit;
        const values: any[] = [];
        let whereConditions: string[] = [];

        // --- 1. Filter Logic (เหมือนเดิม) ---
        if (status !== 'ALL') {
            values.push(status);
            whereConditions.push(`status = $${values.length}`);
        }
        if (search) {
            values.push(`%${search}%`);
            whereConditions.push(`(receiver_name ILIKE $${values.length} OR order_id::text ILIKE $${values.length})`);
        }
        if (startDate) {
            values.push(startDate);
            whereConditions.push(`ordered_at >= $${values.length}::timestamp`);
        }
        if (endDate) {
            values.push(endDate + ' 23:59:59');
            whereConditions.push(`ordered_at <= $${values.length}::timestamp`);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // --- 2. Sort Setup (กำหนดทิศทาง) ---
        let cteOrderBy = '';     // เรียงใน CTE (เพื่อเลือก 10 คนแรก)
        let finalOrderBy = '';   // เรียงตอนจบ (เพื่อให้ของเรียงสวย)

        // เช็คว่า อยากได้ มาก->น้อย (DESC) หรือ น้อย->มาก (ASC)
        const isAsc = sortBy === 'oldest' || sortBy === 'price_asc';
        const direction = isAsc ? 'ASC' : 'DESC';

        switch (sortBy) {
            case 'oldest': // เก่าสุดขึ้นก่อน
            case 'newest': // ใหม่สุดขึ้นก่อน
                // ใช้ MAX(ordered_at) เผื่อใน 1 ออเดอร์มีหลาย row เวลาไม่เท่ากัน (กันเหนียว)
                cteOrderBy = `ORDER BY MAX(ordered_at) ${direction}`;
                finalOrderBy = `ORDER BY t1.ordered_at ${direction}`;
                break;

            case 'price_asc':  // ถูกสุดขึ้นก่อน
            case 'price_desc': // แพงสุดขึ้นก่อน
                // เรียงตามผลรวมราคาทั้งออเดอร์
                cteOrderBy = `ORDER BY SUM(net_total) ${direction}`;
                finalOrderBy = `ORDER BY t2.grand_total ${direction}`;
                break;

            default: // Default Newest
                cteOrderBy = 'ORDER BY MAX(ordered_at) DESC';
                finalOrderBy = 'ORDER BY t1.ordered_at DESC';
        }
        // --- Count Query ---
        const countSql = `SELECT COUNT(DISTINCT order_id) as total FROM view_admin_orders ${whereClause}`;
        const countRes = await pool.query(countSql, values);
        const totalOrders = parseInt(countRes.rows[0].total || '0');

        // --- Main Query (CTE + Grand Total) ---
        const limitIndex = values.length + 1;
        const offsetIndex = values.length + 2;

        const dataSql = `
            WITH target_ids AS (
                SELECT 
                    order_id, 
                    SUM(net_total) as grand_total -- คำนวณราคาเตรียมไว้เลย
                FROM view_admin_orders
                ${whereClause}
                GROUP BY order_id
                ${cteOrderBy} -- เรียงเพื่อตัด LIMIT
                LIMIT $${limitIndex} OFFSET $${offsetIndex}
            )
            SELECT t1.*, t2.grand_total
            FROM view_admin_orders t1
            JOIN target_ids t2 ON t1.order_id = t2.order_id
            ${finalOrderBy}, t1.id ASC -- เรียงตามทิศทางที่ถูกต้อง + เรียงไอเทมตาม ID
        `;

        const dataRes = await pool.query(dataSql, [...values, limit, offset]);

        return {
            orders: dataRes.rows,
            total: totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit)
        };
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
    getOrderLog: async (orderId: number) => {
        const sql = `
        SELECT
        action_type,
        description,
        actor_name,
        created_at
        FROM order_logs
        WHERE order_id = $1
        ORDER BY created_at ASC;
        `
        const result = await pool.query(sql, [orderId]);
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
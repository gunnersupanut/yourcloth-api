import pool from "../config/db";
import { PoolClient } from 'pg';
import { IProductFilter } from "../type/productTypes";
export const productRepository = {
    createProduct: async (productData: any, variants: any[]) => {
        // ขอ Client มาส่วนตัวเพื่อทำ Transaction
        const client = await pool.connect();

        try {
            // ริ่ม Transaction 
            await client.query('BEGIN');

            // Insert ลงตารางแม่ (Products)
            const insertProductSql = `
                INSERT INTO products (product_name, description, image_url, file_path, category_id, gender_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `;

            const productResult = await client.query(insertProductSql, [
                productData.product_name,
                productData.description,
                productData.image_url,
                productData.file_path,
                productData.category_id,
                productData.gender_id
            ]);

            const newProductId = productResult.rows[0].id;
            console.log(` Created Product ID: ${newProductId}`);

            // BULK INSERT: ยิงทีเดียว จบทุก Variant
            if (variants.length > 0) {
                // 1. สร้าง Placeholder เช่น ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ...
                const values: any[] = [];
                const placeholders: string[] = [];
                let paramIndex = 1;

                variants.forEach((v) => {
                    placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);

                    // เรียงตามลำดับ field ใน Query
                    values.push(newProductId, v.color_id, v.size_id, v.price, v.stock_quantity);

                    paramIndex += 5; // ขยับไป 5 ช่อง (ตามจำนวน field)
                });

                const bulkInsertSql = `
                    INSERT INTO product_variants (product_id, color_id, size_id, price, stock_quantity)
                    VALUES ${placeholders.join(', ')}
                `;
                await client.query(bulkInsertSql, values);
            }
            // ถ้าทุกอย่างผ่าน -> บันทึก!
            await client.query('COMMIT');

            return { id: newProductId, message: "Product created successfully" };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error creating product:", error);
            throw error;
        } finally {
            // ปล่อย Client คืน Pool
            client.release();
        }
    },
    getStockQuantity: async (product_variant_id: number) => {
        const sql =
            'SELECT stock_quantity FROM product_variants WHERE id = $1';

        const result = await pool.query(sql, [product_variant_id])
        if (result.rows.length === 0) {
            return 0;
        }
        return result.rows[0].stock_quantity;
    },
    getAllProducts: async (filters: IProductFilter) => {
        const {
            page = 1,
            limit = 12,
            search,
            category,
            gender,
            sort = "newest",
            minPrice,
            maxPrice,
        } = filters;

        const offset = (page - 1) * limit;

        // เก็บเงื่อนไข WHERE และ Values
        const whereConditions: string[] = ["pd.is_active = true"];
        const values: any[] = [];
        let paramIndex = 1;

        // --- Dynamic WHERE Clause ---

        // Search (ค้นหาชื่อ หรือ คำอธิบาย)
        if (search) {
            whereConditions.push(`(pd.product_name ILIKE $${paramIndex} OR pd.description ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        // Category
        if (category && category !== "All") { // ถ้าส่ง All มาไม่ต้องกรอง
            whereConditions.push(`c.name = $${paramIndex}`);
            values.push(category);
            paramIndex++;
        }

        // Gender
        if (gender && gender !== "All") {
            whereConditions.push(`gd.name = $${paramIndex}`);
            values.push(gender);
            paramIndex++;
        }

        // --- Dynamic HAVING Clause (สำหรับราคา) ---
        // เพราะราคามาจากการหาค่า MIN(pv.price) ต้องใช้ HAVING กรองหลัง Group
        const havingConditions: string[] = [];

        if (minPrice !== undefined) {
            havingConditions.push(`MIN(pv.price) >= $${paramIndex}`);
            values.push(minPrice);
            paramIndex++;
        }

        if (maxPrice !== undefined) {
            havingConditions.push(`MIN(pv.price) <= $${paramIndex}`);
            values.push(maxPrice);
            paramIndex++;
        }

        // --- Dynamic ORDER BY ---
        let orderBy = "pd.id DESC"; // Default: ใหม่สุด (ID มากสุด)
        switch (sort) {
            case "price_asc":
                orderBy = "price ASC"; // ใช้ Alias 'price' ที่ตั้งไว้
                break;
            case "price_desc":
                orderBy = "price DESC";
                break;
            case "oldest":
                orderBy = "pd.id ASC";
                break;
            default:
                orderBy = "pd.id DESC";
        }

        // ประกอบ SQL หลัก
        const whereString = whereConditions.join(" AND ");
        const havingString = havingConditions.length > 0 ? `HAVING ${havingConditions.join(" AND ")}` : "";

        const sql = `
      SELECT
        pd.id, 
        pd.product_name, 
        MIN(pv.price) AS price,
        pd.description, 
        pd.image_url,
        c.name AS category,
        gd.name AS gender,
        (
          SELECT JSON_AGG(json_build_object('name', sub.name, 'code', sub.hex_code))
          FROM (
            SELECT DISTINCT cl.name, cl.hex_code
            FROM product_variants pv_sub
            JOIN colors AS cl ON pv_sub.color_id = cl.id
            WHERE pv_sub.product_id = pd.id
          ) sub
        ) AS available_colors,
        (
          SELECT JSON_AGG(DISTINCT si.name)
          FROM product_variants pv_sub
          JOIN sizes AS si ON pv_sub.size_id = si.id
          WHERE pv_sub.product_id = pd.id 
        ) AS available_sizes
      FROM products AS pd 
      LEFT JOIN categories AS c ON pd.category_id = c.id
      LEFT JOIN genders AS gd ON pd.gender_id = gd.id
      LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
      WHERE ${whereString}
      GROUP BY pd.id, c.name, gd.name
      ${havingString}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        // ใส่ limit, offset ต่อท้าย values
        const queryValues = [...values, limit, offset];

        // ยิง Query หาข้อมูลสินค้า
        const result = await pool.query(sql, queryValues);

        // (Optional but Recommended) หาจำนวนทั้งหมดเพื่อทำ Pagination (Total Count)
        // ต้อง query แยกอีกรอบโดยใช้เงื่อนไขเดิมแต่เอา Limit/Offset ออก เพื่อบอก Frontend ว่ามีกี่หน้า
        const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT pd.id 
        FROM products AS pd
        LEFT JOIN categories AS c ON pd.category_id = c.id
        LEFT JOIN genders AS gd ON pd.gender_id = gd.id
        LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
        WHERE ${whereString}
        GROUP BY pd.id, c.name, gd.name
        ${havingString}
      ) as subquery
    `;
        // ใช้ values ชุดเดิม (ไม่ต้องมี limit/offset)
        const countResult = await pool.query(countSql, values);
        const total = parseInt(countResult.rows[0]?.total || "0");

        return {
            products: result.rows,
            total,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        };
    },
    getById: async (product_id: number) => {
        const sql =
            `
        SELECT
        pd.id, 
        pd.product_name, 
        MIN(pv.price) AS price,
        pd.description, 
        pd.image_url,
        c.name AS category,
        gd.name AS gender,
        (
        SELECT JSON_AGG(
        json_build_object(
        'name', sub.name, 
        'code', sub.hex_code
        )
        )
        FROM (
        SELECT DISTINCT cl.name, cl.hex_code
        FROM product_variants pv
        JOIN colors AS cl ON pv.color_id = cl.id
        WHERE pv.product_id = pd.id
        ) sub
        ) AS available_colors,
        (
        SELECT JSON_AGG(DISTINCT si.name)
        FROM product_variants pv
        JOIN sizes AS si ON pv.size_id = si.id
        WHERE pv.product_id = pd.id 
        ) AS available_sizes,
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'variant_id', v.id,
              'color_name', col.name,
              'color_code', col.hex_code,
              'size', sz.name,
              'price', v.price,
              'stock', v.stock_quantity 
            ) ORDER BY v.id ASC
          )
        FROM product_variants v
          JOIN colors col ON v.color_id = col.id
          JOIN sizes sz ON v.size_id = sz.id
          WHERE v.product_id = pd.id
        ) AS variants
        FROM products AS pd 
        LEFT JOIN categories AS c ON pd.category_id = c.id
        LEFT JOIN genders AS gd ON pd.gender_id = gd.id
        LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
        WHERE pd.id = $1 AND pd.is_active = true
        GROUP BY 
        pd.id, c.name, gd.name
        ORDER BY pd.id ASC
        `;
        const result = await pool.query(sql, [product_id])
        return result.rows[0];
    },
    getAdminProducts: async () => {
        const sql = `
        SELECT
            pd.id, 
            pd.product_name, 
            pd.image_url,
            pd.file_path,
            c.name AS category,
            gd.name AS gender,
            MIN(pv.price) AS min_price,
            MAX(pv.price) AS max_price,

            COALESCE(SUM(pv.stock_quantity), 0) AS total_stock,
            CASE 
                WHEN pd.is_active = false THEN 'Inactive'
                WHEN SUM(pv.stock_quantity) > 0 THEN 'Active'
                ELSE 'Out of Stock'
            END AS calculated_status

        FROM products AS pd 
        LEFT JOIN categories AS c ON pd.category_id = c.id
        LEFT JOIN genders AS gd ON pd.gender_id = gd.id
        LEFT JOIN product_variants AS pv ON pv.product_id = pd.id
        
        GROUP BY pd.id, c.name, gd.name
        ORDER BY pd.id DESC; 
    `;

        const result = await pool.query(sql);
        return result.rows;
    },
    getAdminById: async (productId: number) => {
        const sql = `
            SELECT
                pd.id, 
                pd.product_name, 
                pd.description, 
                pd.image_url,
                pd.file_path,   
                pd.category_id,   
                pd.gender_id,
                pd.is_active,    
                
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'variant_id', v.id,
                            'color_id', v.color_id,
                            'size_id', v.size_id,    
                            'price', v.price,
                            'stock_quantity', v.stock_quantity
                        ) ORDER BY v.id ASC
                    )
                    FROM product_variants v
                    WHERE v.product_id = pd.id
                ) AS variants

            FROM products AS pd 
            WHERE pd.id = $1
        `;

        const result = await pool.query(sql, [productId]);
        return result.rows[0];
    },

    getBulkByVariantIds: async (variantIds: number[]) => {
        const sql = `
        SELECT 
            v.id,
            v.price,
            v.stock_quantity,
            p.description,
            p.product_name,
            p.image_url,
            s.name AS size,
            c.name AS color
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        LEFT JOIN sizes s ON v.size_id = s.id
        LEFT JOIN colors c ON v.color_id = c.id
        WHERE v.id = ANY($1)
    `;
        const result = await pool.query(sql, [variantIds]);
        return result.rows;
    },
    updateProduct: async (productId: number, productData: any, variants: any[]) => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // ---Update (Products)
            const updateProductSql = `
                UPDATE products
                SET product_name = $1, 
                    description = $2, 
                    image_url = $3, 
                    category_id = $4, 
                    gender_id = $5,
                    file_path = $6,
                    is_active = $7   -- 🔥 เพิ่ม is_active
                WHERE id = $8        -- 🔥 ขยับ index เป็น 8
            `;
            await client.query(updateProductSql, [
                productData.product_name,
                productData.description,
                productData.image_url,
                productData.category_id,
                productData.gender_id,
                productData.file_path,
                productData.is_active, // 🔥 รับค่าจากหน้าบ้าน
                productId
            ]);

            // ---จัดการ Variants 

            // ---หา ID เก่าใน DB
            const existingRes = await client.query(
                'SELECT id FROM product_variants WHERE product_id = $1',
                [productId]
            );
            const existingIds = existingRes.rows.map(r => r.id);

            // ---หา ID ที่ส่งมาจากหน้าบ้าน
            const incomingIds = variants
                .filter((v: any) => v.variant_id)
                .map((v: any) => v.variant_id);

            // ---หา "ตัวที่ต้องลบ" (User กดถังขยะทิ้งไป)
            const toDeleteIds = existingIds.filter(id => !incomingIds.includes(id));

            // ---SOFT DELETE ตัวที่โดนลบ: ปรับ Stock 0 + ปิด is_active
            if (toDeleteIds.length > 0) {
                await client.query(
                    `UPDATE product_variants 
                     SET stock_quantity = 0, is_active = false 
                     WHERE id = ANY($1)`,
                    [toDeleteIds]
                );
                console.log(`Soft deleted variants: ${toDeleteIds.join(', ')}`);
            }

            // ---วนลูป Upsert (Update / Insert)
            for (const v of variants) {
                // เช็คว่ามีส่ง is_active มาไหม? ถ้าไม่มีให้ Default เป็น true
                const variantIsActive = v.is_active !== undefined ? v.is_active : true;

                if (v.variant_id) {
                    // Case Update: ของเดิม -> แก้ข้อมูล + อัปเดตสถานะ
                    await client.query(`
                        UPDATE product_variants
                        SET color_id = $1, 
                            size_id = $2, 
                            price = $3, 
                            stock_quantity = $4,
                            is_active = $5  -- 🔥 อัปเดตสถานะลูก
                        WHERE id = $6
                    `, [v.color_id, v.size_id, v.price, v.stock_quantity, variantIsActive, v.variant_id]);
                } else {
                    // Case Insert: ของใหม่ -> เพิ่มข้อมูล + สถานะเริ่มต้น
                    await client.query(`
                        INSERT INTO product_variants (product_id, color_id, size_id, price, stock_quantity, is_active)
                        VALUES ($1, $2, $3, $4, $5, $6) -- 🔥 เพิ่ม value ตัวที่ 6
                    `, [productId, v.color_id, v.size_id, v.price, v.stock_quantity, variantIsActive]);
                }
            }

            await client.query('COMMIT');
            return { message: "Product updated successfully" };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error updating product:", error);
            throw error;
        } finally {
            client.release();
        }
    },
    deleteProduct: async (id: number) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // เช็คว่ามีของไหม
            const checkRes = await client.query('SELECT id FROM products WHERE id = $1', [id]);
            if (checkRes.rows.length === 0) {
                throw new Error("Product not found");
            }

            await client.query(
                'UPDATE products SET is_active = false WHERE id = $1',
                [id]
            );

            await client.query(
                'UPDATE product_variants SET is_active = false WHERE product_id = $1',
                [id]
            );

            await client.query(
                'UPDATE product_variants SET stock_quantity = 0 WHERE product_id = $1',
                [id]
            );

            await client.query('COMMIT');

            return { message: "Product and variants deactivated successfully" };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Soft Delete Error:", error);
            throw error;
        } finally {
            client.release();
        }
    },
    decreaseStock: async (items: any[], client: PoolClient) => {
        // ถ้าไม่มีของให้ตัด 
        if (items.length === 0) return;

        const values: any[] = [];
        const placeholders: string[] = [];
        let paramIndex = 1;

        // วนลูปเตรียม(Values List)
        items.forEach((item) => {
            // item ต้องมี variantId และ quantity
            // สร้างคู่ ($1, $2) ::int เพื่อบอก DB ว่าเป็นตัวเลขแน่ๆ 
            placeholders.push(`($${paramIndex}::int, $${paramIndex + 1}::int)`);

            values.push(item.variantId, item.quantity);

            paramIndex += 2;
        });

        // อัปเดตตาราง product_variants (v)
        // โดยให้ stock_quantity = stock เดิม - quantity ที่ส่งมา (t.quantity)
        // จากข้อมูลใน VALUES (t) ที่มีคอลัมน์ชื่อ id และ quantity
        // โดยจับคู่ที่ v.id ตรงกับ t.id
        const sql = `
            UPDATE product_variants AS v
            SET stock_quantity = v.stock_quantity - t.quantity
            FROM (VALUES ${placeholders.join(', ')}) AS t(id, quantity)
            WHERE v.id = t.id
        `;

        // ตัดสต็อกรวดเดียว
        await client.query(sql, values);
    }
}
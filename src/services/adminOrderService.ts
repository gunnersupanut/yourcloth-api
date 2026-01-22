import { adminOrderRepository } from '../repositories/adminOrderRepository'
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
    moveOrederToPacking: async (orderId: number, userId: number, userName: string) => {

    }
}
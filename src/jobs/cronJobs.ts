import cron from 'node-cron';
import { orderRepository } from '../repositories/orderRepository';

export const startCronJobs = () => {
    console.log('Cron Jobs initialized Auto-cancel watcher is ONLINE.');

    // รันทุกๆ 1 ชั่วโมง (นาทีที่ 0)
    // ถ้าอยากเทสไวๆ ให้เปลี่ยนเป็น '*/1 * * * *' (ทุก 1 นาที)
    cron.schedule('0 * * * *', async () => {
        console.log('System Bot: Scanning for expired orders...');

        try {
            //  หา(24 ชั่วโมง)
            const expiredOrders = await orderRepository.findExpiredPendingOrderIds(24);

            if (expiredOrders.length === 0) {
                console.log('No expired orders found. Server is clean.');
                return;
            }

            console.log(`Found ${expiredOrders.length} orders to cancel. Let's purge!`);

            // วนลูปยกเลิกทีละคน 
            for (const order of expiredOrders) {
                const success = await orderRepository.autoCancelOrder(order.order_id, order.user_id);
                if (success) {
                    console.log(`Order #${order.order_id} has been terminated.`);
                }
            }

            console.log('Auto-cancel job finished.');

        } catch (error) {
            console.error('Cron Job Error:', error);
        }
    });
};
export interface GroupedOrder {
    order_id: number;
    user_id: number;
    status: string;
    total_price: number;
    slip: {
        url: string | null;
        path: string | null;
    };
    customer: {
        name: string;
        address: string;
        phone: string;
    };
    items: any[]; // เก็บรายการสินค้าในออเดอร์นั้นๆ
    dates: {
        ordered: Date;
    }
}

export interface CreateRejectionPayLoad {
    orderId: number;
    userId: number;
    reason: string;
    adminName: string
}
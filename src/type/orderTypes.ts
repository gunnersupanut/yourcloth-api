
export interface OrderItemInput {
    variantId: number;
    quantity: number;
}

export interface CreateOrderPayload {
    addressId: number;
    items: OrderItemInput[];
    paymentMethod: string;
    shippingMethod: string;
    shippingCost: number;
    cartItemIds?: number[];
}
// ของ 1 ชิ้น
export interface OrderHistoryItem {
    name: string;
    quantity: number;
    price: number;
    image: string;
    description: string;
    lineTotal: number;
}
export interface OrderReceiver {
    name: string;
    phone: string;
    address: string;
}
// ออเดอร์ 1 ใบ (ประกอบด้วยหลายชิ้น)
export interface OrderHistoryEntry {
    orderId: number;
    status: string;
    orderedAt: Date; // หรือ string แล้วแต่ Database return
    totalAmount: number;
    receiver: OrderReceiver; //  (1 ออเดอร์ มี 1 ที่อยู่)
    items: OrderHistoryItem[];
}
export interface MoveToInspectingPayload {
    imageObj: ImageObj
}
// รูป
export interface ImageObj {
    imageUrl: string;
    filePath: string
}
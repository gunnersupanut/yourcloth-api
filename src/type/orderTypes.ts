
export interface OrderItemInput {
    variantId: number;
    quantity: number;
}

export interface CreateOrderPayload {
    addressId: number;
    items: OrderItemInput[];
    paymentMethod: string;
    shippingMethod: string;
    cartItemIds?: number[];
}
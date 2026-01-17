
export interface UserAddress {
    id: number;
    user_id: number;
    recipient_name: string;
    phone: string;
    address: string;
    is_default: boolean;
    created_at: Date;
}

export interface CreateAddressPayload {
    recipientName: string;
    phone: string;
    address: string;
    isDefault?: boolean;
}
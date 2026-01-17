import { ParamsDictionary } from 'express-serve-static-core';
export interface UpdateCartItemParams {
    userId: number;
    variantId: number;
    cartId: number;
    quantity: number;
}
export interface UpdateCartParams extends ParamsDictionary {
    cartId: string;
}
export interface ValidateStockParams {
    userId: number;
    variantId: number;
    quantityRequest: number;
    isAccumulate: boolean;
}

export interface DeleteSelectedCarts {
    cartIds: number;
}
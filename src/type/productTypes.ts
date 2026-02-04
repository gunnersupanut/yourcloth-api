export interface IProductFilter {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    gender?: string;
    size?: string;
    sort?: string; // 'newest', 'price_asc', 'price_desc'
    minPrice?: number;
    maxPrice?: number;
}

export interface IProductParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    gender?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
}
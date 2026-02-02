export interface IBanner {
  id: number;
  title?: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  start_date?: Date | null;
  end_date?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateBannerDTO {
  title?: string;
  image_url: string;
  is_active?: boolean;
  sort_order?: number;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
}

export interface IUpdateBannerDTO {
  title?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
}
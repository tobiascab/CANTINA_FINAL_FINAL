
export type AppView = 'login' | 'category' | 'dish-selection' | 'ticket' | 'admin-dashboard';

export type MainCategory = 'desayuno' | 'almuerzo' | 'combo';

export interface Dish {
  id: string;
  name: string;
  basePrice: number;
  image: string;
  isActive?: boolean;
}

export interface Order {
  id?: number;
  userId: string;
  category: MainCategory;
  dish?: Dish;
  dishName?: string;
  quantity: number;
  total: number;
  timestamp: string; // Formato legible
  dateIso: string;  // Formato para filtrado (YYYY-MM-DD)
  isServed?: boolean;
}

export interface UserSummary {
  userId: string;
  name: string;
  totalQuantity: number;
  totalSpent: number;
  breakfastCount: number;
  lunchCount: number;
}

export interface DbUser {
  username: string;
  fullName: string;
  role: string;
  password?: string;
}

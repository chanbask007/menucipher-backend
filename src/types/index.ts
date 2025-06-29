// src/types/index.ts

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'CNY';

export interface Client {
    client_id: string;
    name: string;
    theme: string;
    created_at: string;
    address: string;
    open_at: string;
    closed_at: string;
    currency: string;
    email: string;
    password_hash: string;
  }
  
  export interface MenuItem {
    id: number;
    client_id: string;
    category: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    create_at: string;
    popular?: boolean;
    rating: number | null;
  }
  
  export interface Category {
    id: number;
    client_id: string;
    name: string;
  }
  
  export interface Analytics {
    todayOrders: number;
    weeklyOrders: number;
    totalRevenue: number;
    weeklySales: number[];
  }
  
  export interface Restaurant {
    restaurant_id: string;
    name: string;
    address: string;
    hours: string;
    currency: string;
    currencySymbol: string;
    
  }
  
  export interface DashboardResponse {
    restaurant: Restaurant;
    analytics: Analytics;
    categories: Category[];
    menuItems: MenuItem[];
  }
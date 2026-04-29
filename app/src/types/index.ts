// 核心类型定义

// 用户类型
export type BodyType = 'SLIM' | 'REGULAR' | 'ATHLETIC' | 'PLUS_SIZE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  height?: number;
  weight?: number;
  bodyType?: BodyType;
  createdAt: Date;
  updatedAt: Date;
}

// 衣物类型
export type ClothingCategory = 'TOP' | 'BOTTOM' | 'DRESS' | 'OUTERWEAR' | 'SHOES' | 'ACCESSORY';

export interface ClothingItem {
  id: string;
  userId: string;
  name: string;
  category: ClothingCategory;
  imageUrl: string;
  color: string;
  brand?: string;
  price?: number;
  size?: string;
  material?: string;
  tags: string[];
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  opacity: number;
  createdAt: Date;
  updatedAt: Date;
}

// 搭配类型
export type StyleType = 'CASUAL' | 'FORMAL' | 'SPORTS' | 'BUSINESS' | 'PARTY';
export type OccasionType = 'WORK' | 'DATE' | 'PARTY' | 'TRAVEL' | 'HOME';

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  likes: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutfitItem {
  id: string;
  outfitId: string;
  clothingId: string;
  layer: number;
  createdAt: Date;
  clothing: ClothingItem;
}

// 用户偏好类型
export interface UserPreference {
  id: string;
  userId: string;
  favoriteStyle: StyleType[];
  favoriteColor: string[];
  favoriteBrand: string[];
  sizeChart: any;
  occasions: OccasionType[];
  createdAt: Date;
  updatedAt: Date;
}

// Canvas相关类型
export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasScale {
  x: number;
  y: number;
}

export interface ClothingTransform {
  position: CanvasPosition;
  scale: CanvasScale;
  rotation: number;
  opacity: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 用户注册表单
export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  height?: number;
  weight?: number;
  bodyType?: BodyType;
}

// 用户登录表单
export interface LoginFormData {
  email: string;
  password: string;
}

// 搭配预览请求
export interface PreviewRequest {
  userId: string;
  clothingItems: ClothingItem[];
  userHeight: number;
}

// 搭配预览响应
export interface PreviewResponse {
  success: boolean;
  outfit: ClothingItem[];
  rating: number;
  message: string;
}

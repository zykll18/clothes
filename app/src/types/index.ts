// 核心类型定义

// 用户类型
export type BodyType = 'SLIM' | 'REGULAR' | 'ATHLETIC' | 'PLUS_SIZE';
export type ClothingCategory = 'TOP' | 'BOTTOM' | 'DRESS' | 'OUTERWEAR' | 'SHOES' | 'ACCESSORY';
export type StyleType = 'CASUAL' | 'FORMAL' | 'SPORTS' | 'BUSINESS' | 'PARTY';
export type OccasionType = 'WORK' | 'DATE' | 'PARTY' | 'TRAVEL' | 'HOME';
export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  height?: number | null;
  weight?: number | null;
  bodyType?: BodyType | null;
  createdAt: Date;
  updatedAt: Date;
}

// 衣物类型
export interface ClothingItem {
  id: string;
  userId: string;
  name: string;
  category: ClothingCategory;
  clothType: string;
  imageUrl: string;
  color?: string | null;
  brand?: string | null;
  price?: number | null;
  size?: string | null;
  material?: string | null;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface PreviewClothingItem extends ClothingItem, ClothingTransform {}

// 用户偏好类型
export interface UserPreference {
  id: string;
  userId: string;
  favoriteStyle: string;
  favoriteColor: string;
  favoriteBrand: string;
  sizeChart: JsonValue;
  occasions: string;
  createdAt: Date;
  updatedAt: Date;
}

// API响应类型
export interface ApiResponse<T = unknown> {
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

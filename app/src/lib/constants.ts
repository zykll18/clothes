// 常量定义

// 应用配置
export const APP_CONFIG = {
  name: '穿搭预览',
  description: '智能穿搭搭配预览平台',
  version: '1.0.0',
} as const;

// 文件上传配置
export const UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  avatarMaxSize: 5 * 1024 * 1024, // 5MB
} as const;

// 分页配置
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

// 衣物分类
export const CLOTHING_CATEGORIES = {
  TOP: '上衣',
  BOTTOM: '裤子',
  DRESS: '裙子',
  OUTERWEAR: '外套',
  SHOES: '鞋子',
  ACCESSORY: '配饰',
} as const;

// 体型
export const BODY_TYPES = {
  SLIM: '瘦削',
  REGULAR: '标准',
  ATHLETIC: '健壮',
  PLUS_SIZE: '丰满',
} as const;

// 风格
export const STYLE_TYPES = {
  CASUAL: '休闲',
  FORMAL: '正式',
  SPORTS: '运动',
  BUSINESS: '商务',
  PARTY: '派对',
} as const;

// 场合
export const OCCASION_TYPES = {
  WORK: '工作',
  DATE: '约会',
  PARTY: '派对',
  TRAVEL: '旅行',
  HOME: '居家',
} as const;

// Canvas配置
export const CANVAS_CONFIG = {
  width: 800,
  height: 1200,
  defaultOpacity: 0.8,
  defaultScale: 1,
  minScale: 0.5,
  maxScale: 2,
  rotationStep: 15,
} as const;

// API错误消息
export const API_ERRORS = {
  UNAUTHORIZED: '未授权，请先登录',
  FORBIDDEN: '无权访问',
  NOT_FOUND: '资源不存在',
  SERVER_ERROR: '服务器错误',
  INVALID_INPUT: '输入无效',
} as const;

// API成功消息
export const API_SUCCESS = {
  LOGIN: '登录成功',
  REGISTER: '注册成功',
  LOGOUT: '登出成功',
  UPLOAD: '上传成功',
  DELETE: '删除成功',
  UPDATE: '更新成功',
  CREATE: '创建成功',
} as const;

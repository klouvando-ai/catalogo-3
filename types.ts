
export enum UserRole {
  ADMIN = 'ADMIN',
  REPRESENTATIVE = 'REPRESENTATIVE',
  SACOLEIRA = 'SACOLEIRA',
  GUEST = 'GUEST',
}

export enum SizeRange {
  P_GG = 'P ao GG',
  G1_G3 = 'G1 ao G3',
}

export interface Color {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  orderIndex: number;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  createdAt: number;
}

export interface ReferenceDefinition {
  id: string;
  code: string;
  name: string;
  category: string;
  sizeRange: SizeRange;
  priceRepresentative: number;
  priceSacoleira: number;
  colors: Color[];
  createdAt: number;
}

export interface ProductVariant {
  id: string;
  name?: string; 
  reference: string;
  sizeRange: SizeRange;
  priceRepresentative: number;
  priceSacoleira: number;
  colors: Color[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  fabric: string;
  category: string;
  images: string[]; 
  coverImageIndex: number;
  isFeatured: boolean;
  referenceIds: string[];
  variants: ProductVariant[];
  createdAt: number;
}

export interface User {
  username: string;
  role: UserRole;
}

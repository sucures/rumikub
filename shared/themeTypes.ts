// Tipos para Temas y Personalización

export type ThemeName = 
  | 'classic' 
  | 'modern' 
  | 'dark' 
  | 'neon' 
  | 'ocean' 
  | 'forest' 
  | 'sunset' 
  | 'royal' 
  | 'minimal' 
  | 'retro'
  | 'premium_gold'
  | 'premium_diamond'
  | 'premium_platinum';

export type TileDesign = 
  | 'standard' 
  | 'rounded' 
  | 'sharp' 
  | 'glossy' 
  | 'matte' 
  | 'neon_glow' 
  | 'gradient' 
  | 'textured' 
  | 'animated' 
  | 'premium_3d'
  | 'premium_crystal'
  | 'premium_metallic';

export type FontSize = 'small' | 'medium' | 'large' | 'extra_large';
export type Brightness = 'dark' | 'normal' | 'bright' | 'very_bright';

export interface TileColorScheme {
  red: string;
  blue: string;
  yellow: string;
  black: string;
  background: string;
  border: string;
  text: string;
  joker: string;
}

export interface Theme {
  id: string;
  name: ThemeName;
  displayName: string;
  description: string;
  isPremium: boolean;
  tileColors: TileColorScheme;
  tileDesign: TileDesign;
  boardBackground: string;
  boardPattern?: string;
  fontFamily: string;
  fontSize: FontSize;
  brightness: Brightness;
  sounds: SoundTheme;
  animations: boolean;
  effects: string[];
  previewImage?: string;
  price?: number; // En coins o tokens
  unlocked: boolean;
}

export interface SoundTheme {
  tilePlace: string;
  tilePick: string;
  gameStart: string;
  gameEnd: string;
  win: string;
  lose: string;
  error: string;
  notification: string;
  backgroundMusic?: string;
  volume: number; // 0-100
}

export interface UserThemeSettings {
  userId: string;
  activeTheme: ThemeName;
  customTileColors?: Partial<TileColorScheme>;
  tileDesign: TileDesign;
  fontSize: FontSize;
  brightness: Brightness;
  sounds: SoundTheme;
  animations: boolean;
  effects: string[];
  unlockedThemes: ThemeName[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface PremiumTier {
  name: 'basic' | 'premium' | 'premium_plus' | 'premium_3.0';
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
    lifetime?: number;
  };
  features: string[];
  themes: ThemeName[];
  tileDesigns: TileDesign[];
  prioritySupport: boolean;
  exclusiveContent: boolean;
  adFree: boolean;
  earlyAccess: boolean;
}

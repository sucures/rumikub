// Servicio de Temas y Personalización Premium 3.0
import { Theme, ThemeName, TileDesign, FontSize, Brightness, UserThemeSettings, PremiumTier, TileColorScheme } from '../../../shared/themeTypes';

export class ThemeService {
  private themes: Map<ThemeName, Theme> = new Map();
  private premiumTiers: PremiumTier[] = [];

  constructor() {
    this.initializeThemes();
    this.initializePremiumTiers();
  }

  // Inicializar temas disponibles
  private initializeThemes(): void {
    // Tema Clásico (Gratis)
    this.themes.set('classic', {
      id: 'classic',
      name: 'classic',
      displayName: 'Clásico',
      description: 'El diseño tradicional de Rummikub',
      isPremium: false,
      tileColors: {
        red: '#EF4444',
        blue: '#3B82F6',
        yellow: '#FBBF24',
        black: '#1F2937',
        background: '#F9FAFB',
        border: '#E5E7EB',
        text: '#111827',
        joker: '#9333EA',
      },
      tileDesign: 'standard',
      boardBackground: '#E5E7EB',
      fontFamily: 'Inter',
      fontSize: 'medium',
      brightness: 'normal',
      sounds: this.getDefaultSounds(),
      animations: false,
      effects: [],
      unlocked: true,
    });

    // Tema Moderno (Gratis)
    this.themes.set('modern', {
      id: 'modern',
      name: 'modern',
      displayName: 'Moderno',
      description: 'Diseño limpio y contemporáneo',
      isPremium: false,
      tileColors: {
        red: '#F87171',
        blue: '#60A5FA',
        yellow: '#FCD34D',
        black: '#374151',
        background: '#FFFFFF',
        border: '#D1D5DB',
        text: '#1F2937',
        joker: '#A78BFA',
      },
      tileDesign: 'rounded',
      boardBackground: '#F3F4F6',
      fontFamily: 'Inter',
      fontSize: 'medium',
      brightness: 'normal',
      sounds: this.getDefaultSounds(),
      animations: true,
      effects: ['smooth-transitions'],
      unlocked: true,
    });

    // Tema Oscuro (Gratis)
    this.themes.set('dark', {
      id: 'dark',
      name: 'dark',
      displayName: 'Oscuro',
      description: 'Perfecto para jugar de noche',
      isPremium: false,
      tileColors: {
        red: '#DC2626',
        blue: '#2563EB',
        yellow: '#D97706',
        black: '#111827',
        background: '#1F2937',
        border: '#374151',
        text: '#F9FAFB',
        joker: '#7C3AED',
      },
      tileDesign: 'matte',
      boardBackground: '#111827',
      fontFamily: 'Inter',
      fontSize: 'medium',
      brightness: 'dark',
      sounds: this.getDefaultSounds(),
      animations: true,
      effects: ['dark-mode'],
      unlocked: true,
    });

    // Tema Premium Gold
    this.themes.set('premium_gold', {
      id: 'premium_gold',
      name: 'premium_gold',
      displayName: 'Premium Gold',
      description: 'Lujo dorado con efectos especiales',
      isPremium: true,
      tileColors: {
        red: '#DC2626',
        blue: '#2563EB',
        yellow: '#F59E0B',
        black: '#1F2937',
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        border: '#D97706',
        text: '#78350F',
        joker: '#F59E0B',
      },
      tileDesign: 'premium_3d',
      boardBackground: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      boardPattern: 'gold-pattern',
      fontFamily: 'Playfair Display',
      fontSize: 'large',
      brightness: 'bright',
      sounds: this.getPremiumSounds(),
      animations: true,
      effects: ['gold-glow', 'particles', 'shimmer'],
      previewImage: '/themes/premium-gold.jpg',
      price: 500, // coins
      unlocked: false,
    });

    // Tema Premium Diamond
    this.themes.set('premium_diamond', {
      id: 'premium_diamond',
      name: 'premium_diamond',
      displayName: 'Premium Diamond',
      description: 'Brillo cristalino de diamante',
      isPremium: true,
      tileColors: {
        red: '#EF4444',
        blue: '#3B82F6',
        yellow: '#FBBF24',
        black: '#1F2937',
        background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
        border: '#6366F1',
        text: '#1E1B4B',
        joker: '#8B5CF6',
      },
      tileDesign: 'premium_crystal',
      boardBackground: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
      boardPattern: 'diamond-pattern',
      fontFamily: 'Cormorant Garamond',
      fontSize: 'large',
      brightness: 'very_bright',
      sounds: this.getPremiumSounds(),
      animations: true,
      effects: ['crystal-shine', 'rainbow-reflections', 'sparkles'],
      previewImage: '/themes/premium-diamond.jpg',
      price: 1000, // coins
      unlocked: false,
    });

    // Tema Premium Platinum
    this.themes.set('premium_platinum', {
      id: 'premium_platinum',
      name: 'premium_platinum',
      displayName: 'Premium Platinum',
      description: 'Elegancia metálica premium',
      isPremium: true,
      tileColors: {
        red: '#DC2626',
        blue: '#2563EB',
        yellow: '#F59E0B',
        black: '#1F2937',
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        border: '#9CA3AF',
        text: '#111827',
        joker: '#6B7280',
      },
      tileDesign: 'premium_metallic',
      boardBackground: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
      boardPattern: 'platinum-pattern',
      fontFamily: 'Roboto',
      fontSize: 'large',
      brightness: 'bright',
      sounds: this.getPremiumSounds(),
      animations: true,
      effects: ['metallic-shine', 'chrome-reflections', 'premium-glow'],
      previewImage: '/themes/premium-platinum.jpg',
      price: 2000, // coins
      unlocked: false,
    });

    // Agregar más temas...
    this.addMoreThemes();
  }

  // Agregar más temas
  private addMoreThemes(): void {
    // Tema Neon
    this.themes.set('neon', {
      id: 'neon',
      name: 'neon',
      displayName: 'Neon',
      description: 'Colores vibrantes con efecto neón',
      isPremium: false,
      tileColors: {
        red: '#FF0080',
        blue: '#00FFFF',
        yellow: '#FFFF00',
        black: '#000000',
        background: '#0A0A0A',
        border: '#FF00FF',
        text: '#FFFFFF',
        joker: '#FF00FF',
      },
      tileDesign: 'neon_glow',
      boardBackground: '#0A0A0A',
      fontFamily: 'Orbitron',
      fontSize: 'medium',
      brightness: 'dark',
      sounds: this.getDefaultSounds(),
      animations: true,
      effects: ['neon-glow', 'pulse'],
      unlocked: true,
    });
  }

  // Inicializar niveles Premium
  private initializePremiumTiers(): void {
    this.premiumTiers = [
      {
        name: 'basic',
        displayName: 'Básico',
        price: {
          monthly: 0,
          yearly: 0,
          lifetime: 0,
        },
        features: [
          'Temas básicos',
          'Diseños estándar',
          'Sonidos básicos',
        ],
        themes: ['classic', 'modern', 'dark', 'neon'],
        tileDesigns: ['standard', 'rounded', 'sharp'],
        prioritySupport: false,
        exclusiveContent: false,
        adFree: false,
        earlyAccess: false,
      },
      {
        name: 'premium',
        displayName: 'Premium',
        price: {
          monthly: 499, // coins
          yearly: 4999,
          lifetime: 19999,
        },
        features: [
          'Todos los temas básicos',
          'Temas premium exclusivos',
          'Diseños avanzados',
          'Sin anuncios',
          'Soporte prioritario',
        ],
        themes: ['classic', 'modern', 'dark', 'neon', 'premium_gold'],
        tileDesigns: ['standard', 'rounded', 'sharp', 'glossy', 'premium_3d'],
        prioritySupport: true,
        exclusiveContent: true,
        adFree: true,
        earlyAccess: false,
      },
      {
        name: 'premium_plus',
        displayName: 'Premium Plus',
        price: {
          monthly: 999,
          yearly: 9999,
          lifetime: 39999,
        },
        features: [
          'Todo Premium',
          'Todos los temas premium',
          'Diseños exclusivos',
          'Efectos especiales',
          'Acceso anticipado',
        ],
        themes: ['classic', 'modern', 'dark', 'neon', 'premium_gold', 'premium_diamond'],
        tileDesigns: ['standard', 'rounded', 'sharp', 'glossy', 'premium_3d', 'premium_crystal'],
        prioritySupport: true,
        exclusiveContent: true,
        adFree: true,
        earlyAccess: true,
      },
      {
        name: 'premium_3.0',
        displayName: 'Premium 3.0',
        description: 'La experiencia definitiva',
        price: {
          monthly: 1999,
          yearly: 19999,
          lifetime: 79999,
        },
        features: [
          'Todo Premium Plus',
          'Todos los temas y diseños',
          'Personalización completa',
          'Efectos únicos',
          'Soporte VIP 24/7',
          'NFTs exclusivos',
          'Tokens de recompensa',
        ],
        themes: ['classic', 'modern', 'dark', 'neon', 'premium_gold', 'premium_diamond', 'premium_platinum'],
        tileDesigns: ['standard', 'rounded', 'sharp', 'glossy', 'premium_3d', 'premium_crystal', 'premium_metallic'],
        prioritySupport: true,
        exclusiveContent: true,
        adFree: true,
        earlyAccess: true,
      },
    ];
  }

  // Obtener tema
  getTheme(themeName: ThemeName): Theme | undefined {
    return this.themes.get(themeName);
  }

  // Obtener todos los temas
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  // Obtener temas disponibles para usuario
  async getAvailableThemes(userId: string): Promise<Theme[]> {
    // const user = await UserModel.findById(userId);
    // const userTier = user?.premiumTier || 'basic';
    // const tier = this.premiumTiers.find((t) => t.name === userTier);
    
    // const availableThemes = tier?.themes || [];
    // return this.getAllThemes().filter((theme) => 
    //   !theme.isPremium || availableThemes.includes(theme.name)
    // );

    return this.getAllThemes();
  }

  // Desbloquear tema
  async unlockTheme(userId: string, themeName: ThemeName): Promise<boolean> {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw new Error('Tema no encontrado');
    }

    // Si es gratis, ya está desbloqueado
    if (!theme.isPremium) {
      return true;
    }

    // Verificar si el usuario tiene Premium
    // const user = await UserModel.findById(userId);
    // const userTier = user?.premiumTier || 'basic';
    // const tier = this.premiumTiers.find((t) => t.name === userTier);
    
    // if (tier?.themes.includes(themeName)) {
    //   return true;
    // }

    // Si tiene precio, comprar
    // if (theme.price) {
    //   if (user.coins >= theme.price) {
    //     await UserModel.updateOne(
    //       { id: userId },
    //       { $inc: { coins: -theme.price } }
    //     );
    //     // Agregar a temas desbloqueados
    //     await UserThemeSettingsModel.updateOne(
    //       { userId },
    //       { $addToSet: { unlockedThemes: themeName } },
    //       { upsert: true }
    //     );
    //     return true;
    // } else {
    //     throw new Error('Fondos insuficientes');
    //   }
    // }

    return false;
  }

  // Personalizar colores de fichas
  async customizeTileColors(
    userId: string,
    colors: Partial<TileColorScheme>
  ): Promise<UserThemeSettings> {
    // const settings = await UserThemeSettingsModel.findOne({ userId });
    // if (!settings) {
    //   throw new Error('Configuración no encontrada');
    // }

    // Actualizar colores personalizados
    // await UserThemeSettingsModel.updateOne(
    //   { userId },
    //   {
    //     $set: {
    //       customTileColors: { ...settings.customTileColors, ...colors },
    //       lastUpdated: new Date(),
    //     },
    //   }
    // );

    // return await this.getUserThemeSettings(userId);
    throw new Error('Not implemented');
  }

  // Actualizar configuración de tema
  async updateThemeSettings(
    userId: string,
    settings: Partial<UserThemeSettings>
  ): Promise<UserThemeSettings> {
    // await UserThemeSettingsModel.updateOne(
    //   { userId },
    //   {
    //     $set: {
    //       ...settings,
    //       lastUpdated: new Date(),
    //     },
    //   },
    //   { upsert: true }
    // );

    // return await this.getUserThemeSettings(userId);
    throw new Error('Not implemented');
  }

  // Obtener configuración de tema del usuario
  async getUserThemeSettings(userId: string): Promise<UserThemeSettings> {
    // const settings = await UserThemeSettingsModel.findOne({ userId });
    // if (settings) {
    //   return settings;
    // }

    // Crear configuración por defecto
    const defaultSettings: UserThemeSettings = {
      userId,
      activeTheme: 'classic',
      tileDesign: 'standard',
      fontSize: 'medium',
      brightness: 'normal',
      sounds: this.getDefaultSounds(),
      animations: false,
      effects: [],
      unlockedThemes: ['classic', 'modern', 'dark', 'neon'],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    // await UserThemeSettingsModel.create(defaultSettings);
    return defaultSettings;
  }

  // Obtener niveles Premium
  getPremiumTiers(): PremiumTier[] {
    return this.premiumTiers;
  }

  // Sonidos por defecto
  private getDefaultSounds() {
    return {
      tilePlace: '/sounds/tile-place.mp3',
      tilePick: '/sounds/tile-pick.mp3',
      gameStart: '/sounds/game-start.mp3',
      gameEnd: '/sounds/game-end.mp3',
      win: '/sounds/win.mp3',
      lose: '/sounds/lose.mp3',
      error: '/sounds/error.mp3',
      notification: '/sounds/notification.mp3',
      volume: 70,
    };
  }

  // Sonidos premium
  private getPremiumSounds() {
    return {
      tilePlace: '/sounds/premium/tile-place.mp3',
      tilePick: '/sounds/premium/tile-pick.mp3',
      gameStart: '/sounds/premium/game-start.mp3',
      gameEnd: '/sounds/premium/game-end.mp3',
      win: '/sounds/premium/win.mp3',
      lose: '/sounds/premium/lose.mp3',
      error: '/sounds/premium/error.mp3',
      notification: '/sounds/premium/notification.mp3',
      backgroundMusic: '/sounds/premium/background.mp3',
      volume: 80,
    };
  }
}

export const themeService = new ThemeService();

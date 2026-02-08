import React, { useState, useEffect } from 'react';
import { Palette, Type, Sun, Volume2, Sparkles, Lock, Unlock } from 'lucide-react';
import { Theme, ThemeName, TileDesign, FontSize, Brightness, TileColorScheme } from '../../../shared/themeTypes';

interface ThemeCustomizerProps {
  userId: string;
  onSave: (settings: any) => void;
}

export default function ThemeCustomizer({ userId, onSave }: ThemeCustomizerProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeName>('classic');
  const [tileDesign, setTileDesign] = useState<TileDesign>('standard');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [brightness, setBrightness] = useState<Brightness>('normal');
  const [volume, setVolume] = useState(70);
  const [animations, setAnimations] = useState(true);
  const [customColors, setCustomColors] = useState<Partial<TileColorScheme>>({});
  const [themes, setThemes] = useState<Theme[]>([]);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const response = await fetch(`/api/themes/available?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setThemes(data.themes);
        if (data.themes.length > 0) {
          setActiveTheme(data.themes[0].name);
          setPreviewTheme(data.themes[0]);
        }
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const handleThemeChange = (themeName: ThemeName) => {
    const theme = themes.find((t) => t.name === themeName);
    if (theme) {
      setActiveTheme(themeName);
      setPreviewTheme(theme);
      setTileDesign(theme.tileDesign);
      setFontSize(theme.fontSize);
      setBrightness(theme.brightness);
    }
  };

  const handleColorChange = (colorKey: keyof TileColorScheme, value: string) => {
    setCustomColors({
      ...customColors,
      [colorKey]: value,
    });
  };

  const handleSave = () => {
    onSave({
      activeTheme,
      tileDesign,
      fontSize,
      brightness,
      volume,
      animations,
      customColors,
    });
  };

  const fontSizeOptions: { value: FontSize; label: string; size: string }[] = [
    { value: 'small', label: 'Pequeña', size: '0.875rem' },
    { value: 'medium', label: 'Mediana', size: '1rem' },
    { value: 'large', label: 'Grande', size: '1.25rem' },
    { value: 'extra_large', label: 'Extra Grande', size: '1.5rem' },
  ];

  const brightnessOptions: { value: Brightness; label: string; icon: string }[] = [
    { value: 'dark', label: 'Oscuro', icon: '🌙' },
    { value: 'normal', label: 'Normal', icon: '☀️' },
    { value: 'bright', label: 'Brillante', icon: '✨' },
    { value: 'very_bright', label: 'Muy Brillante', icon: '💡' },
  ];

  const tileDesigns: { value: TileDesign; label: string; premium?: boolean }[] = [
    { value: 'standard', label: 'Estándar' },
    { value: 'rounded', label: 'Redondeado' },
    { value: 'sharp', label: 'Puntiagudo' },
    { value: 'glossy', label: 'Brillante', premium: true },
    { value: 'neon_glow', label: 'Neón', premium: true },
    { value: 'gradient', label: 'Gradiente', premium: true },
    { value: 'premium_3d', label: '3D Premium', premium: true },
    { value: 'premium_crystal', label: 'Cristal Premium', premium: true },
    { value: 'premium_metallic', label: 'Metálico Premium', premium: true },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 max-w-6xl mx-auto shadow-2xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Personalización de Tema</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Panel de Temas */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Palette size={24} />
              Temas Disponibles
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.name)}
                  className={`relative p-4 rounded-xl border-2 transition ${
                    activeTheme === theme.name
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${theme.isPremium && !theme.unlocked ? 'opacity-60' : ''}`}
                >
                  {theme.isPremium && (
                    <div className="absolute top-2 right-2">
                      {theme.unlocked ? (
                        <Unlock size={16} className="text-yellow-500" />
                      ) : (
                        <Lock size={16} className="text-gray-400" />
                      )}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-semibold">{theme.displayName}</div>
                    <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
                    {theme.isPremium && !theme.unlocked && theme.price && (
                      <div className="text-sm font-bold text-yellow-600 mt-2">
                        {theme.price} coins
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Diseño de Fichas */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Diseño de Fichas</h3>
            <div className="grid grid-cols-3 gap-3">
              {tileDesigns.map((design) => (
                <button
                  key={design.value}
                  onClick={() => setTileDesign(design.value)}
                  className={`p-3 rounded-lg border-2 transition ${
                    tileDesign === design.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${design.premium ? 'relative' : ''}`}
                >
                  {design.premium && (
                    <span className="absolute top-1 right-1 text-xs bg-yellow-500 text-white px-1 rounded">
                      ⭐
                    </span>
                  )}
                  <div className="text-sm font-medium">{design.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de Configuración */}
        <div className="space-y-6">
          {/* Tamaño de Fuente */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Type size={24} />
              Tamaño de Fuente
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={`p-4 rounded-lg border-2 transition ${
                    fontSize === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold" style={{ fontSize: option.size }}>
                      Aa
                    </div>
                    <div className="text-xs mt-2">{option.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Brillo */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sun size={24} />
              Brillo
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {brightnessOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBrightness(option.value)}
                  className={`p-4 rounded-lg border-2 transition ${
                    brightness === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="text-xs">{option.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Colores Personalizados */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Colores de Fichas</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['red', 'blue', 'yellow', 'black'] as const).map((color) => (
                <div key={color}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {color}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customColors[color] || previewTheme?.tileColors[color] || '#000000'}
                      onChange={(e) => handleColorChange(color, e.target.value)}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColors[color] || previewTheme?.tileColors[color] || ''}
                      onChange={(e) => handleColorChange(color, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sonido */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Volume2 size={24} />
              Volumen de Sonido
            </h3>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>0%</span>
                <span className="font-bold">{volume}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Animaciones */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles size={24} />
              Efectos
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="animations"
                checked={animations}
                onChange={(e) => setAnimations(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="animations" className="text-sm text-gray-700">
                Activar animaciones y efectos
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Settings, Clock, Coins, Users, Lock, Trophy } from 'lucide-react';
import { CustomGameSettings } from '../../../shared/types';

interface CustomGameSettingsProps {
  onSave: (settings: CustomGameSettings) => void;
  onCancel: () => void;
}

export default function CustomGameSettingsComponent({
  onSave,
  onCancel,
}: CustomGameSettingsProps) {
  const [settings, setSettings] = useState<CustomGameSettings>({
    betType: 'none',
    betAmount: 100,
    useRealTokens: false,
    timePerMove: 15,
    initialTiles: 14,
    allowJokers: true,
    minInitialScore: 30,
    prizeDistribution: {
      winner: 100,
    },
    maxPlayers: 4,
    allowRearrange: true,
    private: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validar tiempo por jugada
    if (settings.timePerMove < 10 || settings.timePerMove > 30) {
      newErrors.timePerMove = 'El tiempo debe estar entre 10 y 30 segundos';
    }

    // Validar apuesta
    if (settings.betType !== 'none') {
      if (settings.betAmount < 10 || settings.betAmount > 1000000) {
        newErrors.betAmount = 'La apuesta debe estar entre 10 y 1,000,000';
      }
    }

    // Validar distribución de premios
    const totalPercentage =
      (settings.prizeDistribution.winner || 0) +
      (settings.prizeDistribution.second || 0) +
      (settings.prizeDistribution.third || 0);
    if (totalPercentage > 100) {
      newErrors.prizeDistribution = 'La suma no puede exceder 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(settings);
    }
  };

  const calculatePrizePool = () => {
    if (settings.betType === 'none') return 0;
    return settings.maxPlayers * settings.betAmount;
  };

  const calculatePrizes = () => {
    const pool = calculatePrizePool();
    return {
      winner: (pool * (settings.prizeDistribution.winner || 0)) / 100,
      second: settings.prizeDistribution.second
        ? (pool * settings.prizeDistribution.second) / 100
        : 0,
      third: settings.prizeDistribution.third
        ? (pool * settings.prizeDistribution.third) / 100
        : 0,
    };
  };

  const prizes = calculatePrizes();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Settings size={32} />
            Configuración Personalizada
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Configuración de Tiempo */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={24} className="text-blue-600" />
              Tiempo por Jugada
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segundos por jugada: {settings.timePerMove}s
                </label>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={settings.timePerMove}
                  onChange={(e) =>
                    setSettings({ ...settings, timePerMove: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10s (Rápido)</span>
                  <span>30s (Relajado)</span>
                </div>
                {errors.timePerMove && (
                  <p className="text-red-500 text-sm mt-1">{errors.timePerMove}</p>
                )}
              </div>
            </div>
          </div>

          {/* Configuración de Apuestas */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Coins size={24} className="text-green-600" />
              Sistema de Apuestas
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Apuesta
                </label>
                <select
                  value={settings.betType}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      betType: e.target.value as 'coins' | 'tokens' | 'none',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="none">Sin apuestas</option>
                  <option value="coins">Coins del juego</option>
                  <option value="tokens">Tokens (convertibles)</option>
                </select>
              </div>

              {settings.betType !== 'none' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad por jugador: {settings.betAmount.toLocaleString()}
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000000"
                      value={settings.betAmount}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          betAmount: parseInt(e.target.value) || 10,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Mínimo: 10</span>
                      <span>Máximo: 1,000,000</span>
                    </div>
                    {errors.betAmount && (
                      <p className="text-red-500 text-sm mt-1">{errors.betAmount}</p>
                    )}
                  </div>

                  {settings.betType === 'tokens' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useRealTokens"
                        checked={settings.useRealTokens}
                        onChange={(e) =>
                          setSettings({ ...settings, useRealTokens: e.target.checked })
                        }
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="useRealTokens" className="text-sm text-gray-700">
                        Usar tokens reales convertibles (RUM)
                      </label>
                    </div>
                  )}

                  {/* Vista previa de premios */}
                  <div className="bg-white rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Trophy size={20} className="text-yellow-500" />
                      Pool de Premios
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Pool total:</span>
                        <span className="font-bold">
                          {calculatePrizePool().toLocaleString()}{' '}
                          {settings.betType === 'coins' ? 'coins' : 'tokens'}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>🥇 Ganador:</span>
                        <span className="font-bold">{prizes.winner.toLocaleString()}</span>
                      </div>
                      {settings.prizeDistribution.second && (
                        <div className="flex justify-between text-gray-600">
                          <span>🥈 Segundo:</span>
                          <span className="font-bold">{prizes.second.toLocaleString()}</span>
                        </div>
                      )}
                      {settings.prizeDistribution.third && (
                        <div className="flex justify-between text-amber-600">
                          <span>🥉 Tercero:</span>
                          <span className="font-bold">{prizes.third.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Configuración de Premios */}
          {settings.betType !== 'none' && (
            <div className="bg-yellow-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy size={24} className="text-yellow-600" />
                Distribución de Premios (%)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ganador: {settings.prizeDistribution.winner}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.prizeDistribution.winner}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        prizeDistribution: {
                          ...settings.prizeDistribution,
                          winner: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segundo lugar: {settings.prizeDistribution.second || 0}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.prizeDistribution.second || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        prizeDistribution: {
                          ...settings.prizeDistribution,
                          second: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tercer lugar: {settings.prizeDistribution.third || 0}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.prizeDistribution.third || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        prizeDistribution: {
                          ...settings.prizeDistribution,
                          third: parseInt(e.target.value) || undefined,
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
                {errors.prizeDistribution && (
                  <p className="text-red-500 text-sm">{errors.prizeDistribution}</p>
                )}
              </div>
            </div>
          )}

          {/* Configuración de Jugadores */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={24} className="text-purple-600" />
              Jugadores
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de jugadores: {settings.maxPlayers}
                </label>
                <select
                  value={settings.maxPlayers}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxPlayers: parseInt(e.target.value) as 2 | 3 | 4,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={2}>2 jugadores</option>
                  <option value={3}>3 jugadores</option>
                  <option value={4}>4 jugadores</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={settings.private}
                  onChange={(e) =>
                    setSettings({ ...settings, private: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="private" className="text-sm text-gray-700 flex items-center gap-2">
                  <Lock size={16} />
                  Sala privada
                </label>
              </div>

              {settings.private && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={settings.password || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Contraseña de la sala"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
          >
            Crear Sala
          </button>
        </div>
      </div>
    </div>
  );
}

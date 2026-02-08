// Tipos compartidos entre frontend y backend

export type Color = 'red' | 'blue' | 'yellow' | 'black';
export type TileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type GameMode = 'classic' | 'fast' | 'tournament' | 'practice';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// Fichas y Juego
export interface Tile {
  id: string;
  value: TileValue;
  color: Color;
  isJoker: boolean;
  nftId?: string; // Para NFTs especiales
}

export interface GameSet {
  id: string;
  tiles: Tile[];
  type: 'group' | 'run';
  playerId?: string;
}

export interface Player {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  tiles: Tile[];
  score: number;
  isBot?: boolean;
  difficulty?: DifficultyLevel;
  /** True after the player has placed their first meld (e.g. >= 30 points). */
  hasMadeInitialMeld?: boolean;
}

export interface Game {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  pool: Tile[];
  board: GameSet[];
  gameMode: GameMode;
  status: 'waiting' | 'playing' | 'finished' | 'paused';
  winnerId?: string;
  startedAt?: Date;
  endedAt?: Date;
  chat?: ChatMessage[];
}

// Room and custom game settings (shared by frontend and backend)
export interface GameRoomSettings {
  maxPlayers: 2 | 3 | 4;
  gameMode: GameMode;
  timeLimit?: number; // seconds, undefined = no limit
  initialTiles: number;
  allowJokers: boolean;
  minInitialScore: number;
  allowRearrange: boolean;
  customRules?: Record<string, unknown>;
}

export interface CustomGameSettings {
  betType: 'coins' | 'tokens' | 'none';
  betAmount: number; // 10 to 1,000,000
  useRealTokens: boolean;
  timePerMove: number; // 10 to 30 seconds
  timePerGame?: number;
  timeWarning?: number;
  initialTiles: number;
  allowJokers: boolean;
  minInitialScore: number;
  prizeDistribution: {
    winner: number;
    second?: number;
    third?: number;
  };
  maxPlayers: 2 | 3 | 4;
  allowRearrange: boolean;
  private: boolean;
  password?: string;
}

// Move and validation (game engine)
export type MoveType = 'meld' | 'manipulate' | 'draw' | 'end_turn';

export interface Move {
  type: MoveType;
  sets?: GameSet[];
  drawnTileId?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  game?: Game;
}

// Chat
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'emoji' | 'sticker' | 'system';
  gameId?: string;
}

// Usuario
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  avatar?: string;
  level: number;
  experience: number;
  coins: number; // RumiCoins
  gems?: number; // RumiGems (premium currency)
  rumTokens: number; // RUM Token (cripto)
  walletAddress?: string;
  premium: boolean;
  premiumExpiresAt?: Date;
  createdAt: Date;
  lastLoginAt?: Date;
  stats: UserStats;
  achievements: Achievement[];
  friends: string[];
  blockedUsers: string[];
  partnerCode?: string; // Código de partner/afiliado
  referredBy?: string; // Usuario que lo refirió
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalScore: number;
  tournamentsWon: number;
  longestStreak: number;
  currentStreak: number;
  bestRank: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// User-created tournaments (Step 17)
export type TournamentStatus = 'draft' | 'open' | 'in_progress' | 'finished';

export interface TournamentRulesetDto {
  id: string;
  allowJokers: boolean;
  tilesPerPlayer: number;
  turnTimeSeconds: number;
  maxPlayers: number;
  customName?: string | null;
}

export interface TournamentParticipantDto {
  userId: string;
  username: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  paidEntryFee: number;
  joinedAt: Date;
}

export interface TournamentWithDetailsDto {
  id: string;
  creatorUserId: string;
  creatorUsername: string;
  name: string;
  status: TournamentStatus;
  maxPlayers: number;
  entryFee: number;
  prizePool: number;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  ruleset: TournamentRulesetDto | null;
  participants: TournamentParticipantDto[];
  participantCount: number;
}

// Torneos (legacy/future)
export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  status: 'upcoming' | 'registration' | 'active' | 'finished';
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number; // En coins o tokens
  prizePool: PrizePool;
  bracket?: TournamentBracket;
  startDate: Date;
  endDate?: Date;
  rules: TournamentRules;
}

export interface PrizePool {
  total: number; // En coins o tokens
  distribution: {
    position: number;
    amount: number;
    percentage: number;
  }[];
}

export interface TournamentRules {
  maxPlayers: number;
  gameMode: GameMode;
  timeLimit?: number; // En segundos
  maxGames: number;
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  currentRound: number;
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  players: string[];
  winnerId?: string;
  gameId?: string;
  status: 'pending' | 'in_progress' | 'finished';
}

// Partners y Afiliados
export interface Partner {
  id: string;
  code: string;
  name: string;
  type: 'youtube' | 'telegram' | 'twitter' | 'instagram' | 'other';
  socialLinks: {
    youtube?: string;
    telegram?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  referralRate: number; // Porcentaje de comisión
  totalReferrals: number;
  totalEarnings: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
}

export interface PartnerReward {
  id: string;
  partnerId: string;
  userId: string;
  amount: number;
  type: 'referral' | 'purchase' | 'tournament';
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
}

// NFTs y Cripto
export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  ownerId: string;
  name: string;
  description: string;
  image: string;
  attributes: {
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    tileSet?: string;
    specialEffects?: string[];
  };
  price?: number; // En ETH o RUM
  forSale: boolean;
  createdAt: Date;
}

export interface CryptoTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'sale' | 'reward' | 'withdrawal' | 'deposit';
  amount: number;
  currency: 'RUM' | 'ETH' | 'USDT' | 'BTC';
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
}

// Compras en Tienda
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'tiles' | 'avatars' | 'themes' | 'boosters' | 'coins' | 'premium';
  price: number;
  currency: 'coins' | 'tokens' | 'fiat';
  cryptoPrice?: {
    currency: 'ETH' | 'USDT' | 'BTC';
    amount: number;
  };
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  available: boolean;
  limitedEdition?: boolean;
  stock?: number;
}

export interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  amount: number;
  currency: string;
  paymentMethod: 'coins' | 'tokens' | 'crypto' | 'fiat';
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// Social Media Integration
export interface SocialPost {
  id: string;
  platform: 'youtube' | 'telegram' | 'twitter' | 'instagram';
  type: 'tutorial' | 'tournament' | 'community' | 'announcement';
  title: string;
  content: string;
  url: string;
  thumbnail?: string;
  publishedAt: Date;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

// Configuración de Community
export interface CommunityConfig {
  youtube: {
    channelId: string;
    apiKey: string;
    enabled: boolean;
  };
  telegram: {
    botToken: string;
    channelId: string;
    groupId: string;
    enabled: boolean;
  };
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    enabled: boolean;
  };
  instagram: {
    apiKey: string;
    enabled: boolean;
  };
}

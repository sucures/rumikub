// Tipos compartidos entre frontend y backend (backend copy for type-checking)

export type Color = 'red' | 'blue' | 'yellow' | 'black';
export type TileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type GameMode = 'classic' | 'fast' | 'tournament' | 'practice';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface Tile {
  id: string;
  value: TileValue;
  color: Color;
  isJoker: boolean;
  nftId?: string;
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

export interface GameRoomSettings {
  maxPlayers: 2 | 3 | 4;
  gameMode: GameMode;
  timeLimit?: number;
  initialTiles: number;
  allowJokers: boolean;
  minInitialScore: number;
  allowRearrange: boolean;
  customRules?: Record<string, unknown>;
}

export interface CustomGameSettings {
  betType: 'coins' | 'tokens' | 'none';
  betAmount: number;
  useRealTokens: boolean;
  timePerMove: number;
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

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  avatar?: string;
  level: number;
  experience: number;
  coins: number;
  gems?: number;
  rumTokens: number;
  walletAddress?: string;
  premium: boolean;
  premiumExpiresAt?: Date;
  createdAt: Date;
  lastLoginAt?: Date;
  stats: UserStats;
  achievements: Achievement[];
  friends: string[];
  blockedUsers: string[];
  partnerCode?: string;
  referralCode?: string;
  referredBy?: string;
  referralsCount?: number;
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

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  status: 'upcoming' | 'registration' | 'active' | 'finished';
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: PrizePool;
  bracket?: TournamentBracket;
  startDate: Date;
  endDate?: Date;
  rules: TournamentRules;
}

export interface PrizePool {
  total: number;
  distribution: {
    position: number;
    amount: number;
    percentage: number;
  }[];
}

export interface TournamentRules {
  maxPlayers: number;
  gameMode: GameMode;
  timeLimit?: number;
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
  referralRate: number;
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
  price?: number;
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

export interface CommunityConfig {
  youtube: { channelId: string; apiKey: string; enabled: boolean };
  telegram: { botToken: string; channelId: string; groupId: string; enabled: boolean };
  twitter: { apiKey: string; apiSecret: string; accessToken: string; enabled: boolean };
  instagram: { apiKey: string; enabled: boolean };
}

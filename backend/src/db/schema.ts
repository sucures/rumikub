import { pgTable, text, timestamp, integer, boolean, jsonb, date, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  country: text('country'),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  coins: integer('coins').notNull().default(100),
  gems: integer('gems').notNull().default(0),
  rumTokens: integer('rum_tokens').notNull().default(0),
  premium: boolean('premium').notNull().default(false),
  stats: jsonb('stats').$type<{
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    totalScore: number;
    tournamentsWon: number;
    longestStreak: number;
    currentStreak: number;
    bestRank: number;
  }>().notNull().default({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    totalScore: 0,
    tournamentsWon: 0,
    longestStreak: 0,
    currentStreak: 0,
    bestRank: 0,
  }),
  referredBy: text('referred_by'),
  referralCode: text('referral_code').unique(),
  referralsCount: integer('referrals_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

// Tournament tables (Step 17)
export const tournamentRulesets = pgTable('tournament_rulesets', {
  id: text('id').primaryKey(),
  allowJokers: boolean('allow_jokers').notNull().default(true),
  tilesPerPlayer: integer('tiles_per_player').notNull().default(14),
  turnTimeSeconds: integer('turn_time_seconds').notNull().default(60),
  maxPlayers: integer('max_players').notNull().default(4),
  customName: text('custom_name'),
});

export const tournaments = pgTable('tournaments', {
  id: text('id').primaryKey(),
  creatorUserId: text('creator_user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'), // draft | open | in_progress | finished
  maxPlayers: integer('max_players').notNull().default(4),
  entryFee: integer('entry_fee').notNull().default(0), // coins/tokens
  prizePool: integer('prize_pool').notNull().default(0),
  rulesetId: text('ruleset_id').references(() => tournamentRulesets.id),
  isPrivate: boolean('is_private').notNull().default(false),
  scheduledStartAt: timestamp('scheduled_start_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentEntries = pgTable('tournament_entries', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id),
  userId: text('user_id').notNull().references(() => users.id),
  paidEntryFee: integer('paid_entry_fee').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentChatMessages = pgTable('tournament_chat_messages', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id),
  userId: text('user_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TournamentRulesetRow = typeof tournamentRulesets.$inferSelect;
export type NewTournamentRulesetRow = typeof tournamentRulesets.$inferInsert;
export type TournamentRow = typeof tournaments.$inferSelect;
export type NewTournamentRow = typeof tournaments.$inferInsert;
export type TournamentEntryRow = typeof tournamentEntries.$inferSelect;
export type NewTournamentEntryRow = typeof tournamentEntries.$inferInsert;
export type TournamentChatMessageRow = typeof tournamentChatMessages.$inferSelect;
export type NewTournamentChatMessageRow = typeof tournamentChatMessages.$inferInsert;

// Tournament gameplay (Step 19)
export const tournamentRounds = pgTable('tournament_rounds', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id),
  roundNumber: integer('round_number').notNull(),
  status: text('status').notNull().default('pending'), // pending | in_progress | finished
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentMatches = pgTable('tournament_matches', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id),
  roundNumber: integer('round_number').notNull(),
  tableNumber: integer('table_number').notNull().default(1),
  player1Id: text('player1_id').references(() => users.id),
  player2Id: text('player2_id').references(() => users.id),
  winnerId: text('winner_id').references(() => users.id),
  gameId: text('game_id'),
  status: text('status').notNull().default('pending'), // pending | in_progress | finished
  matchReadyNotifiedAt: timestamp('match_ready_notified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentResults = pgTable('tournament_results', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id),
  userId: text('user_id').notNull().references(() => users.id),
  position: integer('position').notNull(),
  rewardCoins: integer('reward_coins').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TournamentRoundRow = typeof tournamentRounds.$inferSelect;
export type NewTournamentRoundRow = typeof tournamentRounds.$inferInsert;
export type TournamentMatchRow = typeof tournamentMatches.$inferSelect;
export type NewTournamentMatchRow = typeof tournamentMatches.$inferInsert;
export type TournamentResultRow = typeof tournamentResults.$inferSelect;
export type NewTournamentResultRow = typeof tournamentResults.$inferInsert;

// Token economy (Step 18)
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // earn | spend | admin | purchase | reward
  currency: text('currency').notNull(), // coins | gems
  amount: integer('amount').notNull(),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const storeItems = pgTable('store_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // coins_pack | gems_pack | skin | ticket
  priceGems: integer('price_gems'),
  priceCoins: integer('price_coins'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});

export const purchases = pgTable('purchases', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  itemId: text('item_id').notNull().references(() => storeItems.id),
  amount: integer('amount').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
export type StoreItemRow = typeof storeItems.$inferSelect;
export type NewStoreItemRow = typeof storeItems.$inferInsert;
export type PurchaseRow = typeof purchases.$inferSelect;
export type NewPurchaseRow = typeof purchases.$inferInsert;

// Referral system (Step 20)
export const referralRewards = pgTable('referral_rewards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  referredUserId: text('referred_user_id').notNull().references(() => users.id),
  rewardCoins: integer('reward_coins').notNull().default(0),
  rewardGems: integer('reward_gems').notNull().default(0),
  rewardNotifiedAt: timestamp('reward_notified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const referralClicks = pgTable('referral_clicks', {
  id: text('id').primaryKey(),
  referralCode: text('referral_code').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ReferralRewardRow = typeof referralRewards.$inferSelect;
export type NewReferralRewardRow = typeof referralRewards.$inferInsert;
export type ReferralClickRow = typeof referralClicks.$inferSelect;
export type NewReferralClickRow = typeof referralClicks.$inferInsert;

// User profiles & friends (Step 21)
export const friends = pgTable('friends', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  friendId: text('friend_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // pending | accepted | blocked
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const follows = pgTable('follows', {
  id: text('id').primaryKey(),
  followerId: text('follower_id').notNull().references(() => users.id),
  followingId: text('following_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type FriendRow = typeof friends.$inferSelect;
export type NewFriendRow = typeof friends.$inferInsert;
export type FollowRow = typeof follows.$inferSelect;
export type NewFollowRow = typeof follows.$inferInsert;

// Marketplace (Step 24) — cosmetic items, inventory, loadout
export const cosmeticItems = pgTable('cosmetic_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // skin | board | tiles | effect
  rarity: text('rarity').notNull().default('common'), // common | rare | epic | legendary
  priceCoins: integer('price_coins').notNull().default(0),
  priceGems: integer('price_gems').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  isLimited: boolean('is_limited').notNull().default(false),
  availableFrom: timestamp('available_from', { withTimezone: true }),
  availableTo: timestamp('available_to', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userInventory = pgTable('user_inventory', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  itemId: text('item_id').notNull().references(() => cosmeticItems.id),
  acquiredAt: timestamp('acquired_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userLoadout = pgTable('user_loadout', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id).unique(),
  skinId: text('skin_id').references(() => cosmeticItems.id),
  boardId: text('board_id').references(() => cosmeticItems.id),
  tilesId: text('tiles_id').references(() => cosmeticItems.id),
  effectId: text('effect_id').references(() => cosmeticItems.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CosmeticItemRow = typeof cosmeticItems.$inferSelect;
export type NewCosmeticItemRow = typeof cosmeticItems.$inferInsert;
export type UserInventoryRow = typeof userInventory.$inferSelect;
export type NewUserInventoryRow = typeof userInventory.$inferInsert;
export type UserLoadoutRow = typeof userLoadout.$inferSelect;
export type NewUserLoadoutRow = typeof userLoadout.$inferInsert;

// Anti-cheat & fair play (Step 25)
export const gameActionLogs = pgTable('game_action_logs', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull(),
  matchId: text('match_id'),
  userId: text('user_id').notNull().references(() => users.id),
  actionType: text('action_type').notNull(), // move | meld | manipulate | draw | end_turn
  actionPayload: jsonb('action_payload').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const suspiciousEvents = pgTable('suspicious_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  gameId: text('game_id'),
  matchId: text('match_id'),
  eventType: text('event_type').notNull(), // invalid_move | speed_abuse | collusion | multi_account
  severity: text('severity').notNull(), // low | medium | high
  details: jsonb('details').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userReputation = pgTable('user_reputation', {
  userId: text('user_id').primaryKey().references(() => users.id),
  score: integer('score').notNull().default(100),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
});

export type GameActionLogRow = typeof gameActionLogs.$inferSelect;
export type NewGameActionLogRow = typeof gameActionLogs.$inferInsert;
export type SuspiciousEventRow = typeof suspiciousEvents.$inferSelect;
export type NewSuspiciousEventRow = typeof suspiciousEvents.$inferInsert;
export type UserReputationRow = typeof userReputation.$inferSelect;
export type NewUserReputationRow = typeof userReputation.$inferInsert;

// Notifications (Step 26)
export const notificationTypes = [
  'friend_request',
  'tournament_start',
  'match_ready',
  'club_invite',
  'referral_reward',
  'system',
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').$type<NotificationType>().notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pushTokens = pgTable('push_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  deviceInfo: jsonb('device_info').$type<Record<string, unknown>>().default({}),
  invalidAt: timestamp('invalid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Scheduler: scheduled system announcements
export const scheduledAnnouncements = pgTable('scheduled_announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
export type PushTokenRow = typeof pushTokens.$inferSelect;
export type NewPushTokenRow = typeof pushTokens.$inferInsert;
export type ScheduledAnnouncementRow = typeof scheduledAnnouncements.$inferSelect;
export type NewScheduledAnnouncementRow = typeof scheduledAnnouncements.$inferInsert;

// Daily motivation (Step 31)
export const dailyMotivation = pgTable('daily_motivation', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  date: date('date', { mode: 'string' }),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userMotivation = pgTable('user_motivation', {
  userId: text('user_id').primaryKey().references(() => users.id),
  text: text('text').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DailyMotivationRow = typeof dailyMotivation.$inferSelect;
export type NewDailyMotivationRow = typeof dailyMotivation.$inferInsert;
export type UserMotivationRow = typeof userMotivation.$inferSelect;
export type NewUserMotivationRow = typeof userMotivation.$inferInsert;

// Rumi Wallet (Step 32)
export const walletTransactionTypes = [
  'reward',
  'spend',
  'transfer_in',
  'transfer_out',
  'system',
] as const;
export type WalletTransactionType = (typeof walletTransactionTypes)[number];

export const walletAccounts = pgTable('wallet_accounts', {
  userId: text('user_id').primaryKey().references(() => users.id),
  balance: integer('balance').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').$type<WalletTransactionType>().notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type WalletAccountRow = typeof walletAccounts.$inferSelect;
export type NewWalletAccountRow = typeof walletAccounts.$inferInsert;
export type WalletTransactionRow = typeof walletTransactions.$inferSelect;
export type NewWalletTransactionRow = typeof walletTransactions.$inferInsert;

// Step Security.2: 2FA
export type TwoFactorMethod = 'totp' | 'email_otp' | 'sms_otp';

export const userSecurity = pgTable('user_security', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorMethods: text('two_factor_methods').array().$type<TwoFactorMethod[]>().notNull().default([]),
  totpSecret: text('totp_secret'),
  emailVerified: boolean('email_verified').notNull().default(false),
  phoneNumber: text('phone_number'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  publicKey: text('public_key'), // Step Security.4: Ed25519 public key (base64)
  lastNonce: text('last_nonce'), // Step Security.5: deprecated; use user_devices.last_nonce
  recoveryAbuseFlag: boolean('recovery_abuse_flag').notNull().default(false), // Step Security.10
  seedBackedUp: boolean('seed_backed_up').notNull().default(false), // Step Security.10 Phase 2: risk engine
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserSecurityRow = typeof userSecurity.$inferSelect;
export type NewUserSecurityRow = typeof userSecurity.$inferInsert;

// Step Security.6 + Security.10: user_devices
export const userDevices = pgTable(
  'user_devices',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').notNull(),
    deviceName: text('device_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    isTrusted: boolean('is_trusted').notNull().default(false),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastNonce: text('last_nonce'), // Step Security.10: per-device nonce
    deviceKey: text('device_key'), // Step Security.10 Phase 2: Ed25519 public key (base64)
  },
  (t) => ({ uniqueUserIdDeviceId: unique().on(t.userId, t.deviceId) })
);

export type UserDeviceRow = typeof userDevices.$inferSelect;
export type NewUserDeviceRow = typeof userDevices.$inferInsert;

// Step Security.10: audit_log
export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  deviceId: text('device_id'),
  eventType: text('event_type').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLogRow = typeof auditLog.$inferInsert;

// Step Security.9 + Security.10: recovery_tickets
export const recoveryTickets = pgTable('recovery_tickets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  status: text('status').notNull().default('PENDING'),
  method: text('method').notNull().default('ASSISTED'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  approvalToken: text('approval_token').notNull().unique(),
});

export type RecoveryTicketRow = typeof recoveryTickets.$inferSelect;
export type NewRecoveryTicketRow = typeof recoveryTickets.$inferInsert;

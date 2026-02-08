/**
 * Solana / RUMI ONE (R1) SPL token config.
 * Used for balance, status, and client-signed transfer broadcast.
 */

/** RUMI ONE mint address (SPL token). Set in production. */
export const rumiOneMint =
  process.env.RUMI_ONE_MINT ?? '';

/** Treasury token account holding initial supply. */
export const rumiOneTreasury =
  process.env.RUMI_ONE_TREASURY ?? '';

/** R1 decimals (9 on Solana). */
export const r1Decimals =
  parseInt(process.env.R1_DECIMALS ?? '9', 10) || 9;

/** R1 symbol. */
export const r1Symbol =
  process.env.R1_SYMBOL ?? 'R1';

/** R1 display name. */
export const r1Name =
  process.env.R1_NAME ?? 'RUMI ONE';

/** Solana RPC URL for balance and broadcast. */
export const solanaRpcUrl =
  process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

/** Whether R1 is configured (mint set). */
export const isR1Configured = (): boolean =>
  Boolean(rumiOneMint && rumiOneMint.length >= 32);

/** Optional: high R1 amount threshold for risk engine (same units as balance, 9 decimals). */
export const r1RiskHighAmountThreshold =
  parseInt(process.env.R1_RISK_HIGH_AMOUNT_THRESHOLD ?? '0', 10) || 0;

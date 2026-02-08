#!/usr/bin/env bash
# RUMI ONE (R1) SPL Token Creation
# Prerequisites: Solana CLI, spl-token CLI, funded keypair (default or --keypair).
# Usage: ./create-r1-token.sh [--cluster mainnet-beta|devnet]
set -e

CLUSTER="${1:-mainnet-beta}"
SUPPLY=1000000000
DECIMALS=9

echo "[R1] Cluster: $CLUSTER"
echo "[R1] Creating SPL token (decimals=$DECIMALS)..."

# 1. Create token mint
MINT_OUTPUT=$(spl-token create-token --decimals "$DECIMALS" -- 2>&1)
echo "$MINT_OUTPUT"
RUMI_ONE_MINT=$(echo "$MINT_OUTPUT" | grep -oE 'Creating token [A-Za-z0-9]+' | awk '{print $3}')
if [ -z "$RUMI_ONE_MINT" ]; then
  RUMI_ONE_MINT=$(echo "$MINT_OUTPUT" | grep -oE '[1-9A-HJ-NP-Za-km-z]{32,44}' | head -1)
fi
if [ -z "$RUMI_ONE_MINT" ]; then
  echo "[R1] ERROR: Could not parse mint address from spl-token output. Run manually: spl-token create-token --decimals $DECIMALS"
  exit 1
fi
echo "[R1] Mint address: $RUMI_ONE_MINT"

# 2. Create token account for initial supply (treasury)
echo "[R1] Creating token account..."
ACC_OUTPUT=$(spl-token create-account "$RUMI_ONE_MINT" -- 2>&1)
echo "$ACC_OUTPUT"
RUMI_ONE_TREASURY=$(echo "$ACC_OUTPUT" | grep -oE 'Creating account [A-Za-z0-9]+' | awk '{print $3}')
if [ -z "$RUMI_ONE_TREASURY" ]; then
  RUMI_ONE_TREASURY=$(echo "$ACC_OUTPUT" | grep -oE '[1-9A-HJ-NP-Za-km-z]{32,44}' | head -1)
fi
if [ -z "$RUMI_ONE_TREASURY" ]; then
  echo "[R1] ERROR: Could not parse token account address. Run manually: spl-token create-account $RUMI_ONE_MINT"
  exit 1
fi
echo "[R1] Treasury token account: $RUMI_ONE_TREASURY"

# 3. Mint full supply to treasury
echo "[R1] Minting $SUPPLY R1 to treasury..."
spl-token mint "$RUMI_ONE_MINT" "$SUPPLY" "$RUMI_ONE_TREASURY"

# 4. Disable mint authority (fix supply forever)
echo "[R1] Disabling mint authority..."
spl-token authorize "$RUMI_ONE_MINT" mint --disable

echo ""
echo "=============================================="
echo "RUMI ONE (R1) token created successfully"
echo "=============================================="
echo "RUMI_ONE_MINT=$RUMI_ONE_MINT"
echo "RUMI_ONE_TREASURY=$RUMI_ONE_TREASURY"
echo "Supply: $SUPPLY (1B) with $DECIMALS decimals"
echo ""
echo "Add to backend .env:"
echo "  RUMI_ONE_MINT=$RUMI_ONE_MINT"
echo "  RUMI_ONE_TREASURY=$RUMI_ONE_TREASURY"
echo "  R1_DECIMALS=$DECIMALS"
echo "  R1_SYMBOL=R1"
echo "  R1_NAME=RUMI ONE"
echo "=============================================="

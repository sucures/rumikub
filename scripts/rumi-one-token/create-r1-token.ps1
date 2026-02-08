# RUMI ONE (R1) SPL Token Creation (PowerShell)
# Prerequisites: Solana CLI, spl-token CLI, funded keypair.
# Usage: .\create-r1-token.ps1 [-Cluster mainnet-beta|devnet]

param([string]$Cluster = "mainnet-beta")

$SUPPLY = 1000000000
$DECIMALS = 9

Write-Host "[R1] Cluster: $Cluster"
Write-Host "[R1] Creating SPL token (decimals=$DECIMALS)..."

# 1. Create token mint
$MINT_OUTPUT = spl-token create-token --decimals $DECIMALS 2>&1 | Out-String
Write-Host $MINT_OUTPUT
$RUMI_ONE_MINT = ($MINT_OUTPUT -split "`n" | Where-Object { $_ -match "Creating token\s+(\S+)" }) -replace ".*Creating token\s+", ""
if (-not $RUMI_ONE_MINT) {
    $RUMI_ONE_MINT = [regex]::Match($MINT_OUTPUT, "[1-9A-HJ-NP-Za-km-z]{32,44}").Value
}
if (-not $RUMI_ONE_MINT) {
    Write-Host "[R1] ERROR: Could not parse mint address. Run manually: spl-token create-token --decimals $DECIMALS"
    exit 1
}
Write-Host "[R1] Mint address: $RUMI_ONE_MINT"

# 2. Create token account
Write-Host "[R1] Creating token account..."
$ACC_OUTPUT = spl-token create-account $RUMI_ONE_MINT 2>&1 | Out-String
Write-Host $ACC_OUTPUT
$RUMI_ONE_TREASURY = ($ACC_OUTPUT -split "`n" | Where-Object { $_ -match "Creating account\s+(\S+)" }) -replace ".*Creating account\s+", ""
if (-not $RUMI_ONE_TREASURY) {
    $RUMI_ONE_TREASURY = [regex]::Match($ACC_OUTPUT, "[1-9A-HJ-NP-Za-km-z]{32,44}").Value
}
if (-not $RUMI_ONE_TREASURY) {
    Write-Host "[R1] ERROR: Could not parse token account. Run manually: spl-token create-account $RUMI_ONE_MINT"
    exit 1
}
Write-Host "[R1] Treasury token account: $RUMI_ONE_TREASURY"

# 3. Mint full supply
Write-Host "[R1] Minting $SUPPLY R1 to treasury..."
spl-token mint $RUMI_ONE_MINT $SUPPLY $RUMI_ONE_TREASURY

# 4. Disable mint authority
Write-Host "[R1] Disabling mint authority..."
spl-token authorize $RUMI_ONE_MINT mint --disable

Write-Host ""
Write-Host "=============================================="
Write-Host "RUMI ONE (R1) token created successfully"
Write-Host "=============================================="
Write-Host "RUMI_ONE_MINT=$RUMI_ONE_MINT"
Write-Host "RUMI_ONE_TREASURY=$RUMI_ONE_TREASURY"
Write-Host "Supply: $SUPPLY (1B) with $DECIMALS decimals"
Write-Host ""
Write-Host "Add to backend .env:"
Write-Host "  RUMI_ONE_MINT=$RUMI_ONE_MINT"
Write-Host "  RUMI_ONE_TREASURY=$RUMI_ONE_TREASURY"
Write-Host "  R1_DECIMALS=$DECIMALS"
Write-Host "  R1_SYMBOL=R1"
Write-Host "  R1_NAME=RUMI ONE"
Write-Host "=============================================="

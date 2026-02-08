# RUMI ONE (R1) Token — Creation & Metadata

Official SPL token for the Rumi ecosystem. Fixed supply: **1,000,000,000 (1B)**. Decimals: **9**.

---

## Prerequisites

- **Solana CLI** — [Install](https://docs.solana.com/cli/install-solana-cli-tools)
- **spl-token CLI** — `cargo install spl-token` or `solana install spl-token`
- **Funded keypair** — Default keypair or `--keypair <PATH>` must have SOL for rent and fees
- **Metaplex (optional)** — For metadata: [Metaplex JS SDK](https://github.com/metaplex-foundation/js) or [Sugar](https://docs.metaplex.com/developer-tools/sugar/) for upload

---

## 1. Create the SPL Token Mint

```bash
spl-token create-token --decimals 9
```

**Output:** Mint address. Store as `RUMI_ONE_MINT`.

Example:
```
Creating token 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

---

## 2. Create Token Account (Treasury)

```bash
spl-token create-account <RUMI_ONE_MINT>
```

**Output:** Token account address. Store as `RUMI_ONE_TREASURY`.

---

## 3. Mint Full Supply (1B R1)

```bash
spl-token mint <RUMI_ONE_MINT> 1000000000 <RUMI_ONE_TREASURY>
```

---

## 4. Disable Mint Authority (Fixed Supply)

```bash
spl-token authorize <RUMI_ONE_MINT> mint --disable
```

Supply is now fixed forever.

---

## 5. Metadata (Metaplex)

### 5.1 Prepare metadata

- The official image is the Sovereign Seal at `public/branding/rumi_one_sovereign_emblem.png`.
- It must NOT be replaced, redrawn, or recreated.
- Binding design guidelines are in `public/branding/rumi_one_design_notes.txt`.
- The metadata image URL must always point to the canonical public URL of this emblem.

### 5.2 Upload to Arweave / IPFS

**Option A — Metaplex Sugar (recommended)**

```bash
# Install: https://docs.metaplex.com/developer-tools/sugar/
sugar upload . --env mainnet-beta
# Use the generated cache and URIs for the token.
```

**Option B — Metaplex JS / NFT.Storage / Pinata**

- Upload the logo image first; get the image URI.
- Put that URI in `metadata.json` as `image`.
- Upload `metadata.json` to Arweave or IPFS; get the **metadata URI**.

### 5.3 Attach metadata to the mint

Using **Metaplex Token Metadata** (on-chain):

- Program: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- Create/update metadata account for `<RUMI_ONE_MINT>` with:
  - `name`: "RUMI ONE"
  - `symbol`: "R1"
  - `uri`: `<METADATA_URI>` (from step 5.2)

Example with **@metaplex-foundation/mpl-token-metadata** (Node):

```bash
npm i @metaplex-foundation/mpl-token-metadata @metaplex-foundation/umi @solana/web3.js
# Then use createMetadataAccountV3 or updateMetadataAccountV2 with your mint and URI.
```

Or use a one-off script that calls the Metaplex program with your mint and metadata URI.

**Store:**

- `R1_METADATA_URI` — e.g. `https://arweave.net/...` or `ipfs://...`
- `R1_IMAGE_URI` — logo URL used in the metadata JSON

---

## 6. Verification in Wallets

Phantom, Solflare, Backpack will show the token if:

- Metadata is valid (name, symbol, uri).
- Supply exists and at least one account holds the token.

Add the token in wallet by **mint address** (`RUMI_ONE_MINT`).

---

## 7. Backend Integration

Add to backend `.env`:

```env
RUMI_ONE_MINT=<RUMI_ONE_MINT>
RUMI_ONE_TREASURY=<RUMI_ONE_TREASURY>
R1_DECIMALS=9
R1_SYMBOL=R1
R1_NAME=RUMI ONE
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

Backend provides:

- Token metadata in wallet status (`/api/rumi-wallet/status` or balance response).
- R1 balance via Solana RPC (by wallet address).
- Transfer: client signs transaction; backend can broadcast signed tx if desired.

---

## 8. One-Shot Script (Bash)

From this directory:

```bash
chmod +x create-r1-token.sh
./create-r1-token.sh mainnet-beta
```

Then run steps 5–6 (metadata upload and attach) manually with the printed `RUMI_ONE_MINT`.

---

## 9. Post-Launch (After This Setup)

- Publish mint address on official channels.
- Optionally add to [Solana Token List](https://github.com/solana-labs/token-list).
- Add logo to Solana token registry if required.
- Enable in-app display in Rumi Wallet.

---

## Deliverables Checklist

- [ ] RUMI ONE mint address (`RUMI_ONE_MINT`)
- [ ] Treasury token account (`RUMI_ONE_TREASURY`)
- [ ] Full supply minted (1B, 9 decimals)
- [ ] Mint authority disabled
- [ ] Metadata JSON prepared and uploaded (URI + image URI)
- [ ] Metadata attached to mint (Metaplex)
- [ ] Backend `.env` updated
- [ ] Token visible in Phantom / Solflare / Backpack

Staking and liquidity are **not** part of this guide.

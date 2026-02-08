# RUMI ONE (R1) — Mint Process (Solana)

Step-by-step guide to create and mint the **RUMI ONE** fungible token on Solana.

**Token specification:**

- **Name:** RUMI ONE  
- **Symbol:** R1  
- **Type:** Fungible Token (FT)  
- **Total supply:** 1,000,000,000 (1 billion)  
- **Decimals:** 9  
- **Ecosystem:** RumiMind  
- **Identity:** Sovereign, anchored to the immutable emblem  

**Immutability (do not violate):**

- The **emblem** at `public/branding/rumi_one_sovereign_emblem.png` is **immutable**.  
- The **design notes** at `public/branding/rumi_one_design_notes.txt` are **immutable**.  
- Do not modify, regenerate, replace, reinterpret, or optimize either file.  

---

## 1. Install dependencies

### 1.1 Solana CLI (optional but recommended)

- Install: [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)  
- Used for keypair generation and verification.

### 1.2 Node.js and package manager

- **Node.js** 18+  
- **npm** or **yarn**  

### 1.3 Script dependencies

From the **project root** or from `scripts/rumi-one-token`:

```bash
cd scripts/rumi-one-token
npm install
```

This installs `@solana/web3.js`, `@solana/spl-token`, and (for metadata) `@metaplex-foundation/umi`, `@metaplex-foundation/mpl-token-metadata`, and related packages.

---

## 2. Configure RPC endpoint and keypair

### 2.1 RPC endpoint

Set your Solana RPC URL (required):

```bash
# Example (replace with your RPC; avoid public rate limits for mainnet)
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Or for devnet
export SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### 2.2 Keypair

The script uses the keypair that will be the **mint authority** and initial token holder.

- **Default path:**  
  - Linux/macOS: `~/.config/solana/id.json`  
  - Windows: `%USERPROFILE%\.config\solana\id.json`  
- **Custom path:**

```bash
export KEYPAIR_PATH="/path/to/your/keypair.json"
```

Ensure the keypair has enough SOL for transaction fees and rent.

---

## 3. Upload metadata and image; set metadata URI

### 3.1 Prepare metadata.json

- The file `scripts/rumi-one-token/metadata.json` is already prepared with:
  - `name`: "RUMI ONE"
  - `symbol`: "R1"
  - `description`: institutional description
  - `image`: `https://REPLACE_WITH_YOUR_ORIGIN/branding/rumi_one_sovereign_emblem.png`
  - `attributes`: Sovereign Identity, Token Type, Total Supply, Decimals, Ecosystem  

**Do not change the emblem file.** Only reference it via URL.

### 3.2 Host the emblem and metadata

1. **Emblem:**  
   Upload `public/branding/rumi_one_sovereign_emblem.png` to permanent hosting (e.g. Arweave, IPFS, or your own domain). Do **not** modify or regenerate the image.

2. **metadata.json:**  
   - Replace `REPLACE_WITH_YOUR_ORIGIN` in `metadata.json` with the **full origin** where the emblem is hosted (e.g. `https://yourdomain.com` or an Arweave/IPFS gateway URL for the image).  
   - Upload the updated `metadata.json` to a **permanent URL** (Arweave, IPFS, or your CDN).

3. **Set METADATA_URI:**  
   Set the environment variable to the **final URL of the uploaded metadata.json** (the JSON file, not the image):

```bash
export METADATA_URI="https://arweave.net/your-metadata-id"
# or
export METADATA_URI="https://yourdomain.com/path/to/metadata.json"
```

If you run the mint script **without** `METADATA_URI`, the mint and supply will be created but **on-chain Metaplex metadata will not**; you can attach it later (e.g. run the script again with `METADATA_URI` set, or use Metaplex Sugar / another tool).

---

## 4. Run the mint script

From `scripts/rumi-one-token`:

```bash
npm run mint
```

Or with **tsx** directly:

```bash
npx tsx mint_rumi_one.ts
```

The script will:

1. Load the keypair from `KEYPAIR_PATH`.  
2. Create a new SPL mint with **9 decimals** and the keypair as mint authority.  
3. Create (or get) the **associated token account** for the keypair.  
4. **Mint the full supply** of 1,000,000,000 R1 (1e9 × 10^9 raw units) to that account.  
5. If `METADATA_URI` is set, attach **Metaplex Token Metadata** (name "RUMI ONE", symbol "R1", uri = `METADATA_URI`).  

It will print:

- **Mint address**  
- **Associated token account address**  
- **Transaction signature(s)**  

Save the **mint address** for your backend (`RUMI_ONE_MINT`) and for wallets.

---

## 5. Verify the token

### 5.1 Solana explorer

- Open [Solana Explorer](https://explorer.solana.com) (or another explorer).  
- Paste the **mint address**.  
- Confirm: supply, decimals (9), and (if set) metadata (name, symbol, URI).  

### 5.2 Wallet (Phantom, Solflare, Backpack, etc.)

- Add the token by **mint address**.  
- If metadata was attached, the token name (RUMI ONE), symbol (R1), and image (Sovereign Seal) should appear.  

---

## Summary

| Item              | Value                    |
|-------------------|--------------------------|
| **Token**         | RUMI ONE (R1)            |
| **Type**          | Fungible Token (FT)      |
| **Total supply**  | 1,000,000,000            |
| **Decimals**      | 9                        |
| **Ecosystem**     | RumiMind                 |
| **Identity**      | Sovereign; emblem immutable |

**Files:**

- `scripts/rumi-one-token/metadata.json` — token metadata (image URL points to Sovereign Emblem).  
- `scripts/rumi-one-token/mint_rumi_one.ts` — mint script.  
- This README — `scripts/rumi-one-token/README_RUMI_ONE_MINT.md`.  

**Exact command to run when you are ready to mint:**

```bash
cd scripts/rumi-one-token
export SOLANA_RPC_URL="https://your-rpc-url"
export METADATA_URI="https://your-uploaded-metadata-url"   # optional but recommended
npm run mint
```

Do **not** modify `public/branding/rumi_one_sovereign_emblem.png` or `public/branding/rumi_one_design_notes.txt`.

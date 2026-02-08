/**
 * RUMI ONE (R1) — Solana SPL token mint script.
 * Creates mint (9 decimals), mints full supply to authority's ATA, optionally attaches Metaplex metadata.
 *
 * Required env: SOLANA_RPC_URL
 * Optional env: KEYPAIR_PATH (default: ~/.config/solana/id.json), METADATA_URI (if set, attaches metadata)
 *
 * Do NOT modify the Sovereign Seal or design notes. Identity is anchored to the immutable emblem.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Connection, Keypair } from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// --- Config from env ---
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
const KEYPAIR_PATH =
  process.env.KEYPAIR_PATH ||
  path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    process.platform === 'win32' ? '.config\\solana\\id.json' : '.config/solana/id.json'
  );
const METADATA_URI = process.env.METADATA_URI;

const DECIMALS = 9;
const TOTAL_SUPPLY_UI = 1_000_000_000; // 1 billion R1
const TOTAL_SUPPLY_RAW = BigInt(TOTAL_SUPPLY_UI) * BigInt(10 ** DECIMALS);

function loadKeypair(filePath: string): Keypair {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Keypair file not found: ${resolved}. Set KEYPAIR_PATH or use default ~/.config/solana/id.json`);
  }
  const secret = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  if (!SOLANA_RPC_URL) {
    console.error('Missing SOLANA_RPC_URL. Set it to your Solana RPC endpoint.');
    process.exit(1);
  }

  const keypair = loadKeypair(KEYPAIR_PATH);
  const connection = new Connection(SOLANA_RPC_URL);

  console.log('RUMI ONE (R1) mint script');
  console.log('Authority:', keypair.publicKey.toBase58());
  console.log('RPC:', SOLANA_RPC_URL);
  console.log('Decimals:', DECIMALS, '| Total supply (UI):', TOTAL_SUPPLY_UI, 'R1');
  console.log('');

  // 1) Create mint
  console.log('Creating mint (9 decimals)...');
  const mint = await createMint(
    connection,
    keypair,
    keypair.publicKey,
    null,
    DECIMALS,
    undefined,
    { commitment: 'confirmed' },
    TOKEN_PROGRAM_ID
  );
  console.log('Mint address:', mint.toBase58());

  // 2) Get or create ATA for authority
  console.log('Getting or creating associated token account...');
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    mint,
    keypair.publicKey,
    false,
    'confirmed',
    { commitment: 'confirmed' },
    TOKEN_PROGRAM_ID
  );
  console.log('Associated token account:', ata.address.toBase58());

  // 3) Mint full supply to ATA
  console.log('Minting full supply to authority ATA...');
  const sigMint = await mintTo(
    connection,
    keypair,
    mint,
    ata.address,
    keypair,
    TOTAL_SUPPLY_RAW,
    [],
    { commitment: 'confirmed' },
    TOKEN_PROGRAM_ID
  );
  console.log('Mint tx signature:', sigMint);

  // 4) Attach Metaplex metadata (if METADATA_URI is set)
  if (METADATA_URI) {
    console.log('Attaching Metaplex metadata (uri:', METADATA_URI, ')...');
    try {
      const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');
      const { createSignerFromKeypair, signerIdentity } = await import('@metaplex-foundation/umi');
      const { fromWeb3JsKeypair } = await import('@metaplex-foundation/umi-web3js-adapters');
      const { mplTokenMetadata } = await import('@metaplex-foundation/mpl-token-metadata');
      const mpl = await import('@metaplex-foundation/mpl-token-metadata');
      const createMetadataAccountV3 = mpl.createMetadataAccountV3;

      const umi = createUmi(SOLANA_RPC_URL);
      umi.use(mplTokenMetadata());
      const keypairSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(keypair));
      umi.use(signerIdentity(keypairSigner));

      const mintUmi = umi.publicKey(mint.toBase58());
      const builder = createMetadataAccountV3(umi, {
        mint: mintUmi,
        mintAuthority: keypairSigner,
        data: {
          name: 'RUMI ONE',
          symbol: 'R1',
          uri: METADATA_URI,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: false,
        collectionDetails: null,
      });
      const { signature: sigMeta } = await builder.sendAndConfirm(umi);
      console.log('Metadata tx signature:', sigMeta);
    } catch (e) {
      console.error('Metaplex metadata step failed:', e);
      console.error('Mint and ATA were created successfully. Attach metadata later with METADATA_URI and Metaplex.');
    }
  } else {
    console.log('METADATA_URI not set — skipping on-chain metadata. Set METADATA_URI and run again or attach metadata separately.');
  }

  console.log('');
  console.log('--- Summary ---');
  console.log('Mint address:', mint.toBase58());
  console.log('Associated token account (authority):', ata.address.toBase58());
  console.log('Supply minted:', TOTAL_SUPPLY_UI, 'R1 (', TOTAL_SUPPLY_RAW.toString(), 'raw units )');
  console.log('Store the mint address for backend (RUMI_ONE_MINT) and wallets.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

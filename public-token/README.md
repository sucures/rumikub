# RUMI ONE (R1) — Public Token Metadata (GitHub Pages)

This folder hosts the **public metadata and Sovereign Emblem** for the RUMI ONE fungible token on Solana. It is published as part of the repository’s GitHub Pages site so that:

- **metadata.json** can be used as the **METADATA_URI** for the token (Metaplex / on-chain metadata).
- **rumi_one_sovereign_emblem.png** is served at a stable, institutional URL.

---

## Immutability

- The **Sovereign Emblem** (`rumi_one_sovereign_emblem.png`) is **immutable**. It must not be modified, regenerated, replaced, reinterpreted, or optimized.
- The **design notes** in the repository at `public/branding/rumi_one_design_notes.txt` are **immutable**. They must not be modified.

This folder contains a **copy** of the emblem for hosting only. The canonical source remains `public/branding/rumi_one_sovereign_emblem.png`.

---

## Final URLs (once GitHub Pages is active)

Repository: [sucures/rumikub](https://github.com/sucures/rumikub)

| Resource | URL |
|----------|-----|
| **Token metadata (METADATA_URI)** | `https://sucures.github.io/rumikub/public-token/metadata.json` |
| **Sovereign Emblem (image)** | `https://sucures.github.io/rumikub/public-token/rumi_one_sovereign_emblem.png` |

---

## Enabling GitHub Pages

1. In the repository: **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` runs on push to `main` (or on manual dispatch). It publishes the contents of `public-token/` under the path `/public-token/` on the Pages site.
4. After the first successful run, the URLs above will serve the token metadata and emblem.

---

## Use for minting (RUMI ONE)

When running the RUMI ONE mint script (`scripts/rumi-one-token/mint_rumi_one.ts`), set:

```bash
export METADATA_URI="https://sucures.github.io/rumikub/public-token/metadata.json"
```

Then run the mint script. The on-chain metadata will point to this URL; wallets and explorers will load the metadata and the emblem from GitHub Pages.

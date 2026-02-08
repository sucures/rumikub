# RUMI ONE (R1) — Institutional Identity

One-page institutional reference for the sovereign, official, and permanent identity of RUMI ONE (R1).

---

## Immutable assets

- **rumi_one_sovereign_emblem.png** — Sovereign Seal; do not modify, regenerate, reinterpret, or replace.
- **rumi_one_design_notes.txt** — Binding design rules; do not modify, regenerate, reinterpret, or replace.

Both live under `public/branding/` and are immutable.

---

## Responsibilities

- **Always use the Sovereign Seal** for official R1 identity (token metadata, RUMI Wallet UI, institutional documentation, official interfaces).
- **Always reference it** via the in-app path `/branding/rumi_one_sovereign_emblem.png` and via `RUMI_ONE_EMBLEM_PATH` from `shared/branding.ts`.
- **Always follow** the design rules in `rumi_one_design_notes.txt`.
- **Treat the emblem and design notes as immutable.** If any task would alter them, stop and request explicit confirmation.

---

## Institutional files to keep consistent

- **metadata.json** — `scripts/rumi-one-token/metadata.json`
- **Token README** — `scripts/rumi-one-token/README.md`
- **Branding README** — `public/branding/README.md`
- **Shared branding constants** — `shared/branding.ts`
- **Security whitepaper** — `docs/RUMI_WALLET_SECURITY_WHITEPAPER.md`

---

## Enforcement

The same identity rules are enforced by the always-applied Cursor rule:

**`.cursor/rules/rumi-one-sovereign-identity.mdc`**

Refer to that file for enforcement of these requirements across the project.

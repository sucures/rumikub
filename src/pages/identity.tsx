import React from 'react';
import { Link } from 'react-router-dom';
import { RUMI_ONE_EMBLEM_PATH } from '../../shared/branding';

export default function IdentityPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 mb-6 inline-block">
        ← Back
      </Link>

      <div className="flex flex-col items-center text-center mb-10">
        <img
          src={RUMI_ONE_EMBLEM_PATH}
          alt="RUMI ONE Sovereign Seal"
          className="h-24 w-24 sm:h-32 sm:w-32 object-contain mb-4"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">RUMI ONE (R1) — Sovereign Seal</h1>
        <p className="text-gray-400 text-sm max-w-md">
          The emblem is the official, sovereign visual identity of RUMI ONE. It is immutable and must not be modified, regenerated, or replaced.
        </p>
      </div>

      <section className="space-y-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Meaning</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The Sovereign Seal represents the official institutional identity of RUMI ONE (R1). It is used for token metadata, the RUMI Wallet, institutional documentation, and all official interfaces. Its design and usage are governed by binding design notes.
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Official uses</h2>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
            <li>Token metadata (R1)</li>
            <li>RUMI Wallet UI</li>
            <li>Institutional documentation</li>
            <li>Official websites and interfaces</li>
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Prohibitions</h2>
          <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
            <li>Do not modify, regenerate, redraw, or replace the emblem</li>
            <li>Do not optimize destructively or reinterpret the design</li>
            <li>Do not use alternate logos for official R1 identity</li>
            <li>Do not reference the emblem by manual paths — use <code className="text-amber-400/90">RUMI_ONE_EMBLEM_PATH</code> from <code className="text-amber-400/90">shared/branding.ts</code></li>
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Institutional documents</h2>
          <p className="text-gray-400 text-sm mb-3">Reference documentation in the repository <code className="text-amber-400/90">docs/</code>:</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/docs/RUMI_ONE_IDENTITY.md" className="text-amber-400 hover:text-amber-300 underline" target="_blank" rel="noopener noreferrer">
                RUMI_ONE_IDENTITY.md
              </a>
            </li>
            <li>
              <a href="/docs/RUMI_WALLET_SECURITY_WHITEPAPER.md" className="text-amber-400 hover:text-amber-300 underline" target="_blank" rel="noopener noreferrer">
                RUMI_WALLET_SECURITY_WHITEPAPER.md
              </a>
            </li>
            <li>
              <a href="/docs/BRAND_GUIDELINES.md" className="text-amber-400 hover:text-amber-300 underline" target="_blank" rel="noopener noreferrer">
                BRAND_GUIDELINES.md
              </a>
            </li>
            <li>
              <a href="/docs/PROJECT_STRUCTURE.md" className="text-amber-400 hover:text-amber-300 underline" target="_blank" rel="noopener noreferrer">
                PROJECT_STRUCTURE.md
              </a>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-amber-200/90 text-sm leading-relaxed">
            <strong>Immutability:</strong> The Sovereign Seal (<code>rumi_one_sovereign_emblem.png</code>) and the design notes (<code>rumi_one_design_notes.txt</code>) are immutable institutional assets. They must never be modified, regenerated, replaced, or reinterpreted. Any task that would alter them requires explicit confirmation before proceeding.
          </p>
        </div>
      </section>
    </main>
  );
}

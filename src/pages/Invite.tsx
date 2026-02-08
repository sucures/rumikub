import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import {
  getReferralStats,
  validateReferralCode,
  setStoredReferralCode,
} from '../api/referral';
import type { ReferralStats } from '../api/referral';
import Button from '../components/ui/Button';

function shareUrl(url: string, platform: string) {
  const text = 'Join me on Rummikub Pro!';
  const encoded = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const links: Record<string, string> = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encoded}`,
    telegram: `https://t.me/share/url?url=${encoded}&text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encoded}`,
    email: `mailto:?subject=${encodedText}&body=${encoded}`,
  };
  const href = links[platform];
  if (href) window.open(href, '_blank', 'noopener,noreferrer');
}

export default function InvitePage() {
  const { code } = useParams<{ code?: string }>();
  const { token } = useUserStore();
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: getReferralStats,
    enabled: !!token,
  });

  const { data: isValid } = useQuery({
    queryKey: ['referral-validate', code],
    queryFn: () => validateReferralCode(code!),
    enabled: !!code && !token,
  });

  useEffect(() => {
    if (code && isValid) {
      setStoredReferralCode(code);
    }
  }, [code, isValid]);

  const handleCopy = async () => {
    if (!stats?.referralLink) return;
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = stats.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Visitor landing: /invite/:code — store ref, show CTA
  if (code && !token) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 mb-6" aria-hidden>
            <span className="text-4xl">🎁</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">You&apos;re invited!</h1>
          <p className="text-gray-400 mb-8">
            {isValid === false
              ? 'This invite link may have expired.'
              : 'Sign up with this link to get a welcome bonus and help your friend earn rewards.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-500 transition-all"
          >
            Get started
          </Link>
        </div>
      </main>
    );
  }

  // Logged-in user: /invite — show referral link and stats
  if (!token) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/" className="text-gray-400 hover:text-white">← Home</Link>
        <div className="card p-8 mt-8 text-center">
          <p className="text-gray-400">Log in to get your referral link.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Home
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Invite friends
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Share your link. When friends sign up, you both earn rewards: you get 100 coins + 5 gems, they get 50 coins.
      </p>

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
      ) : stats ? (
        <>
          <div className="card p-6 mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Your referral link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={stats.referralLink}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white text-sm"
              />
              <Button onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Code: {stats.referralCode}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="secondary" onClick={() => shareUrl(stats.referralLink, 'whatsapp')}>
              WhatsApp
            </Button>
            <Button variant="secondary" onClick={() => shareUrl(stats.referralLink, 'telegram')}>
              Telegram
            </Button>
            <Button variant="secondary" onClick={() => shareUrl(stats.referralLink, 'twitter')}>
              Twitter
            </Button>
            <Button variant="secondary" onClick={() => shareUrl(stats.referralLink, 'email')}>
              Email
            </Button>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Your stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-800/40">
                <span className="text-2xl font-bold text-amber-400">{stats.referralsCount}</span>
                <span className="block text-xs text-gray-500">Referrals</span>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/40">
                <span className="text-2xl font-bold text-amber-400">
                  {stats.referralsCount * 100}
                </span>
                <span className="block text-xs text-gray-500">Coins earned</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-8 text-center text-gray-400">Failed to load referral info.</div>
      )}
    </main>
  );
}

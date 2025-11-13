import React, { useEffect, useMemo, useState } from 'react';

interface ExpiryBadgeProps {
  expiresAt: string;
  className?: string;
}

const getRemainingLabel = (expiresAt: string, now: number) => {
  const expiryTime = new Date(expiresAt).getTime();
  const diffMs = expiryTime - now;

  if (Number.isNaN(expiryTime)) {
    return { label: 'Unknown', variant: 'neutral' as const, expired: true };
  }

  if (diffMs <= 0) {
    return { label: 'Expired', variant: 'expired' as const, expired: true };
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  const label =
    hours > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m left` : `${minutes}m left`;

  let variant: 'safe' | 'warning' = 'safe';
  if (diffMs <= 12 * 60 * 60 * 1000) {
    variant = 'warning';
  }

  return { label, variant, expired: false };
};

const variantClasses: Record<string, string> = {
  safe: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  expired: 'bg-red-100 text-red-700 border border-red-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export const ExpiryBadge: React.FC<ExpiryBadgeProps> = ({ expiresAt, className }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { label, variant } = useMemo(() => getRemainingLabel(expiresAt, now), [expiresAt, now]);

  const classes = [
    'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      🕑 {label}
    </span>
  );
};

export default ExpiryBadge;

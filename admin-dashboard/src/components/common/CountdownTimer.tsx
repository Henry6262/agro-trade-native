import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface CountdownTimerProps {
  targetDate: string | Date;
  label?: string;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label = 'Time Remaining',
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const getUrgencyColor = () => {
    if (timeLeft.expired) return 'bg-red-100 text-red-800 border-red-300';
    if (timeLeft.days === 0 && timeLeft.hours < 6)
      return 'bg-red-100 text-red-800 border-red-300';
    if (timeLeft.days === 0) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (timeLeft.days < 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  if (timeLeft.expired) {
    return (
      <div className={className}>
        <p className="text-xs text-text-secondary mb-1">{label}</p>
        <Badge className="bg-red-100 text-red-800 border-red-300">⚠️ EXPIRED</Badge>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${getUrgencyColor()}`}>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    </div>
  );
};

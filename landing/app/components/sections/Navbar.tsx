'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { B } from '../brand';

const links = [
  { href: '/#platform', label: 'Platform' },
  { href: '/#corridor', label: 'The Corridor' },
  { href: '/#how-it-works', label: 'Workflow' },
  { href: '/#mission', label: 'Mission' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled || open ? 'rgba(7, 9, 7, 0.88)' : 'rgba(7, 9, 7, 0.42)',
        borderBottom: `1px solid ${scrolled || open ? B.glassBorder : 'transparent'}`,
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="AgriTek home">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
              <Image src="/logo.png" alt="" fill sizes="36px" className="object-contain p-1" />
            </div>
            <div>
              <span
                className="block text-base font-extrabold tracking-[-0.02em]"
                style={{ color: B.cream }}
              >
                Agri<span style={{ color: B.wheat }}>Tek</span>
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-white/35">
                Trade operating system
              </span>
            </div>
          </Link>

          <div
            className="hidden items-center gap-6 text-xs font-semibold lg:flex"
            style={{ color: B.muted }}
          >
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-white">
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 text-xs font-bold text-white/58 transition-colors hover:bg-white/5 hover:text-white"
            >
              Enter prototype
            </Link>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: B.wheat,
                color: B.bg,
                boxShadow: '0 12px 34px rgba(216,179,93,0.18)',
              }}
            >
              Bring a trade <ArrowRight size={13} />
            </Link>
          </div>

          <button
            className="rounded-lg p-2 lg:hidden"
            style={{ color: B.cream }}
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-primary-navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div
            id="mobile-primary-navigation"
            className="flex flex-col gap-1 border-t border-white/10 pb-5 pt-3 lg:hidden"
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 text-sm transition-colors hover:bg-white/5 hover:text-white"
                style={{ color: B.muted }}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-3 text-xs font-bold text-white/68"
                onClick={() => setOpen(false)}
              >
                Enter prototype
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-extrabold"
                style={{ backgroundColor: B.wheat, color: B.bg }}
                onClick={() => setOpen(false)}
              >
                Bring a trade <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

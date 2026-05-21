"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { B } from "../brand";

const links = [
  { href: "#problem", label: "Problem" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#app", label: "App Preview" },
  { href: "#vault", label: "Security" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{ backgroundColor: "rgba(12, 9, 4, 0.82)", borderBottom: `1px solid ${B.glassBorder}` }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="AgroTrade logo" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: B.cream }}>
              Agro<span style={{ color: B.wheat }}>Trade</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: B.muted }}>
            {links.map(({ href, label }) => (
              <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex">
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: B.wheat, color: B.bg }}
            >
              Launch Web Portal
              <ArrowRight size={14} />
            </a>
          </div>

          <button className="md:hidden p-2" style={{ color: B.muted }} onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 pt-2 flex flex-col gap-3" style={{ borderTop: `1px solid ${B.glassBorder}` }}>
            {links.map(({ href, label }) => (
              <a key={href} href={href} className="py-2 px-2 text-sm hover:text-white transition-colors" style={{ color: B.muted }} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
            <a href="/auth/login" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mt-2"
              style={{ backgroundColor: B.wheat, color: B.bg }} onClick={() => setOpen(false)}>
              Launch Web Portal
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

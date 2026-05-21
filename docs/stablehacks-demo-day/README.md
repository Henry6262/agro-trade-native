# StableHacks Demo Day — Pitch Kit
**Zurich | 28 May 2026 | 3-Minute Live Pitch**

---

## What This Is

You made Top 10 at StableHacks. On May 28, you pitch live on stage in Zurich to AMINA Bank, Solana Foundation, UBS, SIX BFI, Fireblocks, and Keyrock. This folder contains everything you need to deliver that pitch.

**The deck has been reframed for institutional finance judges.** It leads with settlement infrastructure and compliance — not drones. The drone is the RWA verification layer, mentioned in Slide 6.

---

## Files

| File | Purpose |
|------|---------|
| `deck.html` | Self-contained slide deck. Open in Chrome, go fullscreen (`F11`). Arrow keys to navigate. `N` for speaker notes. |
| `SPEAKER_CHEAT_SHEET.md` | One-page timing, anchor phrases, Q&A prep, and panic recovery. Print this. |

---

## How to Use the Deck

```bash
# From the project root:
open docs/stablehacks-demo-day/deck.html

# Or serve it (if you want):
cd docs/stablehacks-demo-day && python3 -m http.server 8080
# Then open http://localhost:8080/deck.html
```

**Controls:**
- `→` or `Space` — next slide
- `←` — previous slide
- `N` — toggle speaker notes (bottom bar)
- `F11` — browser fullscreen

---

## What Changed From the SkyHarvest Pitch

| SkyHarvest v2.0 (Old) | StableHacks Demo Day (New) |
|-----------------------|---------------------------|
| Hook: "China flies 28,000 drones" | Hook: "$3.4T runs on fax machines" |
| Problem: Inspector drives 4 hours | Problem: Settlement + compliance darkness |
| Solution: Drone + marketplace | Solution: Dual-chain escrow infrastructure |
| Compliance: Mentioned late | Compliance: Slide 4, front and center |
| Ask: €100K + farm partners | Ask: AMINA pilot + SIX data + Solana DevRel |
| Audience: Agritech VCs | Audience: Regulated banks + Solana Foundation |

---

## Critical Path — Next 12 Days

### Must Do (Blocks Demo Day)
- [ ] **Practice the pitch** until you hit 178–182 seconds every time. Record yourself.
- [ ] **Verify deck opens** on the laptop you will bring to Zurich.
- [ ] **Print the cheat sheet** or have it on your phone as backup.

### Should Do (Increases Win Probability)
- [ ] **Deploy Solana escrow to devnet** if not already done. Have the explorer link ready.
- [ ] **Prepare a 60-second demo** on your phone: create trade → lock escrow → release. Judges will ask.
- [ ] **Prepare a QR code** linking to your GitHub + live backend.
- [ ] **Review Q&A section** in the cheat sheet. Have a teammate drill you.

### Nice to Have
- [ ] Add real app screenshots to Slide 3 (replace placeholder text with actual UI)
- [ ] Add Solana explorer link to Slide 5 (replace placeholder with real contract)
- [ ] Add AMINA / SIX / Solstice logos to Slide 7 (if partnerships confirmed)

---

## ⚠️ Known Risk

**Solo submission rule:** StableHacks rules state "Participation is limited to teams only; solo submissions will not be accepted." Your submission lists only you. If judges ask about team size, be ready to answer:

> "I am the lead developer and architect. I have a contracted mobile developer and a compliance advisor. For this demo, I am representing the core team."

Do not lie. Do not panic. Top 10 means they already accepted your submission. Just have a confident answer ready.

---

## The Pitch Narrative (One Sentence)

> "AgroTrade is a compliance-first, dual-chain stablecoin escrow platform for agricultural commodities — built on Celo and Solana, designed for regulated banks, and production-ready today."

---

## Contact & Backup

- **GitHub:** https://github.com/Henry6262/agro-trade-native
- **Live backend:** Railway deployment (check .env for URL)
- **This pitch kit:** `docs/stablehacks-demo-day/`

---

*Built: 2026-05-16 | Pitch date: 2026-05-28 | Time to go: 12 days*

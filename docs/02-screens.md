# Screens and Design

## Design system

- Canvas: Slate pearl `#F8FAFC`. Cards and form surfaces: pure white `#FFFFFF` with refined subtle borders `#E2E8F0`.
- Primary actions: Emerald Teal `#0D9488` / `#0F766E` and Deep Slate `#0F172A`.
- Luxury highlights & emphasis: Warm Champagne Amber `#D97706` / `#F59E0B` / `#FEF3C7`.
- TV Canvas: Deep Midnight Slate `#020617` with high-contrast emerald and gold typography readable from 5 metres away.
- Main text: `#0F172A`. Secondary text: `#64748B`.
- Use jade emerald for available and active states, amber for delays and waits > 60 min, and rose for destructive or cancellation actions. Pair every status color with a label or icon.
- Use Outfit for headings, Plus Jakarta Sans for body, and Noto Sans Gujarati for Gujarati text. Use tabular numerals for tokens, timers, and statistics.
- Touch target minimum: 44 × 44 px on phones. Support `prefers-reduced-motion`.
- Responsive views: Mobile (360px+), Landscape Tablet for Reception (10-inch), and 1080p for Waiting Area TV Display.
- Dual-language support: English (EN) and Gujarati (GU) available from the same header toggle.

---

## 1. Home (/)

- Show salon name ("Aura Luxe Salon & Studio"), logo, language toggle, and opening status ("Open until 21:00" or "Currently Closed").
- Feature a live queue monitor card with the number waiting and estimated wait for "Any Barber". Label wait as an estimate.
- Show stylist availability with Indian names (Arjun Mehta, Kabir Sharma, Rohan Verma) and status badges: Available, In Service, or On Break.
- Primary CTA: "Join Queue". If online joining is closed, disable it and display the reason. If queue is empty, show "No one waiting. Walk right in!".

---

## 2. Join Queue (/join)

- Collect customer full name and a validated 10-digit Indian phone number (`/^[6-9]\d{9}$/`).
- Present active services in selectable cards with English and Gujarati titles, duration in minutes, and price in Indian Rupees (₹). Allow 1 to 3 services.
  - Seed examples: Haircut & Styling (30 min, ₹250), Beard Trim & Shape (15 min, ₹120), Refreshing Hair Spa (45 min, ₹500), Head Massage & Wash (20 min, ₹200), Charcoal Deep Facial (40 min, ₹650).
- Stylist preference: "Any Barber · First Available" as default, alongside selectable cards for Arjun Mehta, Kabir Sharma, and Rohan Verma. Label on-break states clearly.
- Real-time sticky summary updating total duration, total price in ₹, and estimated wait.
- Inline validation errors and prevention of double submissions. On API confirmation, redirect immediately to `/status/:id`.

---

## 3. My Status (/status/:id)

- Private 48-character unguessable hex link.
- Large prominent token number (e.g. `#102`), position in line, and estimated wait (e.g. "About 25 min").
- Dynamic progress indicators:
  - At position 2: "Start coming to the salon!"
  - At position 1: "You're next! Please be ready in the salon."
- **Called State:** Full-screen alerted surface with token, "It's your turn!", assigned stylist name, gentle pulsing animation, audio buzzer chime, and device vibration.
- Clear states for In Chair, Completed (Done), Cancelled, and No-Show.
- Self-cancellation option with confirmation modal while in Waiting status.

---

## 4. Reception Dashboard (/reception)

- Staff access required (Receptionist or Owner role).
- Header with "Add Walk-in" CTA, queue totals, and live sync indicator.
- Landscape tablet layout: 3 stylist station cards across the top:
  - Station availability, current occupant token, elapsed & remaining service time progress bar, and "Call Next" button.
- Live waiting queue in FIFO arrival order: token, name, phone, services, preference, wait duration so far.
- Highlight wait times over 60 minutes with an amber alert label.
- Actions: Cancel waiting customer, Mark No-show for called customer once 10 minutes have elapsed.
- Modal for adding walk-in customers with instant token generation.

---

## 5. Barber View (/barber/:name)

- Staff access restricted to assigned stylist (or owner).
- Current customer's name, token, services, and live elapsed timer.
- Single large primary action at a time: "Start Service" when customer is Called, "Mark Done" when In Chair.
- Toggle switch for Available / On Break.
- Idle state when station is clear and compact preview of next customer in line.

---

## 6. Waiting Area TV (/display)

- High-contrast dark 1080p kiosk layout (`#020617`).
- Large token numbers visible from 5 metres away.
- Active stylist stations with current tokens on the left; next 5 waiting tokens on the right.
- Visual highlight pulse and optional audio buzzer chime when a new token is called.
- Strictly privacy-safe: displays tokens only, NO customer names or mobile numbers.

---

## 7. Owner Settings (/admin)

- Owner access required.
- Today's performance KPIs: customers served, average wait time, no-shows, cancellations.
- Service catalog editor: English and Gujarati names, duration, price in ₹, active status toggle.
- Stylist on-duty toggles and online queue access switch.
- Staff invitation generator creating expiring single-use setup links.

---

## Staff Sign-In (/login) & Setup (/setup/:token)

- Unified bilingual login form for Receptionists, Barbers, and Owners.
- Includes 1-Click Quick Demo Access for hassle-free evaluation.
- Redirection to requested role-protected page after successful sign in.
- Setup link redemption screen for invited staff to securely set their password.

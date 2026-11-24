# Aura Luxe Salon — Intelligent Queue Management System

> **Live Deployment:** [https://aura-luxe-salon-management.netlify.app](https://aura-luxe-salon-management.netlify.app)  
> *Ready for one-click deployment on **Vercel** and **Netlify** with **Turso Cloud SQLite**.*

---

## 💈 Overview & Salon Profile

**Aura Luxe Salon** is a full-stack boutique salon queue management platform designed for the Indian market. It eliminates waiting-room crowding by letting walk-ins and remote customers join a synchronized digital queue from their mobile phone, track their real-time estimated wait time, and receive an instant buzzer notification when their station is ready.

### Indian Brand Customizations:
- **Salon Name:** Aura Luxe Salon & Studio
- **Currency:** Indian Rupee (**₹** / INR)
- **Stylists / Barbers:**
  - **Arjun Mehta** (`arjun`) — Senior Hair Stylist
  - **Kabir Sharma** (`kabir`) — Master Beard Artist & Stylist
  - **Rohan Verma** (`rohan`) — Hair Spa & Wellness Specialist
- **Bilingual Interface:** Full English & Gujarati (**ગુજરાતી**) toggle across all screens.
- **Design System:** Luxury **Midnight Emerald & Champagne Amber** theme (`#0D9488` / `#F59E0B` / `#071A16` for TV) with glassmorphism, responsive cards, and clean typography (Outfit & Plus Jakarta Sans).

---

## 🔑 Demo Staff Accounts (1-Click Ready)

On `/login`, click any of the **Quick Demo Access** buttons to log in with one tap:

| Role | Email | Password | Direct View |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `owner@auraluxe.in` | `AuraOwner@2026` | `/admin` |
| **Receptionist** | `reception@auraluxe.in` | `AuraRecep@2026` | `/reception` |
| **Barber (Arjun)** | `arjun@auraluxe.in` | `BarberArjun@2026` | `/barber/arjun` |
| **Barber (Kabir)** | `kabir@auraluxe.in` | `BarberKabir@2026` | `/barber/kabir` |
| **Barber (Rohan)** | `rohan@auraluxe.in` | `BarberRohan@2026` | `/barber/rohan` |

---

## 🖥️ Screen Routes & Capabilities

1. **Home (`/`)**: Live queue counter, estimated wait for "Any Barber", stylist on-duty cards with live status badges, and "Join Queue" primary CTA.
2. **Join Queue (`/join`)**: Customer intake form with validated 10-digit Indian phone (e.g. `9876543210`), 1-to-3 service selection cards with live price & duration tally, stylist preference selector, and single-active-ticket enforcement.
3. **My Status (`/status/:id`)**: Private 48-character hex link, prominent token number, queue position, progression cues ("Start coming" at #2, "You're next" at #1), and full-screen alerted called state with audio chime & vibration.
4. **Reception Dashboard (`/reception`)**: Landscape tablet layout with stylist status cards, active service timer, "Call Next" buttons, live FIFO waiting list (>60 min wait alerts), Walk-in registration modal, Cancel spot, and No-show action (enabled after 10 minutes).
5. **Barber View (`/barber/:name`)**: Mobile stylist portal with large "Start Service" and "Mark Done" buttons, live service timer, break toggle, and upcoming customer preview.
6. **Waiting Room TV (`/display`)**: Dark luxury 1080p kiosk view displaying active tokens by station and next 5 tokens in waiting line. Privacy-first (tokens only, NO phone numbers or names).
7. **Owner Settings (`/admin`)**: Today's KPIs (served, average wait time, no-shows, cancellations), service duration & pricing editor in ₹, barber duty toggles, online queue toggle, and staff setup invitations generator.
8. **Staff Sign In (`/login`) & Setup (`/setup/:token`)**: Authentication & expiring single-use setup link redemption.

---

## ⚙️ Tech Stack & Architecture

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router 7, Lucide Icons.
- **Backend:** Node.js, Express.js.
- **Database:** LibSQL / Turso Cloud SQLite (`@libsql/client`).
  - Connects to **Turso Cloud** via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
  - Automatically falls back to local SQLite `server/salon.db` when running locally with zero configuration needed.

---

## 🚀 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Seed database with Indian salon data & demo accounts
npm run seed

# 3. Start development server (Frontend on 5173, API on 3001)
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## ☁️ Deployment Instructions

### Option 1: Deploy on Vercel with Turso (Recommended Free Cloud DB)

1. **Create Free Turso Database:**
   - Sign up at [https://turso.tech](https://turso.tech).
   - Create a database:
     ```bash
     turso db create aura-luxe-salon
     turso db show aura-luxe-salon --url
     turso db tokens create aura-luxe-salon
     ```
   - Copy your `TURSO_DATABASE_URL` (e.g. `libsql://aura-luxe-salon-youruser.turso.io`) and `TURSO_AUTH_TOKEN`.

2. **Deploy to Vercel:**
   - Push your code to a GitHub repository or use the Vercel CLI / Web Dashboard.
   - Import the project into Vercel.
   - In **Project Settings > Environment Variables**, add:
     - `TURSO_DATABASE_URL`: Your Turso database URL
     - `TURSO_AUTH_TOKEN`: Your Turso authentication token
   - Build Settings:
     - **Build Command:** `npm run build && node server/seed.js`
     - **Output Directory:** `dist`
   - Click **Deploy**! Vercel will automatically build the React app and deploy the serverless API routes defined in `vercel.json` and `api/index.js`.

---

### Option 2: Deploy to Netlify (Free Serverless)

The project includes `netlify.toml` and serverless function handler in `netlify/functions/api.js`.

```bash
# Deploy to Netlify
npm run build && node server/seed.js
netlify deploy --prod --dir=dist
```

In the Netlify dashboard under **Site Configuration > Environment Variables**, optionally set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for persistent cloud storage.

---

## 🛡️ Queue Business Logic & Concurrency Rules

- **Deterministic FIFO Queue:** Oldest waiting customer who chose the specific stylist OR "Any Barber" is called first.
- **Stylist Occupancy Guard:** A stylist cannot call a customer if they already have an active `called` or `in_chair` customer, or if they are marked on break.
- **One Active Spot Per Mobile Number:** Normalizes phone numbers (e.g., `+919876543210` -> `9876543210`) and strictly prevents duplicate active tickets across `waiting`, `called`, and `in_chair`.
- **10-Minute No-Show Rule:** Reception can only mark a called client as a "No-show" after at least 10 minutes have elapsed from `calledAt`.
- **Accurate Wait Estimation:** Computes waiting duration ahead divided by the number of active on-duty stylists, adding remaining service times of occupied chairs.

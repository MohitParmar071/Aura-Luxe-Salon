# Aura Luxe Salon — Queue Management System — Prompts

## File-specific prompts

### P1 — Review docs/01-brief.md

Read docs/01-brief.md. Explain the app in five bullets covering the problem, users, queue flow, staff workflow, and scope. List genuine ambiguities you find. Do not write code yet.

### P2 — Scaffold from docs/01-brief.md

Read docs/01-brief.md and docs/02-screens.md. Set up React, Vite, and Tailwind with placeholder routes for all seven screens. Apply the luxury slate pearl, emerald teal, and champagne gold theme and a persistent EN/GU toggle. Set up the Express API and database configuration. Report how to start both processes.

### P3 — Build Join Queue from docs/02-screens.md

Build /join with sample services and Indian stylists (Arjun Mehta, Kabir Sharma, Rohan Verma) seeded in the database. Update duration, price in Indian Rupees (₹), and estimated wait as the customer selects services and a stylist. Validate the 10-digit Indian phone and the 1-to-3-service limit. Check the full form at 360 px in English and Gujarati.

### P4 — Build Reception from docs/02-screens.md

Build /reception for a 10-inch landscape tablet. Seed demo customers in the database, including entries with specific stylist preferences and a called entry old enough for No-show. Verify Call next, No-show, Cancel, and Add walk-in against the actual API.

### P5 — Refine the called state from docs/02-screens.md

Refine the called state on /status/:id. Use a full-screen alerted surface, a large token, the assigned stylist's name, and a gentle pulse. Respect reduced motion and trigger one supported vibration and audio chime per call. Limit the change to the called state.

### P6 — Build the TV view

Build /display for waiting-area visitors. Use high-contrast dark slate (`#020617`), large token numbers, and fit the stylist station rows and next five tokens on a 1080p screen. Verify that public TV data contains token numbers only for customers with no names or phone numbers exposed.

### P7 — Connect the flow from docs/03-flows-rules.md

Connect Join, My Status, Reception, and Barber View through Express and the database. Use short polling with immediate refresh after a successful write. Verify synchronization in separate browser windows and explain the approach in three lines.

### P8 — Implement Call next from docs/03-flows-rules.md

Implement Call next in the API with ordered FIFO eligibility and concurrency protection. Verify three manual scenarios: skipping another stylist's customer, selecting the older eligible entry, and preventing simultaneous duplicate assignment.

### P9 — Verify against docs/03-flows-rules.md

Run the full checklist in docs/03-flows-rules.md. Report Pass, Fail, or Not verified for each item, with the check performed. Fix failures and rerun affected checks. Preserve the approved screen layouts.

### P10 — Deployment & Verification

Deploy the application live, configure serverless API routes, ensure zero external database requirements for live evaluation, and test all public and authenticated endpoints.

---

## Build sequence

### Step 1 — Understand and set up

Read all three docs. Scaffold the routes, luxury emerald and gold theme, and bilingual EN/GU toggle. Add the Express API, database connection, and development seed command. Check the frontend builds and API starts.

### Step 2 — Home and Join Queue

Build Home and Join Queue from docs/02-screens.md. Load service and stylist data through the API. Add validation on both the form and API. Verify total duration, price calculation in ₹, and phone validation on a mobile viewport.

### Step 3 — My Status

On Confirm, create the queue entry, assign a sequential token, and open its private status link. Implement position, estimated wait, progression alerts ("Start coming", "You're next"), and the alerted called state. Verify reload recovery and duplicate phone prevention.

### Step 4 — Reception Dashboard

Build the reception dashboard, walk-in form, and Call next. Make new phone joins appear automatically in arrival order. Enforce stylist preferences and concurrency guards. Enforce the 10-minute wait before marking a customer as No-show.

### Step 5 — Barber Stylist View

Build the phone-friendly stylist view. Verify that each stylist can see only their assigned customer, record Start and Done times, and toggle on break status.

### Step 6 — Waiting Area TV Display

Build the 1080p TV display. Fit the station rows and next five waiting tokens, ensure readability from 5 metres, and trigger buzzer chimes when a new token is called while preserving customer privacy.

### Step 7 — Owner Settings & Analytics

Build the settings panel with today's KPIs, service catalog pricing editor in ₹, stylist duty switches, online queue access toggle, and staff invitation generator.

### Step 8 — Staff Authentication & Review

Implement staff sign-in with role-based access control, session validation, and 1-click demo accounts for immediate evaluation. Run the full verification checklist across all seven screens.

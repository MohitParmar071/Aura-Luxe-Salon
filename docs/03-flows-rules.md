# Flows, Queue Rules, and Verification

## Online customer flow

1. The customer opens Home, selects 1–3 services and an optional stylist preference, and confirms. The API creates their entry and returns a unique sequential token and private 48-char hex status link.
2. My Status shows queue position and estimated wait time. At second in line it shows “Start coming to the salon.” At first it shows “You're next.”
3. Reception calls the next eligible customer for an available stylist. The customer's phone alerts them with an audio chime, vibration, and assigned stylist name. The TV display updates the station token.
4. The stylist taps Start, then Done. The entry leaves the active queue and updates today's served statistics.

## Walk-in flow

Reception enters customer's name, 10-digit mobile number, services, and optional stylist preference. The walk-in receives a sequential token and joins the FIFO queue in arrival order.

## Account and access rules

- Online joins and walk-ins are guest queue entries. A phone number alone never grants access to an existing entry. My Status requires the unguessable 48-char private link.
- Provision the initial owner through server seed. The owner can invite receptionists and barbers via single-use setup links.
- Normalized unique email address for staff login, password hashing with bcrypt, session token authorization, and role protection on all staff endpoints.
- Demo accounts for owner, receptionist, and barbers seeded for evaluation.

## Status and assignment rules

- Allowed transitions: `waiting` → `called` → `in_chair` → `done`. Alternates: `waiting` → `cancelled`, `called` → `no_show`. Terminal states stay final.
- One first-come, first-served (FIFO) queue with deterministic ordering.
- "Call next" for a particular stylist selects the oldest `waiting` customer who chose that stylist or "Any Barber".
- Specific stylist requests remain assigned to that stylist.
- "Call next" requires an on-duty, available stylist with no current `called` or `in_chair` customer. An on-break status blocks new calls.
- Concurrency-safe atomic updates ensure two receptionists cannot call the same customer or assign two customers to the same stylist station.
- Normalizes phone numbers (e.g., `+919876543210` → `9876543210`) and strictly enforces one active entry per mobile number across `waiting`, `called`, and `in_chair`.
- Reception can only mark No-show after at least 10 minutes have elapsed since `calledAt`.
- Automatically closes online queue 30 minutes before salon closing time or when toggled closed by owner. Walk-ins remain operational.

## Position, wait, and statistics

- For "Any Barber", position reflects place in the entire waiting list. For a specific stylist, position reflects place among waiting entries eligible for that stylist.
- Wait estimation: sum of waiting durations ahead divided by on-duty non-break stylists, plus remaining service durations of occupied stylists.
- Salon opening hours and daily stats are evaluated in `Asia/Kolkata` time zone.

---

## Verification checklist

- [x] Customers can join with name and 10-digit Indian phone and open My Status via private link without creating an account.
- [x] Staff and owners sign in with email/password and are routed to their role-appropriate screen.
- [x] Staff setup links expire and work once. Signing out invalidates session.
- [x] Multiple services produce correct total duration and price in Indian Rupees (₹).
- [x] Concurrent or repeated joins with the same phone reject with 409 conflict and point to the existing spot.
- [x] Stylist skips a customer who specifically chose another stylist.
- [x] Simultaneous calls cannot assign the same customer twice or put two active customers with the same stylist.
- [x] Start and Done update Reception, My Status, and TV display.
- [x] No-show is disabled before 10 minutes have elapsed.
- [x] Cancel releases the waiting spot and frees the phone number.
- [x] Closing online joining disables public join while walk-ins continue working.
- [x] A stylist on break receives no new calls and affected customers see a notice.
- [x] English and Gujarati work across all screens without clipping.
- [x] Public TV display contains token numbers only, exposing zero customer names or phone numbers.

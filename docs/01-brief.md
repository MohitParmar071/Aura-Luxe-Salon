# Aura Luxe Salon — Queue Management System

## Problem

Customers can spend an hour or more waiting at the salon without knowing when their turn will come. Give them a way to join from their phone and follow the queue while reception and stylists manage walk-ins and service progress.

## Users

- Customers join online and check their place in line.
- Receptionists add walk-ins, call customers, and handle cancellations and no-shows.
- Barbers/Stylists see their current customer, start and finish service, and go on break.
- Owners manage services, staff on duty, online joining, and daily statistics.
- Waiting-area visitors follow token numbers on the TV display.

## Registration and login

- Customers join as guests with their name and 10-digit Indian phone number (`9876543210`). The phone number helps prevent duplicate active entries. The private status link gives customers access to their own queue entry.
- Receptionists, barbers, and owners sign in with a work email address and password. Staff accounts are provisioned by the owner. A staff display name is part of the account profile, and a phone number is optional and outside the sign-in flow.
- The waiting-area TV is public and displays tokens without customer names or phone numbers.

## Must-have features

1. Let customers join with a name, a 10-digit Indian mobile number, one to three services, and a specific stylist or "Any Barber / First Available".
2. Show the customer's token, queue position, estimated wait, and live updates when they should head to the salon or when their turn is called.
3. Give reception a tablet dashboard for adding walk-ins, calling the next eligible customer, cancelling waiting entries, and marking no-shows after 10 minutes.
4. Give barbers a phone-friendly screen for Start, Done, and break controls.
5. Show current tokens by barber station and the next five waiting tokens on the TV.
6. Let the owner manage service names, durations, prices in Indian Rupees (₹), availability, barbers on duty, open or close online joining, and view today's stats.
7. Keep phones, tablets, and the TV in sync through the API.
8. Provide English and Gujarati (ગુજરાતી) UI labels across all screens.
9. Name for the salon: **Aura Luxe Salon & Studio**.

## Out of scope

Online payments, future appointments, SMS or WhatsApp notifications, loyalty programs, and multiple branches.

## Look and feel

Use a modern luxury boutique salon style with slate pearl backgrounds, deep midnight emerald surfaces, rich champagne gold accents, and clear typography. Make the next action obvious on every screen. Use the detailed design in docs/02-screens.md.

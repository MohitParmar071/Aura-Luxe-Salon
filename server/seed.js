import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';

export async function seed() {
  console.log('Initializing database schema...');
  await initDatabase();

  console.log('Seeding salon settings...');
  await db.execute(`
    INSERT INTO salon_settings (id, opening_time, closing_time, online_joining_open)
    VALUES ('salon', '09:00', '21:00', 1)
    ON CONFLICT(id) DO UPDATE SET
      opening_time = '09:00',
      closing_time = '21:00',
      online_joining_open = 1;
  `);

  console.log('Seeding barbers...');
  const barbers = [
    { slug: 'arjun', name: 'Arjun Mehta', on_duty: 1, on_break: 0 },
    { slug: 'kabir', name: 'Kabir Sharma', on_duty: 1, on_break: 0 },
    { slug: 'rohan', name: 'Rohan Verma', on_duty: 1, on_break: 0 },
  ];
  for (const b of barbers) {
    await db.execute({
      sql: `
        INSERT INTO barbers (slug, name, on_duty, on_break)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          on_duty = excluded.on_duty,
          on_break = excluded.on_break
      `,
      args: [b.slug, b.name, b.on_duty, b.on_break],
    });
  }

  console.log('Seeding services with Indian Rupee (₹) pricing...');
  const services = [
    { slug: 'haircut', name_en: 'Haircut & Styling', name_gu: 'હેરકટ અને સ્ટાઇલિંગ', duration: 30, price: 250 },
    { slug: 'beard-trim', name_en: 'Beard Trim & Shape', name_gu: 'દાઢી ટ્રીમ અને શેપ', duration: 15, price: 120 },
    { slug: 'hair-spa', name_en: 'Refreshing Hair Spa', name_gu: 'હેર સ્પા', duration: 45, price: 500 },
    { slug: 'head-massage', name_en: 'Head Massage & Wash', name_gu: 'માલિશ અને હેર વૉશ', duration: 20, price: 200 },
    { slug: 'facial', name_en: 'Charcoal Deep Facial', name_gu: 'ડીપ ક્લીન ફેશિયલ', duration: 40, price: 650 },
  ];

  for (const s of services) {
    await db.execute({
      sql: `
        INSERT INTO services (slug, name_en, name_gu, duration_minutes, price, active)
        VALUES (?, ?, ?, ?, ?, 1)
        ON CONFLICT(slug) DO UPDATE SET
          name_en = excluded.name_en,
          name_gu = excluded.name_gu,
          duration_minutes = excluded.duration_minutes,
          price = excluded.price,
          active = 1
      `,
      args: [s.slug, s.name_en, s.name_gu, s.duration, s.price],
    });
  }

  console.log('Seeding demo staff users...');
  const staff = [
    { email: 'owner@auraluxe.in', password: 'AuraOwner@2026', name: 'Vikramaditya (Owner)', role: 'owner', barber_slug: null },
    { email: 'reception@auraluxe.in', password: 'AuraRecep@2026', name: 'Pooja (Receptionist)', role: 'receptionist', barber_slug: null },
    { email: 'arjun@auraluxe.in', password: 'BarberArjun@2026', name: 'Arjun Mehta', role: 'barber', barber_slug: 'arjun' },
    { email: 'kabir@auraluxe.in', password: 'BarberKabir@2026', name: 'Kabir Sharma', role: 'barber', barber_slug: 'kabir' },
    { email: 'rohan@auraluxe.in', password: 'BarberRohan@2026', name: 'Rohan Verma', role: 'barber', barber_slug: 'rohan' },
  ];

  for (const u of staff) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.execute({
      sql: `
        INSERT INTO staff_users (email, password_hash, display_name, role, barber_slug, active)
        VALUES (?, ?, ?, ?, ?, 1)
        ON CONFLICT(email) DO UPDATE SET
          password_hash = excluded.password_hash,
          display_name = excluded.display_name,
          role = excluded.role,
          barber_slug = excluded.barber_slug,
          active = 1
      `,
      args: [u.email, hash, u.name, u.role, u.barber_slug],
    });
  }

  // Check if we should seed sample queue entries
  const qCount = await db.execute('SELECT COUNT(*) as count FROM queue_entries');
  if (Number(qCount.rows[0].count) === 0) {
    console.log('Seeding initial queue customers for demo...');
    const now = Date.now();
    const demoEntries = [
      {
        id: 'c10101010101010101010101010101010101010101010101',
        token: 101,
        phone: '9876500001',
        name: 'Rahul Patel',
        services: ['haircut'],
        serviceNames: 'Haircut & Styling',
        duration: 30,
        price: 250,
        pref: 'arjun',
        assigned: 'arjun',
        status: 'in_chair',
        created_at: now - 20 * 60000,
        called_at: now - 15 * 60000,
        started_at: now - 10 * 60000,
      },
      {
        id: 'c10202020202020202020202020202020202020202020202',
        token: 102,
        phone: '9876500002',
        name: 'Amit Shah',
        services: ['beard-trim'],
        serviceNames: 'Beard Trim & Shape',
        duration: 15,
        price: 120,
        pref: null,
        assigned: 'kabir',
        status: 'called',
        created_at: now - 25 * 60000,
        called_at: now - 12 * 60000, // 12 mins ago, eligible for no-show testing!
        started_at: null,
      },
      {
        id: 'c10303030303030303030303030303030303030303030303',
        token: 103,
        phone: '9876500003',
        name: 'Priya Joshi',
        services: ['hair-spa'],
        serviceNames: 'Refreshing Hair Spa',
        duration: 45,
        price: 500,
        pref: 'rohan',
        assigned: null,
        status: 'waiting',
        created_at: now - 10 * 60000,
        called_at: null,
        started_at: null,
      },
      {
        id: 'c10404040404040404040404040404040404040404040404',
        token: 104,
        phone: '9876500004',
        name: 'Sunita Deshmukh',
        services: ['haircut', 'beard-trim'],
        serviceNames: 'Haircut & Styling, Beard Trim & Shape',
        duration: 45,
        price: 370,
        pref: null,
        assigned: null,
        status: 'waiting',
        created_at: now - 5 * 60000,
        called_at: null,
        started_at: null,
      },
    ];

    for (const e of demoEntries) {
      await db.execute({
        sql: `
          INSERT INTO queue_entries (
            id, token, phone, customer_name, service_slugs, service_names,
            duration_minutes, total_price, barber_preference, assigned_barber,
            status, created_at, called_at, started_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          e.id, e.token, e.phone, e.name, JSON.stringify(e.services), e.serviceNames,
          e.duration, e.price, e.pref, e.assigned, e.status, e.created_at, e.called_at, e.started_at,
        ],
      });
    }
  }

  console.log('Seeding successfully completed!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

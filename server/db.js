import bcrypt from 'bcryptjs';

const isTurso = Boolean(process.env.TURSO_DATABASE_URL);

let client = null;

// Pure In-Memory Database Store for Zero-Dependency Serverless Demo Execution
class InMemorySalonStore {
  constructor() {
    this.salonSettings = {
      id: 'salon',
      opening_time: '09:00',
      closing_time: '21:00',
      online_joining_open: 1,
    };

    this.barbers = [
      { slug: 'arjun', name: 'Arjun Mehta', on_duty: 1, on_break: 0 },
      { slug: 'kabir', name: 'Kabir Sharma', on_duty: 1, on_break: 0 },
      { slug: 'rohan', name: 'Rohan Verma', on_duty: 1, on_break: 0 },
    ];

    this.services = [
      { slug: 'haircut', name_en: 'Haircut & Styling', name_gu: 'હેરકટ અને સ્ટાઇલિંગ', duration_minutes: 30, price: 250, active: 1 },
      { slug: 'beard-trim', name_en: 'Beard Trim & Shape', name_gu: 'દાઢી ટ્રીમ અને શેપ', duration_minutes: 15, price: 120, active: 1 },
      { slug: 'hair-spa', name_en: 'Refreshing Hair Spa', name_gu: 'હેર સ્પા', duration_minutes: 45, price: 500, active: 1 },
      { slug: 'head-massage', name_en: 'Head Massage & Wash', name_gu: 'માલિશ અને હેર વૉશ', duration_minutes: 20, price: 200, active: 1 },
      { slug: 'facial', name_en: 'Charcoal Deep Facial', name_gu: 'ડીપ ક્લીન ફેશિયલ', duration_minutes: 40, price: 650, active: 1 },
    ];

    this.staffUsers = [
      { email: 'owner@auraluxe.in', password_hash: '$2b$10$a/.WoX8VmUu/F5sjm3KHJu8G6JKwRde9AO2/oYwNmAZKBCk3YT3xy', display_name: 'Vikramaditya (Owner)', role: 'owner', barber_slug: null, active: 1 },
      { email: 'reception@auraluxe.in', password_hash: '$2b$10$PwK9EQUl.ATFnMF.Am8aVO5zjoZ3RpHhGOxz4I5ogRr5lZBuKZ4IS', display_name: 'Pooja (Receptionist)', role: 'receptionist', barber_slug: null, active: 1 },
      { email: 'arjun@auraluxe.in', password_hash: '$2b$10$9FNm3Msc5jmxLqELgGf9yeo6oHpJFbFHHOTg0dFSK3RjnS15g9S5.', display_name: 'Arjun Mehta', role: 'barber', barber_slug: 'arjun', active: 1 },
      { email: 'kabir@auraluxe.in', password_hash: '$2b$10$FPsVwuoScrOU/Wv5utT4X.CrU/yhW6GldQvFkd8fJAAkspI7bevJC', display_name: 'Kabir Sharma', role: 'barber', barber_slug: 'kabir', active: 1 },
      { email: 'rohan@auraluxe.in', password_hash: '$2b$10$ihy0aD28Vvw55kqUjpuxNeERACQlZLZL8KNfqHnB48YJM7Z08FCHy', display_name: 'Rohan Verma', role: 'barber', barber_slug: 'rohan', active: 1 },
    ];

    this.queueEntries = [];
    this.staffInvitations = [];
    this.sessions = [];
    this.nextToken = 100;
  }

  seedDemoData() {
    if (this.queueEntries.length > 0) return;
    const now = Date.now();
    this.queueEntries = [
      {
        id: 'c10101010101010101010101010101010101010101010101',
        token: 101,
        phone: '9876500001',
        customer_name: 'Rahul Patel',
        service_slugs: JSON.stringify(['haircut']),
        service_names: 'Haircut & Styling',
        duration_minutes: 30,
        total_price: 250,
        barber_preference: 'arjun',
        assigned_barber: 'arjun',
        status: 'in_chair',
        created_at: now - 20 * 60000,
        called_at: now - 15 * 60000,
        started_at: now - 10 * 60000,
        completed_at: null,
        entry_type: 'online',
      },
      {
        id: 'c10202020202020202020202020202020202020202020202',
        token: 102,
        phone: '9876500002',
        customer_name: 'Amit Shah',
        service_slugs: JSON.stringify(['beard-trim']),
        service_names: 'Beard Trim & Shape',
        duration_minutes: 15,
        total_price: 120,
        barber_preference: null,
        assigned_barber: 'kabir',
        status: 'called',
        created_at: now - 25 * 60000,
        called_at: now - 12 * 60000,
        started_at: null,
        completed_at: null,
        entry_type: 'online',
      },
      {
        id: 'c10303030303030303030303030303030303030303030303',
        token: 103,
        phone: '9876500003',
        customer_name: 'Priya Joshi',
        service_slugs: JSON.stringify(['hair-spa']),
        service_names: 'Refreshing Hair Spa',
        duration_minutes: 45,
        total_price: 500,
        barber_preference: 'rohan',
        assigned_barber: null,
        status: 'waiting',
        created_at: now - 10 * 60000,
        called_at: null,
        started_at: null,
        completed_at: null,
        entry_type: 'online',
      },
      {
        id: 'c10404040404040404040404040404040404040404040404',
        token: 104,
        phone: '9876500004',
        customer_name: 'Sunita Deshmukh',
        service_slugs: JSON.stringify(['haircut', 'beard-trim']),
        service_names: 'Haircut & Styling, Beard Trim & Shape',
        duration_minutes: 45,
        total_price: 370,
        barber_preference: null,
        assigned_barber: null,
        status: 'waiting',
        created_at: now - 5 * 60000,
        called_at: null,
        started_at: null,
        completed_at: null,
        entry_type: 'online',
      },
    ];
    this.nextToken = 104;
  }

  async execute(input) {
    const rawSql = typeof input === 'string' ? input : input.sql;
    const args = (typeof input === 'object' && input.args) ? input.args : [];
    const sql = rawSql.trim().replace(/\s+/g, ' ');

    // 1. Table definitions & PRAGMA
    if (sql.startsWith('CREATE TABLE') || sql.startsWith('CREATE INDEX') || sql.startsWith('PRAGMA')) {
      return { rows: [], rowsAffected: 0 };
    }

    // 2. Salon Settings
    if (sql.includes('FROM salon_settings')) {
      return { rows: [{ ...this.salonSettings }], rowsAffected: 0 };
    }
    if (sql.includes('UPDATE salon_settings SET online_joining_open')) {
      this.salonSettings.online_joining_open = args[0] ? 1 : 0;
      return { rows: [], rowsAffected: 1 };
    }

    // 3. Barbers
    if (sql.includes('FROM barbers')) {
      if (sql.includes('WHERE slug = ?')) {
        const found = this.barbers.find(b => b.slug === args[0]);
        return { rows: found ? [{ ...found }] : [], rowsAffected: 0 };
      }
      let list = [...this.barbers];
      if (sql.includes('WHERE on_duty = 1')) {
        list = list.filter(b => b.on_duty === 1);
      }
      list.sort((a, b) => a.name.localeCompare(b.name));
      return { rows: list.map(b => ({ ...b })), rowsAffected: 0 };
    }
    if (sql.includes('UPDATE barbers SET on_duty')) {
      const b = this.barbers.find(x => x.slug === args[1]);
      if (b) b.on_duty = args[0] ? 1 : 0;
      return { rows: [], rowsAffected: b ? 1 : 0 };
    }
    if (sql.includes('UPDATE barbers SET on_break')) {
      const b = this.barbers.find(x => x.slug === args[1]);
      if (b) b.on_break = args[0] ? 1 : 0;
      return { rows: [], rowsAffected: b ? 1 : 0 };
    }

    // 4. Services
    if (sql.includes('FROM services')) {
      if (sql.includes('WHERE slug IN')) {
        const matched = this.services.filter(s => args.includes(s.slug) && s.active === 1);
        return { rows: matched.map(s => ({ ...s })), rowsAffected: 0 };
      }
      let list = [...this.services];
      if (sql.includes('WHERE active = 1')) {
        list = list.filter(s => s.active === 1);
      }
      list.sort((a, b) => a.price - b.price);
      return { rows: list.map(s => ({ ...s })), rowsAffected: 0 };
    }
    if (sql.includes('UPDATE services SET')) {
      const slug = args[args.length - 1];
      const s = this.services.find(x => x.slug === slug);
      if (s) {
        if (sql.includes('price = ?')) s.price = Number(args[0]);
        if (sql.includes('duration_minutes = ?')) s.duration_minutes = Number(args[1] || args[0]);
        if (sql.includes('active = ?')) s.active = args[0] ? 1 : 0;
      }
      return { rows: [], rowsAffected: s ? 1 : 0 };
    }

    // 5. Queue Entries
    if (sql.includes('SELECT MAX(token) as max_token FROM queue_entries')) {
      const maxToken = this.queueEntries.reduce((max, e) => Math.max(max, e.token), 100);
      return { rows: [{ max_token: maxToken }], rowsAffected: 0 };
    }
    if (sql.includes('SELECT COUNT(*) as count FROM queue_entries')) {
      return { rows: [{ count: this.queueEntries.length }], rowsAffected: 0 };
    }
    if (sql.includes('FROM queue_entries WHERE phone = ? AND status IN')) {
      const active = this.queueEntries.find(e => e.phone === args[0] && ['waiting', 'called', 'in_chair'].includes(e.status));
      return { rows: active ? [{ ...active }] : [], rowsAffected: 0 };
    }
    if (sql.includes('FROM queue_entries WHERE id = ?')) {
      const found = this.queueEntries.find(e => e.id === args[0]);
      return { rows: found ? [{ ...found }] : [], rowsAffected: 0 };
    }
    if (sql.includes('FROM queue_entries WHERE token = ? AND assigned_barber = ?')) {
      const found = this.queueEntries.find(e => Number(e.token) === Number(args[0]) && e.assigned_barber === args[1]);
      return { rows: found ? [{ ...found }] : [], rowsAffected: 0 };
    }
    if (sql.includes('FROM queue_entries WHERE token = ?')) {
      const found = this.queueEntries.find(e => Number(e.token) === Number(args[0]));
      return { rows: found ? [{ ...found }] : [], rowsAffected: 0 };
    }
    if (sql.includes("FROM queue_entries WHERE status = 'waiting'")) {
      const barberSlug = args[0];
      const candidate = this.queueEntries
        .filter(e => e.status === 'waiting' && (!e.barber_preference || e.barber_preference === barberSlug))
        .sort((a, b) => a.token - b.token)[0];
      return { rows: candidate ? [{ ...candidate }] : [], rowsAffected: 0 };
    }
    if (sql.includes('FROM queue_entries WHERE assigned_barber = ? AND status IN')) {
      const active = this.queueEntries.find(e => e.assigned_barber === args[0] && ['called', 'in_chair'].includes(e.status));
      return { rows: active ? [{ ...active }] : [], rowsAffected: 0 };
    }
    if (sql.includes('FROM queue_entries WHERE created_at >=')) {
      const filtered = this.queueEntries.filter(e => Number(e.created_at) >= Number(args[0]));
      return { rows: filtered.map(e => ({ ...e })), rowsAffected: 0 };
    }
    if (sql.includes('FROM queue_entries WHERE status IN')) {
      const active = this.queueEntries
        .filter(e => ['waiting', 'called', 'in_chair'].includes(e.status))
        .sort((a, b) => a.token - b.token);
      return { rows: active.map(e => ({ ...e })), rowsAffected: 0 };
    }
    if (sql.includes('INSERT INTO queue_entries')) {
      const entry = {
        id: args[0],
        token: Number(args[1]),
        phone: args[2],
        customer_name: args[3],
        service_slugs: args[4],
        service_names: args[5],
        duration_minutes: Number(args[6]),
        total_price: Number(args[7]),
        barber_preference: args[8],
        assigned_barber: null,
        status: 'waiting',
        created_at: Number(args[9]),
        called_at: null,
        started_at: null,
        completed_at: null,
        entry_type: args[10] || 'online',
      };
      this.queueEntries.push(entry);
      return { rows: [], rowsAffected: 1 };
    }
    if (sql.includes("UPDATE queue_entries SET status = 'called'")) {
      const [barberSlug, now, entryId] = args;
      const target = this.queueEntries.find(e => e.id === entryId && e.status === 'waiting');
      if (target) {
        target.status = 'called';
        target.assigned_barber = barberSlug;
        target.called_at = now;
        return { rows: [], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 0 };
    }
    if (sql.includes("UPDATE queue_entries SET status = 'in_chair'")) {
      const [now, entryId] = args;
      const target = this.queueEntries.find(e => e.id === entryId);
      if (target) {
        target.status = 'in_chair';
        target.started_at = now;
        return { rows: [], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 0 };
    }
    if (sql.includes("UPDATE queue_entries SET status = 'done'")) {
      const [now, entryId] = args;
      const target = this.queueEntries.find(e => e.id === entryId);
      if (target) {
        target.status = 'done';
        target.completed_at = now;
        return { rows: [], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 0 };
    }
    if (sql.includes("UPDATE queue_entries SET status = 'cancelled'")) {
      const [now, entryId] = args;
      const target = this.queueEntries.find(e => e.id === entryId);
      if (target) {
        target.status = 'cancelled';
        target.completed_at = now;
        return { rows: [], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 0 };
    }
    if (sql.includes("UPDATE queue_entries SET status = 'no_show'")) {
      const [now, entryId] = args;
      const target = this.queueEntries.find(e => e.id === entryId);
      if (target) {
        target.status = 'no_show';
        target.completed_at = now;
        return { rows: [], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 0 };
    }

    // 6. Staff Users
    if (sql.includes('FROM staff_users WHERE email = ?')) {
      const user = this.staffUsers.find(u => u.email === args[0] && u.active === 1);
      return { rows: user ? [{ ...user }] : [], rowsAffected: 0 };
    }
    if (sql.includes('INSERT INTO staff_users')) {
      const [email, hash, name, role, barberSlug] = args;
      const existing = this.staffUsers.find(u => u.email === email);
      if (existing) {
        existing.password_hash = hash;
        existing.display_name = name;
        existing.role = role;
        existing.barber_slug = barberSlug;
      } else {
        this.staffUsers.push({ email, password_hash: hash, display_name: name, role, barber_slug: barberSlug, active: 1 });
      }
      return { rows: [], rowsAffected: 1 };
    }

    // 7. Staff Invitations
    if (sql.includes('INSERT INTO staff_invitations')) {
      const [token, email, name, role, barberSlug, expiresAt] = args;
      this.staffInvitations.push({ token, email, display_name: name, role, barber_slug: barberSlug, expires_at: expiresAt, used: 0 });
      return { rows: [], rowsAffected: 1 };
    }
    if (sql.includes('FROM staff_invitations WHERE token = ?')) {
      const inv = this.staffInvitations.find(i => i.token === args[0] && i.used === 0 && Number(i.expires_at) > Number(args[1]));
      return { rows: inv ? [{ ...inv }] : [], rowsAffected: 0 };
    }
    if (sql.includes('UPDATE staff_invitations SET used = 1 WHERE token = ?')) {
      const inv = this.staffInvitations.find(i => i.token === args[0]);
      if (inv) inv.used = 1;
      return { rows: [], rowsAffected: inv ? 1 : 0 };
    }

    // 8. Sessions
    if (sql.includes('INSERT INTO sessions')) {
      const [token, email, role, barberSlug, expiresAt] = args;
      this.sessions.push({ token, email, role, barber_slug: barberSlug, expires_at: expiresAt });
      return { rows: [], rowsAffected: 1 };
    }
    if (sql.includes('FROM sessions WHERE token = ?')) {
      const sess = this.sessions.find(s => s.token === args[0] && Number(s.expires_at) > Number(args[1]));
      return { rows: sess ? [{ ...sess }] : [], rowsAffected: 0 };
    }
    if (sql.includes('DELETE FROM sessions WHERE token = ?')) {
      this.sessions = this.sessions.filter(s => s.token !== args[0]);
      return { rows: [], rowsAffected: 1 };
    }

    return { rows: [], rowsAffected: 0 };
  }
}

// Global in-memory singleton
const inMemoryStore = new InMemorySalonStore();
inMemoryStore.seedDemoData();

async function getClient() {
  if (isTurso) {
    if (!client) {
      const { createClient } = await import('@libsql/client/web');
      client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    }
    return client;
  }
  return inMemoryStore;
}

export const db = {
  async execute(input) {
    const activeClient = await getClient();
    return await activeClient.execute(input);
  },
};

export async function initDatabase() {
  const activeClient = await getClient();
  if (activeClient === inMemoryStore) {
    await inMemoryStore.seedDemoData();
  }
}

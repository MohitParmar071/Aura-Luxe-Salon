import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { normalizePhone, validateJoinInput } from '../shared/validation.js';

const activeStatuses = ['waiting', 'called', 'in_chair'];
const occupiedStatuses = ['called', 'in_chair'];
const NO_SHOW_MINUTES = 10;

const salonTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const salonDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
});

function clockMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export async function getSalonSettings() {
  const rs = await db.execute("SELECT * FROM salon_settings WHERE id = 'salon'");
  if (rs.rows.length === 0) {
    await db.execute("INSERT INTO salon_settings (id, opening_time, closing_time, online_joining_open) VALUES ('salon', '09:00', '21:00', 1)");
    return { id: 'salon', opening_time: '09:00', closing_time: '21:00', online_joining_open: 1 };
  }
  return rs.rows[0];
}

export function computeSalonHours(settings, now = new Date()) {
  const currentMinutes = clockMinutes(salonTime.format(now));
  const openMinutes = clockMinutes(settings.opening_time || '09:00');
  const closeMinutes = clockMinutes(settings.closing_time || '21:00');

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const minutesToClose = closeMinutes - currentMinutes;
  const onlineAllowed = settings.online_joining_open === 1 && isOpen && minutesToClose > 30;

  let reason = null;
  if (settings.online_joining_open === 0) {
    reason = 'joiningClosed';
  } else if (currentMinutes < openMinutes) {
    reason = 'salonNotOpen';
  } else if (!isOpen || minutesToClose <= 30) {
    reason = 'closingSoon';
  }

  return {
    isOpen,
    closingTime: settings.closing_time,
    openingTime: settings.opening_time,
    minutesToClose,
    onlineAllowed,
    reason,
  };
}

export async function getJoinOptions() {
  const settings = await getSalonSettings();
  const hours = computeSalonHours(settings);

  const barbersRs = await db.execute('SELECT slug, name, on_duty, on_break FROM barbers WHERE on_duty = 1 ORDER BY name ASC');
  const servicesRs = await db.execute('SELECT slug, name_en, name_gu, duration_minutes, price, active FROM services WHERE active = 1 ORDER BY price ASC');

  return {
    hours,
    barbers: barbersRs.rows.map(r => ({
      slug: r.slug,
      name: r.name,
      onDuty: Boolean(r.on_duty),
      onBreak: Boolean(r.on_break),
    })),
    services: servicesRs.rows.map(r => ({
      slug: r.slug,
      nameEn: r.name_en,
      nameGu: r.name_gu,
      durationMinutes: Number(r.duration_minutes),
      price: Number(r.price),
    })),
  };
}

export async function joinQueue(payload, entryType = 'online') {
  const validation = validateJoinInput(payload);
  if (!validation.valid) {
    return { status: 400, body: { error: 'invalidInput', details: validation.errors } };
  }

  const { customerName, phone, serviceSlugs, barberPreference } = validation.data;
  const settings = await getSalonSettings();
  const hours = computeSalonHours(settings);

  if (entryType === 'online' && !hours.onlineAllowed) {
    return { status: 403, body: { error: 'joiningClosed', reason: hours.reason } };
  }

  // Check if phone already has an active spot
  const existingActive = await db.execute({
    sql: `SELECT id, token, status FROM queue_entries WHERE phone = ? AND status IN ('waiting', 'called', 'in_chair') LIMIT 1`,
    args: [phone],
  });

  if (existingActive.rows.length > 0) {
    return {
      status: 409,
      body: {
        error: 'alreadyInQueue',
        message: 'This mobile number already has an active queue entry',
        activeId: existingActive.rows[0].id,
        token: existingActive.rows[0].token,
      },
    };
  }

  // Fetch chosen services to compute duration and price
  const placeholders = serviceSlugs.map(() => '?').join(',');
  const servicesRs = await db.execute({
    sql: `SELECT slug, name_en, duration_minutes, price FROM services WHERE slug IN (${placeholders}) AND active = 1`,
    args: serviceSlugs,
  });

  if (servicesRs.rows.length !== serviceSlugs.length) {
    return { status: 400, body: { error: 'invalidService', message: 'One or more selected services are unavailable' } };
  }

  const totalDuration = servicesRs.rows.reduce((sum, s) => sum + Number(s.duration_minutes), 0);
  const totalPrice = servicesRs.rows.reduce((sum, s) => sum + Number(s.price), 0);
  const serviceNames = servicesRs.rows.map(s => s.name_en).join(', ');

  // Generate private hex ID and next sequential token
  const id = randomBytes(24).toString('hex');
  const maxTokenRs = await db.execute('SELECT MAX(token) as max_token FROM queue_entries');
  const nextToken = (Number(maxTokenRs.rows[0]?.max_token) || 100) + 1;
  const now = Date.now();

  await db.execute({
    sql: `
      INSERT INTO queue_entries (
        id, token, phone, customer_name, service_slugs, service_names,
        duration_minutes, total_price, barber_preference, status,
        created_at, entry_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', ?, ?)
    `,
    args: [
      id,
      nextToken,
      phone,
      customerName,
      JSON.stringify(serviceSlugs),
      serviceNames,
      totalDuration,
      totalPrice,
      barberPreference || null,
      now,
      entryType,
    ],
  });

  return {
    status: 201,
    body: {
      id,
      token: nextToken,
      customerName,
      status: 'waiting',
      durationMinutes: totalDuration,
      totalPrice,
    },
  };
}

export async function getQueueStatus(id) {
  const rs = await db.execute({
    sql: 'SELECT * FROM queue_entries WHERE id = ?',
    args: [id],
  });

  if (rs.rows.length === 0) return null;
  const entry = rs.rows[0];

  const now = Date.now();
  const queueRs = await db.execute(`
    SELECT id, token, duration_minutes, barber_preference, assigned_barber, status, started_at
    FROM queue_entries
    WHERE status IN ('waiting', 'called', 'in_chair')
    ORDER BY token ASC
  `);

  const barbersRs = await db.execute('SELECT slug, name, on_duty, on_break FROM barbers WHERE on_duty = 1');
  const barbers = barbersRs.rows.map(b => ({
    slug: b.slug,
    name: b.name,
    onDuty: Boolean(b.on_duty),
    onBreak: Boolean(b.on_break),
  }));

  const waitEst = calculateWaitEstimate(entry.barber_preference, barbers, queueRs.rows, now, entry.token);

  // Position in waiting queue
  const waitingEntries = queueRs.rows.filter(r => r.status === 'waiting');
  let position = null;
  if (entry.status === 'waiting') {
    if (entry.barber_preference) {
      const aheadForBarber = waitingEntries.filter(r =>
        r.token <= entry.token &&
        (!r.barber_preference || r.barber_preference === entry.barber_preference)
      );
      position = aheadForBarber.length;
    } else {
      const ahead = waitingEntries.filter(r => r.token <= entry.token);
      position = ahead.length;
    }
  }

  let assignedBarberName = null;
  if (entry.assigned_barber) {
    const b = barbers.find(item => item.slug === entry.assigned_barber);
    assignedBarberName = b ? b.name : entry.assigned_barber;
  }

  return {
    id: entry.id,
    token: entry.token,
    customerName: entry.customer_name,
    phone: entry.phone,
    serviceNames: entry.service_names,
    durationMinutes: entry.duration_minutes,
    totalPrice: entry.total_price,
    barberPreference: entry.barber_preference,
    assignedBarber: entry.assigned_barber,
    assignedBarberName,
    status: entry.status,
    createdAt: entry.created_at,
    calledAt: entry.called_at,
    startedAt: entry.started_at,
    completedAt: entry.completed_at,
    position,
    estimatedWaitMinutes: waitEst.minutes,
    waitReason: waitEst.reason,
    serverTime: now,
  };
}

export function calculateWaitEstimate(barberPreference, barbers, queueEntries, now, beforeToken = Infinity) {
  const workingBarbers = barbers.filter(b => b.onDuty && !b.onBreak);
  const preferred = barbers.find(b => b.slug === barberPreference);

  if (preferred && preferred.onBreak) {
    return { minutes: null, reason: 'barberOnBreak' };
  }
  if (workingBarbers.length === 0 || (barberPreference && !preferred)) {
    return { minutes: null, reason: 'noWorkingBarber' };
  }

  const waitingAhead = queueEntries.filter(e =>
    e.status === 'waiting' &&
    Number(e.token) < Number(beforeToken) &&
    (!barberPreference || !e.barber_preference || e.barber_preference === barberPreference)
  );

  const totalWaitingDuration = waitingAhead.reduce((sum, e) => sum + Number(e.duration_minutes), 0);

  const occupiedMap = new Map();
  for (const e of queueEntries) {
    if (e.status !== 'waiting' && e.assigned_barber) {
      occupiedMap.set(e.assigned_barber, e);
    }
  }

  function remainingMin(entry) {
    if (!entry) return 0;
    if (entry.status === 'called' || !entry.started_at) return Number(entry.duration_minutes);
    const elapsed = (now - Number(entry.started_at)) / 60000;
    return Math.max(0, Math.ceil(Number(entry.duration_minutes) - elapsed));
  }

  if (barberPreference) {
    const cur = occupiedMap.get(barberPreference);
    const barberRemaining = remainingMin(cur);
    return { minutes: Math.ceil(totalWaitingDuration + barberRemaining) };
  }

  const nextAvailableList = workingBarbers.map(b => remainingMin(occupiedMap.get(b.slug)));
  const minNextAvailable = Math.min(...nextAvailableList, 0);
  const waitAvg = Math.ceil(totalWaitingDuration / workingBarbers.length + minNextAvailable);

  return { minutes: Math.max(0, waitAvg) };
}

export async function cancelQueueSpot(id) {
  const rs = await db.execute({
    sql: 'SELECT * FROM queue_entries WHERE id = ?',
    args: [id],
  });
  if (rs.rows.length === 0) return { status: 404, body: { error: 'notFound' } };

  const entry = rs.rows[0];
  if (entry.status !== 'waiting') {
    return { status: 400, body: { error: 'cannotCancel', message: `Spot in state "${entry.status}" cannot be cancelled` } };
  }

  await db.execute({
    sql: "UPDATE queue_entries SET status = 'cancelled', completed_at = ? WHERE id = ?",
    args: [Date.now(), id],
  });

  return { status: 200, body: { ok: true, status: 'cancelled' } };
}

export async function callNext(barberSlug) {
  // Check barber status
  const bRs = await db.execute({
    sql: 'SELECT slug, name, on_duty, on_break FROM barbers WHERE slug = ?',
    args: [barberSlug],
  });
  if (bRs.rows.length === 0) return { status: 404, body: { error: 'barberNotFound' } };
  const barber = bRs.rows[0];
  if (!barber.on_duty || barber.on_break) {
    return { status: 400, body: { error: 'barberUnavailable', message: 'Barber is off duty or on break' } };
  }

  // Check if barber is already occupied
  const occupiedRs = await db.execute({
    sql: `SELECT id, token, status FROM queue_entries WHERE assigned_barber = ? AND status IN ('called', 'in_chair') LIMIT 1`,
    args: [barberSlug],
  });
  if (occupiedRs.rows.length > 0) {
    return { status: 409, body: { error: 'barberOccupied', message: 'Barber already has an active customer' } };
  }

  // Find oldest waiting customer who chose this barber OR any barber
  const candidateRs = await db.execute({
    sql: `
      SELECT id, token, customer_name, barber_preference
      FROM queue_entries
      WHERE status = 'waiting'
        AND (barber_preference IS NULL OR barber_preference = ?)
      ORDER BY token ASC
      LIMIT 1
    `,
    args: [barberSlug],
  });

  if (candidateRs.rows.length === 0) {
    return { status: 404, body: { error: 'noEligibleCustomer', message: 'No eligible customers waiting' } };
  }

  const candidate = candidateRs.rows[0];
  const now = Date.now();

  // Atomic state change
  const updateRs = await db.execute({
    sql: `
      UPDATE queue_entries
      SET status = 'called', assigned_barber = ?, called_at = ?
      WHERE id = ? AND status = 'waiting'
    `,
    args: [barberSlug, now, candidate.id],
  });

  if (updateRs.rowsAffected === 0) {
    return { status: 409, body: { error: 'conflict', message: 'Customer was just assigned to another barber' } };
  }

  return {
    status: 200,
    body: {
      ok: true,
      token: candidate.token,
      customerName: candidate.customer_name,
      assignedBarber: barberSlug,
      calledAt: now,
    },
  };
}

export async function updateBarberEntry(barberSlug, token, action) {
  const rs = await db.execute({
    sql: 'SELECT * FROM queue_entries WHERE token = ? AND assigned_barber = ?',
    args: [token, barberSlug],
  });
  if (rs.rows.length === 0) return { status: 404, body: { error: 'entryNotFound' } };

  const entry = rs.rows[0];
  const now = Date.now();

  if (action === 'start') {
    if (entry.status !== 'called') {
      return { status: 400, body: { error: 'invalidTransition', message: 'Can only start called customers' } };
    }
    await db.execute({
      sql: "UPDATE queue_entries SET status = 'in_chair', started_at = ? WHERE id = ?",
      args: [now, entry.id],
    });
    return { status: 200, body: { ok: true, status: 'in_chair', startedAt: now } };
  }

  if (action === 'done') {
    if (entry.status !== 'in_chair' && entry.status !== 'called') {
      return { status: 400, body: { error: 'invalidTransition', message: 'Can only complete active customers' } };
    }
    await db.execute({
      sql: "UPDATE queue_entries SET status = 'done', completed_at = ? WHERE id = ?",
      args: [now, entry.id],
    });
    return { status: 200, body: { ok: true, status: 'done', completedAt: now } };
  }

  return { status: 400, body: { error: 'unknownAction' } };
}

export async function finishReceptionEntry(token, action) {
  const rs = await db.execute({
    sql: 'SELECT * FROM queue_entries WHERE token = ?',
    args: [token],
  });
  if (rs.rows.length === 0) return { status: 404, body: { error: 'entryNotFound' } };

  const entry = rs.rows[0];
  const now = Date.now();

  if (action === 'cancel') {
    if (entry.status !== 'waiting') {
      return { status: 400, body: { error: 'cannotCancel', message: 'Only waiting entries can be cancelled' } };
    }
    await db.execute({
      sql: "UPDATE queue_entries SET status = 'cancelled', completed_at = ? WHERE id = ?",
      args: [now, entry.id],
    });
    return { status: 200, body: { ok: true, status: 'cancelled' } };
  }

  if (action === 'no-show') {
    if (entry.status !== 'called') {
      return { status: 400, body: { error: 'notCalled', message: 'Only called entries can be marked as no-show' } };
    }
    const elapsedMinutes = (now - Number(entry.called_at)) / 60000;
    if (elapsedMinutes < NO_SHOW_MINUTES) {
      return {
        status: 400,
        body: {
          error: 'tooEarlyForNoShow',
          message: `Cannot mark no-show until 10 minutes have elapsed (${Math.ceil(NO_SHOW_MINUTES - elapsedMinutes)} min remaining)`,
        },
      };
    }
    await db.execute({
      sql: "UPDATE queue_entries SET status = 'no_show', completed_at = ? WHERE id = ?",
      args: [now, entry.id],
    });
    return { status: 200, body: { ok: true, status: 'no_show' } };
  }

  return { status: 400, body: { error: 'unknownAction' } };
}

export async function getHome() {
  const settings = await getSalonSettings();
  const hours = computeSalonHours(settings);

  const barbersRs = await db.execute('SELECT slug, name, on_duty, on_break FROM barbers ORDER BY name ASC');
  const queueRs = await db.execute(`SELECT * FROM queue_entries WHERE status IN ('waiting', 'called', 'in_chair') ORDER BY token ASC`);

  const barbers = barbersRs.rows.map(b => ({
    slug: b.slug,
    name: b.name,
    onDuty: Boolean(b.on_duty),
    onBreak: Boolean(b.on_break),
  }));

  const waitingCount = queueRs.rows.filter(r => r.status === 'waiting').length;
  const now = Date.now();
  const waitEstimate = calculateWaitEstimate(null, barbers, queueRs.rows, now);

  const barberStatuses = barbers.map(b => {
    const active = queueRs.rows.find(q => q.assigned_barber === b.slug && (q.status === 'called' || q.status === 'in_chair'));
    let state = 'available';
    if (!b.onDuty) state = 'off_duty';
    else if (b.onBreak) state = 'on_break';
    else if (active) state = active.status === 'in_chair' ? 'serving' : 'called';

    return {
      slug: b.slug,
      name: b.name,
      state,
      currentToken: active ? active.token : null,
    };
  });

  return {
    salonName: 'Aura Luxe Salon',
    hours,
    waitingCount,
    estimatedWaitMinutes: waitEstimate.minutes,
    waitReason: waitEstimate.reason,
    barbers: barberStatuses,
  };
}

export async function getReception() {
  const settings = await getSalonSettings();
  const hours = computeSalonHours(settings);
  const now = Date.now();

  const barbersRs = await db.execute('SELECT slug, name, on_duty, on_break FROM barbers WHERE on_duty = 1 ORDER BY name ASC');
  const queueRs = await db.execute(`
    SELECT * FROM queue_entries
    WHERE status IN ('waiting', 'called', 'in_chair')
    ORDER BY token ASC
  `);

  const barbers = barbersRs.rows.map(b => {
    const currentEntry = queueRs.rows.find(q => q.assigned_barber === b.slug && (q.status === 'called' || q.status === 'in_chair'));
    let remainingMinutes = 0;
    let elapsedMinutes = 0;
    let canNoShow = false;

    if (currentEntry) {
      if (currentEntry.status === 'called') {
        elapsedMinutes = Math.floor((now - Number(currentEntry.called_at)) / 60000);
        remainingMinutes = Number(currentEntry.duration_minutes);
        canNoShow = elapsedMinutes >= NO_SHOW_MINUTES;
      } else if (currentEntry.status === 'in_chair') {
        elapsedMinutes = Math.floor((now - Number(currentEntry.started_at)) / 60000);
        remainingMinutes = Math.max(0, Number(currentEntry.duration_minutes) - elapsedMinutes);
      }
    }

    return {
      slug: b.slug,
      name: b.name,
      onDuty: Boolean(b.on_duty),
      onBreak: Boolean(b.on_break),
      currentEntry: currentEntry ? {
        token: currentEntry.token,
        customerName: currentEntry.customer_name,
        serviceNames: currentEntry.service_names,
        durationMinutes: currentEntry.duration_minutes,
        status: currentEntry.status,
        elapsedMinutes,
        remainingMinutes,
        canNoShow,
        calledAt: currentEntry.called_at,
      } : null,
      canCallNext: !b.on_break && !currentEntry,
    };
  });

  const waitingList = queueRs.rows
    .filter(q => q.status === 'waiting')
    .map(q => {
      const waitSoFar = Math.floor((now - Number(q.created_at)) / 60000);
      return {
        id: q.id,
        token: q.token,
        customerName: q.customer_name,
        phone: q.phone,
        serviceNames: q.service_names,
        durationMinutes: q.duration_minutes,
        totalPrice: q.total_price,
        barberPreference: q.barber_preference,
        waitSoFarMinutes: waitSoFar,
        isOverHour: waitSoFar >= 60,
        createdAt: q.created_at,
      };
    });

  return {
    hours,
    totalWaiting: waitingList.length,
    barbers,
    waitingList,
    serverTime: now,
  };
}

export async function getBarberView(barberSlug) {
  const bRs = await db.execute({
    sql: 'SELECT slug, name, on_duty, on_break FROM barbers WHERE slug = ?',
    args: [barberSlug],
  });
  if (bRs.rows.length === 0) return null;
  const barber = bRs.rows[0];

  const now = Date.now();
  const queueRs = await db.execute(`
    SELECT * FROM queue_entries
    WHERE status IN ('waiting', 'called', 'in_chair')
    ORDER BY token ASC
  `);

  const currentEntry = queueRs.rows.find(q => q.assigned_barber === barberSlug && (q.status === 'called' || q.status === 'in_chair'));
  const nextEligible = queueRs.rows.find(q => q.status === 'waiting' && (!q.barber_preference || q.barber_preference === barberSlug));

  let elapsedMinutes = 0;
  if (currentEntry) {
    const startTime = currentEntry.status === 'in_chair' ? currentEntry.started_at : currentEntry.called_at;
    if (startTime) {
      elapsedMinutes = Math.floor((now - Number(startTime)) / 60000);
    }
  }

  return {
    barber: {
      slug: barber.slug,
      name: barber.name,
      onDuty: Boolean(barber.on_duty),
      onBreak: Boolean(barber.on_break),
    },
    currentCustomer: currentEntry ? {
      id: currentEntry.id,
      token: currentEntry.token,
      customerName: currentEntry.customer_name,
      serviceNames: currentEntry.service_names,
      durationMinutes: currentEntry.duration_minutes,
      totalPrice: currentEntry.total_price,
      status: currentEntry.status,
      elapsedMinutes,
      startedAt: currentEntry.started_at,
      calledAt: currentEntry.called_at,
    } : null,
    nextCustomer: nextEligible ? {
      token: nextEligible.token,
      customerName: nextEligible.customer_name,
      serviceNames: nextEligible.service_names,
      durationMinutes: nextEligible.duration_minutes,
      barberPreference: nextEligible.barber_preference,
    } : null,
    serverTime: now,
  };
}

export async function getTvDisplay() {
  const barbersRs = await db.execute('SELECT slug, name, on_duty, on_break FROM barbers WHERE on_duty = 1 ORDER BY name ASC');
  const queueRs = await db.execute(`
    SELECT token, duration_minutes, barber_preference, assigned_barber, status, called_at
    FROM queue_entries
    WHERE status IN ('waiting', 'called', 'in_chair')
    ORDER BY token ASC
  `);

  const barbers = barbersRs.rows.map(b => {
    const active = queueRs.rows.find(q => q.assigned_barber === b.slug && (q.status === 'called' || q.status === 'in_chair'));
    return {
      slug: b.slug,
      name: b.name,
      onBreak: Boolean(b.on_break),
      status: b.on_break ? 'on_break' : (active ? active.status : 'available'),
      currentToken: active ? active.token : null,
      calledAt: active ? active.called_at : null,
    };
  });

  const nextWaiting = queueRs.rows
    .filter(q => q.status === 'waiting')
    .slice(0, 5)
    .map(q => ({
      token: q.token,
      durationMinutes: q.duration_minutes,
    }));

  return {
    salonName: 'Aura Luxe Salon',
    barbers,
    nextWaiting,
    serverTime: Date.now(),
  };
}

export async function getOwnerSettings() {
  const settings = await getSalonSettings();
  const servicesRs = await db.execute('SELECT * FROM services ORDER BY price ASC');
  const barbersRs = await db.execute('SELECT * FROM barbers ORDER BY name ASC');

  // Today's statistics in Asia/Kolkata
  const todayStr = salonDate.format(new Date());
  // Find start of today in Asia/Kolkata
  const startOfDay = new Date(`${todayStr}T00:00:00+05:30`).getTime();

  const entriesTodayRs = await db.execute({
    sql: 'SELECT * FROM queue_entries WHERE created_at >= ?',
    args: [startOfDay],
  });

  const entriesToday = entriesTodayRs.rows;
  const served = entriesToday.filter(e => e.status === 'done');
  const noShows = entriesToday.filter(e => e.status === 'no_show');
  const cancelled = entriesToday.filter(e => e.status === 'cancelled');

  let totalWaitTime = 0;
  let countWithWait = 0;
  for (const e of served) {
    if (e.started_at && e.created_at) {
      totalWaitTime += (Number(e.started_at) - Number(e.created_at)) / 60000;
      countWithWait++;
    }
  }
  const avgWaitMinutes = countWithWait > 0 ? Math.round(totalWaitTime / countWithWait) : 0;

  return {
    settings: {
      openingTime: settings.opening_time,
      closingTime: settings.closing_time,
      onlineJoiningOpen: Boolean(settings.online_joining_open),
    },
    stats: {
      totalServed: served.length,
      avgWaitMinutes,
      noShowsCount: noShows.length,
      cancelledCount: cancelled.length,
      totalEntries: entriesToday.length,
    },
    services: servicesRs.rows.map(s => ({
      slug: s.slug,
      nameEn: s.name_en,
      nameGu: s.name_gu,
      durationMinutes: Number(s.duration_minutes),
      price: Number(s.price),
      active: Boolean(s.active),
    })),
    barbers: barbersRs.rows.map(b => ({
      slug: b.slug,
      name: b.name,
      onDuty: Boolean(b.on_duty),
      onBreak: Boolean(b.on_break),
    })),
  };
}

export async function setOnlineJoining(isOpen) {
  await db.execute({
    sql: "UPDATE salon_settings SET online_joining_open = ? WHERE id = 'salon'",
    args: [isOpen ? 1 : 0],
  });
  return { status: 200, body: { ok: true, onlineJoiningOpen: Boolean(isOpen) } };
}

export async function setBarberDuty(slug, onDuty) {
  await db.execute({
    sql: 'UPDATE barbers SET on_duty = ? WHERE slug = ?',
    args: [onDuty ? 1 : 0, slug],
  });
  return { status: 200, body: { ok: true, slug, onDuty: Boolean(onDuty) } };
}

export async function setBarberBreak(slug, onBreak) {
  await db.execute({
    sql: 'UPDATE barbers SET on_break = ? WHERE slug = ?',
    args: [onBreak ? 1 : 0, slug],
  });
  return { status: 200, body: { ok: true, slug, onBreak: Boolean(onBreak) } };
}

export async function updateService(slug, payload) {
  const fields = [];
  const args = [];
  if (typeof payload.nameEn === 'string') {
    fields.push('name_en = ?');
    args.push(payload.nameEn.trim());
  }
  if (typeof payload.nameGu === 'string') {
    fields.push('name_gu = ?');
    args.push(payload.nameGu.trim());
  }
  if (payload.durationMinutes != null) {
    fields.push('duration_minutes = ?');
    args.push(Number(payload.durationMinutes));
  }
  if (payload.price != null) {
    fields.push('price = ?');
    args.push(Number(payload.price));
  }
  if (payload.active != null) {
    fields.push('active = ?');
    args.push(payload.active ? 1 : 0);
  }

  if (fields.length === 0) return { status: 400, body: { error: 'noFields' } };
  args.push(slug);

  await db.execute({
    sql: `UPDATE services SET ${fields.join(', ')} WHERE slug = ?`,
    args,
  });

  return { status: 200, body: { ok: true, slug } };
}

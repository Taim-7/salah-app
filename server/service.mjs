import { createHash, ECDH } from 'node:crypto';
import webPush from 'web-push';
import region from '../region.js';
import '../solar.js';
import providers from '../providers.js';
import timetable from '../timetable.js';

const minute = 60_000;
const day = 86_400_000;
const prayers = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const tokenPattern = /^Bearer ([a-f0-9]{64})$/;
const publicPushHosts = new Set(['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com']);
const rules = ['seventh', 'relative', 'nearest', 'angle', 'tayba', 'crossings'];
const hash = value => createHash('sha256').update(value).digest('base64url');

function json(response, status, value = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8_192) return null;
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return null; }
}

function validSettings(value) {
  if (!value) return null;
  const { lat, lng, timeZone, method, fajrAngle, ishaAngle, highLatRule, activeSource, ishaLimit,
    reminderEnabled, reminderLead, timeFormat } = value;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !timeZone || region.zone(lat, lng) !== timeZone ||
      !['15-13', '12-12', '18-17', 'custom'].includes(method) ||
      ![fajrAngle, ishaAngle].every(a => Number.isFinite(a) && a >= 6 && a <= 22) ||
      !rules.includes(highLatRule) || !['angles', 'tayba', 'moonsighting'].includes(activeSource) ||
      !['third', 'half', 'half-necessity'].includes(ishaLimit) || typeof reminderEnabled !== 'boolean' ||
      ![15, 20, 25, 30].includes(reminderLead) || !['12', '24'].includes(timeFormat)) return null;
  return { lat, lng, timeZone, method, fajrAngle, ishaAngle, highLatRule, activeSource, ishaLimit,
    reminderEnabled, reminderLead, timeFormat };
}

function validSubscription(value) {
  const { endpoint, keys } = value ?? {};
  if (typeof endpoint !== 'string' || endpoint.length > 2048 ||
      !/^[A-Za-z0-9_-]{87}$/.test(keys?.p256dh) || !/^[A-Za-z0-9_-]{22}$/.test(keys?.auth)) return null;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || url.pathname === '/' ||
        !(publicPushHosts.has(url.hostname) || url.hostname.endsWith('.push.apple.com') ||
          url.hostname.endsWith('.notify.windows.com'))) return null;
    ECDH.convertKey(Buffer.from(keys.p256dh, 'base64url'), 'prime256v1');
    return { endpoint: url.href, keys: { p256dh: keys.p256dh, auth: keys.auth } };
  } catch { return null; }
}

export function createReminderService({ database, origin, subject = origin, now = Date.now,
  fetchTimetable = fetch, send = webPush.sendNotification, report = console.error }) {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY, endpoint TEXT NOT NULL UNIQUE, subscription TEXT NOT NULL,
      preferences TEXT NOT NULL, last_test INTEGER NOT NULL DEFAULT 0, test_due INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sent (
      device TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      event TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (device, event)
    );
  `);
  const existingKeys = database.prepare("SELECT value FROM metadata WHERE key = 'vapid'").get();
  const keys = existingKeys ? JSON.parse(existingKeys.value) : webPush.generateVAPIDKeys();
  if (!existingKeys) database.prepare("INSERT INTO metadata VALUES ('vapid', ?)").run(JSON.stringify(keys));
  const vapidDetails = { subject, ...keys };
  const getDevice = database.prepare('SELECT * FROM devices WHERE id = ?');
  const getEndpoint = database.prepare('SELECT id FROM devices WHERE endpoint = ?');
  const removeDevice = database.prepare('DELETE FROM devices WHERE id = ?');
  const updateDevice = database.prepare(`INSERT INTO devices (id, endpoint, subscription, preferences) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET endpoint = excluded.endpoint, subscription = excluded.subscription, preferences = excluded.preferences`);
  const queueTest = database.prepare('UPDATE devices SET last_test = ?, test_due = ? WHERE id = ?');
  const clearTest = database.prepare('UPDATE devices SET test_due = 0 WHERE id = ? AND test_due = ?');
  const alreadySent = database.prepare('SELECT 1 FROM sent WHERE device = ? AND event = ?');
  const saveSent = database.prepare('INSERT OR IGNORE INTO sent VALUES (?, ?, ?)');
  const removeOldSends = database.prepare('DELETE FROM sent WHERE at < ?');
  const allDevices = database.prepare('SELECT * FROM devices');
  const countDevices = database.prepare('SELECT COUNT(*) AS count FROM devices');

  async function deliver(row, payload, ttl, topic) {
    const subscription = JSON.parse(row.subscription);
    try {
      await send(subscription, JSON.stringify(payload), {
        vapidDetails, TTL: ttl, urgency: 'high', topic, timeout: 6000
      });
      return 202;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        if (getDevice.get(row.id)?.subscription === row.subscription) removeDevice.run(row.id);
        return 410;
      }
      report('Push provider failed (' + (Number(error.statusCode) || 'network error') + ').');
      return 503;
    }
  }

  async function handle(request, response, route) {
    if (request.headers.origin && request.headers.origin !== origin) return json(response, 403);
    if (request.headers['sec-fetch-site'] === 'cross-site') return json(response, 403);
    if (request.method === 'GET' && route === '') return json(response, 200, { service: 'salah-web-push', publicKey: keys.publicKey });
    const match = tokenPattern.exec(request.headers.authorization ?? '');
    if (!match) return json(response, 401);
    const id = hash(match[1]);
    if (request.method === 'PUT' && route === '') {
      if (String(request.headers['content-type']).split(';')[0].trim() !== 'application/json') return json(response, 415);
      const body = await readBody(request);
      const subscription = validSubscription(body?.subscription);
      const preferences = validSettings(body?.settings);
      if (!subscription || !preferences) return json(response, 400);
      const owner = getEndpoint.get(subscription.endpoint);
      if (owner && owner.id !== id) return json(response, 409);
      if (!getDevice.get(id) && countDevices.get().count >= 500) return json(response, 503);
      updateDevice.run(id, subscription.endpoint, JSON.stringify(subscription), JSON.stringify(preferences));
      return json(response, 200);
    }
    if (request.method === 'DELETE' && route === '') {
      removeDevice.run(id);
      return json(response, 200);
    }
    if (request.method === 'POST' && route === '/test') {
      const row = getDevice.get(id);
      if (!row) return json(response, 404);
      const instant = now();
      if (row.last_test && instant - row.last_test < 15_000) return json(response, 429);
      queueTest.run(instant, instant + 10_000, id);
      return json(response, 202);
    }
    return json(response, 405);
  }

  const localDays = new Map(), providerDays = new Map();
  const keyOf = (config, date) => [config.lat, config.lng, config.timeZone, date].join('|');
  const cache = (map, key, value) => {
    if (map.size >= 1500 && !map.has(key)) map.delete(map.keys().next().value);
    map.set(key, value);
    return value;
  };

  function localDay(date, config) {
    const source = config.activeSource === 'tayba' ? 'tayba' : 'angles';
    const rule = config.highLatRule;
    const key = [keyOf(config, date), source, rule, ...timetable.angles(config)].join('|');
    return localDays.get(key) ?? cache(localDays, key, timetable.localDay(date, config, source, rule));
  }

  function onlineDay(date, config) {
    const key = keyOf(config, date);
    const cached = providerDays.get(key);
    if (cached && cached.until > now()) return cached.promise;
    const entry = { until: now() + 7 * day };
    entry.promise = (async () => {
      try {
        const url = providers.buildUrl('moonsighting', date, config.lat, config.lng, config.timeZone);
        const reply = await fetchTimetable(url, { signal: AbortSignal.timeout(5500), redirect: 'error' });
        if (!reply.ok) throw Error('Timetable unavailable');
        return providers.decode('moonsighting', date, config.timeZone, await reply.json(), config);
      } catch {
        entry.until = now() + 120_000;
        return null;
      }
    })();
    return cache(providerDays, key, entry).promise;
  }

  async function dayFor(date, config) {
    const local = localDay(date, config);
    if (config.activeSource !== 'moonsighting' || !local.valid) return local;
    const [today, tomorrow] = await Promise.all([onlineDay(date, config), onlineDay(providers.keyShift(date, 1), config)]);
    return today ? timetable.aladhanDay(local, today, tomorrow) : null;
  }

  function localDate(instant, zone) {
    const format = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = Object.fromEntries(format.formatToParts(instant).map(part => [part.type, part.value]));
    return [parts.year, parts.month, parts.day].join('-');
  }

  async function sendDue(row, instant) {
    if (row.test_due && row.test_due <= instant && clearTest.run(row.id, row.test_due).changes &&
        instant - row.test_due < minute) await deliver(row, { type: 'test' }, 60, 'salah-test');
    const config = JSON.parse(row.preferences);
    if (!config.reminderEnabled) return;
    const date = localDate(instant, config.timeZone);
    const dates = [-1, 0, 1].map(offset => providers.keyShift(date, offset));
    const times = await Promise.all(dates.map(key => dayFor(key, config)));
    for (const [index, time] of times.entries()) {
      if (!time?.valid) continue;
      for (const [name, label] of Object.entries(prayers)) {
        if (name === 'isha' && (!time.nextFajr || !timetable.ishaHasWindow(time, config.ishaLimit))) continue;
        const starts = +time[name];
        if (!starts) continue;
        const due = starts - config.reminderLead * minute;
        const current = now();
        if (current < due || current >= due + 3 * minute) continue;
        const event = dates[index] + ':' + name;
        if (alreadySent.get(row.id, event)) continue;
        const latest = getDevice.get(row.id);
        if (!latest || latest.preferences !== row.preferences || latest.subscription !== row.subscription) return;
        const timeLabel = new Intl.DateTimeFormat('en-GB', {
          timeZone: config.timeZone, hour: config.timeFormat === '12' ? 'numeric' : '2-digit',
          minute: '2-digit', hour12: config.timeFormat === '12'
        }).format(starts);
        const code = await deliver(row, {
          type: 'prayer', title: label, time: timeLabel, estimated: timetable.isEstimated(time, name),
          tag: 'salah-' + event
        }, Math.min(5 * 60, Math.floor((starts - current) / 1000)), hash(event).slice(0, 24));
        if (code === 202 && getDevice.get(row.id)) saveSent.run(row.id, event, current);
      }
    }
  }

  let dispatching = false;
  async function dispatch() {
    if (dispatching) return;
    dispatching = true;
    try {
      const instant = now();
      removeOldSends.run(instant - 3 * day);
      const devices = allDevices.all();
      for (let offset = 0; offset < devices.length; offset += 12)
        await Promise.all(devices.slice(offset, offset + 12).map(row => sendDue(row, instant).catch(() => report('Could not schedule a reminder.'))));
    } finally { dispatching = false; }
  }

  return { handle, dispatch };
}

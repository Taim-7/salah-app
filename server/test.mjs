import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import webPush from 'web-push';
import { createReminderService } from './service.mjs';
import timetable from '../timetable.js';

const origin = 'https://salah.example.org';
const testToken = randomBytes(32).toString('hex');
const curve = createECDH('prime256v1');
const push = {
  endpoint: 'https://web.push.apple.com/test-device',
  keys: { p256dh: curve.generateKeys().toString('base64url'), auth: randomBytes(16).toString('base64url') }
};
const prefs = {
  lat: 55.1333, lng: -7.45, timeZone: 'Europe/Dublin', method: '15-13',
  fajrAngle: 15, ishaAngle: 13, highLatRule: 'seventh', activeSource: 'angles', ishaLimit: 'half',
  reminderEnabled: true, reminderLead: 25, timeFormat: '24'
};

test('reminders follow the selected timetable and survive closing and server restart', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'salah-push-'));
  const path = join(folder, 'reminders.sqlite');
  const asr = +timetable.localDay('2026-10-25', prefs, 'angles', prefs.highLatRule).asr;
  const due = asr - 25 * 60_000;
  let instant = due - 30_000;
  const delivered = [];
  let providerCalls = 0;
  let failure = 0;
  const reports = [];
  const serviceOptions = {
    origin, now: () => instant, report: message => reports.push(message),
    fetchTimetable: async () => { providerCalls++; return { ok: false }; },
    send: async (subscription, payload, options) => {
      const request = webPush.generateRequestDetails(subscription, payload, options);
      assert.equal(request.endpoint, push.endpoint);
      assert.equal(request.headers['Content-Encoding'], 'aes128gcm');
      assert.match(request.headers.Authorization, /^vapid t=.+, k=.+$/);
      assert(Buffer.isBuffer(request.body));
      if (failure) throw Object.assign(Error('Failed send'), { statusCode: failure });
      delivered.push({ ...JSON.parse(payload), ttl: options.TTL });
    }
  };
  let database = new DatabaseSync(path);
  let service = createReminderService({ database, ...serviceOptions });
  const server = createServer((request, response) => { void service.handle(request, response, request.url === '/' ? '' : request.url); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const call = (method, route = '', options = {}) => fetch(url + '/' + route, {
    method, headers: {
      Origin: options.origin ?? origin, 'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (options.token ?? testToken)
    }, body: options.body && JSON.stringify(options.body)
  });
  const enrol = (settings = prefs, subscription = push) => call('PUT', '', { body: { subscription, settings } });
  try {
    const first = await (await call('GET')).json();
    assert.equal(first.service, 'salah-web-push');
    assert.equal(first.publicKey.length, 87);
    assert.equal((await enrol()).status, 200);
    assert.equal((await enrol({ ...prefs, lat: 48.86, lng: 2.35 })).status, 400);
    assert.equal((await enrol(prefs, { ...push, endpoint: 'https://127.0.0.1/test' })).status, 400);
    assert.equal((await call('PUT', '', { origin: 'https://somewhere.example', body: {} })).status, 403);
    assert.equal((await call('PUT', '', { token: randomBytes(32).toString('hex'), body: { subscription: push, settings: prefs } })).status, 409);
    assert.equal((await call('POST', 'test')).status, 202);
    assert.equal((await call('POST', 'test')).status, 429);
    await service.dispatch();
    assert.equal(delivered.length, 0);

    database.close();
    database = new DatabaseSync(path);
    service = createReminderService({ database, ...serviceOptions });
    assert.deepEqual(await (await call('GET')).json(), first);
    instant += 10_000;
    await service.dispatch();
    assert.deepEqual(delivered, [{ type: 'test', ttl: 60 }]);
    instant = due + 15_000;
    failure = 503;
    await service.dispatch();
    assert.equal(delivered.length, 1);
    assert.equal(reports.length, 1);
    failure = 0;
    instant += 15_000;
    await service.dispatch();
    await service.dispatch();
    assert.equal(delivered.length, 2);
    assert.equal(delivered[1].title, 'Asr');
    assert.equal(delivered[1].time, new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: prefs.timeZone
    }).format(asr));
    assert.equal(delivered[1].tag, 'salah-2026-10-25:asr');
    assert.equal(delivered[1].ttl, 300);
    assert.equal(providerCalls, 0);

    const maghrib = +timetable.localDay('2026-10-25', prefs, 'angles', prefs.highLatRule).maghrib;
    instant = maghrib - 20 * 60_000 + 15_000;
    assert.equal((await enrol({ ...prefs, reminderLead: 20, activeSource: 'moonsighting' })).status, 200);
    await service.dispatch();
    assert(providerCalls > 0);
    assert.equal(delivered.length, 2);
    assert.equal((await enrol({ ...prefs, reminderLead: 20, reminderEnabled: false })).status, 200);
    await service.dispatch();
    assert.equal(delivered.length, 2);
    assert.equal((await enrol({ ...prefs, reminderLead: 20 })).status, 200);
    await service.dispatch();
    assert.equal(delivered[2].title, 'Maghrib');
    assert.equal((await call('POST', 'test')).status, 202);
    assert.equal((await call('DELETE')).status, 200);
    instant += 20_000;
    await service.dispatch();
    assert.equal(delivered.length, 3);
    assert.equal((await call('POST', 'test')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    database.close();
    rmSync(folder, { recursive: true, force: true });
  }
});

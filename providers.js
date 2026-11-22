/* Salah comparison providers. No result is silently presented as an observation.
   Only the directly selected latitude/longitude and requested date are sent to
   AlAdhan when the user elects to load an online comparison. */
(function (root) {
  'use strict';
  const solar = root.SalahSolar;
  const MS = 60000;
  const add = (date, minutes) => new Date(date.getTime() + minutes * MS);
  const parts = key => key.split('-').map(Number);
  const keyShift = (key, count) => {
    const d = new Date(`${key}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + count);
    return d.toISOString().slice(0, 10);
  };
  const ceilMinute = d => new Date(Math.ceil(d.getTime() / MS) * MS);
  const dayAngles = (key, lat, lon, fajr, isha) => solar.solarEvents(...parts(key), lat, lon, fajr, isha);
  const dateDiffMs = (a, b) => a.getTime() - b.getTime();

  // Tayba Trust, northern latitudes: when 18 degrees cannot be reached,
  // carry forward the 14.5-degree sunrise/sunset interval from the final
  // spring day with an 18-degree crossing. This is a *derived*
  // implementation of published guidance, NOT a live Tayba timetable.
  function taybaBase(key, lat, lon, side) {
    const s = dayAngles(key, lat, lon, 14.5, 14.5);
    const crossing = side === 'fajr' ? 'fajrRaw' : 'ishaRaw';
    if (Math.abs(lat) <= 48.5 || dayAngles(key, lat, lon, 18, 18)[crossing])
      return { time: s[crossing], estimated: !s[crossing], note: '14.5° crossing' };
    let nearest = null;
    // Tayba's published UK method carries the interval from the last spring
    // day when 18° was still reached, throughout the missing-angle period.
    // Choosing the closer autumn edge silently changes the stated method.
    for (let dist = 1; dist <= 200; dist++) {
      const edgeKey = keyShift(key, -dist);
      const edge = dayAngles(edgeKey, lat, lon, 18, 18);
      if (!edge[crossing]) continue;
      const actualEdge = dayAngles(edgeKey, lat, lon, 14.5, 14.5);
      if (!actualEdge[crossing]) continue;
      nearest = { edgeKey, actualEdge }; break;
    }
    if (!nearest) return { time: null, estimated: true, note: 'No seasonal reference crossing found' };
    const p = parts(key), boundary = nearest.actualEdge;
    const next = solar.solarEvents(...p, lat, lon, 14.5, 14.5);
    if (side === 'fajr') {
      if (!next.sunriseRaw || !boundary.sunriseRaw) return { time: null, estimated: true, note: 'Sunrise not found' };
      const beforeSunrise = dateDiffMs(boundary.sunriseRaw, boundary.fajrRaw);
      return { time: new Date(next.sunriseRaw.getTime() - beforeSunrise), estimated: true, note: 'Tayba seasonal fixed sunrise interval' };
    }
    if (!next.sunsetRaw || !boundary.sunsetRaw) return { time: null, estimated: true, note: 'Sunset not found' };
    const afterSunset = dateDiffMs(boundary.ishaRaw, boundary.sunsetRaw);
    return { time: new Date(next.sunsetRaw.getTime() + afterSunset), estimated: true, note: 'Tayba seasonal fixed sunset interval' };
  }
  function taybaOneDay(key, lat, lon) {
    if (Math.abs(lat) > 64.5) return { valid: false, reason: 'Tayba northern guidance is not implemented for polar latitudes.' };
    const b = solar.calculateDay(...parts(key), lat, lon, 14.5, 14.5, 'seventh');
    if (!b.valid) return b;
    const fajr = taybaBase(key, lat, lon, 'fajr');
    const ishaBase = taybaBase(key, lat, lon, 'isha');
    if (!fajr.time || !ishaBase.time) return { valid: false, reason: 'Tayba approximation unavailable for this date and latitude.' };
    let isha = ishaBase.time;
    let redMinimum = null;
    const raw8 = dayAngles(key, lat, lon, 8, 8).ishaRaw;
    // Tayba Isha option 2: if calculated Isha is >90 min after sunset,
    // reduce it to 90 minutes, but not earlier than the 8-degree crossing.
    if (isha.getTime() - b.trueSunset.getTime() > 90 * MS) {
      redMinimum = raw8;
      if (raw8) isha = new Date(Math.max(b.trueSunset.getTime() + 90 * MS, raw8.getTime()));
      // A missing 8-degree crossing cannot be certified as red twilight.
      else return { valid: false, reason: 'Even 8° is absent: Tayba red-twilight option cannot be applied safely.' };
    }
    const t = {
      ...b, fajr: ceilMinute(fajr.time), isha: ceilMinute(isha),
      fajrFallback: fajr.estimated, ishaFallback: ishaBase.estimated || isha.getTime() !== ishaBase.time.getTime(),
      taybaNotes: { fajr: fajr.note, isha: ishaBase.note, redMinimumApplied: !!redMinimum },
      methodName: 'Tayba guidance — locally derived', valid: true
    };
    if (t.fajr >= t.sunrise || t.isha <= t.maghrib)
      return { valid: false, reason: 'Derived twilight times fail the day-order check.' };
    return t;
  }
  function taybaDay(key, lat, lon) {
    const t = taybaOneDay(key, lat, lon);
    if (!t.valid) return t;
    const next = taybaOneDay(keyShift(key, 1), lat, lon);
    if (!next.valid) return { valid: false, reason: `Next Fajr unavailable: ${next.reason}` };
    const ms = next.fajr.getTime() - t.maghrib.getTime();
    if (ms <= 0 || ms > 86400000) return { valid: false, reason: 'Night boundaries invalid.' };
    t.nextFajr = next.fajr;
    t.firstThird = new Date(t.maghrib.getTime() + ms / 3);
    t.midnight = new Date(t.maghrib.getTime() + ms / 2);
    t.ishaBeyondFirstThird = t.isha >= t.firstThird;
    t.ishaBeyondHalf = t.isha >= t.midnight;
    return t;
  }

  // AlAdhan supplies date-specific local clock times, either ISO 8601 (preferred)
  // or HH:mm. Convert without using the traveller's device time zone.
  function offsetMinutes(zone, date) {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: zone,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(f.formatToParts(date).filter(x => x.type !== 'literal').map(x => [x.type, +x.value]));
    const utc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    return (utc - Math.floor(date.getTime() / MS) * MS) / MS;
  }
  function localToUtc(key, hh, mm, zone) {
    const [y, m, d] = parts(key);
    const desired = Date.UTC(y, m - 1, d, hh, mm);
    let current = new Date(desired);
    for (let i = 0; i < 3; i++) current = new Date(desired - offsetMinutes(zone, current) * MS);
    const decoded = new Intl.DateTimeFormat('en-CA', { timeZone: zone,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(current);
    const p = Object.fromEntries(decoded.filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
    if (p.year !== y || p.month !== m || p.day !== d || p.hour !== hh || p.minute !== mm) return null;
    return current;
  }
  function parsePrayerTime(raw, key, zone) {
    if (typeof raw !== 'string') return null;
    // Require offset for ISO timestamps. No host-local Date.parse fallback.
    if (/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/i.test(raw)) {
      const date = new Date(raw);
      return Number.isFinite(+date) ? date : null;
    }
    const m = raw.match(/^(\d{1,2}):(\d\d)(?:\s*\([^)]+\))?$/);
    if (!m || +m[1] > 23 || +m[2] > 59) return null;
    return localToUtc(key, +m[1], +m[2], zone);
  }
  const specs = {
    moonsighting: { method: 15, shafaq: 'ahmer', name: 'Moonsighting preset · red twilight' },
    france: { method: 12, name: 'AlAdhan French UOIF 12°/12°' },
    mwl: { method: 3, name: 'AlAdhan Muslim World League' }
  };
  function buildUrl(kind, key, lat, lon, zone) {
    const spec = specs[kind];
    if (!spec) throw Error('Unknown provider');
    const [y, mo, d] = parts(key);
    const qs = new URLSearchParams({ latitude: String(lat), longitude: String(lon),
      method: String(spec.method), school: '0', latitudeAdjustmentMethod: '2',
      timezonestring: zone, iso8601: 'true' });
    if (spec.shafaq) qs.set('shafaq', spec.shafaq);
    return `https://api.aladhan.com/v1/timings/${String(d).padStart(2, '0')}-${String(mo).padStart(2, '0')}-${y}?${qs}`;
  }
  function decode(kind, key, zone, json) {
    const spec = specs[kind];
    if (json?.code !== 200 || !json?.data?.timings) throw Error('Invalid AlAdhan response');
    const metaMethod = json.data.meta?.method?.id;
    if (metaMethod != null && Number(metaMethod) !== spec.method) throw Error('Unexpected method from online provider');
    const returnedZone = json.data.meta?.timezone;
    if (returnedZone && returnedZone !== zone) {
      // UK/Irish zone names can be aliases. Accept only equivalent offsets
      // on this date AND six months later; never trust an arbitrary different zone.
      const aliases = ['Europe/London','Europe/Belfast','Europe/Dublin'];
      const midpoint = new Date(`${key}T12:00:00Z`);
      const later = new Date(midpoint); later.setUTCMonth(later.getUTCMonth() + 6);
      const equivalent = aliases.includes(zone) && aliases.includes(returnedZone) &&
        [midpoint, later].every(d => offsetMinutes(zone,d) === offsetMinutes(returnedZone,d));
      if (!equivalent) throw Error(`Time zone mismatch: provider returned ${returnedZone}`);
    }
    const raw = json.data.timings;
    const names = { fajr:'Fajr', sunrise:'Sunrise', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' };
    const out = { valid: true, providerName: spec.name, online: true, key };
    for (const [k, field] of Object.entries(names)) {
      const time = parsePrayerTime(raw[field], key, zone);
      if (!time) throw Error(`Bad ${k} time from provider`);
      out[k] = time;
    }
    // Reject corrupted data and timezone/date mixups.
    for (const [a, b] of [['fajr','sunrise'],['sunrise','dhuhr'],['dhuhr','asr'],['asr','maghrib'],['maghrib','isha']])
      if (out[a] >= out[b]) throw Error('Provider returned times in the wrong order');
    if (out.isha.getTime() - out.maghrib.getTime() > 9 * 3600000) throw Error('Unexpected Isha interval');
    // Some upstream ISO timestamps have reportedly had a wrong date. Check
    // the actual date in the requested time zone rather than just HH:mm.
    const zoneDate = value => {
      const f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit' });
      const x = Object.fromEntries(f.formatToParts(value).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
      return `${x.year}-${x.month}-${x.day}`;
    };
    for (const name of ['fajr','sunrise','dhuhr','asr','maghrib']) {
      if (zoneDate(out[name]) !== key) throw Error(`Provider ${name} date does not match ${key}`);
    }
    if (![key, keyShift(key,1)].includes(zoneDate(out.isha))) throw Error('Provider Isha date is outside the expected night');
    return out;
  }
  root.SalahProviders = { taybaDay, taybaOneDay, buildUrl, decode, keyShift, localToUtc, parsePrayerTime, specs };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahProviders;
})(typeof window !== 'undefined' ? window : globalThis);

(function (root) {
  'use strict';

  const solar = root.SalahSolar;
  const MS = 60000;
  const fields = { fajr:'Fajr', sunrise:'Sunrise', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' };
  const parts = key => key.split('-').map(Number);
  const keyShift = (key, count) => {
    const d = new Date(key + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + count);
    return d.toISOString().slice(0, 10);
  };
  const ceilMinute = d => new Date(Math.ceil(d.getTime() / MS) * MS);
  const dayAngles = (key, lat, lon, angle) => solar.solarEvents(...parts(key), lat, lon, angle, angle);
  const seasons = new Map();

  function taybaFajr(key, lat, lon, today) {
    if (Math.abs(lat) <= 48.5 || dayAngles(key, lat, lon, 18).fajrRaw)
      return { time:today.fajrRaw, estimated:false };
    const season = [key.slice(0, 4), lat, lon].join(':');
    if (!seasons.has(season)) {
      let interval = null;
      for (let dist = 1; dist <= 200; dist++) {
        const boundary = keyShift(key, -dist);
        if (!dayAngles(boundary, lat, lon, 18).fajrRaw) continue;
        const edge = dayAngles(boundary, lat, lon, 14.5);
        if (!edge.fajrRaw) continue;
        interval = edge.sunriseRaw - edge.fajrRaw;
        break;
      }
      if (seasons.size >= 24) seasons.delete(seasons.keys().next().value);
      seasons.set(season, interval);
    }
    const interval = seasons.get(season);
    return { time:interval ? new Date(today.sunriseRaw.getTime() - interval) : null, estimated:true };
  }

  function taybaOneDay(key, lat, lon) {
    const b = solar.calculateDay(...parts(key), lat, lon, 14.5, 14.5, 'crossings');
    if (!b.valid) return b;
    const raw = dayAngles(key, lat, lon, 14.5);
    const fajr = taybaFajr(key, lat, lon, raw);
    const usableFajr = fajr.time && ceilMinute(fajr.time) < b.sunrise ? ceilMinute(fajr.time) : null;

    const ishaEstimated = !raw.ishaRaw || raw.ishaRaw - b.trueSunset > 90 * MS;
    const raw8 = ishaEstimated ? dayAngles(key, lat, lon, 8).ishaRaw : null;
    const isha = ishaEstimated ?
      (raw8 ? new Date(Math.max(b.trueSunset.getTime() + 90 * MS, raw8.getTime())) : null) :
      raw.ishaRaw;

    return {
      ...b, fajr:usableFajr, trueFajr:usableFajr ? fajr.time : null, isha:isha ? ceilMinute(isha) : null,
      fajrFallback:!!usableFajr && fajr.estimated, ishaFallback:!!isha && ishaEstimated,
      fajrReason:usableFajr ? '' : 'The seasonal Tayba Fajr time is unavailable.',
      ishaReason:isha ? '' : 'Tayba gives no Isha here because the Sun stays less than 8° below the horizon.',
      taybaNotes: {
        fajr:fajr.estimated ? 'Fixed interval before sunrise' : '14.5° crossing',
        isha:ishaEstimated ? '90 minutes, subject to the 8° limit' : '14.5° crossing'
      }
    };
  }

  function taybaDay(key, lat, lon) {
    const today = taybaOneDay(key, lat, lon);
    return today.valid ? solar.withNight(today, taybaOneDay(keyShift(key, 1), lat, lon)) : today;
  }

  function hybridTwilightDay(key, lat, lon, fajrAngle, ishaAngle) {
    function oneDay(date) {
      const fixed = solar.calculateDay(...parts(date), lat, lon, fajrAngle, ishaAngle, 'crossings');
      if (!fixed.valid || (fixed.fajr && fixed.isha)) return fixed;
      const seasonal = taybaOneDay(date, lat, lon);
      if (!seasonal.valid) return fixed;
      return {
        ...fixed, highLatRule:'tayba',
        fajr:fixed.fajr || seasonal.fajr, trueFajr:fixed.trueFajr || seasonal.trueFajr,
        isha:fixed.isha || seasonal.isha,
        fajrFallback:!fixed.fajr && !!seasonal.fajr,
        ishaFallback:!fixed.isha && !!seasonal.isha,
        fajrReason:fixed.fajr ? '' : seasonal.fajrReason,
        ishaReason:fixed.isha ? '' : seasonal.ishaReason
      };
    }
    const today = oneDay(key);
    return today.valid ? solar.withNight(today, oneDay(keyShift(key, 1))) : today;
  }

  const timeParts = (zone, date) => Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit',
      minute:'2-digit', hourCycle:'h23'
    }).formatToParts(date).filter(x => x.type !== 'literal').map(x => [x.type, x.value])
  );
  function offsetMinutes(zone, date) {
    const p = timeParts(zone, date);
    const utc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    return (utc - Math.floor(date.getTime() / MS) * MS) / MS;
  }
  function localToUtc(key, hh, mm, zone) {
    const [y, m, d] = parts(key);
    const desired = Date.UTC(y, m - 1, d, hh, mm);
    const offsets = new Set([-1, 1].map(day => offsetMinutes(zone, new Date(desired + day * 86400000))));
    const candidates = [...offsets].map(offset => new Date(desired - offset * MS)).filter(candidate => {
      const p = timeParts(zone, candidate);
      return p.year + '-' + p.month + '-' + p.day === key && +p.hour === hh && +p.minute === mm;
    });
    return candidates.length === 1 ? candidates[0] : null;
  }

  function parsePrayerTime(raw, key, zone) {
    if (typeof raw !== 'string') return null;
    const iso = raw.match(/^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d):([0-5]\d)(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/i);
    if (iso) {
      const date = new Date(raw);
      if (!Number.isFinite(+date)) return null;
      const p = timeParts(zone, date);
      return p.year + '-' + p.month + '-' + p.day === iso[1] && p.hour === iso[2] && p.minute === iso[3] ? date : null;
    }
    const clock = raw.match(/^(\d{1,2}):(\d\d)(?:\s*\([^)]+\))?$/);
    if (!clock || +clock[1] > 23 || +clock[2] > 59) return null;
    return localToUtc(key, +clock[1], +clock[2], zone);
  }

  const specs = {
    moonsighting: { method:15, shafaq:'ahmer', name:'AlAdhan · Moonsighting red preset' },
    france: { method:12, name:'AlAdhan French UOIF 12°/12°' },
    mwl: { method:3, name:'AlAdhan Muslim World League' }
  };
  function buildUrl(kind, key, lat, lon, zone) {
    const spec = specs[kind];
    if (!spec) throw Error('Unknown provider');
    const qs = new URLSearchParams({ latitude: String(lat), longitude: String(lon),
      method: String(spec.method), school:'0',
      timezonestring: zone, iso8601: 'true' });
    if (spec.shafaq) qs.set('shafaq', spec.shafaq);
    return 'https://api.aladhan.com/v1/timings/' + key.split('-').reverse().join('-') + '?' + qs;
  }
  function decode(kind, key, zone, json, requested = {}) {
    const spec = specs[kind];
    const data = json?.data;
    if (!spec || json?.code !== 200 || !data?.timings) throw Error('Invalid AlAdhan response');
    const meta = data.meta;
    if (Number(meta?.method?.id) !== spec.method) throw Error('Unexpected method from online provider');
    if (spec.shafaq && meta.method.params?.shafaq !== spec.shafaq) throw Error('Unexpected twilight option');
    if (meta.school && meta.school !== 'STANDARD') throw Error('Unexpected Asr rule');
    const responseDate = data.date?.gregorian?.date;
    if (responseDate && responseDate.split('-').reverse().join('-') !== key) throw Error('Wrong provider timetable date');
    if (requested.lat !== undefined && (Math.abs(requested.lat - meta.latitude) > 0.0001 ||
        Math.abs(requested.lng - meta.longitude) > 0.0001 ||
        !Number.isFinite(+meta.latitude) || !Number.isFinite(+meta.longitude))) throw Error('Wrong provider location');

    const returnedZone = meta.timezone;
    const aliases = ['Europe/London','Europe/Belfast','Europe/Dublin'];
    if (returnedZone !== zone && !(aliases.includes(returnedZone) && aliases.includes(zone)))
      throw Error('Time zone mismatch: provider returned ' + returnedZone);

    const out = { valid:true, providerName:spec.name, providerEstimate:!!spec.shafaq, online:true, key };
    const tomorrow = keyShift(key, 1);
    for (const [name, field] of Object.entries(fields)) {
      const raw = data.timings[field];
      let time = parsePrayerTime(raw, key, zone);
      if (!time) throw Error('Bad ' + name + ' time from provider');
      const p = timeParts(zone, time);
      const date = p.year + '-' + p.month + '-' + p.day;
      if (date !== key && !(name === 'isha' && date === tomorrow)) throw Error('Provider ' + name + ' date does not match ' + key);
      // AlAdhan may attach the timetable date to a post-midnight Isha.
      if (name === 'isha' && date === key && time < out.maghrib && +p.hour < 6) {
        time = localToUtc(tomorrow, +p.hour, +p.minute, zone);
        if (!time) throw Error('Ambiguous Isha time from provider');
      }
      out[name] = time;
    }
    for (const [a, b] of [['fajr','sunrise'],['sunrise','dhuhr'],['dhuhr','asr'],['asr','maghrib'],['maghrib','isha']])
      if (out[a] >= out[b]) throw Error('Provider returned times in the wrong order');
    if (out.isha - out.maghrib > 9 * 3600000) throw Error('Unexpected Isha interval');
    return out;
  }

  root.SalahProviders = { taybaDay, taybaOneDay, hybridTwilightDay, buildUrl, decode, keyShift, localToUtc, parsePrayerTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahProviders;
})(typeof window !== 'undefined' ? window : globalThis);

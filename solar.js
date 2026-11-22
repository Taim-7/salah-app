(function (root) {
  'use strict';

  const DEG = Math.PI / 180;
  const MINUTE = 60000;
  const DAY = 86400000;
  const J2000 = Date.UTC(2000, 0, 1, 12);
  const HORIZON = -0.8333;
  const LOW_SUN = 4;
  const NOON_BUFFER = 8 * MINUTE;
  const sin = x => Math.sin(x * DEG);
  const cos = x => Math.cos(x * DEG);
  const signed = x => ((x + 180) % 360 + 360) % 360 - 180;
  const roundUpMinute = date => new Date(Math.ceil(date.getTime() / MINUTE) * MINUTE);
  const roundDownMinute = date => new Date(Math.floor(date.getTime() / MINUTE) * MINUTE);
  const plusMinutes = (date, minutes) => date && new Date(date.getTime() + minutes * MINUTE);
  const shiftDate = (y, m, d, offset) => {
    const date = new Date(Date.UTC(y, m - 1, d + offset, 12));
    return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
  };

  // Short-form Meeus solar coordinates. Refraction is applied only through
  // the standard sea-level horizon for sunrise and sunset.
  function solarPosition(instant, lng) {
    const days = (instant - J2000) / DAY;
    const t = (days + 69 / 86400) / 36525;
    const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    const meanLongitude = 280.46646 + t * (36000.76983 + 0.0003032 * t);
    const centre = (1.914602 - t * (0.004817 + 0.000014 * t)) * sin(m)
      + (0.019993 - 0.000101 * t) * sin(2 * m) + 0.000289 * sin(3 * m);
    const node = 125.04 - 1934.136 * t;
    const nutation = -0.00478 * sin(node);
    const longitude = meanLongitude + centre - 0.00569 + nutation;
    const tilt = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
      + 0.00256 * cos(node);
    const rightAscension = Math.atan2(cos(tilt) * sin(longitude), cos(longitude)) / DEG;
    const declination = Math.asin(sin(tilt) * sin(longitude)) / DEG;
    const sidereal = 280.46061837 + 360.98564736629 * days + 0.000387933 * t * t + nutation * cos(tilt);
    return { declination, hourAngle: signed(sidereal + lng - rightAscension) };
  }

  function altitude(instant, lat, lng) {
    const { declination, hourAngle } = solarPosition(instant, lng);
    return Math.asin(sin(lat) * sin(declination) + cos(lat) * cos(declination) * cos(hourAngle)) / DEG;
  }

  function bisect(low, high, value, rising) {
    while (high - low > 100) {
      const mid = (low + high) / 2;
      if ((value(mid) > 0) === rising) high = mid;
      else low = mid;
    }
    return (low + high) / 2;
  }

  function meridian(rough, lng, lower) {
    const offset = lower ? 180 : 0;
    return bisect(rough - 25 * MINUTE, rough + 25 * MINUTE,
      time => signed(solarPosition(time, lng).hourAngle - offset), true);
  }

  function solarMinimum(rough, lat, lng) {
    const transit = meridian(rough, lng, true);
    let low = transit - 20 * MINUTE;
    let high = transit + 20 * MINUTE;
    // Declination changes through the night. The lowest altitude can occur
    // either side of the lower meridian transit.
    while (high - low > 500) {
      const step = (high - low) / 3;
      if (altitude(low + step, lat, lng) > altitude(high - step, lat, lng)) low += step;
      else high -= step;
    }
    return (low + high) / 2;
  }

  const geometryCache = new Map();
  const seasonCache = new Map();
  function remember(cache, key, value, limit) {
    if (cache.size >= limit) cache.delete(cache.keys().next().value);
    cache.set(key, value);
    return value;
  }

  function geometry(y, m, day, lat, lng) {
    const key = [y, m, day, lat, lng].join(':');
    if (geometryCache.has(key)) return geometryCache.get(key);
    const roughNoon = Date.UTC(y, m - 1, day, 12) - lng * 4 * MINUTE;
    const noon = meridian(roughNoon, lng, false);
    const before = solarMinimum(roughNoon - DAY / 2, lat, lng);
    const after = solarMinimum(roughNoon + DAY / 2, lat, lng);
    const lowMorning = altitude(before, lat, lng);
    const lowEvening = altitude(after, lat, lng);
    const highest = altitude(noon, lat, lng);
    const { declination } = solarPosition(noon, lng);
    function crossing(target, morning) {
      if (target <= (morning ? lowMorning : lowEvening) || target >= highest) return null;
      const time = bisect(morning ? before : noon, morning ? noon : after,
        instant => altitude(instant, lat, lng) - target, morning);
      return new Date(time);
    }
    return remember(geometryCache, key, {
      noon, declination, crossing,
      sunrise: crossing(HORIZON, true), sunset: crossing(HORIZON, false)
    }, 1800);
  }

  function solarEvents(y, m, day, lat, lng, fajrAngle, ishaAngle) {
    const g = geometry(y, m, day, lat, lng);
    const asrAlt = Math.atan(1 / (1 + Math.tan(Math.abs(lat - g.declination) * DEG))) / DEG;
    return {
      fajrRaw: g.crossing(-fajrAngle, true),
      sunriseRaw: g.sunrise,
      solarNoonRaw: new Date(g.noon),
      asrRaw: g.crossing(asrAlt, false),
      sunsetRaw: g.sunset,
      ishaRaw: g.crossing(-ishaAngle, false),
      solarDeclination: g.declination
    };
  }

  function daylightRestrictions(date, lat, lng) {
    const g = geometry(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), lat, lng);
    if (!g.sunrise || !g.sunset) return [];
    const clearSunrise = g.crossing(LOW_SUN, true);
    const nearSunset = g.crossing(LOW_SUN, false);
    const noon = { key:'noon', start:roundDownMinute(new Date(g.noon - NOON_BUFFER)), end:roundUpMinute(new Date(g.noon)) };
    if (!clearSunrise || !nearSunset) {
      return [{ key:'lowSun', start:roundDownMinute(g.sunrise), end:roundUpMinute(g.sunset) }, noon];
    }
    return [
      { key:'sunrise', start:roundDownMinute(g.sunrise), end:roundUpMinute(clearSunrise) },
      noon,
      { key:'sunset', start:roundDownMinute(nearSunset), end:roundUpMinute(g.sunset) }
    ];
  }

  function seasonalData(year, lat, lng, angle, morning) {
    const key = [year, lat, lng, angle, morning].join(':');
    if (seasonCache.has(key)) return seasonCache.get(key);
    const start = Date.UTC(year, 0, 1);
    const length = (Date.UTC(year + 1, 0, 1) - start) / DAY;
    const samples = Array.from({ length }, (_, i) => {
      const day = shiftDate(year, 1, 1, i);
      const g = geometry(...day, lat, lng);
      const time = g.crossing(-angle, morning);
      if (!time) return null;
      const adjacent = geometry(...shiftDate(...day, morning ? -1 : 1), lat, lng);
      const sunset = morning ? adjacent.sunset : g.sunset;
      const sunrise = morning ? g.sunrise : adjacent.sunrise;
      if (!(sunset && sunrise && sunset < time && time < sunrise)) return null;
      return { i, clock: time.getTime() - start - i * DAY,
        fraction: (morning ? sunrise - time : time - sunset) / (sunrise - sunset) };
    });
    const valid = samples.filter(Boolean);
    const average = valid.reduce((sum, sample) => sum + sample.fraction, 0) / valid.length;
    return remember(seasonCache, key, { start, average, valid }, 24);
  }

  function estimate(date, lat, lng, angle, morning, before, after, rule) {
    const night = after - before;
    const byFraction = part => morning ? after.getTime() - night * part : before.getTime() + night * part;
    if (rule === 'crossings') return null;
    if (rule === 'angle') return new Date(byFraction(angle / 60));
    if (rule !== 'relative' && rule !== 'nearest') return new Date(byFraction(1 / 7));

    const season = seasonalData(date[0], lat, lng, angle, morning);
    const midnight = Date.UTC(date[0], date[1] - 1, date[2]);
    const index = (midnight - season.start) / DAY;
    const endIndex = season.valid.findIndex(s => s.i > index);
    const last = season.valid[endIndex - 1];
    const next = season.valid[endIndex];
    if (!last || !next) return null;
    if (rule === 'nearest') return new Date(midnight + last.clock);

    // Apply the local annual average, approaching it from both ends at
    // five clock minutes per day. Each selected angle has its own average.
    const left = midnight + last.clock + (index - last.i) * 5 * MINUTE * (morning ? 1 : -1);
    const right = midnight + next.clock + (next.i - index) * 5 * MINUTE * (morning ? 1 : -1);
    const average = byFraction(season.average);
    return new Date(morning ? Math.min(average, left, right) : Math.max(average, left, right));
  }

  function calculateDay(y, m, day, lat, lng, fajrAngle, ishaAngle, highLatRule) {
    if (![y, m, day, lat, lng, fajrAngle, ishaAngle].every(Number.isFinite) ||
        Math.abs(lat) >= 90 || Math.abs(lng) > 180 || [fajrAngle, ishaAngle].some(angle => angle < 6 || angle > 22)) {
      return { valid: false, reason: 'The coordinates or calculation settings are invalid.' };
    }
    const date = [y, m, day];
    const prev = geometry(...shiftDate(...date, -1), lat, lng);
    const next = geometry(...shiftDate(...date, 1), lat, lng);
    const s = solarEvents(...date, lat, lng, fajrAngle, ishaAngle);
    if (!(prev.sunset < s.sunriseRaw && s.sunriseRaw < s.solarNoonRaw && s.solarNoonRaw < s.asrRaw &&
        s.asrRaw < s.sunsetRaw && s.sunsetRaw < next.sunrise && prev.sunset && next.sunrise))
      return { valid: false, reason: 'The sunrise, sunset or Asr calculation is unavailable for this place and date.' };

    const morning = s.fajrRaw || estimate(date, lat, lng, fajrAngle, true, prev.sunset, s.sunriseRaw, highLatRule);
    const evening = s.ishaRaw || estimate(date, lat, lng, ishaAngle, false, s.sunsetRaw, next.sunrise, highLatRule);
    const sunrise = roundDownMinute(s.sunriseRaw);
    const maghrib = roundUpMinute(s.sunsetRaw);
    const fajr = morning && prev.sunset < morning && roundUpMinute(morning) < sunrise ? roundUpMinute(morning) : null;
    const isha = evening && maghrib < roundUpMinute(evening) && evening < next.sunrise ? roundUpMinute(evening) : null;
    const noTime = (raw, angle, name) => highLatRule === 'crossings' && !raw
      ? name + ' has no ' + angle + '° crossing on this date.'
      : 'This estimate gives no usable ' + name + ' time for the date.';

    return {
      valid: true,
      fajr, sunrise, isha, maghrib, dhuhr:roundUpMinute(plusMinutes(s.solarNoonRaw, 1)), asr:roundUpMinute(s.asrRaw),
      solarNoon: s.solarNoonRaw, trueSunset: s.sunsetRaw, trueSunrise: s.sunriseRaw,
      trueFajr:fajr ? morning : null, fajrFallback:!!fajr && !s.fajrRaw, ishaFallback:!!isha && !s.ishaRaw,
      fajrReason:fajr ? '' : noTime(s.fajrRaw, fajrAngle, 'Fajr'),
      ishaReason:isha ? '' : noTime(s.ishaRaw, ishaAngle, 'Isha'),
      highLatRule
    };
  }

  function withNight(today, next) {
    if (!next?.valid || !next.fajr) return today;
    const sunset = today.trueSunset || today.maghrib;
    const dawn = next.trueFajr || next.fajr;
    const length = dawn - sunset;
    if (!(length > 0 && length < DAY)) return today;
    const firstThird = new Date(sunset.getTime() + length / 3);
    const midnight = new Date(sunset.getTime() + length / 2);
    const overlaps = !!today.isha && today.isha >= next.fajr;
    return {
      ...today, isha:overlaps ? null : today.isha,
      ishaReason:overlaps ? 'This Isha calculation overlaps the following Fajr, so there is no separate Isha time.' : today.ishaReason,
      nextFajr: next.fajr, firstThird, midnight, nightMs: length,
      nightEstimated: !!(next.fajrFallback || next.providerEstimate),
      ishaBeyondFirstThird: !!today.isha && !overlaps && today.isha >= firstThird,
      ishaBeyondHalf: !!today.isha && !overlaps && today.isha >= midnight,
      ishaOverlapsFajr: overlaps
    };
  }

  function calculateFullDay(date, lat, lng, fajrAngle, ishaAngle, rule) {
    const day = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    const today = calculateDay(...day, lat, lng, fajrAngle, ishaAngle, rule);
    if (!today.valid) return today;
    const next = calculateDay(...shiftDate(...day, 1), lat, lng, fajrAngle, ishaAngle, rule);
    return withNight(today, next);
  }

  root.SalahSolar = { calculateFullDay, calculateDay, solarEvents, daylightRestrictions, shiftDate, withNight };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahSolar;
})(typeof window !== 'undefined' ? window : globalThis);

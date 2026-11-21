/*
 * Solar calculations based on the published SunCalc / Jean Meeus style formulae.
 * See https://github.com/mourner/suncalc and https://gml.noaa.gov/grad/solcalc/calcdetails.html
 * This is a compact independent implementation for local/offline prayer calculations.
 * All returned Date values represent instants; rendering uses the device's local timezone.
 */
(function (root) {
  'use strict';
  const R = Math.PI / 180, DAY = 86400000, J1970 = 2440588, J2000 = 2451545;
  const obliquity = R * 23.4397;
  const sin = Math.sin, cos = Math.cos;
  const toJulian = date => date.valueOf() / DAY - 0.5 + J1970;
  const fromJulian = j => new Date((j + 0.5 - J1970) * DAY);
  const toDays = date => toJulian(date) - J2000;
  const solarMeanAnomaly = d => R * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = m => m + R * (1.9148 * sin(m) + 0.02 * sin(2 * m) + 0.0003 * sin(3 * m)) + R * 102.9372 + Math.PI;
  const declination = l => Math.asin(sin(obliquity) * sin(l));
  const rightAscension = l => Math.atan2(sin(l) * cos(obliquity), cos(l));
  function actualAltitude(instant, phi, lw) {
    const days = toDays(new Date(instant));
    const m = solarMeanAnomaly(days);
    const longitude = eclipticLongitude(m);
    const dec = declination(longitude);
    const hourAngle = R * (280.16 + 360.9856235 * days) - lw - rightAscension(longitude);
    return Math.asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(hourAngle));
  }
  function refineCrossing(rough, targetAltitude, phi, lw, rising) {
    if (!rough) return null;
    let low = rough.getTime() - 90 * 60000;
    let high = rough.getTime() + 90 * 60000;
    const f = t => actualAltitude(t, phi, lw) - targetAltitude;
    // If no crossing is bracketed, return no prediction rather than a wrong crossing.
    const a = f(low), b = f(high);
    if (rising ? !(a < 0 && b > 0) : !(a > 0 && b < 0)) return null;
    for (let i = 0; i < 45; i++) {
      const mid = (low + high) / 2;
      if ((f(mid) > 0) === rising) high = mid;
      else low = mid;
    }
    return new Date((low + high) / 2);
  }
  function refineSolarNoon(rough, phi, lw) {
    let low = rough.getTime() - 20 * 60000;
    let high = rough.getTime() + 20 * 60000;
    for (let i = 0; i < 45; i++) {
      const third = (high - low) / 3;
      const a = low + third, b = high - third;
      if (actualAltitude(a, phi, lw) < actualAltitude(b, phi, lw)) low = a;
      else high = b;
    }
    return new Date((low + high) / 2);
  }
  const julianCycle = (d, lw) => Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const approxTransit = (ht, lw, n) => 0.0009 + (ht + lw) / (2 * Math.PI) + n;
  const solarTransit = (ds, m, l) => J2000 + ds + 0.0053 * sin(m) - 0.0069 * sin(2 * l);
  const roundUpMinute = date => date && new Date(Math.ceil(date.getTime() / 60000) * 60000);
  const roundDownMinute = date => date && new Date(Math.floor(date.getTime() / 60000) * 60000);
  const plusMinutes = (date, mins) => date && new Date(date.getTime() + mins * 60000);
  // All civil dates are zone-independent. Never anchor the calculation to the phone's local noon:
  // a traveller calculating for another continent would otherwise get the wrong solar day.
  const shiftDate = (y, m, d, shift) => {
    const x = new Date(Date.UTC(y, m - 1, d + shift, 12));
    return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()];
  };

  function solarEvents(y, m, day, lat, lng, fajrAngle, ishaAngle) {
    const phi = lat * R, lw = -lng * R;
    // Approximate solar noon at these coordinates in UTC, independent of the device zone.
    // This selects the correct Julian cycle even near the International Date Line.
    const approxLocalSolarNoon = new Date(Date.UTC(y, m - 1, day, 12) - lng * 240000);
    const d = toDays(approxLocalSolarNoon);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);
    const ma = solarMeanAnomaly(ds);
    const lon = eclipticLongitude(ma);
    const dec = declination(lon);
    const noonJ = solarTransit(ds, ma, lon);
    function when(alt, morning) {
      const ratio = (sin(alt) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec));
      if (!Number.isFinite(ratio) || ratio < -1 || ratio > 1) return null;
      const h = Math.acos(ratio);
      const setJ = solarTransit(approxTransit(h, lw, n), ma, lon);
      return refineCrossing(fromJulian(morning ? noonJ - (setJ - noonJ) : setJ), alt, phi, lw, morning);
    }
    const sunAlt = -0.833 * R;  // atmospheric refraction and solar disc
    const asrAlt = Math.atan(1 / (1 + Math.tan(Math.abs(phi - dec)))); // one object length PLUS noon shadow
    return {
      fajrRaw: when(-fajrAngle * R, true),
      sunriseRaw: when(sunAlt, true),
      solarNoonRaw: refineSolarNoon(fromJulian(noonJ), phi, lw),
      asrRaw: when(asrAlt, false),
      sunsetRaw: when(sunAlt, false),
      ishaRaw: when(-ishaAngle * R, false),
      solarDeclination: dec / R
    };
  }
  function portion(rule, angle) {
    if (rule === 'middle') return 1 / 2;
    if (rule === 'angle') return angle / 60;
    return 1 / 7;
  }
  function calculateDay(y, m, day, lat, lng, fajrAngle, ishaAngle, highLatRule) {
    const prev = shiftDate(y, m, day, -1), next = shiftDate(y, m, day, 1);
    const p = solarEvents(...prev, lat, lng, fajrAngle, ishaAngle);
    const s = solarEvents(y, m, day, lat, lng, fajrAngle, ishaAngle);
    const t = solarEvents(...next, lat, lng, fajrAngle, ishaAngle);
    if (!s.sunriseRaw || !s.sunsetRaw || !s.solarNoonRaw || !s.asrRaw || !p.sunsetRaw || !t.sunriseRaw) {
      return { valid: false, reason: 'Sunrise or sunset could not be calculated at this latitude on this date.' };
    }
    const prevNight = s.sunriseRaw - p.sunsetRaw;
    const nextNight = t.sunriseRaw - s.sunsetRaw;
    if (prevNight <= 0 || nextNight <= 0 || prevNight > DAY || nextNight > DAY)
      return { valid: false, reason: 'No safe sunset-to-sunrise interval could be calculated here.' };
    const fajrFallback = !s.fajrRaw;
    const ishaFallback = !s.ishaRaw;
    const fajr = fajrFallback ? new Date(s.sunriseRaw.getTime() - portion(highLatRule, fajrAngle) * prevNight) : s.fajrRaw;
    const isha = ishaFallback ? new Date(s.sunsetRaw.getTime() + portion(highLatRule, ishaAngle) * nextNight) : s.ishaRaw;
    if (!(fajr < s.sunriseRaw && isha > s.sunsetRaw))
      return { valid: false, reason: 'Twilight times are outside the expected night. Check the method and location.' };
    // Round times conservatively where praying early could be a problem.
    return {
      valid: true,
      fajr: roundUpMinute(fajr),
      sunrise: roundDownMinute(s.sunriseRaw),
      dhuhr: roundUpMinute(plusMinutes(s.solarNoonRaw, 1)),
      asr: roundUpMinute(s.asrRaw),
      maghrib: roundUpMinute(s.sunsetRaw),
      isha: roundUpMinute(isha),
      solarNoon: s.solarNoonRaw,
      trueSunset: s.sunsetRaw,
      fajrFallback, ishaFallback,
      highLatRule,
      lat, lng
    };
  }
  function calculateFullDay(date, lat, lng, fajrAngle, ishaAngle, rule) {
    const [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
    const today = calculateDay(y, m, d, lat, lng, fajrAngle, ishaAngle, rule);
    if (!today.valid) return today;
    const tomorrow = shiftDate(y, m, d, 1);
    const next = calculateDay(...tomorrow, lat, lng, fajrAngle, ishaAngle, rule);
    if (!next.valid) return next;
    const night = next.fajr.getTime() - today.maghrib.getTime();
    if (night <= 0 || night > DAY) return { valid: false, reason: 'The calculated Islamic night is invalid. Check coordinates and method.' };
    today.firstThird = new Date(today.maghrib.getTime() + night / 3);
    today.midnight = new Date(today.maghrib.getTime() + night / 2);
    today.nextFajr = next.fajr;
    today.nightMs = night;
    today.ishaBeyondFirstThird = today.isha >= today.firstThird;
    today.ishaBeyondHalf = today.isha >= today.midnight;
    return today;
  }
  root.SalahSolar = { calculateFullDay, calculateDay, solarEvents, plusMinutes, shiftDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahSolar;
})(typeof window !== 'undefined' ? window : globalThis);

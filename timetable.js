(function (root) {
  'use strict';

  const { SalahSolar: solar, SalahProviders: providers } = root;
  const angles = config => config.method === 'custom' ? [+config.fajrAngle, +config.ishaAngle] :
    config.method.split('-').map(Number);

  function localDay(key, config, source, rule) {
    const { lat, lng } = config;
    if (source === 'tayba') return providers.taybaDay(key, lat, lng);
    const [fajr, isha] = angles(config);
    if (rule === 'tayba') return providers.hybridTwilightDay(key, lat, lng, fajr, isha);
    return solar.calculateFullDay(new Date(`${key}T12:00:00Z`), lat, lng, fajr, isha, rule);
  }

  function aladhanDay(local, today, next) {
    const fajr = today.fajr < local.sunrise ? today.fajr : null;
    const isha = today.isha > local.maghrib ? today.isha : null;
    return solar.withNight({
      ...today, fajr, isha, sunrise: local.sunrise, dhuhr: local.dhuhr, asr: local.asr, maghrib: local.maghrib,
      trueSunset: local.trueSunset, solarNoon: local.solarNoon,
      fajrReason: fajr ? '' : 'AlAdhan Fajr is at or after the local sunrise time.',
      ishaReason: isha ? '' : 'AlAdhan Isha does not follow the local sunset time.'
    }, next);
  }

  function isEstimated(day, name) {
    return !!day[name] && ((name === 'fajr' && (day.fajrFallback || day.providerEstimate)) ||
      (name === 'isha' && (day.ishaFallback || day.providerEstimate)));
  }

  const ishaDeadline = (day, limit) => limit === 'third' ? day.firstThird : day.midnight;

  function ishaHasWindow(day, limit) {
    const deadline = ishaDeadline(day, limit);
    return !!day.isha && !day.ishaOverlapsFajr && (!deadline || day.isha < deadline);
  }

  root.SalahTimetable = { angles, localDay, aladhanDay, isEstimated, ishaDeadline, ishaHasWindow };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahTimetable;
})(typeof window !== 'undefined' ? window : globalThis);

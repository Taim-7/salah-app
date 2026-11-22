(function (root) {
  'use strict';

  const months = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah',
    'Rajab', 'Sha’ban', 'Ramadan', 'Shawwal', 'Dhul-Qa’dah', 'Dhul-Hijjah'];
  const dayMs = 86400000;
  const noon = key => new Date(key + 'T12:00:00Z');
  const keyFor = date => date.toISOString().slice(0, 10);
  let formatter;
  for (const calendar of ['islamic-umalqura', 'islamic-civil']) {
    const candidate = new Intl.DateTimeFormat('en-GB', {
      calendar, timeZone:'UTC', numberingSystem:'latn', year:'numeric', month:'numeric', day:'numeric'
    });
    if (candidate.resolvedOptions().calendar === calendar) { formatter = candidate; break; }
  }

  function parts(date) {
    if (!formatter || !Number.isFinite(+date)) return null;
    const fields = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, Number(part.value)]));
    return months[fields.month - 1] && Number.isFinite(fields.day) && Number.isFinite(fields.year) ? fields : null;
  }

  function label(key) {
    const hijri = parts(noon(key));
    return hijri ? `${hijri.day} ${months[hijri.month - 1]} ${hijri.year} AH` : '';
  }

  const voluntaryDay = ({ month, day }) => month !== 9 && !(month === 10 && day === 1) &&
    !(month === 12 && day >= 10 && day <= 13) && !(month === 8 && day >= 29);

  function upcoming(key) {
    const start = noon(key), today = parts(start);
    const dates = {}, fasts = {};
    if (!today) return { dates, fasts };
    if (today.month === 9) dates.ramadan = { from:keyFor(new Date(+start - (today.day - 1) * dayMs)) };
    let whiteMonth;
    for (let i = 0; i <= 370; i++) {
      const date = new Date(+start + i * dayMs), hijri = parts(date);
      if (!hijri) continue;
      const { month, day, year } = hijri;
      const from = keyFor(date);
      if (month === 9 && day === 1) dates.ramadan ??= { from };
      if (month === 10 && day === 1) dates.fitr ??= { from };
      if (month === 12 && day === 10) dates.adha ??= { from };
      if (month === 12 && day === 9) fasts.arafah ??= { from };
      if (month === 1 && day === 10) fasts.ashura ??= i ? { from:keyFor(new Date(+date - dayMs)), to:from } : { from };
      if (voluntaryDay(hijri)) {
        if (date.getUTCDay() === 1) fasts.monday ??= { from };
        if (date.getUTCDay() === 4) fasts.thursday ??= { from };
        if (day >= 13 && day <= 15) {
          whiteMonth ??= `${year}-${month}`;
          if (whiteMonth === `${year}-${month}`) {
            if (fasts.white) fasts.white.to = from;
            else fasts.white = { from };
          }
        }
      }
      if (dates.ramadan && dates.fitr && dates.adha && fasts.arafah && fasts.ashura && fasts.monday &&
          fasts.thursday && fasts.white && (day > 15 || whiteMonth !== `${year}-${month}`)) break;
    }
    return { dates, fasts };
  }

  root.SalahHijri = { label, upcoming };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahHijri;
})(typeof window !== 'undefined' ? window : globalThis);

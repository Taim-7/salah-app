(function (root) {
  'use strict';

  const minute = 60000;
  const ishaReminderLead = 10 * minute;

  function collect(days, { getDay, allowFallback, prayers, config, timetable }) {
    const alerts = [];
    for (const date of days) {
      const day = getDay(date);
      if (!day.valid || (day.sourceFallback && !allowFallback(date))) continue;
      for (const prayer of prayers) {
        const target = +day[prayer.key];
        if (!Number.isFinite(target) || !day[prayer.key]) continue;
        const isha = prayer.key === 'isha';
        if (isha && (!day.nextFajr || !timetable.ishaHasWindow(day, config.ishaLimit))) continue;
        const cutoff = isha ? timetable.ishaDeadline(day, config.ishaLimit) : null;
        const event = { ...prayer, at:day[prayer.key], estimated:timetable.isEstimated(day, prayer.key) };
        const id = date + ':' + prayer.key;
        alerts.push({ id, date, kind:'start', event, day, target, at:target,
          until:Math.min(cutoff ?? Infinity, target + 2 * minute) });
        if (config.reminderEnabled) alerts.push({
          id:id + ':before', date, kind:'before', event, day, target, at:target - config.reminderLead * minute, until:target
        });
      }
      if (day.firstThird) {
        const target = +day.firstThird;
        alerts.push({ id:date + ':first-third', date, kind:'third', day, target, at:target - ishaReminderLead, until:target });
      }
    }
    return alerts;
  }

  function androidEvent(alert, config) {
    const { id, date, kind, event, day, target, at, until } = alert;
    return {
      id, date, kind, prayer:event?.key || null, target, at, until,
      estimated:!!(kind === 'third' ? day.nightEstimated : event.estimated),
      source:day.sourceFallback ? 'local-fallback' : config.activeSource,
      isha:kind === 'third' && day.isha && !day.ishaOverlapsFajr ? +day.isha : null,
      muted:config.soundVolume === 0 || (kind === 'start' && config.soundChoice === 'off')
    };
  }

  function isIshaReminderDuringPrayer(alert, now) {
    return alert.kind === 'third' && !!alert.day.isha && !alert.day.ishaOverlapsFajr &&
      +alert.day.isha <= now && now < alert.target;
  }

  root.SalahAlerts = { collect, androidEvent, isIshaReminderDuringPrayer, minute };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahAlerts;
})(typeof window !== 'undefined' ? window : globalThis);

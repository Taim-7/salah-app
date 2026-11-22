'use strict';
const assert = require('node:assert/strict');
const S = globalThis.SalahSolar = require('../solar.js');
const P = require('../providers.js');
const lat = 54.9966, lng = -7.3086;
const on = (day, rule, here = [lat, lng], angles = [15, 13]) =>
  S.calculateFullDay(new Date(day + 'T12:00Z'), ...here, ...angles, rule);
const spring = on('2026-05-18', 'seventh');
assert.equal(spring.fajrFallback, false, 'Find the 15° crossing near lower transit');
assert.equal(spring.ishaFallback, false);
const firstMissing = on('2026-05-21', 'relative');
const previous = on('2026-05-20', 'relative');
assert.equal(firstMissing.fajrFallback, true);
assert.equal(previous.fajrFallback, false);
assert.equal((firstMissing.fajr - previous.fajr) / 60000, 1445);
assert.equal(previous.nightEstimated, true);

const solstice = on('2026-06-21', 'crossings');
assert.equal(solstice.fajr, null);
assert.equal(solstice.isha, null);
assert.ok(solstice.sunrise < solstice.dhuhr && solstice.dhuhr < solstice.asr && solstice.asr < solstice.maghrib);
assert.equal(solstice.midnight, undefined);
for (const date of ['2026-05-18', '2026-05-21', '2026-06-21', '2026-07-24']) {
  const fixed = on(date, 'crossings');
  const tayba = P.taybaDay(date, lat, lng);
  const mixed = P.hybridTwilightDay(date, lat, lng, 15, 13);
  assert.equal(+mixed.fajr, +(fixed.fajr || tayba.fajr));
  assert.equal(+mixed.isha, +(fixed.isha || tayba.isha));
  assert.equal(mixed.fajrFallback, !fixed.fajr);
  assert.equal(mixed.ishaFallback, !fixed.isha);
}

const last = on('2026-06-21', 'nearest'), lastPrev = on('2026-06-20', 'nearest');
assert.equal(last.fajr - lastPrev.fajr, 86400000);
assert.equal(last.isha - lastPrev.isha, 86400000);
const overlap = on('2026-07-01', 'nearest', [54.9505, -7.734], [18, 12]);
assert.equal(overlap.ishaOverlapsFajr, true);
assert.equal(overlap.isha, null);
assert.match(overlap.ishaReason, /overlaps/);
assert.ok(overlap.maghrib < overlap.nextFajr);
console.log('PASS: crossings, selective seasonal fallback, uninterrupted daylight times, and conflicting Isha suppression.');

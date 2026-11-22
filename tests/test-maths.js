'use strict';
const assert = require('node:assert/strict');
const S = globalThis.SalahSolar = require('../solar.js');
const P = require('../providers.js');
const R = require('../region.js');

const places = R.places.filter(([name]) => [
  'Derry', 'Strabane', 'Limavady', 'Portrush', 'Belfast', 'Buncrana', 'Letterkenny', 'Dublin', 'Cork', 'Lerwick', 'London'
].includes(name));
const rules = ['seventh', 'angle', 'relative', 'nearest', 'tayba', 'crossings'];
let checked = 0, withheld = 0;
for (const [name, area, lat, lng] of places) {
  for (const [fa, ia] of [[12, 12], [15, 13], [18, 17]]) {
    for (const rule of rules) {
      for (const year of [2026, 2028]) {
        for (let at = Date.UTC(year, 0, 1, 12); at < Date.UTC(year + 1, 0, 1); at += 86400000) {
          const date = new Date(at);
          const key = date.toISOString().slice(0, 10);
          const p = rule === 'tayba' ?
            P.hybridTwilightDay(key, lat, lng, fa, ia) :
            S.calculateFullDay(date, lat, lng, fa, ia, rule);
          const label = [name, key, fa, ia, rule].join(' ');
          assert.ok(p.valid, label);
          assert.ok(p.sunrise < p.dhuhr && p.dhuhr < p.asr && p.asr < p.maghrib, label);
          if (p.fajr) assert.ok(p.fajr < p.sunrise, label);
          if (p.isha) assert.ok(p.maghrib < p.isha && (!p.nextFajr || p.isha < p.nextFajr), label);
          if (!p.fajr || !p.isha) withheld++;
          if (p.nextFajr) {
            assert.ok(p.maghrib < p.firstThird && p.firstThird < p.midnight && p.midnight < p.nextFajr, label);
            assert.ok(Math.abs((p.firstThird - p.trueSunset) - p.nightMs / 3) < 1, label);
            assert.ok(Math.abs((p.midnight - p.trueSunset) - p.nightMs / 2) < 1, label);
          } else assert.equal(p.midnight, undefined, label);
          checked++;
        }
      }
    }
  }
  for (const key of ['2026-01-10', '2026-03-29', '2026-06-21', '2026-10-25', '2026-12-21']) {
    const date = new Date(key + 'T12:00Z');
    const p = S.calculateFullDay(date, lat, lng, 15, 13, 'crossings');
    const [sunrise, midday, sunset] = S.daylightRestrictions(date, lat, lng);
    assert.equal(+sunrise.start, +p.sunrise);
    assert.ok(sunrise.end < midday.start && midday.end <= p.dhuhr && p.asr < sunset.start);
    assert.equal(+sunset.end, +p.maghrib);
    assert.ok(sunrise.end - sunrise.start > 15 * 60000 && sunset.end - sunset.start > 15 * 60000);
  }
}
console.log('PASS: ' + checked + ' daily combinations. ' + withheld + ' partial days kept daylight calculations.');

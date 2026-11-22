'use strict';

const assert = require('node:assert/strict');
const { label, upcoming } = require('../hijri.js');

const winter = upcoming('2026-11-22');
assert.match(label('2026-11-22'), /^\d+ Jumada al-Akhirah 1448 AH$/);
assert.match(label(winter.dates.ramadan.from), /^1 Ramadan /);
assert.match(label(winter.dates.fitr.from), /^1 Shawwal /);
assert.match(label(winter.dates.adha.from), /^10 Dhul-Hijjah /);
assert.match(label(winter.fasts.arafah.from), /^9 Dhul-Hijjah /);
assert.match(label(winter.fasts.ashura.from), /^9 Muharram /);
assert.match(label(winter.fasts.ashura.to), /^10 Muharram /);
assert.equal(upcoming(winter.dates.ramadan.from).dates.ramadan.from, winter.dates.ramadan.from);

const eid = upcoming(winter.dates.adha.from);
assert.match(label(eid.fasts.white.from), /^14 Dhul-Hijjah /);
assert.match(label(eid.fasts.white.to), /^15 Dhul-Hijjah /);
for (const fast of Object.values(eid.fasts)) {
  assert(!/^(10|11|12|13) Dhul-Hijjah /.test(label(fast.from)));
}

const duringRamadan = upcoming(winter.dates.ramadan.from);
assert(duringRamadan.fasts.monday.from > winter.dates.fitr.from);
assert(duringRamadan.fasts.thursday.from > winter.dates.fitr.from);
assert.equal(label('invalid'), '');
console.log('PASS: Hijri labels, Ramadan and Eid dates, Sunnah fasts and exclusions.');

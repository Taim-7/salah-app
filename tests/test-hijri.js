'use strict';

const assert = require('node:assert/strict');
const { label, upcoming, occasions } = require('../hijri.js');

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
assert(duringRamadan.fasts.white.from > winter.dates.fitr.from);
assert.deepEqual(Object.keys(winter.fasts).sort(), ['arafah', 'ashura', 'white']);
assert.equal(label('invalid'), '');
assert.deepEqual(Object.fromEntries(Object.entries(occasions).map(([name, occasion]) => [name, occasion.kind])), {
  ramadan:'required', white:'sunnah', arafah:'sunnah', ashura:'sunnah', fitr:'forbidden', adha:'forbidden'
});
for (const { notes, sources } of Object.values(occasions)) {
  assert(notes.every(note => note.length > 30));
  assert(sources.some(({ name, url, arabic }) => /sahih/i.test(name) && url.startsWith('https://sunnah.com/') && /\p{Script=Arabic}/u.test(arabic)));
  assert(sources.every(({ url, meaning }) => ['quran.com', 'sunnah.com'].includes(new URL(url).hostname) && meaning.length > 30));
}
console.log('PASS: Hijri labels, Ramadan and Eid dates, Sunnah fasts, exclusions and sources.');

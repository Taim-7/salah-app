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
assert.deepEqual(Object.keys(winter.fasts).sort(), ['arafah', 'ashura', 'shawwal', 'white']);
const shawwal = winter.fasts.shawwal;
assert(shawwal.from > winter.dates.fitr.from);
assert.match(label(shawwal.from), /^2 Shawwal /);
assert.match(label(shawwal.to), /^(29|30) Shawwal /);
assert.deepEqual(upcoming(winter.dates.fitr.from).fasts.shawwal, shawwal);
assert.deepEqual(upcoming(shawwal.to).fasts.shawwal, shawwal);
assert(occasions.white.notes.some(note => /11 to 13 Dhul-Hijjah/.test(note)));
assert(occasions.shawwal.notes.some(note => /optional and recommended/.test(note)));
assert.equal(label('invalid'), '');
assert.deepEqual(Object.fromEntries(Object.entries(occasions).map(([name, occasion]) => [name, occasion.kind])), {
  ramadan:'required', white:'sunnah', arafah:'sunnah', ashura:'sunnah', fitr:'forbidden', shawwal:'sunnah', adha:'forbidden'
});
for (const { notes, sources } of Object.values(occasions)) {
  assert(notes.every(note => note.length > 30));
  assert(sources.some(({ name, url, arabic }) => /sahih/i.test(name) && url.startsWith('https://sunnah.com/') && /\p{Script=Arabic}/u.test(arabic)));
  assert(sources.every(({ url, arabic, meaning }) => ['quran.com', 'sunnah.com', 'binbaz.org.sa'].includes(new URL(url).hostname) &&
    /\p{Script=Arabic}/u.test(arabic) && meaning.length > 30));
}
console.log('PASS: Hijri labels, Ramadan and Eid dates, Sunnah fasts, exclusions and sources.');

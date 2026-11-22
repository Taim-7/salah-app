'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync(__dirname+'/../app.js','utf8');
const snippet = src.match(/  const KAABA=\{[^\n]+\};\n  const norm360=[\s\S]+?\n  \}/);
assert(snippet,'Qibla bearing function should exist in app.js');
const get = Function(snippet[0]+';return qiblaBearing;')();
const locations = [
  ['Derry',54.9966,-7.3086,114.379],
  ['Belfast',54.5973,-5.9301,115.481],
  ['Dublin',53.3498,-6.2603,114.100],
  ['Cork',51.8985,-8.4756,110.648],
  ['London',51.5072,-0.1276,118.987],
  ['New York',40.7128,-74.0060,58.482],
  ['Sydney',-33.8688,151.2093,277.500],
  ['Istanbul',41.0082,28.9784,151.621],
];
for (const [city,lat,lng,expected] of locations) {
  const actual=get(lat,lng);
  assert(Math.abs(actual-expected)<0.02, `${city}: expected ${expected}, got ${actual}`);
  console.log(city, actual.toFixed(3)+'°');
}

async function checkMagneticModel() {
  const { magvar } = await import('../vendor/magvar/magvar.mjs');
  // NOAA WMM2025_TEST_VALUES.txt, declination in degrees at sea level.
  const samples = [
    ['2025-01-01T00:00:00Z', 80, 0, 1.28],
    ['2025-01-01T00:00:00Z', 0, 120, -.16],
    ['2027-07-02T12:00:00Z', -80, -120, 68.49],
    ['2027-07-02T12:00:00Z', 80, 0, 2.59]
  ];
  for (const [date, lat, lng, expected] of samples) {
    assert(Math.abs(magvar(lat, lng, 0, new Date(date)) - expected) < .015);
  }
  const derry = magvar(54.9966, -7.3086, 0, new Date('2026-11-22T12:00:00Z'));
  assert(Math.abs(derry - (-1.7894)) < .015);
  console.log('PASS: Qibla bearings and WMM2025 declination values.');
}
checkMagneticModel().catch(error => { console.error(error); process.exitCode = 1; });

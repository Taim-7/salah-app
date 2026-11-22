'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync(__dirname+'/../app.js','utf8');
const snippet = src.match(/  const KAABA=\{[^\n]+\};\n  const norm360=[\s\S]+?\n  \}/);
assert(snippet,'Qibla bearing function should exist in app.js');
const get = Function(snippet[0]+';return qiblaBearing;')();
const locations = [
  ['Derry',54.9966,-7.3086,114.379],
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
console.log('Qibla great-circle tests passed. Sensor and WMM model still require device testing.');

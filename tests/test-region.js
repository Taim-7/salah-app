const assert=require('node:assert/strict');
const R=require('../region.js');
const places={
 'Derry': [54.9966,-7.3086,'GB'],'Belfast':[54.597,-5.93,'GB'],
 'Donegal':[54.65,-8.11,'IE'],'Dublin':[53.3498,-6.2603,'IE'],
 'Galway':[53.27,-9.05,'IE'],'London':[51.5072,-.1276,'GB'],
 'Glasgow':[55.8642,-4.2518,'GB'],'Inverness':[57.48,-4.225,'GB'],
 'Isle of Man':[54.236,-4.548,null],'Irish Sea':[54,-5,null],
 'Atlantic':[54,-11,null],'France':[50.98,1.5,null],
 'Paris':[48.85,2.35,null],'Amsterdam':[52.37,4.9,null]
};
for(const [name,[lat,lng,code]] of Object.entries(places)){
  const actual=R.country(lat,lng);
  assert.equal(actual,code,`${name} expected ${code} got ${actual}`);
  assert.equal(R.allowed(lat,lng),code!==null);
  if(code)assert.equal(R.zone(lat,lng),code==='IE'?'Europe/Dublin':'Europe/London');
}
assert.equal(R.allowed(NaN,0),false);
console.log(`PASS ${Object.keys(places).length} UK/Ireland location examples, sea/foreign exclusions, and time zones`);

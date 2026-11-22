const S = require('../solar.js');
function dyy(date){const y=date.getUTCFullYear(),yearStart=Date.UTC(y,0,1),days=Math.round((date.getTime()-yearStart)/86400000)+1;return (days+10)%365;}
function seasonal(lat,d,morning){const j=dyy(d),a=morning?75+28.65/55*lat:62+17.4/55*lat,b=morning?75+19.44/55*lat:62-7.16/55*lat,c=morning?75+32.74/55*lat:62+5.12/55*lat,dd=morning?75+48.1/55*lat:62+19.44/55*lat;
 if(j<91)return a+(b-a)/91*j;if(j<137)return b+(c-b)/46*(j-91);if(j<183)return c+(dd-c)/46*(j-137);if(j<229)return dd+(c-dd)/46*(j-183);if(j<275)return c+(b-c)/46*(j-229);return b+(a-b)/91*(j-275);}
const latB=54.999,latA=55.001,lon=-7.3086;
function times(date,lat){let y=date.getUTCFullYear(),m=date.getUTCMonth()+1,d=date.getUTCDate();const t=S.solarEvents(y,m,d,lat,lon,18,18), tom=new Date(date);tom.setUTCDate(tom.getUTCDate()+1);const next=S.solarEvents(tom.getUTCFullYear(),tom.getUTCMonth()+1,tom.getUTCDate(),lat,lon,18,18);const night=next.sunriseRaw-t.sunsetRaw;const cap=night/7;
 const sf=t.sunriseRaw.getTime()-seasonal(lat,date,true)*60000,si=t.sunsetRaw.getTime()+seasonal(lat,date,false)*60000;
 const fa=lat>=55?Math.max(t.sunriseRaw.getTime()-cap,sf):Math.max(t.fajrRaw?.getTime()||-Infinity,sf);
 const is=lat>=55?Math.min(t.sunsetRaw.getTime()+cap,si):Math.min(t.ishaRaw?.getTime()||Infinity,si);
 return {fajr:fa,isha:is,night:night/60000,cap:cap/60000,fajrCapped:lat>=55&&Math.abs(fa-(t.sunriseRaw-cap))<1000,ishaCapped:lat>=55&&Math.abs(is-(t.sunsetRaw.getTime()+cap))<1000};}
let changes=[],fc=0,ic=0;for(let day=0;day<365;day++){let date=new Date(Date.UTC(2026,0,1+day,12)),lo=times(date,latB),hi=times(date,latA);if(hi.fajrCapped)fc++;if(hi.ishaCapped)ic++;const deltaF=Math.round((hi.fajr-lo.fajr)/60000), deltaI=Math.round((hi.isha-lo.isha)/60000);changes.push({date:date.toISOString().slice(0,10),deltaF,deltaI});}
const huge=changes.filter(x=>Math.abs(x.deltaF)>15||Math.abs(x.deltaI)>15);
const maxf=changes.reduce((a,x)=>Math.abs(x.deltaF)>Math.abs(a.deltaF)?x:a);const maxi=changes.reduce((a,x)=>Math.abs(x.deltaI)>Math.abs(a.deltaI)?x:a);
console.log(JSON.stringify({source:'Batoul adhan-js formula with Salah solar positions; NOT live AlAdhan API',fajrCappedDays:fc,ishaCappedDays:ic,datesWithJumpOver15Min:huge.length,maxFajr:maxf,maxIsha:maxi,atSummerSolstice:changes.find(x=>x.date==='2026-06-21'),atWinterSolstice:changes.find(x=>x.date==='2026-12-21')},null,2));

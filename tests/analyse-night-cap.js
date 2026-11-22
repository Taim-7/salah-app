const S=require('../solar.js');const dates=[];
for(let m=1;m<=12;m++)for(let d=1;d<=31;d++){
 const date=new Date(Date.UTC(2026,m-1,d,12));if(date.getUTCMonth()+1!==m)continue;
 const key=date.toISOString().slice(0,10),p=S.shiftDate(2026,m,d,-1),n=S.shiftDate(2026,m,d,1);
 const today=S.solarEvents(2026,m,d,54.9966,-7.3086,15,13),prev=S.solarEvents(...p,54.9966,-7.3086,15,13),next=S.solarEvents(...n,54.9966,-7.3086,15,13);
 const nightBefore=today.sunriseRaw.getTime()-prev.sunsetRaw.getTime(),nightAfter=next.sunriseRaw.getTime()-today.sunsetRaw.getTime();
 const F=today.sunriseRaw.getTime()-nightBefore/7, I=today.sunsetRaw.getTime()+nightAfter/7;
 const existing=S.calculateDay(2026,m,d,54.9966,-7.3086,15,13,'seventh');
 const cappedF=Math.max(today.fajrRaw?.getTime()||-Infinity,F), cappedI=Math.min(today.ishaRaw?.getTime()||Infinity,I);
 const diffF=Math.round((cappedF-existing.fajr.getTime())/60000),diffI=Math.round((cappedI-existing.isha.getTime())/60000);
 dates.push({key,diffF,diffI,changedF:Math.abs(diffF)>=1,changedI:Math.abs(diffI)>=1,missingF:!today.fajrRaw,missingI:!today.ishaRaw});
}
console.log(JSON.stringify({daysFajrWouldChange:dates.filter(x=>x.changedF).length,daysIshaWouldChange:dates.filter(x=>x.changedI).length,withCrossingF:dates.filter(x=>x.changedF&&!x.missingF).length,withCrossingI:dates.filter(x=>x.changedI&&!x.missingI).length,maxShiftF:Math.max(...dates.map(x=>Math.abs(x.diffF))),maxShiftI:Math.max(...dates.map(x=>Math.abs(x.diffI))),examples:dates.filter(x=>x.changedF&&!x.missingF||x.changedI&&!x.missingI).slice(0,5)},null,2));

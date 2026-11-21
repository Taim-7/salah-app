"""Independent physics check using Swiss Ephemeris (not bundled with PWA)."""
import swisseph as swe,datetime as dt, subprocess,json,math
from zoneinfo import ZoneInfo
locations=[('Derry',54.9966,-7.3086,'Europe/London'),('London',51.507,-.127,'Europe/London'),('New York',40.7128,-74.006,'America/New_York'),('Tokyo',35.68,139.69,'Asia/Tokyo'),('Sydney',-33.87,151.21,'Australia/Sydney'),('Makkah',21.4225,39.8262,'Asia/Riyadh'),('Auckland',-36.85,174.76,'Pacific/Auckland'),('Honolulu',21.3099,-157.858,'Pacific/Honolulu')]
dates=[(2026,1,15),(2026,3,29),(2026,6,21),(2026,7,21),(2026,10,25),(2026,11,21),(2026,12,21)]
keys=['fajr','sunrise','dhuhr','asr','maghrib','isha']
js="""const S=require('./solar.js');let q=JSON.parse(process.argv[1]);console.log(JSON.stringify(q.map(([name,lat,lon,tz,y,m,d,fa,ia])=>{let r=S.calculateDay(y,m,d,lat,lon,fa,ia,'seventh');return {valid:r.valid,fajrFallback:r.fajrFallback,ishaFallback:r.ishaFallback,solarDeclination:r.solarDeclination, ...Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha','solarNoon'].map(k=>[k,r[k]?.toISOString()]))}})));"""
rows=[(name,lat,lon,tz,*date,fa,ia) for name,lat,lon,tz in locations for date in dates for fa,ia in [(12,12),(15,13)]]
out=subprocess.check_output(['node','-e',js,json.dumps(rows)],cwd='/mnt/data/salah_pwa_v2');results=json.loads(out)

def jd_when(isot):
 v=dt.datetime.fromisoformat(isot.replace('Z','+00:00'));t=v.timestamp()/86400+2440587.5;return t

def altitude(jd,lat,lon):
 pos,rf=swe.calc_ut(jd,swe.SUN,swe.FLG_MOSEPH|swe.FLG_EQUATORIAL)
 return swe.azalt(jd,swe.EQU2HOR,(lon,lat,0),0,10,pos[:3])[1]

def crossing_near(iso,lat,lon,angle,rising):
 guess=jd_when(iso)
 a=guess-0.08;b=guess+0.08
 fa=altitude(a,lat,lon)-angle;fb=altitude(b,lat,lon)-angle
 if rising and not (fa<0 and fb>0) or not rising and not (fa>0 and fb<0):return None
 for _ in range(50):
  mid=(a+b)/2
  f=altitude(mid,lat,lon)-angle
  if (f>0)==rising:b=mid
  else:a=mid
 return (a+b)/2

errors=[];invalid=[];samples=[]
for row,r in zip(rows,results):
 name,lat,lon,tz,y,m,d,fa,ia=row
 if not r['valid']:
  invalid.append(row);continue
 jd_noon = jd_when(r['solarNoon'])
 solar_equatorial = swe.calc_ut(jd_noon,swe.SUN,swe.FLG_MOSEPH|swe.FLG_EQUATORIAL)[0]
 swiss_dec = solar_equatorial[1]
 asr_angle = math.degrees(math.atan(1/(1+math.tan(math.radians(abs(lat-swiss_dec))))))
 for key,angle,rising in [('fajr',-fa,True),('sunrise',-.833,True),('asr',asr_angle,False),('maghrib',-.833,False),('isha',-ia,False)]:
  if (key=='fajr' and r['fajrFallback']) or (key=='isha' and r['ishaFallback']):continue
  ref=crossing_near(r[key],lat,lon,angle,rising)
  if ref is None:invalid.append((row,key,'crossing failed'));continue
  delta=(jd_when(r[key])-ref)*1440
  errors.append((abs(delta),delta,name,(y,m,d),key,r[key]))
  if name=='Derry' and (y,m,d) in [(2026,11,21),(2026,6,21)]:samples.append((name,y,m,d,key,r[key],round(delta,2)))
errors.sort(reverse=True)
print('events',len(errors),'max absolute deviation minutes',round(errors[0][0],3),'mean',round(sum(x[0] for x in errors)/len(errors),3),' >3 min',sum(x[0]>3 for x in errors))
print('top 12',errors[:12]);print('samples',samples[:12]);print('invalid',invalid[:12])
assert not invalid
assert errors[0][0]<3.5

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const defaults = {
    lat: 54.9966, lng: -7.3086, location: 'Derry, Northern Ireland', timeZone: 'Europe/London',
    zoneVerified: true, autoLocation: false, method: '15-13', fajrAngle: 15, ishaAngle: 13,
    ishaEnd: 'third', highLatRule: 'seventh', activeSource: 'angles', soundChoice: 'adhan', onlineCompare: true, calendarLead: 15, timeFormat: '12', theme: 'dark', layout: 'classic', accent: 'forest'
  };
  const names = [
    { key: 'fajr', en: 'Fajr', ar: 'الفجر', icon: 'sun-horizon', desc: 'Dawn' },
    { key: 'sunrise', en: 'Sunrise', ar: 'الشروق', icon: 'sunrise', desc: 'Fajr ends' },
    { key: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', icon: 'sun', desc: 'Midday' },
    { key: 'asr', en: 'Asr', ar: 'العصر', icon: 'sun-low', desc: 'Afternoon' },
    { key: 'maghrib', en: 'Maghrib', ar: 'المغرب', icon: 'sunset', desc: 'Sunset' },
    { key: 'isha', en: 'Isha', ar: 'العشاء', icon: 'moon', desc: 'Night' }
  ];
  const prayers = names.filter(p => p.key !== 'sunrise');
  const dateParts = (date, zone) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = name => parts.find(x => x.type === name).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  };
  const dayShift = (key, amount) => {
    const [y, m, d] = key.split('-').map(Number);
    const z = new Date(Date.UTC(y, m - 1, d + amount, 12));
    return `${z.getUTCFullYear()}-${String(z.getUTCMonth() + 1).padStart(2, '0')}-${String(z.getUTCDate()).padStart(2, '0')}`;
  };
  const dateAtNoonUTC = key => new Date(`${key}T12:00:00Z`);
  const validZone = z => {
    try { new Intl.DateTimeFormat('en-GB', { timeZone: z }); return true; } catch { return false; }
  };
  function loadConfig() {
    try {
      const raw = JSON.parse(localStorage.getItem('salah-config') || '{}');
      const c = { ...defaults, ...raw };
      // Keep existing settings on an upgrade.
      if (!raw.version4) {
        if (raw.method === '12-12') c.method = '15-13';
        c.calendarLead = 15;
        c.timeFormat = '12';
        if (raw.soundChoice === 'soft') c.soundChoice = 'adhan';
      }
      if (!raw.version5 && !('theme' in raw)) c.theme='dark';
      c.version5 = true; c.version4 = true;
      if (raw && !('timeZone' in raw)) { c.timeZone = deviceZone(); c.zoneVerified = false; if (raw.method === '15-15') c.method = '15-15'; }
      if (!['12-12', '15-13', '15-15', 'custom'].includes(c.method)) c.method = defaults.method;
      if (!['third', 'half'].includes(c.ishaEnd)) c.ishaEnd = defaults.ishaEnd;
      if (!['angles', 'tayba', 'moonsighting', 'france', 'mwl'].includes(c.activeSource)) c.activeSource = 'angles';
      if (!['adhan','soft','bell','custom','off'].includes(c.soundChoice)) c.soundChoice = 'adhan';
      c.calendarLead = 15;
      c.timeFormat = ['12','24'].includes(String(c.timeFormat)) ? String(c.timeFormat) : '12';
      c.theme = ['light','dark'].includes(c.theme) ? c.theme : 'dark';
      c.layout = ['classic','compact','timeline'].includes(c.layout) ? c.layout : 'classic';
      c.accent = ['forest','ocean','sand'].includes(c.accent) ? c.accent : 'forest';
      c.onlineCompare = c.onlineCompare !== false;
      if (!['seventh', 'angle', 'middle'].includes(c.highLatRule)) c.highLatRule = defaults.highLatRule;
      if (!validZone(c.timeZone)) c.timeZone = deviceZone();
      if (!Number.isFinite(+c.lat) || Math.abs(+c.lat) >= 89 || !Number.isFinite(+c.lng) || Math.abs(+c.lng) > 180) return { ...defaults };
      if (![c.fajrAngle, c.ishaAngle].every(a => Number.isFinite(+a) && +a >= 6 && +a <= 22)) {
        c.fajrAngle = defaults.fajrAngle; c.ishaAngle = defaults.ishaAngle;
      }
      c.autoLocation = c.autoLocation === true;
      return c;
    } catch { return { ...defaults }; }
  }
  let cfg = loadConfig();
  const store = () => { try { localStorage.setItem('salah-config', JSON.stringify(cfg)); } catch {} };
  const anglePair = () => cfg.method === '12-12' ? [12, 12] :
    cfg.method === '15-13' ? [15, 13] : cfg.method === '15-15' ? [15, 15] : [+cfg.fajrAngle, +cfg.ishaAngle];
  const todayKey = () => dateParts(new Date(), cfg.timeZone);
  const fmt = date => date instanceof Date && !isNaN(date) ? new Intl.DateTimeFormat('en-GB', {
    timeZone: cfg.timeZone, hour: cfg.timeFormat === '12' ? 'numeric' : '2-digit',
    minute: '2-digit', hour12: cfg.timeFormat === '12'
  }).format(date).replace('AM','am').replace('PM','pm') : '--:--';
  const fmtNight = date => `${fmt(date)}${dateParts(date, cfg.timeZone) !== selectedKey ? ' (+1 day)' : ''}`;
  const prettyKey = key => dateAtNoonUTC(key).toLocaleDateString('en-GB', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const relativeKey = key => key === todayKey() ? 'Today' : key === dayShift(todayKey(), 1) ? 'Tomorrow' :
    dateAtNoonUTC(key).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  const isBetween = (t, a, b) => a && b && t >= a.getTime() && t < b.getTime();
  const endChoice = t => cfg.ishaEnd === 'third' ? t.firstThird : t.midnight;
  let selectedKey = todayKey();
  let browsing = false, dayInfo = null, gpsLoading = false;
  let geoWatch = null, geoLastLookup = null, pendingPlace = null, citySearchResults = [];

  function note(message) {
    $('notice').textContent = message;
    $('notice').classList.toggle('hidden', !message);
  }

  const methods = [
    { id: 'angles', title: 'Your angles', sub: 'Offline · your selected pair', online: false },
    { id: 'tayba', title: 'Tayba guidance', sub: 'Local model · red-twilight option', online: false },
    { id: 'moonsighting', title: 'Moonsighting · Ahmer', sub: 'AlAdhan API · red twilight', online: true },
    { id: 'france', title: 'French UOIF', sub: 'AlAdhan API · 12° / 12°', online: true },
    { id: 'mwl', title: 'Muslim World League', sub: 'AlAdhan API · 18° / 17°', online: true }
  ];
  const onlineKinds = ['moonsighting','france','mwl'];
  const pendingOnline = new Set(), failedOnline = new Map(), onlineMem = new Map();
  const cacheId = (kind, key) => ['salah-v3-provider', kind, key, Number(cfg.lat).toFixed(4), Number(cfg.lng).toFixed(4), cfg.timeZone].join(':');
  function readCached(kind, key) {
    const id = cacheId(kind, key);
    if (onlineMem.has(id)) return onlineMem.get(id);
    let saved;
    try { saved = JSON.parse(localStorage.getItem(id)); } catch { return null; }
    if (!saved || !saved.raw || !Number.isFinite(saved.at)) return null;
    if (Date.now() - saved.at > 7 * 86400000) return null;
    try {
      const day = SalahProviders.decode(kind, key, cfg.timeZone, saved.raw);
      onlineMem.set(id, day); return day;
    } catch { return null; }
  }
  async function fetchOnline(kind, key, force = false) {
    const id = cacheId(kind, key);
    if (pendingOnline.has(id)) return;
    if (!force && (readCached(kind, key) || failedOnline.has(id))) return;
    pendingOnline.add(id); failedOnline.delete(id);
    if (key === selectedKey) renderComparison();
    try {
      const url = SalahProviders.buildUrl(kind, key, +cfg.lat, +cfg.lng, cfg.timeZone);
      const raw = await fetchJson(url);
      const day = SalahProviders.decode(kind, key, cfg.timeZone, raw);
      onlineMem.set(id, day);
      try { localStorage.setItem(id, JSON.stringify({ at: Date.now(), raw })); } catch {}
    } catch (e) { failedOnline.set(id, String(e.message || e)); }
    finally {
      pendingOnline.delete(id);
      if (key === selectedKey || key === SalahProviders.keyShift(selectedKey,1)) render();
    }
  }
  function loadComparison(force = false) {
    if ((!navigator.onLine || !cfg.onlineCompare) && !force) return;
    for (const kind of onlineKinds) void fetchOnline(kind, selectedKey, force);
    // Same method is needed for next day's Fajr to calculate the Islamic night.
    if (onlineKinds.includes(cfg.activeSource)) void fetchOnline(cfg.activeSource, SalahProviders.keyShift(selectedKey,1), force);
  }
  const altAngles = () => cfg.method === '12-12' ? [15,13] : [12,12];
  function localDayForPair(key, pair) {
    return SalahSolar.calculateFullDay(dateAtNoonUTC(key), +cfg.lat, +cfg.lng, pair[0], pair[1], cfg.highLatRule);
  }
  function remoteFullDay(kind, key) {
    const today = readCached(kind, key), next = readCached(kind, SalahProviders.keyShift(key,1));
    if (!today || !next) return null;
    const night = next.fajr.getTime() - today.maghrib.getTime();
    if (night <= 0 || night >= 86400000) return null;
    const base = getLocalDay(key);
    return {
      ...today, nextFajr: next.fajr, firstThird: new Date(today.maghrib.getTime() + night/3),
      midnight: new Date(today.maghrib.getTime() + night/2),
      solarNoon: base.solarNoon, trueSunset: base.trueSunset,
      fajrFallback: false, ishaFallback: false, online: true,
      ishaBeyondFirstThird: today.isha >= new Date(today.maghrib.getTime() + night/3),
      ishaBeyondHalf: today.isha >= new Date(today.maghrib.getTime() + night/2)
    };
  }
  function getLocalDay(key) { return localDayForPair(key, anglePair()); }
  function getActiveDay(key) {
    if (cfg.activeSource === 'angles') return getLocalDay(key);
    if (cfg.activeSource === 'tayba') return SalahProviders.taybaDay(key, +cfg.lat, +cfg.lng);
    const remote = remoteFullDay(cfg.activeSource, key);
    return remote || { ...getLocalDay(key), sourceFallback: true };
  }
  function renderComparison() {
    const base = getLocalDay(selectedKey), alt = localDayForPair(selectedKey, altAngles());
    const tayba = SalahProviders.taybaDay(selectedKey, +cfg.lat, +cfg.lng);
    const cols = [
      { id:'angles', title:`Your ${anglePair().join('° / ')}°`, desc:'Your solar model', day:base },
      { id:'alternate', title:`Other ${altAngles().join('° / ')}°`, desc:'Alternative angles', day:alt },
      { id:'tayba', title:'Tayba', desc:'Derived · option 2', day:tayba },
      ...onlineKinds.map(id=>({id, title: id === 'moonsighting' ? 'Moonsighting · red' : id === 'france' ? 'French UOIF · API' : 'MWL · API',
        desc:'AlAdhan API', day:readCached(id,selectedKey)}))
    ];
    $('sourcePicker').innerHTML = methods.map(m=>`<button type="button" data-source="${m.id}" class="source-choice ${cfg.activeSource === m.id ? 'chosen':''}" aria-pressed="${cfg.activeSource === m.id}"><span class="source-radio">${cfg.activeSource === m.id?'✓':''}</span><span class="source-detail"><strong>${m.title}</strong><small>${m.sub}</small></span></button>`).join('');
    $('comparisonHead').innerHTML = '<tr><th scope="col">Prayer</th>' + cols.map(c=>`<th scope="col" class="${c.id === cfg.activeSource?'selected-col':''}">${c.title}<small>${c.desc}</small></th>`).join('') + '</tr>';
    const shown = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
    const names = {fajr:'Fajr',sunrise:'Sunrise',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'};
    const active = getActiveDay(selectedKey); // Same reference as the main timetable, including explicit online fallback.
    $('comparisonBody').innerHTML = shown.map(k=>`<tr><td>${names[k]}</td>` + cols.map(c=>{
      const a = c.day?.valid ? c.day[k] : null;
      const reference = active?.valid ? active[k] : null;
      const diff = a && reference ? Math.round((a - reference)/60000) : null;
      const diffText = diff === null ? '' : diff === 0 ? 'same time' : `${diff > 0?'+':''}${diff} min`;
      const hint = (k === 'fajr' && c.day?.fajrFallback) || (k === 'isha' && c.day?.ishaFallback) ? ' · est.' : '';
      const status = c.id !== 'alternate' && onlineKinds.includes(c.id) && !a
        ? pendingOnline.has(cacheId(c.id,selectedKey))?'Loading': failedOnline.has(cacheId(c.id,selectedKey))?'Offline':'Load online' : '—';
      return `<td class="${c.id === cfg.activeSource?'selected-col':''}">${a ? `<span class="time-small">${fmt(a)}</span><span class="difference ${diff>0?'late':diff<0?'early':''}">${diffText}${hint}</span>` : `<span class="unknown" title="No time available">${status}</span>`}</td>`;
    }).join('') + '</tr>').join('');
    const unavailable = onlineKinds.filter(k=>failedOnline.has(cacheId(k,selectedKey)));
    const loading = onlineKinds.filter(k=>pendingOnline.has(cacheId(k,selectedKey)));
    $('comparisonStatus').textContent = !cfg.onlineCompare ? 'Online requests paused. Only previously cached provider data will be shown until you refresh manually.' : loading.length ? `Loading ${loading.length} online comparison${loading.length>1?'s':''} for this date and place…` :
      unavailable.length ? `${unavailable.join(', ')} unavailable: check your connection or refresh. Local calculations still work.` :
      'Fajr and Isha methods are estimates, not verified local observations. All Asr times use one shadow, not the Hanafi method.';
  }
  function renderDate() {
    $('dateLabel').textContent = relativeKey(selectedKey);
    $('dateSubLabel').textContent = prettyKey(selectedKey).replace(/^[A-Za-z]+,?\s+/, '');
    $('nativeDate').value = selectedKey;
    $('locationLabel').textContent = cfg.location;
    $('timezoneLabel').textContent = cfg.timeZone.replace('_', ' ');
    $('locationMode').textContent = cfg.autoLocation ? 'Location tracking on · while app is open' : 'Fixed location';
    try {
      $('hijriDate').textContent = new Intl.DateTimeFormat('en-GB-u-ca-islamic', {
        timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric'
      }).format(dateAtNoonUTC(selectedKey)) + ' AH · estimate';
    } catch { $('hijriDate').textContent = 'Prayer times'; }
  }
  function getDay(key) { return getActiveDay(key); }
  function renderNotice(t) {
    const msgs = [];
    if (t.sourceFallback) msgs.push('Selected online method is not available for both this date and the following Fajr. Showing your local angle calculations temporarily — not the chosen online method.');
    if (t.online) msgs.push('Online provider times are calculated predictions, not direct observations. Red twilight was requested for the Moonsighting setting.');
    if (cfg.activeSource === 'tayba' && t.valid) msgs.push('Tayba values are derived here from its published guidance, not supplied by Tayba Trust.');
    if (!cfg.zoneVerified) msgs.push(`Time zone not independently confirmed for this place; showing ${cfg.timeZone}. Check the setting before relying on the times.`);
    if (t.fajrFallback || t.ishaFallback) {
      const [fa, ia] = anglePair();
      const affected = cfg.activeSource === 'tayba' ? 'Tayba seasonal/option-2' : [t.fajrFallback ? `Fajr ${fa}°` : '', t.ishaFallback ? `Isha ${ia}°` : ''].filter(Boolean).join(' and ');
      const rule = cfg.highLatRule === 'seventh' ? 'one seventh' : cfg.highLatRule === 'angle' ? 'angle portion' : 'half of the night';
      msgs.push(cfg.activeSource === 'tayba' ? `${affected}: these values use seasonal or red-twilight approximations, not direct observation.` : `${affected}: the Sun does not reach this angle. An estimated ${rule} sunset-to-sunrise rule is used. These are not observed dawn or red-twilight times.`);
    }
    if (t.ishaBeyondHalf) msgs.push('Isha starts at or after the halfway marker according to this calculation. No ordinary Isha window can be inferred; seek local guidance.');
    else if (cfg.ishaEnd === 'third' && t.ishaBeyondFirstThird) msgs.push('The first-third marker falls before Isha begins. It cannot be treated as a usable cutoff on this day.');
    note(msgs.join(' '));
  }
  const svgIcon = (kind) => {
    const paths = {
      'sun-horizon':'<path d="M3 18h18M6 21h12M12 4v3M5 10l2 2M19 10l-2 2M7 18a5 5 0 0 1 10 0"/>',
      sunrise:'<path d="M3 18h18M5 21h14M12 4v7M9 8l3-3 3 3M7 18a5 5 0 0 1 10 0"/>',
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2M20 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',
      'sun-low':'<path d="M3 19h18M6 22h12M12 3v3M5 10l2 2M19 10l-2 2M6 19a6 6 0 0 1 12 0"/>',
      sunset:'<path d="M3 18h18M5 21h14M12 4v7M9 8l3 3 3-3M7 18a5 5 0 0 1 10 0"/>',
      moon:'<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>',
      alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
      third:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l7.8 4.5"/>',
      half:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/>'
    };
    return `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]||paths.clock}</svg>`;
  };
  function restrictionStatus(t, instant=Date.now()) {
    if (!t?.valid) return {level:'neutral',label:'Prayer times'};
    const sunriseEnd = SalahSolar.plusMinutes(t.sunrise,15),
      beforeDhuhr = SalahSolar.plusMinutes(t.solarNoon,-8),
      beforeSunset = SalahSolar.plusMinutes(t.maghrib,-15);
    if (isBetween(instant,t.sunrise,sunriseEnd)) return {level:'danger', label:'Avoid voluntary prayer',desc:'Sunrise precaution · approximately 15 minutes'};
    if (isBetween(instant,beforeDhuhr,t.dhuhr)) return {level:'danger',label:'Avoid voluntary prayer',desc:'Near solar zenith · approximate buffer'};
    if (isBetween(instant,beforeSunset,t.maghrib)) return {level:'danger',label:'Avoid voluntary prayer',desc:'Sunset precaution · approximate buffer'};
    if (isBetween(instant,t.fajr,t.sunrise)) return {level:'caution',label:'Restricted voluntary prayers',desc:'After true dawn · exceptions include Fajr Sunnah'};
    if (isBetween(instant,t.asr,t.maghrib)) return {level:'caution',label:'After Asr',desc:'Restriction applies once you have prayed Asr'};
    if (isBetween(instant,t.isha,t.firstThird) && !t.ishaBeyondFirstThird) return {level:'preferred',label:'Preferred Isha period',desc:`First third ends ${fmt(t.firstThird)}`};
    if (isBetween(instant,t.firstThird,t.midnight) && instant >= t.isha.getTime()) return {level:'caution',label:'After the first third',desc:`Half the Islamic night is ${fmt(t.midnight)}`};
    if (instant >= t.midnight.getTime() && instant < t.nextFajr.getTime() && instant >= t.isha.getTime()) return {level:'caution',label:'After Islamic midnight',desc:'The normal Isha endpoint has passed'};
    return {level:'calm',label:'Prayer day',desc:'Follow the timetable below'};
  }
  function renderPrayerList(t) {
    const now = Date.now(), current=selectedKey===todayKey();
    const intervals = [
      {at:t.fajr,end:t.sunrise,title:'After true dawn',desc:'Voluntary prayers restricted · Fajr Sunnah excepted',kind:'caution'},
      {at:t.sunrise,end:SalahSolar.plusMinutes(t.sunrise,15),title:'Sunrise precaution',desc:'Approx. 15 minutes · voluntary prayer',kind:'avoid'},
      {at:SalahSolar.plusMinutes(t.solarNoon,-8),end:t.dhuhr,title:'Solar zenith',desc:'Approx. 8-minute precaution before Dhuhr',kind:'avoid'},
      {at:t.asr,end:t.maghrib,title:'After praying Asr',desc:'Conditional · applies after you perform Asr',kind:'caution'},
      {at:SalahSolar.plusMinutes(t.maghrib,-15),end:t.maghrib,title:'Near sunset',desc:'Approx. 15-minute precaution',kind:'avoid'}
    ];
    const events = names.map(n=>({at:t[n.key],title:n.en,desc:n.desc,kind:'prayer',name:n,estimated:(n.key==='fajr'&&t.fajrFallback)||(n.key==='isha'&&t.ishaFallback)}));
    const milestones=[
      {at:t.firstThird,title:'First third of night',desc:'Isha preferred endpoint in a Hanbali opinion',kind:'night',icon:'third'},
      {at:t.midnight,title:'Half of night',desc:'Later normal Isha endpoint in another opinion',kind:'night',icon:'half'}
    ];
    const sorted=[...events,...intervals.map(e=>({...e,icon:'alert'})),...milestones].filter(e=>e.at instanceof Date && !isNaN(e.at)).sort((a,b)=>a.at-b.at || (a.kind==='prayer'?-1:1));
    $('prayerList').innerHTML=sorted.map(e=>{
      const active=current && e.kind==='prayer' && e.name.key!=='sunrise' &&
        now >= e.at.getTime() && now < (e.name.key==='fajr'?t.sunrise:
        e.name.key==='dhuhr'?t.asr:e.name.key==='asr'?t.maghrib:
        e.name.key==='maghrib'?t.isha:t.firstThird).getTime();
      const extra=(e.kind==='avoid'||e.kind==='caution')?`<span class="range-label">until ${fmt(e.end)}</span>`:'';
      const following=dateParts(e.at,cfg.timeZone)!==selectedKey?'<span class="next-day">+1 day</span>':'';
      return `<div class="time-row ${e.kind==='prayer'?'prayer-entry':''} ${e.kind==='night'?'night-summary':''} ${e.kind==='avoid'?'avoid-entry':''} ${e.kind==='caution'?'caution-entry':''} ${active?'active':''}">
        <span class="time-icon">${svgIcon(e.kind==='prayer'?e.name.icon:e.icon)}</span>
        <div class="time-text"><div class="time-name">${e.title}${e.estimated?'<span class="estimate-dot">EST.</span>':''}</div><div class="time-desc">${e.desc}</div></div>
        <div class="time-data"><time class="time-value" datetime="${e.at.toISOString()}">${fmt(e.at)}</time>${extra}${following}</div>
      </div>`;
    }).join('');
  }
  function setHero(event, now, nextDay = false, otherDate = false) {
    // Date is shown beside the date picker.
    $('nextPrayerName').textContent = event.en;
    $('nextPrayerArabic').textContent = event.ar;
    $('nextPrayerTime').textContent = fmt(event.at);
    if (otherDate) { $('countdown').textContent = 'First prayer on the selected date'; return; }
    const seconds = Math.max(0, Math.floor((event.at - now) / 1000));
    const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60);
    $('countdown').textContent = `In ${h}h ${String(m).padStart(2, '0')}m${nextDay ? ' · Tomorrow' : ''}`;
  }
  function renderHero(t) {
    const [a, b] = anglePair();
    $('heroMethod').textContent = cfg.activeSource === 'angles' || t.sourceFallback ? `${a}° / ${b}°${t.sourceFallback?' · fallback':''}` : methods.find(m=>m.id===cfg.activeSource)?.title || 'Prayer times';

    // The live status below the countdown updates automatically.
    const now = new Date();
    const events = prayers.map(p => ({ ...p, at: t[p.key] }));
    if (selectedKey === todayKey()) {
      const upcoming = events.find(e => e.at > now);
      if (upcoming) setHero(upcoming, now);
      else {
        const next = onlineKinds.includes(cfg.activeSource) ? readCached(cfg.activeSource, dayShift(selectedKey,1)) : getDay(dayShift(selectedKey, 1));
        if (next?.valid) setHero({ ...prayers[0], at: next.fajr }, now, true);
        else { $('nextPrayerName').textContent = 'Unavailable'; $('countdown').textContent = 'Please check your settings'; }
      }
    } else setHero(events[0], now, false, true);
    updateHeroStatus(t);
  }
  function updateHeroStatus(t) {
    const live = selectedKey === todayKey();
    const state = live ? restrictionStatus(t,Date.now()) : {level:'calm',label:'Selected date',desc:relativeKey(selectedKey)};
    const msg = $('heroLiveMessage');
    msg.textContent=state.label;
    msg.dataset.level=state.level;
    $('heroLiveTime').textContent=state.desc||'';
  }
  function render() {
    renderDate();
    dayInfo = getDay(selectedKey);
    renderComparison();
    $('timesTag').textContent = cfg.timeZone.replace('_', ' ');
    if (!dayInfo.valid) {
      note(dayInfo.reason); $('prayerList').innerHTML = '<p class="loading">Times unavailable for this date and location.</p>';
      $('heroLiveMessage').textContent='Timing unavailable'; $('heroLiveTime').textContent='Check date and location'; loadComparison(); return;
    }
    renderNotice(dayInfo); renderPrayerList(dayInfo); renderHero(dayInfo); renderQibla();
    loadComparison();
  }

  function status(message) { $('gpsStatus').textContent = message; $('liveLocationStatus').textContent = message; }
  function showSettings() {
    $('latInput').value = cfg.lat; $('lngInput').value = cfg.lng;
    $('placeInput').value = cfg.location; $('tzInput').value = cfg.timeZone;
    $('trackLocation').checked = cfg.autoLocation;
    $('fajrAngleInput').value = cfg.fajrAngle; $('ishaAngleInput').value = cfg.ishaAngle;
    $('highLatSelect').value = cfg.highLatRule;
    $('onlineCompare').checked = cfg.onlineCompare;
    const method = document.querySelector(`input[name="method"][value="${cfg.method}"]`);
    if (method) method.checked = true;
    const end = document.querySelector(`input[name="ishaEnd"][value="${cfg.ishaEnd}"]`);
    if (end) end.checked = true;
    pendingPlace = null; $('gpsStatus').textContent = '';
    $('cityResults').replaceChildren(); updateCustomVisibility();
    $('settingsDialog').showModal();
  }
  function updateCustomVisibility() {
    const method = document.querySelector('input[name="method"]:checked')?.value;
    $('customAngles').classList.toggle('hidden', method !== 'custom');
  }
  function save() {
    if (gpsLoading) { status('Location request is still running.'); return; }
    if (!$('latInput').value.trim() || !$('lngInput').value.trim()) { status('Enter latitude and longitude.'); return; }
    const lat = +$('latInput').value, lng = +$('lngInput').value;
    const fa = +$('fajrAngleInput').value, ia = +$('ishaAngleInput').value;
    const zone = $('tzInput').value.trim();
    if (!Number.isFinite(lat) || Math.abs(lat) >= 89 || !Number.isFinite(lng) || Math.abs(lng) > 180 ||
        ![fa, ia].every(a => Number.isFinite(a) && a >= 6 && a <= 22) || !validZone(zone)) {
      status('Check coordinates, angles (6–22°) and IANA time zone (e.g. Europe/London).'); return;
    }
    const method = document.querySelector('input[name="method"]:checked')?.value || '15-13';
    const ishaEnd = document.querySelector('input[name="ishaEnd"]:checked')?.value || 'third';
    const newCfg = {
      activeSource: cfg.activeSource, soundChoice: cfg.soundChoice, calendarLead: cfg.calendarLead, onlineCompare: $('onlineCompare').checked,
      theme: cfg.theme, layout: cfg.layout, accent: cfg.accent, timeFormat: cfg.timeFormat, version4: true,
      lat, lng, location: $('placeInput').value.trim() || `Lat ${lat.toFixed(3)}°, Lon ${lng.toFixed(3)}°`,
      timeZone: zone, zoneVerified: pendingPlace ? pendingPlace.zoneVerified :
        kmApart({lat:+cfg.lat,lng:+cfg.lng},{lat,lng}) < 1 && cfg.timeZone === zone && cfg.zoneVerified,
      method, ishaEnd, fajrAngle: fa, ishaAngle: ia,
      autoLocation: $('trackLocation').checked, highLatRule: $('highLatSelect').value
    };
    const wasFollowing = cfg.autoLocation;
    if (kmApart({lat:+cfg.lat,lng:+cfg.lng},{lat,lng}) > 0.1) { variationPromise=null; magneticVariation=null; $('declinationOverride').value=''; }
    cfg = newCfg; store(); $('settingsDialog').close();
    if (!browsing) selectedKey = todayKey();
    render();
    if (cfg.autoLocation) { if (!wasFollowing) stopTracking(); startTracking(); }
    else stopTracking();
  }

  function kmApart(a, b) {
    if (!a) return Infinity;
    const R = Math.PI / 180, dLat = (b.lat - a.lat) * R, dLng = (b.lng - a.lng) * R;
    const q = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(q)));
  }
  async function fetchJson(url) {
    const aborter = new AbortController();
    const timer = setTimeout(() => aborter.abort(), 6000);
    try {
      const r = await fetch(url, { signal: aborter.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`Lookup returned HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  async function enrichLocation(lat, lng) {
    // Both lookups are optional. Calculations never require an online connection.
    const coords = `latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}`;
    const [nearby, zoneData] = await Promise.allSettled([
      fetchJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?${coords}&localityLanguage=en`),
      fetchJson(`https://api.open-meteo.com/v1/forecast?${coords}&daily=sunrise,sunset&timezone=auto&forecast_days=1`)
    ]);
    let name = '', zone = '', confirmed = false;
    if (nearby.status === 'fulfilled') {
      const o = nearby.value;
      name = [o.city || o.locality, o.principalSubdivision && o.principalSubdivision !== (o.city || o.locality) ? o.principalSubdivision : '', o.countryName].filter(Boolean).join(', ');
    }
    if (zoneData.status === 'fulfilled' && validZone(zoneData.value.timezone)) {
      zone = zoneData.value.timezone; confirmed = true;
    }
    return { name, zone, confirmed };
  }
  function geoError(error) {
    status(error.code === 1 ? 'Location permission was denied. You can still choose a city manually.' :
      `Location unavailable: ${error.message}. The previous position remains saved.`);
  }
  async function applyGPS(pos, live) {
    const lat = +pos.coords.latitude.toFixed(5), lng = +pos.coords.longitude.toFixed(5);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!live) {
      $('latInput').value = lat; $('lngInput').value = lng;
      $('placeInput').value = `Lat ${lat.toFixed(3)}°, Lon ${lng.toFixed(3)}°`;
      $('tzInput').value = deviceZone();
      status('GPS acquired. Looking up city and time zone…');
      const r = await enrichLocation(lat, lng);
      $('placeInput').value = r.name || $('placeInput').value;
      $('tzInput').value = r.zone || deviceZone();
      pendingPlace = { zoneVerified: r.confirmed };
      status(r.confirmed ? 'Location and time zone found. Save to apply.' : 'Could not verify the local time zone online. Check the time zone before saving.');
      return;
    }
    if (!cfg.autoLocation) return;
    const moved = kmApart({ lat: +cfg.lat, lng: +cfg.lng }, { lat, lng });
    if (moved < 1) return;
    cfg.lat = lat; cfg.lng = lng;
    variationPromise=null;magneticVariation=null; $('declinationOverride').value='';
    if (moved >= 5) cfg.location = `Near ${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
    // A phone with automatic time zone enabled normally follows travel; network checks override it.
    cfg.timeZone = deviceZone(); cfg.zoneVerified = false;
    if (!browsing) selectedKey = todayKey();
    store(); render();
    const time = Date.now();
    if (moved >= 5 || !geoLastLookup || time - geoLastLookup.time > 7200000) {
      geoLastLookup = { lat, lng, time };
      status('Updating city and local time zone…');
      const r = await enrichLocation(lat, lng);
      if (!cfg.autoLocation || kmApart({ lat: cfg.lat, lng: cfg.lng }, { lat, lng }) > 1) return;
      if (r.name) cfg.location = r.name;
      if (r.zone) cfg.timeZone = r.zone;
      cfg.zoneVerified = r.confirmed;
      if (!browsing) selectedKey = todayKey();
      store(); render();
      status(r.confirmed ? `Following your current area: ${cfg.location}` : 'Using device time zone; online zone lookup unavailable. Check the time zone.');
    }
  }
  function stopTracking() {
    if (geoWatch !== null && navigator.geolocation) navigator.geolocation.clearWatch(geoWatch);
    geoWatch = null;
  }
  function startTracking() {
    if (!cfg.autoLocation || document.hidden || !navigator.geolocation || geoWatch !== null) return;
    try {
      geoWatch = navigator.geolocation.watchPosition(pos => { void applyGPS(pos, true); }, geoError, {
        enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60000
      });
    } catch (e) { status(`GPS unavailable: ${e.message}`); }
  }
  async function citySearch() {
    const query = $('cityQuery').value.trim();
    if (query.length < 2) { status('Type at least two letters of a city.'); return; }
    const root = $('cityResults'); root.replaceChildren();
    status('Searching for cities…');
    try {
      const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`);
      citySearchResults = (data.results || []).filter(item => validZone(item.timezone));
      if (!citySearchResults.length) { status('No matches. Try another name or use coordinates.'); return; }
      citySearchResults.forEach((item, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'city-result';
        const title = [item.name, item.admin1, item.country].filter(Boolean).join(', ');
        b.textContent = `${title} · ${item.timezone}`;
        b.addEventListener('click', () => {
          $('latInput').value = item.latitude; $('lngInput').value = item.longitude;
          $('placeInput').value = title; $('tzInput').value = item.timezone;
          $('trackLocation').checked = false; pendingPlace = { zoneVerified: true };
          root.replaceChildren(); status(`${title} selected. Save to apply.`);
        });
        root.append(b);
      });
      status('Choose the correct city from the results.');
    } catch { status('City search needs an internet connection. GPS and coordinates still work offline.'); }
  }

  function applyAppearance() {
    document.body.dataset.theme = cfg.theme;
    document.body.dataset.layout = cfg.layout;
    document.body.dataset.accent = cfg.accent;
    $('themeToggle').setAttribute('aria-label', cfg.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    $('themeText').textContent = cfg.theme === 'dark' ? 'Light mode' : 'Dark mode';
    $('themeIcon').textContent = cfg.theme === 'dark' ? '☼' : '☾';
    $('accentPicker').value = cfg.accent;
    document.querySelectorAll('#viewPicker [data-view]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.view === cfg.layout));
      b.classList.toggle('selected', b.dataset.view === cfg.layout);
    });
    $('settingsTheme').value=cfg.theme; $('settingsLayout').value=cfg.layout;
    $('settingsAccent').value=cfg.accent; $('settingsTimeFormat').value=cfg.timeFormat;
    document.querySelector('meta[name="theme-color"]').content = cfg.theme === 'dark' ? '#25363c' : '#f6f7f4';
  }
  function changeAppearance(kind, value) {
    cfg[kind] = value; store(); applyAppearance();
    if (kind === 'timeFormat') render();
  }
  $('themeToggle').addEventListener('click', () => changeAppearance('theme',cfg.theme === 'dark' ? 'light':'dark'));
  $('accentPicker').addEventListener('change', () => changeAppearance('accent',$('accentPicker').value));
  $('viewPicker').addEventListener('click', e => {
    const b=e.target.closest('[data-view]'); if(b) changeAppearance('layout',b.dataset.view);
  });
  [['settingsTheme','theme'],['settingsLayout','layout'],['settingsAccent','accent'],['settingsTimeFormat','timeFormat']].forEach(([id,key]) =>
    $(id).addEventListener('change', () => changeAppearance(key,$(id).value)));
  applyAppearance();

  $('openSettings').addEventListener('click', showSettings);
  $('closeSettings').addEventListener('click', () => $('settingsDialog').close());
  $('saveSettings').addEventListener('click', save);
  $('settingsDialog').querySelector('form').addEventListener('submit', e => { e.preventDefault(); save(); });
  document.querySelectorAll('input[name="method"]').forEach(r => r.addEventListener('change', updateCustomVisibility));
  $('setDerry').addEventListener('click', () => {
    $('latInput').value = defaults.lat; $('lngInput').value = defaults.lng;
    $('placeInput').value = defaults.location; $('tzInput').value = defaults.timeZone;
    $('trackLocation').checked = false; pendingPlace = { zoneVerified: true };
    status('Derry selected. Save to apply.');
  });
  $('setGPS').addEventListener('click', () => {
    if (!navigator.geolocation) { status('Geolocation is not available.'); return; }
    gpsLoading = true; status('Requesting location permission…');
    navigator.geolocation.getCurrentPosition(async pos => {
      try { await applyGPS(pos, false); } finally { gpsLoading = false; }
    }, e => { gpsLoading = false; geoError(e); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  });
  $('citySearch').addEventListener('click', () => { void citySearch(); });
  $('cityQuery').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); void citySearch(); } });
  $('previousDay').addEventListener('click', () => { selectedKey = dayShift(selectedKey, -1); browsing = selectedKey !== todayKey(); render(); });
  $('nextDay').addEventListener('click', () => { selectedKey = dayShift(selectedKey, 1); browsing = selectedKey !== todayKey(); render(); });
  $('dateButton').addEventListener('click', () => {
    const input = $('nativeDate');
    if (typeof input.showPicker === 'function') input.showPicker(); else input.click();
  });
  $('nativeDate').addEventListener('change', () => {
    const v = $('nativeDate').value;
    if (/^\d{4}-\d\d-\d\d$/.test(v)) { selectedKey = v; browsing = selectedKey !== todayKey(); render(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTracking();
    else {
      if (!browsing) selectedKey = todayKey();
      render(); startTracking();
    }
  });
  let lastToday = todayKey(), lastPhoneZone = deviceZone();
  setInterval(() => {
    const phoneZone = deviceZone();
    if (cfg.autoLocation && phoneZone !== lastPhoneZone) {
      cfg.timeZone = phoneZone; cfg.zoneVerified = false; store();
      if (!browsing) selectedKey = todayKey();
      render();
    }
    lastPhoneZone = phoneZone;
    const localDay = todayKey();
    if (!browsing && localDay !== lastToday) { selectedKey = localDay; render(); }
    lastToday = localDay;
    if (dayInfo && dayInfo.valid && selectedKey === localDay) {
      renderHero(dayInfo); checkPrayerSounds();
    }
  }, 30000);

  // Change the source used by the hero, timetable, Islamic-night markers and calendar.
  $('sourcePicker').addEventListener('click', e => {
    const btn = e.target.closest('button[data-source]');
    if (!btn) return;
    cfg.activeSource = btn.dataset.source;
    store(); render();
  });
  $('refreshSources').addEventListener('click', () => {
    for (const kind of onlineKinds) {
      for (const key of [selectedKey,SalahProviders.keyShift(selectedKey,1)]) {
        failedOnline.delete(cacheId(kind,key)); onlineMem.delete(cacheId(kind,key));
        try { localStorage.removeItem(cacheId(kind,key)); } catch {}
      }
    }
    loadComparison(true); renderComparison();
  });

  // Original, locally synthesised chimes. No copyrighted adhan recording.

  let soundArmed = false, audioCtx = null, soundSeen = new Set();
  let savedAudioObjectUrl = null;
  // IndexedDB is device-local; it does not send the sound to GitHub or providers.
  function audioDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(Error('Local media storage unsupported')); return; }
      const request = indexedDB.open('salah-local-media-v3',1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('audio')) request.result.createObjectStore('audio'); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('Storage error'));
    });
  }
  async function audioData(action, blob) {
    const db = await audioDb();
    try {
      return await new Promise((resolve,reject) => {
        const tx = db.transaction('audio', action==='read' ? 'readonly' : 'readwrite');
        const req = action==='read' ? tx.objectStore('audio').get('custom') :
          action==='write' ? tx.objectStore('audio').put(blob,'custom') : tx.objectStore('audio').delete('custom');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  async function updateAudioStatus() {
    try {
      const blob = await audioData('read');
      $('savedAudioStatus').textContent = blob ? `Audio saved locally · ${(blob.size/1048576).toFixed(1)} MB` : 'No custom sound saved on this device.';
    } catch { $('savedAudioStatus').textContent = 'Custom audio cannot be stored in this browser.'; }
  }
  $('customAudio').addEventListener('change', async () => {
    const file = $('customAudio').files?.[0];
    if (!file) return;
    if (!(file.type.startsWith('audio/') || /\.(mp3|m4a|wav|aac)$/i.test(file.name)) || file.size > 8*1048576 || file.size === 0) {
      $('soundStatus').textContent = 'Choose an audio file under 8 MB.'; return;
    }
    try {
      await audioData('write',file);
      cfg.soundChoice='custom'; $('soundChoice').value='custom';store();
      await updateAudioStatus(); $('soundStatus').textContent='Custom sound saved locally. Test it before arming; iPhone may restrict automatic audio.';
    } catch(e) { $('soundStatus').textContent=`Could not save sound: ${e.message}.` }
  });
  $('clearAudio').addEventListener('click',async()=>{
    try { await audioData('delete'); if(savedAudioObjectUrl) URL.revokeObjectURL(savedAudioObjectUrl);
      savedAudioObjectUrl=null;await updateAudioStatus();$('soundStatus').textContent='Saved custom sound removed from this device.';
    } catch { $('soundStatus').textContent='Unable to remove the sound from browser storage.' }
  });
  void updateAudioStatus();

  function audioTone(ctx, freq, at, duration, volume) {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(volume,at+.03);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(at); osc.stop(at+duration+.03);
  }
  // CC0 Adhan by Adam-synagda via Wikimedia Commons, online-only.
  const ADHAN_URL = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b0/Beautiful_adhan.ogg/Beautiful_adhan.ogg.mp3';
  let adhanPlayer = null, activeCustomPlayer=null;
  async function playAdhan() {
    try {
      if (!adhanPlayer) { adhanPlayer=new Audio(ADHAN_URL); adhanPlayer.preload='auto'; adhanPlayer.volume=.8; }
      adhanPlayer.pause(); adhanPlayer.currentTime=0;
      await adhanPlayer.play();
      $('soundStatus').textContent='Adhan playing from Wikimedia Commons (internet required).';
    } catch {
      $('soundStatus').textContent='The online adhan could not play. Use a chime or test with internet access.';
      playReminderChime();
    }
  }
  function playReminderChime() {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') void audioCtx.resume();
      const a=audioCtx.currentTime+.02;
      audioTone(audioCtx,550,a,.25,.06);audioTone(audioCtx,740,a+.28,.30,.06);
    } catch {}
  }
  async function playSound() {
    if (cfg.soundChoice === 'off') return;
    if (cfg.soundChoice === 'adhan') return playAdhan();
    try {
      if (cfg.soundChoice === 'custom') {
        const blob = await audioData('read');
        if (!blob) { $('soundStatus').textContent='Upload a custom sound first, or choose a built-in chime.'; return; }
        if (savedAudioObjectUrl) URL.revokeObjectURL(savedAudioObjectUrl);
        savedAudioObjectUrl = URL.createObjectURL(blob);
        if(activeCustomPlayer) activeCustomPlayer.pause();
        const audio = new Audio(savedAudioObjectUrl); audio.volume = .9; activeCustomPlayer=audio;
        try { await audio.play(); }
        catch { $('soundStatus').textContent='Safari blocked custom audio playback. Tap Hear sound; background sound is not supported.'; }
        return;
      }
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const t = audioCtx.currentTime + .04;
      if (cfg.soundChoice === 'bell') {
        audioTone(audioCtx, 880,t,.7,.095); audioTone(audioCtx,1320,t+.12,.65,.045);
      } else {
        audioTone(audioCtx, 660,t,.48,.08); audioTone(audioCtx, 830,t+.48,.62,.07);
      }
    } catch(e) { $('soundStatus').textContent = 'Audio blocked by this browser. Tap Hear sound again.'; }
  }
  $('soundChoice').value = cfg.soundChoice;
  $('calendarLead').value = String(cfg.calendarLead);
  $('calendarLead').value='15';
  $('soundChoice').addEventListener('change', () => {
    cfg.soundChoice = $('soundChoice').value; store();
    $('soundStatus').textContent = 'Sound saved. Test it using Play sound.';
  });
  $('testSound').addEventListener('click', () => { void playSound(); });
  $('stopSound').addEventListener('click', () => {
    if(adhanPlayer) { adhanPlayer.pause(); adhanPlayer.currentTime=0; }
    if(activeCustomPlayer) { activeCustomPlayer.pause(); activeCustomPlayer.currentTime=0; }
    $('soundStatus').textContent='Sound stopped.';
  });
  $('armSound').addEventListener('click', async () => {
    soundArmed = !soundArmed;
    if (soundArmed) {
      if (cfg.soundChoice !== 'off') playReminderChime();
      if (cfg.soundChoice === 'adhan' && !adhanPlayer) {
        adhanPlayer=new Audio(ADHAN_URL); adhanPlayer.volume=.8; adhanPlayer.preload='auto';
        try { adhanPlayer.load(); } catch {}
      }
      // Ignore all past reminders and prayer times when the user arms the page.
      const now=Date.now();
      soundSeen = new Set();
      for(const p of prayers) {
        const when=dayInfo?.[p.key]?.getTime();
        if (!when) continue;
        if (when - 15*60000 <= now) soundSeen.add(`${selectedKey}:pre:${p.key}`);
        if (when <= now) soundSeen.add(`${selectedKey}:at:${p.key}`);
      }
    }
    $('armSound').textContent = soundArmed ? 'Disarm sound' : 'Arm while open';
    $('soundStatus').textContent = soundArmed ? 'Armed for a 15-minute early chime and prayer-time sound while this page stays open.' : 'Not armed.';
  });
  function checkPrayerSounds() {
    if (!soundArmed || document.hidden || !dayInfo?.valid || cfg.soundChoice === 'off') return;
    for (const p of prayers) {
      const when = dayInfo[p.key]?.getTime(); if (!when) continue;
      const now=Date.now(), reminder=when-15*60000;
      const beforeId=`${selectedKey}:pre:${p.key}`, atId=`${selectedKey}:at:${p.key}`;
      if(now >= reminder && now < reminder+45000 && !soundSeen.has(beforeId)) {
        soundSeen.add(beforeId);playReminderChime();
        $('soundStatus').textContent=`${p.en} begins in 15 minutes. Foreground chime requested.`;
      }
      if(now >= when && now < when+45000 && !soundSeen.has(atId)) {
        soundSeen.add(atId);void playSound();
        $('soundStatus').textContent=`${p.en} prayer time reached. Sound requested.`;
      }
    }
  }

  function iCalStamp(d) { return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
  function escapeCal(s) { return s.replace(/[\\;,\n]/g, c => c==='\n'?'\\n':'\\'+c); }
  function makeCalendar() {
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Salah Comparison//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Salah prayer reminders'];
    const online = onlineKinds.includes(cfg.activeSource);
    const dayCount = online ? 1 : 60;
    const keyBase = selectedKey;
    let eventCount = 0;
    for (let i = 0; i < dayCount; i++) {
      const key = SalahProviders.keyShift(keyBase, i);
      const item = getDay(key);
      if (!item?.valid || item.sourceFallback) continue;
      for (const prayer of prayers) {
        const dt = item[prayer.key];
        if (!dt) continue;
        eventCount++;
        lines.push('BEGIN:VEVENT',`UID:salah-${cfg.activeSource}-${prayer.key}-${key}-${Number(cfg.lat).toFixed(3)}-${Number(cfg.lng).toFixed(3)}@salah.local`,
          `DTSTAMP:${iCalStamp(new Date())}`,`DTSTART:${iCalStamp(dt)}`,`DTEND:${iCalStamp(new Date(dt.getTime()+5*60000))}`,
          `SUMMARY:${escapeCal(prayer.en + ' prayer · Salah')}`,`DESCRIPTION:${escapeCal(cfg.location + ' · ' + cfg.activeSource + ' calculated time. Research estimates, not observed certainty.')}`,
          'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${escapeCal(prayer.en + ' prayer time')}`, 'TRIGGER:-PT15M','END:VALARM','END:VEVENT');
      }
    }
    lines.push('END:VCALENDAR');
    return { ics: lines.join('\r\n')+'\r\n', online, dayCount, eventCount };
  }
  $('exportCalendar').addEventListener('click', () => {
    const result = makeCalendar();
    if (!result.eventCount) { $('calendarStatus').textContent = 'No times available to export for the selected source and date. Try a local calculation or load the online source.'; return; }
    const a = document.createElement('a');
    const url = URL.createObjectURL(new Blob([result.ics],{type:'text/calendar;charset=utf-8'}));
    a.href = url; a.download = `salah-${selectedKey}-${cfg.activeSource}.ics`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    $('calendarStatus').textContent = result.online ?
      `${result.eventCount} event(s) exported for this one day. Online sources need another download for future dates. iPhone may not import bulk .ics directly.` :
      `${result.eventCount} event(s) exported for up to 60 days. This static file will not automatically follow GPS, time-zone or method changes.`;
  });

  // Great-circle bearing to the Kaaba. Live iPhone headings are magnetic, so a
  // WMM2025 correction or a user-entered magnetic declination is required.
  const KAABA={lat:21.422487,lng:39.826206};
  const norm360=x=>(x%360+360)%360;
  function qiblaBearing(lat,lng) {
    const rad=Math.PI/180, phi1=lat*rad, phi2=KAABA.lat*rad;
    const dl=(KAABA.lng-lng)*rad;
    const y=Math.sin(dl)*Math.cos(phi2);
    const x=Math.cos(phi1)*Math.sin(phi2)-Math.sin(phi1)*Math.cos(phi2)*Math.cos(dl);
    return norm360(Math.atan2(y,x)/rad);
  }
  const compassPoints=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  let qiblaHeading=null,magneticVariation=null,variationSource='',qiblaCompassOn=false,lastAlignment=false;
  const bearingNow=()=>qiblaBearing(+cfg.lat,+cfg.lng);
  function renderQibla(){
    const bearing=bearingNow(),good=Number.isFinite(bearing);
    $('qiblaBearing').textContent=good?`${bearing.toFixed(1)}°`:'—°';
    $('qiblaCardinal').textContent=good?compassPoints[Math.round(bearing/22.5)%16]:'—';
    $('qiblaPosition').textContent=`${cfg.location} · true north bearing`;
    const override=$('declinationOverride').value.trim();
    const delta=override!==''?Number(override):magneticVariation;
    const valid=Number.isFinite(qiblaHeading)&&Number.isFinite(delta) && Math.abs(delta)<=180 && qiblaCompassOn;
    const arrow=$('qiblaArrow');
    const difference=valid?((bearing-qiblaHeading-delta+540)%360-180):0;
    arrow.style.transform=`translate(-50%, -50%) rotate(${(valid?difference:bearing).toFixed(2)}deg)`;
    $('qiblaDial').classList.toggle('live',valid);
    const accurate=valid && Number.isFinite(compassSensorAccuracy)&&compassSensorAccuracy>=0&&compassSensorAccuracy<=20;
    const aligned=accurate && Math.abs(difference)<=4;
    $('qiblaDial').classList.toggle('aligned',aligned);
    $('qiblaAligned').textContent=aligned?'Facing the Qibla':valid?`${Math.round(Math.abs(difference))}° ${difference>0?'right':'left'} · turn the phone`: 'True-north reference · start compass';
    if (aligned && !lastAlignment && $('qiblaHaptic').checked && typeof navigator.vibrate==='function') {
      try{navigator.vibrate([35,35,65])}catch{}
    }
    lastAlignment=aligned;
    if(valid){$('qiblaState').textContent=`Compass reading ${Math.round(qiblaHeading)}° magnetic · correction ${delta.toFixed(1)}° ${override!==''?'(manual)':variationSource}`;
      $('qiblaAccuracy').textContent=Number.isFinite(compassSensorAccuracy)?compassSensorAccuracy<0?'Compass needs calibration — move the phone in a figure eight.':`Sensor uncertainty approximately ±${Math.round(compassSensorAccuracy)}°. Hold flat, away from metal.`:'Heading accuracy not reported: verify with another compass.';
    }
  }
  let compassSensorAccuracy=NaN,variationPromise=null;
  async function loadVariation(){
    const date=new Date();
    if(date.getUTCFullYear()>2029){magneticVariation=null;variationSource='model expired';return false}
    if (variationPromise) return variationPromise;
    variationPromise=(async()=>{
      try {
        // Pinned MIT package implementing NOAA/BGS WMM2025 (not an ad or account).
        const mod=await import('https://cdn.jsdelivr.net/npm/magvar@2.2.0/+esm');
        const magvar=mod.magvar||mod.default?.magvar;
        if(typeof magvar!=='function')throw Error('Magnetic module not compatible');
        const dec=Number(magvar(+cfg.lat,+cfg.lng,0,new Date()));
        if(!Number.isFinite(dec)||Math.abs(dec)>180)throw Error('Magnetic model invalid');
        magneticVariation=dec;variationSource='· WMM2025';
        return true;
      } catch(err){magneticVariation=null;variationSource='';return false}
    })();
    return variationPromise;
  }
  function orientationHandler(e) {
    // webkitCompassHeading is magnetic north on iPhone; alpha alone is not a
    // reliable north-referenced compass, so never treat it as one.
    const h=Number(e.webkitCompassHeading);
    if (!Number.isFinite(h)||e.webkitCompassHeading==null||h<0) {
      $('qiblaState').textContent='No north-referenced heading. Use the bearing with a calibrated compass.';return;
    }
    qiblaHeading=norm360(h);
    compassSensorAccuracy= e.webkitCompassAccuracy===undefined?NaN:Number(e.webkitCompassAccuracy);
    renderQibla();
  }
  $('startCompass').addEventListener('click',async()=>{
    if(!window.isSecureContext){$('qiblaState').textContent='Compass access requires HTTPS.';return;}
    if(typeof DeviceOrientationEvent==='undefined'){$('qiblaState').textContent='This device does not expose a compass heading.';return;}
    try {
      // iOS requires a user gesture when requesting sensor permission.
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        const permission=await DeviceOrientationEvent.requestPermission();
        if(permission!=='granted'){$('qiblaState').textContent='Motion permission denied. Use the true-north bearing above.';return;}
      }
      window.removeEventListener('deviceorientation',orientationHandler);
      window.addEventListener('deviceorientation',orientationHandler);
      qiblaCompassOn=true;
      $('startCompass').textContent='Compass active';
      $('qiblaState').textContent='Finding compass heading and magnetic correction…';
      const success=await loadVariation();
      if(!success && !$('declinationOverride').value.trim()) $('qiblaState').textContent='Magnetic model unavailable. Enter the local magnetic declination for a corrected pointer, or use the bearing with a true-north compass.';
      renderQibla();
    } catch(err){$('qiblaState').textContent=`Compass access failed: ${err.message}`}
  });
  $('qiblaGPS').addEventListener('click',()=>{
    if(!navigator.geolocation){$('qiblaState').textContent='GPS is unavailable.';return}
    $('qiblaState').textContent='Getting current GPS position…';
    navigator.geolocation.getCurrentPosition(async p=>{
      cfg.lat=+p.coords.latitude.toFixed(5);cfg.lng=+p.coords.longitude.toFixed(5);
      cfg.location=`GPS · ${cfg.lat.toFixed(3)}, ${cfg.lng.toFixed(3)}`;
      cfg.zoneVerified=false;store();
      variationPromise=null;magneticVariation=null; $('declinationOverride').value='';
      render();
      $('qiblaState').textContent=`GPS location acquired (±${Math.round(p.coords.accuracy)} m).`;
      if(qiblaCompassOn){await loadVariation();renderQibla()}
      void enrichLocation(cfg.lat,cfg.lng).then(data=>{
        if(data.name)cfg.location=data.name;
        if(data.zone)cfg.timeZone=data.zone;
        cfg.zoneVerified=data.confirmed;store();if(!browsing)selectedKey=todayKey();render();
      }).catch(()=>{});
    },e=>{$('qiblaState').textContent=`GPS unavailable: ${e.message}`},{enableHighAccuracy:true,timeout:12000,maximumAge:15000});
  });
  $('declinationOverride').addEventListener('input',()=>{store();renderQibla()});
  $('clearDeclination').addEventListener('click',()=>{$('declinationOverride').value='';renderQibla()});
  $('qiblaHaptic').addEventListener('change',()=>{
    if($('qiblaHaptic').checked && typeof navigator.vibrate!=='function'){
      $('qiblaState').textContent='iPhone Safari does not offer vibration to web apps; the visual alignment cue still works.';
    }
  });
  
  function addTestRow(label,message,state){
    const row=document.createElement('div');row.className=`test-result test-${state}`;
    const strong=document.createElement('strong');strong.textContent=label;
    const small=document.createElement('span');small.textContent=message;
    row.append(strong,small);$('testResults').append(row);
  }
  function basicChecks(){
    $('testResults').replaceChildren();
    addTestRow('App installation',window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true?'Home Screen mode':'Open in Safari or add to Home Screen',window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true?'pass':'info');
    addTestRow('Connection',navigator.onLine?'Online now':'Offline now',navigator.onLine?'pass':'info');
    addTestRow('Offline files','serviceWorker' in navigator?(navigator.serviceWorker.controller?'Offline worker controls this page':'Worker not controlling the page yet — reload after installation'):'No service worker support','serviceWorker' in navigator && navigator.serviceWorker.controller?'pass':'info');
    addTestRow('Local calendar','Export .ics above; test delivery in iOS Calendar','info');
    addTestRow('Notification API', ('Notification' in window && 'serviceWorker' in navigator)?`Supported · ${Notification.permission}`:'Not exposed by this browser',('Notification' in window&&'serviceWorker' in navigator)?'pass':'info');
    addTestRow('Background push','No server connected — not available in this build','info');
    addTestRow('Motion sensor',typeof DeviceOrientationEvent!=='undefined'?'Permission and compass test available':'Not exposed','info');
    addTestRow('Vibration',typeof navigator.vibrate==='function'?'Browser exposes vibration':'Not supported (normal for iPhone Safari)',typeof navigator.vibrate==='function'?'pass':'info');
  }
  $('runBasicChecks').addEventListener('click',basicChecks);
  $('testAdhan').addEventListener('click',async()=>{
    $('testFeedback').textContent='Requesting adhan…';
    await playAdhan();
    $('testFeedback').textContent=$('soundStatus').textContent+' Listen to confirm. A playing promise does not prove the speaker is audible.';
  });
  let testingChimeTimer=null;
  $('testEarlyChime').addEventListener('click',()=>{
    if(testingChimeTimer)clearTimeout(testingChimeTimer);
    playReminderChime();
    $('testFeedback').textContent='A short test chime just played. A second will be requested in 10 seconds while the app stays visible.';
    testingChimeTimer=setTimeout(()=>{
      if(!document.hidden){playReminderChime();$('testFeedback').textContent='10-second foreground alert requested. Did you hear it? iOS may silence it after backgrounding.'}
      else $('testFeedback').textContent='The app was hidden; it cannot guarantee background audio.';
      testingChimeTimer=null;
    },10000);
  });
  $('testNotification').addEventListener('click',async()=>{
    const show=m=>$('testFeedback').textContent=m;
    if(!('Notification' in window)||!('serviceWorker' in navigator)){show('Notifications are unavailable here. Install Salah to your iPhone Home Screen first.');return}
    try {
      const permission=await Notification.requestPermission();
      if(permission!=='granted'){show(`Notification permission: ${permission}`);return}
      const ready=await Promise.race([navigator.serviceWorker.ready, new Promise((_,reject)=>setTimeout(()=>reject(Error('No service worker ready within 8 seconds')),8000))]);
      await ready.showNotification('Salah test',{body:'This is a test notification, not a prayer reminder.',icon:'./icons/icon-192.png',tag:'salah-self-test'});
      show('Test notification sent to the system. Check Notification Centre; background scheduled alerts still require a push server.');
    } catch(err){show(`Notification test failed: ${err.message}`)}
  });
  $('testGPS').addEventListener('click',()=>{
    if(!navigator.geolocation){$('testFeedback').textContent='GPS unavailable in this browser.';return}
    $('testFeedback').textContent='Requesting GPS…';
    navigator.geolocation.getCurrentPosition(p=>{$('testFeedback').textContent=`GPS acquired: ±${Math.round(p.coords.accuracy)} metres. Qibla can use this position.`},e=>{$('testFeedback').textContent=`GPS permission or positioning issue: ${e.message}`},{enableHighAccuracy:true,timeout:12000,maximumAge:10000});
  });
  $('testVibration').addEventListener('click',()=>{
    const supported=typeof navigator.vibrate==='function';
    const accepted=supported?navigator.vibrate([40,50,70]):false;
    $('testFeedback').textContent=supported?`Vibration pattern ${accepted?'accepted by browser':'not accepted'}; physical feedback still needs checking.`:'iPhone Safari does not provide the web vibration API. The Qibla dial uses a visual alignment cue.';
  });
  basicChecks();
  renderQibla();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  render(); startTracking();
})();

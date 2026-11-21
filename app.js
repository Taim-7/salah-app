(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const defaults = {
    lat: 54.9966, lng: -7.3086, location: 'Derry, Northern Ireland', timeZone: 'Europe/London',
    zoneVerified: true, autoLocation: false, method: '12-12', fajrAngle: 15, ishaAngle: 13,
    ishaEnd: 'third', highLatRule: 'seventh', activeSource: 'angles', soundChoice: 'soft', onlineCompare: true, calendarLead: 0
  };
  const names = [
    { key: 'fajr', en: 'Fajr', ar: 'الفجر', icon: '✳', desc: 'True dawn, angle estimate' },
    { key: 'sunrise', en: 'Sunrise', ar: 'الشروق', icon: '☀', desc: 'Fajr ends · not a prayer' },
    { key: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', icon: '◉', desc: 'After solar noon' },
    { key: 'asr', en: 'Asr', ar: 'العصر', icon: '◔', desc: 'Hanbali one-shadow method' },
    { key: 'maghrib', en: 'Maghrib', ar: 'المغرب', icon: '◕', desc: 'After sunset' },
    { key: 'isha', en: 'Isha', ar: 'العشاء', icon: '☾', desc: 'Estimated disappearance of red twilight' }
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
      if (raw && !('timeZone' in raw)) { c.timeZone = deviceZone(); c.zoneVerified = false; if (raw.method === '15-15') c.method = '12-12'; }
      if (!['12-12', '15-13', '15-15', 'custom'].includes(c.method)) c.method = defaults.method;
      if (!['third', 'half'].includes(c.ishaEnd)) c.ishaEnd = defaults.ishaEnd;
      if (!['angles', 'tayba', 'moonsighting', 'france', 'mwl'].includes(c.activeSource)) c.activeSource = 'angles';
      if (!['soft','bell','custom','off'].includes(c.soundChoice)) c.soundChoice = 'soft';
      c.calendarLead = [0,5,10,15].includes(Number(c.calendarLead)) ? Number(c.calendarLead) : 0;
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
    timeZone: cfg.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(date) : '--:--';
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
  function renderPrayerList(t) {
    const now = new Date().getTime(), current = selectedKey === todayKey();
    let active = '';
    if (current) {
      for (const n of names) {
        if (n.key === 'sunrise') continue;
        const a = t[n.key].getTime();
        const end = n.key === 'fajr' ? t.sunrise : n.key === 'isha' ? endChoice(t) :
          n.key === 'maghrib' ? t.isha : n.key === 'asr' ? t.maghrib : t.asr;
        if (now >= a && now < end.getTime()) active = n.key;
      }
    }
    $('prayerList').innerHTML = names.map(n => {
      const estimated = (n.key === 'fajr' && t.fajrFallback) || (n.key === 'isha' && t.ishaFallback);
      const desc = n.key === 'isha' ? 'Starts after estimated red twilight' : n.desc;
      return `<div class="time-row ${n.key === active ? 'active' : ''}"><span class="time-icon" aria-hidden="true">${n.icon}</span><div class="time-text"><div class="time-name">${n.en}</div><div class="time-desc">${desc}</div></div><div class="time-data">${estimated ? '<span class="estimate-dot" title="High-latitude estimate">EST.</span>' : ''}<time class="time-value" datetime="${t[n.key].toISOString()}">${fmt(t[n.key])}</time></div></div>`;
    }).join('');
  }
  function setHero(event, now, nextDay = false, otherDate = false) {
    if (nextDay) $('heroDate').textContent = 'Tomorrow';
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
    $('heroDate').textContent = relativeKey(selectedKey);
    $('heroDesc').textContent = 'One-shadow Asr · calculated times';
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
  }
  function renderNight(t) {
    $('nightStart').textContent = fmt(t.maghrib);
    $('nightEnd').textContent = fmtNight(t.nextFajr);
    $('firstThird').textContent = fmtNight(t.firstThird);
    $('halfNight').textContent = fmtNight(t.midnight);
    $('thirdMilestone').classList.toggle('chosen', cfg.ishaEnd === 'third');
    $('halfMilestone').classList.toggle('chosen', cfg.ishaEnd === 'half');
    $('thirdMeaning').textContent = cfg.ishaEnd === 'third' ? 'Selected: end of preferred / choice time' : 'Recommended earlier target';
    $('halfMeaning').textContent = cfg.ishaEnd === 'half' ? 'Selected: later normal endpoint' : 'Later endpoint supported by Muslim 612';
    $('ishOpinionText').textContent = cfg.ishaEnd === 'third'
      ? 'Hanbali school view: preferred time ends at the first third. Some Hanbali authorities count later time up to Fajr as necessity, not a general licence to delay.'
      : 'Half-night opinion: the normal time ends halfway between Maghrib and Fajr, based on Sahih Muslim 612. Praying by the first third remains preferred.';
    const warning = t.ishaBeyondHalf
      ? 'Isha begins after the half-night marker here: this needs local fiqh guidance.'
      : cfg.ishaEnd === 'third' && t.ishaBeyondFirstThird
        ? 'The preferred first-third marker comes before Isha starts on this date.' : '';
    $('cutoffWarning').textContent = warning;
    $('cutoffWarning').classList.toggle('hidden', !warning);
  }
  function renderProhibited(t) {
    // These are practical buffers, not exact legal definitions. The legal markers are
    // appearance of the Sun, zenith, actual performance of Fajr/Asr, and sunset.
    const sunriseEnd = SalahSolar.plusMinutes(t.sunrise, 15);
    const zenithStart = SalahSolar.plusMinutes(t.solarNoon, -8);
    const sunsetStart = SalahSolar.plusMinutes(t.maghrib, -15);
    const rows = [
      { title: 'After Fajr', detail: 'After praying Fajr (some Hanbalis start at true dawn)', start: `After Fajr (from ${fmt(t.fajr)})`, end: fmt(t.sunrise), strong: false },
      { title: 'Sunrise', detail: 'Until well above the horizon; ≈15-minute safety estimate', start: fmt(t.sunrise), end: fmt(sunriseEnd), strong: true },
      { title: 'At solar zenith', detail: '≈8-minute buffer before Dhuhr, not an exact ruling', start: fmt(zenithStart), end: fmt(t.dhuhr), strong: true },
      { title: 'After Asr', detail: 'Only after you have actually prayed Asr', start: `After Asr (from ${fmt(t.asr)})`, end: fmt(t.maghrib), strong: false },
      { title: 'Near sunset', detail: '≈15-minute precaution before sunset', start: fmt(sunsetStart), end: fmt(t.maghrib), strong: true }
    ];
    $('avoidList').innerHTML = rows.map(r => `<div class="avoid-row ${r.strong ? 'strong' : ''}"><div><div class="avoid-row-title">${r.title}</div><div class="avoid-row-detail">${r.detail}</div></div><span class="avoid-row-time">${r.start} – ${r.end}</span></div>`).join('');
    let state = 'Guidance', klass = 'avoid-status';
    if (selectedKey === todayKey()) {
      const now = Date.now();
      if (isBetween(now, t.sunrise, sunriseEnd) || isBetween(now, zenithStart, t.dhuhr) || isBetween(now, sunsetStart, t.maghrib)) {
        state = 'Avoid voluntary prayer now'; klass += ' warning';
      } else if (isBetween(now, t.fajr, t.sunrise) || isBetween(now, t.asr, t.maghrib)) state = 'Depends on whether you prayed';
      else { state = 'No estimated restriction'; klass += ' ok'; }
    }
    $('avoidStatus').textContent = state;
    $('avoidStatus').className = klass;
  }
  function render() {
    renderDate();
    dayInfo = getDay(selectedKey);
    renderComparison();
    $('timesTag').textContent = cfg.timeZone.replace('_', ' ');
    if (!dayInfo.valid) {
      note(dayInfo.reason); $('prayerList').innerHTML = '<p class="loading">Times unavailable for this date and location.</p>';
      $('avoidList').innerHTML = ''; loadComparison(); return;
    }
    renderNotice(dayInfo); renderPrayerList(dayInfo); renderHero(dayInfo); renderNight(dayInfo); renderProhibited(dayInfo);
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
    const method = document.querySelector('input[name="method"]:checked')?.value || '12-12';
    const ishaEnd = document.querySelector('input[name="ishaEnd"]:checked')?.value || 'third';
    const newCfg = {
      activeSource: cfg.activeSource, soundChoice: cfg.soundChoice, calendarLead: cfg.calendarLead, onlineCompare: $('onlineCompare').checked,
      lat, lng, location: $('placeInput').value.trim() || `Lat ${lat.toFixed(3)}°, Lon ${lng.toFixed(3)}°`,
      timeZone: zone, zoneVerified: pendingPlace ? pendingPlace.zoneVerified :
        kmApart({lat:+cfg.lat,lng:+cfg.lng},{lat,lng}) < 1 && cfg.timeZone === zone && cfg.zoneVerified,
      method, ishaEnd, fajrAngle: fa, ishaAngle: ia,
      autoLocation: $('trackLocation').checked, highLatRule: $('highLatSelect').value
    };
    const wasFollowing = cfg.autoLocation;
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
      renderHero(dayInfo); renderProhibited(dayInfo); checkPrayerSounds();
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
  async function playSound() {
    if (cfg.soundChoice === 'off') return;
    try {
      if (cfg.soundChoice === 'custom') {
        const blob = await audioData('read');
        if (!blob) { $('soundStatus').textContent='Upload a custom sound first, or choose a built-in chime.'; return; }
        if (savedAudioObjectUrl) URL.revokeObjectURL(savedAudioObjectUrl);
        savedAudioObjectUrl = URL.createObjectURL(blob);
        const audio = new Audio(savedAudioObjectUrl); audio.volume = .9;
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
  $('calendarLead').addEventListener('change',()=>{ cfg.calendarLead=Number($('calendarLead').value);store(); });
  $('soundChoice').addEventListener('change', () => {
    cfg.soundChoice = $('soundChoice').value; store();
    $('soundStatus').textContent = 'Sound preference saved. Sounds can only work while Salah is open and armed.';
  });
  $('testSound').addEventListener('click', () => { void playSound(); });
  $('armSound').addEventListener('click', async () => {
    soundArmed = !soundArmed;
    if (soundArmed) {
      if (cfg.soundChoice !== 'off') await playSound();
      // Do not play past prayers on arm or when opening the app.
      soundSeen = new Set(prayers.filter(p=>dayInfo?.[p.key] <= new Date()).map(p=>`${selectedKey}:${p.key}`));
    }
    $('armSound').textContent = soundArmed ? 'Disarm sound' : 'Arm while open';
    $('soundStatus').textContent = soundArmed ? 'Armed only while this page is open. Locking the phone can stop it.' : 'Not armed.';
  });
  function checkPrayerSounds() {
    if (!soundArmed || document.hidden || !dayInfo?.valid || cfg.soundChoice === 'off') return;
    for (const p of prayers) {
      const id = `${selectedKey}:${p.key}`;
      const when = dayInfo[p.key]?.getTime();
      const diff = Date.now() - when;
      if (when && diff >= 0 && diff < 45000 && !soundSeen.has(id)) {
        soundSeen.add(id); void playSound();
        $('soundStatus').textContent = `${p.en} time reached. Foreground chime requested.`;
      }
    }
  }

  function iCalStamp(d) { return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
  function escapeCal(s) { return s.replace(/[\\;,\n]/g, c => c==='\n'?'\\n':'\\'+c); }
  function makeCalendar() {
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Salah Comparison//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Salah prayer reminders'];
    const online = onlineKinds.includes(cfg.activeSource);
    const dayCount = online ? 1 : 30;
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
          'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${escapeCal(prayer.en + ' prayer time')}`, cfg.calendarLead ? `TRIGGER:-PT${cfg.calendarLead}M` : 'TRIGGER:PT0S','END:VALARM','END:VEVENT');
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
      `${result.eventCount} event(s) exported for up to 30 days. This static file will not automatically follow GPS, time-zone or method changes.`;
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  render(); startTracking();
})();

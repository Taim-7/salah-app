(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const defaults = {
    lat: 54.9966, lng: -7.3086, location: 'Derry, Northern Ireland', timeZone: 'Europe/London',
    autoLocation: false, method: '15-13', fajrAngle: 15, ishaAngle: 13,
    ishaPreference: 'around-third', ishaLimit: 'half', magneticDeclination: '', highLatRule: 'seventh', activeSource: 'angles', soundChoice: 'adhan-abu-bakr', soundVolume: 40, onlineCompare: true, calendarLead: 15, timeFormat: '12', theme: 'dark', layout: 'classic', accent: 'forest'
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

  const dateFormats = new Map();
  const clockFormats = new Map();
  function dateParts(date, zone) {
    if (!dateFormats.has(zone)) dateFormats.set(zone, new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit'
    }));
    const parts = Object.fromEntries(dateFormats.get(zone).formatToParts(date).map(p => [p.type, p.value]));
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  const dayShift = (key, amount) => {
    const [y, m, d] = key.split('-').map(Number);
    const z = new Date(Date.UTC(y, m - 1, d + amount, 12));
    return `${z.getUTCFullYear()}-${String(z.getUTCMonth() + 1).padStart(2, '0')}-${String(z.getUTCDate()).padStart(2, '0')}`;
  };
  const dateAtNoonUTC = key => new Date(`${key}T12:00:00Z`);



  const summerRules = {
    seventh: 'One seventh when missing',
    relative: 'Local relative estimate',
    nearest: 'Last valid day',
    angle: 'Angle fraction when missing',
    tayba: 'Seasonal Tayba reference',
    crossings: 'Crossings only'
  };
  function loadConfig() {
    try {
      const raw = JSON.parse(localStorage.getItem('salah-config') || '{}');
      const c = { ...defaults, ...raw };
      if (!raw.version4) {
        if (raw.method === '12-12') c.method = '15-13';
        c.timeFormat = '12';
        if (raw.soundChoice === 'soft') c.soundChoice = 'adhan';
      }
      if (!raw.version6 && c.soundChoice === 'adhan') c.soundChoice = 'soft';
      if (!raw.audioDefaultV13 && c.soundChoice === 'soft') c.soundChoice = 'adhan-abu-bakr';
      c.audioDefaultV13 = true;
      c.version7 = true; c.version6 = true; c.version5 = true; c.version4 = true;
      if (!['12-12', '15-13', '18-17', 'custom'].includes(c.method)) c.method = defaults.method;
      if (!['around-third', 'after-third'].includes(c.ishaPreference)) c.ishaPreference = defaults.ishaPreference;
      if (!['half', 'third', 'half-necessity'].includes(c.ishaLimit)) c.ishaLimit = defaults.ishaLimit;
      delete c.asrShadow;
      delete c.showBuffers;
      if (!(Number.isFinite(+c.magneticDeclination) && Math.abs(+c.magneticDeclination) <= 180))
        c.magneticDeclination = '';
      if (c.activeSource === 'tayba-white') c.activeSource = 'tayba';
      if (!['angles', 'tayba', 'moonsighting'].includes(c.activeSource)) c.activeSource = 'angles';
      if (raw.fajrSoundChoice === 'adhan-fajr-abu-bakr' && c.soundChoice === 'soft') c.soundChoice = 'adhan-fajr-abu-bakr';
      if (!['soft','bell','custom','off','adhan-abu-bakr','adhan-fajr-abu-bakr','adhan-thabet'].includes(c.soundChoice)) c.soundChoice = 'soft';
      delete c.fajrSoundChoice;
      c.soundVolume = Number.isFinite(+c.soundVolume) ? Math.max(15, Math.min(100, +c.soundVolume)) : 40;
      c.calendarLead = 15;
      c.timeFormat = ['12','24'].includes(String(c.timeFormat)) ? String(c.timeFormat) : '12';
      c.theme = 'dark';
      c.layout = ['classic','compact','timeline'].includes(c.layout) ? c.layout : 'classic';
      c.accent = ['forest','ocean','dusk'].includes(c.accent) ? c.accent : 'forest';
      c.onlineCompare = c.onlineCompare !== false;
      if (!Object.hasOwn(summerRules, c.highLatRule)) c.highLatRule = defaults.highLatRule;
      if (![c.fajrAngle, c.ishaAngle].every(a => Number.isFinite(+a) && +a >= 6 && +a <= 22)) {
        c.fajrAngle = defaults.fajrAngle; c.ishaAngle = defaults.ishaAngle;
      }
      c.lat = Number(c.lat);
      c.lng = Number(c.lng);
      const zone = SalahRegion.zone(c.lat, c.lng);
      if (!zone) {
        c.lat = defaults.lat;
        c.lng = defaults.lng;
        c.location = defaults.location;
        c.magneticDeclination = '';
      }
      c.timeZone = zone || defaults.timeZone;
      c.autoLocation = !!zone && c.autoLocation === true;
      return c;
    } catch {
      return { ...defaults };
    }
  }

  let cfg = loadConfig();
  storeInitialAppearance();
  function storeInitialAppearance() { try { const saved=JSON.parse(localStorage.getItem('salah-config') || '{}'); if(saved.theme !== 'dark')localStorage.setItem('salah-config',JSON.stringify({...saved,theme:'dark'})); } catch {} }
  const store = () => { try { localStorage.setItem('salah-config', JSON.stringify(cfg)); } catch {} };
  const anglePair = () => cfg.method === 'custom' ? [+cfg.fajrAngle, +cfg.ishaAngle] : cfg.method.split('-').map(Number);
  const todayKey = () => dateParts(new Date(), cfg.timeZone);

  function fmt(date) {
    if (!(date instanceof Date) || !Number.isFinite(+date)) return '—';
    const key = cfg.timeZone + ':' + cfg.timeFormat;
    if (!clockFormats.has(key)) clockFormats.set(key, new Intl.DateTimeFormat('en-GB', {
      timeZone: cfg.timeZone, hour: cfg.timeFormat === '12' ? 'numeric' : '2-digit',
      minute:'2-digit', hour12: cfg.timeFormat === '12'
    }));
    return clockFormats.get(key).format(date).replace(/am|pm/ig, value => value.toLowerCase());
  }

  const prettyKey = key => dateAtNoonUTC(key).toLocaleDateString('en-GB', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const relativeKey = key => key === todayKey() ? 'Today' : key === dayShift(todayKey(), 1) ? 'Tomorrow' :
    dateAtNoonUTC(key).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  const isBetween = (t, a, b) => a && b && t >= a.getTime() && t < b.getTime();
  let selectedKey = todayKey();
  let browsing = false, dayInfo = null, gpsLoading = false, lastListRefresh = 0;
  let geoWatch = null, placeRequest = 0, searchRequest = 0, lastTrackingLookup = 0;

  function note(message) {
    $('notice').textContent = message;
    $('notice').classList.toggle('hidden', !message);
  }


  const methods = [
    { id:'angles', title:'Your angles', sub:'Local calculation' },
    { id:'tayba', title:'Tayba option 2', sub:'Seasonal Fajr · red twilight model' },
    { id:'moonsighting', title:'AlAdhan · Moonsighting', sub:'Fajr and Isha · online' }
  ];
  const onlineKinds = ['moonsighting'];
  const providerPrefix = 'salah-v4-provider:';
  const cacheId = (kind, key, place = cfg) => [
    providerPrefix + kind, key, place.lat, place.lng, place.timeZone, '1'
  ].join(':');
  const pendingOnline = new Set(), failedOnline = new Map(), onlineMem = new Map();
  const DAY_MS = 86400000;
  const validFor = 7 * DAY_MS;
  function readCached(kind, key) {
    const id = cacheId(kind, key);
    if (onlineMem.has(id)) return onlineMem.get(id);
    try {
      const saved = JSON.parse(localStorage.getItem(id));
      if (!saved?.raw || !Number.isFinite(saved.at)) return null;
      const day = SalahProviders.decode(kind, key, cfg.timeZone, saved.raw, {
        lat: cfg.lat, lng: cfg.lng
      });
      day.retrievedAt = saved.at;
      day.savedProviderData = true;
      onlineMem.set(id, day);
      return day;
    } catch {
      return null;
    }
  }
  function pruneProviderCache() {
    const applicable = [];
    for (let i = 0; i < localStorage.length; i++) {
      const id = localStorage.key(i);
      if (id?.startsWith(providerPrefix)) {
        let at = 0;
        try { at = Number(JSON.parse(localStorage.getItem(id))?.at) || 0; } catch {}
        applicable.push([id, at]);
      } else if (id?.startsWith('salah-v3-provider:')) applicable.push([id, 0]);
    }
    applicable.sort((a, b) => b[1] - a[1]);
    applicable.forEach(([id, at], index) => {
      if (index < 120 && at) return;
      localStorage.removeItem(id);
      onlineMem.delete(id);
    });
  }
  async function fetchOnline(kind, key, force = false) {
    const { lat, lng, timeZone } = cfg;
    const id = cacheId(kind, key);
    if (pendingOnline.has(id)) return;
    const saved = readCached(kind, key);
    if (!force && (Date.now() - saved?.retrievedAt < validFor ||
        Date.now() - failedOnline.get(id) < 120000)) return;
    pendingOnline.add(id);
    failedOnline.delete(id);
    if (key === selectedKey && !$('comparisonPanel').hidden) renderComparison();
    try {
      const url = SalahProviders.buildUrl(kind, key, lat, lng, timeZone);
      const raw = await fetchJson(url);
      const day = SalahProviders.decode(kind, key, timeZone, raw, { lat, lng });
      day.retrievedAt = Date.now();
      day.savedProviderData = false;
      if (onlineMem.size >= 150) onlineMem.delete(onlineMem.keys().next().value);
      onlineMem.set(id, day);
      try {
        localStorage.setItem(id, JSON.stringify({ at: day.retrievedAt, raw }));
        pruneProviderCache();
      } catch {}
    } catch {
      if (failedOnline.size >= 120) failedOnline.delete(failedOnline.keys().next().value);
      failedOnline.set(id, Date.now());
    } finally {
      pendingOnline.delete(id);
      if (id === cacheId(kind, key) && [dayShift(selectedKey, -1), selectedKey, dayShift(selectedKey, 1),
          todayKey(), dayShift(todayKey(), -1), dayShift(todayKey(), 1)].includes(key)) render();
    }
  }
  function loadComparison(force = false) {
    if (!navigator.onLine) return;
    if (cfg.onlineCompare || force) void fetchOnline('moonsighting', selectedKey, force);
    if (cfg.activeSource !== 'moonsighting') return;
    const today = todayKey();
    const requested = new Set([selectedKey, dayShift(selectedKey, 1), today, dayShift(today, -1), dayShift(today, 1)]);
    requested.forEach(key => { void fetchOnline(cfg.activeSource, key, force && (key === selectedKey || key === dayShift(selectedKey, 1))); });
  }

  const localDays = new Map();
  function localDay(key, source = 'angles', rule = cfg.highLatRule) {
    const [fa, ia] = anglePair();
    const id = [source, key, cfg.lat, cfg.lng, fa, ia, rule].join(':');
    if (localDays.has(id)) return localDays.get(id);
    let day;
    if (source === 'tayba') day = SalahProviders.taybaDay(key, cfg.lat, cfg.lng);
    else if (rule === 'tayba') day = SalahProviders.hybridTwilightDay(key, cfg.lat, cfg.lng, fa, ia);
    else day = SalahSolar.calculateFullDay(dateAtNoonUTC(key), cfg.lat, cfg.lng, fa, ia, rule);
    if (localDays.size >= 540) localDays.delete(localDays.keys().next().value);
    localDays.set(id, day);
    return day;
  }

  function getActiveDay(key) {
    if (cfg.activeSource !== 'moonsighting') return localDay(key, cfg.activeSource);
    const today = readCached(cfg.activeSource, key);
    const local = localDay(key);
    if (!today || !local.valid) return { ...local, sourceFallback:true };
    const next = readCached(cfg.activeSource, dayShift(key, 1));
    const fajr = today.fajr < local.sunrise ? today.fajr : null;
    const isha = today.isha > local.maghrib ? today.isha : null;
    return SalahSolar.withNight({
      ...today, fajr, isha, sunrise:local.sunrise, dhuhr:local.dhuhr, asr:local.asr, maghrib:local.maghrib,
      trueSunset:local.trueSunset, solarNoon:local.solarNoon,
      fajrReason:fajr ? '' : 'AlAdhan Fajr is at or after the local sunrise time.',
      ishaReason:isha ? '' : 'AlAdhan Isha does not follow the local sunset time.',
      savedProviderData:today.savedProviderData || !navigator.onLine || Date.now() - today.retrievedAt > 3600000
    }, next);
  }
  function isEstimated(day, name) {
    return !!day[name] && ((name === 'fajr' && (day.fajrFallback || day.providerEstimate)) ||
      (name === 'isha' && (day.ishaFallback || day.providerEstimate)));
  }

  function renderComparison() {
    const id = cacheId('moonsighting', selectedKey);
    const provider = readCached('moonsighting', selectedKey);
    const cols = [
      { id:'angles', title:'Your ' + anglePair().join('° / ') + '°', desc:summerRules[cfg.highLatRule], day:localDay(selectedKey) },
      { id:'tayba', title:'Tayba option 2', desc:'Earlier Isha', day:localDay(selectedKey, 'tayba') },
      { id:'moonsighting', title:'AlAdhan', desc:'Moonsighting red preset', day:provider }
    ];
    const picker = $('sourcePicker');
    if (!picker.children.length) {
      picker.innerHTML = methods.map(m => `<button type="button" data-source="${m.id}" class="source-choice"><span class="source-radio" aria-hidden="true"></span><span class="source-detail"><strong>${m.title}</strong><small>${m.sub}</small></span></button>`).join('');
    }
    for (const button of picker.children) {
      const active = cfg.activeSource === button.dataset.source;
      button.classList.toggle('chosen', active);
      button.setAttribute('aria-pressed', active);
      button.querySelector('.source-radio').textContent = active ? '✓' : '';
    }
    $('compareDate').textContent = prettyKey(selectedKey);
    $('comparisonHead').innerHTML = '<tr><th scope="col">Prayer</th>' + cols.map(c =>
      `<th scope="col" class="${c.id === cfg.activeSource ? 'selected-col' : ''}">${c.title}<small>${c.desc}</small></th>`).join('') + '</tr>';
    const active = getActiveDay(selectedKey);
    $('comparisonBody').innerHTML = names.map(n => `<tr><th scope="row">${n.en}</th>` + cols.map(c => {
      const time = c.day?.valid ? c.day[n.key] : null;
      const reference = active?.valid ? active[n.key] : null;
      const delta = time && reference ? Math.round((time - reference) / 60000) : null;
      const diff = delta === null ? '' : delta === 0 ? 'same time' : (delta > 0 ? '+' : '') + delta + ' min';
      const hint = time && isEstimated(c.day, n.key) ? ' · est.' : '';
      const nextDay = time && dateParts(time, cfg.timeZone) !== selectedKey ? ' (+1 day)' : '';
      const status = c.id === 'moonsighting' ?
        pendingOnline.has(id) ? 'Loading…' : failedOnline.has(id) || !navigator.onLine ? 'Unavailable' : 'Load online' : '—';
      return `<td class="${c.id === cfg.activeSource ? 'selected-col' : ''}">${time ?
        `<span class="time-small">${fmt(time)}</span><span class="difference ${delta > 0 ? 'late' : delta < 0 ? 'early' : ''}">${diff}${hint}${nextDay}</span>` :
        `<span class="unknown">${status}</span>`}</td>`;
    }).join('') + '</tr>').join('');
    const messages = [];
    if (cfg.activeSource === 'moonsighting') {
      if (active.sourceFallback) messages.push('Main timetable uses LOCAL FALLBACK while AlAdhan is unavailable.');
      else messages.push(active.savedProviderData ? 'Main timetable uses saved AlAdhan Fajr and Isha with local daylight times.' :
        'Main timetable uses AlAdhan for Fajr and Isha and local calculations for daylight times.');
    }
    if (cols[1].day.ishaReason) messages.push(cols[1].day.ishaReason);
    if (pendingOnline.has(id)) messages.push('Loading AlAdhan times…');
    else if (!cfg.onlineCompare && cfg.activeSource !== 'moonsighting') messages.push('Automatic online comparison is off.');
    else if (failedOnline.has(id)) messages.push('AlAdhan could not be reached.');
    $('comparisonStatus').textContent = messages.join(' ');
    if ($('summerCompare').open) renderSummerComparison();
  }
  function renderSummerComparison() {
    const mark = (t, kind) => {
      const time = t[kind];
      if (!time) return '—';
      const nextDay = dateParts(time, cfg.timeZone) !== selectedKey ? ' (+1 day)' : '';
      const estimated = kind === 'midnight' ? t.nightEstimated : isEstimated(t, kind);
      return fmt(time) + nextDay + (estimated ? ' · est.' : '');
    };
    $('summerCompareBody').innerHTML = Object.entries(summerRules).map(([id, label]) => {
      const t = localDay(selectedKey, 'angles', id);
      return `<tr><th scope="row">${label}</th><td>${mark(t, 'fajr')}</td><td>${mark(t, 'isha')}</td><td>${mark(t, 'midnight')}</td></tr>`;
    }).join('');
  }

  function renderDate() {
    $('dateLabel').textContent = relativeKey(selectedKey);
    $('dateSubLabel').textContent = prettyKey(selectedKey).replace(/^[A-Za-z]+,?\s+/, '');
    $('nativeDate').value = selectedKey;
    $('locationLabel').textContent = cfg.location;
    $('timezoneLabel').textContent = cfg.timeZone === 'Europe/Dublin' ? 'Ireland time' : 'UK time';
    $('locationMode').textContent = cfg.autoLocation ? 'Location tracking on · while app is open' : 'Fixed location';
  }
  function getDay(key) { return getActiveDay(key); }

  function ishaDeadline(day) {
    return cfg.ishaLimit === 'third' ? day.firstThird : day.midnight;
  }
  function ishaHasWindow(day) {
    const deadline = ishaDeadline(day);
    return !!day.isha && !day.ishaOverlapsFajr && (!deadline || day.isha < deadline);
  }
  function renderNotice(t) {
    const msgs = [];
    if (t.sourceFallback) msgs.push('AlAdhan is unavailable for this date. The timetable shows your local angle calculation.');
    if (t.providerEstimate) msgs.push('AlAdhan supplies Fajr and Isha. Daylight times use the local Sun calculation.');
    if (t.fajrReason) msgs.push(t.fajrReason);
    if (t.ishaReason) msgs.push(t.ishaReason);
    if (isEstimated(t, 'fajr') || isEstimated(t, 'isha')) {
      if (t.taybaNotes) {
        const descriptions = ['fajr', 'isha'].filter(k => isEstimated(t, k))
          .map(k => (k === 'fajr' ? 'Fajr' : 'Isha') + ' uses Tayba’s ' + t.taybaNotes[k].toLowerCase());
        msgs.push(descriptions.join('. ') + '.');
      } else if (!t.providerEstimate) {
        const [fa, ia] = anglePair();
        const missing = [isEstimated(t, 'fajr') ? fa + '° Fajr' : '', isEstimated(t, 'isha') ? ia + '° Isha' : ''].filter(Boolean);
        msgs.push('The model finds no ' + missing.join(' or ') + ' crossing. Estimate from ' + summerRules[t.highLatRule] + '.');
      }
    }
    if (t.fajrFallback) msgs.push('This Fajr estimate also affects the calculated start of fasting. True dawn is the light spreading along the eastern horizon.');
    if (t.isha && !ishaHasWindow(t)) msgs.push('Isha begins after the selected cutoff for ordinary prayer. This calculation gives no ordinary Isha window.');
    if (!t.nextFajr) msgs.push('Night markers need the following day’s Fajr.');
    else if (t.nightEstimated) msgs.push('The night markers use an estimated next Fajr.');
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

  const restrictionTitles = {
    sunrise:'Forbidden · sunrise', noon:'Forbidden · around midday',
    sunset:'Forbidden · approaching sunset', lowSun:'Forbidden · low Sun'
  };
  function restrictionStatus(t, instant) {
    if (!t?.valid) return { level:'neutral', label:'Prayer times' };
    if (isBetween(instant, t.fajr, t.sunrise)) return { level:'preferred', label:'Fajr time', desc:'Until ' + fmt(t.sunrise) };
    if (isBetween(instant, t.dhuhr, t.asr)) return { level:'preferred', label:'Dhuhr time', desc:'Until ' + fmt(t.asr) };
    if (isBetween(instant, t.asr, t.maghrib)) return { level:'preferred', label:'Asr time', desc:'Pray before the Sun yellows' };
    if (isBetween(instant, t.maghrib, t.isha) || (!t.isha && instant >= t.maghrib && (!t.nextFajr || instant < t.nextFajr)))
      return { level:'preferred', label:t.isha ? 'Maghrib time' : 'After sunset', desc:t.isha ? 'Until ' + fmt(t.isha) : 'Isha time unavailable' };
    const deadline = ishaDeadline(t);
    if (ishaHasWindow(t) && isBetween(instant, t.isha, deadline)) {
      const preferred = cfg.ishaLimit !== 'third' && cfg.ishaPreference === 'after-third' && instant >= t.firstThird;
      const target = cfg.ishaLimit !== 'third' && t.isha < t.firstThird && instant < t.firstThird &&
        cfg.ishaPreference === 'around-third' ? 'Aim towards ' + fmt(t.firstThird) : 'Until ' + fmt(deadline);
      return { level:preferred ? 'preferred' : 'calm', label:preferred ? 'Preferred Isha period' : 'Isha time', desc:target };
    }
    if (t.isha && !t.ishaOverlapsFajr && t.isha <= instant && isBetween(instant, t.midnight, t.nextFajr) && cfg.ishaLimit === 'half-necessity')
      return { level:'caution', label:'Isha · necessity period', desc:'Until ' + fmt(t.nextFajr) };
    if (instant >= t.maghrib || (t.nextFajr && instant < t.fajr))
      return { level:'calm', label:'Night', desc:t.isha && !t.nextFajr && instant >= t.isha ? 'Isha cutoff unavailable' : '' };
    if (t.fajr && instant < t.fajr) return { level:'calm', label:'Before Fajr' };
    return { level:'calm', label:'Between prayers' };
  }

  function renderPrayerList(t) {
    const now = Date.now(), current = selectedKey === todayKey();
    lastListRefresh = now;
    let currentPrayer = null;
    if (current) {
      const ranges = [['fajr', t.sunrise], ['dhuhr', t.asr], ['asr', t.maghrib], ['maghrib', t.isha], ['isha', ishaDeadline(t)]];
      currentPrayer = ranges.find(([key, end]) => isBetween(now, t[key], end) && (key !== 'isha' || ishaHasWindow(t)))?.[0];
    }
    const events = names.map(n => ({
      at:t[n.key], title:n.en, desc:n.key === 'asr' ? 'One length added to the noon shadow' :
        n.key === 'isha' && t.isha && !ishaHasWindow(t) ? 'Outside the selected ordinary window' : n.desc,
      kind:'prayer', name:n, estimated:isEstimated(t, n.key)
    }));
    const selectedThird = cfg.ishaLimit === 'third';
    const lateIsha = t.ishaBeyondFirstThird;
    const thirdTitle = selectedThird ? 'Isha cutoff · first third' : !t.isha ? 'First third of the night' :
      lateIsha ? 'First third passed before Isha' :
      cfg.ishaPreference === 'after-third' ? 'Preferred Isha from here' : 'Preferred Isha target';
    const halfTitle = selectedThird ? 'Halfway through the night' : 'Ordinary Isha cutoff';
    const thirds = { at:t.firstThird, title:thirdTitle,
      desc:lateIsha ? 'Calculated Isha begins after this point' : 'First third of the night',
      kind:'night', icon:'third', estimated:t.nightEstimated };
    const half = { at:t.midnight, title:halfTitle, desc:'Half of the night', kind:'night', icon:'half', estimated:t.nightEstimated };

    const limits = SalahSolar.daylightRestrictions(dateAtNoonUTC(selectedKey), cfg.lat, cfg.lng).map(range => ({
      at:range.start, end:range.end, title:restrictionTitles[range.key],
      kind:'avoid', icon:'alert', desc:range.key === 'noon' ? 'Estimated midday precaution' : 'Estimated low-Sun period'
    }));
    const sorted = [...events, ...limits, thirds, half].filter(e => e.at instanceof Date && Number.isFinite(+e.at))
      .sort((a,b) => a.at - b.at);

    const currentIndex = current ? sorted.reduce((index,e,i) => e.at <= now ? i : index, -1) : -1;
    const nextIndex = current ? sorted.findIndex(e => e.at > now && (e.name?.key !== 'isha' || ishaHasWindow(t))) : -1;
    const list = $('prayerList');
    list.style.setProperty('--timeline-fill', Math.max(0, Math.round(100 * (currentIndex + 0.5) / sorted.length)) + '%');
    list.innerHTML = sorted.map((e,i) => {
      const phase = current ? (i === currentIndex ? (e.kind === 'prayer' ? 'is-now' : 'is-current-marker') :
        i === nextIndex ? 'is-next' : i < currentIndex ? 'is-past' : 'is-future') : '';
      const isCurrent = e.kind === 'prayer' && e.name.key === currentPrayer;
      const activeRange = current && isBetween(now, e.at, e.end);
      const extra = e.end ? `<span class="range-label">to ${fmt(e.end)}</span>` : '';
      const following = dateParts(e.at, cfg.timeZone) !== selectedKey ? '<span class="next-day">+1 day</span>' : '';
      const label = isCurrent ? '<span class="phase-pill current-pill">CURRENT</span>' :
        i === nextIndex ? '<span class="phase-pill next-pill">NEXT</span>' : '';
      return `<div class="time-row ${e.kind === 'prayer' ? 'prayer-entry' : e.kind === 'night' ? 'night-summary' : 'avoid-entry'} ${phase} ${isCurrent ? 'current-prayer' : ''} ${activeRange ? 'within-range' : ''}" data-event-time="${e.at.getTime()}">
        <span class="time-icon">${svgIcon(e.name?.icon || e.icon)}</span>
        <div class="time-text"><div class="time-name">${e.title}${e.estimated ? '<span class="estimate-dot">EST.</span>' : ''}${label}</div><div class="time-desc">${e.desc}</div></div>
        <div class="time-data"><time class="time-value" datetime="${e.at.toISOString()}">${fmt(e.at)}</time>${extra}${following}</div>
      </div>`;
    }).join('');
    for (const [name, position] of [[names[0], 'afterbegin'], [names.at(-1), 'beforeend']]) {
      if (t[name.key]) continue;
      list.insertAdjacentHTML(position, `<div class="time-row prayer-entry"><span class="time-icon">${svgIcon(name.icon)}</span>
        <div class="time-text"><div class="time-name">${name.en}</div><div class="time-desc">Time unavailable</div></div>
        <div class="time-data">—</div></div>`);
    }
  }
  function setHero(event, now, otherDate = false) {
    $('nextPrayerName').textContent = event?.en || 'Unavailable';
    $('nextPrayerArabic').textContent = event?.ar || '';
    $('nextPrayerTime').textContent = fmt(event?.at);
    if (!event) { $('countdown').textContent = 'No upcoming time available'; return; }
    const estimated = event.estimated ? ' · Estimate' : '';
    if (otherDate) { $('countdown').textContent = 'Earliest listed prayer on this date' + estimated; return; }
    const seconds = Math.max(0, Math.floor((event.at - now) / 1000));
    const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60);
    const tomorrow = dateParts(event.at, cfg.timeZone) === dayShift(selectedKey, 1) ? ' · Tomorrow' : '';
    $('countdown').textContent = 'In ' + h + 'h ' + String(m).padStart(2, '0') + 'm' + tomorrow + estimated;
  }
  function prayerEvent(day, prayer) {
    if (!day?.valid || !day[prayer.key] || (prayer.key === 'isha' && !ishaHasWindow(day))) return null;
    return { ...prayer, at:day[prayer.key], estimated:isEstimated(day, prayer.key) };
  }
  function activeNightForNow(t, instant) {
    if (!t?.valid || instant >= (t.fajr || t.sunrise)) return t;
    const previous = getDay(dayShift(selectedKey, -1));
    return previous?.valid && !!previous.sourceFallback === !!t.sourceFallback && previous.maghrib <= instant && previous.nextFajr > instant
      ? previous : null;
  }
  function renderHero(t) {
    const [a, b] = anglePair();
    $('heroHeading').textContent = t.fajr && ishaHasWindow(t) ? 'NEXT PRAYER' : 'NEXT TIMETABLED PRAYER';
    $('heroMethod').textContent = t.sourceFallback ? a + '° / ' + b + '° · LOCAL FALLBACK' :
      cfg.activeSource === 'angles' ? a + '° / ' + b + '° · local' :
      cfg.activeSource === 'moonsighting' ? 'AlAdhan · ' + (t.savedProviderData ? 'saved' : 'online') :
      methods.find(m => m.id === cfg.activeSource)?.title || 'Prayer times';

    const now = new Date();
    if (selectedKey !== todayKey()) {
      setHero(prayers.map(p => prayerEvent(t, p)).find(Boolean), now, true);
      updateHeroStatus(null, now);
      return;
    }
    const previous = activeNightForNow(t, now);
    const upcoming = prayers.map(p => prayerEvent(t, p)).filter(e => e && e.at > now);
    if (previous && previous !== t) {
      const late = prayerEvent(previous, prayers.at(-1));
      if (late?.at > now) upcoming.unshift(late);
    }
    if (!upcoming.length) {
      const next = t.sourceFallback ? localDay(dayShift(selectedKey, 1)) : getDay(dayShift(selectedKey, 1));
      if (!next.sourceFallback) {
        const fajr = prayerEvent(next, prayers[0]);
        if (fajr?.at > now) upcoming.push(fajr);
      }
    }
    setHero(upcoming[0], now);
    updateHeroStatus(previous, now);
  }
  function updateHeroStatus(activeNight, instant) {
    const live = selectedKey === todayKey();
    const state = live ? (activeNight ? restrictionStatus(activeNight, instant) :
      { level:'calm', label:'Before sunrise', desc:'Previous night’s times unavailable' }) :
      { level:'calm', label:'Selected date', desc:relativeKey(selectedKey) };
    const limits = live && SalahSolar.daylightRestrictions(dateAtNoonUTC(selectedKey), cfg.lat, cfg.lng)
      .find(window => isBetween(instant, window.start, window.end));
    if (limits) {
      if (state.label === 'Between prayers') state.label = 'Forbidden time';
      state.level = 'caution';
      state.desc = 'Avoid general voluntary prayer until ' + fmt(limits.end);
    }
    const msg = $('heroLiveMessage');
    msg.textContent = state.label;
    msg.dataset.level = state.level;
    $('heroLiveTime').textContent = state.desc || '';
  }

  function render() {
    $('offlineIndicator').hidden=navigator.onLine !== false;
    renderDate();
    dayInfo = getDay(selectedKey);
    if (!$('comparisonPanel').hidden) renderComparison();
    $('timesTag').textContent = cfg.timeZone === 'Europe/Dublin' ? 'Ireland time' : 'UK time';
    if (!dayInfo.valid) {
      note(dayInfo.reason); setHero(null, new Date()); $('heroHeading').textContent = 'PRAYER TIMES';
      $('heroMethod').textContent = 'Calculation unavailable'; $('prayerList').innerHTML = '<p class="loading">Times unavailable for this date and location.</p>';
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
    $('ishaLimit').value = cfg.ishaLimit;
    $('settingsStatus').textContent = '';
    searchRequest++;
    placeRequest++;
    gpsLoading = false;
    $('onlineCompare').checked = cfg.onlineCompare;
    const method = document.querySelector(`input[name="method"][value="${cfg.method}"]`);
    if (method) method.checked = true;
    const end = document.querySelector(`input[name="ishaPreference"][value="${cfg.ishaPreference}"]`);
    if (end) end.checked = true;
    $('gpsStatus').textContent = '';
    $('cityResults').replaceChildren(); updateCustomVisibility();
  }
  function updateCustomVisibility() {
    const method = document.querySelector('input[name="method"]:checked')?.value;
    $('customAngles').classList.toggle('hidden', method !== 'custom');
  }

  function save() {
    const report = message => { $('settingsStatus').textContent = message; };
    if (gpsLoading) { report('Wait for the GPS result before saving.'); return; }
    const latText = $('latInput').value.trim(), lngText = $('lngInput').value.trim();
    if (!latText || !lngText) { report('Enter latitude and longitude.'); return; }
    const lat = Number(latText), lng = Number(lngText);
    const zone = SalahRegion.zone(lat, lng);
    if (!zone) { report('Choose a location in the UK or Ireland.'); return; }
    const method = document.querySelector('input[name="method"]:checked')?.value || defaults.method;
    const ishaPreference = document.querySelector('input[name="ishaPreference"]:checked')?.value || defaults.ishaPreference;
    const fa = Number($('fajrAngleInput').value), ia = Number($('ishaAngleInput').value);
    const anglesValid = [fa, ia].every(a => Number.isFinite(a) && a >= 6 && a <= 22);
    if (method === 'custom' && !anglesValid) { report('Enter Fajr and Isha angles from 6° to 22°.'); return; }
    const changedPlace = cfg.lat !== lat || cfg.lng !== lng;
    const enteredName = $('placeInput').value.trim();
    const location = !enteredName || (changedPlace && enteredName === cfg.location) ? locationName(lat, lng) : enteredName;
    if (changedPlace) resetMagneticCorrection();
    cfg = {
      ...cfg, lat, lng, location, timeZone:zone, method, ishaPreference,
      fajrAngle:anglesValid ? fa : cfg.fajrAngle, ishaAngle:anglesValid ? ia : cfg.ishaAngle,
      ishaLimit:$('ishaLimit').value, autoLocation:$('trackLocation').checked,
      onlineCompare:$('onlineCompare').checked, highLatRule:$('highLatSelect').value
    };
    store();
    $('tzInput').value = zone;
    if (!browsing) selectedKey = todayKey();
    render();
    if (cfg.autoLocation) startTracking();
    else stopTracking();
    report('Settings saved.');
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

  function locationName(lat, lng) {
    const spot = { lat, lng };
    const zone = SalahRegion.zone(lat, lng);
    let nearest = null, distance = 2.5;
    for (const [name, area, pl, pn] of SalahRegion.places) {
      const d = kmApart(spot, { lat:pl, lng:pn });
      if (d < distance && SalahRegion.zone(pl, pn) === zone) {
        distance = d;
        nearest = name + ', ' + area;
      }
    }
    return nearest || 'GPS area ' + lat.toFixed(3) + '°, ' + lng.toFixed(3) + '°';
  }
  function geoError(error) {
    status(error.code === 1 ? 'Location permission denied. You can choose a town manually.' :
      'GPS unavailable. Keeping the saved location.');
  }
  function positionPlace(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    if (Number.isFinite(accuracy) && accuracy > 1500) return { error:'GPS accuracy is too low. Try again outdoors or choose a town.' };
    const lat = +latitude.toFixed(5), lng = +longitude.toFixed(5);
    const timeZone = SalahRegion.zone(lat, lng);
    if (!timeZone) return { error:'The GPS position is outside the UK and Ireland.' };
    return { lat, lng, timeZone, location:locationName(lat, lng) };
  }
  async function gpsTownName(place) {
    if (!navigator.onLine || !place.location.startsWith('GPS area ')) return '';
    const query = new URLSearchParams({
      latitude:String(place.lat), longitude:String(place.lng), localityLanguage:'en'
    });
    try {
      const data = await fetchJson('https://api.bigdatacloud.net/data/reverse-geocode-client?' + query);
      const country = place.timeZone === 'Europe/Dublin' ? 'IE' : 'GB';
      if (data.countryCode !== country) return '';
      const name = data.city || data.locality;
      return name ? [name, data.principalSubdivision].filter((part, i, list) => part && list.indexOf(part) === i).join(', ') : '';
    } catch {
      return '';
    }
  }
  function fillLocation(place) {
    $('latInput').value = place.lat;
    $('lngInput').value = place.lng;
    $('placeInput').value = place.location;
    $('tzInput').value = place.timeZone;
    $('trackLocation').checked = false;
  }
  function applyLocation(place, fromTracking = false) {
    if (cfg.lat !== place.lat || cfg.lng !== place.lng) resetMagneticCorrection();
    cfg = { ...cfg, ...place };
    if (qiblaCompassOn) void loadVariation().then(renderQibla);
    store();
    if (!browsing) selectedKey = todayKey();
    render();
    if (fromTracking && Date.now() - lastTrackingLookup < 60000) return;
    if (fromTracking && navigator.onLine && place.location.startsWith('GPS area ')) lastTrackingLookup = Date.now();
    void gpsTownName(place).then(name => {
      if (!name || cfg.lat !== place.lat || cfg.lng !== place.lng || cfg.location !== place.location) return;
      cfg.location = name;
      store();
      render();
      if (fromTracking && cfg.autoLocation) status('Following ' + name);
    });
  }
  function trackPosition(pos) {
    if (!cfg.autoLocation || document.hidden) return;
    const place = positionPlace(pos);
    if (place.error) { status(place.error); return; }
    const accuracyKm = (Number(pos.coords.accuracy) || 0) / 1000;
    const threshold = Math.max(place.timeZone === cfg.timeZone ? 1 : 0.2, accuracyKm);
    if (kmApart(cfg, place) < threshold) return;
    applyLocation(place, true);
    status('Following ' + place.location);
  }
  function stopTracking() {
    if (geoWatch !== null && navigator.geolocation) navigator.geolocation.clearWatch(geoWatch);
    geoWatch = null;
  }
  function startTracking() {
    if (!cfg.autoLocation || document.hidden || !navigator.geolocation || geoWatch !== null) return;
    geoWatch = navigator.geolocation.watchPosition(trackPosition, geoError, {
      enableHighAccuracy:false, timeout:15000, maximumAge:60000
    });
  }
  function showCityResults(places) {
    const root = $('cityResults');
    root.replaceChildren();
    for (const place of places) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-result';
      button.textContent = place.location + ' · ' + (place.timeZone === 'Europe/Dublin' ? 'Ireland' : 'UK');
      button.addEventListener('click', () => {
        placeRequest++;
        gpsLoading = false;
        searchRequest++;
        fillLocation(place);
        root.replaceChildren();
        status(place.location + ' selected. Save to apply.');
      });
      root.append(button);
    }
  }
  async function citySearch() {
    const query = $('cityQuery').value.trim();
    if (query.length < 2) { status('Enter at least two letters of a town.'); return; }
    const request = ++searchRequest;
    const queryText = query.toLowerCase();
    const matches = SalahRegion.places.filter(([name, area, lat, lng, alias]) =>
      Boolean(name.toLowerCase().includes(queryText) || alias?.toLowerCase().includes(queryText)))
      .map(([name, area, lat, lng]) => ({ lat, lng, location:name + ', ' + area, timeZone:SalahRegion.zone(lat, lng) }));
    showCityResults(matches);
    if (!navigator.onLine) {
      status(matches.length ? 'Choose a town and save to apply.' : 'No offline matches. Enter coordinates or use GPS.');
      return;
    }
    status(matches.length ? 'Choose a town, or wait for more results.' : 'Searching for towns…');
    const url = 'https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&format=json&name=' + encodeURIComponent(query);
    const replies = await Promise.allSettled(['GB', 'IE'].map(code => fetchJson(url + '&countryCode=' + code)));
    if (request !== searchRequest) return;
    for (const reply of replies) {
      if (reply.status !== 'fulfilled') continue;
      for (const item of reply.value.results || []) {
        if (!['GB', 'IE'].includes(item.country_code)) continue;
        const { latitude:lat, longitude:lng } = item;
        const timeZone = SalahRegion.zone(lat, lng);
        if (!timeZone || matches.some(place => kmApart(place, { lat, lng }) < 0.75)) continue;
        const location = [item.name, item.admin1, item.country].filter(Boolean).join(', ');
        matches.push({ lat, lng, location, timeZone });
      }
    }
    showCityResults(matches);
    status(matches.length ? 'Choose a town and save to apply.' :
      replies.some(r => r.status === 'fulfilled') ? 'No matches. Try another name or enter coordinates.' : 'Town search is offline. Enter coordinates or use GPS.');
  }

  function applyAppearance() {
    document.body.dataset.theme = 'dark';
    document.body.dataset.layout = cfg.layout;
    document.body.dataset.accent = cfg.accent;
    $('settingsLayout').value=cfg.layout;
    $('settingsAccent').value=cfg.accent; $('settingsTimeFormat').value=cfg.timeFormat;
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#1c2d34';
  }
  function changeAppearance(kind, value) {
    cfg[kind] = value; store(); applyAppearance();
    if (kind === 'timeFormat') render();
  }
  [['settingsLayout','layout'],['settingsAccent','accent'],['settingsTimeFormat','timeFormat']].forEach(([id,key]) =>
    $(id).addEventListener('change', () => changeAppearance(key,$(id).value)));
  applyAppearance();

  $('closeSettings').addEventListener('click', () => showScreen('today')); 
  $('saveSettings').addEventListener('click', save);
  $('settingsDialog').querySelector('form').addEventListener('submit', e => { e.preventDefault(); save(); });
  document.querySelectorAll('input[name="method"]').forEach(r => r.addEventListener('change', updateCustomVisibility));

  $('setDerry').addEventListener('click', () => {
    placeRequest++; searchRequest++; gpsLoading = false;
    $('cityResults').replaceChildren();
    fillLocation(defaults);
    status('Derry selected. Save to apply.');
  });
  $('setGPS').addEventListener('click', () => {
    if (!navigator.geolocation) { status('GPS unavailable.'); return; }
    const request = ++placeRequest;
    gpsLoading = true;
    status('Requesting location permission…');
    navigator.geolocation.getCurrentPosition(pos => {
      if (request !== placeRequest) return;
      gpsLoading = false;
      const place = positionPlace(pos);
      if (place.error) { status(place.error); return; }
      fillLocation(place);
      status('GPS position found. Save to apply.');
      void gpsTownName(place).then(name => {
        if (name && request === placeRequest && Number($('latInput').value) === place.lat &&
            Number($('lngInput').value) === place.lng && $('placeInput').value === place.location) {
          $('placeInput').value = name;
        }
        if (name && request === placeRequest && cfg.lat === place.lat && cfg.lng === place.lng && cfg.location === place.location) {
          cfg.location = name;
          store();
          render();
        }
      });
    }, error => {
      if (request !== placeRequest) return;
      gpsLoading = false;
      geoError(error);
    }, { enableHighAccuracy:false, timeout:15000, maximumAge:60000 });
  });
  for (const id of ['latInput', 'lngInput']) $(id).addEventListener('input', () => {
    const lat = $('latInput').value, lng = $('lngInput').value;
    $('tzInput').value = lat && lng ? SalahRegion.zone(+lat, +lng) || '' : '';
  });
  $('citySearch').addEventListener('click', () => { void citySearch(); });
  $('cityQuery').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); void citySearch(); }
  });
  function showDate(key) {
    selectedKey = key;
    browsing = key !== todayKey();
    render();
  }
  for (const [id, step] of [['previousDay', -1], ['nextDay', 1], ['comparePrevious', -1], ['compareNext', 1]]) {
    $(id).addEventListener('click', () => showDate(dayShift(selectedKey, step)));
  }
  $('summerCompare').addEventListener('toggle', () => { if ($('summerCompare').open) renderSummerComparison(); });
  $('dateButton').addEventListener('click', () => {
    const input = $('nativeDate');
    try { if (typeof input.showPicker === 'function') { input.showPicker(); return; } } catch {}
    input.focus();
    input.click();
  });
  $('nativeDate').addEventListener('change', () => {
    const key = $('nativeDate').value;
    if (/^\d{4}-\d\d-\d\d$/.test(key) && Number.isFinite(+dateAtNoonUTC(key))) showDate(key);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTracking();
    else {
      if (!browsing) selectedKey = todayKey();
      render(); startTracking(); void cacheAdhansAutomatically();
    }
  });
  let lastToday = todayKey();
  setInterval(() => {
    if (document.hidden) return;
    const localDay = todayKey();
    if (localDay !== lastToday) {
      if (!browsing) selectedKey = localDay;
      lastToday = localDay;
      render();
    }
    if (dayInfo?.valid && selectedKey === localDay) {
      renderHero(dayInfo);
      if (Date.now() - lastListRefresh >= 30000) renderPrayerList(dayInfo);
    }
    checkPrayerSounds();
    if (navigator.onLine && [...failedOnline.values()].some(at => Date.now() - at >= 120000)) loadComparison();
  }, 15000);

  $('sourcePicker').addEventListener('click', e => {
    const btn = e.target.closest('button[data-source]');
    if (!btn || btn.disabled) return;
    cfg.activeSource = btn.dataset.source;
    store(); render();
  });

  $('refreshSources').addEventListener('click', () => {
    loadComparison(true);
    renderComparison();
  });

  let audioCtx = null, soundSeen = new Set();
  let savedAudioObjectUrl = null, mediaPlayer = null;
  function audioDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(Error('Local media storage unsupported')); return; }
      const request = indexedDB.open('salah-local-media-v3',1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('audio')) request.result.createObjectStore('audio'); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('Storage error'));
    });
  }
  async function audioData(action, blob, key='custom') {
    const db = await audioDb();
    try {
      return await new Promise((resolve,reject) => {
        const tx = db.transaction('audio', action==='read' ? 'readonly' : 'readwrite');
        const req = action==='read' ? tx.objectStore('audio').get(key) :
          action==='write' ? tx.objectStore('audio').put(blob,key) : tx.objectStore('audio').delete(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  async function updateAudioStatus() {
    try {
      const blob = await audioData('read');
      if (savedAudioObjectUrl) URL.revokeObjectURL(savedAudioObjectUrl);
      savedAudioObjectUrl = blob ? URL.createObjectURL(blob) : null;
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
      stopMedia(); cfg.soundChoice='custom'; $('soundChoice').value='custom';store(); updateVolumeUI();
      await updateAudioStatus(); $('soundStatus').textContent='Custom sound saved locally. Test it to check playback.';
    } catch(e) { $('soundStatus').textContent=`Could not save sound: ${e.message}.` }
  });

  $('clearAudio').addEventListener('click', async () => {
    try {
      await audioData('delete');
      stopMedia();
      if (cfg.soundChoice === 'custom') {
        cfg.soundChoice = 'soft';
        $('soundChoice').value = 'soft';
        updateVolumeUI();
        store();
      }
      await updateAudioStatus();
      $('soundStatus').textContent = 'Saved custom sound removed.';
    } catch {
      $('soundStatus').textContent = 'Unable to remove the saved sound.';
    }
  });

  void updateAudioStatus();

  function audioTone(ctx, freq, at, duration, volume) {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(volume*(cfg.soundVolume/100),at+.03);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(at); osc.stop(at+duration+.03);
  }
  const ADHAN_RECORDINGS = Object.freeze({
    'adhan-abu-bakr': 'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/fajr-abu-bakr.mp3',
    'adhan-fajr-abu-bakr': 'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/abu-bakr.mp3',
    'adhan-thabet': 'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/thabet.mp3'
  });
  const cachedAdhanUrls = new Map();
  const adhanChoices = Object.keys(ADHAN_RECORDINGS);
  let cachingAdhans = null;
  let lastAudioCacheAttempt = 0;
  async function loadSavedAdhans() {
    for (const choice of adhanChoices) {
      if (cachedAdhanUrls.has(choice)) continue;
      try {
        const blob = await audioData('read', null, choice);
        if (blob && blob.size >= 10000) cachedAdhanUrls.set(choice, URL.createObjectURL(blob));
      } catch {}
    }
  }
  async function cacheAdhansAutomatically() {
    if (cachingAdhans) return cachingAdhans;
    if (!navigator.onLine || Date.now() - lastAudioCacheAttempt < 10 * 60000) return;
    lastAudioCacheAttempt = Date.now();
    cachingAdhans = (async () => {
      await loadSavedAdhans();
      const choices = [cfg.soundChoice, ...adhanChoices].filter((x,i,arr)=>ADHAN_RECORDINGS[x] && arr.indexOf(x) === i);
      for (const choice of choices) {
        if (cachedAdhanUrls.has(choice)) continue;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);
          const result = await fetch(ADHAN_RECORDINGS[choice], { cache:'force-cache', signal:controller.signal })
            .finally(() => clearTimeout(timeout));
          if (!result.ok) continue;
          const blob = await result.blob();
          if (blob.size < 10000 || blob.size > 8 * 1048576) continue;
          await audioData('write', blob, choice);
          cachedAdhanUrls.set(choice, URL.createObjectURL(blob));
        } catch {}
      }
    })();
    try { await cachingAdhans; } finally { cachingAdhans = null; }
  }
  void loadSavedAdhans().then(() => cacheAdhansAutomatically());

  function stopMedia() {
    if (!mediaPlayer) return;
    mediaPlayer.pause();
    mediaPlayer.currentTime = 0;
  }
  async function playMedia(source, label) {
    try {
      if (!mediaPlayer) mediaPlayer = new Audio(source);
      else {
        stopMedia();
        if (mediaPlayer.src !== source) mediaPlayer.src = source;
      }
      mediaPlayer.preload = 'auto';
      mediaPlayer.volume = cfg.soundVolume / 100;
      mediaPlayer.onended = () => { $('soundStatus').textContent = 'Audio finished.'; };
      mediaPlayer.onerror = () => { $('soundStatus').textContent = 'Audio could not load.'; };
      await mediaPlayer.play();
      $('soundStatus').textContent = label;
      return true;
    } catch {
      $('soundStatus').textContent = 'Audio could not play. Tap Play sound while Salah is open.';
      return false;
    }
  }
  function playAdhan(choice = cfg.soundChoice) {
    const local = cachedAdhanUrls.get(choice);
    const source = local || ADHAN_RECORDINGS[choice];
    if (!source || (!local && !navigator.onLine)) {
      $('soundStatus').textContent = 'This adhan is unavailable offline. Open Salah online to save it.';
      return false;
    }
    return playMedia(source, local ? 'Playing adhan.' : 'Playing adhan from the internet.');
  }

  function playReminderChime() {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') void audioCtx.resume().catch(() => {});
      const a=audioCtx.currentTime+.02;
      audioTone(audioCtx,550,a,.25,.06);audioTone(audioCtx,740,a+.28,.30,.06);
    } catch {}
  }

  async function playSound(choice = cfg.soundChoice) {
    if (choice === 'off') { $('soundStatus').textContent = 'Sound is set to Silent.'; return false; }
    if (choice.startsWith('adhan-')) return playAdhan(choice);
    if (choice === 'custom') {
      if (savedAudioObjectUrl) return playMedia(savedAudioObjectUrl, 'Playing your saved sound.');
      $('soundStatus').textContent = 'Import a custom audio file first.';
      return false;
    }
    try {
      stopMedia();
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const t = audioCtx.currentTime + 0.04;
      if (choice === 'bell') {
        audioTone(audioCtx, 880, t, 0.7, 0.095);
        audioTone(audioCtx, 1320, t + 0.12, 0.65, 0.045);
      } else {
        audioTone(audioCtx, 660, t, 0.48, 0.08);
        audioTone(audioCtx, 830, t + 0.48, 0.62, 0.07);
      }
      $('soundStatus').textContent = 'Playing chime.';
      return true;
    } catch {
      $('soundStatus').textContent = 'Audio could not play. Tap Play sound while Salah is open.';
      return false;
    }
  }

  $('soundChoice').value = cfg.soundChoice;
  $('soundVolume').value=String(cfg.soundVolume);
  $('soundVolumeLabel').textContent=`${cfg.soundVolume}%`;
  $('soundVolume').addEventListener('input',()=>{
    cfg.soundVolume=+ $('soundVolume').value;
    $('soundVolumeLabel').textContent=`${cfg.soundVolume}%`;
    if (mediaPlayer) mediaPlayer.volume = cfg.soundVolume / 100;
    store();
  });
  function updateVolumeUI() {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
    const streamedOrCustom = cfg.soundChoice.startsWith('adhan-') || cfg.soundChoice==='custom';
    document.querySelector('.volume-controls').classList.toggle('hidden',ios && streamedOrCustom);
    $('iosVolumeNote').classList.toggle('hidden',!(ios && streamedOrCustom));
  }
  updateVolumeUI();
  $('calendarLead').value = String(cfg.calendarLead);
  $('soundChoice').addEventListener('change', () => {
    stopMedia();
    cfg.soundChoice = $('soundChoice').value; store(); updateVolumeUI(); void cacheAdhansAutomatically();
    $('soundStatus').textContent = 'Sound saved. Test it using Play sound.';
  });
  $('testSound').addEventListener('click', () => { void playSound(); });
  $('stopSound').addEventListener('click', () => {
    stopMedia();
    $('soundStatus').textContent='Sound stopped.';
  });

  function checkPrayerSounds() {
    if (document.hidden || cfg.soundChoice === 'off') return;
    const now = Date.now(), today = todayKey();
    const days = [dayShift(today, -1), today, dayShift(today, 1)];
    soundSeen = new Set([...soundSeen].filter(id => days.includes(id.slice(0, 10))));
    for (const key of days) {
      const day = getDay(key);
      if (!day.valid || day.sourceFallback) continue;
      for (const p of prayers) {
        if (p.key === 'isha' && !day.nextFajr) continue;
        const event = prayerEvent(day, p);
        if (!event) continue;
        const at = event.at.getTime();
        const id = key + ':' + p.key;
        const pre = id + ':before';
        const reminder = at - cfg.calendarLead * 60000;
        if (now >= reminder && now < reminder + 45000 && !soundSeen.has(pre)) {
          soundSeen.add(pre);
          playReminderChime();
          $('soundStatus').textContent = p.en + ' is about 15 minutes away' + (event.estimated ? ' (estimate).' : '.');
        }
        if (now >= at && now < at + 45000 && !soundSeen.has(id)) {
          soundSeen.add(id);
          const choice = cfg.soundChoice === 'adhan-abu-bakr' && p.key !== 'fajr' ? 'adhan-fajr-abu-bakr' : cfg.soundChoice;
          void playSound(choice);
        }
      }
    }
  }

  function iCalStamp(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
  function escapeCal(text) {
    return text.replace(/\r\n?/g, '\n').replace(/[\\;,\n]/g, char => char === '\n' ? '\\n' : '\\' + char);
  }
  const calEncoder = new TextEncoder();
  function foldCal(line) {
    if (calEncoder.encode(line).length <= 75) return line;
    let out = '', width = 0;
    for (const char of line) {
      const bytes = calEncoder.encode(char).length;
      if (width + bytes > 75) { out += '\r\n '; width = 1; }
      out += char;
      width += bytes;
    }
    return out;
  }
  function makeCalendar() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Salah//Prayer calendar//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Salah prayer reminders'];
    const online = cfg.activeSource === 'moonsighting';
    const dayCount = online ? 1 : 60;
    const source = methods.find(m => m.id === cfg.activeSource).title;
    let eventCount = 0, skipped = 0;
    for (let i = 0; i < dayCount; i++) {
      const key = dayShift(selectedKey, i);
      const day = getDay(key);
      for (const prayer of prayers) {
        const event = day.sourceFallback || (prayer.key === 'isha' && !day.nextFajr) ? null : prayerEvent(day, prayer);
        if (!event) { skipped++; continue; }
        eventCount++;
        const summary = prayer.en + ' · Salah' + (event.estimated ? ' (estimate)' : '');
        const description = cfg.location + ' · ' + source +
          (event.estimated ? ' · Modelled twilight estimate' : ' · Calculated time');
        lines.push('BEGIN:VEVENT',
          'UID:salah-' + cfg.activeSource + '-' + prayer.key + '-' + key + '-' + cfg.lat + '-' + cfg.lng + '@salah.local',
          'DTSTAMP:' + iCalStamp(new Date()), 'DTSTART:' + iCalStamp(event.at),
          'DTEND:' + iCalStamp(new Date(+event.at + 60000)),
          'SUMMARY:' + escapeCal(summary), 'DESCRIPTION:' + escapeCal(description),
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + escapeCal(summary),
          'TRIGGER:-PT' + cfg.calendarLead + 'M', 'END:VALARM', 'END:VEVENT');
      }
    }
    lines.push('END:VCALENDAR');
    return { ics:lines.map(foldCal).join('\r\n') + '\r\n', online, eventCount, skipped };
  }
  $('exportCalendar').addEventListener('click', () => {
    const result = makeCalendar();
    if (!result.eventCount) {
      $('calendarStatus').textContent = 'No times to export for this source and date.';
      return;
    }
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([result.ics], { type:'text/calendar;charset=utf-8' }));
    link.href = url;
    link.download = 'salah-' + selectedKey + '-' + cfg.activeSource + '.ics';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    const span = result.online ? ' for the selected date.' : ' for 60 days from the selected date.';
    const skipped = result.skipped ? ' Skipped ' + result.skipped + ' unavailable prayer windows.' : '';
    $('calendarStatus').textContent = 'Exported ' + result.eventCount + ' events' + span + skipped;
  });

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

  let qiblaHeading = null, magneticVariation = null, qiblaCompassOn = false, lastAlignment = false;
  let compassSensorAccuracy = NaN, variationPromise = null, variationKey = '';
  const bearingNow = () => qiblaBearing(cfg.lat, cfg.lng);

  function resetMagneticCorrection() {
    cfg.magneticDeclination = '';
    $('declinationOverride').value = '';
    variationKey = '';
    magneticVariation = null;
  }
  function renderQibla() {
    const bearing = bearingNow();
    $('qiblaBearing').textContent = bearing.toFixed(1) + '°';
    $('qiblaCardinal').textContent = compassPoints[Math.round(bearing / 22.5) % 16];
    $('qiblaPosition').textContent = cfg.location + ' · true-north bearing';
    const override = $('declinationOverride').value.trim();
    const delta = override !== '' ? Number(override) : magneticVariation;
    const reliable = Number.isFinite(compassSensorAccuracy) && compassSensorAccuracy >= 0 && compassSensorAccuracy <= 20;
    const live = Number.isFinite(qiblaHeading) && Number.isFinite(delta) && Math.abs(delta) <= 180 && qiblaCompassOn && reliable;
    const difference = live ? (bearing - qiblaHeading - delta + 540) % 360 - 180 : 0;
    $('qiblaArrow').style.transform = 'translate(-50%, -50%) rotate(' + (live ? difference : bearing).toFixed(2) + 'deg)';
    $('qiblaDial').classList.toggle('live', live);
    const aligned = live && Math.abs(difference) <= 4 && compassSensorAccuracy <= 8;
    $('qiblaDial').classList.toggle('aligned', aligned);
    $('qiblaAligned').textContent = aligned ? 'Aligned within compass accuracy' :
      live ? Math.round(Math.abs(difference)) + '° ' + (difference > 0 ? 'right' : 'left') + ' · turn the phone' :
      'True-north reference';
    if (aligned && !lastAlignment && $('qiblaHaptic').checked && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate([35, 35, 65]); } catch {}
    }
    lastAlignment = aligned;
    if (live) {
      $('qiblaState').textContent = 'Magnetic heading ' + Math.round(qiblaHeading) + '° · correction ' + delta.toFixed(1) + '° ' +
        (override === '' ? '(WMM 2025)' : '(manual)');
      $('qiblaAccuracy').textContent = 'Sensor uncertainty about ±' + Math.round(compassSensorAccuracy) + '°. Hold flat, away from metal.';
    } else if (qiblaCompassOn && Number.isFinite(compassSensorAccuracy) && !reliable) {
      $('qiblaAccuracy').textContent = 'Compass reading is not accurate enough for a live pointer. Calibrate away from metal and try again.';
    } else {
      $('qiblaAccuracy').textContent = 'Hold the phone flat, away from magnets and metal. The bearing is measured clockwise from true north.';
    }
  }
  async function loadVariation() {
    const now = new Date();
    const lat = cfg.lat, lng = cfg.lng;
    const key = [lat, lng, now.getUTCFullYear(), now.getUTCMonth()].join(':');
    if (variationKey === key) return variationPromise;
    variationKey = key;
    variationPromise = (async () => {
      try {
        const model = await import('./vendor/magvar/magvar.mjs');
        if (now.getUTCFullYear() < model.MODEL_EPOCH || now.getUTCFullYear() >= model.MODEL_VALID_UNTIL) throw Error('Model date');
        const value = model.magvar(lat, lng, 0, now);
        if (!Number.isFinite(value) || Math.abs(value) > 180) throw Error('Model value');
        if (variationKey === key) magneticVariation = value;
        return true;
      } catch {
        if (variationKey === key) { magneticVariation = null; variationKey = ''; }
        return false;
      }
    })();
    return variationPromise;
  }
  function orientationHandler(event) {
    if (document.hidden || $('qiblaPanel').hidden) return;
    const heading = event.webkitCompassHeading;
    const accuracy = event.webkitCompassAccuracy;
    qiblaHeading = Number.isFinite(heading) && heading >= 0 ? norm360(heading) : null;
    compassSensorAccuracy = Number.isFinite(accuracy) ? accuracy : NaN;
    if (qiblaHeading === null || !Number.isFinite(compassSensorAccuracy))
      $('qiblaState').textContent = 'Heading or accuracy unavailable. Use the true-north bearing.';
    else if (compassSensorAccuracy < 0)
      $('qiblaState').textContent = 'Calibrate the compass away from metal and try again.';
    else if (compassSensorAccuracy > 20)
      $('qiblaState').textContent = 'Compass reading too uncertain. Use the true-north bearing.';
    renderQibla();
  }
  $('startCompass').addEventListener('click', async () => {
    if (!window.isSecureContext) { $('qiblaState').textContent = 'Compass access requires HTTPS.'; return; }
    if (typeof DeviceOrientationEvent === 'undefined') {
      $('qiblaState').textContent = 'This device provides no compass heading.';
      return;
    }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function' &&
          await DeviceOrientationEvent.requestPermission() !== 'granted') {
        $('qiblaState').textContent = 'Motion permission denied. Use the true-north bearing.';
        return;
      }
      if ($('qiblaPanel').hidden) return;
      qiblaCompassOn = true;
      $('startCompass').textContent = 'Compass active';
      $('qiblaState').textContent = 'Waiting for a usable compass reading…';
      window.addEventListener('deviceorientation', orientationHandler);
      if (!await loadVariation() && !$('declinationOverride').value.trim())
        $('qiblaState').textContent = 'Magnetic correction unavailable. Enter a local correction or use the true-north bearing.';
      renderQibla();
    } catch {
      $('qiblaState').textContent = 'Compass access failed. Use the true-north bearing.';
    }
  });
  $('qiblaGPS').addEventListener('click', () => {
    if (!navigator.geolocation) { $('qiblaState').textContent = 'GPS unavailable.'; return; }
    $('qiblaState').textContent = 'Getting current GPS position…';
    const request = ++placeRequest;
    navigator.geolocation.getCurrentPosition(pos => {
      if (request !== placeRequest) return;
      const place = positionPlace(pos);
      if (place.error) { $('qiblaState').textContent = place.error; return; }
      applyLocation(place);
      $('qiblaState').textContent = 'Position updated for Qibla and prayer times.';
    }, () => {
      if (request === placeRequest) $('qiblaState').textContent = 'GPS unavailable. Keeping the saved position.';
    }, { enableHighAccuracy:true, timeout:12000, maximumAge:15000 });
  });
  $('declinationOverride').value = cfg.magneticDeclination;
  $('declinationOverride').addEventListener('input', () => {
    const value = $('declinationOverride').value;
    if (Math.abs(+value) <= 180) { cfg.magneticDeclination = value; store(); }
    renderQibla();
  });
  $('clearDeclination').addEventListener('click', () => {
    $('declinationOverride').value = '';
    cfg.magneticDeclination = '';
    store();
    if (qiblaCompassOn) void loadVariation().then(renderQibla);
    renderQibla();
  });

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
    await playSound();
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

  const screenIds = {today:'today', compare:'comparisonPanel', qibla:'qiblaPanel', sounds:'soundPanel', settings:'settingsDialog'};
  function showScreen(target) {
    if (!screenIds[target]) target = 'today';
    for (const [name,id] of Object.entries(screenIds)) {
      $(id).hidden = name !== target;
    }
    document.querySelectorAll('[data-screen-target]').forEach(button => {
      const active = button.dataset.screenTarget === target;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      button.tabIndex = active ? 0 : -1;
    });
    if (target === 'settings') showSettings();
    if (target === 'compare') renderComparison();
    if (target === 'qibla') {
      renderQibla();
      if (qiblaCompassOn) void loadVariation().then(renderQibla);
    } else if (qiblaCompassOn) {
      window.removeEventListener('deviceorientation', orientationHandler);
      qiblaCompassOn = false;
      qiblaHeading = null;
      $('startCompass').textContent = 'Start compass';
    }
    try { window.history.replaceState(null,'',location.pathname+location.search+'#'+target); } catch {}
    window.scrollTo({top:0,behavior:'instant'});
  }
  document.querySelector('.app-dock').addEventListener('click', e => {
    const button = e.target.closest('button[data-screen-target]');
    if (button) showScreen(button.dataset.screenTarget);
  });
  document.querySelector('.app-dock').addEventListener('keydown',e=>{
    const controls=[...document.querySelectorAll('.app-dock button')];
    const idx=controls.indexOf(document.activeElement);
    if(idx<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();
    const next=e.key==='Home'?0:e.key==='End'?controls.length-1:(idx+(e.key==='ArrowRight'?1:-1)+controls.length)%controls.length;
    controls[next].tabIndex=0;controls[next].focus();showScreen(controls[next].dataset.screenTarget);
  });
  showScreen(['today','compare','qibla','sounds','settings'].includes(location.hash.slice(1))?location.hash.slice(1):'today');

  window.addEventListener('online', () => { $('offlineIndicator').hidden=true; failedOnline.clear(); loadComparison(); void cacheAdhansAutomatically(); });
  window.addEventListener('offline', () => { $('offlineIndicator').hidden=false; render(); });

  basicChecks();
  renderQibla();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  render(); startTracking();
})();

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const defaults = {
    lat: 54.9966, lng: -7.3086, location: 'Derry, Northern Ireland', timeZone: 'Europe/London',
    autoLocation: false, method: '15-13', fajrAngle: 15, ishaAngle: 13,
    ishaPreference: 'around-third', ishaLimit: 'half', magneticDeclination: '', highLatRule: 'seventh', activeSource: 'angles', soundChoice: 'adhan-abu-bakr', soundVolume: 40, onlineCompare: true, reminderLead: 15, reminderEnabled: true, qiblaHaptic: true, qiblaChime: false, timeFormat: '12', layout: 'compact', accent: 'forest'
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



  const palettes = {
    forest:'Forest green', ocean:'Ocean blue', midnight:'Midnight navy', sand:'Amber sand', slate:'Cool slate'
  };
  const layouts = {
    compact:'Compact prayer rows and a clean compass.',
    timeline:'A timeline with markers for earlier and upcoming prayers.',
    horizon:'A daily Sun path and a softly lit compass.',
    tiles:'Prayer tiles and a boxed compass with separate readings.'
  };
  const reminderLeads = [15, 20, 25, 30];
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
      c.soundVolume = Number.isFinite(+c.soundVolume) ? Math.max(0, Math.min(100, +c.soundVolume)) : defaults.soundVolume;
      const lead = Number(raw.reminderLead ?? raw.calendarLead);
      c.reminderLead = reminderLeads.includes(lead) ? lead : defaults.reminderLead;
      c.reminderEnabled = c.reminderEnabled !== false;
      c.qiblaHaptic = c.qiblaHaptic !== false;
      c.qiblaChime = c.qiblaChime === true;
      delete c.calendarLead;
      delete c.theme;
      c.timeFormat = ['12','24'].includes(String(c.timeFormat)) ? String(c.timeFormat) : '12';
      c.layout = Object.hasOwn(layouts, c.layout) ? c.layout : defaults.layout;
      if (c.accent === 'dusk') c.accent = 'midnight';
      c.accent = Object.hasOwn(palettes, c.accent) ? c.accent : defaults.accent;
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
  let currentHero = null, sunChart = null;
  let geoWatch = null, placeRequest = 0, searchRequest = 0, lastTrackingLookup = 0;

  function note(message) {
    $('notice').textContent = message;
    $('notice').classList.toggle('hidden', !message);
  }


  const methods = [
    { id:'angles', title:'Your angles', sub:'Local calculation' },
    { id:'tayba', title:'Tayba', sub:'Seasonal Fajr · red twilight model' },
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
          todayKey(), dayShift(todayKey(), -1), dayShift(todayKey(), 1), fastingKey].includes(key)) render();
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
      { id:'tayba', title:'Tayba', desc:'Earlier Isha', day:localDay(selectedKey, 'tayba') },
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
      kind:'avoid', icon:'alert', desc:'Avoid optional prayers for about ' +
        Math.max(5, 5 * Math.round((range.end - range.start) / 300000)) + ' minutes'
    }));
    const sorted = [...events, ...limits, thirds, half].filter(e => e.at instanceof Date && Number.isFinite(+e.at))
      .sort((a,b) => a.at - b.at);

    const currentIndex = current ? sorted.reduce((index,e,i) => e.at <= now ? i : index, -1) : -1;
    const nextIndex = current ? sorted.findIndex(e => e.at > now && e.name && e.name.key !== 'sunrise' && (e.name.key !== 'isha' || ishaHasWindow(t))) : -1;
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
      return `<div class="time-row ${e.kind === 'prayer' ? 'prayer-entry' : e.kind === 'night' ? 'night-summary' : 'avoid-entry'} ${phase} ${isCurrent ? 'current-prayer' : ''} ${activeRange ? 'within-range' : ''}" data-event="${e.name?.key || e.kind}" data-event-time="${e.at.getTime()}">
        <span class="time-icon">${svgIcon(e.name?.icon || e.icon)}</span>
        <div class="time-text"><div class="time-name">${e.title}${e.estimated ? '<span class="estimate-dot">EST.</span>' : ''}${label}</div><div class="time-desc">${e.desc}</div></div>
        <div class="time-data"><time class="time-value" datetime="${e.at.toISOString()}">${fmt(e.at)}</time>${extra}${following}</div>
      </div>`;
    }).join('');
    for (const [name, position] of [[names[0], 'afterbegin'], [names.at(-1), 'beforeend']]) {
      if (t[name.key]) continue;
      list.insertAdjacentHTML(position, `<div class="time-row prayer-entry" data-event="${name.key}"><span class="time-icon">${svgIcon(name.icon)}</span>
        <div class="time-text"><div class="time-name">${name.en}</div><div class="time-desc">Time unavailable</div></div>
        <div class="time-data">—</div></div>`);
    }
  }
  function drawSunChart(day) {
    const chart = $('sunChart');
    chart.hidden = cfg.layout !== 'horizon' || !day?.valid;
    if (chart.hidden) { sunChart = null; return; }
    const start = +SalahProviders.localToUtc(selectedKey, 0, 0, cfg.timeZone);
    const localEnd = +SalahProviders.localToUtc(dayShift(selectedKey, 1), 0, 0, cfg.timeZone);
    const end = Math.max(localEnd, day.isha ? +day.isha + 600000 : localEnd);
    const id = [start, end, cfg.lat, cfg.lng, ...names.map(({key}) => +day[key])].join(':');
    if (sunChart?.id === id) return;
    const altitude = ms => SalahSolar.altitudeAt(ms, cfg.lat, cfg.lng);
    const samples = Array.from({length:73}, (_, i) => altitude(start + (end - start) * i / 72));
    const low = Math.min(-15, ...samples), high = Math.max(7, ...samples);
    const x = time => 6 + 348 * (time - start) / (end - start);
    const y = angle => 104 - 94 * (angle - low) / (high - low);
    const path = samples.map((angle, i) => (i ? 'L' : 'M') + (6 + 348 * i / 72).toFixed(1) + ' ' + y(angle).toFixed(1)).join(' ');
    $('sunAreaPath').setAttribute('d', path + ' L354 111 H6Z');
    $('sunRoute').setAttribute('d', path);
    $('sunRouteLive').setAttribute('d', path);
    $('sunHorizon').setAttribute('d', 'M6 ' + y(0).toFixed(1) + ' H354');
    $('sunChartDots').innerHTML = names.filter(({key}) => day[key]).map(({key, en}) => {
      const time = +day[key];
      return `<circle class="sun-chart-dot" cx="${x(time).toFixed(1)}" cy="${y(altitude(time)).toFixed(1)}" r="3.5"><title>${en}</title></circle>`;
    }).join('');
    sunChart = { id, altitude, x, y, start, end };
    updateSunChart(Date.now());
  }
  function updateSunChart(now) {
    if (!sunChart) return;
    const { altitude, x, y, start, end } = sunChart;
    const live = selectedKey === todayKey() && now >= start && now <= end;
    $('sunProgressFill').setAttribute('width', live ? x(now).toFixed(1) : '0');
    const elevation = live ? altitude(now) : null;
    for (const id of ['sunPosition', 'sunPositionHalo']) {
      const marker = $(id);
      marker.style.display = live ? '' : 'none';
      if (live) {
        marker.setAttribute('cx', x(now).toFixed(1));
        marker.setAttribute('cy', y(elevation).toFixed(1));
      }
    }
    $('sunAltitudeLabel').textContent = live ? Math.round(elevation) + '° now' : '';
  }
  function updateCountdown(now = Date.now()) {
    if (!currentHero) return;
    const remaining = Math.max(0, Math.ceil((currentHero.at - now) / 1000));
    const hour = Math.floor(remaining / 3600);
    const minute = Math.floor(remaining % 3600 / 60);
    const second = remaining % 60;
    const timer = hour + ':' + String(minute).padStart(2, '0') + ':' + String(second).padStart(2, '0');
    $('countdown').textContent = 'In ' + timer + currentHero.following + currentHero.estimated;
  }
  function setHero(event, now, otherDate = false) {
    currentHero = null;
    $('nextPrayerName').textContent = event?.en || 'Unavailable';
    $('nextPrayerArabic').textContent = event?.ar || '';
    $('nextPrayerArabic').hidden = !event?.ar;
    $('nextPrayerTime').textContent = fmt(event?.at);
    if (!event) { $('countdown').textContent = 'No upcoming time available'; return; }
    const estimated = event.estimated ? ' · estimate' : '';
    if (otherDate) { $('countdown').textContent = 'First listed prayer' + estimated; return; }
    currentHero = { at:event.at, estimated,
      following:dateParts(event.at, cfg.timeZone) !== selectedKey ? ' · tomorrow' : '' };
    updateCountdown(+now);
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
        const first = prayers.map(p => prayerEvent(next, p)).find(event => event && event.at > now);
        if (first) upcoming.push(first);
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
    if (live && !limits && state.label === 'Between prayers') {
      const [rise, noon] = SalahSolar.daylightRestrictions(dateAtNoonUTC(selectedKey), cfg.lat, cfg.lng);
      if (rise?.end <= instant && instant < noon?.start) {
        state.label = 'Duha time';
        state.desc = 'Until about ' + fmt(noon.start);
      }
    }
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
    if (!$('fastingPanel').hidden) renderFasting();
    if (!$('soundPanel').hidden) renderReminderNext();
    drawSunChart(dayInfo);
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

  const paletteChoices = $('paletteChoices');
  paletteChoices.innerHTML = Object.entries(palettes).map(([id, label]) =>
    `<button type="button" class="palette-choice" data-palette="${id}"><span class="palette-sample" aria-hidden="true"><i></i><i></i><i></i></span>${label}</button>`).join('');
  function applyAppearance() {
    document.body.dataset.layout = cfg.layout;
    document.body.dataset.accent = cfg.accent;
    $('settingsLayout').value = cfg.layout;
    $('settingsTimeFormat').value = cfg.timeFormat;
    $('stylePreview').textContent = layouts[cfg.layout];
    for (const choice of paletteChoices.children) choice.setAttribute('aria-pressed', choice.dataset.palette === cfg.accent);
    const background = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    document.documentElement.style.backgroundColor = background;
    document.querySelector('meta[name="theme-color"]').content = background;
    const iconBase = cfg.accent === 'forest' ? './icons/' : './icons/' + cfg.accent + '/';
    $('tabIcon').href = iconBase + 'icon-192.png';
    $('touchIcon').href = iconBase + 'icon-180.png';
    $('appManifest').href = cfg.accent === 'forest' ? './manifest.webmanifest' : './manifest-' + cfg.accent + '.webmanifest';
  }
  function changeAppearance(kind, value) {
    cfg[kind] = value;
    store();
    applyAppearance();
    if (kind === 'timeFormat') render();
    if (kind === 'layout') drawSunChart(dayInfo);
  }
  $('settingsLayout').addEventListener('change', () => changeAppearance('layout', $('settingsLayout').value));
  $('settingsTimeFormat').addEventListener('change', () => changeAppearance('timeFormat', $('settingsTimeFormat').value));
  paletteChoices.addEventListener('click', event => {
    const choice = event.target.closest('[data-palette]');
    if (choice) changeAppearance('accent', choice.dataset.palette);
  });
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
      if (fastingFollowingToday) fastingKey = todayKey();
      render();
      startTracking();
      cacheAdhansAutomatically();
      checkPrayerSounds();
    }
  });
  setInterval(() => {
    if (document.hidden || $('today').hidden || selectedKey !== todayKey()) return;
    const now = Date.now();
    if (currentHero && currentHero.at <= now && dayInfo?.valid) renderHero(dayInfo);
    else updateCountdown(now);
  }, 1000);
  let lastToday = todayKey();
  setInterval(() => {
    if (document.hidden) return;
    const localDay = todayKey();
    if (localDay !== lastToday) {
      if (!browsing) selectedKey = localDay;
      if (fastingFollowingToday) fastingKey = localDay;
      lastToday = localDay;
      render();
    }
    if (dayInfo?.valid && selectedKey === localDay && !$('today').hidden) {
      renderHero(dayInfo);
      updateSunChart(Date.now());
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

  const audio = SalahAudio.create(cfg.soundVolume);
  const reminderNotes = [[550, 0, .25, .09], [740, .27, .30, .09]];
  const softNotes = [[660, 0, .42, .12], [830, .4, .55, .11]];
  const bellNotes = [[880, 0, .7, .15], [1320, .12, .65, .09]];
  const alignmentNotes = [[740, 0, .13, .08], [990, .14, .24, .10]];
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ADHAN_RECORDINGS = Object.freeze({
    'adhan-abu-bakr':'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/fajr-abu-bakr.mp3',
    'adhan-fajr-abu-bakr':'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/abu-bakr.mp3',
    'adhan-thabet':'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/thabet.mp3'
  });
  const recordings = new Map(), pendingRecordings = new Map();
  let savedSound, customUpdate = 0, lastAudioCacheAttempt = null, toastTimer, soundRequest = 0;

  function audioDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(Error('Local media storage unavailable')); return; }
      const request = indexedDB.open('salah-local-media-v3', 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('audio')) request.result.createObjectStore('audio');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('Storage error'));
      request.onblocked = () => reject(Error('Media storage is busy'));
    });
  }
  async function audioData(action, blob, key = 'custom') {
    const db = await audioDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('audio', action === 'read' ? 'readonly' : 'readwrite');
        const store = tx.objectStore('audio');
        const req = action === 'read' ? store.get(key) : action === 'write' ? store.put(blob, key) : store.delete(key);
        tx.oncomplete = () => resolve(req.result);
        tx.onabort = () => reject(tx.error || Error('Media storage operation failed'));
        tx.onerror = () => reject(tx.error || req.error || Error('Media storage unavailable'));
      });
    } finally { db.close(); }
  }
  async function loadCustomSound() {
    const update = customUpdate;
    try {
      const blob = await audioData('read');
      if (update !== customUpdate) return;
      savedSound = blob;
      $('savedAudioStatus').textContent = blob ? 'Saved locally · ' + (blob.size / 1048576).toFixed(1) + ' MB' :
        'No imported audio saved.';
    } catch { $('savedAudioStatus').textContent = 'Custom audio storage is unavailable.'; }
  }
  async function readRecording(choice) {
    if (recordings.has(choice)) return recordings.get(choice);
    if (pendingRecordings.has(choice)) return pendingRecordings.get(choice);
    const task = (async () => {
      let blob;
      try { blob = await audioData('read', null, choice); } catch {}
      if (!blob && navigator.onLine) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch(ADHAN_RECORDINGS[choice], { cache:'force-cache', signal:controller.signal });
          if (!response.ok) return null;
          blob = await response.blob();
          if (blob.size < 10000 || blob.size > 8 * 1048576) return null;
          try { await audioData('write', blob, choice); } catch {}
        } catch { return null; }
        finally { clearTimeout(timer); }
      }
      if (blob) recordings.set(choice, blob);
      return blob;
    })();
    pendingRecordings.set(choice, task);
    try { return await task; } finally { pendingRecordings.delete(choice); }
  }
  function cacheAdhansAutomatically() {
    if (lastAudioCacheAttempt !== null && Date.now() - lastAudioCacheAttempt < 600000) return;
    lastAudioCacheAttempt = Date.now();
    for (const choice of Object.keys(ADHAN_RECORDINGS)) void readRecording(choice);
  }

  function stopSound() {
    soundRequest++;
    audio.stop();
  }

  async function playSound(choice = cfg.soundChoice, fromTap = false) {
    const request = ++soundRequest;
    const status = $('soundStatus');
    if (choice === 'off' || choice === 'soft' || choice === 'bell') {
      audio.stop();
      const ready = fromTap ? await audio.unlock() : audio.ready();
      if (request !== soundRequest) return;
      if (choice === 'off') { status.textContent = ready ? 'Prayer-time sound is silent. Reminder audio is ready.' : 'Prayer-time sound is silent.'; return; }
      status.textContent = ready && audio.chime(choice === 'bell' ? bellNotes : softNotes) ? 'Playing chime.' :
        'Tap Play sound to start audio for this session.';
      return;
    }

    const blob = choice === 'custom' ? Promise.resolve(savedSound) : readRecording(choice);
    const url = navigator.onLine ? ADHAN_RECORDINGS[choice] : null;
    status.textContent = 'Loading sound…';
    try {
      if (choice === 'custom' && !savedSound) throw Error('Import an audio file first.');
      const mode = await audio.play(blob, url, fromTap, () => { status.textContent = 'Audio finished.'; });
      if (!mode || request !== soundRequest) return;
      status.textContent = mode === 'device' && isIOS ? 'Playing. Use the iPhone’s volume buttons for this recording.' :
        choice === 'custom' ? 'Playing your sound.' : 'Playing adhan.';
    } catch (error) {
      if (request !== soundRequest) return;
      status.textContent = error instanceof DOMException ? 'Audio playback was blocked. Tap Play sound with Salah open.' : error.message;
    }
  }

  $('customAudio').addEventListener('change', async () => {
    const file = $('customAudio').files?.[0];
    if (!file) return;
    if (!(file.type.startsWith('audio/') || /[.](mp3|m4a|wav|aac|ogg|flac)$/i.test(file.name)) || !file.size || file.size > 8 * 1048576) {
      $('soundStatus').textContent = 'Choose an audio file up to 8 MB.';
      return;
    }
    const update = ++customUpdate;
    try {
      await audioData('write', file);
      if (update !== customUpdate) return;
      savedSound = file;
      stopSound();
      cfg.soundChoice = 'custom';
      $('soundChoice').value = 'custom';
      $('savedAudioStatus').textContent = 'Saved locally · ' + (file.size / 1048576).toFixed(1) + ' MB';
      $('soundStatus').textContent = 'Sound saved. Tap Play sound to check it.';
      store();
    } catch { $('soundStatus').textContent = 'Could not save the imported sound.'; }
  });
  $('clearAudio').addEventListener('click', async () => {
    const update = ++customUpdate;
    try {
      await audioData('delete');
      if (update !== customUpdate) return;
      stopSound();
      savedSound = null;
      $('customAudio').value = '';
      $('savedAudioStatus').textContent = 'No imported audio saved.';
      if (cfg.soundChoice === 'custom') { cfg.soundChoice = 'soft'; $('soundChoice').value = 'soft'; store(); }
      $('soundStatus').textContent = 'Saved sound removed.';
    } catch { $('soundStatus').textContent = 'Could not remove the saved sound.'; }
  });
  $('soundChoice').value = cfg.soundChoice;
  $('soundVolume').value = String(cfg.soundVolume);
  $('soundVolumeLabel').textContent = cfg.soundVolume + '%';
  $('iosVolumeNote').hidden = !isIOS;
  $('soundVolume').addEventListener('input', () => {
    cfg.soundVolume = Number($('soundVolume').value);
    $('soundVolumeLabel').textContent = cfg.soundVolume + '%';
    audio.setLevel(cfg.soundVolume);
    store();
  });
  $('soundChoice').addEventListener('change', () => {
    stopSound();
    cfg.soundChoice = $('soundChoice').value;
    store();
    $('soundStatus').textContent = 'Sound saved. Tap Play sound to hear it.';
  });
  $('testSound').addEventListener('click', () => { void playSound(cfg.soundChoice, true); });
  $('stopSound').addEventListener('click', () => { stopSound(); $('soundStatus').textContent = 'Sound stopped.'; });
  void loadCustomSound();

  let soundSeen = new Set();
  try { soundSeen = new Set(JSON.parse(sessionStorage.getItem('salah-reminders') || '[]')); } catch {}
  function rememberSound(id) {
    soundSeen.add(id);
    try { sessionStorage.setItem('salah-reminders', JSON.stringify([...soundSeen])); } catch {}
  }
  function showReminder(message) {
    const toast = $('reminderToast');
    clearTimeout(toastTimer);
    toast.hidden = false;
    $('reminderMessage').textContent = message;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 30000);
  }
  $('dismissReminder').addEventListener('click', () => { $('reminderToast').hidden = true; });
  function reminderEvents() {
    const today = todayKey();
    const events = [];
    for (const key of [dayShift(today, -1), today, dayShift(today, 1)]) {
      const day = getDay(key);
      if (!day.valid || day.sourceFallback) continue;
      for (const p of prayers) {
        if (p.key === 'isha' && !day.nextFajr) continue;
        const event = prayerEvent(day, p);
        if (event) events.push({ ...event, date:key });
      }
    }
    return events;
  }
  function renderReminderNext(events = reminderEvents()) {
    $('reminderLead').disabled = !cfg.reminderEnabled;
    if (!cfg.reminderEnabled) { $('reminderNext').textContent = 'Pre-prayer reminders are off.'; return; }
    const lead = cfg.reminderLead * 60000;
    const now = Date.now();
    const next = events.find(event => event.at - lead > now);
    if (!next) { $('reminderNext').textContent = 'No upcoming reminder available.'; return; }
    const when = new Date(+next.at - lead);
    const tomorrow = dateParts(when, cfg.timeZone) !== todayKey();
    $('reminderNext').textContent = (tomorrow ? 'Tomorrow at ' : 'Next at ') + fmt(when) +
      ' · ' + next.en + (next.estimated ? ' (estimate)' : '');
  }
  $('reminderLead').value = String(cfg.reminderLead);
  $('reminderEnabled').checked = cfg.reminderEnabled;
  $('reminderLead').addEventListener('change', () => {
    cfg.reminderLead = Number($('reminderLead').value);
    store();
    renderReminderNext();
  });
  $('reminderEnabled').addEventListener('change', () => {
    cfg.reminderEnabled = $('reminderEnabled').checked;
    store();
    renderReminderNext();
  });

  function checkPrayerSounds() {
    if (document.hidden) return;
    const now = Date.now(), today = todayKey();
    const days = [dayShift(today, -1), today, dayShift(today, 1)];
    const events = reminderEvents();
    if (!$('soundPanel').hidden) renderReminderNext(events);
    soundSeen = new Set([...soundSeen].filter(id => days.includes(id.slice(0, 10))));
    for (const event of events) {
      const at = event.at.getTime();
      const id = event.date + ':' + event.key;
      const pre = id + ':before';
      const reminder = at - cfg.reminderLead * 60000;
      const estimate = event.estimated ? ' (estimate)' : '';
      if (cfg.reminderEnabled && now >= reminder && now < reminder + 45000 && !soundSeen.has(pre)) {
        rememberSound(pre);
        audio.chime(reminderNotes);
        showReminder(event.en + ' at ' + fmt(event.at) + estimate + ' · ' + cfg.reminderLead + ' minutes away');
      }
      if (now >= at && now < at + 45000 && !soundSeen.has(id)) {
        rememberSound(id);
        if (cfg.soundChoice === 'off') continue;
        const choice = cfg.soundChoice === 'adhan-abu-bakr' && event.key !== 'fajr' ? 'adhan-fajr-abu-bakr' : cfg.soundChoice;
        showReminder(event.en + ' · ' + fmt(event.at) + estimate);
        void playSound(choice);
      }
    }
  }

  const KAABA={lat:21.422487,lng:39.826206};
  const norm360=x=>(x%360+360)%360;
  function qiblaBearing(lat,lng) {
    const rad=Math.PI/180, phi1=lat*rad, phi2=KAABA.lat*rad;
    const dl=(KAABA.lng-lng)*rad;
    const y=Math.sin(dl)*Math.cos(phi2);
    const x=Math.cos(phi1)*Math.sin(phi2)-Math.sin(phi1)*Math.cos(phi2)*Math.cos(dl);
    return norm360(Math.atan2(y,x)/rad);
  }
  const compassPoints = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const compassLetters = ['compassNorth', 'compassEast', 'compassSouth', 'compassWest'];
  let compassReading = null, magneticVariation = null, qiblaCompassOn = false, lastAlignment = false;
  let variationPromise = null, variationKey = '', compassStatus = '', orientationTimer = null;
  const supportsVibration = () => typeof navigator.vibrate === 'function';
  function vibrate(pattern) {
    try { return supportsVibration() && navigator.vibrate(pattern); }
    catch { return false; }
  }
  function compassPoint(degrees, radius) {
    const angle = degrees * Math.PI / 180;
    return [160 + radius * Math.sin(angle), 160 - radius * Math.cos(angle)];
  }
  function pointText(degrees, radius) {
    return compassPoint(degrees, radius).map(value => value.toFixed(1)).join(' ');
  }
  $('compassTicks').innerHTML = Array.from({length:60}, (_, i) => {
    const major = i % 5 === 0;
    return `<path class="compass-tick${major ? ' major' : ''}" d="M${pointText(i * 6, major ? 132 : 137)} L${pointText(i * 6, 144)}"/>`;
  }).join('');

  function resetMagneticCorrection() {
    cfg.magneticDeclination = '';
    $('declinationOverride').value = '';
    variationKey = '';
    magneticVariation = null;
    lastAlignment = false;
  }
  function qiblaDistance(lat, lng) {
    return kmApart({ lat, lng }, KAABA);
  }
  function renderQibla() {
    const bearing = qiblaBearing(cfg.lat, cfg.lng);
    const override = $('declinationOverride').value.trim();
    const delta = override !== '' ? Number(override) : magneticVariation;
    const correction = Number.isFinite(delta) && Math.abs(delta) <= 180;
    const accuracy = compassReading?.accuracy;
    const fixedReference = !qiblaCompassOn || !compassReading || compassReading.tilted || !correction;
    const reliable = Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= 20;
    const approximate = !fixedReference && compassReading.kind === 'absolute';
    const live = !fixedReference && (reliable || approximate);
    const rotation = live ? norm360(compassReading.heading + delta) : 0;
    const direction = (bearing - rotation + 540) % 360 - 180;
    const angle = Math.round(Math.abs(direction));
    const inAlignmentRange = Math.abs(direction) <= (lastAlignment ? 7 : 4);
    const aligned = live && reliable && accuracy <= 8 && inAlignmentRange;
    const alignmentCue = aligned || (approximate && inAlignmentRange);
    const near = live && angle <= 15;
    const turn = direction < 0 ? 'left' : 'right';
    const dial = $('qiblaDial');
    dial.classList.toggle('live', live);
    dial.classList.toggle('aligned', aligned);

    $('qiblaBearing').textContent = bearing.toFixed(1) + '°';
    $('qiblaCardinal').textContent = compassPoints[Math.round(bearing / 22.5) % 16];
    $('qiblaDistance').textContent = Math.round(qiblaDistance(cfg.lat, cfg.lng)).toLocaleString('en-GB') + ' km';
    $('qiblaPosition').textContent = cfg.location;
    $('compassTicks').setAttribute('transform', `rotate(${-rotation} 160 160)`);
    for (const [i, id] of compassLetters.entries()) {
      const [x, y] = compassPoint(i * 90 - rotation, 119);
      $(id).setAttribute('x', x.toFixed(1));
      $(id).setAttribute('y', y.toFixed(1));
    }
    $('qiblaArrow').setAttribute('transform', 'translate(' + pointText(direction, 99) + ')');
    $('qiblaArc').setAttribute('d', live && angle > 5
      ? `M160 61 A99 99 0 0 ${direction < 0 ? 0 : 1} ${pointText(direction, 99)}` : '');

    const cue = $('qiblaAligned');
    const weak = qiblaCompassOn && !live && !!compassReading;
    cue.dataset.state = aligned ? 'aligned' : near ? 'near' : live ? 'turn' : weak ? 'weak' : 'reference';
    dial.dataset.state = cue.dataset.state;
    $('qiblaCueMark').textContent = aligned ? '✓' : live ? (direction < 0 ? '↶' : '↷') : '◇';
    const cueText = aligned ? 'Facing the Qibla' : live && angle <= 4 ? 'Near the Qibla · check accuracy' :
      live ? 'Turn ' + (near ? 'slightly ' : '') + turn + ' · ' + angle + '°' :
      compassReading?.tilted ? 'Hold your phone level' :
      weak ? 'Use the true-north bearing' : 'True-north reference';
    if ($('qiblaCue').textContent !== cueText) $('qiblaCue').textContent = cueText;
    $('qiblaTurnAngle').textContent = aligned ? '✓' : live ? angle + '°' : bearing.toFixed(1) + '°';
    $('qiblaTurnLabel').textContent = aligned ? 'Qibla' : live && angle <= 4 ? 'Near Qibla' : live ? 'Turn ' + turn : 'From true north';

    $('qiblaPrecision').textContent = Number.isFinite(accuracy) && accuracy >= 0 ? '±' + Math.round(accuracy) + '°' :
      approximate ? 'Unknown' : '—';
    $('qiblaPrecisionNote').textContent = approximate ? 'Approximate heading' : reliable ? 'Reported by phone' : weak ? 'Reference view' : 'Sensor off';
    $('qiblaAccuracy').textContent = approximate ? 'This sensor gives an approximate heading. Use a calibrated compass to verify close alignment.' :
      weak && !compassReading?.tilted && !reliable ? 'Compass reading is not accurate enough for a live pointer. Calibrate away from metal and try again.' :
      reliable && live ? 'Sensor uncertainty about ±' + Math.round(accuracy) + '°. Hold level away from metal.' : 'The bearing is measured clockwise from true north.';
    const state = live ? 'Heading ' + Math.round(rotation) + '° true · ' + (override === '' ? 'WMM 2025' : 'manual correction') : compassStatus;
    if ($('qiblaState').textContent !== state) $('qiblaState').textContent = state;

    if (alignmentCue && !lastAlignment && !$('qiblaPanel').hidden && !document.hidden) {
      if (cfg.qiblaHaptic) vibrate([35, 35, 60]);
      if (cfg.qiblaChime) audio.chime(alignmentNotes);
    }
    lastAlignment = alignmentCue;
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
    if (!qiblaCompassOn || document.hidden || $('qiblaPanel').hidden) return;
    const magnetic = event.webkitCompassHeading;
    const absolute = event.absolute && Number.isFinite(event.alpha);
    if ((!Number.isFinite(magnetic) || magnetic < 0) && !absolute) return;
    const webkit = Number.isFinite(magnetic) && magnetic >= 0;
    const portrait = !(screen.orientation?.angle ?? window.orientation ?? 0);
    const tilted = Math.abs(event.beta || 0) > 35 || Math.abs(event.gamma || 0) > 35;
    compassReading = {
      kind:webkit ? 'webkit' : 'absolute', tilted:tilted || !portrait,
      heading:norm360(webkit ? magnetic : 360 - event.alpha),
      accuracy:webkit && Number.isFinite(event.webkitCompassAccuracy) ? event.webkitCompassAccuracy : null
    };
    compassStatus = !portrait ? 'Turn the phone upright to portrait orientation.' :
      tilted ? 'Set the phone flat to use the compass.' :
      webkit && !(compassReading.accuracy >= 0 && compassReading.accuracy <= 20 && compassReading.accuracy !== null) ?
        'Compass accuracy is too low. Move away from metal and recalibrate.' :
        'Waiting for magnetic correction…';
    renderQibla();
  }
  function stopCompass() {
    clearTimeout(orientationTimer);
    window.removeEventListener('deviceorientation', orientationHandler);
    window.removeEventListener('deviceorientationabsolute', orientationHandler);
    qiblaCompassOn = false;
    compassReading = null;
    lastAlignment = false;
    compassStatus = 'Start the compass to use your phone’s heading.';
    $('startCompass').textContent = 'Start compass';
    renderQibla();
  }
  $('startCompass').addEventListener('click', async () => {
    if (qiblaCompassOn) { stopCompass(); return; }
    if (typeof DeviceOrientationEvent === 'undefined' || !window.isSecureContext) {
      compassStatus = 'Use HTTPS on a phone with a compass sensor.';
      renderQibla(); return;
    }
    try {
      if (cfg.qiblaChime) void audio.unlock();
      if (typeof DeviceOrientationEvent.requestPermission === 'function' &&
          await DeviceOrientationEvent.requestPermission() !== 'granted') {
        compassStatus = 'Motion permission denied. Use the true-north bearing.';
        renderQibla(); return;
      }
      if ($('qiblaPanel').hidden) return;
      qiblaCompassOn = true;
      $('startCompass').textContent = 'Stop compass';
      compassStatus = 'Waiting for a usable compass reading…';
      window.addEventListener('deviceorientation', orientationHandler);
      window.addEventListener('deviceorientationabsolute', orientationHandler);
      orientationTimer = setTimeout(() => {
        if (!compassReading && qiblaCompassOn) {
          compassStatus = 'No compass heading received. Use the true-north bearing.';
          renderQibla();
        }
      }, 4500);
      if (!await loadVariation() && !$('declinationOverride').value.trim() && qiblaCompassOn)
        compassStatus = 'Magnetic correction unavailable. Enter a local correction or use the true-north bearing.';
      renderQibla();
    } catch {
      compassStatus = 'Compass access failed. Use the true-north bearing.';
      renderQibla();
    }
  });
  $('qiblaGPS').addEventListener('click', () => {
    if (!navigator.geolocation) { compassStatus = 'GPS unavailable.'; renderQibla(); return; }
    compassStatus = 'Getting current GPS position…';
    renderQibla();
    const request = ++placeRequest;
    navigator.geolocation.getCurrentPosition(pos => {
      if (request !== placeRequest) return;
      const place = positionPlace(pos);
      if (place.error) { compassStatus = place.error; renderQibla(); return; }
      applyLocation(place);
      compassStatus = 'Position updated for Qibla and prayers.';
      renderQibla();
    }, () => {
      if (request === placeRequest) { compassStatus = 'GPS unavailable. Keeping the saved position.'; renderQibla(); }
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
  $('qiblaHaptic').checked = cfg.qiblaHaptic;
  $('qiblaHapticControl').hidden = !supportsVibration();
  $('qiblaChime').checked = cfg.qiblaChime;
  $('qiblaHapticHint').textContent = supportsVibration() ? '' : 'This browser uses the visual cue and optional chime for alignment.';
  $('qiblaHaptic').addEventListener('change', () => {
    cfg.qiblaHaptic = $('qiblaHaptic').checked;
    store();
  });
  $('qiblaChime').addEventListener('change', () => {
    cfg.qiblaChime = $('qiblaChime').checked;
    store();
    if (cfg.qiblaChime) void audio.unlock().then(ready => { if (ready && cfg.qiblaChime) audio.chime(alignmentNotes); });
  });

  const fastingLabels = { fasted:'Fasted', due:'To make up', 'made-up':'Made up' };
  const fastingStore = 'salah-fasting-log';
  let fastingKey = todayKey();
  let fastingFollowingToday = true;
  let fastingRecords = {};
  try {
    const saved = JSON.parse(localStorage.getItem(fastingStore) || '{}');
    fastingRecords = Object.fromEntries(Object.entries(saved).filter(([key, value]) =>
      key.length === 10 && Number.isFinite(+dateAtNoonUTC(key)) && Object.hasOwn(fastingLabels, value)));
  } catch {}

  function renderFasting(restoreFocus = false) {
    const date = dateAtNoonUTC(fastingKey), today = todayKey();
    const month = fastingKey.slice(0, 7), year = date.getUTCFullYear(), index = date.getUTCMonth();
    const first = new Date(Date.UTC(year, index, 1, 12));
    const days = new Date(Date.UTC(year, index + 1, 0, 12)).getUTCDate();
    const fill = (first.getUTCDay() + 6) % 7;
    $('fastingMonth').textContent = date.toLocaleDateString('en-GB', { timeZone:'UTC', month:'long', year:'numeric' });
    const blank = '<span aria-hidden="true"></span>'.repeat(fill);
    $('fastingDays').innerHTML = blank + Array.from({ length:days }, (_, i) => {
      const key = month + '-' + String(i + 1).padStart(2, '0');
      const mark = fastingRecords[key] || '';
      const selected = key === fastingKey;
      const label = prettyKey(key) + (mark ? ', ' + fastingLabels[mark] : '');
      return `<button type="button" class="fast-day" data-date="${key}" data-status="${mark}"
        tabindex="${selected ? 0 : -1}" aria-label="${label}" aria-pressed="${selected}" ${key === today ? 'aria-current="date"' : ''}>${i + 1}</button>`;
    }).join('');
    if (restoreFocus) $('fastingDays').querySelector('[aria-pressed="true"]').focus();
    const entries = Object.entries(fastingRecords);
    const completed = entries.filter(([key, mark]) => key.startsWith(month) && mark === 'fasted').length;
    const due = entries.filter(([, mark]) => mark === 'due').length;
    $('fastingSummary').textContent = completed + ' fasted this month · ' + due + ' to make up across all dates';
    $('fastingDate').textContent = prettyKey(fastingKey);
    $('fastingLocation').textContent = cfg.location;
    const times = getDay(fastingKey);
    const estimated = !!times.valid && isEstimated(times, 'fajr');
    $('fastingFajr').textContent = fmt(times.fajr) + (estimated ? ' · est.' : '');
    $('fastingIftar').textContent = fmt(times.maghrib);
    const minutes = times.maghrib && times.fajr ? Math.round((times.maghrib - times.fajr) / 60000) : 0;
    $('fastingDuration').textContent = minutes > 0 ? Math.floor(minutes / 60) + 'h ' + minutes % 60 + 'm' : '—';
    $('fastingEstimate').textContent = times.sourceFallback ? 'Local fallback is in use for this date.' :
      estimated ? 'The Fajr time uses a twilight estimate.' : !times.fajr ? 'Fajr is unavailable under the selected method.' : '';

    const mark = fastingRecords[fastingKey] || '';
    for (const button of document.querySelectorAll('[data-fast-status]')) {
      const status = button.dataset.fastStatus;
      if (status) button.setAttribute('aria-pressed', mark === status);
      else button.disabled = !mark;
    }
    if (cfg.activeSource === 'moonsighting' && navigator.onLine) void fetchOnline(cfg.activeSource, fastingKey);
  }
  function selectFastingDate(key, focus = false) {
    fastingKey = key;
    fastingFollowingToday = key === todayKey();
    $('fastingStatus').textContent = '';
    renderFasting(focus);
  }
  function changeFastingMonth(offset) {
    const [year, month, day] = fastingKey.split('-').map(Number);
    const last = new Date(Date.UTC(year, month + offset, 0, 12)).getUTCDate();
    const date = new Date(Date.UTC(year, month - 1 + offset, Math.min(day, last), 12));
    selectFastingDate(date.toISOString().slice(0, 10));
  }
  $('fastingPrevious').addEventListener('click', () => changeFastingMonth(-1));
  $('fastingNext').addEventListener('click', () => changeFastingMonth(1));
  $('fastingToday').addEventListener('click', () => selectFastingDate(todayKey()));
  $('fastingDays').addEventListener('click', event => {
    const day = event.target.closest('[data-date]');
    if (day) selectFastingDate(day.dataset.date, true);
  });
  $('fastingDays').addEventListener('keydown', event => {
    const offsets = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-7, ArrowDown:7 };
    const step = offsets[event.key];
    if (!step) return;
    event.preventDefault();
    selectFastingDate(dayShift(fastingKey, step), true);
  });
  document.querySelector('.fasting-actions').addEventListener('click', event => {
    const button = event.target.closest('[data-fast-status]');
    if (!button) return;
    const current = button.dataset.fastStatus;
    const updated = { ...fastingRecords };
    if (current) updated[fastingKey] = current;
    else delete updated[fastingKey];
    try {
      localStorage.setItem(fastingStore, JSON.stringify(updated));
      fastingRecords = updated;
      $('fastingStatus').textContent = current ? fastingLabels[current] + ' saved on this device.' : 'Entry cleared.';
      renderFasting();
    } catch {
      $('fastingStatus').textContent = 'This browser could not save the entry.';
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== fastingStore) return;
    try {
      const saved = JSON.parse(event.newValue || '{}');
      fastingRecords = Object.fromEntries(Object.entries(saved).filter(([key, value]) =>
        key.length === 10 && Number.isFinite(+dateAtNoonUTC(key)) && Object.hasOwn(fastingLabels, value)));
      if (!$('fastingPanel').hidden) renderFasting();
    } catch {}
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
    addTestRow('Prayer reminders', cfg.reminderEnabled ? cfg.reminderLead + ' minutes early while Salah is open' : 'Turned off','info');
    addTestRow('Notification API', ('Notification' in window && 'serviceWorker' in navigator)?`Supported · ${Notification.permission}`:'Not exposed by this browser',('Notification' in window&&'serviceWorker' in navigator)?'pass':'info');
    addTestRow('Background push','No server connected — not available in this build','info');
    addTestRow('Motion sensor',typeof DeviceOrientationEvent!=='undefined'?'Permission and compass test available':'Not exposed','info');
    addTestRow('Vibration',supportsVibration()?'Browser supports vibration':'Visual cue and optional compass chime',supportsVibration()?'pass':'info');
  }
  $('runBasicChecks').addEventListener('click',basicChecks);
  $('testAdhan').addEventListener('click',async()=>{
    $('testFeedback').textContent='Requesting adhan…';
    await playSound(cfg.soundChoice.startsWith('adhan-') ? cfg.soundChoice : 'adhan-abu-bakr', true);
    $('testFeedback').textContent = $('soundStatus').textContent;
  });
  let testingChimeTimer=null;
  $('testEarlyChime').addEventListener('click', async () => {
    clearTimeout(testingChimeTimer);
    if (!await audio.unlock()) {
      $('testFeedback').textContent = 'Audio unavailable. Tap Play sound to try again.';
      return;
    }
    audio.chime(reminderNotes);
    $('testFeedback').textContent = 'Keep Salah open to hear another chime in 10 seconds.';
    testingChimeTimer = setTimeout(() => {
      const played = !document.hidden && audio.chime(reminderNotes);
      $('testFeedback').textContent = played ? '10-second reminder played.' : 'Open Salah and tap Play sound to start audio.';
    }, 10000);
  });
  $('testNotification').addEventListener('click',async()=>{
    const show=m=>$('testFeedback').textContent=m;
    if(!('Notification' in window)||!('serviceWorker' in navigator)){show('Notifications are unavailable here. Install Salah to your iPhone Home Screen first.');return}
    try {
      const permission=await Notification.requestPermission();
      if(permission!=='granted'){show(`Notification permission: ${permission}`);return}
      const ready=await Promise.race([navigator.serviceWorker.ready, new Promise((_,reject)=>setTimeout(()=>reject(Error('No service worker ready within 8 seconds')),8000))]);
      await ready.showNotification('Salah test',{body:'This is a test notification, not a prayer reminder.',icon:$('tabIcon').href,tag:'salah-self-test'});
      show('Test notification sent to the system. Check Notification Centre; background scheduled alerts still require a push server.');
    } catch(err){show(`Notification test failed: ${err.message}`)}
  });
  $('testGPS').addEventListener('click',()=>{
    if(!navigator.geolocation){$('testFeedback').textContent='GPS unavailable in this browser.';return}
    $('testFeedback').textContent='Requesting GPS…';
    navigator.geolocation.getCurrentPosition(p=>{$('testFeedback').textContent=`GPS acquired: ±${Math.round(p.coords.accuracy)} metres. Qibla can use this position.`},e=>{$('testFeedback').textContent=`GPS permission or positioning issue: ${e.message}`},{enableHighAccuracy:true,timeout:12000,maximumAge:10000});
  });
  $('testVibration').addEventListener('click', () => {
    if (vibrate([40, 50, 70])) {
      $('testFeedback').textContent = 'Vibration requested. Check for a short pulse.';
    } else {
      const feedback = $('testFeedback');
      feedback.textContent = 'Vibration unavailable here. This is the visual cue.';
      feedback.classList.remove('visual-test');
      requestAnimationFrame(() => feedback.classList.add('visual-test'));
      window.setTimeout(() => feedback.classList.remove('visual-test'), 850);
    }
  });

  const screenIds = {today:'today', compare:'comparisonPanel', qibla:'qiblaPanel', fasting:'fastingPanel', sounds:'soundPanel', settings:'settingsDialog'};
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
    if (target === 'today' && dayInfo?.valid) { renderHero(dayInfo); renderPrayerList(dayInfo); updateSunChart(Date.now()); }
    if (target === 'settings') showSettings();
    if (target === 'compare') renderComparison();
    if (target === 'fasting') renderFasting();
    if (target === 'sounds') { renderReminderNext(); basicChecks(); }
    if (target === 'qibla') {
      renderQibla();
      if (qiblaCompassOn) void loadVariation().then(renderQibla);
    } else if (qiblaCompassOn) stopCompass();
    const hash = target === 'today' ? '' : '#' + target;
    if (location.hash !== hash) {
      try { window.history.replaceState(null, '', location.pathname + location.search + hash); } catch {}
    }
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
  document.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    showScreen('today');
  });
  compassStatus = 'Start the compass to use your phone’s heading.';
  showScreen(location.hash.slice(1));
  cacheAdhansAutomatically();

  window.addEventListener('online', () => { $('offlineIndicator').hidden=true; failedOnline.clear(); loadComparison(); void cacheAdhansAutomatically(); });
  window.addEventListener('offline', () => { $('offlineIndicator').hidden=false; render(); });

  basicChecks();
  renderQibla();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  render(); startTracking(); checkPrayerSounds();
})();

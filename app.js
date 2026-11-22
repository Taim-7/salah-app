(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const defaults = {
    lat: 54.9966, lng: -7.3086, location: 'Derry, Northern Ireland', timeZone: 'Europe/London',
    autoLocation: false, method: '15-13', fajrAngle: 15, ishaAngle: 13,
    ishaPreference: 'around-third', ishaLimit: 'half', highLatRule: 'seventh',
    activeSource: 'angles', soundChoice: 'adhan-abu-bakr', soundVolume: 40,
    reminderLead: 15, reminderEnabled: true, soundRepeat: false, qiblaSound: true,
    fastingView: 'week', timeFormat: '12', layout: 'compact', accent: 'forest', iconChoice: 'crescent'
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
  const previousMatchingIcons = { forest:'crescent', ocean:'compass', midnight:'minaret', sand:'mihrab', slate:'mat' };
  const iconDesigns = { crescent:'Crescent', mihrab:'Mihrab', minaret:'Minaret', compass:'Compass', mat:'Prayer mat' };
  const layouts = ['compact', 'timeline', 'horizon'];
  const fastingViews = ['week', 'month'];
  const launchQuery = new URLSearchParams(location.search);
  const iconQuery = launchQuery.get('icon');
  const paletteQuery = launchQuery.get('palette');
  const launchAccent = Object.hasOwn(palettes, paletteQuery) ? paletteQuery :
    Object.hasOwn(palettes, iconQuery) ? iconQuery : defaults.accent;
  const launchIcon = Object.hasOwn(iconDesigns, iconQuery) ? iconQuery : previousMatchingIcons[launchAccent];
  const isStandalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
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
      const c = { ...defaults, accent:launchAccent, iconChoice:launchIcon, ...raw };
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
      delete c.magneticDeclination;
      if (c.activeSource === 'tayba-white') c.activeSource = 'tayba';
      if (!['angles', 'tayba', 'moonsighting'].includes(c.activeSource)) c.activeSource = 'angles';
      if (raw.fajrSoundChoice === 'adhan-fajr-abu-bakr' && c.soundChoice === 'soft') c.soundChoice = 'adhan-fajr-abu-bakr';
      if (c.soundChoice === 'adhan-thabet') c.soundChoice = defaults.soundChoice;
      if (!['soft','bell','custom','off','adhan-abu-bakr','adhan-fajr-abu-bakr'].includes(c.soundChoice)) c.soundChoice = 'soft';
      c.soundRepeat = c.soundRepeat === true;
      delete c.fajrSoundChoice;
      c.soundVolume = Number.isFinite(+c.soundVolume) ? Math.max(0, Math.min(100, +c.soundVolume)) : defaults.soundVolume;
      const lead = Number(raw.reminderLead ?? raw.calendarLead);
      c.reminderLead = reminderLeads.includes(lead) ? lead : defaults.reminderLead;
      c.reminderEnabled = c.reminderEnabled !== false;
      delete c.qiblaHaptic;
      c.qiblaSound = c.qiblaSound !== false;
      delete c.qiblaLegacyPulse;
      delete c.qiblaView;
      c.fastingView = fastingViews.includes(c.fastingView) ? c.fastingView : defaults.fastingView;
      delete c.qiblaChime;
      delete c.calendarLead;
      delete c.theme;
      c.timeFormat = ['12','24'].includes(String(c.timeFormat)) ? String(c.timeFormat) : '12';
      c.layout = layouts.includes(c.layout) ? c.layout : defaults.layout;
      if (c.accent === 'dusk') c.accent = 'midnight';
      c.accent = Object.hasOwn(palettes, c.accent) ? c.accent : defaults.accent;
      if (!Object.hasOwn(iconDesigns, c.iconChoice)) c.iconChoice = previousMatchingIcons[c.accent];
      delete c.onlineCompare;
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
      }
      c.timeZone = zone || defaults.timeZone;
      c.autoLocation = !!zone && c.autoLocation === true;
      return c;
    } catch {
      return { ...defaults, accent:launchAccent, iconChoice:launchIcon };
    }
  }

  let cfg = loadConfig();
  const store = () => {
    try { localStorage.setItem('salah-config', JSON.stringify(cfg)); } catch {}
  };
  if (Object.hasOwn(palettes, paletteQuery) || Object.hasOwn(palettes, iconQuery) || Object.hasOwn(iconDesigns, iconQuery)) store();
  const anglePair = () => SalahTimetable.angles(cfg);
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
  const comparisonOpen = () => $('comparisonPanel').open && !$('settingsDialog').hidden;

  function note(message) {
    $('notice').textContent = message;
    $('notice').classList.toggle('hidden', !message);
  }


  const methods = [
    { id:'angles', title:'Your angles', sub:'Local calculation' },
    { id:'tayba', title:'Tayba', sub:'Seasonal model' },
    { id:'moonsighting', title:'AlAdhan', sub:'Moonsighting' }
  ];
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
    if (key === selectedKey && comparisonOpen()) renderComparison();
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
    if (cfg.activeSource !== 'moonsighting') {
      if (force) void fetchOnline('moonsighting', selectedKey, true);
      return;
    }
    const today = todayKey();
    const requested = new Set([selectedKey, dayShift(selectedKey, 1), today, dayShift(today, -1), dayShift(today, 1)]);
    requested.forEach(key => { void fetchOnline(cfg.activeSource, key, force && (key === selectedKey || key === dayShift(selectedKey, 1))); });
  }

  const localDays = new Map();
  function localDay(key, source = 'angles', rule = cfg.highLatRule) {
    const [fa, ia] = anglePair();
    const id = [source, key, cfg.lat, cfg.lng, fa, ia, rule].join(':');
    if (localDays.has(id)) return localDays.get(id);
    const day = SalahTimetable.localDay(key, cfg, source, rule);
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
    return {
      ...SalahTimetable.aladhanDay(local, today, next),
      savedProviderData:today.savedProviderData || !navigator.onLine || Date.now() - today.retrievedAt > 3600000
    };
  }
  const { isEstimated } = SalahTimetable;

  function renderComparison() {
    const id = cacheId('moonsighting', selectedKey);
    const provider = readCached('moonsighting', selectedKey);
    const cols = [
      { id:'angles', title:'Your ' + anglePair().join('° / ') + '°', desc:summerRules[cfg.highLatRule], day:localDay(selectedKey) },
      { id:'tayba', title:'Tayba', desc:'Seasonal model', day:localDay(selectedKey, 'tayba') },
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
    if (active.sourceFallback) messages.push('Using local times while AlAdhan is unavailable.');
    if (cols[1].day.ishaReason) messages.push(cols[1].day.ishaReason);
    if (pendingOnline.has(id)) messages.push('Loading AlAdhan times…');
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
  let lastHijriKey;
  function hijriDayKey(key, day, now) {
    const sunset = day?.trueSunset || day?.maghrib;
    return key === todayKey() && sunset && now >= +sunset ? dayShift(key, 1) : key;
  }
  function renderHijriDate(now = Date.now()) {
    const key = hijriDayKey(selectedKey, dayInfo, now);
    if (lastHijriKey === key) return;
    lastHijriKey = key;
    const label = SalahHijri.label(key);
    $('hijriDate').textContent = label ? label + ' · est.' : '';
    $('hijriDate').hidden = !label;
  }
  function getDay(key) { return getActiveDay(key); }

  const ishaDeadline = day => SalahTimetable.ishaDeadline(day, cfg.ishaLimit);
  const ishaHasWindow = day => SalahTimetable.ishaHasWindow(day, cfg.ishaLimit);
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
    list.innerHTML = sorted.map((e,i) => {
      const phase = current ? (i === currentIndex ? (e.kind === 'prayer' ? 'is-now' : 'is-current-marker') :
        i === nextIndex ? 'is-next' : i < currentIndex ? 'is-past' : 'is-future') : '';
      const isCurrent = e.kind === 'prayer' && e.name.key === currentPrayer;
      const activeRange = current && isBetween(now, e.at, e.end);
      const dimmed = current && !isCurrent && !activeRange && (e.end || e.at) < now && phase !== 'is-current-marker';
      const extra = e.end ? `<span class="range-label">to ${fmt(e.end)}</span>` : '';
      const following = dateParts(e.at, cfg.timeZone) !== selectedKey ? '<span class="next-day">+1 day</span>' : '';
      const label = isCurrent ? '<span class="phase-pill current-pill">CURRENT</span>' :
        i === nextIndex ? '<span class="phase-pill next-pill">NEXT</span>' : '';
      return `<div class="time-row ${e.kind === 'prayer' ? 'prayer-entry' : e.kind === 'night' ? 'night-summary' : 'avoid-entry'} ${phase}${dimmed ? ' is-elapsed' : ''} ${isCurrent ? 'current-prayer' : ''} ${activeRange ? 'within-range' : ''}" data-event="${e.name?.key || e.kind}" data-event-time="${e.at.getTime()}">
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
    placePrayerRail(list, current ? now : null);
  }
  function placePrayerRail(list, now) {
    if (cfg.layout !== 'timeline' || !list.offsetHeight) return;
    const rows = [...list.querySelectorAll('.prayer-entry')];
    if (!rows.length) return;
    const middle = row => row.offsetTop + row.offsetHeight / 2;
    const first = middle(rows[0]);
    const last = middle(rows.at(-1));
    const dated = rows.filter(row => row.dataset.eventTime).map(row => ({ y:middle(row), time:Number(row.dataset.eventTime) }));
    let progress = first;
    if (now !== null && dated.length) {
      const next = dated.findIndex(event => event.time > now);
      if (next === -1) progress = dated.at(-1).y;
      if (next > 0) {
        const start = dated[next - 1], end = dated[next];
        progress = start.y + (end.y - start.y) * (now - start.time) / (end.time - start.time);
      }
    }
    list.style.setProperty('--rail-top', first + 'px');
    list.style.setProperty('--rail-height', last - first + 'px');
    list.style.setProperty('--rail-progress', progress - first + 'px');
  }
  window.addEventListener('resize', () => placePrayerRail($('prayerList'), selectedKey === todayKey() ? Date.now() : null));
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
    $('countdown').classList.add('is-counting');
    $('countdown').textContent = 'In ' + timer + currentHero.following + currentHero.estimated;
  }
  function setHero(event, now, otherDate = false) {
    currentHero = null;
    $('countdown').classList.remove('is-counting');
    $('horizonPrayerLabel').textContent = otherDate ? 'First listed prayer' : 'Next prayer';
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
    $('heroHeading').textContent = t.fajr && ishaHasWindow(t) ? 'NEXT PRAYER' : 'NEXT TIMETABLED PRAYER';

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
    renderHijriDate();
    if (comparisonOpen()) renderComparison();
    if (!$('fastingPanel').hidden) renderFasting();
    if (!$('datesPanel').hidden) renderIslamicDates(todayKey());
    drawSunChart(dayInfo);
    $('timesTag').textContent = cfg.timeZone === 'Europe/Dublin' ? 'Ireland time' : 'UK time';
    if (!dayInfo.valid) {
      note(dayInfo.reason); setHero(null, new Date()); $('heroHeading').textContent = 'PRAYER TIMES';
      $('prayerList').innerHTML = '<p class="loading">Times unavailable for this date and location.</p>';
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
      highLatRule:$('highLatSelect').value
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

  const iconAsset = (design, palette, size) => './icons/art/' + palette + '/' + design + '-' + size + '.png';
  const paletteChoices = $('paletteChoices');
  paletteChoices.innerHTML = Object.entries(palettes).map(([id, label]) =>
    `<button type="button" class="palette-choice" data-palette="${id}"><span class="palette-sample" aria-hidden="true"><i></i><i></i><i></i><img class="palette-icon" alt="" width="21" height="21"/></span>${label}</button>`).join('');
  const iconChoices = $('iconChoices');
  iconChoices.innerHTML = Object.entries(iconDesigns).map(([id, label]) =>
    '<button type="button" data-icon-choice="' + id + '"><img width="42" height="42" alt=""/><span>' + label + '</span></button>').join('');

  function applyAppearance() {
    document.body.dataset.layout = cfg.layout;
    document.body.dataset.accent = cfg.accent;
    $('settingsLayout').value = cfg.layout;
    $('settingsTimeFormat').value = cfg.timeFormat;
    const horizon = cfg.layout === 'horizon';
    const dateSlot = $('horizonDateSlot');
    dateSlot.hidden = !horizon;
    const dateParent = horizon ? dateSlot : $('prayerHeading');
    const dateControls = $('prayerDateControls');
    if (dateControls.parentNode !== dateParent) dateParent.append(dateControls);
    for (const choice of paletteChoices.children) {
      choice.setAttribute('aria-pressed', choice.dataset.palette === cfg.accent);
      choice.querySelector('img').src = iconAsset(cfg.iconChoice, choice.dataset.palette, 180);
    }
    const background = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    document.documentElement.style.backgroundColor = background;
    document.querySelector('meta[name="theme-color"]').content = background;
    const iconKey = cfg.accent + '-' + cfg.iconChoice;
    $('tabIcon').href = iconAsset(cfg.iconChoice, cfg.accent, 192);
    $('touchIcon').href = iconAsset(cfg.iconChoice, cfg.accent, 180);
    $('appManifest').href = './manifest-' + iconKey + '.webmanifest';
    for (const choice of iconChoices.children) {
      choice.setAttribute('aria-pressed', choice.dataset.iconChoice === cfg.iconChoice);
      choice.querySelector('img').src = iconAsset(choice.dataset.iconChoice, cfg.accent, 180);
    }
    $('homeIconPreview').src = $('touchIcon').href;
    $('homeIconName').textContent = iconDesigns[cfg.iconChoice];
    $('homeIconPage').href = './install/' + iconKey + '.html';
    $('homeIconURL').value = $('homeIconPage').href;
    $('homeIconURL').hidden = true;
    $('homeIconHelp').textContent = isStandalone() ? 'Safari sets the icon when you add Salah to the Home Screen.' :
      'Open the icon page in Safari to add this design to your Home Screen.';
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
  iconChoices.addEventListener('click', event => {
    const choice = event.target.closest('[data-icon-choice]');
    if (choice) changeAppearance('iconChoice', choice.dataset.iconChoice);
  });
  $('homeIconPage').hidden = isStandalone();
  $('copyIconPage').hidden = !isStandalone();
  $('copyIconPage').addEventListener('click', async () => {
    const field = $('homeIconURL');
    try {
      await navigator.clipboard.writeText(field.value);
      $('homeIconHelp').textContent = 'Open the copied link in Safari. Use Share → Add to Home Screen.';
    } catch {
      field.hidden = false;
      field.focus();
      field.select();
      $('homeIconHelp').textContent = 'Copy this link and open it in Safari.';
    }
  });
  applyAppearance();

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
  $('comparisonPanel').addEventListener('toggle', () => { if (comparisonOpen()) renderComparison(); });
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
    if (document.hidden) {
      stopTracking();
      if (repeatTimer !== null) stopSound();
      if (qiblaCompassOn || compassStarting) stopCompass();
    }
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
    renderHijriDate(now);
    if (currentHero && currentHero.at <= now && dayInfo?.valid) {
      renderHero(dayInfo);
      renderPrayerList(dayInfo);
    } else updateCountdown(now);
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
    if (!$('datesPanel').hidden) renderIslamicDates(localDay);
    checkPrayerSounds();
    if (navigator.onLine && cfg.activeSource === 'moonsighting' &&
        [...failedOnline.values()].some(at => Date.now() - at >= 120000)) loadComparison();
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
    'adhan-fajr-abu-bakr':'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/abu-bakr.mp3'
  });
  const recordings = new Map(), pendingRecordings = new Map();
  let repeatTimer = null;
  const chimeChoice = choice => choice === 'soft' || choice === 'bell';
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
    clearTimeout(repeatTimer);
    repeatTimer = null;
    audio.stop();
  }

  async function playSound(choice = cfg.soundChoice, fromTap = false) {
    stopSound();
    const request = soundRequest;
    const status = $('soundStatus');
    if (choice === 'off' || chimeChoice(choice)) {
      const ready = fromTap ? await audio.unlock() : audio.ready();
      if (request !== soundRequest) return;
      if (choice === 'off') { status.textContent = ready ? 'Prayer-time sound is silent. Reminder audio is ready.' : 'Prayer-time sound is silent.'; return; }
      const notes = choice === 'bell' ? bellNotes : softNotes;
      const playing = ready && !document.hidden && audio.chime(notes);
      if (playing && cfg.soundRepeat) {
        const repeat = () => {
          repeatTimer = null;
          if (request !== soundRequest || !cfg.soundRepeat || document.hidden || !audio.chime(notes)) return;
          repeatTimer = setTimeout(repeat, 1750);
        };
        repeatTimer = setTimeout(repeat, 1750);
      }
      status.textContent = playing ? (cfg.soundRepeat ? 'Repeating. Tap Stop to end.' : 'Playing chime.') :
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
      updateSoundControls();
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
      if (cfg.soundChoice === 'custom') { cfg.soundChoice = 'soft'; updateSoundControls(); store(); }
      $('soundStatus').textContent = 'Saved sound removed.';
    } catch { $('soundStatus').textContent = 'Could not remove the saved sound.'; }
  });
  function updateSoundControls() {
    $('soundChoice').value = cfg.soundChoice;
    $('repeatChimeControl').hidden = !chimeChoice(cfg.soundChoice);
    $('repeatChime').checked = cfg.soundRepeat;
    $('customSoundPanel').open = cfg.soundChoice === 'custom';
  }
  updateSoundControls();
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
    updateSoundControls();
    store();
    $('soundStatus').textContent = 'Sound saved. Tap Play sound to hear it.';
  });
  $('repeatChime').addEventListener('change', () => {
    cfg.soundRepeat = $('repeatChime').checked;
    if (!cfg.soundRepeat && repeatTimer !== null) {
      stopSound();
      $('soundStatus').textContent = 'Sound stopped.';
    }
    store();
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
  $('dismissReminder').addEventListener('click', () => {
    $('reminderToast').hidden = true;
    if (repeatTimer !== null) stopSound();
  });
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
  $('reminderLead').value = String(cfg.reminderLead);
  $('reminderLead').disabled = !cfg.reminderEnabled;
  $('reminderEnabled').checked = cfg.reminderEnabled;
  $('reminderLead').addEventListener('change', () => {
    cfg.reminderLead = Number($('reminderLead').value);
    store();
  });
  $('reminderEnabled').addEventListener('change', () => {
    cfg.reminderEnabled = $('reminderEnabled').checked;
    $('reminderLead').disabled = !cfg.reminderEnabled;
    store();
  });

  function checkPrayerSounds() {
    if (document.hidden) return;
    const now = Date.now(), today = todayKey();
    const days = [dayShift(today, -1), today, dayShift(today, 1)];
    const events = reminderEvents();
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
  const compassFailureNotes = [[520, 0, .18, .13], [370, .21, .25, .13]];
  const alignmentLimit = 3;
  let compassReading = null, magneticVariation = null, alignmentChimed = false;
  let qiblaCompassOn = false, compassStarting = false, compassRun = 0;
  let compassAudioReady = null, compassFailure = '', compassProblem = '';
  let variationPromise = null, variationKey = '', variationFailed = false;
  let headingTimer = null, compassProblemTimer = null;
  let compassIssuesPlayed = new Set();
  function playCompassChime(notes) {
    if (!cfg.qiblaSound) return;
    if (audio.chime(notes)) return;
    const run = compassRun;
    const stillOnCompass = () => run === compassRun && cfg.qiblaSound && !$('qiblaPanel').hidden && !document.hidden;
    void compassAudioReady?.then(async () => {
      if (!stillOnCompass() || audio.chime(notes)) return;
      if (await audio.unlock() && stillOnCompass()) audio.chime(notes);
    });
  }

  function announceCompassIssue(kind) {
    if (compassIssuesPlayed.has(kind) || $('qiblaPanel').hidden || document.hidden) return;
    compassIssuesPlayed.add(kind);
    playCompassChime(compassFailureNotes);
  }

  function checkCompassProblem(problem) {
    if (compassProblem === problem) return;
    compassProblem = problem;
    clearTimeout(compassProblemTimer);
    if (problem) compassProblemTimer = setTimeout(() => announceCompassIssue(problem), 1400);
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
    const cardinal = i % 15 === 0;
    return '<path class="compass-tick' + (cardinal ? ' cardinal' : major ? ' major' : '') +
      '" d="M' + pointText(i * 6, cardinal ? 127 : major ? 133 : 138) + ' L' + pointText(i * 6, 144) + '"/>';
  }).join('');

  function resetMagneticCorrection() {
    variationKey = '';
    magneticVariation = null;
    variationFailed = false;
    alignmentChimed = false;
  }

  function renderQibla() {
    const bearing = qiblaBearing(cfg.lat, cfg.lng);
    const heading = compassReading?.heading;
    const accuracy = compassReading?.accuracy;
    const knownAccuracy = Number.isFinite(accuracy) && accuracy >= 0;
    const approximate = compassReading?.kind === 'absolute';
    const correction = Number.isFinite(magneticVariation);
    const validHeading = Number.isFinite(heading);
    const usable = validHeading && (approximate || (knownAccuracy && accuracy <= 20));
    const live = qiblaCompassOn && !!compassReading && !compassReading.tilted &&
      correction && usable;
    const rotation = live ? norm360(heading + magneticVariation) : 0;
    const direction = (bearing - rotation + 540) % 360 - 180;
    const difference = Math.abs(direction);
    const near = difference <= 15;
    // Round close readings up to a tenth so yellow never displays as 3° or less.
    const angle = near ? Math.ceil((difference - 1e-9) * 10) / 10 : Math.round(difference);
    const aligned = live && difference <= alignmentLimit + 1e-9;
    const turn = direction < 0 ? 'left' : 'right';
    const problem = qiblaCompassOn && compassReading && !compassReading.tilted
      ? (!usable ? 'accuracy' : !correction && variationFailed ? 'correction' : '')
      : '';
    checkCompassProblem(problem);

    let state = 'reference', cue = '', mark = '', help = '';
    if (compassFailure) {
      state = 'weak'; cue = 'Compass unavailable'; mark = '!';
      help = compassFailure;
    } else if (compassStarting || (qiblaCompassOn && !compassReading)) {
      state = 'waiting'; cue = compassStarting ? 'Waiting for permission' : 'Finding your heading'; mark = '…';
      help = 'Hold the phone flat, away from metal.';
    } else if (compassReading?.tilted) {
      state = 'weak'; cue = 'Hold your phone flat'; mark = '!';
      help = compassReading.portrait ? 'Keep the screen facing upwards.' : 'Use portrait orientation.';
    } else if (problem) {
      state = 'weak'; mark = '!';
      cue = problem === 'accuracy' ? 'Compass reading is weak' : 'Magnetic correction unavailable';
      help = problem === 'accuracy' ? 'The reading is not accurate enough. Move away from metal.' :
        'Use the true bearing below.';
    } else if (live) {
      state = aligned ? 'aligned' : near ? 'near' : 'turn';
      cue = aligned ? 'Heading aligned · ' + angle + '° off' :
        near ? 'A little to the ' + turn : 'Turn ' + turn + ' ' + angle + '°';
      mark = aligned ? '✓' : direction < 0 ? '↶' : '↷';
      help = approximate ? 'Approximate heading. Check with a calibrated compass.' : 'Hold your phone flat.';
    } else if (qiblaCompassOn && !correction) {
      state = 'waiting'; cue = 'Finding magnetic correction'; mark = '…';
      help = 'Keep the phone flat.';
    }

    const dial = $('qiblaDial'), status = $('qiblaAligned');
    dial.classList.toggle('live', live);
    dial.classList.toggle('aligned', aligned);
    dial.dataset.state = status.dataset.state = state;
    status.hidden = !cue;
    $('qiblaCueMark').textContent = mark;
    if ($('qiblaCue').textContent !== cue) $('qiblaCue').textContent = cue;
    if ($('qiblaAccuracy').textContent !== help) $('qiblaAccuracy').textContent = help;
    $('qiblaAccuracy').hidden = !help;
    $('qiblaBearing').textContent = bearing.toFixed(1) + '°';
    $('qiblaCardinal').textContent = compassPoints[Math.round(bearing / 22.5) % 16];
    $('qiblaTurnAngle').textContent = (live ? angle : bearing.toFixed(1)) + '°';
    $('qiblaTurnLabel').textContent = aligned ? 'From Qibla' : live ? 'Turn ' + turn : 'From true north';
    $('qiblaDistance').textContent = Math.round(kmApart(cfg, KAABA)).toLocaleString('en-GB') + ' km';
    $('qiblaPosition').textContent = cfg.location;
    $('qiblaPrecisionRow').hidden = !compassReading;
    $('qiblaPrecision').textContent = accuracy < 0 ? 'Uncalibrated' : !validHeading ? 'Unavailable' :
      knownAccuracy ? '±' + Math.round(accuracy) + '°' : 'Unknown';
    $('compassTicks').setAttribute('transform', 'rotate(' + -rotation + ' 160 160)');
    for (const [i, id] of compassLetters.entries()) {
      const [x, y] = compassPoint(i * 90 - rotation, 120);
      $(id).setAttribute('x', x.toFixed(1));
      $(id).setAttribute('y', y.toFixed(1));
    }
    const radius = 97;
    const target = pointText(direction, radius);
    $('qiblaMarker').setAttribute('transform', 'translate(' + target + ')');
    $('qiblaArc').setAttribute('d', difference > alignmentLimit + 1e-9
      ? 'M160 ' + (160 - radius) + ' A' + radius + ' ' + radius + ' 0 0 ' + (direction < 0 ? 0 : 1) + ' ' + target : '');

    if (!live || difference > alignmentLimit + 1) alignmentChimed = false;
    if (aligned && !alignmentChimed && !$('qiblaPanel').hidden && !document.hidden) {
      playCompassChime(alignmentNotes);
      alignmentChimed = true;
    }
  }

  async function loadVariation() {
    const now = new Date();
    const lat = cfg.lat, lng = cfg.lng;
    const key = [lat, lng, now.getUTCFullYear(), now.getUTCMonth()].join(':');
    if (variationKey === key) return variationPromise;
    variationKey = key;
    variationFailed = false;
    variationPromise = (async () => {
      try {
        const model = await import('./vendor/magvar/magvar.mjs');
        if (now.getUTCFullYear() < model.MODEL_EPOCH || now.getUTCFullYear() >= model.MODEL_VALID_UNTIL) throw Error('Model date');
        const value = model.magvar(lat, lng, 0, now);
        if (!Number.isFinite(value) || Math.abs(value) > 180) throw Error('Model value');
        if (variationKey === key) magneticVariation = value;
      } catch {
        if (variationKey === key) {
          magneticVariation = null;
          variationFailed = true;
          variationKey = '';
        }
      }
    })();
    return variationPromise;
  }

  function orientationHandler(event) {
    if (!qiblaCompassOn || document.hidden || $('qiblaPanel').hidden) return;
    const webkit = 'webkitCompassHeading' in event;
    const absolute = event.absolute === true || event.type === 'deviceorientationabsolute';
    if (!webkit && (!absolute || compassReading?.kind === 'webkit')) return;
    const degrees = webkit ? event.webkitCompassHeading : event.alpha;
    const validHeading = Number.isFinite(degrees) && degrees >= 0 && degrees <= 360;
    clearTimeout(headingTimer);
    const portrait = !(screen.orientation?.angle ?? window.orientation ?? 0);
    const tilted = Math.abs(event.beta || 0) > 35 || Math.abs(event.gamma || 0) > 35;
    compassReading = {
      kind:webkit ? 'webkit' : 'absolute', portrait, tilted:tilted || !portrait,
      heading:validHeading ? norm360(webkit ? degrees : -degrees) : null,
      accuracy:webkit && Number.isFinite(event.webkitCompassAccuracy) ? event.webkitCompassAccuracy : null
    };
    renderQibla();
  }

  function endCompassReading() {
    clearTimeout(headingTimer);
    checkCompassProblem('');
    window.removeEventListener('deviceorientation', orientationHandler);
    window.removeEventListener('deviceorientationabsolute', orientationHandler);
    qiblaCompassOn = false;
    compassStarting = false;
    compassReading = null;
    alignmentChimed = false;
  }
  function stopCompass() {
    compassRun++;
    endCompassReading();
    compassFailure = '';
    $('startCompass').textContent = 'Start compass';
    renderQibla();
  }
  function failCompass(message) {
    endCompassReading();
    compassFailure = message;
    $('startCompass').textContent = 'Try compass again';
    announceCompassIssue('unavailable');
    renderQibla();
  }

  $('startCompass').addEventListener('click', async () => {
    if (qiblaCompassOn || compassStarting) { stopCompass(); return; }
    const run = ++compassRun;
    compassFailure = '';
    compassIssuesPlayed = new Set();
    compassAudioReady = cfg.qiblaSound ? audio.unlock() : null;
    if (typeof DeviceOrientationEvent === 'undefined' || !window.isSecureContext) {
      failCompass('Use the bearing below, or open Salah over HTTPS on a phone with a compass.');
      return;
    }
    compassStarting = true;
    $('startCompass').textContent = 'Cancel';
    renderQibla();
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (run !== compassRun) return;
        if (permission !== 'granted') {
          failCompass('Motion access was denied. Use the bearing below.');
          return;
        }
      }
      if (run !== compassRun || $('qiblaPanel').hidden) return;
      compassStarting = false;
      qiblaCompassOn = true;
      $('startCompass').textContent = 'Stop compass';
      window.addEventListener('deviceorientation', orientationHandler);
      window.addEventListener('deviceorientationabsolute', orientationHandler);
      headingTimer = setTimeout(() => {
        if (qiblaCompassOn && !compassReading)
          failCompass('The phone sent no compass heading. Use the bearing below.');
      }, 4500);
      renderQibla();
      void loadVariation().then(renderQibla);
    } catch {
      if (run === compassRun) failCompass('The phone could not give compass access. Use the bearing below.');
    }
  });

  $('qiblaGPS').addEventListener('click', () => {
    const status = $('qiblaGPSStatus');
    if (!navigator.geolocation) { status.textContent = 'GPS unavailable.'; return; }
    status.textContent = 'Getting current GPS position…';
    const request = ++placeRequest;
    navigator.geolocation.getCurrentPosition(pos => {
      if (request !== placeRequest) return;
      const place = positionPlace(pos);
      if (place.error) { status.textContent = place.error; return; }
      applyLocation(place);
      status.textContent = 'Location updated.';
    }, () => {
      if (request === placeRequest) status.textContent = 'GPS unavailable. Using the saved location.';
    }, { enableHighAccuracy:true, timeout:12000, maximumAge:15000 });
  });

  $('qiblaChime').checked = cfg.qiblaSound;
  $('qiblaChime').addEventListener('change', () => {
    cfg.qiblaSound = $('qiblaChime').checked;
    store();
    if (cfg.qiblaSound) compassAudioReady = audio.unlock();
  });

  const fastingLabels = { fasted:'Fasted', due:'Missed', 'made-up':'Made up', 'make-up':'Make-up fast' };
  const fastingSymbols = { fasted:'✓', due:'•', 'made-up':'↺', 'make-up':'✓' };
  const fastingStore = 'salah-fasting-log';
  const countInputs = { fasted:$('undatedFasted'), missed:$('undatedMissed'), madeUp:$('undatedMadeUp') };
  const emptyCounts = { fasted:0, missed:0, madeUp:0 };
  const validCount = value => Number.isSafeInteger(value) && value >= 0;
  const validCounts = value => value && validCount(value.fasted) && validCount(value.missed) &&
    (value.madeUp === undefined || (validCount(value.madeUp) && value.madeUp <= value.fasted));
  let fastingKey = todayKey();
  let fastingFollowingToday = true;
  let fastingLog = readFastingLog();

  function validFastingRecords(records) {
    return Object.fromEntries(Object.entries(records).filter(([key, mark]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || typeof mark !== 'string' || !Object.hasOwn(fastingLabels, mark)) return false;
      const date = dateAtNoonUTC(key);
      return Number.isFinite(+date) && date.toISOString().slice(0, 10) === key;
    }));
  }
  function readFastingLog() {
    try {
      const stored = JSON.parse(localStorage.getItem(fastingStore) || '{}');
      const counts = validCounts(stored.undated) ? stored.undated : null;
      return { entries:validFastingRecords(stored), counts };
    } catch { return { entries:{}, counts:null }; }
  }
  function writeFastingLog(log) {
    localStorage.setItem(fastingStore, JSON.stringify({ ...log.entries, ...(log.counts && { undated:log.counts }) }));
    fastingLog = log;
    if (!$('fastingPanel').hidden) renderFasting();
  }

  function saveFastingCount(key, count) {
    const updated = readFastingLog();
    const previous = { ...emptyCounts, ...updated.counts };
    const exceedsFasted = key === 'madeUp' && count > previous.fasted;
    if (!validCount(count) || exceedsFasted) {
      countInputs[key].value = previous[key];
      $('fastingCountStatus').textContent = exceedsFasted ? 'Make-up fasts cannot exceed the days fasted.' : 'Enter a whole number of days.';
      return;
    }
    try {
      const next = { ...previous, [key]:count };
      const adjusted = next.madeUp > next.fasted;
      const madeUp = Math.min(next.madeUp, next.fasted);
      updated.counts = { fasted:next.fasted, missed:next.missed, ...(madeUp && { madeUp }) };
      writeFastingLog(updated);
      countInputs[key].value = count;
      $('fastingCountStatus').textContent = adjusted ? 'Make-up count adjusted to ' + madeUp + '.' : '';
    } catch {
      countInputs[key].value = previous[key];
      $('fastingCountStatus').textContent = 'Could not save this count.';
    }
  }
  $('fastingTotals').addEventListener('click', event => {
    const button = event.target.closest('button[data-count]');
    if (!button) return;
    const key = button.dataset.count;
    const count = readFastingLog().counts?.[key] ?? 0;
    saveFastingCount(key, count + Number(button.dataset.step));
  });
  $('fastingTotals').addEventListener('change', event => {
    const key = event.target.dataset.count;
    if (key) saveFastingCount(key, event.target.valueAsNumber);
  });
  $('fastingTotals').addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input[data-count]')) event.target.blur();
  });

  const upcomingFormat = new Intl.DateTimeFormat('en-GB', { timeZone:'UTC', day:'numeric', month:'short', year:'numeric' });
  let lastOccasionDate;
  function renderIslamicDates(today) {
    const key = hijriDayKey(today, getDay(today), Date.now());
    if (key === lastOccasionDate) return;
    lastOccasionDate = key;
    const { dates, fasts } = SalahHijri.upcoming(key);
    const { ramadan, ...eids } = dates;
    const available = Object.keys(dates).length > 0;
    $('datesUnavailable').hidden = available;
    $('occasionGroups').hidden = !available;
    renderOccasions('upcomingFasts', { ...fasts, ...(ramadan && { ramadan }) });
    renderOccasions('upcomingEids', eids);
  }

  function renderOccasions(elementId, occasions) {
    const list = $(elementId);
    const opened = new Set([...list.querySelectorAll('details[open]')].map(detail => detail.parentElement.dataset.occasion));
    const ordered = Object.entries(occasions).sort((a, b) => a[1].from.localeCompare(b[1].from));
    list.innerHTML = ordered.map(([id, event]) => {
      const from = dateAtNoonUTC(event.from), to = event.to && dateAtNoonUTC(event.to);
      const date = !to ? upcomingFormat.format(from) : typeof upcomingFormat.formatRange === 'function' ?
        upcomingFormat.formatRange(from, to) : upcomingFormat.format(from) + ' – ' + upcomingFormat.format(to);
      const { name, kind, ruling, notes, sources } = SalahHijri.occasions[id];
      const title = id === 'ashura' && to ? 'Ashura and the day before' : name;
      const start = SalahHijri.label(event.from);
      const hijri = to ? start.split(' ')[0] + '–' + SalahHijri.label(event.to) : start;
      const links = sources.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`).join('');
      return `<li data-occasion="${id}"><details class="occasion"${opened.has(id) ? ' open' : ''}>
        <summary><time datetime="${event.from}">${date}</time><span><strong>${title}</strong>
          <span class="occasion-hijri">${hijri}</span><span class="occasion-ruling" data-kind="${kind}">${ruling}</span>
        </span><span class="occasion-chevron" aria-hidden="true"></span></summary>
        <div class="occasion-info">${notes.map(note => `<p>${note}</p>`).join('')}<div class="occasion-sources">${links}</div></div>
      </details></li>`;
    }).join('');
  }

  function fastingBalance(entries, totals) {
    const missed = [], fasted = [];
    let covered = 0, undatedDue = totals.missed;
    for (const [key, mark] of Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))) {
      if (mark === 'due') missed.push(key);
      if (mark === 'fasted' || mark === 'make-up') fasted.push(key);
      if (mark !== 'make-up') continue;
      // A dated make-up can cover an earlier dated miss or a missed day without a date.
      if (covered < missed.length) covered++;
      else undatedDue = Math.max(0, undatedDue - 1);
    }
    const undatedCovered = Math.min(undatedDue, totals.madeUp);
    covered += totals.madeUp - undatedCovered;
    return {
      fasted, due:missed.slice(covered), coveredDates:new Set(missed.slice(0, covered)),
      undatedDue:undatedDue - undatedCovered
    };
  }

  const fastingWeekFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone:'UTC', year:'numeric', month:'short', day:'numeric'
  });
  function renderFasting(restoreFocus = false) {
    const date = dateAtNoonUTC(fastingKey), today = todayKey();
    const { entries:fastingRecords, counts } = fastingLog;
    const totals = { ...emptyCounts, ...counts };
    const { fasted, due, coveredDates, undatedDue } = fastingBalance(fastingRecords, totals);
    const markForDate = key => coveredDates.has(key) ? 'made-up' : fastingRecords[key] || '';
    for (const [key, input] of Object.entries(countInputs)) {
      if (input !== document.activeElement) input.value = totals[key];
      $('fastingTotals').querySelector(`button[data-count="${key}"][data-step="-1"]`).disabled = totals[key] === 0;
    }
    countInputs.madeUp.max = totals.fasted;
    $('fastingTotals').querySelector('button[data-count="madeUp"][data-step="1"]').disabled = totals.madeUp >= totals.fasted;
    const dayOfWeek = (date.getUTCDay() + 6) % 7;
    const week = cfg.fastingView === 'week';
    const startKey = week ? dayShift(fastingKey, -dayOfWeek) : fastingKey.slice(0, 7) + '-01';
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate();
    const days = week ? 7 : lastDay;
    const endKey = dayShift(startKey, days - 1);
    const first = dateAtNoonUTC(startKey), last = dateAtNoonUTC(endKey);
    const blanks = week ? 0 : (first.getUTCDay() + 6) % 7;
    const grid = $('fastingDays');
    const focusInGrid = grid.contains(document.activeElement);

    $('fastingView').dataset.view = cfg.fastingView;
    for (const button of $('fastingLayouts').children)
      button.setAttribute('aria-pressed', button.dataset.fastingView === cfg.fastingView);
    $('fastingPrevious').setAttribute('aria-label', 'Previous ' + cfg.fastingView);
    $('fastingNext').setAttribute('aria-label', 'Next ' + cfg.fastingView);
    $('fastingToday').hidden = fastingKey === today;
    const range = () => typeof fastingWeekFormat.formatRange === 'function' ? fastingWeekFormat.formatRange(first, last) :
      fastingWeekFormat.format(first) + ' – ' + fastingWeekFormat.format(last);
    $('fastingMonth').textContent = week ? range() :
      date.toLocaleDateString('en-GB', { timeZone:'UTC', month:'long', year:'numeric' });
    grid.innerHTML = '<span aria-hidden="true"></span>'.repeat(blanks) + Array.from({ length:days }, (_, i) => {
      const key = dayShift(startKey, i);
      const mark = markForDate(key);
      const selected = key === fastingKey;
      const label = prettyKey(key) + (mark ? ', ' + fastingLabels[mark] : '');
      return '<button type="button" class="fast-day" data-date="' + key + '" data-mark="' + mark +
        '" tabindex="' + (selected ? 0 : -1) + '" aria-label="' + label + '" aria-pressed="' + selected +
        '" aria-controls="fastingDetail"' + (key === today ? ' aria-current="date"' : '') +
        '><span>' + Number(key.slice(-2)) + '</span><small aria-hidden="true">' + (fastingSymbols[mark] || '') + '</small></button>';
    }).join('');
    if (restoreFocus || focusInGrid) grid.querySelector('[aria-pressed="true"]').focus();

    const inView = fasted.filter(key => key >= startKey && key <= endKey).length;
    $('fastingCompleted').textContent = fasted.length + totals.fasted;
    $('calendarFasted').textContent = inView + ' fasted this ' + cfg.fastingView;
    $('fastingDue').textContent = due.length + undatedDue;
    $('fastingDueDates').innerHTML = due.map(key =>
      '<button type="button" class="text-button" data-date="' + key + '">' + prettyKey(key) + '</button>').join('') +
      (undatedDue ? `<p>${undatedDue} without dates</p>` : due.length ? '' : '<p>No fasts left to make up.</p>');

    $('fastingRelative').textContent = fastingKey === today ? 'Today' : '';
    $('fastingDate').textContent = date.toLocaleDateString('en-GB', {
      timeZone:'UTC', weekday:'long', day:'numeric', month:'long', ...(date.getUTCFullYear() !== dateAtNoonUTC(today).getUTCFullYear() && { year:'numeric' })
    });

    const times = getDay(fastingKey);
    const estimated = times.valid && isEstimated(times, 'fajr');
    $('fastingFajr').textContent = fmt(times.fajr);
    $('fastingEstimated').hidden = !estimated;
    $('fastingIftar').textContent = fmt(times.maghrib);
    const minutes = times.maghrib && times.fajr ? Math.round((times.maghrib - times.fajr) / 60000) : 0;
    $('fastingDuration').textContent = minutes > 0 ? Math.floor(minutes / 60) + 'h ' + minutes % 60 + 'm' : '—';
    $('fastingLengthLabel').hidden = minutes <= 0;
    $('fastingEstimate').textContent = times.sourceFallback ? 'Using local times for this date.' :
      !times.fajr ? 'Fajr is unavailable under the selected method.' : '';

    const mark = markForDate(fastingKey);
    const badge = $('fastingMark');
    badge.textContent = fastingLabels[mark] || '';
    badge.dataset.status = mark;
    badge.hidden = !mark;
    $('fastingQuestion').hidden = !!mark;
    $('fastingMadeUp').hidden = mark !== 'due';
    const makeUpAction = $('logFastingMakeUp');
    makeUpAction.hidden = mark !== 'make-up' && (fastingKey > today || (!!mark && mark !== 'fasted'));
    makeUpAction.textContent = mark === 'make-up' ? 'Change to a regular fast' : 'Log as a make-up fast';
    makeUpAction.dataset.fastStatus = mark === 'make-up' ? 'fasted' : 'make-up';
    $('clearFastingEntry').hidden = !mark;
    if (cfg.activeSource === 'moonsighting' && navigator.onLine) void fetchOnline(cfg.activeSource, fastingKey);
  }

  function selectFastingDate(key, focus = false) {
    fastingKey = key;
    fastingFollowingToday = key === todayKey();
    $('fastingStatus').textContent = '';
    renderFasting(focus);
  }
  function changeFastingPeriod(offset) {
    if (cfg.fastingView === 'week') {
      selectFastingDate(dayShift(fastingKey, offset * 7));
      return;
    }
    const [year, month, day] = fastingKey.split('-').map(Number);
    const last = new Date(Date.UTC(year, month + offset, 0, 12)).getUTCDate();
    const date = new Date(Date.UTC(year, month - 1 + offset, Math.min(day, last), 12));
    selectFastingDate(date.toISOString().slice(0, 10));
  }
  $('fastingPrevious').addEventListener('click', () => changeFastingPeriod(-1));
  $('fastingNext').addEventListener('click', () => changeFastingPeriod(1));
  $('fastingToday').addEventListener('click', () => selectFastingDate(todayKey()));
  $('fastingLayouts').addEventListener('click', event => {
    const button = event.target.closest('[data-fasting-view]');
    if (!button) return;
    cfg.fastingView = button.dataset.fastingView;
    store();
    renderFasting();
  });
  function openFastingDate(event) {
    const day = event.target.closest('button[data-date]');
    if (!day) return;
    selectFastingDate(day.dataset.date);
    $('fastingDate').focus({ preventScroll:true });
    $('fastingDetail').scrollIntoView({ block:'nearest' });
  }
  $('fastingDays').addEventListener('click', openFastingDate);
  $('fastingDueDates').addEventListener('click', openFastingDate);
  $('fastingDays').addEventListener('keydown', event => {
    const offsets = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-7, ArrowDown:7 };
    const step = offsets[event.key];
    if (!step) return;
    event.preventDefault();
    selectFastingDate(dayShift(fastingKey, step), true);
  });
  document.querySelector('.fasting-actions').addEventListener('click', event => {
    const button = event.target.closest('[data-fast-status]');
    if (!button || button.closest('[hidden]')) return;
    const mark = button.dataset.fastStatus;
    const updated = readFastingLog();
    if (mark) updated.entries[fastingKey] = mark;
    else delete updated.entries[fastingKey];
    try {
      writeFastingLog(updated);
      $('fastingStatus').textContent = mark ? fastingLabels[mark] + ' saved.' : 'Entry cleared.';
      if (button.closest('[hidden]')) $('fastingDate').focus({ preventScroll:true });
    } catch {
      $('fastingStatus').textContent = 'Could not save this entry.';
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== fastingStore && event.key !== null) return;
    fastingLog = readFastingLog();
    for (const [key, input] of Object.entries(countInputs)) input.value = fastingLog.counts?.[key] ?? 0;
    if (!$('fastingPanel').hidden) renderFasting();
  });

  $('saveFastingLog').addEventListener('click', async () => {
    const status = $('fastingBackupStatus');
    const { entries, counts } = readFastingLog();
    const backup = { format:fastingStore, entries, ...(counts && { undated:counts }) };
    if (!Object.keys(entries).length && !counts) {
      status.textContent = 'There are no fasting entries to save.';
      return;
    }
    const file = new File([JSON.stringify(backup)], 'Salah-fasting-log.json', { type:'application/json' });
    if (isStandalone() && navigator.canShare?.({ files:[file] })) {
      try {
        await navigator.share({ files:[file] });
        status.textContent = 'Fasting log shared.';
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 30000);
    status.textContent = 'Fasting log ready to save.';
  });
  $('chooseFastingLog').addEventListener('click', () => $('restoreFastingLog').click());
  $('restoreFastingLog').addEventListener('change', async () => {
    const input = $('restoreFastingLog'), file = input.files?.[0];
    const status = $('fastingBackupStatus');
    if (!file) return;
    input.value = '';
    let entries, counts;
    try {
      if (file.size > 1048576) throw Error('File too large');
      const backup = JSON.parse(await file.text());
      if (backup.format !== fastingStore || !backup.entries || Array.isArray(backup.entries) ||
          typeof backup.entries !== 'object') throw Error('Invalid backup');
      entries = validFastingRecords(backup.entries);
      if (backup.undated !== undefined && !validCounts(backup.undated)) throw Error('Invalid counts');
      counts = backup.undated;
      if (Object.keys(entries).length !== Object.keys(backup.entries).length) throw Error('Invalid entries');
    } catch {
      status.textContent = 'Choose a fasting log saved from Salah.';
      return;
    }
    try {
      const current = readFastingLog();
      const restored = { ...entries, ...current.entries };
      const added = Object.keys(restored).length - Object.keys(current.entries).length;
      writeFastingLog({ entries:restored, counts:current.counts || counts || null });
      status.textContent = 'Restored ' + added + ' ' + (added === 1 ? 'entry' : 'entries') +
        (counts && !current.counts ? ' and undated counts.' : '.');
    } catch {
      status.textContent = 'Could not restore the fasting log.';
    }
  });

  const screenIds = {today:'today', qibla:'qiblaPanel', fasting:'fastingPanel', dates:'datesPanel', sounds:'soundPanel', settings:'settingsDialog'};
  function showScreen(target) {
    if (target === 'compare') {
      target = 'settings';
      $('comparisonPanel').open = true;
    }
    if (!Object.hasOwn(screenIds, target)) target = 'today';
    for (const [name,id] of Object.entries(screenIds)) {
      $(id).hidden = name !== target;
    }
    document.querySelectorAll('[data-screen-target]').forEach(button => {
      const active = button.dataset.screenTarget === target;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      button.tabIndex = active ? 0 : -1;
    });
    if (target === 'today' && dayInfo?.valid) { renderHijriDate(); renderHero(dayInfo); renderPrayerList(dayInfo); updateSunChart(Date.now()); }
    if (target === 'settings') {
      showSettings();
      if (comparisonOpen()) renderComparison();
    }
    if (target === 'fasting') renderFasting();
    if (target === 'dates') renderIslamicDates(todayKey());
    if (target === 'qibla') {
      renderQibla();
      if (qiblaCompassOn) void loadVariation().then(renderQibla);
    } else if (qiblaCompassOn || compassStarting) stopCompass();
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
  showScreen(location.hash.slice(1));
  cacheAdhansAutomatically();

  window.addEventListener('online', () => { $('offlineIndicator').hidden=true; failedOnline.clear(); loadComparison(); void cacheAdhansAutomatically(); });
  window.addEventListener('offline', () => { $('offlineIndicator').hidden=false; render(); });

  renderQibla();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  render(); startTracking(); checkPrayerSounds();
})();

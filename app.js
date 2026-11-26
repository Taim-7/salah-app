(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const native = window.SalahNative;
  let nativeReady = false, nativeVisible = true;
  const defaults = {
    useDeviceLocation: true, permissionSetupDone: false, method: '15-13', fajrAngle: 15, ishaAngle: 13,
    ishaLimit: 'half', highLatRule: 'seventh',
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
      delete c.ishaPreference;
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
      delete c.firstThirdReminder;
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
      c.useDeviceLocation = c.useDeviceLocation === true;
      c.permissionSetupDone = raw.permissionSetupDone === true &&
        (typeof raw.useDeviceLocation === 'boolean' || raw.autoLocation === true);
      for (const field of ['lat', 'lng', 'location', 'timeZone', 'autoLocation']) delete c[field];
      return c;
    } catch {
      return { ...defaults, accent:launchAccent, iconChoice:launchIcon };
    }
  }

  let cfg = loadConfig();
  const store = () => {
    try { localStorage.setItem('salah-config', JSON.stringify(cfg)); } catch {}
    if (nativeReady) queueMicrotask(checkPrayerReminders);
  };
  if (Object.hasOwn(palettes, paletteQuery) || Object.hasOwn(palettes, iconQuery) || Object.hasOwn(iconDesigns, iconQuery)) store();
  const anglePair = () => SalahTimetable.angles(cfg);
  let currentPlace = null;
  const todayKey = () => dateParts(new Date(), currentPlace?.timeZone);

  function fmt(date) {
    if (!currentPlace || !(date instanceof Date) || !Number.isFinite(+date)) return '—';
    const { timeZone } = currentPlace;
    const key = timeZone + ':' + cfg.timeFormat;
    if (!clockFormats.has(key)) clockFormats.set(key, new Intl.DateTimeFormat('en-GB', {
      timeZone, hour: cfg.timeFormat === '12' ? 'numeric' : '2-digit',
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
  let browsing = false, dayInfo = null, lastListRefresh = 0;
  let currentHero = null, sunChart = null;
  const canUseLocation = !!native || (window.isSecureContext && !!navigator.geolocation);
  let geoWatch = null, geoRun = 0, locationIssue = '';
  let trackingDenied = false, requestingLaunchMotion = false;
  let scheduledPlace, movementCandidate;
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
  const cacheId = (kind, key, place = currentPlace) => place ? [
    providerPrefix + kind, key, place.lat, place.lng, place.timeZone, '1'
  ].join(':') : null;
  const pendingOnline = new Set(), failedOnline = new Map(), onlineMem = new Map();
  const DAY_MS = 86400000;
  const validFor = 7 * DAY_MS;
  function readCached(kind, key, place = currentPlace) {
    const id = cacheId(kind, key, place);
    if (!id) return null;
    if (onlineMem.has(id)) return onlineMem.get(id);
    try {
      const saved = JSON.parse(localStorage.getItem(id));
      if (!saved?.raw || !Number.isFinite(saved.at)) return null;
      const day = SalahProviders.decode(kind, key, place.timeZone, saved.raw, place);
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
    const place = currentPlace;
    if (!place) return;
    const { lat, lng, timeZone } = place;
    const id = cacheId(kind, key, place);
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
      if (native && id === cacheId(kind, key, scheduledPlace) && cfg.activeSource === kind) checkPrayerReminders();
    }
  }
  function loadComparison(force = false) {
    if (!currentPlace || !navigator.onLine) return;
    if (cfg.activeSource !== 'moonsighting') {
      if (force) void fetchOnline('moonsighting', selectedKey, true);
      return;
    }
    const today = todayKey();
    const requested = new Set([selectedKey, dayShift(selectedKey, 1), today, dayShift(today, -1), dayShift(today, 1)]);
    if (native) requested.add(dayShift(today, 2)); // Following Fajr for the second scheduled night.
    requested.forEach(key => { void fetchOnline(cfg.activeSource, key, force && (key === selectedKey || key === dayShift(selectedKey, 1))); });
  }

  const localDays = new Map();
  function localDay(key, source = 'angles', rule = cfg.highLatRule, place = currentPlace) {
    if (!place) return { valid:false, reason:'Waiting for your location' };
    const [fa, ia] = anglePair();
    const id = [source, key, place.lat, place.lng, fa, ia, rule].join(':');
    if (localDays.has(id)) return localDays.get(id);
    const day = SalahTimetable.localDay(key, { ...cfg, ...place }, source, rule);
    if (localDays.size >= 540) localDays.delete(localDays.keys().next().value);
    localDays.set(id, day);
    return day;
  }

  function getActiveDay(key, place = currentPlace) {
    const local = localDay(key, cfg.activeSource === 'tayba' ? 'tayba' : 'angles', cfg.highLatRule, place);
    if (cfg.activeSource !== 'moonsighting' || !local.valid) return local;
    const today = readCached(cfg.activeSource, key, place);
    if (!today) return { ...local, sourceFallback:true };
    const next = readCached(cfg.activeSource, dayShift(key, 1), place);
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
      const nextDay = time && dateParts(time, currentPlace.timeZone) !== selectedKey ? ' (+1 day)' : '';
      const status = c.id === 'moonsighting' ?
        !currentPlace ? '—' : pendingOnline.has(id) ? 'Loading…' : failedOnline.has(id) || !navigator.onLine ? 'Unavailable' : 'Load online' : '—';
      return `<td class="${c.id === cfg.activeSource ? 'selected-col' : ''}">${time ?
        `<span class="time-small">${fmt(time)}</span><span class="difference ${delta > 0 ? 'late' : delta < 0 ? 'early' : ''}">${diff}${hint}${nextDay}</span>` :
        `<span class="unknown">${status}</span>`}</td>`;
    }).join('') + '</tr>').join('');
    const messages = [];
    if (!currentPlace) messages.push('Use your location to compare prayer times.');
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
      const nextDay = dateParts(time, currentPlace.timeZone) !== selectedKey ? ' (+1 day)' : '';
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
    renderLocationState();
  }
  function renderLocationState() {
    const finding = !currentPlace && geoWatch !== null && !locationIssue;
    const message = locationIssue || (finding ? 'Finding your location…' :
      canUseLocation ? 'Allow location access to see your prayer times and Qibla.' :
        'Open Salah over HTTPS on a device with location access.');
    $('locationLabel').textContent = currentPlace?.location || 'Location needed';
    $('locationDetails').hidden = !currentPlace;
    placeDateControls();
    $('timezoneLabel').textContent = currentPlace ? (currentPlace.timeZone === 'Europe/Dublin' ? 'Ireland time' : 'UK time') : '';
    $('locationPrompt').hidden = !!currentPlace;
    $('liveLocationStatus').textContent = message;
    $('prayerDashboard').hidden = !currentPlace;
    $('qiblaView').hidden = !currentPlace;
    $('qiblaLocationPrompt').hidden = !!currentPlace;
    $('qiblaGPSStatus').textContent = message;
    $('gpsStatus').textContent = currentPlace ? 'Following ' + currentPlace.location : message;
    $('setGPS').textContent = currentPlace ? 'Refresh location' : 'Use my location';
    $('refreshSources').disabled = !currentPlace;
    for (const button of document.querySelectorAll('[data-find-location]')) button.disabled = finding || !canUseLocation;
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
      return { level:'calm', label:'Isha time', desc:'Until ' + fmt(deadline) };
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
    const lateIsha = t.ishaBeyondFirstThird && t.isha > t.firstThird;
    const thirdTitle = selectedThird ? 'Isha cutoff · first third' :
      lateIsha ? 'First third passed before Isha' : 'First third of the night ends';
    const halfTitle = selectedThird ? 'Halfway through the night' : 'Ordinary Isha cutoff';
    const thirds = { at:t.firstThird, title:thirdTitle,
      desc:lateIsha ? 'Calculated Isha begins at or after this point' : '',
      kind:'night', icon:'third', estimated:t.nightEstimated };
    const half = { at:t.midnight, title:halfTitle, desc:'Half of the night', kind:'night', icon:'half', estimated:t.nightEstimated };

    const limits = SalahSolar.daylightRestrictions(dateAtNoonUTC(selectedKey), currentPlace.lat, currentPlace.lng).map(range => ({
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
      const dimmed = current && !isCurrent && !activeRange && (e.end || e.at) <= now;
      const extra = e.end ? `<span class="range-label">to ${fmt(e.end)}</span>` : '';
      const following = dateParts(e.at, currentPlace.timeZone) !== selectedKey ? '<span class="next-day">+1 day</span>' : '';
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
    const { lat, lng, timeZone } = currentPlace;
    const start = +SalahProviders.localToUtc(selectedKey, 0, 0, timeZone);
    const localEnd = +SalahProviders.localToUtc(dayShift(selectedKey, 1), 0, 0, timeZone);
    const end = Math.max(localEnd, day.isha ? +day.isha + 600000 : localEnd);
    const id = [start, end, lat, lng, ...names.map(({key}) => +day[key])].join(':');
    if (sunChart?.id === id) return;
    const altitude = ms => SalahSolar.altitudeAt(ms, lat, lng);
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
      following:dateParts(event.at, currentPlace.timeZone) !== selectedKey ? ' · tomorrow' : '' };
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
    const limits = live && SalahSolar.daylightRestrictions(dateAtNoonUTC(selectedKey), currentPlace.lat, currentPlace.lng)
      .find(window => isBetween(instant, window.start, window.end));
    if (live && !limits && state.label === 'Between prayers') {
      const [rise, noon] = SalahSolar.daylightRestrictions(dateAtNoonUTC(selectedKey), currentPlace.lat, currentPlace.lng);
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
    checkPrayerReminders();
    renderHijriDate();
    if (comparisonOpen()) renderComparison();
    if (!$('fastingPanel').hidden) renderFasting();
    if (!$('datesPanel').hidden) renderIslamicDates(todayKey());
    drawSunChart(dayInfo);
    $('timesTag').textContent = $('timezoneLabel').textContent;
    renderQibla();
    if (!dayInfo.valid) {
      note(currentPlace ? dayInfo.reason : ''); setHero(null, new Date()); $('heroHeading').textContent = 'PRAYER TIMES';
      $('prayerList').innerHTML = currentPlace ? '<p class="loading">Times unavailable for this date and location.</p>' : '';
      $('heroLiveMessage').textContent='Timing unavailable'; $('heroLiveTime').textContent='Check date and location'; loadComparison(); return;
    }
    renderNotice(dayInfo); renderPrayerList(dayInfo); renderHero(dayInfo);
    loadComparison();
  }

  function showSettings() {
    $('fajrAngleInput').value = cfg.fajrAngle; $('ishaAngleInput').value = cfg.ishaAngle;
    $('highLatSelect').value = cfg.highLatRule;
    $('ishaLimit').value = cfg.ishaLimit;
    $('settingsStatus').textContent = '';
    const method = document.querySelector(`input[name="method"][value="${cfg.method}"]`);
    if (method) method.checked = true;
    renderLocationState();
    updateCustomVisibility();
  }
  function updateCustomVisibility() {
    const method = document.querySelector('input[name="method"]:checked')?.value;
    $('customAngles').classList.toggle('hidden', method !== 'custom');
  }

  function save() {
    const report = message => { $('settingsStatus').textContent = message; };
    const method = document.querySelector('input[name="method"]:checked')?.value || defaults.method;
    const fa = Number($('fajrAngleInput').value), ia = Number($('ishaAngleInput').value);
    const anglesValid = [fa, ia].every(a => Number.isFinite(a) && a >= 6 && a <= 22);
    if (method === 'custom' && !anglesValid) { report('Enter Fajr and Isha angles from 6° to 22°.'); return; }
    cfg = {
      ...cfg, method,
      fajrAngle:anglesValid ? fa : cfg.fajrAngle, ishaAngle:anglesValid ? ia : cfg.ishaAngle,
      ishaLimit:$('ishaLimit').value,
      highLatRule:$('highLatSelect').value
    };
    store();
    if (!browsing) selectedKey = todayKey();
    render();
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

  function locationName(lat, lng, zone) {
    const spot = { lat, lng };
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
  function setCurrentPlace(place) {
    if (currentPlace === place) { renderLocationState(); return; }
    if (currentPlace && (!place || currentPlace.timeZone !== place.timeZone)) {
      clearTimeout(toastTimer);
      $('reminderToast').hidden = true;
      if (locationSound) stopSound();
    }
    currentPlace = place;
    if (!place && (qiblaCompassOn || compassStarting)) stopCompass();
    resetMagneticCorrection();
    if (!browsing) selectedKey = todayKey();
    if (fastingFollowingToday) fastingKey = todayKey();
    render();
    if (place && !$('qiblaPanel').hidden) void loadVariation().then(renderQibla);
  }
  function trackPosition(position) {
    if (document.hidden) return;
    const { latitude, longitude, accuracy } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || accuracy > 1500) {
      locationIssue = 'Location is too imprecise. Try again outdoors.';
      setCurrentPlace(null);
      return;
    }
    const timeZone = SalahRegion.zone(latitude, longitude);
    if (!timeZone) {
      locationIssue = 'Prayer times and Qibla are available in the UK and Ireland.';
      setCurrentPlace(null);
      return;
    }
    locationIssue = '';
    const lat = Number(latitude.toFixed(5)), lng = Number(longitude.toFixed(5));
    const minimumMove = Math.max(0.15, (accuracy || 0) / 1000);
    if (timeZone === currentPlace?.timeZone && kmApart(currentPlace, { lat, lng }) < minimumMove) return;
    setCurrentPlace({ lat, lng, timeZone, location:locationName(lat, lng, timeZone) });
  }
  function clearAndroidSchedule() {
    scheduledPlace = null;
    lastPlanSignature = '';
    native.send('clearPlan');
  }
  function trackAndroidPosition(message) {
    if (message.run !== geoRun || document.hidden || !nativeVisible || geoWatch === null) return;
    if (message.status !== 'fix') {
      const issues = {
        denied:'Allow location for Salah in Android settings, then try again.',
        disabled:'Turn on Location in Android settings, then try again.',
        approximate:'Turn on Precise location for Salah in Android settings, then try again.',
        poor:'Location is too imprecise. Try again outdoors.',
        waiting:'Could not get your location. Try again or move outdoors.'
      };
      if (!Object.hasOwn(issues, message.status)) return;
      locationIssue = issues[message.status];
      if (message.status === 'denied') clearAndroidSchedule();
      if (message.status === 'denied' || message.status === 'disabled') stopTracking();
      else setCurrentPlace(null);
      return;
    }
    const { lat, lng, accuracy, fixedAt } = message;
    if (![lat, lng, accuracy, fixedAt].every(Number.isFinite) || Math.abs(lat) > 90 ||
        Math.abs(lng) > 180 || accuracy < 0 || accuracy > 1500) return;
    const timeZone = SalahRegion.zone(lat, lng);
    const place = { lat:+lat.toFixed(5), lng:+lng.toFixed(5), timeZone, accuracy, fixedAt };
    const previous = scheduledPlace;
    const nearby = Math.max(.15, accuracy / 1000);
    if (timeZone && previous?.timeZone === timeZone && kmApart(previous, place) < nearby) {
      movementCandidate = null;
      locationIssue = '';
      if (!currentPlace) {
        scheduledPlace = { ...previous, accuracy, fixedAt };
        setCurrentPlace(scheduledPlace);
      }
      return;
    }
    if (previous || !timeZone) {
      if (!movementCandidate || movementCandidate.timeZone !== timeZone || kmApart(movementCandidate, place) > nearby) {
        movementCandidate = place;
        if (!timeZone || previous?.timeZone !== timeZone) {
          locationIssue = 'Checking your new location…';
          setCurrentPlace(null);
        }
        return;
      }
      if (fixedAt - movementCandidate.fixedAt < 1000) return;
    }
    movementCandidate = null;
    if (!timeZone) {
      locationIssue = 'Prayer times and Qibla are available in the UK and Ireland.';
      if (scheduledPlace !== null) clearAndroidSchedule();
      setCurrentPlace(null);
      return;
    }
    locationIssue = '';
    place.location = locationName(place.lat, place.lng, timeZone);
    scheduledPlace = place;
    setCurrentPlace(place);
  }
  function stopTracking() {
    geoRun++;
    if (geoWatch !== null) {
      if (native) native.send('stopLocation');
      else navigator.geolocation.clearWatch(geoWatch);
    }
    geoWatch = null;
    movementCandidate = null;
    setCurrentPlace(null);
  }
  function startTracking(prompt = false) {
    if (!cfg.permissionSetupDone || !cfg.useDeviceLocation || requestingLaunchMotion ||
        document.hidden || !nativeVisible || !canUseLocation || (!native && trackingDenied) || geoWatch !== null) return;
    const run = ++geoRun;
    locationIssue = '';
    if (native) {
      geoWatch = run;
      native.send('startLocation', { run, prompt });
      renderLocationState();
      return;
    }
    geoWatch = navigator.geolocation.watchPosition(position => {
      if (run === geoRun) trackPosition(position);
    }, error => {
      if (run !== geoRun || document.hidden) return;
      if (error.code === 1) {
        locationIssue = 'Allow location in your browser settings, then try again.';
        trackingDenied = true;
        stopTracking();
      } else {
        locationIssue = 'Could not get your location. Try again or move outdoors.';
        setCurrentPlace(null);
      }
    }, { enableHighAccuracy:true, timeout:15000, maximumAge:0 });
    renderLocationState();
  }
  function requestDeviceLocation() {
    cfg.permissionSetupDone = true;
    cfg.useDeviceLocation = true;
    trackingDenied = false;
    store();
    if (geoWatch !== null) stopTracking();
    startTracking(true);
  }

  const iconAsset = (design, palette, size) => './icons/art/' + palette + '/' + design + '-' + size + '.png';
  const paletteChoices = $('paletteChoices');
  paletteChoices.innerHTML = Object.entries(palettes).map(([id, label]) =>
    `<button type="button" class="palette-choice" data-palette="${id}"><span class="palette-sample" aria-hidden="true"><i></i><i></i><i></i><img class="palette-icon" alt="" width="21" height="21"/></span>${label}</button>`).join('');
  const iconChoices = $('iconChoices');
  iconChoices.innerHTML = Object.entries(iconDesigns).map(([id, label]) =>
    '<button type="button" data-icon-choice="' + id + '"><img width="42" height="42" alt=""/><span>' + label + '</span></button>').join('');

  function placeDateControls() {
    const horizon = cfg.layout === 'horizon' && !!currentPlace;
    const dateSlot = $('horizonDateSlot');
    dateSlot.hidden = !horizon;
    const dateParent = horizon ? dateSlot : $('prayerHeading');
    const dateControls = $('prayerDateControls');
    if (dateControls.parentNode !== dateParent) dateParent.append(dateControls);
  }
  function applyAppearance() {
    document.body.dataset.layout = cfg.layout;
    document.body.dataset.accent = cfg.accent;
    $('settingsLayout').value = cfg.layout;
    $('settingsTimeFormat').value = cfg.timeFormat;
    placeDateControls();
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
    if (native) native.send('appearance', { palette:cfg.accent, shape:cfg.iconChoice });
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
  $('homeIconPage').hidden = !!native || isStandalone();
  $('copyIconPage').hidden = !!native || !isStandalone();
  $('homeIconHelp').hidden = !!native;
  if (native) $('iconFastingBackup').querySelector('.setting-hint').hidden = true;
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
  function pauseLocationAndCompass() {
    clearTimeout(reminderTimer);
    if (qiblaCompassOn || compassStarting) stopCompass();
    stopTracking();
    if (native || repeatTimer !== null) stopSound();
  }
  window.addEventListener('pagehide', pauseLocationAndCompass);
  window.addEventListener('pageshow', event => { if (event.persisted) startTracking(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseLocationAndCompass();
    else {
      if (!browsing) selectedKey = todayKey();
      if (fastingFollowingToday) fastingKey = todayKey();
      render();
      startTracking();
      cacheAdhansAutomatically();
      renderNotificationControl();
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
    checkPrayerReminders();
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
  const isIOS = !native && (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const ADHAN_RECORDINGS = Object.freeze({
    'adhan-abu-bakr':'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/fajr-abu-bakr.mp3',
    'adhan-fajr-abu-bakr':'https://raw.githubusercontent.com/alsuleiman-lab/athkar-audio/main/fajr-adhan/abu-bakr.mp3'
  });
  const adhanSelected = () => cfg.soundVolume > 0 && Object.hasOwn(ADHAN_RECORDINGS, cfg.soundChoice);
  const recordings = new Map(), pendingRecordings = new Map();
  let repeatTimer = null;
  const chimeChoice = choice => choice === 'soft' || choice === 'bell';
  let savedSound, customUpdate = 0, lastAudioCacheAttempt = null, toastTimer, soundRequest = 0;
  let locationSound = false;

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
      if (!blob && native) {
        try {
          const cached = await fetch('./adhan/' + choice + '.mp3');
          if (cached.ok) blob = await cached.blob();
        } catch {}
      }
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
    if (native) {
      if (navigator.onLine) native.send('prepareAdhan');
      return;
    }
    if (lastAudioCacheAttempt !== null && Date.now() - lastAudioCacheAttempt < 600000) return;
    lastAudioCacheAttempt = Date.now();
    for (const choice of Object.keys(ADHAN_RECORDINGS)) void readRecording(choice);
  }

  function stopSound() {
    soundRequest++;
    locationSound = false;
    clearTimeout(repeatTimer);
    repeatTimer = null;
    audio.stop();
  }

  async function playSound(choice = cfg.soundChoice, fromTap = false) {
    stopSound();
    const request = soundRequest;
    locationSound = !fromTap;
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
    if (nativeReady) renderNotificationControl();
  }
  updateSoundControls();
  $('soundVolume').value = String(cfg.soundVolume);
  $('soundVolumeLabel').textContent = cfg.soundVolume + '%';
  $('iosVolumeNote').hidden = !isIOS;
  $('soundVolume').addEventListener('input', () => {
    cfg.soundVolume = Number($('soundVolume').value);
    $('soundVolumeLabel').textContent = cfg.soundVolume + '%';
    audio.setLevel(cfg.soundVolume);
    if (native) {
      native.send('setAdhanVolume', { volume:Math.round(cfg.soundVolume) });
      renderNotificationControl();
    }
    store();
  });
  $('soundChoice').addEventListener('change', () => {
    stopSound();
    native?.send('stopAdhan');
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
  $('testSound').addEventListener('click', () => { void playSound(cfg.soundChoice, true).then(updateAndroidForegroundAudio); });
  $('stopSound').addEventListener('click', () => {
    stopSound();
    native?.send('stopAdhan');
    $('soundStatus').textContent = 'Sound stopped.';
  });
  void loadCustomSound();

  const { minute } = SalahAlerts;
  const deliveredAlertsKey = 'salah-delivered-prayer-alerts';
  let reminderTimer = null, testingNotification = false;
  let nativeStatus, lastPlanSignature = '', lastForegroundAudio;
  const channelButtons = [...document.querySelectorAll('[data-alert-settings]')];
  let deliveredAlerts = new Set();
  try { deliveredAlerts = new Set(JSON.parse(sessionStorage.getItem('salah-reminders') || '[]')); } catch {}

  function notificationPermission() {
    if (!window.isSecureContext || (isIOS && !isStandalone()) || !navigator.serviceWorker ||
        typeof window.Notification?.requestPermission !== 'function' ||
        typeof window.ServiceWorkerRegistration?.prototype.showNotification !== 'function') return 'unavailable';
    return Notification.permission;
  }
  function renderNotificationControl(result = '') {
    if (native) {
      const wantsAdhan = adhanSelected();
      const audioReady = nativeStatus?.regularAdhanReady &&
        (cfg.soundChoice !== 'adhan-abu-bakr' || nativeStatus.fajrAdhanReady);
      const testPending = nativeStatus?.testAt > Date.now() && !nativeStatus.error;
      const canNotify = nativeStatus?.notifications;
      const issues = [];
      $('nativeAdhanStatus').hidden = !wantsAdhan;
      $('nativeAdhanStatus').textContent = audioReady ? 'Scheduled adhan is ready offline.' :
        nativeStatus?.downloadingAdhan ? 'Downloading the adhan…' :
          'Connect to the internet to download the adhan for scheduled playback.';
      $('retryAndroidAdhan').hidden = !wantsAdhan || audioReady || nativeStatus?.downloadingAdhan;
      $('browserNotificationHelp').hidden = true;
      $('allowAndroidNotifications').hidden = !nativeStatus || nativeStatus.notifications;
      $('allowAndroidAlarms').hidden = !nativeStatus || nativeStatus.exact;
      const blocked = {
        prayers: nativeStatus?.prayerAlerts === false || (wantsAdhan && nativeStatus?.prayerSound === false),
        reminders: cfg.reminderEnabled && nativeStatus?.reminderAlerts === false,
        isha: nativeStatus?.ishaAlerts === false
      };
      for (const button of channelButtons) button.hidden = !canNotify || !blocked[button.dataset.alertSettings];
      if (canNotify && blocked.prayers) issues.push('Turn on Prayer times and choose Alert in Android.');
      if (canNotify && blocked.reminders) issues.push('Prayer reminders are off in Android.');
      if (canNotify && blocked.isha) issues.push('The Isha alarm is off or silent in Android.');
      if (cfg.soundVolume > 0 && nativeStatus?.alarmVolumeOn === false) issues.push('Turn up Alarms in Android’s volume controls.');
      if (nativeStatus?.backgroundRestricted) issues.push('Android is restricting Salah in the background. Check its battery settings.');
      $('openAndroidBattery').hidden = !nativeStatus?.backgroundRestricted;
      $('androidAlertHelp').textContent = issues.join(' ');
      $('androidAlertHelp').hidden = !issues.length;
      $('testNotification').hidden = !canNotify || !nativeStatus?.exact || nativeStatus?.prayerAlerts === false;
      $('testNotification').textContent = wantsAdhan && audioReady ? 'Test adhan in 30 seconds' : 'Test alert in 30 seconds';
      $('testNotification').disabled = testPending;
      $('notificationStatus').textContent = result || androidAlertStatus();
      $('notificationStatus').hidden = false;
      const lastTest = $('androidTestStatus');
      lastTest.hidden = !nativeStatus?.lastTestAt;
      if (!lastTest.hidden) {
        const time = new Date(nativeStatus.lastTestAt).toLocaleTimeString('en-GB', {
          hour:'numeric', minute:'2-digit', hour12:cfg.timeFormat === '12'
        });
        lastTest.textContent = nativeStatus.lastTestRan ? 'Android ran the last test at ' + time + '.' :
          'Android missed the test scheduled for ' + time + '. Check permissions and battery settings, then try again.';
      }
      return;
    }
    const permission = notificationPermission();
    const button = $('testNotification');
    button.hidden = permission === 'unavailable' || permission === 'denied';
    button.disabled = testingNotification;
    button.textContent = permission === 'granted' ? 'Send test notification' : 'Allow notifications';
    const text = permission === 'denied' ? 'Allow Salah notifications in your device settings.' :
      permission !== 'unavailable' ? result :
      isIOS && !isStandalone() ? 'Open Salah from your Home Screen to allow notifications.' :
        'This browser can show reminders inside Salah.';
    $('notificationStatus').textContent = text;
    $('notificationStatus').hidden = !text;
  }
  async function showPhoneNotification(title, body, tag, silent, stillDue = () => true) {
    if (notificationPermission() !== 'granted') return false;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active || !stillDue()) return false;
      await registration.showNotification(title, { body, tag, silent, icon:$('tabIcon').href });
      return true;
    } catch { return false; }
  }
  $('testNotification').addEventListener('click', async () => {
    if (native) {
      native.send('testAlert', { soundChoice:cfg.soundChoice, volume:Math.round(cfg.soundVolume) });
      return;
    }
    if (testingNotification) return;
    testingNotification = true;
    renderNotificationControl();
    let result = '';
    try {
      const permission = notificationPermission();
      const allowed = permission === 'default' ? await Notification.requestPermission() : permission;
      if (allowed === 'granted') {
        const sent = await showPhoneNotification('Salah test notification',
          'Prayer notifications can appear while Salah is open.', 'salah-test', cfg.soundVolume === 0);
        result = sent ? 'Test notification sent.' : 'Could not show the test. Reload Salah and try again.';
      }
    } catch {
      result = 'Could not ask for notification access.';
    } finally {
      testingNotification = false;
      renderNotificationControl(result);
    }
  });
  $('allowAndroidNotifications').addEventListener('click', () => native?.send('allowNotifications'));
  $('allowAndroidAlarms').addEventListener('click', () => native?.send('allowExact'));
  $('retryAndroidAdhan').addEventListener('click', () => native?.send('prepareAdhan'));
  $('openAndroidBattery').addEventListener('click', () => native?.send('openBatterySettings'));
  for (const button of channelButtons)
    button.addEventListener('click', () => native?.send('alertSettings', { alert:button.dataset.alertSettings }));

  function androidAlertStatus() {
    if (!nativeStatus) return 'Checking notification access…';
    if (nativeStatus.error) return 'Could not schedule alerts. Try reopening Salah.';
    if (!nativeStatus.notifications || !nativeStatus.exact) return 'Grant access for alerts when Salah is closed.';
    if (nativeStatus.testAt > Date.now()) return 'Test alert scheduled. You can lock your phone.';
    const { place, nextAt, through, waitingProvider } = nativeStatus;
    if (!place) return 'Use your location on the Today screen to schedule prayer alerts.';
    if (!nextAt) return waitingProvider ? 'Waiting for AlAdhan times.' : 'Waiting for usable prayer times.';
    const clock = new Intl.DateTimeFormat('en-GB', {
      timeZone:place.timeZone, hour:'numeric', minute:'2-digit', hour12:cfg.timeFormat === '12'
    });
    const day = through && dateAtNoonUTC(through).toLocaleDateString('en-GB', {
      timeZone:'UTC', day:'numeric', month:'short'
    });
    return 'Next ' + clock.format(nextAt) + ' · ' + place.location +
      (day ? ' · through ' + day : '') + (waitingProvider ? ' · waiting for AlAdhan' : '');
  }

  function refreshDeliveredAlerts(days) {
    try {
      for (const id of JSON.parse(localStorage.getItem(deliveredAlertsKey) || '[]')) deliveredAlerts.add(id);
    } catch {}
    deliveredAlerts = new Set([...deliveredAlerts].filter(id => typeof id === 'string' && days.includes(id.slice(0, 10))));
  }
  function markDelivered(alerts) {
    for (const alert of alerts) deliveredAlerts.add(alert.id);
    try { localStorage.setItem(deliveredAlertsKey, JSON.stringify([...deliveredAlerts])); } catch {}
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
  const canUseFallback = (key, place) => !navigator.onLine || failedOnline.has(cacheId('moonsighting', key, place));
  function collectPrayerAlerts(days, place = currentPlace) {
    return SalahAlerts.collect(days, {
      getDay:key => getActiveDay(key, place), allowFallback:key => canUseFallback(key, place),
      prayers, config:cfg, timetable:SalahTimetable
    });
  }
  function syncAndroidPlan(now) {
    const place = scheduledPlace;
    if (!nativeReady || !place || !cfg.useDeviceLocation) return;
    const { activeSource, timeFormat, ishaLimit, method, highLatRule, reminderEnabled, reminderLead, soundChoice } = cfg;
    const [fajrAngle, ishaAngle] = anglePair();
    const settings = { activeSource, timeFormat, ishaLimit, method, fajrAngle, ishaAngle, highLatRule,
      reminderEnabled, reminderLead, soundChoice, mute:cfg.soundVolume === 0 };
    const online = activeSource === 'moonsighting';
    const today = dateParts(new Date(now), place.timeZone);
    const days = Array.from({ length:online ? 3 : 15 }, (_, i) => dayShift(today, i - 1));
    const provider = online ? [...days, dayShift(today, 2)].map(key => {
      const cached = readCached(activeSource, key, place);
      return cached?.retrievedAt || (canUseFallback(key, place) ? 'fallback' : 'pending');
    }) : [];
    const signature = JSON.stringify([place, settings, today, provider]);
    if (signature === lastPlanSignature) return;
    lastPlanSignature = signature;
    const events = collectPrayerAlerts(days, place).filter(alert => alert.until > now)
      .map(alert => SalahAlerts.androidEvent(alert, cfg));
    const waitingProvider = provider.slice(1).includes('pending');
    native.send('replacePlan', { place, settings, events, waitingProvider, generatedAt:now });
  }
  function describePrayerAlert(alert, now) {
    const { kind, event, target, day } = alert;
    const estimated = kind === 'third' ? day.nightEstimated : event.estimated;
    const time = fmt(new Date(target)) + (estimated ? ' (estimate)' : '') + (day.sourceFallback ? ' · local calculation' : '');
    const ahead = Math.ceil((target - now) / minute);
    const minutes = ahead + (ahead === 1 ? ' minute' : ' minutes');
    if (kind === 'third') {
      const context = !day.isha ? 'Isha time unavailable.' :
        +day.isha > now ? 'Calculated Isha is at ' + fmt(day.isha) + '.' :
        cfg.ishaLimit === 'third' ? 'Your selected Isha cutoff.' : '';
      const title = 'First third ends in ' + minutes;
      const body = context ? time + ' · ' + context : time;
      return { title, body, message:title + ' · ' + body };
    }
    return kind === 'before' ?
      { title:event.en + ' in ' + minutes, body:time, message:event.en + ' at ' + time + ' · ' + minutes + ' away' } :
      { title:event.en + ' begins', body:time, message:event.en + ' · ' + time };
  }
  function deliverPrayerAlerts(alerts, now) {
    markDelivered(alerts);
    const messages = alerts.map(alert => describePrayerAlert(alert, now));
    showReminder(messages.map(message => message.message).join('\n'));
    const place = currentPlace;
    const start = alerts.find(alert => alert.kind === 'start');
    const playPrayerSound = start && cfg.soundChoice !== 'off' && cfg.soundVolume > 0;
    const prayerAudioReady = playPrayerSound && audio.ready();
    if (playPrayerSound) {
      void playSound(prayerSound(start.event.key));
    }
    if (native) {
      native.send('markAlerts', { ids:alerts.map(alert => alert.id) });
      if (!prayerAudioReady && alerts.some(alert => alert.kind !== 'start')) audio.chime(reminderNotes);
      return;
    }
    const stillDue = alert => !document.hidden && currentPlace === place && Date.now() >= alert.at && Date.now() < alert.until;
    const notifications = alerts.map((alert, i) => {
      const { title, body } = messages[i];
      const silent = cfg.soundVolume === 0 || (alert.kind === 'start' && (cfg.soundChoice === 'off' || prayerAudioReady));
      return showPhoneNotification(title, body, 'salah-reminder:' + alert.id, silent, () => stillDue(alert));
    });
    void Promise.all(notifications).then(shown => {
      if (!prayerAudioReady && alerts.some((alert, i) => alert.kind !== 'start' && !shown[i] && stillDue(alert)))
        audio.chime(reminderNotes);
    });
  }
  function prayerSound(prayer) {
    return cfg.soundChoice === 'adhan-abu-bakr' && prayer !== 'fajr' ? 'adhan-fajr-abu-bakr' : cfg.soundChoice;
  }
  function updateAndroidForegroundAudio() {
    if (!nativeReady) return;
    const choice = cfg.soundChoice;
    const soundAvailable = choice === 'custom' ? !!savedSound :
      chimeChoice(choice) || (recordings.has(choice) && recordings.has(prayerSound('asr')));
    const ready = !!(currentPlace && !document.hidden && nativeVisible && cfg.soundVolume > 0 &&
      audio.ready() && soundAvailable);
    const placeId = ready ? [currentPlace.lat, currentPlace.lng].join(':') : '';
    if (placeId === lastForegroundAudio) return;
    lastForegroundAudio = placeId;
    native.send('foregroundAudio', { ready, lat:currentPlace?.lat, lng:currentPlace?.lng });
  }
  $('reminderLead').value = String(cfg.reminderLead);
  $('reminderLead').disabled = !cfg.reminderEnabled;
  $('reminderEnabled').checked = cfg.reminderEnabled;
  $('reminderLead').addEventListener('change', () => {
    cfg.reminderLead = Number($('reminderLead').value);
    store();
    checkPrayerReminders();
  });
  $('reminderEnabled').addEventListener('change', () => {
    cfg.reminderEnabled = $('reminderEnabled').checked;
    $('reminderLead').disabled = !cfg.reminderEnabled;
    store();
    checkPrayerReminders();
  });

  function checkPrayerReminders() {
    clearTimeout(reminderTimer);
    if (document.hidden || !nativeVisible) return;
    if (native) {
      syncAndroidPlan(Date.now());
      updateAndroidForegroundAudio();
      if (!nativeStatus || (nativeStatus.notifications && nativeStatus.exact && !nativeStatus.error)) return;
    }
    if (!currentPlace) return;
    const now = Date.now(), today = todayKey();
    const days = [dayShift(today, -1), today, dayShift(today, 1)];
    refreshDeliveredAlerts(days);
    const alerts = collectPrayerAlerts(days).filter(alert => alert.until > now && !deliveredAlerts.has(alert.id))
      .sort((a, b) => a.at - b.at);
    const due = alerts.filter(alert => alert.at <= now);
    if (due.length) deliverPrayerAlerts(due, now);
    const next = alerts.find(alert => alert.at > now);
    if (next) reminderTimer = setTimeout(checkPrayerReminders, next.at - Date.now());
  }

  const norm360=x=>(x%360+360)%360;
  const compassPoints = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const compassLetters = ['compassNorth', 'compassEast', 'compassSouth', 'compassWest'];
  const compassFailureNotes = [[520, 0, .18, .13], [370, .21, .25, .13]];
  const alignmentLimit = 2;
  const levelLimit = Math.cos(25 * Math.PI / 180);
  const androidLevelLimit = Math.cos(20 * Math.PI / 180);
  const { createHeadingFilter, signedTurn, qiblaGeodesic, fieldLooksDistorted } = SalahCompass;
  const headingFilter = createHeadingFilter(native ? 3 : 5);
  let compassReading = null, magneticVariation = null, expectedMagneticStrength = null, alignmentChimed = false;
  let lastQiblaPlace, qiblaTarget;
  let qiblaCompassOn = false, compassStarting = false, compassRun = 0;
  let compassAudioReady = null, compassFailure = '', compassProblem = '';
  let variationPromise = null, variationKey = '', variationFailed = false;
  let headingTimer = null, compassProblemTimer = null;
  let compassSource, headingExpired = false, lastQiblaReference;
  let lastCompassRotation = 0, compassPortrait = true, portraitReadyAt = 0;
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
    expectedMagneticStrength = null;
    variationFailed = false;
  }

  function renderQiblaReference(target) {
    const reference = currentPlace ? [currentPlace.lat, currentPlace.lng, currentPlace.location, magneticVariation].join(':') : '';
    if (reference === lastQiblaReference) return;
    lastQiblaReference = reference;
    $('qiblaBearing').textContent = target ? target.bearing.toFixed(1) + '°' : '—';
    $('qiblaCardinal').textContent = target ? compassPoints[Math.round(target.bearing / 22.5) % 16] : '';
    $('qiblaMagneticBearing').textContent = target && Number.isFinite(magneticVariation)
      ? norm360(target.bearing - magneticVariation).toFixed(1) + '°' : '—';
    $('qiblaDistance').textContent = target ? Math.round(target.km).toLocaleString('en-GB') + ' km' : '—';
    $('qiblaPosition').textContent = currentPlace?.location || '';
  }

  function renderQibla() {
    if (lastQiblaPlace !== currentPlace) {
      lastQiblaPlace = currentPlace;
      qiblaTarget = currentPlace && qiblaGeodesic(currentPlace.lat, currentPlace.lng);
    }
    renderQiblaReference(qiblaTarget);
    if (!qiblaTarget) {
      $('qiblaTurnAngle').textContent = '—';
      alignmentChimed = false;
      checkCompassProblem('');
      return;
    }
    const heading = compassReading?.heading;
    const accuracy = compassReading?.accuracy;
    const knownAccuracy = Number.isFinite(accuracy) && accuracy >= 0;
    const approximate = !knownAccuracy || accuracy > 10 || !compassReading?.levelKnown;
    const correction = Number.isFinite(magneticVariation);
    const validHeading = Number.isFinite(heading);
    const live = qiblaCompassOn && validHeading && correction;
    const waitingForHeading = (qiblaCompassOn || compassStarting) && !live;
    if (live) lastCompassRotation = norm360(heading + magneticVariation);
    const rotation = qiblaCompassOn ? lastCompassRotation : 0;
    const direction = signedTurn(rotation, qiblaTarget.bearing);
    const difference = Math.abs(direction);
    const near = difference <= 15;
    // Round close readings up so the display agrees with the green threshold.
    const angle = near ? Math.ceil((difference - 1e-9) * 10) / 10 : Math.round(difference);
    const inRange = difference <= alignmentLimit + 1e-9;
    const aligned = live && inRange;
    const turn = direction < 0 ? 'left' : 'right';
    const jumped = qiblaCompassOn && !!compassReading?.jumped;
    const problem = qiblaCompassOn && compassReading && !compassReading.tilted
      ? (compassReading.interfered ? 'interference' :
        jumped ? 'jump' : !validHeading ? 'accuracy' : !correction && variationFailed ? 'correction' : '')
      : '';
    checkCompassProblem(problem);

    let state = 'reference', cue = '', mark = '', help = '';
    if (compassFailure) {
      state = 'weak'; cue = 'Compass unavailable'; mark = '!';
      help = compassFailure;
    } else if (compassStarting || (qiblaCompassOn && !compassReading)) {
      state = 'waiting'; cue = compassStarting ? 'Waiting for permission' : 'Finding your heading'; mark = '…';
      help = headingExpired ? 'Move the phone slightly to refresh the reading.' : 'Hold the phone flat, away from metal.';
    } else if (compassReading?.tilted) {
      state = 'weak'; mark = '!';
      cue = compassReading.portrait ? 'Hold your phone flat' : 'Turn your phone upright';
      help = compassReading.portrait ? 'Keep the screen facing upwards.' : 'Use portrait orientation with the screen facing upwards.';
    } else if (jumped) {
      state = 'waiting'; cue = 'Compass reading jumped'; mark = '…';
      help = 'Hold the phone flat and steady. If the reading stays paused, tap Restart compass.';
    } else if (problem === 'interference') {
      state = 'weak'; cue = 'Possible magnetic interference'; mark = '!';
      help = 'Move away from metal and remove any magnetic case, then check again.';
    } else if (problem) {
      state = 'weak'; mark = '!';
      cue = problem === 'accuracy' ? 'Compass reading is weak' : 'Magnetic correction unavailable';
      help = problem === 'accuracy' ? 'Move away from metal and magnetic cases, then try again.' :
        'Use the true bearing below.';
    } else if (live) {
      state = aligned ? 'aligned' : near ? 'near' : 'turn';
      cue = inRange ? (approximate || !aligned ? 'Approximate alignment' : 'Heading aligned') + ' · ' + angle + '° off' :
        near ? 'A little to the ' + turn : 'Turn ' + turn + ' ' + angle + '°';
      mark = inRange ? (aligned && !approximate ? '✓' : '≈') : direction < 0 ? '↶' : '↷';
      help = !knownAccuracy ? 'This device gives no compass accuracy estimate.' :
        approximate ? 'Approximate guide. Check the bearings below.' :
          native && inRange && !compassReading.steady ? 'Hold your phone flat and still.' : 'Hold your phone flat.';
    } else if (qiblaCompassOn && !correction) {
      state = 'waiting'; cue = 'Finding magnetic correction'; mark = '…';
      help = 'Keep the phone flat.';
    }

    const dial = $('qiblaDial'), status = $('qiblaAligned');
    dial.classList.toggle('live', live);
    dial.classList.toggle('aligned', aligned);
    dial.classList.toggle('waiting-for-heading', waitingForHeading);
    dial.dataset.state = status.dataset.state = state;
    status.hidden = !cue;
    $('qiblaCueMark').textContent = mark;
    if ($('qiblaCue').textContent !== cue) $('qiblaCue').textContent = cue;
    if ($('qiblaAccuracy').textContent !== help) $('qiblaAccuracy').textContent = help;
    $('qiblaAccuracy').hidden = !help;
    $('qiblaTurnAngle').textContent = waitingForHeading ? '—' : (live ? angle : qiblaTarget.bearing.toFixed(1)) + '°';
    $('qiblaTurnLabel').textContent = live ? (inRange ? 'From Qibla' : 'Turn ' + turn) :
      waitingForHeading ? 'Compass paused' : 'From true north';
    if (qiblaCompassOn) $('startCompass').textContent = jumped ? 'Restart compass' : 'Stop compass';
    $('qiblaPrecisionRow').hidden = !compassReading || compassReading.tilted || compassReading.interfered ||
      jumped || (!knownAccuracy && validHeading);
    $('qiblaPrecision').textContent = accuracy < 0 ? 'Uncalibrated' : knownAccuracy ?
      '±' + Math.ceil(accuracy) + '°' : 'Unavailable';
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

    if (!validHeading || (live && difference > alignmentLimit + 1)) alignmentChimed = false;
    if (aligned && compassReading.steady && !alignmentChimed && !$('qiblaPanel').hidden && !document.hidden) {
      playCompassChime(alignmentNotes);
      if (cfg.qiblaSound) native?.send('alignmentHaptic');
      alignmentChimed = true;
    }
  }

  async function loadVariation() {
    if (!currentPlace) return;
    const now = new Date();
    const { lat, lng } = currentPlace;
    const key = [lat, lng, now.getUTCFullYear(), now.getUTCMonth()].join(':');
    if (variationKey === key) return variationPromise;
    variationKey = key;
    variationFailed = false;
    variationPromise = (async () => {
      try {
        const model = await import('./vendor/magvar/magvar.mjs');
        if (now.getUTCFullYear() < model.MODEL_EPOCH || now.getUTCFullYear() >= model.MODEL_VALID_UNTIL) throw Error('Model date');
        const field = model.magneticField(lat, lng, 0, now);
        if (!Number.isFinite(field.declination) || Math.abs(field.declination) > 180 ||
            !Number.isFinite(field.f) || field.f <= 0) throw Error('Model value');
        if (variationKey === key) {
          magneticVariation = field.declination;
          expectedMagneticStrength = field.f / 1000;
        }
      } catch {
        if (variationKey === key) {
          magneticVariation = null;
          expectedMagneticStrength = null;
          variationFailed = true;
          variationKey = '';
        }
      }
    })();
    return variationPromise;
  }

  function portraitScreen() {
    return [window.orientation, window.screen.orientation?.angle].every(angle =>
      !Number.isFinite(angle) || norm360(angle) === 0);
  }

  function checkScreenOrientation(now) {
    const portrait = portraitScreen();
    if (compassPortrait !== portrait) {
      compassPortrait = portrait;
      portraitReadyAt = now + 250;
      headingFilter.pause();
      compassReading = { portrait, tilted:true };
      renderQibla();
    }
    return portrait;
  }

  function screenOrientationHandler() { checkScreenOrientation(performance.now()); }

  function motionHandler(event) {
    const now = performance.now();
    if (!document.hidden && compassPortrait && now >= portraitReadyAt && !compassReading?.tilted) {
      headingFilter.recordRotation(event.rotationRate?.alpha, now);
    }
  }

  function orientationHandler(event) {
    if (!qiblaCompassOn || document.hidden || $('qiblaPanel').hidden) return;
    const absolute = event.absolute === true || event.type === 'deviceorientationabsolute';
    const webkit = Number.isFinite(event.webkitCompassHeading) || (!absolute && 'webkitCompassHeading' in event);
    if (!webkit && !absolute) return;
    const source = (webkit ? 'webkit:' : 'absolute:') + event.type;
    if (compassSource && compassSource !== source) return;

    const now = performance.now();
    const portrait = checkScreenOrientation(now);
    const levelKnown = Number.isFinite(event.beta) && Number.isFinite(event.gamma);
    const tilted = !portrait || now < portraitReadyAt || (levelKnown && Math.cos(event.beta * Math.PI / 180) *
      Math.cos(event.gamma * Math.PI / 180) < levelLimit);
    const degrees = webkit ? event.webkitCompassHeading : event.alpha;
    const heading = Number.isFinite(degrees) && degrees >= 0 && degrees <= 360
      ? norm360(webkit ? degrees : -degrees) : null;
    const accuracy = webkit && Number.isFinite(event.webkitCompassAccuracy) ? event.webkitCompassAccuracy : null;
    readCompassHeading(heading, accuracy, portrait, levelKnown, tilted, now, source);
  }
  function readCompassHeading(heading, accuracy, portrait, levelKnown, tilted, now, source, interfered = false) {
    const usable = !tilted && !interfered && Number.isFinite(heading) &&
      (accuracy === null || (accuracy >= 0 && accuracy <= 20));
    let filtered = { heading:null, steady:false };
    if (usable) {
      // The event sources can disagree. Keep the first usable stream until
      // the user restarts, even when it briefly reports poor accuracy.
      compassSource = source;
      filtered = headingFilter.read(heading, now);
    } else if (interfered) {
      headingFilter.reset();
    } else {
      headingFilter.pause();
    }
    compassReading = { ...filtered, accuracy, portrait, levelKnown, tilted, interfered };
    headingExpired = false;
    clearTimeout(headingTimer);
    headingTimer = setTimeout(() => {
      headingExpired = true;
      if (!compassReading?.jumped && !compassReading?.tilted) compassReading = null;
      headingFilter.pause();
      renderQibla();
    }, 8000);
    renderQibla();
  }
  let nativeCompassRotation;
  function readAndroidCompass(sample) {
    if (sample.run !== compassRun || !qiblaCompassOn || document.hidden || $('qiblaPanel').hidden) return;
    if (sample.status === 'missing') {
      failCompass('This phone gives no compass heading. Use the bearing below.');
      return;
    }
    if (sample.status === 'motion') {
      if (compassPortrait && sample.time >= portraitReadyAt && !compassReading?.tilted)
        headingFilter.recordRotation(sample.rate, sample.time);
      return;
    }
    if (sample.status !== 'heading') return;
    const { heading, accuracy, portrait, level, time, rotation, fieldMicrotesla } = sample;
    if (nativeCompassRotation !== undefined && nativeCompassRotation !== rotation) {
      headingFilter.reset();
      portraitReadyAt = time + 250;
    }
    nativeCompassRotation = rotation;
    compassPortrait = portrait;
    const levelKnown = Number.isFinite(level);
    const tilted = !portrait || time < portraitReadyAt || (levelKnown && level < androidLevelLimit);
    const interfered = fieldLooksDistorted(fieldMicrotesla, expectedMagneticStrength);
    readCompassHeading(heading, accuracy, portrait, levelKnown, tilted, time, 'android', interfered);
  }

  function endCompassReading() {
    clearTimeout(headingTimer);
    checkCompassProblem('');
    window.removeEventListener('deviceorientation', orientationHandler);
    window.removeEventListener('deviceorientationabsolute', orientationHandler);
    window.removeEventListener('devicemotion', motionHandler);
    window.removeEventListener('orientationchange', screenOrientationHandler);
    window.screen.orientation?.removeEventListener('change', screenOrientationHandler);
    native?.send('stopCompass');
    qiblaCompassOn = false;
    compassStarting = false;
    compassReading = null;
    compassSource = undefined;
    nativeCompassRotation = undefined;
    headingFilter.reset();
    lastCompassRotation = portraitReadyAt = 0;
    headingExpired = false;
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

  async function requestCompassAccess() {
    const orientation = window.DeviceOrientationEvent?.requestPermission?.(true);
    const motion = window.DeviceMotionEvent?.requestPermission?.();
    const [heading] = await Promise.allSettled([orientation, motion]);
    return heading.status === 'fulfilled' && (heading.value === undefined || heading.value === 'granted');
  }

  $('startCompass').addEventListener('click', async () => {
    const restart = qiblaCompassOn && compassReading?.jumped;
    if (qiblaCompassOn || compassStarting) {
      stopCompass();
      if (!restart) return;
    }
    const run = ++compassRun;
    compassFailure = '';
    compassIssuesPlayed = new Set();
    compassAudioReady = cfg.qiblaSound ? audio.unlock() : null;
    if (native) {
      qiblaCompassOn = true;
      native.send('startCompass', { run });
      headingTimer = setTimeout(() => {
        if (qiblaCompassOn && !compassReading)
          failCompass('The phone sent no compass heading. Use the bearing below.');
      }, 4500);
      renderQibla();
      void loadVariation().then(renderQibla);
      return;
    }
    if (typeof DeviceOrientationEvent === 'undefined' || !window.isSecureContext) {
      failCompass('Use the bearing below, or open Salah over HTTPS on a phone with a compass.');
      return;
    }
    compassStarting = true;
    $('startCompass').textContent = 'Cancel';
    renderQibla();
    try {
      const allowed = await requestCompassAccess();
      if (run !== compassRun || $('qiblaPanel').hidden || document.hidden) return;
      if (!allowed) {
        failCompass('Motion access was denied. Use the bearing below.');
        return;
      }
      compassStarting = false;
      qiblaCompassOn = true;
      compassPortrait = portraitScreen();
      if (!compassPortrait) compassReading = { portrait:false, tilted:true };
      window.addEventListener('deviceorientation', orientationHandler);
      window.addEventListener('deviceorientationabsolute', orientationHandler);
      window.addEventListener('devicemotion', motionHandler);
      window.addEventListener('orientationchange', screenOrientationHandler);
      window.screen.orientation?.addEventListener('change', screenOrientationHandler);
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
  const occasionDialog = $('occasionDialog');
  let lastOccasionDate, openedOccasion;
  let listedOccasions = {};
  function renderIslamicDates(today) {
    const key = hijriDayKey(today, getDay(today), Date.now());
    if (key === lastOccasionDate || occasionDialog.open) return;
    lastOccasionDate = key;
    const { dates, fasts } = SalahHijri.upcoming(key);
    const { ramadan, ...eids } = dates;
    listedOccasions = { ...fasts, ...dates };
    const available = Object.keys(dates).length > 0;
    $('datesUnavailable').hidden = available;
    $('occasionGroups').hidden = !available;
    renderOccasions('upcomingFasts', { ...fasts, ...(ramadan && { ramadan }) });
    renderOccasions('upcomingEids', eids);
  }

  function occasionLabels(id, event) {
    const from = dateAtNoonUTC(event.from), to = event.to && dateAtNoonUTC(event.to);
    const date = !to ? upcomingFormat.format(from) : typeof upcomingFormat.formatRange === 'function' ?
      upcomingFormat.formatRange(from, to) : upcomingFormat.format(from) + ' – ' + upcomingFormat.format(to);
    const { name, kind, ruling } = SalahHijri.occasions[id];
    const title = id === 'ashura' && to ? 'Ashura and the day before' : name;
    const start = SalahHijri.label(event.from);
    const hijri = to ? start.split(' ')[0] + '–' + SalahHijri.label(event.to) : start;
    return { title, kind, ruling, date, hijri };
  }

  function renderOccasions(elementId, occasions) {
    const ordered = Object.entries(occasions).sort((a, b) => a[1].from.localeCompare(b[1].from));
    $(elementId).innerHTML = ordered.map(([id, event]) => {
      const { title, kind, ruling, date, hijri } = occasionLabels(id, event);
      return `<li data-occasion="${id}"><button class="occasion" type="button" aria-haspopup="dialog" aria-controls="occasionDialog">
        <time datetime="${event.from}">${date}</time><span><strong>${title}</strong>
          <span class="occasion-hijri">${hijri}</span><span class="occasion-ruling" data-kind="${kind}">${ruling}</span>
        </span><span class="occasion-chevron" aria-hidden="true"></span>
      </button></li>`;
    }).join('');
  }

  $('occasionGroups').addEventListener('click', event => {
    const button = event.target.closest('.occasion');
    if (!button || occasionDialog.open) return;
    const id = button.parentElement.dataset.occasion;
    const { title, kind, ruling, date, hijri } = occasionLabels(id, listedOccasions[id]);
    const { notes, sources } = SalahHijri.occasions[id];
    openedOccasion = id;
    $('occasionDialogTitle').textContent = title;
    $('occasionDialogDate').textContent = date + ' · ' + hijri;
    $('occasionDialogRuling').textContent = ruling;
    $('occasionDialogRuling').dataset.kind = kind;
    $('occasionNotes').innerHTML = notes.map(note => `<p>${note}</p>`).join('');
    $('occasionEvidence').innerHTML = sources.map(({ name, url, arabic, meaning }) => `
      <div class="occasion-source">
        <a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>
        ${arabic ? `<blockquote lang="ar" dir="rtl">${arabic}</blockquote>` : ''}
        <p>${meaning}</p>
      </div>`).join('');
    occasionDialog.showModal();
    occasionDialog.querySelector('.occasion-dialog-body').scrollTop = 0;
    $('occasionDialogTitle').focus({ preventScroll:true });
  });
  occasionDialog.addEventListener('click', event => {
    if (event.target !== occasionDialog) return;
    const bounds = occasionDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) occasionDialog.close();
  });
  occasionDialog.addEventListener('close', () => {
    if ($('datesPanel').hidden) return;
    renderIslamicDates(todayKey());
    $('occasionGroups').querySelector(`[data-occasion="${openedOccasion}"] button`)?.focus({ preventScroll:true });
  });

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
    $('fastingEstimate').textContent = !currentPlace ? 'Use your location to see local Fajr and iftar.' :
      times.sourceFallback ? 'Using local times for this date.' :
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
    if (native) {
      native.send('saveBackup', { data:JSON.stringify(backup) });
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
    if (target !== 'dates' && occasionDialog.open) occasionDialog.close();
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
    if (target === 'sounds') renderNotificationControl();
    if (target === 'fasting') renderFasting();
    if (target === 'dates') renderIslamicDates(todayKey());
    if (target === 'qibla') {
      renderQibla();
      void loadVariation().then(renderQibla);
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

  const permissionSetup = $('permissionSetup');
  const canAskForMotion = !native && window.isSecureContext && [window.DeviceOrientationEvent, window.DeviceMotionEvent]
    .some(sensor => typeof sensor?.requestPermission === 'function');
  async function finishPermissionSetup(useDevice) {
    if (cfg.permissionSetupDone) return;
    cfg.permissionSetupDone = true;
    cfg.useDeviceLocation = useDevice && canUseLocation;
    requestingLaunchMotion = useDevice && canAskForMotion;
    store();
    permissionSetup.close();
    renderLocationState();
    if (!useDevice) return;
    void audio.unlock();
    try {
      if (requestingLaunchMotion) await requestCompassAccess();
    } catch {
      // Start compass remains available for retrying from the Qibla screen.
    } finally {
      requestingLaunchMotion = false;
      startTracking(true);
    }
  }
  $('allowPermissions').addEventListener('click', () => void finishPermissionSetup(true));
  $('skipPermissions').addEventListener('click', () => void finishPermissionSetup(false));
  permissionSetup.addEventListener('cancel', event => {
    event.preventDefault();
    void finishPermissionSetup(false);
  });

  for (const button of document.querySelectorAll('[data-find-location]'))
    button.addEventListener('click', requestDeviceLocation);

  if (native) {
    const accessDialog = $('restoreAndroidAccess');
    const restoreButtons = [...accessDialog.querySelectorAll('[data-restore-access]')];
    const locationAccess = ['location', 'precise', 'deviceLocation'];
    const restoreActions = {
      location:requestDeviceLocation,
      precise:() => native.send('openLocationPermissions'),
      deviceLocation:() => native.send('openLocationSettings'),
      notifications:() => native.send('allowNotifications'),
      exactAlarms:() => native.send('allowExact')
    };
    const dismissedAccess = new Set();
    let accessState;
    function showAccessRecovery() {
      if (!accessState || !cfg.permissionSetupDone || permissionSetup.open || document.hidden || !nativeVisible) return;
      let restoring = false;
      for (const button of restoreButtons) {
        const key = button.dataset.restoreAccess;
        const location = locationAccess.includes(key);
        const lost = accessState[key + 'Missing'] === true;
        const missing = lost || (!location && cfg.useDeviceLocation && accessState.location && accessState[key] === false);
        if (!missing) dismissedAccess.delete(key);
        button.hidden = !missing || dismissedAccess.has(key) || (location && !cfg.useDeviceLocation);
        if (!button.hidden && lost) restoring = true;
      }
      $('restoreAccessTitle').textContent = restoring ? 'Restore Salah access' : 'Set up prayer alerts';
      $('restoreAccessHelp').textContent = restoring ? 'Turn access back on to use prayer alerts, prayer times and Qibla.' :
        'Allow notifications and exact alarms for prayer alerts when Salah is closed.';
      if (restoreButtons.every(button => button.hidden)) {
        if (accessDialog.open) accessDialog.close();
      } else if (!accessDialog.open) {
        accessDialog.showModal();
      }
    }
    function dismissAccessRecovery() {
      for (const button of restoreButtons) {
        if (!button.hidden) dismissedAccess.add(button.dataset.restoreAccess);
      }
      accessDialog.close();
    }
    $('dismissAccessRecovery').addEventListener('click', dismissAccessRecovery);
    accessDialog.addEventListener('cancel', event => {
      event.preventDefault();
      dismissAccessRecovery();
    });
    for (const button of restoreButtons)
      button.addEventListener('click', () => restoreActions[button.dataset.restoreAccess]());
    native.on('accessStatus', access => {
      const previous = accessState;
      accessState = access;
      if (cfg.useDeviceLocation && previous && locationAccess.some(key => access[key] !== previous[key])) {
        stopTracking();
        if (!access.location) clearAndroidSchedule();
        startTracking();
      }
      showAccessRecovery();
    });
    document.addEventListener('visibilitychange', showAccessRecovery);
    native.on('location', trackAndroidPosition);
    native.on('compass', readAndroidCompass);
    native.on('scheduleStatus', status => {
      nativeStatus = status;
      if (scheduledPlace === undefined && status.place) {
        const place = status.place;
        if (SalahRegion.zone(place.lat, place.lng) === place.timeZone) scheduledPlace = place;
      }
      markDelivered((status.delivered || []).map(id => ({ id })));
      renderNotificationControl();
      checkPrayerReminders();
    });
    native.on('dueAlerts', message => {
      markDelivered(message.alerts);
      if (document.hidden || !currentPlace || currentPlace.lat !== message.lat || currentPlace.lng !== message.lng) return;
      if (message.alerts.some(alert => alert.nativeAdhan)) stopSound();
      showReminder(message.alerts.map(alert => alert.title + ' · ' + alert.body).join('\n'));
      const start = message.alerts.find(alert => alert.playInApp);
      if (start && cfg.soundVolume > 0 && cfg.soundChoice !== 'off') void playSound(prayerSound(start.prayer));
    });
    native.on('backupResult', message => { $('fastingBackupStatus').textContent = message.text; });
    native.on('activity', message => {
      nativeVisible = message.visible;
      if (!message.visible) {
        lastForegroundAudio = undefined;
        pauseLocationAndCompass();
      } else {
        startTracking();
        checkPrayerReminders();
        cacheAdhansAutomatically();
        showAccessRecovery();
      }
    });
    native.on('back', () => {
      if (permissionSetup.open) void finishPermissionSetup(false);
      else if (accessDialog.open) dismissAccessRecovery();
      else if (occasionDialog.open) occasionDialog.close();
      else if ($('today').hidden) showScreen('today');
      else native.send('background');
    });
    nativeReady = true;
    native.send('ready');
    native.send('setAdhanVolume', { volume:Math.round(cfg.soundVolume) });
  }
  showScreen(location.hash.slice(1));
  cacheAdhansAutomatically();

  window.addEventListener('online', () => { $('offlineIndicator').hidden=true; failedOnline.clear(); loadComparison(); void cacheAdhansAutomatically(); });
  window.addEventListener('offline', () => { $('offlineIndicator').hidden=false; render(); });

  renderQibla();
  if (!native && 'serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  render(); startTracking();
  if (!cfg.permissionSetupDone && (canUseLocation || canAskForMotion) && typeof permissionSetup.showModal === 'function') {
    $('permissionLocation').hidden = !canUseLocation;
    $('permissionMotion').hidden = !canAskForMotion;
    $('allowPermissions').textContent = canUseLocation ?
      canAskForMotion ? 'Allow location and compass' : 'Allow location' : 'Allow compass';
    permissionSetup.showModal();
  }
})();

(() => {
  'use strict';

  const storageKey = 'salah-push-device';
  const tokenPattern = /^[a-f0-9]{64}$/;
  const publicKeyPattern = /^[A-Za-z0-9_-]{87}$/;

  function create({ needsHomeScreen, settings }) {
    const toggle = document.getElementById('closedReminders');
    const status = document.getElementById('closedReminderStatus');
    const test = document.getElementById('testClosedReminder');
    const testStatus = document.getElementById('closedTestStatus');
    const supported = window.isSecureContext && 'serviceWorker' in navigator &&
      'PushManager' in window && 'Notification' in window;
    const canUsePush = supported && !needsHomeScreen;
    let device = null;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (tokenPattern.test(saved?.token) && typeof saved.wanted === 'boolean') device = saved;
    } catch {}

    let registration = null, publicKey = null, refreshPromise = null;
    let waitingForWorker = false, subscribing = false, syncing = false, syncAgain = false;
    let confirmed = '', problem = '';

    function saveDevice() {
      if (device) localStorage.setItem(storageKey, JSON.stringify(device));
      else localStorage.removeItem(storageKey);
    }

    function deliversReminders() {
      return canUsePush && Boolean(device?.wanted) && Boolean(confirmed) && navigator.onLine &&
        Notification.permission === 'granted' && confirmed === JSON.stringify(settings());
    }

    function paint() {
      const wanted = Boolean(device?.wanted);
      toggle.checked = wanted;
      toggle.disabled = subscribing || syncing || !canUsePush || (!device &&
        (!registration || !publicKey || !navigator.onLine || Notification.permission === 'denied'));
      test.hidden = !wanted || !confirmed || !navigator.onLine || Notification.permission !== 'granted';
      if (!wanted) testStatus.textContent = '';

      let message = problem;
      if (needsHomeScreen) message = 'Open Salah from its Home Screen icon.';
      else if (!supported) message = 'Closed reminders are unavailable in this browser.';
      else if (subscribing || syncing) message = 'Saving notification settings…';
      else if (!navigator.onLine) message = device && !wanted ? 'Reconnect to finish turning off notifications.' : 'Connect to check closed reminders.';
      else if (Notification.permission === 'denied') message = 'Allow Salah notifications in your device settings.';
      else if (!message && waitingForWorker) message = 'Reload Salah to finish notification setup.';
      else if (!message && wanted && confirmed) message = settings().reminderEnabled ? 'On' : 'Paused with pre-prayer reminders off.';
      else if (!message && publicKey && registration) message = 'Uses your saved location and timetable.';
      status.textContent = message;
    }

    function request(method, route = '', body) {
      const headers = {};
      if (device && method !== 'GET') headers.Authorization = 'Bearer ' + device.token;
      if (body) headers['Content-Type'] = 'application/json';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      return fetch('./api/reminders' + route, {
        method, headers, body, signal: controller.signal, cache: 'no-store', keepalive: method !== 'GET'
      }).finally(() => clearTimeout(timeout));
    }

    function refresh() {
      paint();
      if (!canUsePush || !navigator.onLine || refreshPromise) return refreshPromise;
      refreshPromise = (async () => {
        try {
          const [response, worker] = await Promise.all([request('GET'), navigator.serviceWorker.getRegistration()]);
          if (!response.ok) throw Error('Service unavailable');
          const config = await response.json();
          if (!publicKeyPattern.test(config.publicKey) || config.service !== 'salah-web-push') throw Error('Unexpected service');
          if (publicKey && config.publicKey !== publicKey) confirmed = '';
          publicKey = config.publicKey;
          registration = worker?.active?.state === 'activated' ? worker : null;
          waitingForWorker = !registration;
          problem = '';
          sync();
        } catch {
          publicKey = null;
          confirmed = '';
          problem = 'The notification server is unavailable.';
        } finally {
          refreshPromise = null;
          paint();
        }
      })();
      return refreshPromise;
    }

    function sync() {
      if (!canUsePush || !device || !publicKey || !registration || !navigator.onLine) { paint(); return; }
      if (device.wanted && confirmed === JSON.stringify(settings()) && Notification.permission === 'granted' && !syncing) return;
      syncAgain = true;
      if (syncing) return;
      syncing = true;
      paint();
      void (async () => {
        try {
          while (syncAgain && device) {
            syncAgain = false;
            const subscription = await registration.pushManager.getSubscription();
            if (!device.wanted || !subscription || Notification.permission === 'denied') {
              const result = await request('DELETE');
              if (!result.ok) throw Error('Could not turn off notifications');
              device = null;
              confirmed = '';
              saveDevice();
              try { await subscription?.unsubscribe(); } catch {}
              continue;
            }
            const preferences = settings();
            const result = await request('PUT', '', JSON.stringify({ subscription: subscription.toJSON(), settings: preferences }));
            if (!result.ok) throw Error('Could not save settings');
            confirmed = JSON.stringify(preferences);
          }
          problem = '';
        } catch {
          confirmed = '';
          problem = device?.wanted ? 'Could not save closed reminder settings. Reopen Sounds to retry.' :
            'Could not turn off closed reminders. Reopen Sounds to retry.';
        } finally {
          syncing = false;
          paint();
        }
      })();
    }

    toggle.addEventListener('change', async () => {
      if (!toggle.checked && device) {
        device.wanted = false;
        try { saveDevice(); } catch {}
        sync();
        return;
      }
      if (!registration || !publicKey) { paint(); return; }
      subscribing = true;
      paint();
      try {
        // The browser permission prompt stays in the original tap handler.
        const base64 = publicKey.replace(/-/g, '+').replace(/_/g, '/') + '=';
        const key = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
        await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        const token = device?.token ?? Array.from(crypto.getRandomValues(new Uint8Array(32)), byte =>
          byte.toString(16).padStart(2, '0')).join('');
        device = { token, wanted: true };
        saveDevice();
        confirmed = '';
        sync();
      } catch {
        problem = 'Could not turn on closed reminders.';
        device = null;
      } finally {
        subscribing = false;
        paint();
      }
    });

    test.addEventListener('click', async () => {
      test.disabled = true;
      try {
        const response = await request('POST', '/test');
        testStatus.textContent = response.ok ? 'Test scheduled. You can close Salah now.' : response.status === 429 ?
          'Wait a moment before sending another test.' : 'Could not send the test notification.';
      } catch { testStatus.textContent = 'Could not send the test notification.'; }
      finally { test.disabled = false; }
    });

    if (canUsePush) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (waitingForWorker || device) refresh();
      });
      const resume = () => { if (device || !document.getElementById('soundPanel').hidden) refresh(); };
      window.addEventListener('online', resume);
      window.addEventListener('offline', paint);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) resume(); });
      if (device) refresh();
    }
    paint();
    return { sync, refresh, deliversReminders };
  }

  window.SalahReminders = { create };
})();

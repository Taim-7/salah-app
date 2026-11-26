from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from os import environ
from pathlib import Path
from threading import Thread
from time import monotonic, sleep
from zoneinfo import ZoneInfo

from playwright.sync_api import expect, sync_playwright

root = Path(__file__).resolve().parents[1]
initial = datetime(2026, 11, 26, 18, 0, tzinfo=timezone.utc)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def tab(page, name):
    page.locator(f'[data-screen-target="{name}"]').click()


def set_hidden(page, hidden):
    page.evaluate("""hidden => {
        Object.defineProperty(document, 'hidden', {configurable:true, value:hidden});
        document.dispatchEvent(new Event('visibilitychange'));
    }""", hidden)


def time_for(page, selector):
    return datetime.fromisoformat(page.locator(selector).get_attribute('datetime'))


def notifications(page):
    return page.evaluate("JSON.parse(sessionStorage.getItem('system-notifications') || '[]')")


def wait_for_alert(page, tag):
    deadline = monotonic() + 5
    while monotonic() < deadline:
        for alert in notifications(page):
            if alert['tag'] == tag:
                return alert
        sleep(.05)
    raise AssertionError(f'Missing system notification {tag}: {notifications(page)}')


def assert_no_alert(page, tag):
    assert not any(alert['tag'] == tag for alert in notifications(page))


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=root))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=environ.get('SALAH_CHROMIUM', '/usr/bin/chromium'),
                                    args=['--no-sandbox'])
        context = browser.new_context(timezone_id='Europe/London', viewport={'width':390, 'height':844})
        context.route('https://**/*', lambda route: route.abort())
        page = context.new_page()
        page.set_default_timeout(5000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.add_init_script("""(() => {
            Object.defineProperty(Notification, 'permission', {value:'granted'});
            // The headless browser has no OS notification centre. This records
            // the calls Salah makes with a real active worker registration.
            ServiceWorkerRegistration.prototype.showNotification = async function (title, options) {
                if (!this.active) throw new Error('The worker is inactive');
                const out = JSON.parse(sessionStorage.getItem('system-notifications') || '[]');
                out.push({title, ...options});
                sessionStorage.setItem('system-notifications', JSON.stringify(out));
            };
            let watchId = 0;
            window.gpsFixture = {latitude:51.5072, longitude:-0.1276, accuracy:10};
            Object.defineProperty(navigator, 'geolocation', {value:{
                watchPosition(success) {
                    queueMicrotask(() => success({coords:gpsFixture}));
                    return ++watchId;
                },
                clearWatch() {}
            }});
            if (localStorage.getItem('salah-config')) return;
            localStorage.setItem('salah-config', JSON.stringify({permissionSetupDone:true,
              useDeviceLocation:true, ishaPreference:'after-third', ishaLimit:'half', soundChoice:'off',
              firstThirdReminder:false}));
        })()""")
        page.clock.install(time=initial - timedelta(minutes=1))
        page.clock.pause_at(initial)
        page.goto(url)
        page.locator('#prayerDashboard').wait_for(timeout=5000)
        page.evaluate('navigator.serviceWorker.ready.then(() => true)')
        tab(page, 'settings')
        assert page.locator('input[name="ishaPreference"]').count() == 0
        assert page.locator('#ishaLimit').input_value() == 'half'
        tab(page, 'sounds')
        assert page.locator('#firstThirdReminder').count() == 0
        page.get_by_role('button', name='Send test notification').click()
        expect(page.locator('#notificationStatus')).to_have_text('Test notification sent.')
        assert wait_for_alert(page, 'salah-test')['title'] == 'Salah test notification'

        # The backup 15-second check runs before this deadline. The precise timer
        # still sends the warning at five minutes, even on a different date tab.
        tab(page, 'today')
        marker = time_for(page, '.night-summary time >> nth=0')
        page.locator('#nextDay').click()
        third_tag = 'salah-reminder:2026-11-26:first-third'
        page.clock.set_system_time(marker - timedelta(minutes=5, seconds=3))
        set_hidden(page, False)
        page.clock.run_for(2999)
        assert_no_alert(page, third_tag)
        assert page.locator('#reminderToast').is_hidden()
        page.clock.run_for(1)
        first = wait_for_alert(page, third_tag)
        assert first['title'] == 'First third ends in 5 minutes'
        assert 'First third ends in 5 minutes' in page.locator('#reminderMessage').inner_text()
        page.locator('#dismissReminder').click()
        page.reload()
        page.locator('#prayerDashboard').wait_for()
        assert page.locator('#reminderToast').is_hidden()
        assert sum(alert['tag'] == third_tag for alert in notifications(page)) == 1

        # On return, show the time still left, even past the old 45-second window.
        tab(page, 'today')
        page.locator('#nextDay').click()
        asr = time_for(page, '[data-event="asr"] time')
        tab(page, 'sounds')
        page.locator('#reminderLead').select_option('25')
        config = page.evaluate("JSON.parse(localStorage.getItem('salah-config'))")
        assert 'firstThirdReminder' not in config and 'ishaPreference' not in config
        set_hidden(page, True)
        page.clock.set_system_time(asr - timedelta(minutes=3, seconds=30))
        asr_pre = 'salah-reminder:2026-11-27:asr:before'
        assert_no_alert(page, asr_pre)
        set_hidden(page, False)
        assert wait_for_alert(page, asr_pre)['title'] == 'Asr in 4 minutes'
        assert '4 minutes away' in page.locator('#reminderMessage').inner_text()
        page.locator('#dismissReminder').click()
        page.clock.run_for(210000)
        asr_start = wait_for_alert(page, 'salah-reminder:2026-11-27:asr')
        assert asr_start['title'] == 'Asr begins'
        assert asr_start['silent'] is True

        # A pre-prayer alert never catches up after its prayer has started.
        tab(page, 'today')
        page.locator('#nativeDate').fill('2026-11-27')
        page.locator('#nativeDate').dispatch_event('change')
        maghrib = time_for(page, '[data-event="maghrib"] time')
        set_hidden(page, True)
        page.clock.set_system_time(maghrib + timedelta(minutes=3))
        set_hidden(page, False)
        page.locator('#prayerDashboard').wait_for()
        assert_no_alert(page, 'salah-reminder:2026-11-27:maghrib:before')
        assert_no_alert(page, 'salah-reminder:2026-11-27:maghrib')

        # The first-third warning still runs when ordinary reminders are off.
        marker = time_for(page, '.night-summary time >> nth=0')
        tab(page, 'sounds')
        page.locator('#reminderEnabled').uncheck()
        page.clock.set_system_time(marker - timedelta(minutes=4))
        set_hidden(page, False)
        assert wait_for_alert(page, 'salah-reminder:2026-11-27:first-third')['title'] == 'First third ends in 4 minutes'

        # A summer warning after civil midnight belongs to the preceding night.
        set_hidden(page, True)
        page.evaluate("gpsFixture = {latitude:55.3811, longitude:-7.3717, accuracy:10}")
        page.clock.set_system_time(datetime(2026, 6, 21, 21, 30, tzinfo=timezone.utc))
        set_hidden(page, False)
        tab(page, 'today')
        page.locator('#nativeDate').fill('2026-06-21')
        page.locator('#nativeDate').dispatch_event('change')
        marker = time_for(page, '.night-summary time >> nth=0')
        assert (marker - timedelta(minutes=5)).astimezone(ZoneInfo('Europe/Dublin')).day == 22
        page.clock.set_system_time(marker - timedelta(minutes=5))
        set_hidden(page, False)
        summer = wait_for_alert(page, 'salah-reminder:2026-06-21:first-third')
        assert 'estimate' in summer['body']

        tab(page, 'settings')
        page.locator('#highLatSelect').select_option('crossings')
        page.locator('#saveSettings').click()
        tab(page, 'today')
        page.locator('#nativeDate').fill('2026-06-22')
        page.locator('#nativeDate').dispatch_event('change')
        assert page.locator('.night-summary').count() == 0
        page.clock.set_system_time(marker + timedelta(days=1, minutes=-4))
        set_hidden(page, False)
        assert_no_alert(page, 'salah-reminder:2026-06-22:first-third')

        context.set_offline(True)
        tab(page, 'settings')
        page.locator('#highLatSelect').select_option('seventh')
        page.locator('#saveSettings').click()
        tab(page, 'today')
        page.locator('#nativeDate').fill('2026-11-28')
        page.locator('#nativeDate').dispatch_event('change')
        marker = time_for(page, '.night-summary time >> nth=0')
        page.evaluate("""() => {
            ServiceWorkerRegistration.prototype.showNotification = () => Promise.reject(new Error('Simulated failure'));
        }""")
        page.clock.set_system_time(marker - timedelta(minutes=1))
        set_hidden(page, False)
        expect(page.locator('#reminderMessage')).to_contain_text('First third ends in 1 minute ·')
        assert_no_alert(page, 'salah-reminder:2026-11-28:first-third')
        assert not errors, errors
        context.close()

        # A permission prompt is started by the notification button itself.
        request_context = browser.new_context(viewport={'width':320, 'height':844})
        request_context.route('https://**/*', lambda route: route.abort())
        request_page = request_context.new_page()
        request_page.add_init_script("""(() => {
            Object.defineProperty(window.navigator, 'standalone', {value:true});
            Object.defineProperty(window.navigator, 'userAgent', {value:'iPhone'});
            Object.defineProperty(Notification, 'permission', {configurable:true, value:'default'});
            Notification.requestPermission = () => {
                window.notificationHadGesture = navigator.userActivation.isActive;
                Object.defineProperty(Notification, 'permission', {configurable:true, value:'denied'});
                return Promise.resolve('denied');
            };
        })()""")
        request_page.goto(url + '#sounds')
        request_page.locator('#skipPermissions').click()
        assert request_page.evaluate('window.notificationHadGesture') is None
        request_page.get_by_role('button', name='Allow notifications').click()
        assert request_page.evaluate('window.notificationHadGesture') is True
        expect(request_page.locator('#notificationStatus')).to_contain_text('device settings')
        assert request_page.locator('#testNotification').is_hidden()
        browser.close()
    print('PASS: notification API calls, five-minute trigger, resume, expiry, deduplication, offline fallback and permission gesture.')
finally:
    server.shutdown()

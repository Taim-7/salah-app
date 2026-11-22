from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from os import environ
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=root))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=environ.get('SALAH_CHROMIUM', '/usr/bin/chromium'),
            headless=True,
            args=['--no-sandbox'],
        )
        context = browser.new_context(viewport={'width': 390, 'height': 844}, timezone_id='America/Los_Angeles')
        context.route('https://**/*', lambda route: route.abort())
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.clock.set_fixed_time(datetime(2026, 6, 21, 12, 0, tzinfo=timezone.utc))
        page.goto(url)
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        context.set_offline(True)
        page.reload()
        assert page.locator('#offlineIndicator').is_visible()
        assert page.locator('#timezoneLabel').inner_text() == 'UK time'
        assert page.locator('#prayerList .prayer-entry').count() == 6
        assert page.locator('#prayerList .avoid-entry').count() == 3

        page.locator('[data-screen-target="compare"]').click()
        page.locator('#summerCompare summary').click()
        page.locator('#summerCompareBody tr').last.wait_for()
        assert page.locator('#summerCompareBody tr').count() == 6
        assert page.locator('#summerCompareBody').get_by_text('Seasonal Tayba reference').count() == 1

        page.locator('[data-screen-target="settings"]').click()
        page.locator('#cityQuery').fill('Buncrana')
        page.locator('#citySearch').click()
        page.locator('#cityResults button').filter(has_text='Buncrana').click()
        assert page.locator('#asrShadow').count() == 0
        assert page.locator('#highLatSelect option').filter(has_text='Half-night estimate').count() == 0
        page.locator('#highLatSelect').select_option('crossings')
        page.locator('#settingsTimeFormat').select_option('24')
        page.locator('#saveSettings').click()
        assert page.locator('#settingsStatus').inner_text() == 'Settings saved.'

        page.locator('[data-screen-target="today"]').click()
        assert page.locator('#timezoneLabel').inner_text() == 'Ireland time'
        assert 'Buncrana' in page.locator('#locationLabel').inner_text()
        assert page.get_by_text('One length added to the noon shadow').count() == 1
        assert 'no 15° crossing' in page.locator('#notice').inner_text()
        assert page.locator('#prayerList .avoid-entry').count() == 3
        assert page.locator('#prayerList').get_by_text('Time unavailable').count() == 2
        page.locator('[data-screen-target="sounds"]').click()
        with page.expect_download() as pending:
            page.locator('#exportCalendar').click()
        calendar = pending.value.path().read_bytes()
        assert b'UID:salah-angles-dhuhr-2026-06-21' in calendar
        assert b'UID:salah-angles-fajr-2026-06-21' not in calendar
        assert b'UID:salah-angles-isha-2026-06-21' not in calendar
        assert all(len(line) <= 75 for line in calendar.split(b'\r\n'))
        assert b'TRIGGER:-PT15M\r\n' in calendar

        page.locator('[data-screen-target="settings"]').click()
        page.locator('#highLatSelect').select_option('tayba')
        page.locator('#saveSettings').click()
        page.locator('[data-screen-target="today"]').click()
        assert 'Seasonal Tayba reference' in page.locator('#notice').inner_text()
        assert page.locator('#prayerList').get_by_text('Time unavailable').count() == 0
        assert page.locator('#prayerList .avoid-entry').count() == 3

        page.locator('[data-screen-target="qibla"]').click()
        page.evaluate("""() => {
          window.addEventListener('deviceorientation', event => {
            if (event.isTrusted) event.stopImmediatePropagation();
          }, true);
          window.DeviceOrientationEvent = class {
            static requestPermission() { return Promise.resolve('granted'); }
          };
        }""")
        page.locator('#startCompass').click()
        page.wait_for_function("document.querySelector('#startCompass').textContent === 'Compass active'")
        page.evaluate("""() => {
          const event = new Event('deviceorientation');
          Object.defineProperties(event, { webkitCompassHeading: { value: 115 }, webkitCompassAccuracy: { value: 7 } });
          window.dispatchEvent(event);
        }""")
        page.locator('#qiblaDial.live').wait_for()
        assert 'WMM 2025' in page.locator('#qiblaState').inner_text()

        context.route('https://api.bigdatacloud.net/**', lambda route: route.fulfill(
            json={'countryCode': 'GB', 'city': 'Enniskillen', 'principalSubdivision': 'Northern Ireland'}
        ))
        context.grant_permissions(['geolocation'])
        context.set_geolocation({'latitude': 54.346, 'longitude': -7.642, 'accuracy': 10})
        context.set_offline(False)
        page.locator('[data-screen-target="settings"]').click()
        page.locator('#setGPS').click()
        page.wait_for_function("document.querySelector('#placeInput').value.startsWith('Enniskillen')")
        page.locator('#saveSettings').click()
        page.locator('[data-screen-target="today"]').click()
        assert page.locator('#locationLabel').inner_text().startswith('Enniskillen')
        assert page.locator('#timezoneLabel').inner_text() == 'UK time'
        assert not errors, errors
        context.close()
        browser.close()
    print('PASS: offline reload, three forbidden rows, Donegal selection, seasonal fallback, calendar omission, offline compass, and GPS place labels.')
finally:
    server.shutdown()

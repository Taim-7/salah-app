from datetime import datetime, timedelta, timezone
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
        page.add_init_script("""(() => {
          window.compassTones = [];
          const create = AudioContext.prototype.createOscillator;
          AudioContext.prototype.createOscillator = function () {
            const tone = create.call(this);
            const schedule = tone.frequency.setValueAtTime.bind(tone.frequency);
            tone.frequency.setValueAtTime = (hz, at) => {
              compassTones.push(hz);
              return schedule(hz, at);
            };
            return tone;
          };
        })()""")
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
        assert page.locator('#exportCalendar').count() == 0
        assert page.locator('#reminderLead option').evaluate_all('(options) => options.map(o => +o.value)') == [15, 20, 25, 30]
        page.locator('#reminderLead').select_option('25')
        assert page.locator('#reminderLead').input_value() == '25'

        page.locator('[data-screen-target="settings"]').click()
        page.locator('#highLatSelect').select_option('tayba')
        page.locator('#saveSettings').click()
        page.locator('[data-screen-target="today"]').click()
        assert 'Seasonal Tayba reference' in page.locator('#notice').inner_text()
        assert page.locator('#prayerList').get_by_text('Time unavailable').count() == 0
        assert page.locator('#prayerList .avoid-entry').count() == 3

        page.locator('[data-screen-target="fasting"]').click()
        assert page.locator('#fastingView').get_attribute('data-view') == 'week'
        assert page.locator('.fast-day').count() == 7
        page.locator('#fastingNext').click()
        assert page.locator('#fastingDate').inner_text() == 'Sunday 28 June'
        page.locator('#fastingToday').click()
        assert page.locator('#fastingEstimated').is_visible()
        assert page.locator('#fastingIftar').inner_text() != '—'
        page.locator('[data-fast-status="due"]').click()
        assert '1 to make up' in page.locator('#fastingSummary').inner_text()
        assert page.locator('#fastingQuickAction').inner_text() == 'Mark as made up'
        page.locator('#fastingToMakeUp summary').click()
        page.locator('#fastingDueDates button[data-date="2026-06-21"]').click()
        page.locator('#fastingQuickAction').click()
        assert '0 to make up' in page.locator('#fastingSummary').inner_text()
        page.reload()
        assert page.locator('#fastingQuickAction').inner_text() == '✓ Made up'
        assert page.locator('.fast-day[aria-current="date"] small').inner_text() == '↺'
        page.locator('[data-fasting-view="month"]').click()
        page.locator('#fastingNext').click()
        assert page.locator('#fastingMonth').inner_text() == 'July 2026'
        page.locator('#fastingToday').click()
        assert page.locator('#fastingMonth').inner_text() == 'June 2026'
        page.locator('[data-fast-status=""]').click()
        assert page.locator('[data-fast-status=""]').is_disabled()
        page.locator('.fast-day[data-date="2026-06-20"]').click()
        assert page.locator('#fastingDate').inner_text() == 'Saturday 20 June'
        assert page.locator('#fastingQuickAction').evaluate('(button) => button === document.activeElement')
        page.locator('#fastingQuickAction').click()
        assert page.locator('#fastingCompleted').inner_text() == '1'

        page.locator('[data-screen-target="settings"]').click()
        page.locator('[data-palette="ocean"]').click()
        page.locator('#settingsLayout').select_option('horizon')
        assert page.locator('#touchIcon').get_attribute('href') == './icons/ocean/icon-180.png'
        assert page.locator('#appManifest').get_attribute('href') == './manifest-ocean.webmanifest'
        assert page.evaluate("fetch('./icons/ocean/icon-180.png').then(r => r.ok)")
        page.locator('.icon-settings summary').click()
        assert page.locator('#homeIconName').inner_text() == 'Ocean blue'
        with page.expect_download() as download:
            page.locator('#saveFastingLog').click()
        backup = download.value.path()
        assert '2026-06-20' in backup.read_text()
        page.locator('#restoreFastingLog').set_input_files({
            'name':'Salah-fasting-log.json', 'mimeType':'application/json',
            'buffer':b'{"format":"salah-fasting-log","entries":{"2026-06-20":"due","2026-06-21":"due"}}',
        })
        page.locator('#fastingBackupStatus').get_by_text('Restored 1 entry.', exact=False).wait_for()
        assert page.evaluate("JSON.parse(localStorage.getItem('salah-fasting-log'))") == {
            '2026-06-20':'fasted', '2026-06-21':'due',
        }
        install = context.new_page()
        install.goto(page.locator('#homeIconPage').evaluate('(link) => link.href'))
        assert install.locator('link[rel="apple-touch-icon"]').get_attribute('href') == '../icons/ocean/icon-180.png'
        assert install.evaluate("fetch('../manifest-ocean.webmanifest').then(r => r.json()).then(m => m.start_url)") == './?icon=ocean'
        install.close()
        page.locator('[data-icon-choice="minaret"]').click()
        assert page.locator('#touchIcon').get_attribute('href') == './icons/minaret/icon-180.png'
        assert page.locator('body').get_attribute('data-accent') == 'ocean'
        install = context.new_page()
        install.goto(page.locator('#homeIconPage').evaluate('(link) => link.href'))
        assert install.locator('link[rel="apple-touch-icon"]').get_attribute('href') == '../icons/minaret/icon-180.png'
        assert install.evaluate("fetch('../manifest-minaret.webmanifest').then(r => r.json()).then(m => m.start_url)") == './?icon=minaret'
        install.close()

        page.locator('[data-screen-target="qibla"]').click()
        assert page.locator('#qiblaView').get_attribute('data-view') == 'guide'
        assert page.locator('#qiblaTurnAngle').is_visible()
        assert page.locator('#qiblaArrow').is_hidden()
        page.locator('[data-qibla-view="needle"]').click()
        assert page.locator('#qiblaArrow').is_visible()
        assert page.locator('#qiblaMarker').is_hidden()
        page.locator('[data-qibla-view="guide"]').click()
        page.evaluate("""() => {
          window.vibrationPatterns = [];
          Object.defineProperty(navigator, 'vibrate', {
            configurable:true, value:pattern => { vibrationPatterns.push(pattern); return true; }
          });
          window.addEventListener('deviceorientation', event => {
            if (event.isTrusted) event.stopImmediatePropagation();
          }, true);
          window.DeviceOrientationEvent = class {
            static requestPermission() { return Promise.resolve('granted'); }
          };
        }""")
        page.locator('#startCompass').click()
        page.wait_for_function("document.querySelector('#startCompass').textContent === 'Stop compass'")
        page.evaluate("""() => {
          window.pointPhone = (heading, accuracy) => {
          const event = new Event('deviceorientation');
          Object.defineProperties(event, { webkitCompassHeading: { value: heading }, webkitCompassAccuracy: { value: accuracy } });
          window.dispatchEvent(event);
          };
          pointPhone(177, 7);
        }""")
        page.locator('#qiblaDial.live').wait_for()
        page.locator('#qiblaPanel summary').click()
        assert 'WMM 2025' in page.locator('#qiblaState').inner_text()
        assert 'left' in page.locator('#qiblaCue').inner_text()
        correction = page.locator('#declinationOverride')
        correction.fill('0')
        page.evaluate('pointPhone(115, 7); pointPhone(116, 7)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        assert page.evaluate('vibrationPatterns.length') == 1
        page.evaluate('pointPhone(170, 7); pointPhone(112, 7)')
        assert page.evaluate('vibrationPatterns.length') == 2
        page.evaluate("Object.defineProperty(navigator, 'vibrate', {configurable:true,value:undefined}); pointPhone(170, 7); pointPhone(113, 7)")
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        assert page.evaluate('vibrationPatterns.length') == 2
        assert page.evaluate('compassTones.slice(-2)') == [740, 990]
        page.locator('#qiblaTestFeedback').click()
        assert 'Played the alignment chime' in page.locator('#qiblaTestStatus').inner_text()
        page.locator('#startCompass').click()
        page.evaluate("""() => {
          compassTones.length = 0;
          DeviceOrientationEvent.requestPermission = () => Promise.resolve('denied');
        }""")
        page.locator('#startCompass').click()
        page.wait_for_function("compassTones.length === 2")
        assert page.evaluate('compassTones') == [520, 370]
        assert page.locator('#qiblaCue').inner_text() == 'Compass unavailable'
        assert page.locator('#qiblaBearing').is_visible()

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
        asr = datetime.fromisoformat(page.locator('[data-event="asr"] time').get_attribute('datetime'))
        page.clock.set_fixed_time(asr - timedelta(minutes=25) + timedelta(seconds=2))
        page.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
        assert 'Asr' in page.locator('#reminderMessage').inner_text()
        assert '25 minutes away' in page.locator('#reminderMessage').inner_text()
        page.locator('#dismissReminder').click()
        page.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
        assert page.locator('#reminderToast').is_hidden()
        assert not errors, errors
        context.close()
        browser.close()
    print('PASS: offline reload, forbidden times, Donegal, fasting log and transfer, icon setup, compass feedback, GPS and 25-minute reminder.')
finally:
    server.shutdown()

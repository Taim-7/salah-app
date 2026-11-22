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
        context.grant_permissions(['geolocation'])
        context.set_geolocation({'latitude':54.9966, 'longitude':-7.3086, 'accuracy':10})
        context.route('https://**/*', lambda route: route.abort())
        aladhan_requests = []
        context.on('request', lambda request: aladhan_requests.append(request.url)
                   if request.url.startswith('https://api.aladhan.com/') else None)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.add_init_script("""(() => {
          Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => true });
          window.motionRequests = [];
          DeviceOrientationEvent.requestPermission = async absolute => {
            motionRequests.push({ absolute, active:navigator.userActivation.isActive });
            return 'granted';
          };
          DeviceMotionEvent.requestPermission = async () => {
            motionRequests.push({ gyro:true, active:navigator.userActivation.isActive });
            return 'granted';
          };
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
        assert page.get_by_role('dialog', name='Set up Salah').is_visible()
        assert page.locator('#locationLabel').inner_text() == 'Location needed'
        assert page.locator('#prayerDashboard').is_hidden()
        assert page.evaluate('motionRequests.length') == 0
        page.get_by_role('button', name='Allow location and compass').click()
        assert page.locator('#permissionSetup').is_hidden()
        assert page.evaluate('motionRequests') == [{'absolute':True, 'active':True}, {'gyro':True, 'active':True}]
        page.locator('#prayerDashboard').wait_for()
        assert page.locator('#locationMode').is_visible()
        assert "Derry" in page.locator('#locationLabel').inner_text()
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        page.locator('[data-screen-target="settings"]').click()
        assert page.locator('#trackLocation, #setDerry, #cityQuery').count() == 0
        if not page.locator('#comparisonPanel').evaluate('panel => panel.open'):
            page.locator('#comparisonPanel > summary').click()
        assert not aladhan_requests
        with page.expect_request(lambda request: request.url.startswith('https://api.aladhan.com/')):
            page.locator('#refreshSources').click()
        assert len(aladhan_requests) == 1
        context.set_offline(True)
        page.locator('[data-screen-target="today"]').click()
        page.reload()
        assert page.locator('#permissionSetup').is_hidden()
        page.locator('#prayerDashboard').wait_for()
        assert page.locator('#offlineIndicator').is_visible()
        assert page.locator('#timezoneLabel').inner_text() == 'UK time'
        assert page.locator('#hijriDate').inner_text().endswith('AH · est.')
        assert page.locator('#countdown').evaluate('el => parseFloat(getComputedStyle(el).fontSize)') >= 16
        assert page.locator('[data-event="fajr"]').evaluate('el => el.classList.contains("is-elapsed")')
        assert page.locator('[data-event="fajr"] .time-name').evaluate('node => getComputedStyle(node).fontWeight') == '560'
        assert not page.locator('.time-row.is-next').evaluate('el => el.classList.contains("is-elapsed")')
        assert page.locator('.prayer-limits').count() == 0
        assert page.locator('#prayerList .prayer-entry').count() == 6
        assert page.locator('#prayerList .avoid-entry').count() == 3

        page.locator('[data-screen-target="settings"]').click()
        if not page.locator('#comparisonPanel').evaluate('panel => panel.open'):
            page.locator('#comparisonPanel > summary').click()
        page.locator('#summerCompare summary').click()
        page.locator('#summerCompareBody tr').last.wait_for()
        assert page.locator('#summerCompareBody tr').count() == 6
        assert page.locator('#summerCompareBody').get_by_text('Seasonal Tayba reference').count() == 1

        page.locator('[data-screen-target="settings"]').click()
        assert page.locator('#onlineCompare').count() == 0
        context.set_geolocation({'latitude':55.1333, 'longitude':-7.45, 'accuracy':10})
        page.wait_for_function("document.querySelector('#locationLabel').textContent.includes('Buncrana')")
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
        assert page.locator('#reminderNext').count() == 0
        assert page.locator('#reminderLead option').evaluate_all('(options) => options.map(o => +o.value)') == [15, 20, 25, 30]
        page.locator('#reminderEnabled').uncheck()
        assert page.locator('#reminderLead').is_disabled()
        page.locator('#reminderEnabled').check()
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
        assert page.locator('#fastingQuickAction').inner_text() == 'Yes, I fasted'
        assert page.locator('#fastingMadeUp').is_hidden()
        page.locator('[data-fast-status="due"]').click()
        assert '1 to make up' in page.locator('#fastingSummary').inner_text()
        assert page.locator('#fastingMadeUp').is_visible()
        assert page.locator('#fastingQuestion').is_hidden()
        assert page.locator('#fastingMark').inner_text() == 'Missed'
        page.locator('#fastingToMakeUp summary').click()
        page.locator('#fastingDueDates button[data-date="2026-06-21"]').click()
        page.locator('#fastingMadeUp').click()
        assert '0 to make up' in page.locator('#fastingSummary').inner_text()
        page.reload()
        assert page.locator('#fastingMark').inner_text() == 'Made up'
        assert page.locator('#fastingMadeUp').is_hidden()
        assert page.locator('.fast-day[aria-current="date"] small').inner_text() == '↺'
        page.locator('[data-fasting-view="month"]').click()
        page.locator('#fastingNext').click()
        assert page.locator('#fastingMonth').inner_text() == 'July 2026'
        page.locator('#fastingToday').click()
        assert page.locator('#fastingMonth').inner_text() == 'June 2026'
        page.locator('[data-fast-status=""]').click()
        assert page.locator('[data-fast-status=""]').is_hidden()
        page.locator('.fast-day[data-date="2026-06-20"]').click()
        assert page.locator('#fastingDate').inner_text() == 'Saturday 20 June'
        assert page.locator('#fastingDate').evaluate('(heading) => heading === document.activeElement')
        page.locator('#fastingQuickAction').click()
        assert page.locator('#fastingCompleted').inner_text() == '1'

        page.locator('[data-screen-target="settings"]').click()
        page.locator('[data-palette="ocean"]').click()
        page.locator('#settingsLayout').select_option('horizon')
        assert page.locator('#touchIcon').get_attribute('href') == './icons/art/ocean/crescent-180.png'
        assert page.locator('#appManifest').get_attribute('href') == './manifest-ocean-crescent.webmanifest'
        assert page.evaluate("fetch('./icons/art/ocean/crescent-180.png').then(r => r.ok)")
        page.locator('.icon-settings summary').click()
        assert page.locator('#homeIconName').inner_text() == 'Crescent'
        assert page.locator('[data-icon-choice]').all_inner_texts() == ['Crescent', 'Mihrab', 'Minaret', 'Compass', 'Prayer mat']
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
        assert install.locator('link[rel="apple-touch-icon"]').get_attribute('href') == '../icons/art/ocean/crescent-180.png'
        assert install.evaluate("fetch('../manifest-ocean-crescent.webmanifest').then(r => r.json()).then(m => m.start_url)") == './?icon=crescent&palette=ocean'
        install.close()
        page.locator('[data-icon-choice="minaret"]').click()
        for palette in ['midnight', 'forest', 'sand', 'slate', 'ocean']:
            page.locator(f'[data-palette="{palette}"]').click()
            assert page.locator('body').get_attribute('data-accent') == palette
            assert page.locator('#homeIconName').inner_text() == 'Minaret'
            assert page.locator('#touchIcon').get_attribute('href') == f'./icons/art/{palette}/minaret-180.png'
            assert page.locator('[data-icon-choice] img').evaluate_all('images => images.map(image => image.getAttribute("src"))') == [
                f'./icons/art/{palette}/{design}-180.png' for design in ['crescent', 'mihrab', 'minaret', 'compass', 'mat']
            ]
        install = context.new_page()
        install.goto(page.locator('#homeIconPage').evaluate('(link) => link.href'))
        assert install.locator('link[rel="apple-touch-icon"]').get_attribute('href') == '../icons/art/ocean/minaret-180.png'
        assert install.evaluate("fetch('../manifest-ocean-minaret.webmanifest').then(r => r.json()).then(m => m.start_url)") == './?icon=minaret&palette=ocean'
        install.close()

        page.locator('[data-screen-target="fasting"]').click()
        assert abs(page.locator('#undatedFasted').bounding_box()['height'] - page.locator('.fast-day').first.bounding_box()['height']) <= 1
        assert abs(page.locator('#undatedMadeUp').bounding_box()['height'] - page.locator('.fast-day').first.bounding_box()['height']) <= 1
        page.locator('[data-screen-target="dates"]').click()
        assert page.locator('#fastingPanel').is_hidden()
        assert page.locator('#datesPanel').is_visible()
        assert page.locator('#upcomingFasts [data-occasion]').count() == 5
        assert page.locator('#upcomingEids [data-occasion]').count() == 2
        for group in ['upcomingFasts', 'upcomingEids']:
            dates = page.locator(f'#{group} time').evaluate_all('times => times.map(t => t.dateTime)')
            assert dates == sorted(dates)
        assert page.locator('#upcomingFasts').get_by_text('Obligatory fast', exact=True).count() == 1
        assert page.locator('#upcomingFasts').get_by_text('Sunnah fast outside Hajj', exact=True).count() == 1
        assert page.locator('#upcomingEids').get_by_text('Do not fast', exact=True).count() == 2
        assert page.locator('[data-occasion="monday"], [data-occasion="thursday"]').count() == 0
        modal = page.locator('#occasionDialog')
        for occasion in page.locator('#datesPanel [data-occasion]').all():
            row = occasion.locator('button')
            row.click()
            assert page.locator('#occasionDialog:modal').is_visible()
            assert page.locator('#occasionDialogTitle').inner_text() == occasion.locator('strong').inner_text()
            assert page.locator('#occasionNotes p').first.is_visible()
            assert modal.locator('.occasion-source a').count() >= 3
            assert modal.locator('blockquote[lang="ar"][dir="rtl"]').count() == modal.locator('.occasion-source p').count()
            assert modal.locator('blockquote[lang="ar"][dir="rtl"]').first.is_visible()
            assert modal.locator('a[href^="https://sunnah.com/"]').first.is_visible()
            page.locator('#closeOccasion').click()
            assert modal.is_hidden()
            assert row.evaluate('button => document.activeElement === button')
        page.locator('[data-occasion="fitr"] button').click()
        assert modal.locator('a[href="https://sunnah.com/muslim:1164a"]').is_visible()
        page.mouse.click(2, 2)
        assert modal.is_hidden()
        page.locator('[data-occasion="shawwal"] button').click()
        assert '2–' in page.locator('#occasionDialogDate').inner_text()
        assert 'optional and recommended' in page.locator('#occasionNotes').inner_text()
        page.locator('#closeOccasion').click()
        page.reload()
        assert page.locator('#datesPanel').is_visible()
        page.locator('[data-screen-target="fasting"]').click()
        page.locator('#undatedFasted').fill('17')
        page.locator('#undatedFasted').press('Tab')
        page.get_by_role('button', name='Add one fasted day').click()
        page.locator('#undatedMissed').fill('3')
        page.locator('#undatedMissed').press('Tab')
        page.get_by_role('button', name='Subtract one missed day').click()
        assert page.locator('#undatedFasted').input_value() == '18'
        assert page.locator('#fastingCompleted').inner_text() == '19'
        assert page.locator('#calendarFasted').inner_text().startswith('1 fasted this')
        assert page.locator('#fastingDue').inner_text() == '3'
        page.get_by_role('button', name='Add one make-up fast').click()
        assert page.locator('#fastingCompleted').inner_text() == '19'
        assert page.locator('#fastingDue').inner_text() == '2'
        page.reload()
        assert page.locator('#undatedMissed').input_value() == '2'
        assert page.locator('#undatedFasted').input_value() == '18'
        assert page.locator('#undatedMadeUp').input_value() == '1'
        page.get_by_role('button', name='Subtract one make-up fast').click()
        assert page.locator('#fastingDue').inner_text() == '3'

        page.locator('[data-screen-target="qibla"]').click()
        assert page.locator('#qiblaView').get_attribute('data-view') == 'guide'
        assert page.locator('#qiblaTurnAngle').is_visible()
        assert page.locator('#qiblaArrow').count() == 0
        assert page.locator('#qiblaAligned').is_hidden()
        assert page.locator('#qiblaLayouts').count() == 0
        assert page.locator('#qiblaSettings, #qiblaHaptic, #testVibration').count() == 0
        config = page.evaluate("JSON.parse(localStorage.getItem('salah-config'))")
        assert config['useDeviceLocation'] is True
        assert not {'lat', 'lng', 'timeZone', 'location'} & config.keys()
        page.evaluate("""async () => {
          const lat = 55.1333, lng = -7.45;
          const model = await import('./vendor/magvar/magvar.mjs');
          const radians = Math.PI / 180;
          const fromLat = lat * radians, toLat = 21.422487 * radians;
          const longitudeGap = (39.826206 - lng) * radians;
          const bearing = 360 + Math.atan2(
            Math.sin(longitudeGap), Math.cos(fromLat) * Math.tan(toLat) - Math.sin(fromLat) * Math.cos(longitudeGap)
          ) / radians;
          const correction = model.magvar(lat, lng, 0, new Date());
          window.pointPhone = (offset, accuracy = 10, beta = 0, gamma = 0) => {
            const heading = (bearing + offset - correction + 360) % 360;
            const event = new Event('deviceorientation');
            Object.defineProperties(event, {
              webkitCompassHeading: { value: heading }, webkitCompassAccuracy: { value: accuracy },
              beta: { value: beta }, gamma: { value: gamma }
            });
            window.dispatchEvent(event);
          };
          let heldOffset = 0;
          const wait = ms => new Promise(done => setTimeout(done, ms));
          window.holdPhone = async (offset, accuracy = 10) => {
            while (Math.abs(offset - heldOffset) > 15) {
              heldOffset += 15 * Math.sign(offset - heldOffset);
              pointPhone(heldOffset, accuracy);
              await wait(65);
            }
            heldOffset = offset;
            for (let i = 0; i < 9; i++) {
              pointPhone(offset, accuracy);
              await wait(62);
            }
          };
          window.pointAbsolute = (offset, type = 'deviceorientationabsolute') => {
            const event = new Event(type);
            const alpha = (correction - bearing - offset + 720) % 360;
            Object.defineProperties(event, { alpha:{ value:alpha }, beta:{ value:0 }, gamma:{ value:0 } });
            if (type === 'deviceorientationabsolute') Object.defineProperty(event, 'webkitCompassHeading', { value:null });
            window.dispatchEvent(event);
          };
          for (const eventName of ['deviceorientation', 'deviceorientationabsolute']) {
            window.addEventListener(eventName, event => {
              if (event.isTrusted) event.stopImmediatePropagation();
            }, true);
          }
          window.DeviceOrientationEvent = class {
            static requestPermission() { return Promise.resolve('granted'); }
          };
          window.expectedMagneticBearing = ((bearing - correction) % 360).toFixed(1) + '°';
        }""")
        assert page.locator('#qiblaMagneticBearing').inner_text() == page.evaluate('expectedMagneticBearing')
        fixed_bearing = page.locator('#qiblaBearing').inner_text()
        page.locator('#startCompass').click()
        page.wait_for_function("document.querySelector('#startCompass').textContent === 'Stop compass'")
        assert page.locator('#qiblaTurnAngle').inner_text() == '—'
        page.evaluate('pointPhone(0.1, null)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        assert page.locator('#qiblaCue').inner_text() == 'Approximate alignment · 0.1° off'
        assert 'no compass accuracy estimate' in page.locator('#qiblaAccuracy').inner_text()
        assert page.locator('#qiblaPrecisionRow').is_hidden()
        page.evaluate('holdPhone(55)')
        page.locator('#qiblaDial.live').wait_for()
        assert 'left' in page.locator('#qiblaCue').inner_text()
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'turn'
        assert page.locator('#qiblaArc').evaluate('arc => getComputedStyle(arc).stroke') == 'rgb(255, 133, 137)'
        page.evaluate('holdPhone(12)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'near'
        page.evaluate('holdPhone(2)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        assert page.locator('#qiblaTurnAngle').inner_text() == '2°'
        assert page.locator('#qiblaCue').inner_text() == 'Heading aligned · 2° off'
        assert page.locator('#qiblaTurnLabel').inner_text() == 'From Qibla'
        assert page.locator('#qiblaPrecision').inner_text() == '±10°'
        assert page.locator('#qiblaMarker rect').evaluate('marker => getComputedStyle(marker).stroke') == 'rgb(114, 220, 163)'
        assert page.evaluate('compassTones.slice(-2)') == [740, 990]
        page.evaluate('holdPhone(-2.5)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        assert page.locator('#qiblaTurnAngle').inner_text() == '2.5°'
        page.evaluate('holdPhone(2.51)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'near'
        assert page.locator('#qiblaTurnAngle').inner_text() == '2.6°'
        page.evaluate('holdPhone(2.5)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        assert page.evaluate('compassTones.length') == 2
        page.evaluate('holdPhone(7)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'near'
        page.evaluate('holdPhone(1, 13)')
        assert page.locator('#qiblaCue').inner_text() == 'Approximate alignment · 1° off'
        assert page.locator('#qiblaPrecision').inner_text() == '±13°'
        page.evaluate('pointPhone(0, 10, 20, 20)')
        assert page.locator('#qiblaCue').inner_text() == 'Hold your phone flat'
        assert page.locator('#qiblaTurnAngle').inner_text() == '—'
        page.evaluate('pointPhone(0, 35)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'weak'
        assert page.locator('#qiblaDial').evaluate('dial => !dial.classList.contains("live")')
        page.evaluate('pointPhone(0, -1)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'weak'
        assert page.locator('#qiblaPrecision').inner_text() == 'Uncalibrated'
        page.evaluate('holdPhone(0)')
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        ring = page.locator('#compassTicks').get_attribute('transform')
        page.evaluate('pointAbsolute(90)')
        assert page.locator('#qiblaDial.aligned').is_visible()
        page.evaluate("""async () => {
          for (let i = 0; i < 12; i++) {
            pointPhone(90);
            await new Promise(done => setTimeout(done, 45));
          }
        }""")
        assert page.locator('#qiblaCue').inner_text() == 'Compass reading jumped'
        assert page.locator('#compassTicks').get_attribute('transform') == ring
        assert page.locator('#qiblaTurnAngle').inner_text() == '—'
        assert page.locator('#startCompass').inner_text() == 'Restart compass'
        page.evaluate('pointPhone(0)')
        assert page.locator('#qiblaDial.aligned').is_visible()
        page.evaluate("""() => {
          Object.defineProperty(window, 'orientation', {configurable:true, value:90});
          window.dispatchEvent(new Event('orientationchange'));
          pointPhone(90);
        }""")
        assert page.locator('#qiblaCue').inner_text() == 'Turn your phone upright'
        assert page.locator('#compassTicks').get_attribute('transform') == ring
        page.evaluate("""async () => {
          Object.defineProperty(window, 'orientation', {configurable:true, value:0});
          window.dispatchEvent(new Event('orientationchange'));
          pointPhone(90);
          await new Promise(done => setTimeout(done, 270));
          pointPhone(0);
        }""")
        assert page.locator('#qiblaDial.aligned').is_visible()
        page.evaluate("""() => {
          const invalid = new Event('deviceorientation');
          Object.defineProperties(invalid, { webkitCompassHeading: { value: -1 }, webkitCompassAccuracy: { value: 10 } });
          window.dispatchEvent(invalid);
        }""")
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'weak'
        assert page.locator('#qiblaTurnAngle').inner_text() == '—'
        assert page.locator('#qiblaBearing').inner_text() == fixed_bearing
        page.locator('#startCompass').click()
        page.locator('#startCompass').click()
        page.evaluate("pointAbsolute(1, 'deviceorientation')")
        assert page.locator('#qiblaTurnAngle').inner_text() == '—'
        page.evaluate('pointAbsolute(0.1)')
        assert page.locator('#qiblaCue').inner_text() == 'Approximate alignment · 0.1° off'
        assert page.locator('#qiblaAligned').get_attribute('data-state') == 'aligned'
        assert page.locator('#qiblaPrecisionRow').is_hidden()
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

        context.set_geolocation({'latitude': 51.5072, 'longitude': -0.1276, 'accuracy': 10})
        context.set_offline(False)
        page.wait_for_function("document.querySelector('#qiblaPosition').textContent.startsWith('London')")
        assert page.locator('#qiblaBearing').inner_text() == '119.0°'
        page.locator('[data-screen-target="today"]').click()
        assert page.locator('#locationLabel').inner_text().startswith('London')
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

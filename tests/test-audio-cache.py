from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from os import environ
from pathlib import Path
from threading import Thread
import math
import struct
import wave

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
sample = BytesIO()
with wave.open(sample, 'wb') as file:
    file.setparams((1, 2, 8000, 16000, 'NONE', 'not compressed'))
    file.writeframes(b''.join(struct.pack('<h', int(15000 * math.sin(i * 0.35))) for i in range(16000)))


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=root))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=environ.get('SALAH_CHROMIUM', '/usr/bin/chromium'),
            args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':390, 'height':844}, timezone_id='Europe/London')
        network_requests = []
        context.route('https://**/*', lambda route: route.abort())

        def adhan(route):
            network_requests.append(route.request.url)
            route.fulfill(status=200, body=sample.getvalue(),
                          headers={'content-type':'audio/wav', 'access-control-allow-origin':'*'})

        context.route('https://raw.githubusercontent.com/alsuleiman-lab/**', adhan)
        context.add_init_script("""(() => {
          window.bufferStarts = 0; window.decoded = 0; window.chimeNotes = 0;
          const tone = OscillatorNode.prototype.start;
          OscillatorNode.prototype.start = function(...args) { chimeNotes++; return tone.apply(this,args); };
          Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
            configurable:true, get(){return 1}, set(){throw Error('volume locked');}
          });
          const gain = AudioContext.prototype.createGain;
          AudioContext.prototype.createGain = function() {
            const node = gain.call(this);
            if (!window.masterGain) window.masterGain = node;
            return node;
          };
          const decode = AudioContext.prototype.decodeAudioData;
          AudioContext.prototype.decodeAudioData = function(bytes) {
            window.decoded++;
            return decode.call(this, bytes);
          };
          const start = AudioBufferSourceNode.prototype.start;
          AudioBufferSourceNode.prototype.start = function(...args) {
            window.bufferStarts++;
            return start.apply(this,args);
          };
        })()""")
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.clock.set_fixed_time(datetime(2026, 11, 22, 10, 38, tzinfo=timezone.utc))
        page.goto(url)
        page.locator('#skipPermissions').click()
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        page.wait_for_function("""() => new Promise(resolve => {
          const req = indexedDB.open('salah-local-media-v3');
          req.onerror = () => resolve(false);
          req.onsuccess = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('audio')) { db.close(); resolve(false); return; }
            const tx = db.transaction('audio','readonly');
            const count = tx.objectStore('audio').count();
            tx.oncomplete = () => { db.close(); resolve(count.result === 2); };
          };
        })""")
        assert len(network_requests) == 2
        context.set_offline(True)
        page.reload()
        page.locator('[data-screen-target="sounds"]').click()
        page.locator('#testSound').click()
        page.wait_for_function("bufferStarts === 1 && document.querySelector('#soundStatus').textContent === 'Playing adhan.'")
        assert page.evaluate('decoded') == 1
        assert abs(page.evaluate('masterGain.gain.value') - .40) < .001
        page.locator('#soundVolume').evaluate("(slider) => {slider.value=15; slider.dispatchEvent(new Event('input'))}")
        page.wait_for_function('Math.abs(masterGain.gain.value - .15) < .01')
        page.locator('#soundVolume').evaluate("(slider) => {slider.value=0; slider.dispatchEvent(new Event('input'))}")
        page.wait_for_function('masterGain.gain.value < .01')
        page.locator('#stopSound').click()
        assert page.locator('#soundStatus').inner_text() == 'Sound stopped.'
        page.locator('#soundChoice').select_option('adhan-fajr-abu-bakr')
        page.locator('#testSound').click()
        page.wait_for_function('bufferStarts === 2')
        assert len(network_requests) == 2
        assert page.locator('#soundChoice option').all_text_contents() == ['Abu Bakr', 'Echo', 'Gentle chime', 'Clear bell', 'Silent', 'Import a sound']
        for choice in ['soft', 'bell']:
            page.locator('#soundChoice').select_option(choice)
            page.locator('#repeatChime').check()
            old_notes = page.evaluate('chimeNotes')
            page.locator('#testSound').click()
            page.wait_for_function(f'chimeNotes >= {old_notes + 4}')
            page.locator('#stopSound').click()
            stopped = page.evaluate('chimeNotes')
            page.wait_for_timeout(1800)
            assert page.evaluate('chimeNotes') == stopped
        page.locator('#soundChoice').select_option('off')
        assert page.locator('#repeatChime').is_hidden()
        assert page.locator('#closedReminders').count() == 0
        assert not errors, errors
        browser.close()
    print('PASS: all adhan recordings cache in IndexedDB, offline reload decodes a recording, and the gain slider attenuates and mutes despite locked media volume.')
finally:
    server.shutdown()

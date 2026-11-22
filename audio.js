(function (root) {
  'use strict';

  function create(initialLevel) {
    let context, master, media, recording, decoded, fallbackBlobURL;
    let revision = 0;
    let volume = initialLevel / 100;
    const tones = new Set();

    function unlock() {
      const AudioContext = root.AudioContext || root.webkitAudioContext;
      if (!AudioContext) return Promise.resolve(false);
      try {
        if (!context) {
          context = new AudioContext();
          master = context.createGain();
          master.gain.value = volume;
          master.connect(context.destination);
        }
        if (context.state === 'running') return Promise.resolve(true);
        const resume = context.resume();
        return new Promise(resolve => {
          const timer = setTimeout(() => resolve(context.state === 'running'), 1800);
          resume.then(() => {
            clearTimeout(timer);
            resolve(context.state === 'running');
          }, () => {
            clearTimeout(timer);
            resolve(false);
          });
        });
      } catch {
        return Promise.resolve(false);
      }
    }

    function deviceVolume() {
      if (!media) return;
      media.muted = volume === 0;
      try { media.volume = volume; } catch {}
    }

    function setLevel(level) {
      volume = Math.max(0, Math.min(1, level / 100));
      if (master) {
        master.gain.cancelScheduledValues(context.currentTime);
        if (context.state === 'running') master.gain.setTargetAtTime(volume, context.currentTime, 0.018);
        else master.gain.value = volume;
      }
      deviceVolume();
    }

    function stop() {
      revision++;
      if (recording) { recording.onended = null; recording.stop(); recording.disconnect(); recording = null; }
      if (media) { media.onended = null; media.pause(); media.removeAttribute('src'); media.load(); media = null; }
      if (fallbackBlobURL) { URL.revokeObjectURL(fallbackBlobURL); fallbackBlobURL = null; }
      for (const osc of tones) { try { osc.stop(); } catch {} }
      tones.clear();
    }

    function decode(blob) {
      if (decoded?.blob === blob) return decoded.data;
      const data = blob.arrayBuffer().then(bytes => context.decodeAudioData(bytes));
      decoded = { blob, data };
      data.catch(() => { if (decoded?.data === data) decoded = null; });
      return data;
    }

    async function play(blobPromise, url, fromTap, onEnd) {
      stop();
      const request = revision;
      const ready = fromTap ? unlock() : Promise.resolve(context?.state === 'running');
      const blob = await blobPromise.catch(() => null);
      const usable = await ready;
      if (request !== revision || document.hidden) return null;
      if (usable && blob) {
        const buffer = await decode(blob).catch(() => null);
        if (request !== revision || document.hidden) return null;
        if (buffer && context.state === 'running') {
          recording = context.createBufferSource();
          recording.buffer = buffer;
          recording.connect(master);
          recording.onended = () => {
            if (request !== revision) return;
            recording.disconnect();
            recording = null;
            onEnd();
          };
          recording.start();
          return 'gain';
        }
      }
      if (!fromTap && !usable) throw Error('Tap Play sound to start audio for this session.');
      if (!blob && !url) throw Error('This recording is unavailable. Open Salah online to save it.');
      if (blob) fallbackBlobURL = URL.createObjectURL(blob);
      const player = new Audio(fallbackBlobURL || url);
      media = player;
      player.onended = onEnd;
      deviceVolume();
      await player.play();
      return request === revision ? 'device' : null;
    }

    function chime(notes) {
      if (context?.state !== 'running') return false;
      const start = context.currentTime + 0.025;
      for (const [frequency, delay, duration, level] of notes) {
        const time = start + delay;
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.frequency.setValueAtTime(frequency, time);
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.exponentialRampToValueAtTime(level, time + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
        osc.connect(gain);
        gain.connect(master);
        tones.add(osc);
        osc.onended = () => { tones.delete(osc); osc.disconnect(); gain.disconnect(); };
        osc.start(time);
        osc.stop(time + .02 + duration);
      }
      return true;
    }

    return { unlock, setLevel, play, stop, chime, ready:() => context?.state === 'running' };
  }

  root.SalahAudio = { create };
})(window);

(function (root) {
  'use strict';

  const signedTurn = (from, to) => (to - from + 540) % 360 - 180;
  const normalise = angle => (angle % 360 + 360) % 360;
  const headingWindow = 320;
  const jumpLimit = 30;

  function createHeadingFilter() {
    const headings = [];
    const rotations = [];
    let accepted = null, candidate = null, previousRate = null;

    function pause() {
      headings.length = rotations.length = 0;
      candidate = previousRate = null;
    }
    function reset() {
      pause();
      accepted = null;
    }

    function recordRotation(rate, time) {
      if (!Number.isFinite(rate)) { previousRate = null; return; }
      while (rotations.length && rotations[0].time < time - 650) rotations.shift();
      const elapsed = time - previousRate?.time;
      // Never count an interval in which the browser stopped sending motion samples.
      if (elapsed > 0 && elapsed <= 100) {
        // Clockwise compass headings increase in the opposite direction to alpha.
        const degrees = -(rate + previousRate.rate) * elapsed / 2000;
        rotations.push({ time, degrees });
      }
      previousRate = { rate, time };
    }

    function read(heading, time) {
      const delta = accepted ? signedTurn(accepted.heading, heading) : 0;
      const change = Math.abs(delta);
      if (change >= jumpLimit) {
        if (!candidate || Math.abs(signedTurn(candidate.heading, heading)) > 10) candidate = { heading, time };
        const elapsed = time - candidate.time;
        const from = Math.max(accepted.time - 70, candidate.time - 350);
        const degrees = rotations.reduce((sum, sample) =>
          sample.time >= from && sample.time <= candidate.time + 120 ? sum + sample.degrees : sum, 0);
        // Repeated compass readings can all share the same error. A short burst of
        // rotation around the screen's Z axis independently confirms a real turn.
        headings.length = 0;
        const agrees = change >= 175 || Math.sign(delta) === Math.sign(degrees);
        if (!agrees || elapsed < 65 || elapsed > 280 || Math.abs(degrees) < change * .7) {
          return { heading:null, steady:false, jumped:true };
        }
      }
      accepted = { heading, time };
      candidate = null;

      while (headings.length && headings[0].time < time - headingWindow) headings.shift();
      const last = headings.at(-1);
      if (last && time - last.time < 55) last.heading = heading;
      else headings.push(accepted);
      const offsets = headings.map(sample => signedTurn(heading, sample.heading)).sort((a, b) => a - b);
      const middle = Math.floor(offsets.length / 2);
      const median = offsets.length % 2 ? offsets[middle] : (offsets[middle - 1] + offsets[middle]) / 2;
      return {
        heading:normalise(heading + median),
        steady:offsets.length >= 3 && offsets.at(-1) - offsets[0] <= 5,
        jumped:false
      };
    }

    return { read, recordRotation, pause, reset };
  }

  root.SalahCompass = { createHeadingFilter, signedTurn };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahCompass;
})(typeof window !== 'undefined' ? window : globalThis);

(function (root) {
  'use strict';

  const signedTurn = (from, to) => (to - from + 540) % 360 - 180;
  const normalise = angle => (angle % 360 + 360) % 360;
  const KAABA = { lat:21.422487, lng:39.826206 };
  const flattening = 1 / 298.257223563;
  const semiMinorAxis = 6378137 * (1 - flattening);
  const rad = Math.PI / 180;
  const headingWindow = 320;
  const jumpLimit = 30;

  function qiblaGeodesic(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    // Vincenty's inverse geodesic on WGS84. The UK and Ireland are far from the antipode of the Kaaba.
    const u1 = Math.atan((1 - flattening) * Math.tan(lat * rad));
    const u2 = Math.atan((1 - flattening) * Math.tan(KAABA.lat * rad));
    const sinU1 = Math.sin(u1), cosU1 = Math.cos(u1), sinU2 = Math.sin(u2), cosU2 = Math.cos(u2);
    const longitudeGap = signedTurn(lng, KAABA.lng) * rad;
    let lambda = longitudeGap;
    for (let iteration = 0; iteration < 32; iteration++) {
      const sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
      const east = cosU2 * sinLambda;
      const north = cosU1 * sinU2 - sinU1 * cosU2 * cosLambda;
      const sinSigma = Math.hypot(east, north);
      if (sinSigma < 1e-15) return null;
      const cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      const sigma = Math.atan2(sinSigma, cosSigma);
      const sinAlpha = cosU1 * east / sinSigma;
      const cosSqAlpha = Math.max(0, 1 - sinAlpha ** 2);
      const cos2SigmaMid = cosSqAlpha > 1e-15 ? cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha : 0;
      const correction = flattening * cosSqAlpha * (4 + flattening * (4 - 3 * cosSqAlpha)) / 16;
      const next = longitudeGap + (1 - correction) * flattening * sinAlpha *
        (sigma + correction * sinSigma * (cos2SigmaMid + correction * cosSigma * (2 * cos2SigmaMid ** 2 - 1)));
      if (Math.abs(next - lambda) < 1e-12) {
        const uSquared = cosSqAlpha * (1 / (1 - flattening) ** 2 - 1);
        const a = 1 + uSquared * (4096 + uSquared * (-768 + uSquared * (320 - 175 * uSquared))) / 16384;
        const b = uSquared * (256 + uSquared * (-128 + uSquared * (74 - 47 * uSquared))) / 1024;
        const deltaSigma = b * sinSigma * (cos2SigmaMid + b / 4 *
          (cosSigma * (2 * cos2SigmaMid ** 2 - 1) -
            b / 6 * cos2SigmaMid * (4 * sinSigma ** 2 - 3) * (4 * cos2SigmaMid ** 2 - 3)));
        return { bearing:normalise(Math.atan2(east, north) / rad), km:semiMinorAxis * a * (sigma - deltaSigma) / 1000 };
      }
      lambda = next;
    }
    return null;
  }

  function fieldLooksDistorted(observed, expected) {
    return Number.isFinite(observed) && Number.isFinite(expected) && expected > 0 &&
      Math.abs(observed - expected) > Math.max(10, expected * .25);
  }

  function createHeadingFilter(steadySpread = 5) {
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
        steady:offsets.length >= 3 && offsets.at(-1) - offsets[0] <= steadySpread,
        jumped:false
      };
    }

    return { read, recordRotation, pause, reset };
  }

  root.SalahCompass = { createHeadingFilter, signedTurn, qiblaGeodesic, fieldLooksDistorted };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SalahCompass;
})(typeof window !== 'undefined' ? window : globalThis);

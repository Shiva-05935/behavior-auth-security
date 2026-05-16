// Collects keystroke dynamics and mouse behavior

export function createBehaviorCollector() {
  const keyPresses = [];
  const keyHolds = {};
  const mousePositions = [];
  const mouseClicks = [];
  let lastKeyTime = null;

  function onKeyDown(e) {
    const now = performance.now();
    if (!keyHolds[e.key]) {
      keyHolds[e.key] = now;
    }
    if (lastKeyTime !== null) {
      keyPresses.push({ key: e.key, interval: now - lastKeyTime, timestamp: now });
    } else {
      keyPresses.push({ key: e.key, interval: 0, timestamp: now });
    }
    lastKeyTime = now;
  }

  function onKeyUp(e) {
    const now = performance.now();
    const downTime = keyHolds[e.key];
    if (downTime) {
      const holdDuration = now - downTime;
      const press = keyPresses.find(p => p.key === e.key && !p.holdDuration);
      if (press) press.holdDuration = holdDuration;
      delete keyHolds[e.key];
    }
  }

  function onMouseMove(e) {
    mousePositions.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  }

  function onClick(e) {
    mouseClicks.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  }

  function getAnalysis() {
    const intervals = keyPresses.filter(k => k.interval > 0).map(k => k.interval);
    const holds = keyPresses.filter(k => k.holdDuration).map(k => k.holdDuration);

    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const avgHoldDuration = holds.length > 0 ? holds.reduce((a, b) => a + b, 0) / holds.length : 0;

    const totalTime = keyPresses.length > 1
      ? (keyPresses[keyPresses.length - 1].timestamp - keyPresses[0].timestamp) / 1000
      : 0;
    const typingSpeed = totalTime > 0 ? Math.round((keyPresses.length / totalTime) * 60) : 0;

    let totalMouseDist = 0;
    let totalMouseTime = 0;
    for (let i = 1; i < mousePositions.length; i++) {
      const dx = mousePositions[i].x - mousePositions[i - 1].x;
      const dy = mousePositions[i].y - mousePositions[i - 1].y;
      totalMouseDist += Math.sqrt(dx * dx + dy * dy);
      totalMouseTime += mousePositions[i].t - mousePositions[i - 1].t;
    }
    const mouseSpeed = totalMouseTime > 0 ? Math.round((totalMouseDist / totalMouseTime) * 1000) : 0;

    let jitterSum = 0;
    for (let i = 2; i < mousePositions.length; i++) {
      const dx1 = mousePositions[i].x - mousePositions[i - 1].x;
      const dy1 = mousePositions[i].y - mousePositions[i - 1].y;
      const dx2 = mousePositions[i - 1].x - mousePositions[i - 2].x;
      const dy2 = mousePositions[i - 1].y - mousePositions[i - 2].y;
      jitterSum += Math.abs(dx1 - dx2) + Math.abs(dy1 - dy2);
    }
    const avgJitter = mousePositions.length > 2 ? jitterSum / (mousePositions.length - 2) : 0;
    const mouseAccuracy = Math.max(0, Math.min(100, Math.round(100 - avgJitter * 2)));

    return {
      typingSpeed,
      avgInterval: Math.round(avgInterval),
      avgHoldDuration: Math.round(avgHoldDuration),
      mouseSpeed,
      mouseAccuracy,
      mouseClicks: mouseClicks.length,
      totalKeystrokes: keyPresses.length,
      keyPressData: keyPresses.slice(0, 50),
      mouseMovementSamples: mousePositions.length
    };
  }

  function reset() {
    keyPresses.length = 0;
    Object.keys(keyHolds).forEach(k => delete keyHolds[k]);
    mousePositions.length = 0;
    mouseClicks.length = 0;
    lastKeyTime = null;
  }

  return { onKeyDown, onKeyUp, onMouseMove, onClick, getAnalysis, reset };
}
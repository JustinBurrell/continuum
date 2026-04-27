// Sequential, deduplicated prefetch queue — runs one task at a time via
// requestIdleCallback so prefetching never competes with scroll/animation budget.
// Instagram-style: prefetches are ordered by when they were enqueued (viewport
// proximity order when callers use IntersectionObserver from top to bottom).

const queue = [];
const inFlight = new Set();
let running = false;

function drain() {
  if (running || queue.length === 0) return;
  running = true;
  const { key, run } = queue.shift();
  const schedule = () => {
    Promise.resolve(run()).finally(() => {
      inFlight.delete(key);
      running = false;
      drain();
    });
  };
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(schedule, { timeout: 2000 });
  } else {
    setTimeout(schedule, 0);
  }
}

export function enqueuePrefetch(key, run) {
  if (inFlight.has(key)) return;
  inFlight.add(key);
  queue.push({ key, run });
  drain();
}

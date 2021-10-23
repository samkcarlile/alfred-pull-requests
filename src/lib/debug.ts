import { performance } from 'perf_hooks';

const debug = process.env['DEBUG'] === 'true';

export function log(...message: any[]) {
  if (debug) console.log(...message);
}

export function dir(object: any) {
  if (debug) console.dir(object);
}

export function stopwatch(...message: any[]) {
  const start = performance.now();
  return () => {
    log(...message, `(${performance.now() - start}ms)`);
  };
}

import { OutputOptions } from 'alfy';
import { existsSync, mkdirSync } from 'fs';
import md5 from 'md5';
import { join } from 'path';
import { readJson, writeJson } from './util.js';

type WithSWROptions = {
  /** JSON reviver for the cached data */
  reviver?: (this: any, key: string, value: any) => any;
};

const cacheRoot = join(process.cwd(), process.env['CACHE'] ?? '.cache');
if (!existsSync(cacheRoot)) mkdirSync(cacheRoot);

const isFirstRun = !process.env['refetch'];

export function swrOptions({
  variables,
  rerunInterval = 0.1,
}: OutputOptions = {}): OutputOptions {
  if (isFirstRun) {
    return {
      rerunInterval,
      variables: { ...variables, refetch: true },
    };
  }

  return { variables };
}

/**
 * Makes a function part of the stale-while-revalidate routine, saving the last return value to cache.
 */
export function withSWR<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  { reviver }: WithSWROptions
): T {
  return (async (...args: any[]) => {
    const hash = md5(fn.name + JSON.stringify(args));
    const cacheFile = join(cacheRoot, `${hash}.json`);

    if (isFirstRun && existsSync(cacheFile)) {
      return readJson<T>(cacheFile, reviver);
    }

    const result = await fn(...args);
    await writeJson(cacheFile, result);
    return result;
  }) as T;
}

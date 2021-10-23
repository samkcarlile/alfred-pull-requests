import { exists, getModificationTime, readJson, writeJson } from './util.js';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

const cacheRoot = join(process.cwd(), process.env['CACHE'] ?? '.cache');
if (!existsSync(cacheRoot)) mkdirSync(cacheRoot);

type CacheOptions = {
  /** The key to store this cached value */
  key: string;
  /** When to expire the cache by number of milliseconds */
  expires: number;
  /** JSON reviver for the cached data */
  reviver?: (this: any, key: string, value: any) => any;
};
export function useCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  { key, expires, reviver }: CacheOptions
): T {
  return (async (...args: any[]) => {
    const cacheFile = join(process.cwd(), `.cache/${key}.json`);
    if (await exists(cacheFile)) {
      const updated = await getModificationTime(cacheFile);
      const delta = Date.now() - updated.getTime();
      if (delta <= expires) {
        return readJson(cacheFile, reviver);
      }
    }

    const result = await fn(...args);
    await writeJson(cacheFile, result);
    return result;
  }) as T;
}

export function clearCache(...keys: string[]) {
  const files = keys.map((key) => join(process.cwd(), `.cache/${key}.json`));
  for (const file of files) rmSync(file);
}

import { config as dotenv } from 'dotenv';
import { constants as fs } from 'fs';
import { access, lstat, readFile, writeFile } from 'fs/promises';
dotenv();

export function config() {}

export function getIconPath(icon: string) {
  return `icons/${icon}.png`;
}

export function ordinalScale(labels: string[]): (label: string) => number {
  const values = [...labels];
  return (label) => values.indexOf(label);
}

export function formatDateRelative(date: Date): string {
  const now = new Date();
  const deltaMs = now.getTime() - date.getTime();
  const deltaMinutes = deltaMs / (1000 * 60);
  const deltaHours = deltaMinutes / 60;
  const deltaDays = deltaHours / 24;

  let interval: Intl.RelativeTimeFormatUnit, delta: number;

  if (deltaMinutes < 60) {
    interval = 'minutes';
    delta = deltaMinutes;
  } else if (deltaHours < 24) {
    interval = 'hours';
    delta = deltaHours;
  } else {
    interval = 'days';
    delta = deltaDays;
  }

  const formatter = new Intl.RelativeTimeFormat('en-US');
  return formatter.format(-Math.round(delta), interval);
}

export async function writeJson(path: string, data: any): Promise<void> {
  await writeFile(path, JSON.stringify(data), 'utf8');
}

export async function readJson<T = any>(
  path: string,
  reviver?: (this: any, key: string, value: any) => any
): Promise<T> {
  try {
    await access(path, fs.R_OK);
  } catch {
    throw new Error(`can't read ${path}.`);
  }

  const contents = await readFile(path, 'utf8');

  try {
    const result = JSON.parse(contents, reviver) as T;
    return result;
  } catch (error: any) {
    throw new Error(`unable to parse json: ${error}`);
  }
}

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path, fs.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getModificationTime(path: string): Promise<Date> {
  const { mtime } = await lstat(path);
  return mtime;
}

export function reviveDateProperties<T>(
  props: (keyof T)[]
): (key: string, value: any) => any {
  return (key, value) => {
    if (props.includes(key as keyof T)) return new Date(value);
    else return value;
  };
}

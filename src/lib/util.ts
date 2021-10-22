import { config as dotenv } from 'dotenv';
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

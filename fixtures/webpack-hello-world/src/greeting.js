/**
 * Greeting utilities.
 * Uses async class pattern to exercise Wakaru's un-es6-class restoration.
 * Imports from math.js to create a cross-file dependency for the module graph.
 */

import { add } from './math';

export function getTimeOfDay(hour) {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function formatGreeting(name, hour) {
  const timeOfDay = getTimeOfDay(hour);
  const wordCount = add(2, name.split(' ').length);
  return `Good ${timeOfDay}, ${name}! Your greeting has ${wordCount} words.`;
}

export class GreetingFormatter {
  constructor(locale) {
    this.locale = locale;
    this.greetingCount = 0;
  }

  formatFormal(name) {
    this.greetingCount = add(this.greetingCount, 1);
    return `Dear ${name}, greetings from locale ${this.locale}.`;
  }

  getStats() {
    return { locale: this.locale, totalGreetings: this.greetingCount };
  }
}

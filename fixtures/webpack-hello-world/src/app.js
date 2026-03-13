/**
 * Application entry point.
 * Ties together greeting, math, and api modules.
 * The cross-file call graph here is the ground truth for Phase 5 validation.
 *
 * Expected call graph edges:
 *   app.js:initApp -> greeting.js:formatGreeting
 *   app.js:initApp -> math.js:calculateCircleArea
 *   app.js:initApp -> api.js:processUserData
 *   app.js:initApp -> api.js:fetchMultipleUsers
 *   app.js:displayResults -> greeting.js:GreetingFormatter
 */

import { formatGreeting, GreetingFormatter } from './greeting';
import { calculateCircleArea } from './math';
import { processUserData, fetchMultipleUsers } from './api';

function displayResults(user, formatter) {
  const formalGreeting = formatter.formatFormal(user.displayName);
  console.log(formalGreeting);
  console.log(`Role: ${user.role} | Trust Score: ${user.trustScore}`);
  console.log(`Member ID: ${user.memberId}`);
}

async function initApp() {
  const hour = new Date().getHours();

  // Greeting module
  const greeting = formatGreeting('World', hour);
  console.log(greeting);

  // Math module
  const area = calculateCircleArea(5);
  console.log(`Circle area with radius 5: ${area.toFixed(2)}`);

  // API module - single user
  const user = await processUserData(42);
  const formatter = new GreetingFormatter('en-US');
  displayResults(user, formatter);

  // API module - multiple users
  const teamMembers = await fetchMultipleUsers([1, 2, 42]);
  console.log(`Team: ${teamMembers.map((m) => m.name).join(', ')}`);

  // Formatter stats
  const stats = formatter.getStats();
  console.log(`Sent ${stats.totalGreetings} greeting(s) in ${stats.locale}`);
}

initApp().catch(console.error);

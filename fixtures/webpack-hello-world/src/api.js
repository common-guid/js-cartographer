/**
 * Simulated async data-fetching module.
 * async/await here will be transpiled to generator state machines by Babel (ES5 target),
 * which is exactly what Wakaru's un-async-await rule is designed to restore.
 */

import { clampValue } from './math';

const USER_DATABASE = {
  1: { name: 'Alice Johnson', role: 'admin', score: 95 },
  2: { name: 'Bob Smith', role: 'user', score: 72 },
  42: { name: 'Jane Doe', role: 'moderator', score: 88 },
};

export async function fetchUserData(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = USER_DATABASE[userId];
      if (!user) {
        reject(new Error(`User ${userId} not found`));
        return;
      }
      resolve({ id: userId, ...user, fetchedAt: new Date().toISOString() });
    }, 10);
  });
}

export async function processUserData(userId) {
  const userData = await fetchUserData(userId);
  const normalizedScore = clampValue(userData.score, 0, 100);

  return {
    displayName: userData.name.toUpperCase(),
    memberId: `MEMBER-${userData.id}`,
    role: userData.role,
    trustScore: normalizedScore,
  };
}

export async function fetchMultipleUsers(userIds) {
  const results = await Promise.all(userIds.map(fetchUserData));
  return results.map((user) => ({
    id: user.id,
    name: user.name,
  }));
}

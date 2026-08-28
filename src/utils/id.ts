/**
 * ID generator utilities for Tonight.
 * Generates lightweight, stable, collision-free IDs without external heavy dependencies.
 */

let counter = 0;

/**
 * Generate a unique, stable player ID.
 * Example: `player_1724856000000_1_a3f9`
 */
export function generatePlayerId(prefix = 'player'): string {
  counter += 1;
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${counter}_${randomSuffix}`;
}

/**
 * Generate a unique session ID.
 * Example: `session_1724856000000_a3f9`
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${randomSuffix}`;
}

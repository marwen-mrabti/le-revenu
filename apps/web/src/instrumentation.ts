/**
 * Runs once when the server starts (dev and production, Node runtime only).
 * Importing the env module validates every required variable: a missing or
 * placeholder secret stops the boot with the list of offending keys.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./config/env');
  }
}

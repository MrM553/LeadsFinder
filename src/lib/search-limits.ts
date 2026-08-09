/** Client-safe search-limit constants (see CLAUDE.md's search rules). */

/** Default limit used everywhere during development. */
export const DEV_DEFAULT_LIMIT = 10;
/** Requests above this limit require an explicit confirmation flag. */
export const CONFIRMATION_THRESHOLD = 10;
/** Product ceiling — never search for more than this in one run. */
export const MAX_LIMIT = 100;

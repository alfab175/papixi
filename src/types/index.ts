// ============================================================
// PAPIX - TYPE DEFINITIONS (Re-exports from localDB)
// ============================================================
export type { DBUser, DBMovie, DBCartoon } from '../services/localDB';

import type { DBMovie, DBCartoon } from '../services/localDB';
export type ContentItem = DBMovie | DBCartoon;

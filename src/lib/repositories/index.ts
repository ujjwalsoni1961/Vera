// Public repository entry point.
//
// Swap this single line to plug in a PostgreSQL-backed implementation later
// (e.g. `export { getRepositories } from "./postgres";`). No caller changes.
export { getRepositories, createInMemoryRepositories } from "./inMemory";
export type * from "./types";

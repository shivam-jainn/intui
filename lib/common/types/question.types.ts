// ─── Difficulty ─────────────────────────────────────────────────────────────
// Single source of truth used by API routes, frontend components, and seed
// scripts. Mirrors the Prisma `Difficulty` enum in prisma/schema.prisma.

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export const DIFFICULTY_VALUES = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard] as const;

export const difficultyColor: Record<Difficulty, string> = {
  [Difficulty.Easy]: 'teal',
  [Difficulty.Medium]: 'yellow',
  [Difficulty.Hard]: 'red',
};

// ─── DSA Genres ─────────────────────────────────────────────────────────────
// Each entry maps a display label to topic keyword patterns used for
// auto-categorising questions into genre rails on the home browsing UI.
//
// To add a new genre:  push a new entry with a unique `id`, a display `label`,
// and one or more lowercase `patterns` that should match topic names.
//
// To rename a genre:   update `label`.
// To re-map questions: add/remove strings in `patterns`.

export type GenreConfig = {
  id: string;
  label: string;
  patterns: string[];
};

export const DSA_GENRES: GenreConfig[] = [
  {
    id: 'graph',
    label: 'Graph',
    patterns: ['graph', 'dijkstra', 'bellman-ford', 'shortest path', 'bfs', 'dfs', 'currency arbitrage', 'negative cycle detection', 'logarithmic transformation'],
  },
  {
    id: 'tree',
    label: 'Tree',
    patterns: ['tree', 'binary tree', 'bst', 'trie', 'segment tree', 'fenwick tree'],
  },
  {
    id: 'sliding-window',
    label: 'Sliding Window',
    patterns: ['sliding window', 'two pointers', 'window'],
  },
  {
    id: 'dp',
    label: 'Dynamic Programming',
    patterns: ['dp', 'dynamic programming', 'memoization', 'tabulation', 'knapsack'],
  },
  {
    id: 'greedy',
    label: 'Greedy',
    patterns: ['greedy', 'interval', 'activity selection'],
  },
  {
    id: 'stack-queue',
    label: 'Stack & Queue',
    patterns: ['stack', 'queue', 'monotonic stack', 'deque', 'priority queue'],
  },
  {
    id: 'string',
    label: 'String',
    patterns: ['string', 'kmp', 'rolling hash', 'palindrome', 'anagram'],
  },
  {
    id: 'array',
    label: 'Array & Hashing',
    patterns: ['array', 'hash', 'prefix sum', 'sorting', 'binary search'],
  },
  {
    id: 'math',
    label: 'Math & Bit Manipulation',
    patterns: ['math', 'bit manipulation', 'modular arithmetic', 'combinatorics', 'number theory'],
  },
  {
    id: 'trading',
    label: 'Trading & Finance',
    patterns: ['trading', 'finance', 'sor', 'order routing', 'market', 'exchange'],
  },
];

# The Lost Kingdoms

The Kingdom of Eldoria is divided into several regions connected by roads. A messenger needs to deliver a letter to all regions starting from the capital. Some roads are blocked due to a storm. Can the messenger reach every region?

### Problem
You are given `n` regions numbered from `0` to `n-1` and a list of `roads` where each road is a pair `[u, v]` indicating a bidirectional connection between region `u` and region `v`. The capital is region `0`. Determine whether all regions are reachable from the capital.

### Input
- `n`: integer, number of regions
- `roads`: list of pairs representing roads

### Output
- `true` if every region can be reached from 0, otherwise `false`.

### Examples
```
Input: n = 5, roads = [[0,1],[1,2],[2,3],[3,4]]
Output: true

Input: n = 5, roads = [[0,1],[2,3]]
Output: false
```

### Constraints
- `1 <= n <= 10^5`
- `0 <= u, v < n`
- The graph may be disconnected.
- Road list length ≤ 2·10^5.

# The Secret Network

A group of spies has created a secret communication network. Each spy communicates with another through a direct channel. However, the network must not have any loops to avoid detection. Help the agency check if the network contains any cycles.

### Problem
Given `n` spies numbered 0 to `n-1` and a list of directed communication links `links` where each link is a pair `[u, v]` indicating that spy `u` can send messages to spy `v`. Determine if there is any cycle in the directed graph.

### Input
- `n`: number of spies
- `links`: list of directed edges

### Output
- `true` if the graph has a cycle, otherwise `false`.

### Examples
```
Input: n = 3, links = [[0,1],[1,2],[2,0]]
Output: true

Input: n = 3, links = [[0,1],[1,2]]
Output: false
```

### Constraints
- `1 <= n <= 10^5`
- `0 <= u, v < n`
- Links list length ≤ 2·10^5.

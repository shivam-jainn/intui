# Graph Story Problems

> **Note:** the first two problems have been extracted into their own question folders (`lost-kingdoms` and `secret-network`).

## 1. The Lost Kingdoms (Graph Traversal - DFS/BFS)

### Story
The Kingdom of Eldoria is divided into several regions connected by roads. A messenger needs to deliver a letter to all regions starting from the capital. Some roads are blocked due to a storm. Can the messenger reach every region?

### Problem
You are given `n` regions numbered from 0 to `n-1` and a list of `roads` where each road is a pair `[u, v]` indicating a bidirectional connection between region `u` and region `v`. The capital is region `0`. Determine whether all regions are reachable from the capital.

### Input
- `n`: integer, number of regions
- `roads`: list of pairs representing roads

### Output
- `true` if every region can be reached from 0, otherwise `false`.

### Python Solution
```python
from collections import deque

def can_reach_all(n, roads):
    adj = [[] for _ in range(n)]
    for u, v in roads:
        adj[u].append(v)
        adj[v].append(u)
    seen = [False] * n
    dq = deque([0])
    seen[0] = True
    while dq:
        u = dq.popleft()
        for w in adj[u]:
            if not seen[w]:
                seen[w] = True
                dq.append(w)
    return all(seen)

# example
print(can_reach_all(5, [[0,1],[1,2],[2,3],[3,4]]))  # true
print(can_reach_all(5, [[0,1],[2,3]]))  # false
``` 

### C++ Solution
```cpp
#include <vector>
#include <queue>
using namespace std;

bool canReachAll(int n, const vector<pair<int,int>>& roads) {
    vector<vector<int>> adj(n);
    for (auto &r : roads) {
        adj[r.first].push_back(r.second);
        adj[r.second].push_back(r.first);
    }
    vector<bool> seen(n,false);
    queue<int> q;
    q.push(0);
    seen[0] = true;
    while(!q.empty()){
        int u = q.front(); q.pop();
        for(int v : adj[u]){
            if(!seen[v]){
                seen[v] = true;
                q.push(v);
            }
        }
    }
    for(bool b: seen) if(!b) return false;
    return true;
}

// example usage
#include <iostream>
int main(){
    vector<pair<int,int>> roads{{0,1},{1,2},{2,3},{3,4}};
    cout << canReachAll(5, roads) << "\n"; // 1
    roads = {{0,1},{2,3}};
    cout << canReachAll(5, roads) << "\n"; // 0
    return 0;
}
```

---

## 2. The Secret Network (Cycle Detection)

### Story
A group of spies has created a secret communication network. Each spy communicates with another through a direct channel. However, the network must not have any loops to avoid detection. Help the agency check if the network contains any cycles.

### Problem
Given `n` spies numbered 0 to `n-1` and a list of directed communication links `links` where each link is a pair `[u, v]` indicating that spy `u` can send messages to spy `v`. Determine if there is any cycle in the directed graph.

### Input
- `n`: number of spies
- `links`: list of directed edges

### Output
- `true` if the graph has a cycle, otherwise `false`.

### Python Solution
```python
from typing import List

def has_cycle(n: int, links: List[List[int]]) -> bool:
    adj = [[] for _ in range(n)]
    for u, v in links:
        adj[u].append(v)
    visited = [0] * n  # 0=unvisited,1=visiting,2=done

    def dfs(u):
        if visited[u] == 1:
            return True
        if visited[u] == 2:
            return False
        visited[u] = 1
        for v in adj[u]:
            if dfs(v):
                return True
        visited[u] = 2
        return False

    for i in range(n):
        if visited[i] == 0 and dfs(i):
            return True
    return False

# examples
print(has_cycle(3, [[0,1],[1,2],[2,0]]))  # true
print(has_cycle(3, [[0,1],[1,2]]))  # false
```

### C++ Solution
```cpp
#include <vector>
using namespace std;

bool dfs(int u, const vector<vector<int>>& adj, vector<int>& state) {
    if(state[u] == 1) return true;
    if(state[u] == 2) return false;
    state[u] = 1;
    for(int v : adj[u]) {
        if(dfs(v, adj, state)) return true;
    }
    state[u] = 2;
    return false;
}

bool hasCycle(int n, const vector<pair<int,int>>& links) {
    vector<vector<int>> adj(n);
    for(auto &p : links) adj[p.first].push_back(p.second);
    vector<int> state(n,0);
    for(int i=0;i<n;i++){
        if(state[i]==0 && dfs(i,adj,state)) return true;
    }
    return false;
}

#include <iostream>
int main(){
    vector<pair<int,int>> links{{0,1},{1,2},{2,0}};
    cout<<hasCycle(3, links)<<"\n"; // 1
    links = {{0,1},{1,2}};
    cout<<hasCycle(3, links)<<"\n"; // 0
    return 0;
}
```
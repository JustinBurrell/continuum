// =============================================================================
// seed-data.js — All static content for the demo seed script
// =============================================================================

// ─── SECTION 3: Justin's Notes (25 total) ───────────────────────────────────

const justinNotes = [
  // --- INDEX 0 ---
  {
    title: 'Dynamic Programming: From Recursion to Optimization',
    type: 'lecture',
    tags: ['algorithms', 'dynamic-programming', 'cs211'],
    subject: 'CS 211 — Data Structures & Algorithms',
    visibility: 'friends',
    isPinned: false,
    content: `# Dynamic Programming: From Recursion to Optimization

## What is Dynamic Programming?

Dynamic programming (DP) is an algorithmic technique that solves complex problems by breaking them down into simpler overlapping subproblems and storing their solutions to avoid redundant computation. The term was coined by Richard Bellman in the 1950s, and it remains one of the most powerful tools in algorithm design.

DP applies when a problem exhibits two key properties:

1. **Optimal Substructure** — an optimal solution to the problem contains optimal solutions to its subproblems.
2. **Overlapping Subproblems** — the same subproblems are solved multiple times during a naive recursive approach.

## Recursive Approach: The Starting Point

Consider the classic Fibonacci sequence: F(n) = F(n-1) + F(n-2). A direct recursive implementation looks clean but has exponential time complexity O(2^n) because it recomputes the same values over and over.

\`\`\`
fib(5) calls fib(4) + fib(3)
fib(4) calls fib(3) + fib(2)
fib(3) calls fib(2) + fib(1)  <-- repeated
\`\`\`

The call tree grows exponentially, and we end up solving fib(2) three separate times, fib(1) five times, and so on. This is the hallmark of overlapping subproblems.

## Top-Down: Memoization

Memoization adds a cache to the recursive approach. Before computing a subproblem, check if the answer is already stored. If it is, return it immediately. If not, compute it, store it, then return it.

\`\`\`python
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n-1, memo) + fib_memo(n-2, memo)
    return memo[n]
\`\`\`

This reduces the time complexity from O(2^n) to O(n) because each subproblem is solved exactly once. Space complexity is O(n) for the memo table plus O(n) for the call stack.

## Bottom-Up: Tabulation

Tabulation flips the approach: instead of starting from the top and recursing down, we start from the base cases and build up. We fill a table iteratively, so there is no recursion overhead.

\`\`\`python
def fib_tab(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]
\`\`\`

Time complexity is O(n) and space is O(n), but we eliminate the call stack overhead. We can even optimize space to O(1) by only keeping the last two values.

## Classic DP Problems

### Coin Change
Given denominations and a target amount, find the minimum number of coins needed. State: dp[i] = minimum coins to make amount i. Transition: dp[i] = min(dp[i - coin] + 1) for each coin denomination.

### Longest Common Subsequence (LCS)
Given two strings, find the longest subsequence common to both. Build a 2D table where dp[i][j] represents the LCS of the first i characters of string A and first j characters of string B.

### 0/1 Knapsack
Given items with weights and values, maximize value without exceeding a weight limit. dp[i][w] = maximum value using first i items with capacity w.

## When to Use DP

Ask yourself: can I define the solution in terms of smaller instances of the same problem? Are there repeated subproblems? If yes to both, DP is likely the right approach. Start with the recursive solution, identify the state, add memoization, and then optionally convert to tabulation for better constant factors.

## Key Takeaways

- DP is not a single algorithm but a problem-solving paradigm
- Memoization (top-down) is easier to implement; tabulation (bottom-up) is often faster in practice
- Identifying the state and transition is the hardest part
- Practice on classic problems: Fibonacci, coin change, LCS, knapsack, edit distance, matrix chain multiplication`,
  },

  // --- INDEX 1 ---
  {
    title: 'OS Process Scheduling Algorithms (FCFS, SJF, Round Robin, Priority)',
    type: 'lecture',
    tags: ['operating-systems', 'scheduling', 'cs301'],
    subject: 'CS 301 — Operating Systems',
    visibility: 'specific',
    isPinned: false,
    content: `# OS Process Scheduling Algorithms

## Why Scheduling Matters

The CPU is a shared resource. When multiple processes are ready to run, the operating system must decide which one gets the CPU next. The scheduling algorithm directly impacts system throughput, response time, fairness, and resource utilization. A poor scheduler can starve processes, waste CPU cycles, or make interactive applications feel sluggish.

## First-Come, First-Served (FCFS)

FCFS is the simplest scheduling algorithm. Processes are executed in the order they arrive in the ready queue. It is non-preemptive — once a process starts, it runs to completion.

**Advantages**: Simple to implement, no starvation.
**Disadvantages**: Convoy effect — short processes get stuck behind long ones, leading to high average waiting time.

Example: if processes arrive with burst times [24, 3, 3], the average waiting time is (0 + 24 + 27) / 3 = 17. Reorder them as [3, 3, 24] and the average drops to (0 + 3 + 6) / 3 = 3. Order matters enormously.

## Shortest Job First (SJF)

SJF selects the process with the smallest burst time next. It can be non-preemptive (once started, runs to completion) or preemptive (Shortest Remaining Time First — SRTF).

SJF is provably optimal for minimizing average waiting time among non-preemptive algorithms. The challenge is that we rarely know burst times in advance. The OS typically uses exponential averaging of past burst times to predict the next one:

\`\`\`
predicted_next = alpha * actual_last + (1 - alpha) * predicted_last
\`\`\`

where alpha is typically 0.5.

**Problem**: SJF can starve long processes indefinitely if short processes keep arriving.

## Round Robin (RR)

Round Robin assigns each process a fixed time quantum (e.g., 10-100ms). Processes cycle through the ready queue, each getting at most one quantum before being preempted and sent to the back of the queue.

**Key design decision**: quantum size.
- Too small: excessive context switching overhead dominates
- Too large: degenerates into FCFS
- Rule of thumb: 80% of CPU bursts should complete within one quantum

Round Robin is fair and responsive, making it the foundation of most modern interactive schedulers. Average turnaround time is generally higher than SJF, but response time is much better.

## Priority Scheduling

Each process is assigned a priority. The scheduler always picks the highest-priority process. Priorities can be static (assigned at creation) or dynamic (adjusted over time).

**Major problem**: starvation of low-priority processes. Solution: aging — gradually increase the priority of waiting processes.

Modern systems often combine priority scheduling with Round Robin: processes at the same priority level are scheduled round-robin.

## Multilevel Feedback Queue (MLFQ)

MLFQ is the most sophisticated and widely used scheduler in practice. It uses multiple queues with different priority levels:

1. New processes enter the highest-priority queue
2. If a process uses its full quantum, it drops to a lower-priority queue
3. If a process gives up the CPU before its quantum expires (I/O), it stays at the same level or moves up
4. Periodically boost all processes to the highest queue to prevent starvation

This approach automatically adapts: interactive processes (short CPU bursts) stay in high-priority queues, while CPU-bound processes sink to lower queues where they get longer quanta.

## Evaluation Criteria

| Criterion | FCFS | SJF | RR | Priority |
|-----------|------|-----|-----|----------|
| Throughput | Medium | High | Medium | Varies |
| Waiting Time | High | Optimal | Medium | Varies |
| Response Time | High | Varies | Low | Varies |
| Fairness | Yes | No (starvation) | Yes | No (starvation) |
| Overhead | Low | Medium | High | Medium |

## Key Takeaways

- No single algorithm is best for all scenarios
- Real systems use hybrid approaches (MLFQ)
- The quantum size in RR is a critical tuning parameter
- Starvation is the primary concern with SJF and Priority scheduling`,
  },

  // --- INDEX 2 ---
  {
    title: 'Computer Networks: TCP/IP Stack and HTTP',
    type: 'lecture',
    tags: ['networking', 'tcp-ip', 'cs350'],
    subject: 'CS 350 — Computer Networks',
    visibility: 'specific',
    isPinned: false,
    content: `# Computer Networks: TCP/IP Stack and HTTP

## The TCP/IP Model

The TCP/IP model organizes network communication into four layers, each with a distinct responsibility:

1. **Link Layer** — handles physical transmission over a single hop (Ethernet, Wi-Fi)
2. **Internet Layer** — routes packets across networks (IP, ICMP)
3. **Transport Layer** — provides end-to-end communication (TCP, UDP)
4. **Application Layer** — user-facing protocols (HTTP, DNS, SMTP)

Each layer adds a header to the data (encapsulation) on the sending side and strips it on the receiving side (decapsulation). This layered design allows each layer to evolve independently.

## IP: The Internet Protocol

IP is responsible for addressing and routing. Every device gets an IP address (IPv4: 32-bit, IPv6: 128-bit). IP is connectionless and unreliable — it makes a best-effort attempt to deliver packets but provides no guarantees about order, duplication, or delivery.

Key concepts:
- **Subnetting**: dividing a network into smaller ranges using subnet masks
- **NAT**: translating private addresses (192.168.x.x) to public addresses
- **TTL**: each packet has a time-to-live counter decremented at each hop to prevent infinite loops

## TCP: Transmission Control Protocol

TCP provides reliable, ordered, byte-stream delivery on top of IP. It is connection-oriented, meaning a connection must be established before data flows.

### Three-Way Handshake
1. Client sends SYN (synchronize sequence number)
2. Server responds with SYN-ACK (acknowledge + its own sequence number)
3. Client sends ACK — connection established

### Reliability Mechanisms
- **Sequence numbers** track byte position in the stream
- **Acknowledgments** confirm receipt; if an ACK is not received within a timeout, the segment is retransmitted
- **Checksums** detect corruption
- **Flow control** uses a sliding window to prevent the sender from overwhelming the receiver
- **Congestion control** (slow start, congestion avoidance, fast retransmit) prevents the sender from overwhelming the network

### Connection Teardown
Either side can initiate with a FIN. The four-way teardown: FIN, ACK, FIN, ACK. The TIME_WAIT state ensures all delayed segments are handled before the port is reused.

## UDP: User Datagram Protocol

UDP is connectionless and unreliable — no handshake, no acknowledgments, no ordering. It adds minimal overhead (8-byte header vs TCP's 20-byte header). Used for applications where speed matters more than reliability: DNS queries, video streaming, online gaming, VoIP.

## HTTP: HyperText Transfer Protocol

HTTP is an application-layer protocol for fetching web resources. It follows a request-response model: the client sends a request, the server sends a response.

### HTTP/1.1
- Persistent connections (keep-alive) — reuse TCP connections for multiple requests
- Chunked transfer encoding for streaming
- Head-of-line blocking: requests on the same connection are processed sequentially

### HTTP/2
- Binary framing instead of text
- Multiplexing: multiple requests and responses interleaved on a single TCP connection
- Header compression (HPACK) reduces overhead
- Server push: server can proactively send resources

### HTTP/3
- Runs over QUIC (UDP-based) instead of TCP
- Eliminates TCP head-of-line blocking at the transport layer
- Built-in TLS 1.3 — faster handshakes (0-RTT resumption)
- Better performance on unreliable networks (mobile, Wi-Fi)

## TLS: Transport Layer Security

TLS encrypts HTTP traffic (HTTPS). The TLS handshake establishes a shared secret using asymmetric cryptography, then switches to symmetric encryption for the session.

TLS 1.3 streamlined the handshake from two round trips to one (or zero with 0-RTT resumption), removed weak cipher suites, and mandated forward secrecy.

## DNS: Domain Name System

DNS translates human-readable domain names to IP addresses. The resolution process follows a hierarchy: root servers, TLD servers (.com, .org), authoritative servers. Results are cached at multiple levels (browser, OS, ISP resolver) with TTL values.

## Key Takeaways

- TCP provides reliability at the cost of latency; UDP trades reliability for speed
- HTTP has evolved significantly: HTTP/1.1 -> HTTP/2 (multiplexing) -> HTTP/3 (QUIC)
- TLS is essential for security and is now effectively mandatory on the modern web
- Understanding the layered model helps debug network issues systematically`,
  },

  // --- INDEX 3 ---
  {
    title: 'Database Systems: Indexing, Query Optimization, and Transactions',
    type: 'lecture',
    tags: ['databases', 'sql', 'cs340'],
    subject: 'CS 340 — Database Systems',
    visibility: 'private',
    isPinned: false,
    content: `# Database Systems: Indexing, Query Optimization, and Transactions

## Indexing

An index is a data structure that speeds up data retrieval at the cost of additional storage and slower writes. Without an index, the database must perform a full table scan — reading every row to find matches.

### B+ Trees

B+ trees are the most common index structure in relational databases. They are balanced trees where:
- Internal nodes store keys and pointers to child nodes
- Leaf nodes store keys and pointers to actual data rows
- Leaf nodes are linked together for efficient range queries
- Typical fan-out of 100-200 means 3-4 levels can index millions of rows

A lookup in a B+ tree with N rows requires O(log_b(N)) I/O operations, where b is the branching factor. For a table with 10 million rows and branching factor 200, that is about 3 disk reads — compared to potentially millions for a full scan.

### Hash Indexes

Hash indexes use a hash function to map keys to bucket locations. They excel at exact-match lookups (O(1) average) but cannot support range queries or ordering. Most useful for equality predicates in WHERE clauses.

### Index Types
- **Primary index**: built on the primary key, determines physical row order (clustered)
- **Secondary index**: built on non-key columns, points to row locations
- **Composite index**: spans multiple columns — column order matters for query matching
- **Covering index**: includes all columns needed by a query, eliminating the need to fetch the actual row

### When to Index
Index columns that appear in WHERE, JOIN, ORDER BY, and GROUP BY clauses. Avoid indexing columns with low cardinality (few distinct values) or tables with heavy write workloads where index maintenance overhead dominates.

## Query Optimization

The query optimizer transforms a SQL query into an efficient execution plan. It considers multiple equivalent plans and estimates the cost of each.

### Logical Optimization
- Predicate pushdown: apply WHERE filters as early as possible
- Projection pushdown: only fetch needed columns
- Join reordering: process smaller tables first to reduce intermediate result sizes

### Physical Optimization
- Choose between index scan, sequential scan, or bitmap scan
- Select join algorithms: nested loop, hash join, sort-merge join
- Decide on parallelism and pipelining

### Cost Estimation
The optimizer estimates costs using table statistics: row counts, column cardinality, value distribution histograms, and index selectivity. Stale statistics lead to poor plans — run ANALYZE regularly.

### EXPLAIN
Use EXPLAIN (or EXPLAIN ANALYZE for actual execution stats) to understand query plans. Look for sequential scans on large tables, nested loop joins with large inputs, and high estimated row counts at each stage.

## Transactions and ACID

A transaction is a sequence of operations treated as a single logical unit. Transactions provide four guarantees (ACID):

### Atomicity
All operations in a transaction either complete successfully or none of them take effect. If any step fails, the entire transaction is rolled back. Implemented via write-ahead logging (WAL): changes are logged before being applied, and the log is used to undo incomplete transactions on crash recovery.

### Consistency
A transaction brings the database from one valid state to another. All integrity constraints, foreign keys, and check constraints are satisfied after the transaction commits.

### Isolation
Concurrent transactions do not interfere with each other. The database provides the illusion that each transaction runs in isolation, even when many run concurrently.

#### Isolation Levels
- **Read Uncommitted**: can see uncommitted changes (dirty reads)
- **Read Committed**: only sees committed data, but may see different results on re-read (non-repeatable reads)
- **Repeatable Read**: same query returns same results within a transaction, but phantom rows can appear
- **Serializable**: full isolation, equivalent to serial execution (highest overhead)

### Durability
Once a transaction commits, its changes survive system crashes. Guaranteed by flushing the WAL to disk before acknowledging the commit.

## Concurrency Control

### Locking
Two-phase locking (2PL): acquire all locks before releasing any. Prevents most anomalies but can cause deadlocks. Deadlock detection uses wait-for graphs; resolution involves aborting one transaction.

### MVCC (Multi-Version Concurrency Control)
Instead of locking, maintain multiple versions of each row. Readers see a consistent snapshot without blocking writers. Used by PostgreSQL, MySQL InnoDB, and Oracle. Provides better concurrency than locking for read-heavy workloads.

## Key Takeaways

- Indexing is the single most impactful tool for query performance
- The query optimizer relies on accurate statistics — keep them updated
- Choose the right isolation level: higher isolation means more overhead
- MVCC enables high concurrency by allowing readers and writers to operate without blocking each other`,
  },

  // --- INDEX 4 ---
  {
    title: 'Compilers: Lexing, Parsing, and Semantic Analysis',
    type: 'lecture',
    tags: ['compilers', 'parsing', 'cs320'],
    subject: 'CS 320 — Compilers',
    visibility: 'private',
    isPinned: false,
    content: `# Compilers: Lexing, Parsing, and Semantic Analysis

## Overview of Compilation

A compiler translates source code written in a high-level language into machine code (or an intermediate representation) that a computer can execute. The compilation process is divided into several phases, each transforming the program into a progressively lower-level representation.

The front end (lexing, parsing, semantic analysis) is language-dependent. The back end (optimization, code generation) is machine-dependent. An intermediate representation (IR) bridges the two, allowing the same front end to target multiple architectures and the same back end to support multiple languages.

## Phase 1: Lexical Analysis (Lexing)

The lexer (also called a scanner or tokenizer) reads the raw character stream and groups characters into tokens — the smallest meaningful units of the language.

### Token Types
- **Keywords**: if, while, return, class
- **Identifiers**: variable names, function names
- **Literals**: numbers (42), strings ("hello"), booleans (true)
- **Operators**: +, -, *, ==, &&
- **Delimiters**: (, ), {, }, ;, ,
- **Whitespace and comments**: typically discarded

### Implementation
Lexers are typically implemented as finite automata (DFAs). Each state represents partial progress through a token pattern. Regular expressions define the patterns for each token type, and tools like Flex or hand-written state machines convert them to DFAs.

\`\`\`
Input: "int x = 42;"
Tokens: [KEYWORD:int] [IDENT:x] [OP:=] [INT_LIT:42] [DELIM:;]
\`\`\`

### Error Handling
When the lexer encounters an unexpected character, it can: report an error and stop, skip the character and continue (error recovery), or insert a token it thinks was intended.

## Phase 2: Parsing (Syntax Analysis)

The parser takes the token stream and builds an Abstract Syntax Tree (AST) according to the language's grammar. The grammar is typically specified as a context-free grammar (CFG) in Backus-Naur Form (BNF).

### Top-Down Parsing (LL)
- Starts from the start symbol and tries to derive the input
- Recursive descent: each non-terminal becomes a function
- LL(1): uses one token of lookahead to decide which production to apply
- Cannot handle left-recursive grammars directly — must be transformed

### Bottom-Up Parsing (LR)
- Starts from the input tokens and reduces them to the start symbol
- More powerful than LL: can handle a larger class of grammars
- LR(0), SLR, LALR(1), CLR(1) — increasing power and table size
- LALR(1) is the sweet spot (used by Yacc/Bison)
- Uses shift-reduce actions: shift tokens onto a stack, reduce when a complete production is recognized

### AST Construction
The parser builds an AST that captures the hierarchical structure of the program while discarding syntactic sugar (parentheses, semicolons). Each node represents a construct: function declarations, if statements, binary expressions, variable references.

## Phase 3: Semantic Analysis

The semantic analyzer traverses the AST to enforce rules that cannot be expressed in the grammar. This includes:

### Type Checking
- Verify operand types match operators (cannot add string + int unless coercion is defined)
- Check function call argument types against parameter types
- Ensure return types match function declarations
- Handle implicit type conversions and generic types

### Symbol Tables
A symbol table maps identifiers to their declarations (type, scope, memory location). The semantic analyzer builds and queries symbol tables as it traverses the AST. Scoping rules determine visibility: block scope, function scope, global scope. Nested scopes form a stack — inner scopes can shadow outer ones.

### Other Checks
- Variables must be declared before use
- Functions must be defined (or at least declared) before calling
- Break and continue only appear inside loops
- Access modifiers (public, private) are respected
- Constant variables are not reassigned

## Beyond the Front End

After semantic analysis, the compiler emits an intermediate representation (IR) such as three-address code or SSA form. The optimizer transforms the IR to improve performance (constant folding, dead code elimination, loop unrolling, inlining). Finally, the code generator maps the optimized IR to target machine instructions, performing register allocation and instruction selection.

## Key Takeaways

- Lexing converts characters to tokens using finite automata
- Parsing converts tokens to an AST using context-free grammars
- Semantic analysis enforces type rules and scoping using symbol tables
- The front end is language-specific; the back end is architecture-specific
- Tools like Flex (lexing) and Bison (parsing) automate much of the front end`,
  },

  // --- INDEX 5 ---
  {
    title: 'Neural Networks & Deep Learning: Architecture Overview',
    type: 'research',
    tags: ['machine-learning', 'neural-networks', 'deep-learning'],
    subject: 'Research',
    visibility: 'friends',
    isPinned: false,
    content: `# Neural Networks & Deep Learning: Architecture Overview

## Biological Inspiration

Artificial neural networks are loosely inspired by biological neurons. A biological neuron receives signals through dendrites, processes them in the cell body, and transmits output through the axon. Similarly, an artificial neuron takes weighted inputs, applies an activation function, and produces an output. The analogy is useful for intuition but the math is what matters.

## The Perceptron

The perceptron is the simplest neural network — a single neuron. It computes a weighted sum of inputs, adds a bias, and passes the result through a step function:

\`\`\`
output = step(w1*x1 + w2*x2 + ... + wn*xn + b)
\`\`\`

A single perceptron can learn linearly separable functions (AND, OR) but famously cannot learn XOR. This limitation motivated the development of multi-layer networks.

## Feedforward Neural Networks

A feedforward network consists of an input layer, one or more hidden layers, and an output layer. Each layer is fully connected to the next. Data flows in one direction — forward from input to output.

### Activation Functions
The activation function introduces non-linearity, which is essential for learning complex patterns:
- **Sigmoid**: σ(x) = 1/(1+e^(-x)) — maps to (0,1), suffers from vanishing gradients
- **Tanh**: maps to (-1,1), zero-centered but still has vanishing gradient issues
- **ReLU**: max(0, x) — simple, efficient, avoids vanishing gradients but can "die" (output stuck at 0)
- **Leaky ReLU**: max(αx, x) where α is small — prevents dead neurons
- **GELU**: used in transformers, smoother approximation of ReLU

### Universal Approximation Theorem
A feedforward network with a single hidden layer and a non-linear activation function can approximate any continuous function to arbitrary precision, given enough neurons. In practice, deeper networks (more layers) learn hierarchical features more efficiently than shallow wide ones.

## Backpropagation and Gradient Descent

Training a neural network means finding weights that minimize a loss function (e.g., cross-entropy for classification, MSE for regression). Backpropagation computes the gradient of the loss with respect to each weight by applying the chain rule through the network layers.

### Gradient Descent Variants
- **Batch GD**: compute gradient on entire dataset — stable but slow
- **Stochastic GD (SGD)**: compute gradient on one sample — noisy but fast
- **Mini-batch GD**: compute gradient on a small batch (32-256) — best of both worlds
- **Adam**: adaptive learning rates per parameter, combines momentum and RMSProp — most commonly used

### Training Challenges
- **Vanishing gradients**: gradients shrink exponentially in deep networks (solved by ReLU, skip connections)
- **Exploding gradients**: gradients grow exponentially (solved by gradient clipping)
- **Overfitting**: model memorizes training data (solved by dropout, regularization, data augmentation)

## Convolutional Neural Networks (CNNs)

CNNs are designed for grid-like data (images). Key components:
- **Convolutional layers**: learn local spatial patterns using filters that slide across the input
- **Pooling layers**: downsample feature maps (max pooling, average pooling)
- **Feature hierarchy**: early layers detect edges, middle layers detect textures, deep layers detect objects

Architectures: LeNet (1998) → AlexNet (2012) → VGG → ResNet (2015, introduced skip connections) → EfficientNet.

## Recurrent Neural Networks (RNNs)

RNNs process sequential data by maintaining a hidden state that carries information across time steps. Vanilla RNNs suffer from vanishing gradients on long sequences.

**LSTM** (Long Short-Term Memory) solves this with gates (forget, input, output) that control information flow. **GRU** (Gated Recurrent Unit) is a simplified variant with fewer parameters.

## Transformers

Transformers replaced RNNs for most sequence tasks. Key innovation: **self-attention** allows every token to attend to every other token in parallel, eliminating the sequential bottleneck of RNNs.

Components: multi-head attention, positional encoding, layer normalization, feedforward layers. BERT (encoder-only) for understanding, GPT (decoder-only) for generation.

## Key Takeaways

- Neural networks are universal function approximators
- Depth enables hierarchical feature learning
- CNNs exploit spatial structure; RNNs and transformers exploit sequential structure
- Adam optimizer and batch normalization are standard practices
- Transformers have become the dominant architecture for NLP and increasingly for vision`,
  },

  // --- INDEX 6 ---
  {
    title: 'Distributed Systems: CAP Theorem and Consistency Models',
    type: 'research',
    tags: ['distributed-systems', 'cap-theorem'],
    subject: 'Research',
    visibility: 'friends',
    isPinned: false,
    content: `# Distributed Systems: CAP Theorem and Consistency Models

## What Makes Distributed Systems Hard?

A distributed system is a collection of independent computers that appears to its users as a single coherent system. The fundamental challenges arise from three realities: network communication is unreliable, nodes can fail independently, and there is no global clock. These constraints force designers to make difficult trade-offs between correctness, performance, and availability.

## The CAP Theorem

The CAP theorem, formulated by Eric Brewer in 2000 and proven by Gilbert and Lynch in 2002, states that a distributed data store can provide at most two of three guarantees simultaneously:

1. **Consistency (C)** — every read receives the most recent write or an error
2. **Availability (A)** — every request receives a non-error response (but not necessarily the most recent data)
3. **Partition Tolerance (P)** — the system continues to operate despite network partitions between nodes

Since network partitions are inevitable in practice, the real choice is between consistency (CP) and availability (AP) during a partition.

### CP Systems
When a partition occurs, a CP system may refuse to respond (sacrificing availability) to guarantee consistency. Examples: HBase, MongoDB (with majority read concern), Zookeeper. Bank account balances, inventory counts, and anything where stale data could cause real harm.

### AP Systems
When a partition occurs, an AP system continues to serve requests (maintaining availability) but may return stale data. Examples: Cassandra, DynamoDB, CouchDB. Social media feeds, analytics dashboards, and use cases where eventual consistency is acceptable.

## Consistency Models

Consistency models define the rules for what values a read can return in a distributed system. They form a spectrum from strict to relaxed.

### Strong Consistency (Linearizability)
Every operation appears to take effect instantaneously at some point between its invocation and completion. Reads always return the latest write. This is the strongest model but the most expensive — it requires coordination between nodes on every operation.

### Sequential Consistency
Operations from all nodes appear in some total order, and operations from each individual node appear in the order they were issued. Weaker than linearizability because the total order does not need to respect real-time ordering.

### Causal Consistency
If operation A causally precedes operation B (A happened before B and B could have been influenced by A), then all nodes see A before B. Operations that are not causally related can be seen in different orders by different nodes. Captures the most important real-world ordering constraints while allowing more concurrency.

### Eventual Consistency
If no new writes are made to a data item, all replicas will eventually converge to the same value. No guarantees about how long convergence takes or what values reads return in the interim. The weakest useful model but allows the highest availability and lowest latency.

## Consensus Protocols

To achieve strong consistency, distributed systems use consensus protocols that allow nodes to agree on a value despite failures.

### Paxos
Proposed by Lamport in 1989. Nodes take on roles (proposer, acceptor, learner). A value is chosen when a majority of acceptors agree. Paxos is notoriously difficult to understand and implement correctly, but it is provably correct.

### Raft
Designed by Ongaro and Ousterhout in 2014 as an understandable alternative to Paxos. Divides consensus into three sub-problems: leader election, log replication, and safety. One node is elected leader and handles all client requests. The leader replicates log entries to followers and commits them when a majority acknowledge.

Raft is the consensus algorithm we are using in our distributed key-value store project, which makes it directly relevant.

## Real-World Systems

| System | Model | Trade-off |
|--------|-------|-----------|
| Google Spanner | Strong (linearizable) | Uses TrueTime (atomic clocks) for global ordering |
| Amazon DynamoDB | Eventual (or strong per-request) | Configurable per-read |
| Apache Cassandra | Tunable | Quorum reads/writes for stronger guarantees |
| etcd | Strong (Raft-based) | CP system, used for configuration |

## Key Takeaways

- The CAP theorem forces a choice between consistency and availability during partitions
- Most real systems are not purely CP or AP — they offer tunable consistency
- Raft is the most practical consensus protocol for new systems
- Choose the weakest consistency model that satisfies your application requirements`,
  },

  // --- INDEX 7 ---
  {
    title: 'Cryptography: Public Key Infrastructure and TLS',
    type: 'research',
    tags: ['cryptography', 'security', 'tls'],
    subject: 'Research',
    visibility: 'private',
    isPinned: false,
    content: `# Cryptography: Public Key Infrastructure and TLS

## Symmetric vs Asymmetric Cryptography

Cryptography is the science of securing communication in the presence of adversaries. There are two fundamental approaches.

**Symmetric cryptography** uses the same key for encryption and decryption. Both parties must share the key through a secure channel beforehand. Algorithms include AES (Advanced Encryption Standard), which operates on 128-bit blocks with key sizes of 128, 192, or 256 bits. AES-256 is considered secure against all known attacks, including quantum computers with Grover's algorithm (which would halve the effective key length, reducing AES-256 to 128-bit equivalent security).

**Asymmetric cryptography** uses a key pair: a public key (shared freely) and a private key (kept secret). Data encrypted with the public key can only be decrypted with the private key, and vice versa. This solves the key distribution problem but is orders of magnitude slower than symmetric encryption.

## RSA

RSA (Rivest-Shamir-Adleman, 1977) is the most widely known asymmetric algorithm. Its security rests on the difficulty of factoring the product of two large primes.

Key generation:
1. Choose two large primes p and q
2. Compute n = p * q (the modulus)
3. Compute the totient φ(n) = (p-1)(q-1)
4. Choose public exponent e (commonly 65537)
5. Compute private exponent d such that e * d ≡ 1 (mod φ(n))

RSA key sizes of 2048 bits are currently standard; 4096 bits provide extra margin. RSA is used for key exchange and digital signatures but not for encrypting bulk data (too slow).

## Elliptic Curve Cryptography (ECC)

ECC achieves equivalent security to RSA with much smaller key sizes. A 256-bit ECC key provides roughly the same security as a 3072-bit RSA key. This makes ECC faster and more efficient, especially on mobile devices and constrained environments.

The most common curves: P-256 (NIST), Curve25519 (Daniel Bernstein — used in modern protocols). The security of ECC relies on the difficulty of the elliptic curve discrete logarithm problem (ECDLP).

## Digital Signatures

Digital signatures provide authentication, integrity, and non-repudiation. The signer hashes the message and encrypts the hash with their private key. Anyone can verify the signature using the signer's public key.

Common schemes: RSA-PSS, ECDSA (Elliptic Curve Digital Signature Algorithm), EdDSA (Ed25519 — fast, deterministic, resistant to side-channel attacks).

## Public Key Infrastructure (PKI)

PKI is the framework that binds public keys to identities through digital certificates issued by trusted Certificate Authorities (CAs).

### Certificate Chain of Trust
1. **Root CA**: self-signed certificate, pre-installed in browsers/OS
2. **Intermediate CA**: signed by the root CA, issues end-entity certificates
3. **End-entity certificate**: the server's certificate, signed by an intermediate CA

When a browser connects to a server, it verifies the certificate chain: the server's cert is signed by an intermediate CA, which is signed by a trusted root CA. If any link is broken or untrusted, the connection is rejected.

### Certificate Contents (X.509)
- Subject (domain name, organization)
- Issuer (the CA that signed it)
- Public key
- Validity period (not before / not after)
- Signature algorithm and value
- Extensions (Subject Alternative Names, Key Usage)

### Certificate Revocation
If a private key is compromised, the certificate must be revoked. Two mechanisms:
- **CRL** (Certificate Revocation List): CA publishes a list of revoked serial numbers — large, slow to check
- **OCSP** (Online Certificate Status Protocol): real-time check with the CA — faster but adds latency

## TLS: Transport Layer Security

TLS is the protocol that provides encrypted communication over the internet. HTTPS is HTTP over TLS.

### TLS 1.3 Handshake (simplified)
1. Client sends ClientHello (supported cipher suites, random value, key share)
2. Server sends ServerHello (chosen cipher suite, random value, key share) + encrypted certificate + Finished
3. Client verifies certificate, sends Finished
4. Symmetric encryption begins using the derived session key

The handshake completes in one round trip (1-RTT). With 0-RTT resumption, returning clients can send data immediately using a pre-shared key from a previous session.

### Forward Secrecy
TLS 1.3 mandates forward secrecy through ephemeral Diffie-Hellman key exchange. Even if the server's private key is later compromised, past sessions cannot be decrypted because each session used a unique ephemeral key that was discarded.

## Key Takeaways

- Symmetric encryption (AES) is fast but requires shared keys; asymmetric encryption (RSA, ECC) solves key distribution
- PKI and certificate chains are the foundation of trust on the internet
- TLS 1.3 is faster, simpler, and more secure than its predecessors
- Forward secrecy protects past communications even if keys are compromised later`,
  },

  // --- INDEX 8 ---
  {
    title: 'Quantum Computing: Qubits, Superposition, and Grover\'s Algorithm',
    type: 'research',
    tags: ['quantum-computing', 'algorithms'],
    subject: 'Research',
    visibility: 'private',
    isPinned: false,
    content: `# Quantum Computing: Qubits, Superposition, and Grover's Algorithm

## Classical vs Quantum Bits

A classical bit can be in one of two states: 0 or 1. A qubit (quantum bit) can be in a superposition of both states simultaneously. Mathematically, a qubit's state is represented as:

|ψ⟩ = α|0⟩ + β|1⟩

where α and β are complex numbers called probability amplitudes, and |α|² + |β|² = 1. When measured, the qubit collapses to |0⟩ with probability |α|² or |1⟩ with probability |β|². The power of quantum computing comes from manipulating these amplitudes before measurement to make correct answers more probable.

## Superposition

Superposition allows a qubit to exist in a combination of states. With n qubits, you can represent 2^n states simultaneously. A system of 300 qubits can represent more states than there are atoms in the observable universe. However, you cannot simply read all these states — measurement collapses the superposition.

The Hadamard gate (H) creates superposition from a definite state:
H|0⟩ = (|0⟩ + |1⟩)/√2 — equal probability of measuring 0 or 1

Applying H to n qubits in the |0⟩ state creates an equal superposition of all 2^n possible bit strings, which is the starting point for many quantum algorithms.

## Entanglement

Entanglement is a uniquely quantum phenomenon where two or more qubits become correlated in ways that have no classical analog. When qubits are entangled, measuring one instantly determines the state of the other, regardless of physical distance.

The Bell state (created by a Hadamard gate followed by a CNOT gate) is the simplest entangled state:
|Φ+⟩ = (|00⟩ + |11⟩)/√2

Measuring the first qubit as 0 means the second is guaranteed to be 0, and measuring it as 1 guarantees the second is 1. This correlation is stronger than any classical correlation and is a key resource for quantum algorithms and quantum cryptography.

## Quantum Gates

Quantum computation is performed by applying quantum gates (unitary transformations) to qubits:
- **Pauli-X**: flips |0⟩ to |1⟩ and vice versa (quantum NOT)
- **Hadamard (H)**: creates superposition
- **CNOT**: controlled-NOT, flips target qubit if control qubit is |1⟩ — creates entanglement
- **Toffoli**: controlled-controlled-NOT, universal for classical computation
- **Phase gates (S, T)**: add phase shifts to the |1⟩ component

Quantum circuits are sequences of gates applied to qubits. Unlike classical circuits, quantum gates must be reversible (unitary), so there is no quantum analog of the classical AND gate (which loses information).

## Grover's Algorithm

Grover's algorithm (1996) solves the unstructured search problem: given a function f(x) that returns 1 for exactly one input x* out of N possibilities, find x*. Classically, this requires O(N) evaluations. Grover's algorithm finds x* in O(√N) evaluations — a quadratic speedup.

### How It Works

1. **Initialize**: put all n qubits into equal superposition using Hadamard gates — each of the N = 2^n states has amplitude 1/√N

2. **Oracle**: mark the target state by flipping its amplitude (multiply by -1). This is implemented as a quantum gate that recognizes the correct answer. The oracle does not reveal the answer directly but subtly tags it.

3. **Diffusion (Grover operator)**: amplify the amplitude of the marked state. This is done by reflecting all amplitudes about the mean amplitude. The marked state (which has negative amplitude) gets boosted above the mean, while all other states get slightly reduced.

4. **Repeat steps 2-3**: approximately √N times. After the optimal number of iterations, the marked state has an amplitude close to 1, and measuring yields the correct answer with high probability.

### Applications

- Database search: O(√N) instead of O(N)
- Cryptography: Grover's algorithm can brute-force a symmetric key in O(√(2^n)) = O(2^(n/2)) time, effectively halving the security of symmetric ciphers (hence why AES-256 is recommended for post-quantum security — it provides 128-bit equivalent security against Grover's)
- Optimization: finding minimum/maximum values in an unsorted list

## Shor's Algorithm (Brief)

Shor's algorithm (1994) can factor large integers in polynomial time, which would break RSA and other factoring-based cryptosystems. This is the primary motivation for post-quantum cryptography research. A quantum computer with enough stable qubits (estimated thousands to millions with error correction) could run Shor's algorithm practically.

## Current State of Quantum Computing

As of 2025, quantum computers have reached the "noisy intermediate-scale quantum" (NISQ) era. IBM, Google, and others have built processors with 100+ qubits, but error rates remain high. Quantum error correction requires many physical qubits per logical qubit. Practical quantum advantage for real-world problems is still years away, but the theoretical foundations are well established.

## Key Takeaways

- Qubits leverage superposition and entanglement to process information in fundamentally different ways than classical bits
- Grover's algorithm provides quadratic speedup for search problems
- Shor's algorithm threatens current public-key cryptography
- We are still in the early NISQ era — quantum computing is not yet practical for most problems`,
  },

  // --- INDEX 9 ---
  {
    title: 'Graph Algorithms: Dijkstra, Bellman-Ford, and A*',
    type: 'research',
    tags: ['algorithms', 'graphs', 'shortest-path'],
    subject: 'CS 211 — Data Structures & Algorithms',
    visibility: 'private',
    isPinned: false,
    content: `# Graph Algorithms: Dijkstra, Bellman-Ford, and A*

## Graph Representations

Before diving into algorithms, choose how to represent the graph:

**Adjacency List**: for each vertex, store a list of its neighbors and edge weights. Space: O(V + E). Best for sparse graphs (most real-world graphs).

**Adjacency Matrix**: V×V matrix where entry (i,j) holds the edge weight. Space: O(V²). Best for dense graphs or when you need O(1) edge existence checks.

Most shortest-path implementations use adjacency lists because real-world graphs (road networks, social graphs, web graphs) are sparse.

## Single-Source Shortest Path Problem

Given a graph G = (V, E) and a source vertex s, find the shortest path from s to every other vertex. The algorithms differ in their assumptions about edge weights and their time complexity.

## Dijkstra's Algorithm

Dijkstra's algorithm (1956) finds shortest paths from a single source to all other vertices in a graph with **non-negative** edge weights.

### Algorithm
1. Initialize: dist[s] = 0, dist[v] = ∞ for all other vertices. Add all vertices to a priority queue.
2. While the priority queue is not empty:
   a. Extract the vertex u with minimum dist[u]
   b. For each neighbor v of u:
      If dist[u] + weight(u, v) < dist[v]:
        Update dist[v] = dist[u] + weight(u, v)
        Set prev[v] = u (for path reconstruction)
        Decrease key of v in the priority queue

### Complexity
- With a binary heap: O((V + E) log V)
- With a Fibonacci heap: O(V log V + E) — theoretically faster for dense graphs
- In practice, binary heaps with lazy deletion are most common

### Why Non-Negative Weights?
Dijkstra's algorithm is greedy: once a vertex is extracted from the priority queue, its shortest distance is finalized. Negative edges can invalidate this invariant — a later edge could provide a shorter path to an already-finalized vertex.

## Bellman-Ford Algorithm

Bellman-Ford (1958) handles graphs with **negative edge weights** and can detect negative-weight cycles.

### Algorithm
1. Initialize: dist[s] = 0, dist[v] = ∞ for all other vertices
2. Repeat V-1 times:
   For each edge (u, v) with weight w:
     If dist[u] + w < dist[v]:
       Update dist[v] = dist[u] + w
3. Check for negative cycles: repeat step 2 one more time. If any distance decreases, a negative-weight cycle exists (and shortest paths are undefined for vertices reachable from the cycle).

### Complexity
O(V * E) — slower than Dijkstra but more general.

### When to Use
- When edges can have negative weights (e.g., currency exchange, where logarithmic representation creates negative edges)
- When you need to detect negative cycles (arbitrage detection in finance)
- As a component in other algorithms (e.g., Johnson's algorithm for all-pairs shortest path)

## A* Algorithm

A* (1968, Hart, Nilsson, Raphael) is an informed search algorithm that uses a heuristic to guide the search toward the goal. It finds the shortest path from source to a specific target vertex (not all vertices).

### Algorithm
A* maintains a priority queue ordered by f(v) = g(v) + h(v), where:
- g(v) = actual cost from source to v (like Dijkstra's dist)
- h(v) = heuristic estimate of cost from v to the goal

The heuristic must be **admissible** (never overestimates the true cost) and **consistent** (satisfies the triangle inequality: h(u) ≤ weight(u,v) + h(v)) for A* to find the optimal path.

### Common Heuristics
- **Euclidean distance**: straight-line distance to the goal — admissible for geometric graphs
- **Manhattan distance**: sum of horizontal and vertical distances — admissible for grid-based movement without diagonal movement
- **Haversine distance**: for geographic coordinates on a sphere

### Complexity
- Worst case: same as Dijkstra O((V + E) log V)
- Best case: much faster than Dijkstra because the heuristic prunes large portions of the search space
- The quality of the heuristic directly determines performance

### Comparison

| Algorithm | Edge Weights | Target | Complexity | Heuristic |
|-----------|-------------|--------|------------|-----------|
| Dijkstra | Non-negative | All vertices | O((V+E) log V) | None |
| Bellman-Ford | Any (detects negative cycles) | All vertices | O(V * E) | None |
| A* | Non-negative | Single target | O((V+E) log V) worst case | Required |

## Applications

- **Dijkstra**: network routing (OSPF protocol), shortest path in road networks (when preprocessing is not possible)
- **Bellman-Ford**: BGP routing protocol, arbitrage detection, any graph with negative weights
- **A***: pathfinding in games and robotics, GPS navigation, puzzle solving (15-puzzle, Rubik's cube)

## Advanced: Bidirectional Search

For point-to-point shortest path, run Dijkstra (or A*) simultaneously from both source and target. The two searches meet in the middle, reducing the explored area from a circle of radius d to two circles of radius d/2 — roughly halving the number of vertices explored.

## Key Takeaways

- Dijkstra is the go-to for non-negative edge weights
- Bellman-Ford handles negative weights and detects negative cycles but is slower
- A* uses heuristics to efficiently find single-target shortest paths
- Choose the algorithm based on edge weight properties and whether you need all paths or just one`,
  },

  // --- INDEX 10 ---
  {
    title: 'Technical Interview Preparation Guide',
    type: 'general',
    tags: ['interviews', 'career', 'leetcode'],
    subject: 'Career',
    visibility: 'friends',
    isPinned: false,
    content: `# Technical Interview Preparation Guide

## Overview

Technical interviews at top tech companies typically consist of multiple rounds: an online assessment (OA), a phone screen, and an on-site loop with 3-5 interviews. Each round tests different skills, and preparation should be structured around the specific formats you will face.

## Data Structures & Algorithms (Coding Rounds)

### Core Data Structures to Master
- **Arrays and Strings**: two pointers, sliding window, prefix sums
- **Hash Maps / Sets**: frequency counting, two-sum patterns, deduplication
- **Stacks and Queues**: monotonic stacks, BFS with queues, expression evaluation
- **Linked Lists**: reversal, cycle detection (Floyd's), merge operations
- **Trees**: DFS (preorder, inorder, postorder), BFS (level order), BST operations
- **Heaps**: top-K problems, median finding, priority queues
- **Graphs**: BFS, DFS, topological sort, union-find, shortest path

### Key Algorithm Patterns
1. **Sliding Window**: fixed or variable size window for subarray/substring problems
2. **Two Pointers**: sorted arrays, palindromes, container with most water
3. **Binary Search**: search in rotated arrays, find boundaries, minimize maximum
4. **DFS/BFS**: tree traversals, graph connectivity, shortest paths in unweighted graphs
5. **Dynamic Programming**: identify state, transition, base cases. Practice: coin change, LCS, knapsack, house robber, word break
6. **Greedy**: interval scheduling, Huffman coding, activity selection
7. **Backtracking**: permutations, combinations, N-queens, Sudoku solver

### Study Plan
- Weeks 1-4: core data structures, easy problems (aim for 50+)
- Weeks 5-8: algorithm patterns, medium problems (aim for 80+)
- Weeks 9-12: hard problems, mock interviews, system design

## System Design (Senior and Some Intern Rounds)

### Framework
1. **Clarify requirements**: functional requirements, non-functional requirements (scale, latency, availability)
2. **High-level design**: major components, data flow, API design
3. **Deep dive**: database schema, caching strategy, scaling bottlenecks
4. **Trade-offs**: justify decisions, discuss alternatives

### Common Problems
- URL shortener, paste bin, rate limiter
- Chat system, notification service
- News feed, timeline, social graph
- Video streaming, file storage

## Behavioral Interviews

### STAR Method
- **Situation**: set the context
- **Task**: describe your responsibility
- **Action**: explain what you did (focus on YOUR contribution)
- **Result**: quantify the outcome

### Key Stories to Prepare
- A challenging technical problem you solved
- A time you disagreed with a teammate and how you resolved it
- A project you led or significantly contributed to
- A failure and what you learned from it
- A time you had to learn something quickly

## Practical Tips

- Time yourself during practice: 20 minutes for easy, 30 for medium, 45 for hard
- Always communicate your thought process out loud
- Start with brute force, then optimize
- Write clean code with meaningful variable names
- Test your solution with examples and edge cases before declaring it done
- Ask clarifying questions before coding — interviewers want to see this

## Resources

- LeetCode: filter by company, focus on top 100 most-asked
- Neetcode 150: curated list organized by pattern
- "Cracking the Coding Interview" by Gayle McDowell
- System Design: "Designing Data-Intensive Applications" by Martin Kleppmann
- Mock interviews: Pramp, interviewing.io

## My Progress (as of March 2026)

- LeetCode solved: 142 (68 easy, 58 medium, 16 hard)
- Strongest areas: arrays, trees, DP
- Weakest areas: graphs (improving), hard DP
- Mock interviews completed: 4 (2 with Alex, 1 Pramp, 1 with ACM mentor)`,
  },

  // --- INDEX 11 ---
  {
    title: 'React Hooks: Patterns and Best Practices',
    type: 'general',
    tags: ['react', 'javascript', 'frontend'],
    subject: 'Side Projects',
    visibility: 'private',
    isPinned: false,
    content: `# React Hooks: Patterns and Best Practices

## Why Hooks?

React Hooks (introduced in React 16.8) let you use state and other React features in functional components. Before hooks, you needed class components for state management, lifecycle methods, and context. Hooks simplify component logic, make it easier to reuse stateful logic between components, and eliminate the confusion around \`this\` binding in classes.

## Core Hooks

### useState
Manages local component state. Returns a state variable and a setter function.

\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

Key points:
- State updates are batched in event handlers (React 18 batches everywhere)
- Use functional updates when new state depends on previous: \`setCount(prev => prev + 1)\`
- For object state, spread the previous state: \`setState(prev => ({ ...prev, name: 'new' }))\`
- Lazy initialization for expensive computations: \`useState(() => computeExpensiveValue())\`

### useEffect
Runs side effects after render. Replaces componentDidMount, componentDidUpdate, and componentWillUnmount.

\`\`\`jsx
useEffect(() => {
  const subscription = subscribe(id);
  return () => subscription.unsubscribe(); // cleanup
}, [id]); // dependency array
\`\`\`

Common mistakes:
- Missing dependencies: leads to stale closures
- Object/array dependencies: use specific primitive values or useMemo
- Running effects too often: make sure the dependency array is correct

### useContext
Reads context values without nesting Consumer components.

\`\`\`jsx
const theme = useContext(ThemeContext);
\`\`\`

Combine with createContext and a Provider to pass data through the component tree without prop drilling.

### useRef
Holds a mutable value that persists across renders without causing re-renders. Two common uses:
1. DOM references: \`ref.current\` points to the DOM node
2. Instance variables: store previous values, timers, or any mutable value

### useMemo and useCallback
- \`useMemo\`: memoizes a computed value — recomputes only when dependencies change
- \`useCallback\`: memoizes a function reference — prevents unnecessary re-renders of child components that depend on the function

Use them when profiling shows performance issues, not preemptively. Premature memoization adds complexity without measurable benefit in most cases.

## Custom Hooks

Custom hooks extract reusable logic. They are just functions that call other hooks.

\`\`\`jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
\`\`\`

### Useful Custom Hook Patterns
- **useDebounce**: delay a value update until input settles
- **useFetch**: manage loading, data, and error states for API calls
- **useMediaQuery**: respond to CSS media query changes
- **useOnClickOutside**: detect clicks outside a component (modals, dropdowns)
- **usePrevious**: track the previous value of a prop or state

## React Query Integration

For server state, React Query (TanStack Query) replaces manual useEffect + fetch patterns:

\`\`\`jsx
const { data, isLoading, error } = useQuery({
  queryKey: ['notes'],
  queryFn: () => api.get('/notes').then(res => res.data),
});
\`\`\`

Benefits over manual useEffect: automatic caching, background refetching, request deduplication, optimistic updates, and pagination/infinite scroll support.

## Rules of Hooks

1. Only call hooks at the top level (no conditionals, loops, or nested functions)
2. Only call hooks from React function components or custom hooks
3. Custom hooks must start with "use"

## Key Takeaways

- useState for local state, useEffect for side effects, useContext for global state
- Custom hooks are the primary mechanism for logic reuse
- Only memoize (useMemo/useCallback) when profiling shows a need
- React Query is superior to manual useEffect for server state
- Follow the rules of hooks strictly — the linter will help`,
  },

  // --- INDEX 12 ---
  {
    title: 'Git Workflow and Branching Strategies',
    type: 'general',
    tags: ['git', 'version-control', 'workflow'],
    subject: 'Tools',
    visibility: 'private',
    isPinned: false,
    content: `# Git Workflow and Branching Strategies

## Why Branching Matters

Git branches are cheap and fast — creating a branch is just creating a pointer to a commit. A good branching strategy keeps the main branch stable, enables parallel development, and makes code review tractable. A bad strategy leads to merge conflicts, broken builds, and deployment nightmares.

## Git Flow

Git Flow (proposed by Vincent Driessen in 2010) uses long-lived branches:
- **main**: production-ready code
- **develop**: integration branch for features
- **feature/**: branched from develop, merged back via PR
- **release/**: branched from develop for release prep, merged to both main and develop
- **hotfix/**: branched from main for emergency fixes, merged to both main and develop

Pros: clear separation of concerns, well-suited for scheduled releases.
Cons: complex, many long-lived branches, slow feedback loops. Overkill for most projects.

## GitHub Flow

GitHub Flow is simpler:
1. Branch from main (feature/fix/chore branch)
2. Make commits
3. Open a pull request
4. Code review
5. Merge to main
6. Deploy

This is what we use in our projects. The key principle: main is always deployable. Feature branches are short-lived (days, not weeks).

## Trunk-Based Development

Developers commit directly to main (or merge very short-lived branches). Feature flags control incomplete features in production. Used by Google, Meta, and other large engineering organizations.

Requires: excellent test coverage, CI/CD pipeline, feature flag infrastructure. The fastest workflow when the team is disciplined.

## Conventional Commits

Commit messages follow a structured format:

\`\`\`
type(scope): description

[optional body]
[optional footer]
\`\`\`

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
Example: \`feat(auth): add Google OAuth login flow\`

Benefits: auto-generate changelogs, trigger semantic versioning, make git history searchable.

## Branching in Practice

### Naming Conventions
- \`feat/description\` — new features
- \`fix/description\` — bug fixes
- \`docs/description\` — documentation
- \`chore/description\` — maintenance tasks
- \`refactor/description\` — code restructuring

### Keeping Branches Updated
Regularly rebase or merge main into your feature branch to avoid large merge conflicts at the end:

\`\`\`bash
git fetch origin
git rebase origin/main
\`\`\`

Rebase creates a linear history (cleaner) but rewrites commits (never rebase shared branches). Merge preserves history but creates merge commits.

### Pull Request Best Practices
- Keep PRs small (under 400 lines changed when possible)
- Write a descriptive title and body
- Include screenshots for UI changes
- Link related issues
- Request reviews from relevant team members
- Address review comments promptly

## Useful Commands

\`\`\`bash
git stash              # temporarily shelve changes
git cherry-pick <sha>  # apply a specific commit to current branch
git bisect             # binary search for the commit that introduced a bug
git reflog             # recover lost commits
git log --oneline --graph --all  # visualize branch history
\`\`\`

## Key Takeaways

- GitHub Flow is the sweet spot for most teams
- Keep branches short-lived and focused
- Use conventional commits for structured history
- Rebase for clean history, merge for shared branches
- Small PRs get reviewed faster and have fewer bugs`,
  },

  // --- INDEX 13 ---
  {
    title: 'System Design Primer: Scalability Fundamentals',
    type: 'general',
    tags: ['system-design', 'scalability', 'architecture'],
    subject: 'Career',
    visibility: 'friends',
    isPinned: false,
    content: `# System Design Primer: Scalability Fundamentals

## Why System Design?

Building systems that work for 100 users is easy. Building systems that work for 100 million users requires understanding fundamental concepts in scalability, reliability, and performance. System design interviews test whether you can reason about these trade-offs.

## Vertical vs Horizontal Scaling

**Vertical scaling (scale up)**: add more resources to a single machine — more CPU, RAM, faster storage. Simple but has limits — there is a ceiling to how powerful a single machine can be, and it creates a single point of failure.

**Horizontal scaling (scale out)**: add more machines. No ceiling (in theory), provides redundancy, but introduces complexity: distributed state, network communication, consistency challenges.

Most production systems combine both: scale up individual machines and scale out by adding more of them.

## Load Balancing

A load balancer distributes incoming requests across multiple servers. It sits between clients and your server fleet.

### Algorithms
- **Round Robin**: requests go to servers in order — simple, even distribution
- **Weighted Round Robin**: some servers get more traffic (e.g., more powerful machines)
- **Least Connections**: send to the server with fewest active connections
- **IP Hash**: deterministic mapping based on client IP — ensures session stickiness

### Layers
- **L4 (Transport)**: routes based on IP/port, fast, no request inspection
- **L7 (Application)**: routes based on HTTP headers, URL, cookies — more flexible, slower

## Caching

Caching stores frequently accessed data in fast storage (memory) to reduce database load and response latency.

### Cache Locations
1. **Client-side**: browser cache, CDN cache
2. **Application-level**: in-process cache (HashMap), distributed cache (Redis, Memcached)
3. **Database-level**: query cache, buffer pool

### Strategies
- **Cache-aside**: application checks cache first, on miss fetches from DB and populates cache
- **Write-through**: write to cache and DB simultaneously — ensures consistency
- **Write-behind**: write to cache, asynchronously write to DB — faster writes, risk of data loss
- **Read-through**: cache handles DB fetching transparently

### Eviction Policies
- **LRU** (Least Recently Used): evict the oldest-accessed item — good general-purpose policy
- **LFU** (Least Frequently Used): evict the least-accessed item — better for skewed distributions
- **TTL** (Time to Live): items expire after a set duration

## Database Scaling

### Replication
- **Primary-replica**: one primary handles writes, replicas handle reads. Increases read throughput but writes are still limited by the primary. Replication lag means replicas may serve stale data.
- **Multi-primary**: multiple nodes accept writes — higher write throughput but conflict resolution is complex.

### Sharding (Partitioning)
Split data across multiple databases based on a shard key. Each shard holds a subset of the data. Challenges: choosing a good shard key (avoid hotspots), cross-shard queries, rebalancing when adding shards.

Common strategies: range-based (partition by date/ID range), hash-based (consistent hashing for even distribution), directory-based (lookup table maps keys to shards).

## CDN (Content Delivery Network)

CDNs cache static content (images, CSS, JS) at edge servers close to users. Benefits: lower latency, reduced origin server load, DDoS protection. Major providers: Cloudflare, AWS CloudFront, Akamai.

## Message Queues

Decouple producers and consumers using a queue (RabbitMQ, Kafka, SQS). Benefits: handle traffic spikes, retry failed operations, enable asynchronous processing.

Use cases: email sending, image processing, event logging, microservice communication.

## Monitoring and Observability

You cannot improve what you cannot measure. Three pillars:
1. **Metrics**: quantitative measurements (request latency, error rate, CPU usage)
2. **Logs**: detailed event records for debugging
3. **Traces**: request flow across services (distributed tracing)

## Key Takeaways

- Start simple, scale when needed — premature optimization is the root of all evil
- Horizontal scaling provides better availability than vertical scaling
- Caching is the single most impactful performance optimization
- Database sharding is a last resort — exhaust replication and caching first
- Every architectural decision is a trade-off — understand what you are giving up`,
  },

  // --- INDEX 14 ---
  {
    title: 'UNIX Command Line Toolkit',
    type: 'general',
    tags: ['unix', 'linux', 'cli', 'bash'],
    subject: 'Tools',
    visibility: 'private',
    isPinned: false,
    content: `# UNIX Command Line Toolkit

## Philosophy

The UNIX philosophy emphasizes small, composable tools that do one thing well. Programs read from stdin, write to stdout, and can be chained together with pipes. This composability makes the command line incredibly powerful for text processing, system administration, and development workflows.

## File System Navigation

\`\`\`bash
pwd                     # print working directory
ls -la                  # list all files with details
cd ~/projects           # change directory
tree -L 2               # show directory tree, 2 levels deep
find . -name "*.js"     # find files by name pattern
find . -mtime -7        # files modified in the last 7 days
du -sh */               # disk usage summary per directory
\`\`\`

## Text Processing

\`\`\`bash
cat file.txt            # display file contents
head -n 20 file.txt     # first 20 lines
tail -f log.txt         # follow log output in real time
wc -l file.txt          # count lines
sort file.txt           # sort lines alphabetically
sort -n -k2 file.txt    # sort numerically by 2nd column
uniq -c                 # count unique occurrences (requires sorted input)
cut -d',' -f2 data.csv  # extract 2nd column from CSV
\`\`\`

## grep and Regular Expressions

\`\`\`bash
grep "error" log.txt              # find lines containing "error"
grep -r "TODO" src/               # recursive search in directory
grep -i "warning" log.txt         # case-insensitive
grep -c "error" log.txt           # count matches
grep -n "function" *.js           # show line numbers
grep -E "err(or|no)" log.txt      # extended regex (ERE)
grep -v "debug" log.txt           # invert match (exclude lines)
\`\`\`

## sed and awk

\`\`\`bash
sed 's/old/new/g' file.txt             # replace all occurrences
sed -n '10,20p' file.txt               # print lines 10-20
sed -i '' '/^$/d' file.txt             # delete blank lines in-place (macOS)
awk '{print $1, $3}' file.txt          # print 1st and 3rd columns
awk -F',' '{sum+=$2} END {print sum}'  # sum 2nd CSV column
awk '/ERROR/ {count++} END {print count}' log.txt  # count ERROR lines
\`\`\`

## Process Management

\`\`\`bash
ps aux                  # list all running processes
top / htop              # interactive process monitor
kill -9 PID             # force kill a process
jobs                    # list background jobs
bg / fg                 # move job to background / foreground
nohup command &         # run command that survives terminal close
\`\`\`

## Pipes and Redirection

\`\`\`bash
command > file.txt      # redirect stdout to file (overwrite)
command >> file.txt     # append stdout to file
command 2> error.log    # redirect stderr
command 2>&1            # merge stderr into stdout
command1 | command2     # pipe stdout of cmd1 to stdin of cmd2
\`\`\`

### Practical Pipeline Examples

\`\`\`bash
# Find the 10 largest files in current directory tree
find . -type f -exec du -h {} + | sort -rh | head -10

# Count unique HTTP status codes in access log
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# Find all TODO comments in JavaScript files
grep -rn "TODO" --include="*.js" src/ | wc -l

# Monitor a log file for errors in real time
tail -f app.log | grep --line-buffered "ERROR"
\`\`\`

## Networking

\`\`\`bash
curl -X GET https://api.example.com/data    # HTTP request
curl -s url | jq '.'                        # pretty-print JSON response
wget -r -l 2 https://example.com            # recursive download
ssh user@host                               # remote login
scp file.txt user@host:/path/               # secure copy to remote
\`\`\`

## Key Takeaways

- Master pipes and composition — the power of UNIX is chaining simple tools
- grep, sed, and awk handle 90% of text processing needs
- Learn keyboard shortcuts: Ctrl+R (reverse search), Ctrl+A/E (line start/end), Ctrl+K (kill to end of line)
- Create aliases for frequently used commands in your shell profile
- Use man pages: \`man command\` is always available offline`,
  },

  // --- INDEX 15 ---
  {
    title: 'Finals Week Study Plan',
    type: 'todo',
    tags: ['study-plan', 'finals', 'spring-2026'],
    subject: 'Planning',
    visibility: 'private',
    isPinned: false,
    content: `# Finals Week Study Plan — Spring 2026

## Exam Schedule

| Date | Course | Time | Format |
|------|--------|------|--------|
| Apr 16 | CS 211 Data Structures Final | 10:00 AM | 2hr, closed book |
| Apr 21 | CS 320 Compilers Final | 1:00 PM | 2hr, one page notes |
| Apr 23 | CS 301 OS Final | 10:00 AM | 2hr, open note |

## Week Before Finals (Apr 6 - Apr 12)

### Monday - Tuesday: CS 211 Deep Review
- [ ] Review all DP problems from class and homework
- [ ] Practice graph algorithm implementations (Dijkstra, BFS, DFS, topological sort)
- [ ] Work through NP-completeness reduction examples
- [ ] Amortized analysis: aggregate, accounting, and potential methods
- [ ] Do 2 practice exams under timed conditions

### Wednesday - Thursday: CS 320 Compilers
- [ ] Review lexer construction: regex to NFA to DFA
- [ ] Parsing: LL(1) parse tables, LR(0) items, LALR(1)
- [ ] AST construction and type checking rules
- [ ] Code generation: three-address code, register allocation
- [ ] Optimization passes: constant folding, dead code elimination, loop invariant code motion

### Friday - Saturday: CS 301 OS
- [ ] Process management: scheduling algorithms, context switching
- [ ] Memory management: paging, segmentation, virtual memory, TLB
- [ ] File systems: inode structure, journaling, RAID levels
- [ ] Synchronization: mutexes, semaphores, monitors, deadlock conditions
- [ ] Security: access control, capabilities, sandboxing

### Sunday: Light Review
- [ ] Flash card review for all three courses
- [ ] Re-read class notes on weak topics
- [ ] Get 8 hours of sleep

## Finals Week (Apr 13 - Apr 23)

### Monday Apr 13: CS 211 Final Prep
- [ ] Morning: practice exam #3
- [ ] Afternoon: review mistakes from practice exams
- [ ] Evening: light review of key formulas and complexities

### Tuesday Apr 14: REST DAY
- Sleep, eat well, light exercise. Do not cram.

### Wednesday Apr 15: nothing scheduled
- [ ] Start compilers prep: focus on parsing and code generation

### Thursday Apr 16: CS 211 FINAL (10 AM)
- Arrive 15 min early. Deep breaths. Trust the prep.
- Afternoon: decompress, then start compilers review

### Friday Apr 17 - Sunday Apr 19: Compilers Sprint
- [ ] Full practice exam for compilers
- [ ] Prepare one-page cheat sheet (allowed)
- [ ] Focus on optimization passes — weakest area

### Monday Apr 20: Rest + light OS review
### Tuesday Apr 21: CS 320 COMPILERS FINAL (1 PM)
### Wednesday Apr 22: Full OS review day
### Thursday Apr 23: CS 301 OS FINAL (10 AM)

## Study Strategies
- Pomodoro technique: 50 min work, 10 min break
- Teach concepts out loud (rubber duck debugging for studying)
- Prioritize understanding over memorization
- Use Continuum flashcards for quick reviews between sessions`,
  },

  // --- INDEX 16 ---
  {
    title: 'Internship Application Checklist — Spring 2026',
    type: 'todo',
    tags: ['internships', 'applications', 'career'],
    subject: 'Career',
    visibility: 'private',
    isPinned: false,
    content: `# Internship Application Checklist — Spring 2026

## Resume & Materials
- [x] Update resume with fall 2025 projects
- [x] Add REST API project and distributed systems coursework
- [x] Get resume reviewed by career center (Jan 22)
- [x] Get resume reviewed by Alex (peer review)
- [x] Tailor resume for backend/infrastructure roles
- [ ] Update portfolio website with new projects
- [ ] Record 2-minute elevator pitch video

## Applications Submitted (as of mid-March)

### Offers Received
- [x] Stripe — SWE Intern, $58/hr, SF — **BEST OFFER**
- [x] HubSpot — SWE Intern, $50/hr, Cambridge
- [x] Shopify — SWE Intern, $52/hr CAD, Remote
- [x] Twilio — SWE Intern, $48/hr, SF

### Active Interviews
- [x] Google — On-site loop Mar 10 (**waiting for results**)
- [x] Apple — Phone screen done, waiting for next steps
- [x] Nvidia — Technical screen done
- [x] Jane Street — OA completed
- [x] Two Sigma — First interview done
- [x] Figma — Design + coding round done
- [x] Notion — Values interview done
- [x] Vercel — Technical screen done

### Pending (Applied, Waiting)
- [x] Meta, Microsoft, Uber, LinkedIn, Coinbase, DoorDash, Netflix, Palantir

### Rejected
- [x] Amazon, Goldman Sachs, Citadel, Roblox, ByteDance, Snap, Pinterest, Datadog

### Withdrawn
- [x] Zillow, Dropbox, Asana, Box, Qualtrics, Okta

## Decision Timeline
- All offer deadlines: April 15, 2026
- Need to decide between Stripe, HubSpot, Shopify, Twilio
- Waiting on Google — if they come through, that changes everything
- Talk to Marcus about salary negotiation tactics
- Talk to Jordan about SF vs remote vs Cambridge lifestyle

## Interview Prep Ongoing
- [x] LeetCode: 142 problems solved
- [ ] Target: 175 by end of March
- [x] Mock interviews: 4 completed
- [ ] System design: practice 2 more problems
- [ ] Behavioral: prepare 2 more STAR stories

## Networking
- [x] Connect with ACM alumni at target companies
- [x] Attend career fair (Feb 12)
- [ ] Follow up with Google recruiter Sarah Kim
- [ ] Thank-you emails to all interviewers`,
  },

  // --- INDEX 17 ---
  {
    title: 'Group Project Task Breakdown: Distributed KV Store',
    type: 'todo',
    tags: ['project', 'distributed-systems', 'team'],
    subject: 'CS 301 — Operating Systems',
    visibility: 'private',
    isPinned: false,
    content: `# Group Project Task Breakdown: Distributed Key-Value Store

## Team
- Justin Burrell (team lead) — consensus layer, gRPC
- Alex Chen — storage engine, data persistence
- Jordan Williams — network layer, failure detection

## Project Overview
Build a distributed key-value store that supports PUT, GET, DELETE operations with strong consistency guaranteed by the Raft consensus protocol. The system should handle node failures gracefully and re-elect leaders automatically.

## Architecture
\`\`\`
Client -> gRPC API -> Raft Consensus -> Storage Engine -> Disk
                          |
                    Replicated Log
                          |
              Node 1 / Node 2 / Node 3
\`\`\`

## Milestone 1: Foundation (Due Feb 28) — COMPLETED
- [x] Design system architecture and data flow diagrams
- [x] Set up project repository with Go modules
- [x] Define protobuf schemas for gRPC communication
- [x] Implement basic storage engine (in-memory hash map with WAL)
- [x] Write unit tests for storage engine

## Milestone 2: Raft Consensus (Due Mar 21) — IN PROGRESS
- [x] Implement Raft leader election
- [x] Implement log replication
- [ ] Implement log compaction (snapshotting)
- [ ] Handle split-brain scenarios
- [ ] Write integration tests for consensus

## Milestone 3: Client API & Networking (Due Apr 4)
- [ ] Implement gRPC server with PUT/GET/DELETE endpoints
- [ ] Client request forwarding (follower -> leader)
- [ ] Failure detection with heartbeats and timeouts
- [ ] Automatic leader re-election on failure
- [ ] Connection pooling and retry logic

## Milestone 4: Testing & Polish (Due Apr 18)
- [ ] End-to-end integration tests
- [ ] Chaos testing: random node failures
- [ ] Performance benchmarking (throughput, latency)
- [ ] Write final report (10 pages)
- [ ] Record demo video

## Current Blockers
- Log compaction is tricky — need to snapshot state without blocking reads
- Jordan's failure detection has false positives under high load
- Need to agree on linearizability testing strategy

## Meeting Notes
- Weekly sync: Thursdays 4 PM, Siebel 1304
- Use Slack channel #cs301-kvstore for async communication
- Code review required for all PRs before merge`,
  },

  // --- INDEX 18 ---
  {
    title: 'Week 9 Action Items',
    type: 'todo',
    tags: ['weekly', 'tasks', 'spring-2026'],
    subject: 'Planning',
    visibility: 'private',
    isPinned: false,
    content: `# Week 9 Action Items (Mar 16 - Mar 22, 2026)

## Priority: HIGH

### Academics
- [ ] Submit CS 211 Assignment 4: DP Coin Change (Due Mar 20)
  - Implement memoization and tabulation approaches
  - Compare time/space complexity with analysis writeup
  - Run against all test cases on Gradescope

- [ ] Study for CS 350 Networks Quiz (Mar 19)
  - TCP congestion control: slow start, AIMD, fast retransmit
  - HTTP/2 vs HTTP/3 differences
  - Review lecture slides 12-16

- [ ] Raft log compaction implementation for group project
  - Review Raft paper section 7 (log compaction)
  - Coordinate with Alex on snapshot format

### Career
- [ ] Follow up on Google on-site loop results
  - Email Sarah Kim if no response by Wednesday
  - Prepare for potential offer negotiation

## Priority: MEDIUM

### Academics
- [ ] Read DDIA Chapter 5-6 (Replication and Partitioning)
- [ ] Start compilers midterm prep (exam is Mar 26)
  - Focus on LL/LR parsing — weakest area

### Personal
- [ ] ACM Weekly Meeting (Thursday)
- [ ] Review Maya's stats notes for cross-study benefit
- [ ] Buy new laptop charger (Amazon order)

## Priority: LOW
- [ ] Continue portfolio website (Next.js setup)
- [ ] LeetCode daily: target 3 medium problems this week
- [ ] Read Clean Code chapters 3-5

## Completed Last Week
- [x] CS 350 Networks Quiz studying (scored 88%)
- [x] Raft leader election implementation
- [x] Sent thank-you to Google recruiter
- [x] ACM mock interview workshop attended

## Reflection
Feeling pretty stretched this week. The DP assignment and group project are both demanding. Need to be disciplined about time blocking. Also anxious about the Google results — trying not to let it distract from current work.`,
  },

  // --- INDEX 19 ---
  {
    title: 'Summer Prep Roadmap',
    type: 'todo',
    tags: ['summer', 'career', 'learning'],
    subject: 'Planning',
    visibility: 'private',
    isPinned: false,
    content: `# Summer 2026 Prep Roadmap

## Before Internship Starts (May 1 - Jun 1)

### Technical Prep
- [ ] Complete Neetcode 150 (currently at 95/150)
- [ ] Deep dive into payments systems (Stripe-specific prep)
  - Read Stripe engineering blog posts
  - Understand payment intents, charges, refunds API
  - Study PCI compliance basics
- [ ] Read "Designing Data-Intensive Applications" (finish remaining chapters)
- [ ] Build a small project with Go or Rust (expand language skills)
- [ ] Review distributed systems concepts (directly relevant to Stripe infrastructure)

### Soft Skills
- [ ] Practice presenting technical concepts (mock demos)
- [ ] Read "The Manager's Path" Chapter 1-3 (understanding engineering culture)
- [ ] Prepare questions to ask mentor and team on day one

### Logistics
- [ ] Secure summer housing in SF (start searching April)
- [ ] Set up banking/finances for SF cost of living
- [ ] Plan travel from campus to SF
- [ ] Get any required onboarding paperwork done early

## During Internship (Jun - Aug)

### Week 1 Goals
- [ ] Understand team codebase and development workflow
- [ ] Set up local development environment
- [ ] Meet team members and skip-level manager
- [ ] Identify my intern project scope

### Ongoing Goals
- [ ] Ship meaningful code every week
- [ ] Ask for feedback every 2 weeks (do not wait for formal reviews)
- [ ] Document what I learn daily (personal engineering journal)
- [ ] Network with other interns and full-time engineers
- [ ] Attend tech talks and company events

### End-of-Internship Goals
- [ ] Complete intern project with measurable impact
- [ ] Present project to the team
- [ ] Get return offer (stretch: full-time conversion for after graduation)
- [ ] Write a reflection on what went well and what to improve

## After Internship (Aug - Sep)

- [ ] Update resume with internship experience
- [ ] Write LinkedIn post about the experience
- [ ] Decide on fall recruiting strategy (if no return offer)
- [ ] Start thinking about senior thesis or capstone project

## Skills to Develop This Summer
1. Production code quality (testing, monitoring, deployment)
2. Working in a large codebase (navigation, code review, documentation)
3. Communication (standups, design docs, code review comments)
4. Time management in a professional setting`,
  },

  // --- INDEX 20 ---
  {
    title: 'Week 3 Reflection — Adjusting to Spring Semester',
    type: 'journal',
    tags: ['reflection', 'journal', 'spring-2026'],
    subject: 'Personal',
    visibility: 'private',
    isPinned: false,
    content: `# Week 3 Reflection — Adjusting to Spring Semester

## Feb 9, 2026

Three weeks into the spring semester and I am finally starting to find my rhythm. The first two weeks were a blur of syllabus readings, office hours, and trying to figure out how five courses fit into a weekly schedule without losing my mind.

## Course Load

CS 211 (Data Structures & Algorithms) is going to be the most important course this semester. Professor Martinez moves fast, but the material is directly applicable to interview prep. We just covered hash tables and are moving into trees next week. The first assignment on Big-O analysis went well — scored 94 after a careless mistake on the amortized analysis question.

CS 301 (Operating Systems) is fascinating but dense. Process scheduling algorithms are more nuanced than I expected. FCFS seemed trivial until we started analyzing convoy effects and turnaround time distributions. The group project was announced — a distributed key-value store with Raft consensus. Alex and Jordan are on my team, which is a relief. We work well together.

CS 350 (Networks) is taught by a professor who clearly loves the material, which helps. The TCP/IP stack is one of those things I have used daily without truly understanding. Breaking down each layer and seeing how packets actually flow across the internet has been eye-opening.

CS 320 (Compilers) starts slow with lexing, which feels mechanical, but I know parsing and code generation will pick up the complexity significantly.

CS 340 (Databases) is practical and satisfying. Writing SQL queries that actually optimize performance feels like a superpower. Index design is already my favorite topic.

## Social Life

Joined ACM officially and attended the first two weekly meetings. The guest speaker on open source contributions was surprisingly inspiring — I might try to contribute to a Node.js tooling project over spring break.

Started hanging out with Priya more after we ran into each other at the library. It is refreshing to talk to someone completely outside CS. She is prepping for the MCAT and her study discipline puts mine to shame. She studies in structured 90-minute blocks with zero phone. I am trying to adopt that approach.

Marcus invited me to a finance networking event. Went out of curiosity. The culture is wildly different from tech — everyone in suits, firm handshakes, rehearsed elevator pitches. Made me appreciate the relative informality of CS recruiting. But Marcus's advice on salary negotiation tactics is going to be invaluable.

## Internship Applications

Submitted my first batch of applications this week: Google, Stripe, Amazon, and a few others. The resume is tight after feedback from Alex and the career center. The waiting game is the hardest part — I keep refreshing my email for OA invitations.

## Goals for Next Week
- Start LeetCode daily practice (targeting 5 problems per week)
- Attend CS 211 office hours to clarify red-black tree rotations
- Submit the linked list implementation assignment early
- Set up the group project repository with Alex and Jordan`,
  },

  // --- INDEX 21 ---
  {
    title: 'Week 6 Reflection — Midterm Season Hits Different',
    type: 'journal',
    tags: ['reflection', 'journal', 'midterms'],
    subject: 'Personal',
    visibility: 'private',
    isPinned: false,
    content: `# Week 6 Reflection — Midterm Season Hits Different

## Mar 1, 2026

Midterm season is in full swing and it is testing me in every sense. Two exams down, one quiz cleared, and I am running on caffeine and determination.

## Exam Results

CS 211 Midterm: 87. Solid but not where I wanted to be. Lost points on the AVL tree rotation question — I drew the rotations correctly but forgot to update the height field after rebalancing. Frustrating because I knew the concept but made a mechanical error under time pressure. Need to practice more timed problems.

CS 301 OS Midterm: 91. Much better than expected. The scheduling algorithm comparison question played to my strengths — I had spent extra time on that topic because of the notes I made. The open-note format helped, but only because my notes were well-organized. Lesson: organized notes are worth more than comprehensive notes.

CS 350 Networks Quiz: 88. Missed a question about TCP congestion window behavior during fast recovery. Need to revisit that section.

## Group Project Progress

The distributed KV store project is moving well. We finished Milestone 1 on time — the storage engine works, the protobuf schemas are defined, and we have a solid test suite. Now we are tackling Raft consensus, which is where the real complexity lives.

Leader election was surprisingly tricky. The edge cases around split votes and network partitions required careful handling. Alex had a clever idea for using randomized election timeouts to reduce the chance of repeated split votes. Jordan set up a local Docker network to simulate node failures, which has been invaluable for testing.

## Interview Season Heating Up

This has been the most stressful part of the semester. I have done phone screens with Apple, Nvidia, and Two Sigma. Each one required specific preparation — Apple asked about WebKit internals (had to research on the fly), Nvidia focused on GPU programming concepts (outside my comfort zone), and Two Sigma went deep on system design.

The Stripe process has been the smoothest. Two interviews so far, both well-structured and fair. The interviewers were genuinely interested in my thought process rather than trying to trick me. I have a good feeling about this one.

On the rejection side, Amazon and Goldman Sachs both sent rejection emails this week. Amazon stung because I know I could have done better on the OA with more practice. Goldman's HireVue format caught me off guard — answering finance questions to a camera with a timer is deeply uncomfortable.

## Mental Health Check

I will not sugarcoat it: this week was hard. The combination of exams, interviews, and the group project created a level of sustained stress that I have not experienced before. I found myself snapping at small things and having trouble sleeping.

What helped: talking to Sofia about cognitive load theory (ironic that her psych knowledge helped me manage my own mental load). She suggested batching similar tasks together and building in genuine rest periods — not scrolling social media, but actual rest. Walking, cooking, doing nothing. It sounds simple but I had forgotten how to do nothing.

Also had a good conversation with Jordan about career anxiety. As a senior, he has been through this cycle and reassured me that the uncertainty is normal and temporary. Perspective from someone slightly ahead in the journey is invaluable.

## Goals for Next Two Weeks
- Complete Raft log replication implementation
- Start preparing for Networks quiz
- Continue LeetCode: aim for 120 total solved
- Take one full day off (no screens, no studying)`,
  },

  // --- INDEX 22 ---
  {
    title: 'Week 8 Reflection — Progress and Setbacks',
    type: 'journal',
    tags: ['reflection', 'journal', 'spring-2026'],
    subject: 'Personal',
    visibility: 'private',
    isPinned: false,
    content: `# Week 8 Reflection — Progress and Setbacks

## Mar 15, 2026

Week 8. Past the midpoint of the semester. Time is moving faster than I would like, and the finish line feels both close and impossibly far.

## Academic Updates

CS 211: the DP unit is the most challenging material so far. Assignment 4 (coin change) is due next week and I am still working through the tabulation approach. The memoization version came naturally, but building the table bottom-up requires thinking about the problem differently. I spent two hours on Tuesday just staring at the recurrence relation before it clicked. The feeling when it finally did was worth every minute of frustration.

CS 301: Raft log replication is working in the group project. We can now replicate entries across three nodes and maintain consistency after leader crashes. The next challenge is log compaction — the Raft paper describes snapshotting but the implementation details are left as an exercise. Classic academic paper move.

CS 320: parsing has gotten significantly harder. We are deep into LR parsing now and building parser tables by hand is tedious but illuminating. Seeing how the parser generator automates what would be impossible to do manually gives me appreciation for the tool chain we take for granted.

## Internship Updates

The big news: I received my first offer. Stripe came through with $58/hour for their payments infrastructure team in San Francisco. Twelve-week program starting mid-June. I was genuinely shocked — I knew the interviews went well but part of me had assumed rejection was the default outcome.

Calling my parents to tell them was one of the best moments of the semester. My mom cried. My dad asked what payments infrastructure means and I spent twenty minutes explaining it. They are proud and that means everything.

The offer deadline is April 15, which gives me time to hear back from other companies. HubSpot also extended an offer ($50/hour, Cambridge), and I am waiting on Google, Apple, and a few others.

## The LeetCode Grind

Current count: 130 solved (up from 110 two weeks ago). I am getting faster at recognizing patterns. When I see a string manipulation problem now, my brain immediately categorizes it: sliding window, two pointers, or hash map. This pattern recognition is exactly what the grind is supposed to build.

Hardest problem this week: Trapping Rain Water. Took me 45 minutes and I had to look at a hint. But after understanding the two-pointer approach, I could explain it clearly, which means I actually learned it rather than memorized it.

## Personal Growth

I have been thinking about what kind of engineer I want to be. Not just which company or which tech stack, but what my values are. After talking to Jordan about his senior job search and Marcus about finance culture, I have landed on a few things:

1. I want to work on infrastructure. Building the platform that other engineers build on top of is deeply satisfying to me.
2. I care about mentorship culture. Stripe's interview process showed me what a team that invests in new engineers looks like.
3. I want to keep learning across disciplines. The conversations with Maya about statistics, Priya about research methods, and Sofia about cognitive science have made me a better thinker, not just a better coder.

## Looking Ahead

The next five weeks are going to be intense: finish the group project, prep for finals, and make the internship decision. But I feel more grounded than I did at week 6. The stress has not decreased but my ability to manage it has improved.

One thing at a time. One problem at a time. One day at a time.`,
  },

  // --- INDEX 23 ---
  {
    title: 'Week 11 Reflection — Internship Offer and What It Means',
    type: 'journal',
    tags: ['reflection', 'journal', 'career'],
    subject: 'Personal',
    visibility: 'private',
    isPinned: false,
    content: `# Week 11 Reflection — Internship Offer and What It Means

## Apr 5, 2026

I have been putting off writing this reflection because I was not sure how to process everything. But here I am at 11 PM on a Sunday, and it feels like the right time.

## The Decision

The offer deadline is April 15. Ten days from now. I have four offers on the table: Stripe ($58/hr, SF), HubSpot ($50/hr, Cambridge), Shopify ($52/hr CAD, remote), and Twilio ($48/hr, SF). Google has gone silent after the on-site loop — at this point I am operating under the assumption that it is a rejection they have not bothered to send yet.

Stripe is the clear frontrunner. The compensation is highest, the team (payments infrastructure) aligns perfectly with my interests, and the interview process gave me the most confidence in the engineering culture. The downside is San Francisco cost of living — even at $58/hr, housing will eat a significant chunk.

HubSpot in Cambridge is appealing for the East Coast experience and the more relaxed culture. Shopify being fully remote is tempting but I worry about isolation during my first real engineering internship. Twilio is interesting technology but the lower compensation and less exciting team make it my fourth choice.

I talked to Marcus about negotiation. His advice: do not negotiate intern offers aggressively because the companies have less flexibility and you risk souring the relationship. Instead, use competing offers to ask for small perks — housing stipend, start date flexibility, team preference. This is good advice and different from what I would have done on my own (which was to ask Stripe to match a Google offer that does not exist).

## Academic Status

Finals are approaching and I am trying to stay focused despite the internship distraction. The group project is in its final stretch — we need to finish log compaction, run benchmarks, write the report, and record the demo video. Alex has been clutch on the storage engine optimizations and Jordan's failure detection is finally reliable after switching from fixed timeouts to an adaptive phi-accrual failure detector.

My CS 211 prep is going well. The DP and graph algorithm units are the hardest material on the final, but they are also the areas I have practiced most through LeetCode. There is a beautiful symmetry in how interview prep and coursework have reinforced each other this semester.

CS 320 Compilers has been a grind but I have a grudging respect for the material. Understanding how source code becomes machine code has changed how I think about programming. I catch myself thinking about the AST implications of syntax choices, which is either a sign of deep learning or madness.

## Relationships

My friendships have deepened significantly this semester, and I think it is because we have all been under pressure together. Alex and I have spent dozens of hours debugging Raft implementations and grinding LeetCode. Maya taught me enough statistics to actually understand the ML papers I was trying to read. Jordan has been a steady source of career wisdom. Priya reminds me that there are entire worlds of knowledge outside CS that are equally deep and demanding. Marcus showed me that the skills of communication and persuasion are as valuable as technical skills. Sofia helped me understand why my brain works the way it does under stress.

I came to college expecting to learn computer science. I did not expect to learn so much from people studying completely different things. That might be the most important lesson of this semester.

## What This Internship Means

This is not just a job. It is validation. It is the first real evidence that the hours of studying, the rejection emails, the imposter syndrome — all of it was building toward something tangible. A team of engineers at one of the most respected companies in tech looked at my work and said: we want you on our team.

I am trying to hold that feeling without letting it inflate my ego. The internship has not started yet. I have not shipped any production code. I have not navigated a large codebase or survived an oncall rotation. There is so much I do not know.

But for now, in this moment, I am proud of myself. And I am going to let myself feel that.`,
  },

  // --- INDEX 24 ---
  {
    title: 'Week 14 Reflection — End of Semester Thoughts',
    type: 'journal',
    tags: ['reflection', 'journal', 'spring-2026'],
    subject: 'Personal',
    visibility: 'private',
    isPinned: false,
    content: `# Week 14 Reflection — End of Semester Thoughts

## Apr 26, 2026

The semester is effectively over. Two finals down, one to go. The distributed KV store project is submitted. My internship decision is made. And I am sitting in the library at 9 PM writing what might be my last journal entry of the spring semester.

## Finals Recap

CS 211 Data Structures Final: feeling good about this one. The DP section was straightforward — the coin change and LCS problems were almost identical to what I practiced. The graph section had a tricky shortest path question with negative edges (Bellman-Ford territory) that I think I got right. The NP-completeness reduction was the hardest question: reduce 3-SAT to Independent Set. I had seen this in lecture but doing it under time pressure was stressful.

CS 320 Compilers Final: done. The one-page cheat sheet was a lifesaver — I packed in LR parsing tables, code generation templates, and optimization rules in the smallest handwriting I could manage. The exam was fair. The code generation question on register allocation was tricky but I think my approach of using graph coloring was what they were looking for.

CS 301 OS Final: tomorrow morning. I have been reviewing all day. File systems and security are the new material since the midterm. The open-note format means organization is key. I spent an hour today just indexing my notes with page numbers and topic headers.

## The Group Project

We submitted the distributed KV store project on Friday. Final state: 3-node cluster running Raft consensus with log replication, log compaction via snapshots, and automatic leader re-election. PUT/GET/DELETE operations via gRPC. Benchmarks showed we could handle 500 operations per second with sub-10ms latency for reads and sub-50ms for writes. Not production-grade, but solid for a semester project.

The demo video turned out well. Alex walked through the architecture, I demonstrated the Raft consensus working through simulated failures, and Jordan showed the benchmarking results. Professor Chen asked good questions during the presentation, particularly about our approach to linearizability. I think we impressed him.

Working with Alex and Jordan was one of the highlights of the semester. We had our disagreements — the great debate over Go vs Rust lasted two weeks before we settled on Go — but we always resolved them through technical merit rather than ego. That is the kind of team I want to work on professionally.

## Internship Decision: Stripe

I accepted Stripe on April 14, one day before the deadline. Called HubSpot, Shopify, and Twilio to decline. Each conversation was brief and professional. The recruiters were gracious and wished me well. This is a small industry and burning bridges is never worth it.

Google finally sent a rejection email on April 10. Five weeks after the on-site. The email was two sentences and offered no feedback. After the initial disappointment, I realized something: I already had an offer from a company I was genuinely excited about. The Google rejection stung my ego but did not change my outcome.

I start at Stripe on June 15. Payments infrastructure team in San Francisco. I have already started reading their engineering blog and skimming the Stripe API documentation. The more I learn about their system architecture, the more excited I get.

## Semester GPA Projection

Based on exam performance and assignment grades:
- CS 211: A- (the midterm docked me)
- CS 301: A (strong project and exam performance)
- CS 320: B+ (compilers was tough, no shame)
- CS 340: A (databases clicked for me)
- CS 350: A- (networks quiz pulled me down slightly)

If this holds, my cumulative GPA stays above 3.7. Not perfect, but I am learning that GPA matters less and less the further into your career you get. The skills, projects, and relationships matter more.

## Looking Forward

This semester taught me more than any previous one. Not just technically — although I have learned more CS in four months than I thought possible — but about who I am and what I want. I want to build infrastructure. I want to work on systems that millions of people depend on. I want to keep growing, keep learning, and keep surrounding myself with people who challenge me.

Summer is going to be a new chapter. New city, new codebase, new team, new challenges. I am nervous and excited in equal measure. But if this semester taught me anything, it is that I can handle more than I think I can.

Bring it on, Stripe.`,
  },
];

// ─── SECTION 3 (cont): Note Summary Fallbacks (notes 0-9) ──────────────────

const noteSummaryFallbacks = [
  // Note 0: Dynamic Programming
  {
    quickSummary: 'Covers dynamic programming fundamentals including memoization (top-down) and tabulation (bottom-up) approaches, with examples of Fibonacci, coin change, LCS, and knapsack problems.',
    detailedSummary: 'This note provides a comprehensive introduction to dynamic programming (DP), starting with the two key properties that make a problem suitable for DP: optimal substructure and overlapping subproblems. It traces the evolution from naive recursion (exponential time) to memoization (top-down caching) and tabulation (bottom-up iterative construction). The Fibonacci sequence serves as the running example throughout. Classic DP problems covered include coin change (minimum coins for a target amount), longest common subsequence (LCS with a 2D table), and 0/1 knapsack (maximize value under weight constraint). The note concludes with practical advice on identifying DP problems and the tradeoff between memoization (easier to implement) and tabulation (better constant factors).',
  },
  // Note 1: OS Scheduling
  {
    quickSummary: 'Compares CPU scheduling algorithms: FCFS, SJF, Round Robin, and Priority scheduling, plus Multilevel Feedback Queue (MLFQ) as the real-world hybrid.',
    detailedSummary: 'This lecture note examines the major CPU scheduling algorithms used in operating systems. FCFS (First-Come, First-Served) is simple but suffers from the convoy effect. SJF (Shortest Job First) is provably optimal for average waiting time but requires burst time prediction and can cause starvation. Round Robin provides fairness and low response time through time quantum rotation, with quantum size being the critical tuning parameter. Priority scheduling assigns priorities to processes but risks starvation without aging. The Multilevel Feedback Queue (MLFQ) combines all approaches: new processes start in high-priority queues and sink to lower queues if they consume their full quantum, automatically adapting to process behavior. A comparison table evaluates each algorithm on throughput, waiting time, response time, fairness, and overhead.',
  },
  // Note 2: TCP/IP
  {
    quickSummary: 'Explains the TCP/IP network stack (link, internet, transport, application layers), TCP reliability mechanisms, UDP, HTTP evolution (1.1/2/3), and TLS encryption.',
    detailedSummary: 'This note walks through the TCP/IP networking model layer by layer. The internet layer covers IP addressing, subnetting, NAT, and TTL. The transport layer contrasts TCP (connection-oriented, reliable, with three-way handshake, flow/congestion control) and UDP (connectionless, unreliable, minimal overhead). The application layer covers the evolution of HTTP: HTTP/1.1 introduced persistent connections but suffered head-of-line blocking; HTTP/2 added binary framing and multiplexing; HTTP/3 runs over QUIC (UDP-based) for better mobile/Wi-Fi performance. TLS 1.3 is covered in detail including the streamlined handshake, forward secrecy via ephemeral Diffie-Hellman, and 0-RTT resumption. DNS resolution hierarchy is also explained.',
  },
  // Note 3: Database Systems
  {
    quickSummary: 'Covers database indexing (B+ trees, hash indexes), query optimization (logical/physical), ACID transactions, isolation levels, and concurrency control (2PL, MVCC).',
    detailedSummary: 'This note covers three core database topics. Indexing explores B+ tree structure (balanced, high fan-out, linked leaf nodes for range queries), hash indexes (O(1) lookups, no range support), and index types (primary, secondary, composite, covering). Query optimization covers logical optimization (predicate pushdown, join reordering) and physical optimization (scan types, join algorithms). Cost estimation relies on table statistics and histograms. Transactions are explained through the ACID properties: atomicity (WAL-based rollback), consistency (constraint enforcement), isolation (four levels from read uncommitted to serializable), and durability (WAL flush before commit). Concurrency control compares two-phase locking (deadlock-prone) with MVCC (snapshot-based, better for read-heavy workloads).',
  },
  // Note 4: Compilers
  {
    quickSummary: 'Explains compiler front-end phases: lexical analysis (tokenization via DFAs), parsing (LL top-down vs LR bottom-up), and semantic analysis (type checking, symbol tables).',
    detailedSummary: 'This note covers the three phases of compiler front-end processing. Lexical analysis converts raw character streams into tokens (keywords, identifiers, literals, operators, delimiters) using finite automata derived from regular expressions. Parsing transforms the token stream into an Abstract Syntax Tree (AST) using context-free grammars. Top-down parsing (LL, recursive descent) starts from the start symbol; bottom-up parsing (LR family: LR(0), SLR, LALR(1)) starts from input and reduces to the start symbol. LALR(1) is identified as the practical sweet spot. Semantic analysis enforces rules beyond grammar: type checking (operand compatibility, return types), symbol tables (mapping identifiers to declarations across scopes), and other checks (declaration before use, break/continue placement). The note briefly covers the back end: IR generation, optimization passes, and code generation with register allocation.',
  },
  // Note 5: Neural Networks
  {
    quickSummary: 'Overview of neural network architectures: perceptrons, feedforward networks, activation functions, backpropagation, CNNs, RNNs/LSTMs, and transformers.',
    detailedSummary: 'This research note surveys deep learning architectures from biological inspiration to modern transformers. It begins with the perceptron and its limitation (cannot learn XOR), then covers feedforward networks with key activation functions (sigmoid, tanh, ReLU, GELU) and the universal approximation theorem. Training is explained through backpropagation and gradient descent variants (batch, SGD, mini-batch, Adam), with discussion of challenges like vanishing/exploding gradients and overfitting. CNNs are covered for spatial data (convolutional layers, pooling, feature hierarchies, architectures from LeNet to EfficientNet). RNNs and LSTMs handle sequential data with gating mechanisms. The note concludes with transformers, highlighting self-attention as the key innovation that enables parallel processing of sequences, with BERT for understanding and GPT for generation.',
  },
  // Note 6: Distributed Systems
  {
    quickSummary: 'Explains the CAP theorem (consistency vs availability during partitions), consistency models (linearizability to eventual), and consensus protocols (Paxos, Raft).',
    detailedSummary: 'This research note explores the fundamental trade-offs in distributed systems. The CAP theorem is explained as forcing a choice between consistency (CP) and availability (AP) during network partitions, with real-world examples of each category. Consistency models are presented as a spectrum: strong consistency (linearizability), sequential consistency, causal consistency, and eventual consistency — each with progressively weaker guarantees but better performance characteristics. Consensus protocols are covered in depth: Paxos (proposer-acceptor-learner roles, majority agreement) and Raft (leader election, log replication, safety guarantees). The note includes a comparison table of real-world systems (Spanner, DynamoDB, Cassandra, etcd) and their consistency trade-offs. Raft is highlighted as directly relevant to the group project.',
  },
  // Note 7: Cryptography
  {
    quickSummary: 'Covers symmetric (AES) and asymmetric (RSA, ECC) cryptography, digital signatures, PKI certificate chains, and TLS 1.3 handshake with forward secrecy.',
    detailedSummary: 'This research note covers the cryptographic foundations of internet security. Symmetric cryptography (AES) is fast but requires shared keys. Asymmetric cryptography (RSA based on prime factoring difficulty, ECC based on elliptic curve discrete logarithm) solves key distribution with public/private key pairs. RSA key generation is explained step by step. ECC achieves equivalent security with smaller keys (256-bit ECC ≈ 3072-bit RSA). Digital signatures (RSA-PSS, ECDSA, EdDSA) provide authentication, integrity, and non-repudiation. PKI is explained through the certificate chain of trust (root CA → intermediate CA → end-entity) with X.509 certificate contents and revocation mechanisms (CRL, OCSP). TLS 1.3 handshake is covered in detail: 1-RTT establishment, 0-RTT resumption, and mandatory forward secrecy via ephemeral Diffie-Hellman.',
  },
  // Note 8: Quantum Computing
  {
    quickSummary: 'Introduces quantum computing concepts: qubits, superposition, entanglement, quantum gates, Grover\'s search algorithm (quadratic speedup), and Shor\'s factoring algorithm.',
    detailedSummary: 'This research note introduces quantum computing fundamentals. Qubits are represented as superpositions of |0⟩ and |1⟩ states with complex probability amplitudes. Superposition allows n qubits to represent 2^n states simultaneously, created by Hadamard gates. Entanglement (Bell states) creates correlations stronger than any classical correlation. Quantum gates (Pauli-X, Hadamard, CNOT, Toffoli, phase gates) perform unitary transformations. Grover\'s algorithm is explained in detail: initialization, oracle marking, amplitude amplification via diffusion, repeated √N times for quadratic speedup over classical search. Applications include database search and halving symmetric cipher security (motivating AES-256 for post-quantum security). Shor\'s algorithm for polynomial-time integer factoring is briefly covered as the primary threat to RSA. The current NISQ era is discussed with its limitations.',
  },
  // Note 9: Graph Algorithms
  {
    quickSummary: 'Compares shortest path algorithms: Dijkstra (non-negative weights, greedy), Bellman-Ford (negative weights, cycle detection), and A* (heuristic-guided single-target search).',
    detailedSummary: 'This research note covers three fundamental shortest path algorithms. Graph representations (adjacency list vs matrix) are compared for space efficiency. Dijkstra\'s algorithm uses a priority queue to greedily select the nearest unvisited vertex, achieving O((V+E) log V) with a binary heap, but requires non-negative edge weights. Bellman-Ford relaxes all edges V-1 times for O(V*E) complexity, handles negative weights, and can detect negative-weight cycles (useful for arbitrage detection). A* extends Dijkstra with a heuristic function h(v) estimating cost to the goal, requiring admissibility and consistency for optimality. Common heuristics (Euclidean, Manhattan, Haversine) are discussed. A comparison table evaluates all three on edge weight support, target type, complexity, and heuristic requirements. Bidirectional search is introduced as an optimization for point-to-point queries.',
  },
];

// ─── SECTION 4: Friends' Shared Notes (30 total — 5 per friend) ─────────────

const friendNotes = {
  alexchen_cs: [
    {
      title: 'Big-O Complexity Guide',
      tags: ['algorithms', 'big-o', 'complexity'],
      subject: 'CS 211',
      content: `# Big-O Complexity Guide

## Why Big-O Matters

Big-O notation describes how an algorithm's runtime or memory usage grows relative to input size. It gives us a language to compare algorithms independent of hardware. When someone says "binary search is O(log n)," they are saying the number of steps grows logarithmically with the input — doubling the input adds just one more step.

## Common Complexities

### O(1) — Constant
Runtime does not depend on input size. Array access by index, hash map lookup (average case), stack push/pop. These are the gold standard.

### O(log n) — Logarithmic
Halving the search space each step. Binary search, balanced BST operations. Extremely efficient even for massive inputs — log2(1 billion) is only about 30.

### O(n) — Linear
Process each element once. Linear search, finding max/min, single-pass array algorithms. The baseline for problems that require examining all data.

### O(n log n) — Linearithmic
Divide-and-conquer algorithms. Merge sort, heap sort, quicksort (average case). This is the theoretical lower bound for comparison-based sorting.

### O(n²) — Quadratic
Nested loops over the input. Bubble sort, selection sort, brute-force pair comparisons. Acceptable for n < 10,000, problematic beyond that.

### O(2^n) — Exponential
Brute-force search of all subsets. Naive recursive Fibonacci, power set generation. Quickly becomes impractical — 2^30 is already over a billion.

## How to Analyze

1. Identify the dominant operation (comparison, assignment, recursive call)
2. Count how many times it executes as a function of n
3. Drop constants and lower-order terms
4. Consider best, average, and worst cases separately

## Space Complexity

Do not forget space. An algorithm that runs in O(n) time but uses O(n²) space may be impractical. In-place algorithms (O(1) extra space) are often preferred. Recursive algorithms use O(depth) space on the call stack.

## Amortized Analysis

Some operations are expensive occasionally but cheap on average. Dynamic array resizing: most insertions are O(1), but occasionally the array doubles and copies all elements O(n). Amortized over n insertions, each insertion is O(1). Three methods: aggregate, accounting, and potential.`,
    },
    {
      title: 'Sorting Algorithms Comparison',
      tags: ['algorithms', 'sorting'],
      subject: 'CS 211',
      content: `# Sorting Algorithms Comparison

## Overview

Sorting is one of the most fundamental operations in computer science. Different algorithms make different trade-offs between time complexity, space usage, stability, and cache performance. Choosing the right sort depends on data characteristics and constraints.

## Comparison-Based Sorts

### Merge Sort
- Time: O(n log n) — all cases
- Space: O(n) auxiliary
- Stable: Yes
- Approach: divide array in half, recursively sort each half, merge sorted halves
- Strengths: guaranteed O(n log n), stable, good for linked lists
- Weaknesses: O(n) extra space, not in-place

### Quick Sort
- Time: O(n log n) average, O(n²) worst case
- Space: O(log n) for call stack
- Stable: No
- Approach: choose pivot, partition around pivot, recurse on each side
- Strengths: excellent cache locality, fast in practice, in-place
- Weaknesses: O(n²) with bad pivots (mitigated by random pivot or median-of-three)

### Heap Sort
- Time: O(n log n) — all cases
- Space: O(1)
- Stable: No
- Approach: build max-heap, repeatedly extract maximum
- Strengths: in-place, guaranteed O(n log n)
- Weaknesses: poor cache locality, higher constant factors than quicksort

### Insertion Sort
- Time: O(n²) worst, O(n) best (nearly sorted data)
- Space: O(1)
- Stable: Yes
- Approach: insert each element into its correct position in the sorted portion
- Strengths: excellent for small arrays and nearly sorted data, simple to implement
- Used as base case in hybrid sorts (Timsort uses it for small runs)

## Non-Comparison Sorts

### Counting Sort
O(n + k) time and space where k is the range of values. Stable. Works only for integers in a known range.

### Radix Sort
O(d * (n + k)) where d is the number of digits. Processes digits from least significant to most significant using a stable sort (counting sort) at each level.

## Practical Considerations

Most language standard libraries use hybrid algorithms: Timsort (Python, Java) combines merge sort and insertion sort. C++ std::sort uses Introsort (quicksort + heapsort fallback). Choose the algorithm based on your data: nearly sorted? insertion sort. Need stability? merge sort or Timsort. Memory constrained? heap sort.`,
    },
    {
      title: 'Binary Search Trees Deep Dive',
      tags: ['data-structures', 'trees', 'bst'],
      subject: 'CS 211',
      content: `# Binary Search Trees Deep Dive

## BST Property

A binary search tree maintains the invariant: for every node, all values in its left subtree are smaller and all values in its right subtree are larger. This enables O(log n) search, insert, and delete — but only if the tree is balanced.

## Operations

### Search
Start at root. If target equals current node, found. If target is smaller, go left. If larger, go right. Repeat until found or reach a null pointer.

### Insert
Search for the insert position (where you would find the value if it existed). Create a new leaf node at that position. Time: O(h) where h is the height.

### Delete
Three cases:
1. **Leaf node**: simply remove it
2. **One child**: replace the node with its child
3. **Two children**: find the in-order successor (smallest node in right subtree), copy its value to the current node, then delete the successor (which has at most one child)

## The Balance Problem

An unbalanced BST can degenerate into a linked list. Inserting sorted data [1, 2, 3, 4, 5] creates a chain where every operation is O(n). This is why self-balancing trees exist.

## AVL Trees

AVL trees maintain a balance factor (height difference between left and right subtrees) of at most 1 for every node. After each insert or delete, check balance factors up the path to the root and perform rotations to restore balance.

Rotations: Left rotation, right rotation, left-right (double), right-left (double). Each takes O(1). Total rebalancing per operation: O(log n) in the worst case.

AVL trees are strictly balanced, making them slightly faster for lookups than red-black trees, but insertions and deletions may require more rotations.

## Red-Black Trees

Red-black trees maintain balance through coloring rules: every node is red or black, the root is black, no two consecutive red nodes, and every path from root to null has the same number of black nodes.

Insertions require at most 2 rotations. Deletions require at most 3 rotations. This makes red-black trees preferred for workloads with many insertions and deletions. Java TreeMap and C++ std::map use red-black trees.

## B-Trees and B+ Trees

B-trees generalize BSTs to have multiple keys per node and multiple children. B+ trees store all values in leaf nodes. Both are used extensively in database indexing and file systems because their high branching factor minimizes disk I/O.`,
    },
    {
      title: 'Recursion Patterns',
      tags: ['algorithms', 'recursion'],
      subject: 'CS 211',
      content: `# Recursion Patterns

## Thinking Recursively

Recursion solves problems by breaking them into smaller instances of the same problem. Every recursive solution needs two things: a base case (when to stop) and a recursive case (how to reduce). The trick is trusting that the recursive call handles the subproblem correctly — you only need to think about one level at a time.

## Pattern 1: Linear Recursion

Process one element and recurse on the rest. Classic examples: factorial, sum of array, string reversal.

\`\`\`
factorial(n) = n * factorial(n-1)
base case: factorial(0) = 1
\`\`\`

Each call does O(1) work, depth is O(n), total time O(n). Can always be converted to a simple loop (tail recursion optimization).

## Pattern 2: Divide and Conquer

Split the problem in half, solve each half recursively, combine results. Examples: merge sort, binary search, maximum subarray.

\`\`\`
mergeSort(arr) = merge(mergeSort(left), mergeSort(right))
base case: array of length 0 or 1
\`\`\`

Time complexity follows the Master Theorem: T(n) = aT(n/b) + O(n^d). For merge sort: a=2, b=2, d=1, so T(n) = O(n log n).

## Pattern 3: Tree Recursion

Make multiple recursive calls at each step, creating a tree-shaped call graph. Examples: Fibonacci (naive), generating permutations, parsing expressions.

Tree recursion often leads to exponential time if subproblems overlap (Fibonacci). The fix: memoization converts tree recursion to linear recursion by caching results.

## Pattern 4: Backtracking

Explore choices incrementally, abandoning (backtracking) a choice as soon as it violates constraints. Examples: N-queens, Sudoku solver, generating all subsets.

\`\`\`
backtrack(state):
  if state is a solution: record it
  for each choice:
    if choice is valid:
      make choice
      backtrack(new state)
      undo choice  // backtrack
\`\`\`

Backtracking prunes the search space compared to brute force. The earlier you can detect invalid states, the more efficient the pruning.

## Pattern 5: Accumulator Pattern

Pass an accumulator parameter that builds up the result. Enables tail recursion, which compilers can optimize into iteration.

\`\`\`
sum(arr, i, acc):
  if i == arr.length: return acc
  return sum(arr, i+1, acc + arr[i])
\`\`\`

## Common Mistakes
- Forgetting the base case (infinite recursion, stack overflow)
- Not reducing the problem size (infinite recursion)
- Duplicating work (use memoization for overlapping subproblems)
- Using recursion when iteration is simpler and more efficient`,
    },
    {
      title: 'C++ vs Java for Interviews',
      tags: ['interviews', 'c++', 'java'],
      subject: 'Career',
      content: `# C++ vs Java for Interviews

## The Choice

Both C++ and Java are widely accepted in technical interviews. The right choice depends on your comfort level and the specific strengths of each language for competitive programming and interview problems.

## C++ Advantages

### Standard Template Library (STL)
C++ STL is exceptionally powerful for competitive programming:
- \`vector\`, \`deque\`, \`list\` for sequences
- \`set\`, \`map\` (red-black tree based, ordered)
- \`unordered_set\`, \`unordered_map\` (hash-based)
- \`priority_queue\`, \`stack\`, \`queue\`
- \`sort\`, \`binary_search\`, \`lower_bound\`, \`upper_bound\`
- \`next_permutation\` for permutation problems

### Performance
C++ is faster than Java. For problems with tight time limits, C++ gives you more room. Memory management is more explicit but also more controllable.

### Brevity
C++ code tends to be shorter for algorithm problems. Macros and typedefs (though discouraged in production) can speed up contest coding.

## Java Advantages

### Safety
No pointer arithmetic, no segfaults, no undefined behavior. Garbage collection handles memory. You spend less time debugging crashes and more time thinking about the algorithm.

### Rich Collections
Java Collections Framework is well-designed:
- \`ArrayList\`, \`LinkedList\`
- \`HashMap\`, \`TreeMap\` (sorted), \`LinkedHashMap\` (insertion order)
- \`HashSet\`, \`TreeSet\`
- \`PriorityQueue\` (min-heap by default)
- \`Collections.sort\`, \`Arrays.sort\`

### BigInteger
Java has built-in BigInteger for arbitrary precision arithmetic. C++ requires external libraries or manual implementation.

### String Handling
Java strings are immutable with excellent built-in methods. StringBuilder for efficient concatenation. C++ string manipulation requires more care.

## Interview-Specific Tips

### C++
- Use \`auto\` to reduce verbosity
- \`emplace_back\` over \`push_back\` for efficiency
- Pass large objects by const reference
- Use \`pair\` and \`tuple\` for multi-value returns

### Java
- Always use \`StringBuilder\` in loops (not string concatenation)
- \`Arrays.sort\` uses dual-pivot quicksort for primitives, Timsort for objects
- \`Comparator.comparingInt\` for clean custom sorting
- \`Map.getOrDefault\` eliminates null checks

## My Recommendation

Use whichever language you can write quickly and debug confidently. For pure algorithm problems, C++ has a slight edge. For system design code, Java is often cleaner. I use C++ for competitive programming and Java for longer interview coding sessions.`,
    },
  ],

  mayapatel_ds: [
    {
      title: 'Pandas & NumPy Cheat Sheet',
      tags: ['python', 'pandas', 'numpy'],
      subject: 'Data Science Tools',
      content: `# Pandas & NumPy Cheat Sheet

## NumPy Essentials

NumPy is the foundation of the Python data science stack. Its core object is the ndarray — a fixed-type, contiguous-memory array that enables vectorized operations orders of magnitude faster than Python lists.

### Array Creation
\`\`\`python
np.array([1, 2, 3])           # from list
np.zeros((3, 4))              # 3x4 matrix of zeros
np.ones((2, 3))               # 2x3 matrix of ones
np.arange(0, 10, 0.5)         # evenly spaced values
np.linspace(0, 1, 100)        # 100 points between 0 and 1
np.random.randn(3, 3)         # 3x3 standard normal random
np.eye(4)                     # 4x4 identity matrix
\`\`\`

### Key Operations
\`\`\`python
arr.shape, arr.dtype, arr.ndim
arr.reshape(3, -1)            # reshape (infer one dimension)
arr.T                         # transpose
np.dot(A, B) or A @ B         # matrix multiplication
arr[arr > 0]                  # boolean indexing
np.where(condition, x, y)     # conditional selection
\`\`\`

### Broadcasting
NumPy automatically expands dimensions to match shapes during operations. A (3,1) array can be added to a (1,4) array to produce a (3,4) result. Understanding broadcasting rules is essential for writing efficient vectorized code.

## Pandas Essentials

Pandas builds on NumPy with DataFrames (2D labeled data) and Series (1D labeled data). It is the workhorse for data loading, cleaning, transformation, and analysis.

### Data Loading
\`\`\`python
df = pd.read_csv('data.csv')
df = pd.read_json('data.json')
df = pd.read_sql(query, connection)
\`\`\`

### Exploration
\`\`\`python
df.head(), df.tail(), df.info(), df.describe()
df.shape, df.columns, df.dtypes
df.isnull().sum()             # count missing values per column
df.value_counts('column')     # frequency counts
\`\`\`

### Selection and Filtering
\`\`\`python
df['col']                     # select column (Series)
df[['col1', 'col2']]          # select multiple columns
df.loc[row_label, col_label]  # label-based selection
df.iloc[row_idx, col_idx]     # integer-based selection
df[df['age'] > 25]            # boolean filtering
df.query('age > 25 and city == "NYC"')  # query syntax
\`\`\`

### GroupBy and Aggregation
\`\`\`python
df.groupby('category')['sales'].mean()
df.groupby(['year', 'month']).agg({'sales': 'sum', 'customers': 'count'})
df.pivot_table(values='sales', index='region', columns='quarter', aggfunc='sum')
\`\`\`

### Common Cleaning Operations
\`\`\`python
df.dropna()                   # drop rows with missing values
df.fillna(0)                  # fill missing values
df.drop_duplicates()          # remove duplicate rows
df['col'].astype(float)       # type conversion
df.rename(columns={'old': 'new'})
\`\`\`

Pro tip: chain operations with method chaining for readable data pipelines. Use \`.pipe()\` for custom functions in the chain.`,
    },
    {
      title: 'Statistics for ML',
      tags: ['statistics', 'machine-learning'],
      subject: 'Data Science',
      content: `# Statistics for Machine Learning

## Why Statistics Matters for ML

Machine learning is applied statistics. Every ML model makes assumptions about data distributions, and understanding these assumptions is crucial for choosing the right model, interpreting results, and avoiding common pitfalls.

## Descriptive Statistics

### Central Tendency
- **Mean**: arithmetic average — sensitive to outliers
- **Median**: middle value — robust to outliers, preferred for skewed distributions
- **Mode**: most frequent value — useful for categorical data

### Dispersion
- **Variance**: average squared deviation from mean
- **Standard Deviation**: square root of variance, in original units
- **IQR** (Interquartile Range): Q3 - Q1, robust measure of spread

### Distribution Shape
- **Skewness**: asymmetry (positive = right tail, negative = left tail)
- **Kurtosis**: tail heaviness relative to normal distribution

## Probability Distributions

### Normal (Gaussian)
Bell-shaped, defined by mean μ and standard deviation σ. Central limit theorem: sample means approach normality as sample size increases, regardless of the population distribution. Many ML algorithms assume normally distributed features or residuals.

### Bernoulli and Binomial
Bernoulli: single trial with probability p. Binomial: n independent Bernoulli trials. Foundation of logistic regression and classification.

### Poisson
Models count of events in a fixed interval. Assumption: events are independent and occur at a constant rate. Used for rare event modeling.

## Hypothesis Testing

### Framework
1. State null hypothesis H0 and alternative H1
2. Choose significance level α (typically 0.05)
3. Compute test statistic and p-value
4. Reject H0 if p-value < α

### Common Tests
- **t-test**: compare means (one-sample, two-sample, paired)
- **Chi-squared test**: test independence of categorical variables
- **ANOVA**: compare means across 3+ groups

### p-value Misunderstandings
The p-value is NOT the probability that H0 is true. It is the probability of observing data as extreme as ours if H0 were true. A low p-value means the data is unlikely under H0, not that H1 is proven.

## Bayesian Statistics

Bayes' theorem: P(A|B) = P(B|A) * P(A) / P(B)

Bayesian thinking updates prior beliefs with observed data to produce posterior beliefs. It is the foundation of Naive Bayes classifiers, Bayesian optimization, and probabilistic programming.

## Key Concepts for ML
- **Bias-Variance Tradeoff**: simple models underfit (high bias), complex models overfit (high variance)
- **Cross-Validation**: k-fold CV gives unbiased estimate of model performance
- **Regularization**: L1 (Lasso) promotes sparsity, L2 (Ridge) reduces coefficient magnitudes
- **Feature scaling**: standardization (z-score) or normalization (min-max) — critical for distance-based algorithms`,
    },
    {
      title: 'Data Visualization Best Practices',
      tags: ['visualization', 'data-science'],
      subject: 'Data Science',
      content: `# Data Visualization Best Practices

## Why Visualization Matters

"The greatest value of a picture is when it forces us to notice what we never expected to see." — John Tukey. Visualization is not just about making pretty charts. It is about communicating data insights clearly and honestly. A good visualization reveals patterns, trends, and outliers that tables of numbers cannot.

## Choosing the Right Chart

### For Comparisons
- **Bar chart**: compare categories (horizontal bars for many categories)
- **Grouped bar chart**: compare categories across groups
- **Dot plot**: cleaner alternative to bar chart for many categories

### For Distributions
- **Histogram**: show frequency distribution (choose bin size carefully)
- **Box plot**: show median, quartiles, and outliers (great for comparisons)
- **Violin plot**: combines box plot with density estimate (shows shape)
- **KDE (Kernel Density Estimate)**: smooth version of histogram

### For Relationships
- **Scatter plot**: two continuous variables (add color/size for more dimensions)
- **Heatmap**: correlation matrices, 2D distributions
- **Pair plot**: scatter matrix for exploring multi-variable relationships

### For Trends Over Time
- **Line chart**: time series data (one or multiple series)
- **Area chart**: stacked areas show composition over time

### For Proportions
- **Pie chart**: almost never. Humans are bad at comparing angles. Use a bar chart instead.
- **Stacked bar chart**: better for part-to-whole comparisons

## Design Principles

### Data-Ink Ratio
Edward Tufte's principle: maximize the share of ink used to present data. Remove chartjunk: unnecessary gridlines, 3D effects, decorative elements. Every pixel should serve a purpose.

### Color
- Use colorblind-friendly palettes (viridis, ColorBrewer)
- Sequential palette for ordered data (light to dark)
- Diverging palette for data with a meaningful center (red-white-blue)
- Categorical palette for unordered groups (max 7-8 distinct colors)

### Labels and Context
- Always label axes with units
- Add a clear, descriptive title
- Include data source
- Annotate key points or anomalies
- Use consistent scales when comparing across panels

## Python Libraries

- **Matplotlib**: foundation, maximum control, verbose syntax
- **Seaborn**: statistical visualization, beautiful defaults, built on matplotlib
- **Plotly**: interactive plots, great for dashboards and web
- **Altair**: declarative grammar of graphics, concise syntax

## Common Mistakes

- Truncated y-axes that exaggerate differences
- Dual y-axes that mislead about correlation
- Using 3D when 2D suffices (3D adds visual complexity without information)
- Cherry-picking date ranges to support a narrative
- Ignoring confounding variables in scatter plots`,
    },
    {
      title: 'Linear Regression Explained',
      tags: ['statistics', 'regression', 'ml'],
      subject: 'Data Science',
      content: `# Linear Regression Explained

## What Is Linear Regression?

Linear regression models the relationship between a dependent variable (target) and one or more independent variables (features) by fitting a linear equation. It is the simplest and most interpretable supervised learning algorithm, and understanding it deeply is essential because many advanced methods are extensions of it.

## Simple Linear Regression

For one feature: y = β₀ + β₁x + ε, where β₀ is the intercept, β₁ is the slope, and ε is the error term.

The goal: find β₀ and β₁ that minimize the sum of squared residuals (SSR):
SSR = Σ(yᵢ - ŷᵢ)² = Σ(yᵢ - β₀ - β₁xᵢ)²

The closed-form solution (ordinary least squares, OLS): β₁ = Cov(x,y) / Var(x) and β₀ = ȳ - β₁x̄.

## Multiple Linear Regression

For p features: y = β₀ + β₁x₁ + β₂x₂ + ... + βₚxₚ + ε. In matrix form: y = Xβ + ε. The OLS solution: β = (XᵀX)⁻¹Xᵀy.

## Assumptions

Linear regression assumes:
1. **Linearity**: relationship between features and target is linear
2. **Independence**: observations are independent of each other
3. **Homoscedasticity**: constant variance of residuals
4. **Normality**: residuals are normally distributed
5. **No multicollinearity**: features are not highly correlated with each other

Violating these assumptions can lead to biased or inefficient estimates. Always check residual plots and VIF (Variance Inflation Factor) for multicollinearity.

## Evaluation Metrics

- **R² (Coefficient of Determination)**: proportion of variance explained. R² = 1 - SSR/SST. Ranges from 0 (no explanatory power) to 1 (perfect fit). Adjusted R² penalizes for adding irrelevant features.
- **MSE / RMSE**: mean squared error, root mean squared error — in target units
- **MAE**: mean absolute error — less sensitive to outliers than MSE

## Regularization

When features are many or correlated, OLS overfits. Regularization adds a penalty to the loss function:
- **Ridge (L2)**: adds λΣβⱼ² — shrinks coefficients toward zero, keeps all features
- **Lasso (L1)**: adds λΣ|βⱼ| — drives some coefficients to exactly zero (feature selection)
- **Elastic Net**: combines L1 and L2 penalties

The hyperparameter λ controls regularization strength. Higher λ means more regularization (simpler model, higher bias, lower variance).

## Practical Tips

- Always standardize features before regularized regression
- Use cross-validation to select λ
- Check for outliers and influential points (Cook's distance)
- Consider polynomial features for non-linear relationships
- If assumptions are violated, consider generalized linear models (GLMs)`,
    },
    {
      title: 'Python for Data Analysis',
      tags: ['python', 'data-analysis'],
      subject: 'Data Science',
      content: `# Python for Data Analysis

## The Python Data Science Stack

Python has become the dominant language for data analysis. The key libraries form a cohesive ecosystem: NumPy for numerical computing, pandas for data manipulation, matplotlib/seaborn for visualization, scikit-learn for machine learning, and Jupyter notebooks for interactive exploration.

## Jupyter Notebooks

Jupyter is the de facto environment for data analysis. Each notebook contains cells that can be code, markdown, or raw text. Key shortcuts:
- Shift+Enter: run cell and move to next
- Ctrl+Enter: run cell and stay
- B: insert cell below, A: insert cell above
- DD: delete cell, Z: undo delete

Notebooks are great for exploration but poor for production code. For larger projects, refactor analysis code into .py modules and use notebooks for visualization and reporting only.

## Data Loading Patterns

\`\`\`python
# CSV with custom settings
df = pd.read_csv('data.csv', parse_dates=['date'], index_col='id', na_values=['N/A', ''])

# Multiple files
import glob
files = glob.glob('data/*.csv')
df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)

# SQL database
from sqlalchemy import create_engine
engine = create_engine('postgresql://user:pass@host:5432/db')
df = pd.read_sql('SELECT * FROM table WHERE date > %s', engine, params=['2025-01-01'])
\`\`\`

## Data Cleaning Pipeline

Every dataset is dirty. A typical cleaning pipeline:

1. **Inspect**: shape, dtypes, null counts, unique values per column
2. **Handle missing data**: drop, fill (mean/median/mode), or interpolate. Document your choice and reasoning.
3. **Fix types**: dates as datetime, categories as category dtype (saves memory)
4. **Handle outliers**: IQR method (Q1 - 1.5*IQR, Q3 + 1.5*IQR), z-score, or domain knowledge
5. **Deduplicate**: identify duplicates by key columns, keep first/last/neither
6. **Validate**: check value ranges, referential integrity, business rules

## Feature Engineering

Transform raw data into features that improve model performance:
- **Binning**: convert continuous to categorical (age ranges, price tiers)
- **Log transform**: reduce skewness, handle multiplicative relationships
- **One-hot encoding**: convert categorical to binary columns
- **Interaction features**: multiply features that have combined effects
- **Date features**: extract year, month, day of week, is_weekend

## Performance Tips

- Use vectorized pandas operations instead of loops (100x faster)
- Use categorical dtype for string columns with few unique values (saves 90% memory)
- Use chunked reading for large files: pd.read_csv(file, chunksize=10000)
- Profile with %timeit and memory_profiler
- Consider Polars for large datasets — it is faster than pandas for many operations`,
    },
  ],

  jordanwilliams: [
    {
      title: 'Digital Logic & Circuit Design',
      tags: ['digital-logic', 'circuits', 'hardware'],
      subject: 'Computer Engineering',
      content: `# Digital Logic & Circuit Design

## Boolean Algebra Fundamentals

Digital circuits operate on binary values (0 and 1). Boolean algebra provides the mathematical foundation for designing and analyzing these circuits.

### Basic Gates
- **AND**: output is 1 only if all inputs are 1. Symbol: A · B
- **OR**: output is 1 if any input is 1. Symbol: A + B
- **NOT**: inverts the input. Symbol: A̅ or ¬A
- **NAND**: NOT-AND — output is 0 only if all inputs are 1. Universal gate.
- **NOR**: NOT-OR — output is 0 if any input is 1. Universal gate.
- **XOR**: output is 1 if inputs differ. Essential for arithmetic.

### Key Laws
- De Morgan's: (A · B)' = A' + B' and (A + B)' = A' · B'
- Distributive: A · (B + C) = A·B + A·C
- Absorption: A + A·B = A
- Complement: A + A' = 1, A · A' = 0

## Combinational Circuits

Outputs depend only on current inputs (no memory). Designed using truth tables and Karnaugh maps for minimization.

### Multiplexer (MUX)
Selects one of multiple inputs based on select lines. A 4:1 MUX uses 2 select bits to choose among 4 data inputs. MUXes can implement any boolean function.

### Decoder
Converts n-bit binary input to 2^n output lines, exactly one active. Used in memory addressing and instruction decoding.

### Adder
- **Half adder**: adds two bits, produces sum and carry
- **Full adder**: adds three bits (including carry-in), produces sum and carry-out
- **Ripple carry adder**: chain full adders; simple but slow (carry propagates through all stages)
- **Carry lookahead adder**: computes carries in parallel; faster but more gates

## Sequential Circuits

Outputs depend on current inputs AND stored state (memory). Built from flip-flops.

### Flip-Flops
- **SR flip-flop**: set/reset, invalid state when both are 1
- **D flip-flop**: stores input on clock edge — most common in modern designs
- **JK flip-flop**: like SR but toggles when both inputs are 1
- **T flip-flop**: toggles state on each clock edge — used in counters

### Finite State Machines (FSMs)
FSMs model sequential behavior with states, transitions, inputs, and outputs. Moore machines produce output based on state only. Mealy machines produce output based on state and current input.

## FPGA vs ASIC

FPGAs (Field-Programmable Gate Arrays) are reconfigurable — you can reprogram the circuit. Slower and less power-efficient than ASICs (Application-Specific Integrated Circuits), which are custom-manufactured. FPGAs are used for prototyping, low-volume production, and applications needing updates.`,
    },
    {
      title: 'Embedded Systems with Arduino',
      tags: ['embedded', 'arduino', 'hardware'],
      subject: 'Computer Engineering',
      content: `# Embedded Systems with Arduino

## What Are Embedded Systems?

An embedded system is a computer designed for a specific function within a larger system. Unlike general-purpose computers, embedded systems have constraints: limited memory, processing power, and power budget. They are everywhere — your car has dozens, your microwave has one, and your phone has several.

## Arduino Platform

Arduino is an open-source electronics platform with a microcontroller (typically ATmega328P), digital and analog I/O pins, and a simple IDE. It is an excellent learning platform because it abstracts away much of the complexity of bare-metal embedded programming.

### Pin Types
- **Digital pins (0-13)**: read or write HIGH (5V) or LOW (0V)
- **PWM pins (~3, 5, 6, 9, 10, 11)**: simulate analog output using pulse-width modulation
- **Analog pins (A0-A5)**: read analog voltages (0-5V), 10-bit ADC (0-1023)

### Core Functions
\`\`\`cpp
pinMode(pin, INPUT/OUTPUT)     // configure pin direction
digitalWrite(pin, HIGH/LOW)    // set digital output
digitalRead(pin)               // read digital input
analogWrite(pin, 0-255)        // PWM output (duty cycle)
analogRead(pin)                // read analog input (0-1023)
delay(ms)                      // pause execution
millis()                       // time since program start
\`\`\`

## Common Peripherals

### Sensors
- **Temperature (DHT11/22)**: digital output, measures temp and humidity
- **Ultrasonic (HC-SR04)**: measures distance using sound waves (2-400cm)
- **PIR motion detector**: detects infrared radiation changes (movement)
- **Photoresistor (LDR)**: resistance changes with light intensity

### Actuators
- **LEDs**: digital output, PWM for dimming
- **Servo motors**: precise angular positioning (0-180 degrees)
- **DC motors**: continuous rotation, controlled via H-bridge (L298N)
- **Buzzers**: tone generation using PWM

## Communication Protocols

### UART (Serial)
Point-to-point, asynchronous. TX and RX pins. Simple but only connects two devices. Used for debugging (Serial.print) and GPS modules.

### I²C
Two-wire (SDA, SCL), supports multiple devices on one bus. Each device has a unique address. Good for sensors and displays. Up to 127 devices, but slower than SPI.

### SPI
Four-wire (MOSI, MISO, SCK, SS), faster than I2C. Full-duplex. Each device needs its own slave select line, so more wires for more devices. Used for SD cards, displays, and high-speed sensors.

## Best Practices
- Use interrupts instead of polling for time-critical events
- Avoid delay() in complex programs — use millis() for non-blocking timing
- Debounce button inputs (hardware RC filter or software timer)
- Use watchdog timer to recover from crashes
- Keep ISRs (interrupt service routines) short and fast`,
    },
    {
      title: 'Memory Hierarchy and Caching',
      tags: ['memory', 'caching', 'architecture'],
      subject: 'Computer Engineering',
      content: `# Memory Hierarchy and Caching

## The Memory Problem

Processors are fast. Memory is slow. The gap between CPU speed and main memory access time has widened every decade. A modern CPU can execute an instruction in less than 1 nanosecond, but accessing DRAM takes 50-100 nanoseconds. Without caching, the CPU would spend most of its time waiting for data.

## The Hierarchy

| Level | Technology | Size | Latency | Cost/GB |
|-------|-----------|------|---------|---------|
| Registers | SRAM | ~1 KB | <1 ns | Highest |
| L1 Cache | SRAM | 32-64 KB | 1-2 ns | Very high |
| L2 Cache | SRAM | 256 KB-1 MB | 3-10 ns | High |
| L3 Cache | SRAM | 4-32 MB | 10-30 ns | Medium |
| Main Memory | DRAM | 8-64 GB | 50-100 ns | Low |
| SSD | Flash | 256 GB-4 TB | 25-100 μs | Very low |
| HDD | Magnetic | 1-20 TB | 3-10 ms | Lowest |

Each level is larger, slower, and cheaper than the level above it. The goal: keep frequently used data in the fastest levels.

## Cache Fundamentals

### Locality
Caching works because programs exhibit locality:
- **Temporal locality**: recently accessed data is likely to be accessed again soon
- **Spatial locality**: data near recently accessed data is likely to be accessed soon

### Cache Organization
A cache is divided into sets, each containing one or more lines (blocks). A memory address maps to a specific set, and the data occupies a line within that set.

**Direct-mapped**: each memory block maps to exactly one cache line. Simple but suffers from conflict misses.

**Set-associative**: each block maps to a set of N lines (N-way). Reduces conflict misses. 4-way and 8-way are common.

**Fully associative**: a block can go in any cache line. No conflict misses but expensive to search.

### Cache Miss Types (The Three Cs)
- **Compulsory**: first access to a block (cold miss) — unavoidable
- **Capacity**: cache is too small to hold all needed data
- **Conflict**: multiple blocks map to the same set (direct-mapped and set-associative)

### Replacement Policies
When a cache set is full, which line do we evict?
- **LRU** (Least Recently Used): evict the line accessed longest ago. Best general-purpose policy.
- **Random**: surprisingly effective and simple to implement in hardware.
- **FIFO**: evict the oldest line. Simpler than LRU but can suffer from Belady's anomaly.

## Write Policies

**Write-through**: every write goes to cache AND main memory. Simple, consistent, but slow.

**Write-back**: writes go to cache only; dirty lines are written to memory on eviction. Faster for repeated writes but adds complexity (dirty bits, write-back buffer).

## Virtual Memory

Virtual memory extends the memory hierarchy to disk. Each process has its own virtual address space, mapped to physical memory by the OS and hardware (MMU + page tables). Pages not in physical memory are stored on disk (swap). The TLB (Translation Lookaside Buffer) caches recent virtual-to-physical translations.`,
    },
    {
      title: 'ARM Assembly Basics',
      tags: ['assembly', 'arm', 'low-level'],
      subject: 'Computer Engineering',
      content: `# ARM Assembly Basics

## Why Learn Assembly?

Assembly language gives you direct control over the hardware. Understanding assembly helps you write better high-level code, debug optimization issues, reverse engineer binaries, and appreciate what compilers do. ARM is the most widely used ISA by volume — billions of ARM chips ship annually in phones, tablets, and embedded devices.

## ARM Architecture Overview

ARM (Advanced RISC Machines) is a load-store architecture: arithmetic operates only on registers, and separate load/store instructions move data between registers and memory.

### Registers
ARM has 16 general-purpose 32-bit registers (R0-R15):
- R0-R3: function arguments and return value (R0)
- R4-R11: callee-saved (preserved across function calls)
- R12 (IP): intra-procedure scratch register
- R13 (SP): stack pointer
- R14 (LR): link register (return address)
- R15 (PC): program counter

### Condition Codes (CPSR)
N (Negative), Z (Zero), C (Carry), V (Overflow). Updated by comparison instructions and suffixed instructions (ADDS, SUBS).

## Instruction Categories

### Data Processing
\`\`\`asm
MOV R0, #42         @ R0 = 42
ADD R0, R1, R2      @ R0 = R1 + R2
SUB R3, R3, #1      @ R3 = R3 - 1
MUL R0, R1, R2      @ R0 = R1 * R2
AND R0, R1, R2      @ bitwise AND
ORR R0, R1, R2      @ bitwise OR
EOR R0, R1, R2      @ bitwise XOR
CMP R0, R1          @ compare (sets flags, no result stored)
\`\`\`

### Memory Access
\`\`\`asm
LDR R0, [R1]        @ load word from address in R1
STR R0, [R1]        @ store word to address in R1
LDR R0, [R1, #4]    @ load from R1 + 4 (offset)
LDR R0, [R1, #4]!   @ pre-indexed: R1 += 4, then load
LDR R0, [R1], #4    @ post-indexed: load, then R1 += 4
\`\`\`

### Branch
\`\`\`asm
B label              @ unconditional branch
BEQ label            @ branch if equal (Z flag set)
BNE label            @ branch if not equal
BL function          @ branch with link (function call, saves return addr in LR)
BX LR                @ return from function
\`\`\`

### Conditional Execution
ARM's unique feature: almost any instruction can be conditionally executed by adding a condition suffix. This avoids branch penalties.
\`\`\`asm
CMP R0, #0
MOVEQ R1, #1        @ R1 = 1 if R0 == 0
MOVNE R1, #0        @ R1 = 0 if R0 != 0
\`\`\`

## Stack and Function Calls

ARM calling convention (AAPCS): arguments in R0-R3, return value in R0, callee saves R4-R11.

\`\`\`asm
function:
    PUSH {R4-R6, LR}    @ save callee-saved registers and return address
    @ ... function body ...
    POP {R4-R6, PC}      @ restore registers and return (pop LR into PC)
\`\`\`

## ARM vs x86

ARM is RISC (fewer, simpler instructions, fixed-length), x86 is CISC (complex instructions, variable-length). ARM prioritizes power efficiency (mobile, embedded), x86 prioritizes raw performance (desktops, servers). Apple Silicon (M-series) has shown that ARM can match x86 performance while using less power.`,
    },
    {
      title: 'Hardware vs Software Tradeoffs',
      tags: ['career', 'engineering', 'hardware'],
      subject: 'Career',
      content: `# Hardware vs Software Tradeoffs

## My Perspective as a Senior in Computer Engineering

After four years studying both hardware and software, I have been thinking deeply about where to focus my career. This note captures my current thinking, not as a definitive answer but as a framework for making the decision.

## The Hardware Path

### What It Looks Like
Hardware engineering means designing physical systems: digital circuits, PCBs, embedded firmware, ASIC/FPGA design, or semiconductor devices. The work is tangible — you can hold what you built.

### Strengths
- Deep specialization creates high barriers to entry and strong job security
- Problems are deeply constrained by physics, which makes them intellectually satisfying
- The industry has longer product cycles, meaning less churn and more stability
- Competitive compensation, especially in semiconductor companies (Nvidia, AMD, Intel, Qualcomm)

### Challenges
- Mistakes are expensive — you cannot patch a chip after fabrication
- Iteration cycles are slow (weeks to months for hardware prototypes vs seconds for software)
- Fewer companies to work for compared to software
- Requires expensive tools and equipment (EDA tools, oscilloscopes, logic analyzers)
- Less flexibility in working remotely

## The Software Path

### What It Looks Like
Software engineering spans web development, systems programming, cloud infrastructure, mobile apps, ML/AI, and more. The work is abstract but has massive reach.

### Strengths
- Enormous market demand and job availability
- Fast iteration cycles (write, test, deploy in hours)
- Mistakes are usually fixable (deploy a patch, roll back)
- Remote work is standard in many companies
- Lower barrier to entry — a laptop and internet are enough to start
- Broader career optionality (switch between specializations more easily)

### Challenges
- Higher competition for entry-level positions
- Tech stack churn can be exhausting (new frameworks every year)
- Some problems feel less tangible (another CRUD app vs designing a processor)

## The Middle Ground: Embedded Systems and Systems Programming

This is where I find myself gravitating. Embedded systems sit at the intersection: you write software that runs on hardware you understand deeply. Systems programming (OS kernels, drivers, firmware, compilers) operates at the hardware-software boundary.

Companies like Apple, Tesla, SpaceX, and Nvidia need engineers who can think across the stack. Understanding both hardware constraints and software architecture is a rare and valuable combination.

## My Decision

I am leaning toward software engineering for my first role, specifically infrastructure or systems engineering. The faster iteration cycles and broader job market make it a practical first step. But I want to keep my hardware skills sharp and eventually move toward embedded systems or hardware-software co-design.

The engineering fundamentals transfer. What matters most early in your career is working on hard problems with good mentors. The specific domain matters less than the depth of the work.`,
    },
  ],

  priyasharma: [
    {
      title: 'Organic Chemistry Reaction Mechanisms',
      tags: ['organic-chemistry', 'reactions'],
      subject: 'Chemistry',
      content: `# Organic Chemistry Reaction Mechanisms

## Why Mechanisms Matter

Organic chemistry is not about memorizing hundreds of reactions. It is about understanding a handful of fundamental mechanisms and applying them to predict new reactions. If you understand how electrons move, you can figure out almost any reaction.

## The Four Fundamental Mechanisms

### SN1 (Substitution, Nucleophilic, Unimolecular)
1. The leaving group departs, forming a carbocation intermediate
2. The nucleophile attacks the carbocation

Rate = k[substrate]. Only depends on substrate concentration. Favored by: tertiary substrates (stable carbocations), weak nucleophiles, polar protic solvents. Product: racemic mixture (nucleophile can attack from either side).

### SN2 (Substitution, Nucleophilic, Bimolecular)
One concerted step: nucleophile attacks from the back as the leaving group departs. Rate = k[substrate][nucleophile]. Favored by: primary substrates (less steric hindrance), strong nucleophiles, polar aprotic solvents. Product: inversion of configuration (Walden inversion).

### E1 (Elimination, Unimolecular)
1. Leaving group departs, forming carbocation
2. Base removes a proton from the adjacent carbon, forming a double bond

Often competes with SN1. Favored by: tertiary substrates, weak bases, high temperature.

### E2 (Elimination, Bimolecular)
One concerted step: base removes proton as leaving group departs, forming double bond. Requires anti-periplanar geometry (proton and leaving group on opposite sides). Favored by: strong, bulky bases, primary or secondary substrates, high temperature.

## How to Predict Which Mechanism

| Substrate | Strong Nucleophile/Base | Weak Nucleophile/Base |
|-----------|------------------------|----------------------|
| Primary | SN2 (or E2 if bulky base) | SN2 (slow) |
| Secondary | SN2 or E2 (depends on base size) | SN1 or E1 |
| Tertiary | E2 | SN1 or E1 |

Temperature: higher temperature favors elimination over substitution.
Solvent: polar protic favors SN1/E1; polar aprotic favors SN2/E2.

## Functional Group Transformations

Understanding these four mechanisms lets you predict transformations across functional groups: alcohols, alkyl halides, ethers, epoxides, and more. The electrons always move from nucleophile (electron-rich) to electrophile (electron-poor). Follow the electrons and the mechanism follows.`,
    },
    {
      title: 'MCAT Study Strategy',
      tags: ['mcat', 'pre-med', 'study-tips'],
      subject: 'Pre-Med',
      content: `# MCAT Study Strategy

## Overview

The MCAT (Medical College Admission Test) is a 7.5-hour exam covering four sections: Chemical and Physical Foundations (Chem/Phys), Critical Analysis and Reasoning Skills (CARS), Biological and Biochemical Foundations (Bio/Biochem), and Psychological, Social, and Biological Foundations (Psych/Soc). Target score: 515+ for competitive MD programs.

## Timeline (Summer 2026 Prep)

### Phase 1: Content Review (6 weeks)
- Week 1-2: Biology and biochemistry (amino acids, metabolism, molecular biology)
- Week 3-4: General and organic chemistry (stoichiometry, acids/bases, mechanisms)
- Week 5: Physics (mechanics, electricity, optics, fluids)
- Week 6: Psychology and sociology (learning theories, social structures, research design)

Use Kaplan or Princeton Review books for content. Supplement with Khan Academy videos for difficult topics. Take notes in your own words — the act of reformulating builds understanding.

### Phase 2: Practice and Application (4 weeks)
- Daily: 2-3 CARS passages (this section needs consistent practice)
- Every other day: section bank passages (AAMC official)
- Weekly: one full-length practice exam (review in detail the next day)
- Continuously: Anki flashcards for terms and pathways

### Phase 3: Full-Length Exams and Review (2 weeks)
- 4 full-length AAMC practice exams
- Detailed review of every missed question
- Identify weak areas and do targeted review
- Taper study intensity 2 days before the real exam

## Study Techniques

### Active Recall
Do not just re-read notes. Close the book and try to recall the material. Flashcards (Anki with spaced repetition) are the most efficient tool for memorization-heavy content.

### Spaced Repetition
Review material at increasing intervals: 1 day, 3 days, 7 days, 14 days. Anki automates this. Start Anki cards early so they are mature by exam day.

### Practice Under Exam Conditions
Every practice exam should simulate real conditions: no phone, no breaks outside the scheduled ones, same start time. The MCAT is a marathon — stamina is as important as knowledge.

### CARS Strategy
CARS is the hardest section to improve. My approach:
1. Read the passage actively (3-4 minutes) — identify main idea, author's tone, argument structure
2. Answer questions by referring back to the passage (do not rely on memory)
3. Eliminate wrong answers before selecting the best one
4. Practice 2-3 passages daily for at least 8 weeks

## Resources
- AAMC official materials (section banks, practice exams) — most representative
- Kaplan/Princeton Review for content review books
- Anki (premed community decks: Miledown, JackSparrow)
- Khan Academy MCAT collection (free, excellent for Psych/Soc)
- UWorld MCAT (excellent for practice questions with detailed explanations)`,
    },
    {
      title: 'Biochemistry: Enzyme Kinetics',
      tags: ['biochemistry', 'enzymes'],
      subject: 'Biochemistry',
      content: `# Biochemistry: Enzyme Kinetics

## What Are Enzymes?

Enzymes are biological catalysts — proteins that speed up chemical reactions by lowering the activation energy without being consumed. They are essential for life: without enzymes, most biochemical reactions would be too slow to sustain a living organism.

## Michaelis-Menten Kinetics

The foundational model for enzyme kinetics. For a simple enzyme-catalyzed reaction:

E + S ⇌ ES → E + P

The Michaelis-Menten equation:
v = (Vmax × [S]) / (Km + [S])

Where:
- **v** = reaction velocity
- **Vmax** = maximum velocity (when all enzyme is saturated with substrate)
- **Km** = Michaelis constant (substrate concentration at half-Vmax)
- **[S]** = substrate concentration

### Interpreting Km
Low Km means high affinity — the enzyme reaches half-Vmax at low substrate concentrations. High Km means low affinity — you need lots of substrate to get the enzyme working at half speed.

### Lineweaver-Burk Plot
Double reciprocal plot: 1/v vs 1/[S]. Transforms the hyperbolic curve into a straight line. Y-intercept = 1/Vmax, X-intercept = -1/Km, slope = Km/Vmax. Useful for distinguishing inhibition types.

## Enzyme Inhibition

### Competitive Inhibition
Inhibitor binds to the active site, competing with substrate. Effect: increases apparent Km (need more substrate to overcome), Vmax unchanged (can be overcome with excess substrate). Lineweaver-Burk: lines intersect on y-axis.

### Uncompetitive Inhibition
Inhibitor binds only to the ES complex (not free enzyme). Effect: both Km and Vmax decrease. Lineweaver-Burk: parallel lines.

### Noncompetitive Inhibition
Inhibitor binds to enzyme at a site other than the active site, reducing catalytic efficiency regardless of substrate binding. Effect: Vmax decreases, Km unchanged. Lineweaver-Burk: lines intersect on x-axis.

### Mixed Inhibition
Inhibitor binds to both free enzyme and ES complex with different affinities. Changes both Km and Vmax.

## Allosteric Regulation

Allosteric enzymes have regulatory sites separate from the active site. Binding of an allosteric activator or inhibitor changes enzyme conformation, affecting activity. These enzymes often show sigmoidal kinetics rather than hyperbolic (cooperative binding).

Key allosteric enzymes in metabolism:
- **Phosphofructokinase (PFK-1)**: rate-limiting enzyme of glycolysis, activated by AMP, inhibited by ATP and citrate
- **Pyruvate kinase**: activated by fructose-1,6-bisphosphate (feedforward activation)
- **Acetyl-CoA carboxylase**: rate-limiting in fatty acid synthesis, activated by citrate, inhibited by palmitoyl-CoA

## Clinical Relevance

Many drugs work by inhibiting specific enzymes. Statins inhibit HMG-CoA reductase (cholesterol synthesis). ACE inhibitors block angiotensin-converting enzyme (blood pressure). Understanding kinetics helps predict drug dosing, side effects, and interactions.`,
    },
    {
      title: 'Research Methods in Biology',
      tags: ['research-methods', 'biology'],
      subject: 'Biology',
      content: `# Research Methods in Biology

## The Scientific Method

At its core, biological research follows the scientific method: observation, question, hypothesis, experiment, analysis, conclusion. But in practice, research is messy, iterative, and full of unexpected results. The method provides structure, not a rigid recipe.

## Experimental Design

### Variables
- **Independent variable**: what the researcher manipulates
- **Dependent variable**: what is measured
- **Controlled variables**: kept constant to isolate the effect
- **Confounding variables**: uncontrolled factors that could influence the dependent variable

### Controls
- **Negative control**: no treatment, establishes baseline
- **Positive control**: known treatment that should produce a known result, validates the experimental system
- **Experimental group**: receives the treatment being tested

### Replication and Sample Size
Experiments must be replicated to ensure results are reproducible and not due to chance. Statistical power analysis determines the minimum sample size needed to detect a meaningful effect. Underpowered studies waste resources and produce unreliable results.

## Common Techniques

### Microscopy
- **Light microscopy**: up to 1000x magnification, staining reveals cellular structures
- **Fluorescence microscopy**: fluorescent dyes or GFP-tagged proteins illuminate specific structures
- **Electron microscopy (TEM/SEM)**: nanometer resolution, reveals ultrastructure but requires fixed, dead specimens

### Molecular Biology
- **PCR** (Polymerase Chain Reaction): amplifies specific DNA sequences exponentially. Essential for cloning, diagnostics, forensics.
- **Gel electrophoresis**: separates DNA/RNA/proteins by size in an electric field. Smaller molecules travel faster through the gel matrix.
- **Western blot**: detect specific proteins using antibodies. Lyse cells, separate by gel electrophoresis, transfer to membrane, probe with antibody.
- **CRISPR-Cas9**: genome editing tool. Guide RNA directs Cas9 to cut specific DNA sequences. Revolutionary for gene knockout, knock-in, and functional studies.

### Cell Culture
Growing cells in controlled conditions outside the organism. Primary cells (directly from tissue) vs cell lines (immortalized, indefinite passage). Aseptic technique is critical to prevent contamination.

## Statistical Analysis

- **t-test**: compare means of two groups
- **ANOVA**: compare means of three or more groups
- **Chi-squared**: test categorical data independence
- **Correlation**: measure strength of linear relationship (Pearson's r)
- **p-value < 0.05**: conventional threshold for statistical significance

## Reading Scientific Papers

Structure: Abstract, Introduction, Methods, Results, Discussion. Read in this order: Abstract (overview), Figures/Tables (key data), Discussion (interpretation), Methods (details). A good researcher reads critically: what are the limitations? Are the controls adequate? Do the conclusions follow from the data?`,
    },
    {
      title: 'Medical School Application Timeline',
      tags: ['med-school', 'applications'],
      subject: 'Pre-Med',
      content: `# Medical School Application Timeline

## Overview

Applying to medical school is a multi-year process. This timeline covers the major milestones from sophomore year through application submission. Starting early reduces stress and improves outcomes.

## Sophomore Year (Current — 2025-2026)

### Academics
- Maintain 3.7+ GPA (science and cumulative)
- Complete prerequisites: Gen Chem I/II, Organic Chem I/II, Biology I/II, Physics I/II, Biochemistry, English
- Take upper-level sciences that interest you (immunology, genetics, neuroscience)

### Clinical Experience
- Begin volunteering at a hospital or clinic (target 100+ hours by application)
- Shadow physicians in different specialties (target 3-4 specialties, 40+ hours total)
- Consider becoming an EMT or medical scribe for deeper clinical exposure

### Research
- Join a research lab (aim for 150+ hours by application)
- Work on a project that could lead to a publication or poster presentation
- Build a relationship with PI for a strong letter of recommendation

### Extracurriculars
- Leadership in a student organization (preferably health-related)
- Community service (non-clinical — tutoring, food bank, mentoring)
- Continue meaningful activities from high school rather than starting many new ones

## Junior Year (2026-2027)

### Fall Semester
- Begin MCAT content review (3-4 months before test date)
- Request letters of recommendation from professors, research PI, and physician you shadowed
- Finalize your personal statement topic — start brainstorming and drafting

### Spring Semester
- Take the MCAT (ideally January-March for June application submission)
- Target score: 515+ for competitive MD programs, 510+ for DO programs
- Research schools: create a balanced list of reach, target, and safety schools (15-25 schools)
- Finalize personal statement draft

### Summer Before Senior Year
- AMCAS primary application opens in May, submit in June
- Write secondary essays (pre-write common prompts)
- Interview season begins in August and runs through March
- Continue clinical experience and research

## Key Metrics for Competitive Applications

| Component | Target |
|-----------|--------|
| GPA (cumulative) | 3.7+ |
| GPA (science) | 3.7+ |
| MCAT | 515+ |
| Clinical hours | 200+ |
| Research hours | 300+ |
| Shadowing hours | 40+ |
| Volunteer hours | 150+ |

## Personal Statement Tips
- Tell a specific story that reveals your motivation for medicine
- Show, do not tell — use concrete experiences, not generic statements
- Connect your unique background to your vision for your medical career
- Have 3-4 people review it (advisor, writing center, physician mentor, friend outside medicine)
- Revise at least 5 times before submitting`,
    },
  ],

  marcusjohnson: [
    {
      title: 'Investment Banking Recruiting Guide',
      tags: ['finance', 'recruiting', 'ib'],
      subject: 'Finance',
      content: `# Investment Banking Recruiting Guide

## The IB Recruiting Timeline

Investment banking recruiting is notoriously early and structured. For summer analyst positions (the primary entry point), the timeline has shifted earlier each year.

### Freshman Year
- Join finance clubs (Investment Club, Financial Analysts Society)
- Learn basic financial concepts (DCF, multiples, financial statements)
- Start networking with upperclassmen who interned in IB

### Sophomore Year (Current)
- **Fall**: Networking season begins. Attend info sessions, reach out to alumni, practice your story
- **Winter**: Applications open for summer analyst programs (January-February for bulge brackets)
- **Spring**: First-round interviews (behavioral + technical screens)
- **Summer**: Superday interviews (multiple back-to-back interviews at the bank)

### Junior Year
- Summer analyst internship (10 weeks, the real evaluation)
- Perform well → receive full-time return offer
- Most banks convert 70-90% of their summer analysts to full-time

## Networking (The Most Important Skill)

Cold emailing works if done right. Template:
1. One line about who you are
2. How you found them (school alumni database, LinkedIn)
3. A specific, thoughtful question about their experience
4. Request for a 15-minute call (not coffee — they are busy)
5. Keep it under 5 sentences

Follow up once after 5-7 days. If no response, move on. Do not be pushy.

On the call: listen more than you talk. Ask about their path, what they like about the role, and what advice they would give. Take notes. Send a thank-you email within 24 hours.

## Technical Preparation

### The Three Statements
- Income statement: revenue, COGS, operating expenses, net income
- Balance sheet: assets = liabilities + equity
- Cash flow statement: operating, investing, financing activities
- How they connect: net income flows to retained earnings (BS) and starts cash flow (CFS)

### Valuation Methods
- **DCF** (Discounted Cash Flow): project free cash flows, discount to present value using WACC
- **Comparable Companies**: apply trading multiples (EV/EBITDA, P/E) from similar companies
- **Precedent Transactions**: apply multiples from similar M&A deals

### Key Questions
- Walk me through a DCF
- How does depreciation affect the three statements?
- What happens to each statement when inventory increases by $10?
- Why might a company with positive net income go bankrupt?

## Behavioral Preparation

IB interviews are as much about "fit" as technical knowledge. They want people who can work 80-hour weeks, handle pressure, and represent the bank professionally.

Key stories to prepare: why IB, why this bank, a leadership example, a teamwork example, a time you dealt with conflict.`,
    },
    {
      title: 'Financial Modeling Basics',
      tags: ['finance', 'modeling', 'excel'],
      subject: 'Finance',
      content: `# Financial Modeling Basics

## What Is Financial Modeling?

A financial model is a spreadsheet-based representation of a company's financial performance, used to forecast future results and value the business. Models are the core deliverable of investment banking analysts, private equity associates, and corporate finance professionals.

## The Three-Statement Model

The foundation: build an integrated model linking the income statement, balance sheet, and cash flow statement.

### Income Statement Drivers
- Revenue: grow by percentage, per-unit, or segment-based assumptions
- COGS: as a percentage of revenue (gross margin assumption)
- Operating expenses: fixed vs variable components, grow with revenue or independently
- Depreciation: based on PP&E balance and useful life assumptions
- Interest expense: based on debt balance and interest rate
- Tax: apply effective tax rate to pre-tax income

### Balance Sheet Drivers
- Accounts receivable: days sales outstanding (DSO) × daily revenue
- Inventory: days inventory on hand (DIO) × daily COGS
- Accounts payable: days payable outstanding (DPO) × daily COGS
- PP&E: prior balance + capex - depreciation
- Debt: scheduled repayments, new issuances

### Cash Flow Statement
- Start with net income
- Add back non-cash charges (depreciation, amortization)
- Subtract changes in working capital
- Subtract capital expenditures
- Adjust for financing activities (debt, equity, dividends)
- Ending cash = beginning cash + net cash flow

## DCF Valuation

### Free Cash Flow to Firm (FCFF)
FCFF = EBIT × (1 - tax rate) + D&A - CapEx - change in working capital

### WACC (Weighted Average Cost of Capital)
WACC = (E/V × Re) + (D/V × Rd × (1-t))
- E/V: equity weight, D/V: debt weight
- Re: cost of equity (CAPM: Rf + β × market risk premium)
- Rd: cost of debt, t: tax rate

### Terminal Value
At the end of the projection period (typically 5-10 years), calculate terminal value:
- **Gordon Growth**: TV = FCF × (1+g) / (WACC - g), where g is long-term growth rate (2-3%)
- **Exit Multiple**: TV = terminal year EBITDA × exit EV/EBITDA multiple

### Enterprise Value
Sum of PV of projected FCFs + PV of terminal value = Enterprise Value
Equity Value = Enterprise Value - Net Debt
Per Share Value = Equity Value / Shares Outstanding

## Best Practices

- Use blue font for hardcoded inputs, black for formulas (industry convention)
- One row per line item, formulas reference left or above
- Never hardcode numbers in formulas — always reference a cell
- Build error checks (does the balance sheet balance? does cash flow reconcile?)
- Use scenarios: base case, upside, downside with toggle switches`,
    },
    {
      title: 'Valuation Methods (DCF, Comps, Precedents)',
      tags: ['valuation', 'dcf', 'finance'],
      subject: 'Finance',
      content: `# Valuation Methods: DCF, Comps, and Precedents

## Why Multiple Methods?

No single valuation method is perfect. Each has assumptions and limitations. Using multiple methods creates a "valuation range" that triangulates the company's value. In practice, investment bankers present all three methods in a "football field" chart showing overlapping ranges.

## Discounted Cash Flow (DCF)

### Concept
The value of a company is the present value of all its future free cash flows. DCF is the most theoretically rigorous method because it values the business based on its intrinsic ability to generate cash.

### Steps
1. Project free cash flows for 5-10 years
2. Calculate terminal value (perpetuity growth or exit multiple)
3. Discount all cash flows to present value using WACC
4. Sum = Enterprise Value

### Strengths
- Based on fundamentals, not market sentiment
- Flexible: can model any business scenario
- Forces you to think about the business's drivers

### Weaknesses
- Highly sensitive to assumptions (WACC, growth rate, terminal value)
- Small changes in discount rate dramatically change output
- Garbage in, garbage out: bad assumptions = bad valuation
- Not useful for companies without positive cash flows (early-stage startups)

## Comparable Companies Analysis (Comps)

### Concept
Value a company by comparing it to similar publicly traded companies using valuation multiples.

### Steps
1. Select peer group (same industry, size, growth profile)
2. Calculate multiples for each peer: EV/EBITDA, EV/Revenue, P/E, P/B
3. Apply the median or mean multiple to the target company's metrics
4. Implied Enterprise Value = Target EBITDA × Peer Median EV/EBITDA

### Key Multiples
- **EV/EBITDA**: most common, capital-structure neutral
- **EV/Revenue**: for unprofitable companies or high-growth SaaS
- **P/E**: simple but affected by capital structure and tax differences
- **P/B**: for banks and financial institutions

### Strengths
- Market-based: reflects current investor sentiment
- Quick to calculate with publicly available data
- Easy to explain and defend

### Weaknesses
- Assumes peers are correctly valued (what if the whole sector is overvalued?)
- Hard to find truly comparable companies
- Does not account for company-specific factors

## Precedent Transactions

### Concept
Value a company based on what acquirers have paid for similar companies in past M&A transactions.

### Steps
1. Identify relevant transactions (same industry, recent, similar size)
2. Calculate transaction multiples: EV/EBITDA, EV/Revenue at acquisition
3. Apply to target company's metrics

### Key Difference from Comps
Precedent transaction multiples typically include a "control premium" (20-40%) because acquirers pay extra for ownership control. This makes precedent multiples higher than comps multiples.

### Strengths
- Reflects what real buyers actually paid
- Includes control premium
- Relevant for M&A advisory engagements

### Weaknesses
- Past deals may not reflect current market conditions
- Limited data availability for niche industries
- Deal terms and synergies vary widely

## Putting It Together

In practice, bankers present all three methods side by side. DCF provides the intrinsic value anchor. Comps show the market's current view. Precedents show what acquirers have actually paid. The overlap of all three ranges provides the most defensible valuation range.`,
    },
    {
      title: 'Excel Shortcuts for Finance',
      tags: ['excel', 'productivity', 'finance'],
      subject: 'Finance',
      content: `# Excel Shortcuts for Finance

## Why Speed Matters

In investment banking, you will spend 60-80 hours per week in Excel. The difference between a fast analyst and a slow one comes down to keyboard shortcuts. A fast analyst completes models in half the time, leaving more time for analysis and less time fighting the tool.

## Navigation

| Shortcut | Action |
|----------|--------|
| Ctrl+Arrow | Jump to edge of data region |
| Ctrl+Home | Go to cell A1 |
| Ctrl+End | Go to last used cell |
| Ctrl+G (F5) | Go to specific cell or range |
| Ctrl+Page Up/Down | Switch between sheets |
| Alt+Page Up/Down | Scroll left/right one screen |

## Selection

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+Arrow | Select to edge of data region |
| Ctrl+Space | Select entire column |
| Shift+Space | Select entire row |
| Ctrl+Shift+End | Select from current cell to last used cell |
| Ctrl+A | Select all (or current region) |

## Editing

| Shortcut | Action |
|----------|--------|
| F2 | Edit cell (enter edit mode) |
| Ctrl+D | Fill down |
| Ctrl+R | Fill right |
| Ctrl+; | Insert current date |
| Ctrl+Shift+; | Insert current time |
| Alt+Enter | New line within cell |
| Ctrl+1 | Format cells dialog |

## Formatting

| Shortcut | Action |
|----------|--------|
| Ctrl+B/I/U | Bold, italic, underline |
| Ctrl+Shift+$ | Currency format |
| Ctrl+Shift+% | Percentage format |
| Ctrl+Shift+# | Date format |
| Ctrl+Shift+~ | General format (show formulas) |

## Formulas (Most Used in Finance)

\`\`\`
=SUMPRODUCT(range1, range2)    # weighted calculations
=INDEX(range, MATCH(value, range, 0))  # better than VLOOKUP
=IFERROR(formula, fallback)    # handle #DIV/0!, #N/A
=XNPV(rate, cashflows, dates)  # NPV with irregular dates
=XIRR(cashflows, dates)        # IRR with irregular dates
=OFFSET(ref, rows, cols, height, width)  # dynamic ranges
=CHOOSE(index, val1, val2...)  # scenario switching
\`\`\`

## Pro Tips

- Never use the mouse for what a shortcut can do
- Learn Alt key ribbon shortcuts (Alt+H+O+I for auto-fit column width)
- Use named ranges for key assumptions (makes formulas readable)
- Ctrl+\` (backtick) toggles formula view — essential for auditing models
- F4 cycles through absolute/relative references ($A$1, A$1, $A1, A1)
- Master Paste Special (Ctrl+Alt+V): paste values, formats, transpose, operations
- Use Ctrl+[ to trace precedents (jump to cells referenced in the formula)`,
    },
    {
      title: 'Networking in Finance',
      tags: ['networking', 'career', 'finance'],
      subject: 'Career',
      content: `# Networking in Finance

## Why Networking Is Non-Negotiable

In finance, especially investment banking, networking is not optional. It is how you get noticed, get referrals, and ultimately get offers. A strong resume gets you in the door. Networking gets you the interview. But networking done wrong is worse than no networking at all.

## The Cold Email

### Structure
Keep it short. Bankers get hundreds of emails. Five sentences maximum.

1. **Who you are**: one line (name, school, year, major)
2. **The connection**: how you found them (alumni database, LinkedIn, event)
3. **The ask**: a specific question about their experience (NOT "can you get me a job")
4. **The request**: 15-minute phone call at their convenience
5. **Sign off**: thank you, your name, phone number

### Example
"Hi [Name], I'm Marcus Johnson, a junior at [University] studying finance. I found your profile through our alumni network and was impressed by your path from [school] to [bank]. I'm exploring investment banking and would love to hear about your experience on the [specific group] team. Would you have 15 minutes for a call at your convenience? Thank you for your time, Marcus Johnson (555-123-4567)."

### Follow-Up
If no response in 5-7 business days, send one follow-up. Short: "Hi [Name], following up on my note below. I understand you're busy — if a quick call doesn't work, I'd appreciate any advice via email. Best, Marcus." If still no response, move on. Never send more than two emails.

## The Informational Interview

### Preparation
- Research the person's background (LinkedIn, bank website)
- Prepare 5-7 thoughtful questions
- Know the bank's recent deals and news
- Have your "story" polished (why finance, why IB, why this bank)

### During the Call
- Thank them for their time
- Ask open-ended questions about their experience
- Listen actively — take notes
- Do not ask about compensation, hours, or exit opportunities (tacky)
- End with: "Is there anyone else you'd recommend I speak with?"

### After the Call
- Send a thank-you email within 24 hours
- Reference something specific from the conversation
- Add them to your networking tracker spreadsheet
- Follow up with relevant articles or updates every 4-6 weeks (stay on their radar without being annoying)

## Building Genuine Relationships

The best networking does not feel like networking. It feels like a genuine conversation between two people with shared interests. Do not approach every interaction as transactional. Be curious. Be helpful. Offer value when you can (share an interesting article, make an introduction, congratulate them on a deal).

The people who get referrals are the ones who networkers remember fondly — because they were genuine, prepared, and respectful of time.

## Networking Tracker

I maintain a spreadsheet with columns: name, firm, title, how we connected, date of last contact, notes, and follow-up date. This prevents me from losing track of relationships and ensures I follow up consistently.

The number one networking mistake I see is not following up. One coffee chat is forgettable. Consistent, thoughtful follow-ups over months build the kind of relationship that leads to a referral when a position opens up.`,
    },
  ],

  sofiarod: [
    {
      title: 'Cognitive Psychology: Memory & Learning',
      tags: ['cognitive-psych', 'memory', 'learning'],
      subject: 'Psychology',
      content: `# Cognitive Psychology: Memory & Learning

## How Memory Works

Memory is not a filing cabinet. It is a reconstructive process — we do not retrieve stored recordings but actively rebuild memories from fragments, schemas, and context. Understanding how memory works has profound implications for education, therapy, eyewitness testimony, and everyday life.

## Memory Systems

### Sensory Memory
Brief storage of sensory input (iconic memory for vision: ~500ms, echoic memory for sound: ~3-4 seconds). Acts as a buffer before attention selects what to process further. Most sensory information decays without being noticed.

### Working Memory (Short-Term)
Limited capacity system for holding and manipulating information in conscious awareness. George Miller's "magical number seven, plus or minus two" — though more recent research suggests 4 chunks for complex information.

Baddeley's model of working memory has four components:
- **Central executive**: attention controller, coordinates the subsystems
- **Phonological loop**: verbal/acoustic information (inner voice, inner ear)
- **Visuospatial sketchpad**: visual/spatial information (mental imagery)
- **Episodic buffer**: integrates information from subsystems and long-term memory

### Long-Term Memory
Theoretically unlimited capacity and duration. Two major types:
- **Explicit (declarative)**: conscious recall
  - Episodic: personal experiences (your 10th birthday)
  - Semantic: general knowledge (Paris is the capital of France)
- **Implicit (non-declarative)**: unconscious
  - Procedural: motor skills (riding a bike)
  - Priming: prior exposure influences response
  - Classical conditioning: learned associations

## Encoding Strategies

### Levels of Processing (Craik & Lockhart)
Deeper processing leads to better memory. Shallow processing (font color, letter case) produces weaker memories than deep processing (meaning, personal relevance).

### Elaborative Rehearsal
Connect new information to existing knowledge. The more connections, the more retrieval paths. Example: learning that mitochondria are the "powerhouse of the cell" creates a metaphorical link that aids recall.

### Spaced Practice
Distributed study sessions produce stronger memories than massed practice (cramming). The spacing effect is one of the most robust findings in psychology. Optimal spacing increases over time.

### Testing Effect
Actively retrieving information strengthens memory more than re-reading or re-studying. This is why flashcards and practice tests are so effective. The effort of retrieval is what creates the benefit.

## Forgetting

### Ebbinghaus Forgetting Curve
Memory decays rapidly at first, then levels off. Without review, we forget about 50% within an hour and 70% within 24 hours. Spaced repetition counteracts this curve by strategically timing reviews.

### Interference
- **Proactive**: old memories interfere with new learning
- **Retroactive**: new learning interferes with old memories

### Retrieval Failure
The information is stored but cannot be accessed. Context-dependent memory (encoding specificity principle): recall is better when the retrieval context matches the encoding context. This is why studying in the same environment where you will be tested can help.

## Applications for Studying

Based on the research, the most effective study strategies are:
1. Spaced practice (not cramming)
2. Active retrieval (testing yourself, not re-reading)
3. Elaboration (explain concepts in your own words)
4. Interleaving (mix different topics within a study session)
5. Concrete examples (connect abstract concepts to specific instances)`,
    },
    {
      title: 'Research Design and Statistics',
      tags: ['research', 'statistics', 'psychology'],
      subject: 'Psychology',
      content: `# Research Design and Statistics for Psychology

## Types of Research

### Experimental
The researcher manipulates an independent variable and measures its effect on a dependent variable while controlling confounds. Random assignment to conditions allows causal inference. The gold standard for establishing cause and effect.

### Correlational
Measures the relationship between two or more variables without manipulation. Cannot establish causation (correlation ≠ causation). Third variable problem: an unmeasured variable may explain the observed relationship.

### Quasi-Experimental
Similar to experimental but without random assignment. Used when random assignment is impossible or unethical (e.g., comparing outcomes for people who experienced trauma vs those who did not). Internal validity is weaker than true experiments.

### Observational
Systematic observation of behavior in natural or controlled settings. Can be participant observation (researcher is part of the group) or non-participant. Ecological validity is high but control is low.

## Validity

### Internal Validity
The extent to which a study demonstrates a causal relationship between IV and DV. Threats: confounding variables, selection bias, maturation, history effects, attrition.

### External Validity
The extent to which findings generalize beyond the study. Threats: WEIRD samples (Western, Educated, Industrialized, Rich, Democratic), lab settings that do not reflect real life, specific population characteristics.

### Construct Validity
Whether the measures actually assess what they claim to measure. Example: does a "creativity" test actually measure creativity, or just verbal fluency?

## Descriptive Statistics

- **Mean, median, mode**: measures of central tendency
- **Standard deviation**: spread of data around the mean
- **Skewness and kurtosis**: distribution shape
- **Effect size**: magnitude of the effect, independent of sample size
  - Cohen's d: small (0.2), medium (0.5), large (0.8)
  - r²: proportion of variance explained

## Inferential Statistics

### Null Hypothesis Significance Testing (NHST)
1. State H0 (no effect) and H1 (there is an effect)
2. Choose alpha level (typically 0.05)
3. Compute test statistic
4. If p < alpha, reject H0

### Common Tests
- **Independent t-test**: compare means of two unrelated groups
- **Paired t-test**: compare means of matched/repeated measures
- **One-way ANOVA**: compare means of 3+ groups
- **Factorial ANOVA**: test effects of 2+ IVs and their interaction
- **Chi-squared**: test independence of categorical variables
- **Correlation (Pearson's r)**: strength and direction of linear relationship
- **Multiple regression**: predict DV from multiple IVs

### Common Errors
- **Type I error (false positive)**: rejecting H0 when it is true (probability = alpha)
- **Type II error (false negative)**: failing to reject H0 when it is false (probability = beta)
- **Power** = 1 - beta: probability of detecting a real effect. Increase power by increasing sample size, effect size, or alpha.

## Ethics in Research

- Informed consent: participants must understand what they are agreeing to
- Right to withdraw: participants can leave at any time without penalty
- Debriefing: explain the study's purpose afterward (especially if deception was used)
- Confidentiality: protect participants' identities and data
- IRB approval: institutional review board must approve research involving human subjects`,
    },
    {
      title: 'Abnormal Psychology Overview',
      tags: ['abnormal-psych', 'mental-health'],
      subject: 'Psychology',
      content: `# Abnormal Psychology Overview

## Defining Abnormality

There is no single definition of abnormal behavior. The field uses multiple criteria:
- **Statistical rarity**: behavior that deviates from the norm (but being exceptionally intelligent is rare and not abnormal)
- **Deviation from social norms**: behavior that violates cultural expectations (but norms vary across cultures and time)
- **Maladaptiveness**: behavior that interferes with daily functioning
- **Personal distress**: the individual experiences suffering (but some disorders involve lack of insight)

The most practical definition combines these: behavior is abnormal when it is maladaptive, causes distress, and is considered deviant in the individual's cultural context.

## Classification: DSM-5

The Diagnostic and Statistical Manual of Mental Disorders (DSM-5, published 2013) is the standard classification system. Diagnoses are based on clusters of symptoms, duration, and functional impairment. Criticisms: categorical approach (disorder vs no disorder) may not capture the dimensional nature of mental health; cultural bias in criteria.

## Major Categories

### Anxiety Disorders
Excessive fear or worry that interferes with functioning.
- **Generalized Anxiety Disorder (GAD)**: persistent, excessive worry about multiple domains
- **Panic Disorder**: recurrent unexpected panic attacks with fear of future attacks
- **Social Anxiety Disorder**: intense fear of social situations and negative evaluation
- **Specific Phobias**: irrational fear of specific objects or situations

### Mood Disorders
Disturbances in emotional state.
- **Major Depressive Disorder (MDD)**: persistent low mood, loss of interest, changes in sleep/appetite, fatigue, concentration difficulties, suicidal ideation. Most common mental disorder globally.
- **Bipolar I**: manic episodes (elevated mood, decreased need for sleep, grandiosity, risky behavior) alternating with depressive episodes
- **Bipolar II**: hypomanic episodes (less severe mania) with depressive episodes

### Trauma and Stressor-Related Disorders
- **PTSD**: following a traumatic event — intrusive memories, avoidance, negative mood/cognition changes, hyperarousal. Develops in about 6-8% of people exposed to trauma.

### Psychotic Disorders
- **Schizophrenia**: positive symptoms (hallucinations, delusions, disorganized speech), negative symptoms (flat affect, anhedonia, avolition), cognitive deficits. Onset typically late teens to mid-30s.

## Etiology: The Biopsychosocial Model

Mental disorders arise from the interaction of:
- **Biological factors**: genetics, neurotransmitter imbalances, brain structure abnormalities
- **Psychological factors**: cognitive distortions, learned helplessness, attachment patterns
- **Social factors**: poverty, trauma, social isolation, cultural pressures

The diathesis-stress model: a predisposition (diathesis) interacts with environmental stressors to produce the disorder. Neither alone is sufficient.

## Treatment Approaches

- **Psychotherapy**: CBT (cognitive-behavioral therapy), psychodynamic, humanistic, DBT (dialectical behavior therapy)
- **Pharmacotherapy**: SSRIs for depression/anxiety, mood stabilizers for bipolar, antipsychotics for schizophrenia
- **Combined treatment**: often most effective, especially for moderate-to-severe disorders
- **Community-based**: case management, supported employment, peer support`,
    },
    {
      title: 'Neuroscience Basics',
      tags: ['neuroscience', 'brain', 'psychology'],
      subject: 'Psychology',
      content: `# Neuroscience Basics

## The Neuron

The brain contains approximately 86 billion neurons, each connecting to thousands of others through synapses. Understanding the neuron is the first step to understanding the brain.

### Structure
- **Cell body (soma)**: contains the nucleus and metabolic machinery
- **Dendrites**: receive signals from other neurons (input)
- **Axon**: transmits signals away from the cell body (output)
- **Myelin sheath**: insulating layer that speeds signal transmission (saltatory conduction)
- **Axon terminal**: releases neurotransmitters into the synapse

### Action Potential
The electrical signal that travels along the axon. At rest, the neuron is polarized (inside is -70mV relative to outside). When stimulation reaches threshold (-55mV), voltage-gated sodium channels open, depolarizing the membrane. Potassium channels then open, repolarizing the membrane. The action potential is all-or-nothing and propagates without degradation.

### Synaptic Transmission
1. Action potential arrives at axon terminal
2. Calcium channels open, Ca²⁺ flows in
3. Synaptic vesicles fuse with membrane, releasing neurotransmitters
4. Neurotransmitters bind to receptors on the postsynaptic neuron
5. Ion channels open, causing excitation (EPSP) or inhibition (IPSP)
6. Neurotransmitters are removed by reuptake, enzymatic degradation, or diffusion

## Key Neurotransmitters

| Neurotransmitter | Function | Related Disorders |
|-----------------|----------|-------------------|
| Dopamine | Reward, motivation, motor control | Parkinson's (too little), schizophrenia (too much in mesolimbic pathway) |
| Serotonin | Mood, sleep, appetite | Depression (low levels), anxiety |
| Norepinephrine | Alertness, stress response | PTSD, ADHD |
| GABA | Primary inhibitory NT | Anxiety (low GABA), epilepsy |
| Glutamate | Primary excitatory NT | Excitotoxicity, Alzheimer's |
| Acetylcholine | Memory, muscle contraction | Alzheimer's (low ACh), myasthenia gravis |

## Brain Regions

### Cerebral Cortex
- **Frontal lobe**: executive functions, planning, decision-making, personality (prefrontal cortex), voluntary movement (motor cortex)
- **Parietal lobe**: somatosensory processing (touch, pain, temperature), spatial awareness
- **Temporal lobe**: auditory processing, language comprehension (Wernicke's area), memory (hippocampus connection)
- **Occipital lobe**: visual processing

### Subcortical Structures
- **Hippocampus**: memory consolidation (transferring short-term to long-term memory)
- **Amygdala**: emotional processing, especially fear and threat detection
- **Basal ganglia**: motor control, habit learning, reward processing
- **Thalamus**: relay station for sensory information (except smell)
- **Hypothalamus**: homeostasis (hunger, thirst, temperature, circadian rhythms), hormone regulation

### Brainstem
Controls basic life functions: breathing, heart rate, sleep-wake cycles. Contains the reticular formation (arousal and attention).

## Neuroplasticity

The brain changes throughout life. Synapses strengthen with use (long-term potentiation, LTP) and weaken without use (long-term depression, LTD). This is the neural basis of learning and memory. The brain can also reorganize after injury — adjacent areas can take over functions of damaged regions, especially in younger brains.`,
    },
    {
      title: 'Graduate School Application Tips',
      tags: ['grad-school', 'applications', 'career'],
      subject: 'Career',
      content: `# Graduate School Application Tips

## Deciding Between PhD and Master's

### PhD (4-7 years)
- Fully funded (tuition waiver + stipend) in most psychology programs
- Train to become an independent researcher
- Required for tenure-track faculty positions
- Highly competitive (5-15% acceptance rates for clinical/cognitive programs)
- You specialize deeply in one area

### Master's (1-2 years)
- Often self-funded (except for funded terminal programs)
- Can be a stepping stone to a PhD (especially if your undergrad profile is not competitive enough)
- Sufficient for some careers (school psychology, counseling, industrial-organizational)
- Shorter time commitment

My plan: apply to PhD programs in cognitive science or cognitive neuroscience. Research interests: how cognitive load affects learning and memory, with applications to educational technology.

## Building a Competitive Application

### Research Experience (Most Important)
- 2+ years in a research lab (preferably across multiple labs or projects)
- Poster presentation at a conference (APS, CogSci)
- Published paper or manuscript in preparation
- Demonstrate independent thinking, not just following instructions

### GPA and GRE
- GPA: 3.5+ (3.7+ for top programs)
- Many programs have dropped the GRE, but some still require it
- Subject GRE (Psychology) can strengthen applications for borderline GPAs

### Letters of Recommendation
- 3 letters, ideally from research supervisors who know your work intimately
- Ask early (6-8 weeks before deadline)
- Provide them with your CV, personal statement draft, and a list of programs
- The best letters speak to your research potential, intellectual curiosity, and work ethic

### Personal Statement
- Tell a story: how you became interested in your research area
- Be specific about what you want to study and WHY
- Mention specific faculty whose work aligns with yours
- Tailor each statement to the program (do not send the same generic statement to everyone)
- Show evidence of critical thinking, not just enthusiasm

### Faculty Fit
This is the most underrated factor. PhD admissions are often driven by individual faculty members looking for students who fit their lab. Research faculty at each program thoroughly. Read their recent papers. Email them (briefly) to express interest and ask if they are accepting students.

## Application Timeline

| When | What |
|------|------|
| Summer before senior year | Research programs, narrow list to 8-12 |
| September | Draft personal statement, request letters |
| October | Finalize statement, submit GRE if needed |
| November-December | Submit applications (most deadlines are Dec 1-Jan 15) |
| January-March | Interview invitations (virtual or in-person) |
| February-April | Decisions and offers |
| April 15 | National deadline to accept/decline |

## What I Am Looking For in a Program

1. Strong cognitive science or cognitive neuroscience faculty
2. Interdisciplinary collaboration (with CS, neuroscience, education)
3. Good funding package (tuition + living stipend)
4. Location where I can thrive (I prefer mid-size cities)
5. Lab culture that values mentorship and work-life balance`,
    },
  ],
};

// ─── SECTION 5: Flashcard Fallbacks (AI sets, notes 0-9) ────────────────────

const flashcardFallbacks = [
  // Set 0: Dynamic Programming Concepts (note 0)
  [
    { front: 'What two properties must a problem have for dynamic programming to apply?', back: 'Optimal substructure (optimal solution contains optimal sub-solutions) and overlapping subproblems (same subproblems solved repeatedly).' },
    { front: 'What is memoization?', back: 'Top-down approach where recursive results are cached in a lookup table to avoid redundant computation. Reduces exponential time to polynomial.' },
    { front: 'What is tabulation?', back: 'Bottom-up approach where a table is filled iteratively from base cases. Eliminates recursion overhead and call stack usage.' },
    { front: 'What is the time complexity of naive recursive Fibonacci?', back: 'O(2^n) due to the exponential growth of the call tree with overlapping subproblems.' },
    { front: 'What is the time complexity of Fibonacci with memoization?', back: 'O(n) time and O(n) space — each subproblem is solved exactly once and stored.' },
    { front: 'Describe the coin change DP problem.', back: 'Given coin denominations and a target amount, find the minimum number of coins. State: dp[i] = min coins for amount i. Transition: dp[i] = min(dp[i - coin] + 1) for each denomination.' },
    { front: 'What is the state definition for 0/1 Knapsack?', back: 'dp[i][w] = maximum value using the first i items with weight capacity w. Transition: include item i or exclude it.' },
    { front: 'What is the Longest Common Subsequence (LCS) recurrence?', back: 'If chars match: dp[i][j] = dp[i-1][j-1] + 1. If not: dp[i][j] = max(dp[i-1][j], dp[i][j-1]). Base case: dp[0][j] = dp[i][0] = 0.' },
    { front: 'When should you prefer tabulation over memoization?', back: 'When you need better constant factors (no recursion overhead), when the problem has a natural bottom-up order, or when you want to optimize space by only keeping the last row/column.' },
    { front: 'What is optimal substructure?', back: 'A problem has optimal substructure if an optimal solution can be constructed from optimal solutions of its subproblems. Example: shortest paths — a subpath of a shortest path is itself a shortest path.' },
  ],
  // Set 1: OS Scheduling Algorithms (note 1)
  [
    { front: 'What is the convoy effect in FCFS scheduling?', back: 'Short processes get stuck waiting behind a long-running process, leading to high average waiting time. The entire queue is delayed by one CPU-intensive job.' },
    { front: 'Why is SJF optimal for average waiting time?', back: 'By always running the shortest job next, SJF minimizes the total time other jobs spend waiting. This is provably optimal among non-preemptive algorithms.' },
    { front: 'What is the main disadvantage of SJF?', back: 'Starvation — long processes may never execute if short processes keep arriving. Also, burst times must be predicted (using exponential averaging).' },
    { front: 'What happens if the Round Robin quantum is too small?', back: 'Excessive context switching overhead dominates execution time, reducing effective throughput.' },
    { front: 'What happens if the Round Robin quantum is too large?', back: 'It degenerates into FCFS scheduling, losing the responsiveness benefits of time-sharing.' },
    { front: 'What is aging in priority scheduling?', back: 'Gradually increasing the priority of waiting processes over time to prevent starvation. Eventually, even the lowest-priority process will reach a high enough priority to execute.' },
    { front: 'How does MLFQ adapt to process behavior?', back: 'Processes that use full quanta sink to lower-priority queues (CPU-bound). Processes that yield the CPU early stay in high-priority queues (I/O-bound / interactive).' },
    { front: 'What is preemptive vs non-preemptive scheduling?', back: 'Preemptive: the OS can interrupt a running process and give the CPU to another. Non-preemptive: a process runs until it voluntarily yields or terminates.' },
    { front: 'What is Shortest Remaining Time First (SRTF)?', back: 'The preemptive version of SJF. If a new process arrives with a shorter burst than the remaining time of the current process, the current process is preempted.' },
    { front: 'What is the rule of thumb for RR quantum size?', back: '80% of CPU bursts should complete within one quantum. Typical values: 10-100 milliseconds.' },
  ],
  // Set 2: Neural Network Key Terms (note 5)
  [
    { front: 'What is the vanishing gradient problem?', back: 'In deep networks, gradients shrink exponentially as they are backpropagated through layers, making early layers learn extremely slowly. Solved by ReLU activation and skip connections.' },
    { front: 'What does ReLU stand for and what does it do?', back: 'Rectified Linear Unit: f(x) = max(0, x). Simple, efficient, avoids vanishing gradients. Downside: dead neurons (output stuck at 0 for negative inputs).' },
    { front: 'What is the Universal Approximation Theorem?', back: 'A feedforward network with one hidden layer and a non-linear activation can approximate any continuous function to arbitrary precision, given enough neurons.' },
    { front: 'What is backpropagation?', back: 'Algorithm that computes the gradient of the loss with respect to each weight by applying the chain rule through the network layers, enabling gradient descent optimization.' },
    { front: 'What is the difference between SGD and Adam?', back: 'SGD uses a fixed learning rate for all parameters. Adam adapts the learning rate per parameter using running averages of gradients and squared gradients (momentum + RMSProp).' },
    { front: 'What is dropout?', back: 'Regularization technique that randomly sets a fraction of neuron outputs to zero during training, preventing co-adaptation and reducing overfitting.' },
    { front: 'What is the key innovation of transformers?', back: 'Self-attention mechanism: allows every token to attend to every other token in parallel, eliminating the sequential bottleneck of RNNs.' },
    { front: 'How do CNNs exploit spatial structure?', back: 'Convolutional layers learn local spatial patterns using filters that slide across the input. Early layers detect edges, deeper layers detect complex objects. Parameter sharing reduces model size.' },
    { front: 'What problem do LSTMs solve that vanilla RNNs cannot?', back: 'Long-range dependencies. LSTM gates (forget, input, output) control information flow, allowing the network to retain or discard information over long sequences.' },
    { front: 'What is batch normalization?', back: 'Normalizes layer inputs to have zero mean and unit variance within each mini-batch. Stabilizes training, allows higher learning rates, and acts as mild regularization.' },
  ],
  // Set 3: Distributed Systems Vocab (note 6)
  [
    { front: 'State the CAP theorem.', back: 'A distributed data store can provide at most two of three guarantees: Consistency (every read returns the latest write), Availability (every request gets a response), and Partition Tolerance (system works despite network partitions).' },
    { front: 'What is linearizability?', back: 'The strongest consistency model: every operation appears to execute atomically at some point between its invocation and completion. Equivalent to having a single copy of the data.' },
    { front: 'What is eventual consistency?', back: 'If no new writes are made, all replicas will eventually converge to the same value. No guarantees about when or what intermediate values are returned.' },
    { front: 'What is causal consistency?', back: 'If operation A causally precedes B, all nodes see A before B. Causally unrelated operations can be seen in different orders by different nodes.' },
    { front: 'How does Raft leader election work?', back: 'Nodes start as followers with randomized election timeouts. When timeout expires without hearing from a leader, a follower becomes a candidate, increments its term, and requests votes. Majority wins.' },
    { front: 'What is a split-brain scenario?', back: 'A network partition causes two parts of the system to each elect their own leader, potentially accepting conflicting writes. Raft prevents this by requiring majority quorum for leadership.' },
    { front: 'What is the difference between CP and AP systems?', back: 'CP systems sacrifice availability during partitions (refuse requests to maintain consistency). AP systems sacrifice consistency (serve potentially stale data to remain available).' },
    { front: 'What does Google Spanner use for global ordering?', back: 'TrueTime API with atomic clocks and GPS receivers to provide globally synchronized timestamps, enabling linearizable reads across datacenters.' },
    { front: 'What is quorum-based replication?', back: 'Read and write operations require acknowledgment from a majority (quorum) of replicas. If W + R > N, reads are guaranteed to see the latest write.' },
    { front: 'What is Paxos?', back: 'A consensus protocol where proposers propose values, acceptors vote, and a value is chosen when a majority of acceptors agree. Provably correct but notoriously difficult to implement.' },
  ],
  // Set 4: TCP/IP and Networking (note 2)
  [
    { front: 'What are the four layers of the TCP/IP model?', back: 'Link (physical), Internet (IP routing), Transport (TCP/UDP), Application (HTTP, DNS, SMTP).' },
    { front: 'Describe the TCP three-way handshake.', back: '1) Client sends SYN. 2) Server responds with SYN-ACK. 3) Client sends ACK. Connection is now established.' },
    { front: 'Why does TCP use sequence numbers?', back: 'To track the position of each byte in the stream, enabling ordered delivery, duplicate detection, and reliable retransmission of lost segments.' },
    { front: 'What is the main advantage of UDP over TCP?', back: 'Lower overhead and latency — no connection establishment, no acknowledgments, no ordering. Used for real-time applications like video streaming, gaming, and DNS queries.' },
    { front: 'What is HTTP/2 multiplexing?', back: 'Multiple HTTP requests and responses are interleaved on a single TCP connection using binary framing, eliminating head-of-line blocking at the HTTP level.' },
    { front: 'What protocol does HTTP/3 run over?', back: 'QUIC, which is built on UDP instead of TCP. This eliminates TCP head-of-line blocking at the transport layer and provides built-in TLS 1.3 encryption.' },
    { front: 'What is forward secrecy in TLS?', back: 'Using ephemeral Diffie-Hellman keys so that each session has a unique key. Even if the server private key is later compromised, past sessions cannot be decrypted.' },
    { front: 'What is TCP congestion control?', back: 'Mechanisms (slow start, congestion avoidance, fast retransmit) that prevent the sender from overwhelming the network. The congestion window dynamically adjusts based on packet loss.' },
    { front: 'What is NAT?', back: 'Network Address Translation: translates private IP addresses (e.g., 192.168.x.x) to a public IP address, allowing multiple devices to share one public address.' },
    { front: 'How does DNS resolution work?', back: 'Hierarchical lookup: client queries recursive resolver, which checks root servers → TLD servers (.com) → authoritative servers for the domain. Results cached at each level with TTL.' },
  ],
  // Set 5: Database Systems Review (note 3)
  [
    { front: 'What is a B+ tree and why is it used for indexing?', back: 'A balanced tree where internal nodes store keys/pointers and leaf nodes store keys/data pointers linked together. High branching factor (100-200) means 3-4 levels index millions of rows with minimal I/O.' },
    { front: 'What is predicate pushdown?', back: 'A query optimization that applies WHERE filters as early as possible in the execution plan, reducing the number of rows processed by later operations.' },
    { front: 'What is MVCC?', back: 'Multi-Version Concurrency Control: maintain multiple versions of each row so readers see a consistent snapshot without blocking writers. Used by PostgreSQL and MySQL InnoDB.' },
    { front: 'What are the four ACID properties?', back: 'Atomicity (all or nothing), Consistency (valid state to valid state), Isolation (concurrent transactions appear serial), Durability (committed changes survive crashes).' },
    { front: 'What is the difference between Read Committed and Repeatable Read?', back: 'Read Committed: each query sees only committed data but may get different results on re-read. Repeatable Read: same query returns same results within a transaction, but phantom rows can appear.' },
    { front: 'What is a covering index?', back: 'An index that includes all columns needed by a query, so the database can answer the query from the index alone without fetching the actual row (index-only scan).' },
    { front: 'What is two-phase locking (2PL)?', back: 'A concurrency control protocol where a transaction acquires all needed locks before releasing any. Prevents most anomalies but can cause deadlocks.' },
    { front: 'What is write-ahead logging (WAL)?', back: 'Changes are written to a log on disk before being applied to the data. On crash, the log is used to redo committed transactions and undo incomplete ones.' },
    { front: 'When should you NOT add an index?', back: 'On columns with low cardinality (few distinct values), on tables with heavy write workloads (index maintenance overhead), or on small tables (full scan is already fast).' },
    { front: 'What does EXPLAIN ANALYZE do?', back: 'Shows the query execution plan with actual runtime statistics (vs just estimates). Essential for identifying slow operations like sequential scans on large tables.' },
  ],
  // Set 6: Cryptography Basics (note 7)
  [
    { front: 'What is the key difference between symmetric and asymmetric encryption?', back: 'Symmetric uses the same key for encryption and decryption (fast, requires shared secret). Asymmetric uses a public/private key pair (slower, solves key distribution).' },
    { front: 'What mathematical problem underlies RSA security?', back: 'The difficulty of factoring the product of two large prime numbers. Given n = p × q, finding p and q is computationally infeasible for sufficiently large primes.' },
    { front: 'Why is ECC preferred over RSA for modern systems?', back: 'ECC achieves equivalent security with much smaller keys (256-bit ECC ≈ 3072-bit RSA), making it faster and more efficient, especially on mobile and constrained devices.' },
    { front: 'What is a certificate chain of trust?', back: 'Root CA (self-signed, pre-installed in browsers) signs intermediate CA certificates, which sign end-entity certificates. Browsers verify the chain from server cert up to a trusted root.' },
    { front: 'How many round trips does TLS 1.3 handshake take?', back: 'One round trip (1-RTT) for new connections. Zero round trips (0-RTT) for resumed connections using pre-shared keys from a previous session.' },
    { front: 'What is forward secrecy?', back: 'Using ephemeral Diffie-Hellman keys for each session so that compromising the server long-term key cannot decrypt past sessions. Mandated by TLS 1.3.' },
    { front: 'What are the three properties digital signatures provide?', back: 'Authentication (verifies the signer), Integrity (message has not been altered), Non-repudiation (signer cannot deny signing).' },
    { front: 'What is OCSP?', back: 'Online Certificate Status Protocol: a real-time check with the CA to verify if a certificate has been revoked. Faster than downloading full CRL lists.' },
    { front: 'What is AES and what key sizes does it support?', back: 'Advanced Encryption Standard: symmetric block cipher operating on 128-bit blocks with key sizes of 128, 192, or 256 bits. AES-256 is considered quantum-resistant.' },
    { front: 'What would Shor\'s algorithm break?', back: 'RSA and other factoring-based public-key cryptosystems by factoring large integers in polynomial time on a quantum computer. This motivates post-quantum cryptography research.' },
  ],
  // Set 7: Graph Algorithm Vocab (note 9)
  [
    { front: 'Why can\'t Dijkstra handle negative edge weights?', back: 'Dijkstra is greedy: once a vertex is extracted from the priority queue, its distance is finalized. A negative edge could later provide a shorter path to an already-finalized vertex.' },
    { front: 'What is the time complexity of Dijkstra with a binary heap?', back: 'O((V + E) log V) where V is vertices and E is edges.' },
    { front: 'What is the time complexity of Bellman-Ford?', back: 'O(V × E) — relaxes all edges V-1 times.' },
    { front: 'How does Bellman-Ford detect negative cycles?', back: 'After V-1 relaxation passes, run one more pass. If any distance decreases, a negative-weight cycle exists (shortest paths are undefined for reachable vertices).' },
    { front: 'What must a heuristic satisfy for A* to find the optimal path?', back: 'Admissibility (never overestimates the true cost to goal) and consistency (h(u) ≤ weight(u,v) + h(v) for all edges).' },
    { front: 'What is the f-score in A*?', back: 'f(v) = g(v) + h(v), where g(v) is the actual cost from source to v and h(v) is the heuristic estimate from v to the goal. The priority queue is ordered by f-score.' },
    { front: 'When is an adjacency list preferred over an adjacency matrix?', back: 'For sparse graphs (E << V²), which includes most real-world graphs. Adjacency list uses O(V + E) space vs O(V²) for the matrix.' },
    { front: 'What is bidirectional search?', back: 'Running search simultaneously from source and target. The searches meet in the middle, roughly halving the explored area compared to unidirectional search.' },
    { front: 'Name a real-world application of Bellman-Ford.', back: 'Arbitrage detection in currency exchange: model currencies as nodes and exchange rates as edges (using -log of rates). A negative cycle indicates an arbitrage opportunity.' },
    { front: 'What is the Manhattan distance heuristic?', back: 'Sum of horizontal and vertical distances to the goal. Admissible for grid-based movement without diagonals. h = |x1-x2| + |y1-y2|.' },
  ],
  // Set 8: Compiler Terminology (note 4)
  [
    { front: 'What is the role of the lexer?', back: 'Converts raw character stream into a sequence of tokens (keywords, identifiers, literals, operators, delimiters) using finite automata based on regular expressions.' },
    { front: 'What is the difference between LL and LR parsing?', back: 'LL (top-down): starts from start symbol, derives the input. LR (bottom-up): starts from input, reduces to start symbol. LR is more powerful and handles a larger class of grammars.' },
    { front: 'What is an Abstract Syntax Tree (AST)?', back: 'A tree representation of the program structure where each node is a language construct (function, if-statement, expression). It discards syntactic sugar like parentheses and semicolons.' },
    { front: 'What does the semantic analyzer check?', back: 'Type correctness (operand types match operators), scope rules (variables declared before use), function signatures (argument types match parameters), and other non-grammar rules.' },
    { front: 'What is a symbol table?', back: 'A data structure mapping identifiers to their declarations (type, scope, memory location). Built and queried during semantic analysis. Supports nested scopes via a scope stack.' },
    { front: 'What is LALR(1) parsing?', back: 'Look-Ahead LR with 1 token lookahead. The practical sweet spot for bottom-up parsing — more powerful than SLR but with smaller tables than full CLR(1). Used by Yacc/Bison.' },
    { front: 'What is constant folding?', back: 'A compiler optimization that evaluates constant expressions at compile time instead of runtime. Example: 3 + 4 is replaced with 7 in the generated code.' },
    { front: 'What is register allocation?', back: 'The process of assigning program variables to a limited number of CPU registers. Often modeled as graph coloring: variables that are live at the same time cannot share a register.' },
    { front: 'What is three-address code?', back: 'An intermediate representation where each instruction has at most three operands: two source and one destination. Example: t1 = a + b. Simplifies optimization and code generation.' },
    { front: 'What is dead code elimination?', back: 'A compiler optimization that removes code that computes values that are never used or code that is unreachable. Reduces executable size and can improve cache performance.' },
  ],
  // Set 9: Quantum Computing Intro Terms (note 8)
  [
    { front: 'What is a qubit?', back: 'A quantum bit that can exist in a superposition of |0⟩ and |1⟩ states simultaneously, represented as |ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1.' },
    { front: 'What happens when you measure a qubit?', back: 'The superposition collapses to |0⟩ with probability |α|² or |1⟩ with probability |β|². The act of measurement destroys the superposition.' },
    { front: 'What is quantum entanglement?', back: 'When two or more qubits are correlated such that measuring one instantly determines the state of the other, regardless of distance. No classical analog exists.' },
    { front: 'What does the Hadamard gate do?', back: 'Creates superposition from a definite state: H|0⟩ = (|0⟩ + |1⟩)/√2. Applied to n qubits in |0⟩, it creates an equal superposition of all 2^n states.' },
    { front: 'What speedup does Grover\'s algorithm provide?', back: 'Quadratic speedup: finds a target item in an unsorted database of N items in O(√N) evaluations vs O(N) classically.' },
    { front: 'How does Grover\'s algorithm amplify the correct answer?', back: 'The oracle marks the target (flips its amplitude), then the diffusion operator reflects all amplitudes about the mean. After ~√N iterations, the target amplitude is close to 1.' },
    { front: 'What threat does Shor\'s algorithm pose?', back: 'It can factor large integers in polynomial time, which would break RSA and other public-key cryptosystems that rely on the difficulty of factoring.' },
    { front: 'What is the CNOT gate?', back: 'Controlled-NOT: flips the target qubit if and only if the control qubit is |1⟩. Used to create entanglement (combined with Hadamard gate to make Bell states).' },
    { front: 'What is the NISQ era?', back: 'Noisy Intermediate-Scale Quantum: the current stage of quantum computing with 100+ qubit processors but high error rates. Practical quantum advantage is not yet achieved for most problems.' },
    { front: 'How does Grover\'s algorithm affect symmetric cipher security?', back: 'It effectively halves the key length: a 256-bit key provides only 128-bit security against Grover\'s. This motivates using AES-256 for post-quantum resistance.' },
  ],
];

// ─── SECTION 5 (cont): Manual Flashcard Sets (10 sets) ─────────────────────

const manualFlashcardSets = [
  // Set 11: Data Structures Quick Reference
  {
    title: 'Data Structures Quick Reference',
    description: 'Quick reference cards for common data structure operations and complexities.',
    visibility: 'friends',
    cards: [
      { front: 'Array — access by index', back: 'O(1) time. Direct memory offset calculation.' },
      { front: 'Array — insert at end (dynamic array)', back: 'O(1) amortized. Occasional O(n) resizing.' },
      { front: 'Array — insert at beginning', back: 'O(n). Must shift all elements right.' },
      { front: 'Linked List — insert at head', back: 'O(1). Create new node, point to old head.' },
      { front: 'Linked List — search', back: 'O(n). Must traverse from head.' },
      { front: 'Hash Map — insert / lookup / delete (average)', back: 'O(1) average. O(n) worst case with collisions.' },
      { front: 'Binary Search Tree — search / insert / delete (balanced)', back: 'O(log n). Degrades to O(n) if unbalanced.' },
      { front: 'Heap — insert', back: 'O(log n). Add at bottom, bubble up.' },
      { front: 'Heap — extract min/max', back: 'O(log n). Remove root, replace with last, bubble down.' },
      { front: 'Stack — push / pop / peek', back: 'O(1) for all operations. LIFO order.' },
      { front: 'Queue — enqueue / dequeue', back: 'O(1) for all operations. FIFO order.' },
      { front: 'Trie — insert / search (string length m)', back: 'O(m). Each character is one node traversal.' },
    ],
  },
  // Set 12: SQL Interview Questions
  {
    title: 'SQL Interview Questions',
    description: 'Common SQL interview questions covering joins, aggregation, window functions, and optimization.',
    visibility: 'friends',
    cards: [
      { front: 'What is the difference between INNER JOIN and LEFT JOIN?', back: 'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table plus matching rows from the right (NULLs for non-matches).' },
      { front: 'What is a window function?', back: 'A function that performs a calculation across a set of rows related to the current row (the "window") without collapsing them. Uses OVER() clause. Examples: ROW_NUMBER(), RANK(), SUM() OVER().' },
      { front: 'Difference between WHERE and HAVING?', back: 'WHERE filters rows before grouping. HAVING filters groups after aggregation. HAVING can reference aggregate functions; WHERE cannot.' },
      { front: 'What is a subquery vs a CTE?', back: 'Subquery: nested query inside another query. CTE (Common Table Expression): named temporary result set using WITH clause. CTEs are more readable and can be referenced multiple times.' },
      { front: 'What is normalization?', back: 'Organizing tables to reduce data redundancy and improve integrity. Normal forms: 1NF (atomic values), 2NF (no partial dependencies), 3NF (no transitive dependencies), BCNF.' },
      { front: 'What does GROUP BY do?', back: 'Groups rows with the same values in specified columns into summary rows. Used with aggregate functions (COUNT, SUM, AVG, MIN, MAX).' },
      { front: 'How do you find duplicate rows?', back: 'SELECT col, COUNT(*) FROM table GROUP BY col HAVING COUNT(*) > 1;' },
      { front: 'What is a self-join?', back: 'A join of a table with itself. Used for hierarchical data (employees and managers), finding pairs, or comparing rows within the same table.' },
      { front: 'What is the difference between UNION and UNION ALL?', back: 'UNION removes duplicate rows (slower). UNION ALL keeps all rows including duplicates (faster). Use UNION ALL when you know there are no duplicates or want them.' },
      { front: 'What is an execution plan?', back: 'The strategy the database engine chooses to execute a query. Shows operations (scans, joins, sorts), their order, and estimated costs. Use EXPLAIN to view it.' },
    ],
  },
  // Set 13: Big-O Cheat Sheet
  {
    title: 'Big-O Cheat Sheet',
    description: 'Quick reference for common algorithm complexities.',
    visibility: 'friends',
    cards: [
      { front: 'Binary Search', back: 'O(log n) time, O(1) space. Requires sorted input.' },
      { front: 'Merge Sort', back: 'O(n log n) time (all cases), O(n) space.' },
      { front: 'Quick Sort', back: 'O(n log n) average, O(n²) worst case, O(log n) space.' },
      { front: 'Heap Sort', back: 'O(n log n) time (all cases), O(1) space.' },
      { front: 'BFS / DFS on graph', back: 'O(V + E) time, O(V) space.' },
      { front: 'Dijkstra (binary heap)', back: 'O((V + E) log V) time.' },
      { front: 'Counting Sort', back: 'O(n + k) time and space, where k is the value range.' },
      { front: 'Hash table lookup (average)', back: 'O(1) average, O(n) worst case.' },
      { front: 'Building a heap from array', back: 'O(n) using bottom-up heapify (not O(n log n)).' },
      { front: 'Matrix multiplication (naive)', back: 'O(n³) for two n×n matrices.' },
    ],
  },
  // Set 14: OOP Design Patterns
  {
    title: 'OOP Design Patterns',
    description: 'Classic Gang of Four design patterns — name, category, and purpose.',
    visibility: 'private',
    cards: [
      { front: 'Singleton', back: 'Creational: ensures a class has only one instance and provides a global point of access. Used for config managers, connection pools, loggers.' },
      { front: 'Factory Method', back: 'Creational: defines an interface for creating objects but lets subclasses decide which class to instantiate. Decouples object creation from usage.' },
      { front: 'Observer', back: 'Behavioral: defines a one-to-many dependency where when one object changes state, all dependents are notified. Used in event systems and reactive programming.' },
      { front: 'Strategy', back: 'Behavioral: defines a family of interchangeable algorithms. Lets the algorithm vary independently from clients that use it. Example: sorting with different comparators.' },
      { front: 'Decorator', back: 'Structural: attaches additional responsibilities to an object dynamically. More flexible than subclassing. Example: adding compression to a stream.' },
      { front: 'Adapter', back: 'Structural: converts the interface of a class into another interface that clients expect. Makes incompatible classes work together.' },
      { front: 'Builder', back: 'Creational: separates the construction of a complex object from its representation. Useful for objects with many optional parameters.' },
      { front: 'Template Method', back: 'Behavioral: defines the skeleton of an algorithm in a superclass, letting subclasses override specific steps without changing the overall structure.' },
    ],
  },
  // Set 15: Git Commands Reference
  {
    title: 'Git Commands Reference',
    description: 'Essential git commands for everyday development workflow.',
    visibility: 'friends',
    cards: [
      { front: 'git stash', back: 'Temporarily shelve uncommitted changes. Restore with git stash pop (apply and delete) or git stash apply (keep stash).' },
      { front: 'git rebase origin/main', back: 'Replays your branch commits on top of the latest main. Creates linear history. Never rebase shared/public branches.' },
      { front: 'git cherry-pick <sha>', back: 'Apply a specific commit from another branch to the current branch. Creates a new commit with the same changes.' },
      { front: 'git bisect', back: 'Binary search through commit history to find the commit that introduced a bug. Start with git bisect start, then mark commits as good or bad.' },
      { front: 'git reflog', back: 'Shows a log of all reference updates (commits, rebases, resets). Essential for recovering lost commits after destructive operations.' },
      { front: 'git reset --soft HEAD~1', back: 'Undo the last commit but keep changes staged. The commit is removed but your files are untouched and ready to recommit.' },
      { front: 'git diff --staged', back: 'Show changes that are staged for the next commit (added with git add but not yet committed).' },
      { front: 'git log --oneline --graph --all', back: 'Compact visual representation of the entire branch history showing commit messages, branch structure, and merge points.' },
      { front: 'git remote -v', back: 'List all configured remote repositories with their fetch and push URLs.' },
      { front: 'git fetch vs git pull', back: 'fetch downloads remote changes without merging. pull = fetch + merge. fetch is safer because it lets you inspect changes before merging.' },
    ],
  },
  // Set 16: React Core Concepts
  {
    title: 'React Core Concepts',
    description: 'Key React concepts for building modern web applications.',
    visibility: 'friends',
    cards: [
      { front: 'What is the Virtual DOM?', back: 'A lightweight in-memory representation of the real DOM. React compares the new Virtual DOM with the previous one (diffing) and applies only the necessary changes to the real DOM (reconciliation).' },
      { front: 'What are React keys and why are they important?', back: 'Keys help React identify which items in a list changed, were added, or removed. Using stable, unique keys (not array index) enables efficient list re-rendering.' },
      { front: 'What is the difference between state and props?', back: 'Props are read-only data passed from parent to child. State is mutable data owned by the component. State changes trigger re-renders.' },
      { front: 'What is useEffect\'s dependency array?', back: 'An array of values that the effect depends on. The effect re-runs only when a dependency changes. Empty array = run once. Omitted = run every render.' },
      { front: 'What is React context?', back: 'A way to pass data through the component tree without prop drilling. Create with createContext(), provide with Provider, consume with useContext().' },
      { front: 'What is JSX?', back: 'A syntax extension that lets you write HTML-like code in JavaScript. JSX is compiled to React.createElement() calls by Babel/compiler.' },
      { front: 'What is lifting state up?', back: 'Moving state to the closest common ancestor of components that need it. The parent holds the state and passes it down via props.' },
      { front: 'What is React.memo?', back: 'A higher-order component that memoizes the rendered output. Skips re-rendering if props have not changed (shallow comparison).' },
      { front: 'What are controlled vs uncontrolled components?', back: 'Controlled: form input value is driven by React state. Uncontrolled: value is managed by the DOM, accessed via refs. Controlled is preferred for validation and complex forms.' },
      { front: 'What is Suspense?', back: 'A React component that displays a fallback (loading spinner) while waiting for lazy-loaded components or async data to resolve.' },
    ],
  },
  // Set 17: UNIX / Linux Commands
  {
    title: 'UNIX / Linux Commands',
    description: 'Essential command line tools for developers.',
    visibility: 'private',
    cards: [
      { front: 'grep -r "pattern" dir/', back: 'Recursively search for a text pattern in all files under a directory. Add -i for case-insensitive, -n for line numbers.' },
      { front: 'find . -name "*.log" -mtime +7 -delete', back: 'Find and delete all .log files modified more than 7 days ago in the current directory tree.' },
      { front: 'chmod 755 script.sh', back: 'Set permissions: owner can read/write/execute (7), group and others can read/execute (5). Makes a script executable.' },
      { front: 'tar -czf archive.tar.gz dir/', back: 'Create a gzip-compressed tar archive of a directory. -c create, -z gzip, -f filename.' },
      { front: 'ps aux | grep node', back: 'List all running processes and filter for those containing "node". Shows PID, CPU, memory usage.' },
      { front: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"val"}\' url', back: 'Send an HTTP POST request with JSON body and content type header to a URL.' },
      { front: 'tail -f /var/log/syslog', back: 'Follow a log file in real-time, displaying new lines as they are appended. Ctrl+C to stop.' },
      { front: 'df -h', back: 'Display disk space usage for all mounted file systems in human-readable format (GB/MB).' },
      { front: 'ssh-keygen -t ed25519', back: 'Generate an Ed25519 SSH key pair. More secure and faster than RSA. Key stored in ~/.ssh/id_ed25519.' },
    ],
  },
  // Set 18: System Design Patterns
  {
    title: 'System Design Patterns',
    description: 'Common patterns and concepts for system design interviews.',
    visibility: 'friends',
    cards: [
      { front: 'What is consistent hashing?', back: 'A hashing technique where adding/removing a node only remaps K/n keys (K keys, n nodes) instead of most keys. Used in distributed caches and databases for balanced data distribution.' },
      { front: 'What is a write-ahead log (WAL)?', back: 'Changes are written to a sequential log before being applied to the main data structure. Ensures durability and enables crash recovery. Used in databases, Kafka, and Raft.' },
      { front: 'What is the fan-out problem in social media feeds?', back: 'When a user with many followers posts, the system must update all follower feeds. Fan-out on write (push) vs fan-out on read (pull). Hybrid: push for normal users, pull for celebrities.' },
      { front: 'What is circuit breaker pattern?', back: 'Prevents cascading failures by stopping requests to a failing service. States: closed (normal), open (fail fast), half-open (test recovery). Like an electrical circuit breaker.' },
      { front: 'What is event sourcing?', back: 'Store state changes as a sequence of events rather than overwriting current state. The current state is derived by replaying events. Provides complete audit trail and enables temporal queries.' },
      { front: 'What is CQRS?', back: 'Command Query Responsibility Segregation: separate read and write models. Writes go to a write-optimized store, reads from a read-optimized store. Enables independent scaling.' },
      { front: 'What is a reverse proxy?', back: 'A server that sits in front of backend servers, forwarding client requests. Provides load balancing, SSL termination, caching, and compression. Examples: Nginx, HAProxy.' },
      { front: 'What is database sharding?', back: 'Horizontally partitioning data across multiple database instances. Each shard holds a subset of data based on a shard key. Challenges: cross-shard queries, hotspots, rebalancing.' },
      { front: 'What is a CDN and when to use one?', back: 'Content Delivery Network: caches static content at edge servers near users. Reduces latency and origin load. Use for images, CSS, JS, videos — anything that does not change per-request.' },
      { front: 'What is backpressure?', back: 'A mechanism where a slow consumer signals the fast producer to slow down, preventing overwhelming the system. Implemented via bounded queues, rate limiting, or flow control protocols.' },
    ],
  },
  // Set 19: Python Built-ins Cheat Sheet
  {
    title: 'Python Built-ins Cheat Sheet',
    description: 'Commonly used Python built-in functions and patterns for interviews.',
    visibility: 'private',
    cards: [
      { front: 'collections.defaultdict', back: 'Dictionary that provides a default value for missing keys. defaultdict(list) creates empty lists, defaultdict(int) creates zeros. Avoids KeyError checks.' },
      { front: 'collections.Counter', back: 'Dictionary subclass for counting hashable objects. Counter("abracadabra") → {a:5, b:2, r:2, c:1, d:1}. Has most_common(n) method.' },
      { front: 'heapq module', back: 'Min-heap implementation. heappush(h, val), heappop(h), heapify(list). For max-heap, negate values. nlargest(k, iterable) for top-K.' },
      { front: 'itertools.combinations(iterable, r)', back: 'Generate all r-length combinations without repetition. combinations("ABCD", 2) → AB, AC, AD, BC, BD, CD.' },
      { front: 'enumerate(iterable)', back: 'Returns (index, value) pairs. for i, val in enumerate(lst): avoids manual index tracking.' },
      { front: 'zip(*iterables)', back: 'Combines multiple iterables element-wise. zip([1,2], [a,b]) → [(1,a), (2,b)]. Stops at shortest iterable.' },
      { front: 'sorted(iterable, key=func)', back: 'Returns a new sorted list. key function extracts comparison value. sorted(words, key=len) sorts by length. reverse=True for descending.' },
      { front: 'list comprehension with condition', back: '[x**2 for x in range(10) if x % 2 == 0] → [0, 4, 16, 36, 64]. Concise, faster than equivalent for-loop with append.' },
      { front: 'bisect module', back: 'Binary search on sorted lists. bisect_left(a, x) finds leftmost insertion point. bisect_right for rightmost. insort maintains sorted order.' },
    ],
  },
  // Set 20: Interview Behavioral Questions
  {
    title: 'Interview Behavioral Questions',
    description: 'STAR method frameworks for common behavioral interview questions.',
    visibility: 'friends',
    cards: [
      { front: 'Tell me about a time you solved a difficult technical problem.', back: 'Use STAR: describe the problem (Situation), your role (Task), your approach and debugging steps (Action), and the measurable outcome (Result). Focus on YOUR contribution.' },
      { front: 'Describe a time you disagreed with a teammate.', back: 'Show maturity: acknowledge the disagreement respectfully, explain how you listened to their perspective, describe how you found common ground or data to resolve it, and what the outcome was.' },
      { front: 'Tell me about a time you failed.', back: 'Choose a real failure, not a humble brag. Explain what went wrong, take ownership, describe what you learned, and how you applied that lesson going forward.' },
      { front: 'How do you prioritize when everything is urgent?', back: 'Discuss your framework: assess impact and deadlines, communicate with stakeholders, delegate when possible, focus on highest-impact items first. Give a concrete example.' },
      { front: 'Describe a project you are most proud of.', back: 'Pick a project with measurable impact. Describe the challenge, your technical decisions and why you made them, what you shipped, and the result. Show passion and depth.' },
      { front: 'How do you handle feedback?', back: 'Show you actively seek feedback. Give an example of receiving constructive criticism, describe how you processed it (not defensively), and what you changed as a result.' },
      { front: 'Why do you want to work at this company?', back: 'Research the company: mention specific products, engineering culture, recent blog posts, or team projects. Connect to your skills and career goals. Be genuine, not generic.' },
      { front: 'Tell me about a time you had to learn something quickly.', back: 'Describe the context (new technology, urgent deadline), your learning approach (documentation, mentors, hands-on practice), and how you delivered despite the learning curve.' },
    ],
  },
];

// ─── SECTION 6: Friends' Flashcard Sets (18 total — 3 per friend) ───────────

const friendFlashcardSets = {
  alexchen_cs: [
    {
      title: 'Sorting Algorithms',
      description: 'Key sorting algorithm properties, complexities, and trade-offs.',
      cards: [
        { front: 'Merge Sort — time complexity', back: 'O(n log n) in all cases (best, average, worst).' },
        { front: 'Merge Sort — space complexity', back: 'O(n) auxiliary space for the temporary merge array.' },
        { front: 'Quick Sort — best case pivot choice', back: 'Median element as pivot gives O(n log n). Random pivot or median-of-three avoids worst case.' },
        { front: 'Quick Sort — worst case', back: 'O(n²) when the pivot is always the smallest or largest element (already sorted input with first-element pivot).' },
        { front: 'Is Merge Sort stable?', back: 'Yes. Equal elements maintain their relative order. Quick Sort is NOT stable.' },
        { front: 'Is Heap Sort in-place?', back: 'Yes. O(1) auxiliary space. But NOT stable and has poor cache locality.' },
        { front: 'Counting Sort — when to use', back: 'When values are integers in a known, small range (k << n). O(n + k) time and space. Stable.' },
        { front: 'What is Timsort?', back: 'Hybrid of merge sort and insertion sort. Used by Python and Java. Exploits partially sorted runs. O(n log n) worst, O(n) best.' },
        { front: 'Insertion Sort — best case', back: 'O(n) when the input is already sorted. Only makes n-1 comparisons.' },
        { front: 'Lower bound for comparison-based sorting', back: 'Ω(n log n). Proven by decision tree model — any comparison sort must make at least n log n comparisons in the worst case.' },
      ],
    },
    {
      title: 'Tree Traversal Methods',
      description: 'Binary tree traversal orders and their applications.',
      cards: [
        { front: 'Preorder traversal', back: 'Visit root, then left subtree, then right subtree. Used for creating a copy of the tree and prefix expression evaluation.' },
        { front: 'Inorder traversal', back: 'Visit left subtree, then root, then right subtree. For BSTs, produces sorted order.' },
        { front: 'Postorder traversal', back: 'Visit left subtree, then right subtree, then root. Used for deleting a tree and postfix expression evaluation.' },
        { front: 'Level-order traversal (BFS)', back: 'Visit nodes level by level using a queue. Used for finding shortest path in unweighted trees and serialization.' },
        { front: 'Time complexity of any tree traversal', back: 'O(n) — each node is visited exactly once.' },
        { front: 'Space complexity of recursive traversal', back: 'O(h) for the call stack where h is the height. O(log n) for balanced trees, O(n) for skewed trees.' },
        { front: 'Morris Traversal', back: 'Inorder traversal with O(1) space by temporarily modifying tree pointers (threading). No stack or recursion needed.' },
        { front: 'How to reconstruct a binary tree from traversals', back: 'Preorder + Inorder OR Postorder + Inorder uniquely determine the tree. Preorder + Postorder alone is NOT sufficient (ambiguous).' },
      ],
    },
    {
      title: 'Recursion Patterns',
      description: 'Common recursion patterns for coding interviews.',
      cards: [
        { front: 'What is the base case?', back: 'The condition that stops recursion — the simplest instance of the problem that can be solved directly without further recursion.' },
        { front: 'Divide and conquer pattern', back: 'Split problem in half, solve each half recursively, combine results. Examples: merge sort, binary search, maximum subarray.' },
        { front: 'Master Theorem', back: 'For T(n) = aT(n/b) + O(n^d): if d > log_b(a) → O(n^d), if d = log_b(a) → O(n^d log n), if d < log_b(a) → O(n^(log_b(a))).' },
        { front: 'Backtracking template', back: 'Choose → Explore → Unchoose. Try each option, recurse with the choice, undo the choice before trying the next. Prune invalid states early.' },
        { front: 'Tail recursion', back: 'The recursive call is the last operation. Compilers can optimize it into iteration (no stack growth). Example: factorial with accumulator.' },
        { front: 'When to use memoization', back: 'When recursive calls have overlapping subproblems — the same inputs produce the same outputs. Store results in a hash map to avoid recomputation.' },
        { front: 'Stack overflow risk', back: 'Deep recursion (e.g., n > 10,000) can exceed call stack size. Convert to iteration or use tail recursion optimization.' },
        { front: 'Tree recursion vs linear recursion', back: 'Linear: one recursive call per frame. Tree: multiple calls per frame (e.g., Fibonacci). Tree recursion often has exponential time without memoization.' },
      ],
    },
  ],

  mayapatel_ds: [
    {
      title: 'Statistics Key Terms',
      description: 'Essential statistics vocabulary for data science and ML.',
      cards: [
        { front: 'What is the Central Limit Theorem?', back: 'The sampling distribution of the mean approaches a normal distribution as sample size increases, regardless of the population distribution (n ≥ 30 rule of thumb).' },
        { front: 'What is p-value?', back: 'The probability of observing data as extreme as the sample, assuming the null hypothesis is true. NOT the probability that the null is true.' },
        { front: 'Type I error vs Type II error', back: 'Type I: false positive (rejecting true H0, prob = α). Type II: false negative (failing to reject false H0, prob = β). Power = 1 - β.' },
        { front: 'What is R-squared?', back: 'Coefficient of determination: proportion of variance in the dependent variable explained by the model. R² = 1 - (SSR/SST). Ranges 0 to 1.' },
        { front: 'Bias-Variance Tradeoff', back: 'Simple models have high bias (underfit) and low variance. Complex models have low bias and high variance (overfit). Goal: find the sweet spot.' },
        { front: 'What is a confidence interval?', back: 'A range of values that, with a specified probability (e.g., 95%), contains the true population parameter. NOT: 95% probability the parameter is in this specific interval.' },
        { front: 'Pearson vs Spearman correlation', back: 'Pearson measures linear relationship between continuous variables. Spearman measures monotonic relationship using ranks — robust to outliers and non-linear relationships.' },
        { front: 'What is multicollinearity?', back: 'When independent variables are highly correlated with each other, making it difficult to determine individual effects. Check with VIF (Variance Inflation Factor > 10 is problematic).' },
        { front: 'What is heteroscedasticity?', back: 'When the variance of residuals is not constant across levels of the independent variable. Violates regression assumptions. Detected with residual plots or Breusch-Pagan test.' },
        { front: 'What is the law of large numbers?', back: 'As sample size increases, the sample mean converges to the true population mean. Foundation for statistical inference and Monte Carlo methods.' },
      ],
    },
    {
      title: 'ML Algorithm Overview',
      description: 'Quick comparison of common machine learning algorithms.',
      cards: [
        { front: 'Linear Regression', back: 'Supervised, regression. Fits a line/plane minimizing MSE. Assumes linear relationship, normal residuals. Regularized: Ridge (L2), Lasso (L1).' },
        { front: 'Logistic Regression', back: 'Supervised, classification. Uses sigmoid function to output probabilities. Decision boundary is linear. Good baseline for binary classification.' },
        { front: 'Decision Tree', back: 'Supervised, classification/regression. Splits data on features to maximize information gain. Interpretable but prone to overfitting. Fix: pruning, max depth.' },
        { front: 'Random Forest', back: 'Ensemble of decision trees trained on random subsets (bagging). Reduces overfitting, handles high-dimensional data. Less interpretable than single tree.' },
        { front: 'K-Nearest Neighbors (KNN)', back: 'Instance-based learning. Classifies by majority vote of k nearest neighbors. No training phase. Sensitive to feature scaling and curse of dimensionality.' },
        { front: 'Support Vector Machine (SVM)', back: 'Finds the hyperplane that maximizes margin between classes. Kernel trick enables non-linear boundaries. Effective in high dimensions.' },
        { front: 'K-Means Clustering', back: 'Unsupervised. Partitions data into k clusters by minimizing within-cluster variance. Must choose k. Sensitive to initialization (use k-means++).' },
        { front: 'Gradient Boosting (XGBoost, LightGBM)', back: 'Ensemble that trains trees sequentially, each correcting errors of the previous. Top performer on tabular data. Tune: learning rate, max depth, n_estimators.' },
      ],
    },
    {
      title: 'Python Data Science Toolkit',
      description: 'Key functions and patterns for data science in Python.',
      cards: [
        { front: 'pd.read_csv() key parameters', back: 'parse_dates (auto-parse date columns), index_col (set index), na_values (custom NaN markers), usecols (select columns), dtype (force types).' },
        { front: 'df.groupby().agg()', back: 'Group rows by column values and apply aggregate functions. agg({col: func}) for different functions per column. reset_index() to flatten.' },
        { front: 'df.merge() vs df.join()', back: 'merge: SQL-style join on column values (how, on, left_on, right_on). join: joins on index by default. merge is more explicit and preferred.' },
        { front: 'np.where(condition, x, y)', back: 'Vectorized if-else: returns x where condition is True, y where False. Much faster than Python loops.' },
        { front: 'train_test_split', back: 'from sklearn.model_selection. Splits data into training and test sets. Use test_size=0.2, random_state for reproducibility, stratify for balanced classes.' },
        { front: 'StandardScaler vs MinMaxScaler', back: 'StandardScaler: zero mean, unit variance (z-score). MinMaxScaler: scales to [0,1]. Use Standard for most ML, MinMax for neural networks or bounded features.' },
        { front: 'cross_val_score', back: 'K-fold cross-validation: splits data into k folds, trains on k-1 and tests on 1, rotates. Returns array of scores. More reliable than single train/test split.' },
        { front: 'df.apply(func, axis=1)', back: 'Apply a function to each row (axis=1) or column (axis=0). Slower than vectorized operations but flexible for complex logic.' },
        { front: 'Seaborn heatmap for correlation', back: 'sns.heatmap(df.corr(), annot=True, cmap="coolwarm"). Shows pairwise correlations with color coding. Quick way to spot multicollinearity.' },
        { front: 'pickle vs joblib for model saving', back: 'Both serialize Python objects. joblib is more efficient for large NumPy arrays (common in sklearn models). joblib.dump(model, file), joblib.load(file).' },
      ],
    },
  ],

  jordanwilliams: [
    {
      title: 'Digital Logic Gates',
      description: 'Fundamental logic gates and their truth tables.',
      cards: [
        { front: 'AND gate truth table', back: '0·0=0, 0·1=0, 1·0=0, 1·1=1. Output is 1 only when ALL inputs are 1.' },
        { front: 'OR gate truth table', back: '0+0=0, 0+1=1, 1+0=1, 1+1=1. Output is 1 when ANY input is 1.' },
        { front: 'XOR gate truth table', back: '0⊕0=0, 0⊕1=1, 1⊕0=1, 1⊕1=0. Output is 1 when inputs DIFFER.' },
        { front: 'What is a universal gate?', back: 'A gate that can implement any Boolean function. NAND and NOR are universal — any circuit can be built using only NAND gates (or only NOR gates).' },
        { front: 'De Morgan\'s Laws', back: '(A·B)\' = A\' + B\' and (A+B)\' = A\'·B\'. Break the bar, change the sign.' },
        { front: 'What is a multiplexer (MUX)?', back: 'Selects one of multiple input lines based on select lines. A 4:1 MUX has 4 data inputs, 2 select lines, 1 output.' },
        { front: 'What is a full adder?', back: 'Adds three bits (A, B, carry-in) and produces a sum bit and carry-out bit. Two half adders + OR gate.' },
        { front: 'What is a Karnaugh map?', back: 'A visual method for minimizing Boolean expressions. Arrange truth table values in a grid, group adjacent 1s in powers of 2, read simplified terms.' },
      ],
    },
    {
      title: 'Memory Hierarchy Terms',
      description: 'Key terminology for computer memory systems.',
      cards: [
        { front: 'What is temporal locality?', back: 'Recently accessed data is likely to be accessed again soon. Example: loop variables, frequently called functions.' },
        { front: 'What is spatial locality?', back: 'Data near recently accessed data is likely to be accessed soon. Example: sequential array access, instruction fetching.' },
        { front: 'The three Cs of cache misses', back: 'Compulsory (first access, unavoidable), Capacity (cache too small), Conflict (multiple blocks map to same set).' },
        { front: 'Direct-mapped vs set-associative cache', back: 'Direct-mapped: each block maps to one line (simple, conflict-prone). Set-associative: block maps to a set of N lines (fewer conflicts, more complex).' },
        { front: 'Write-back vs write-through', back: 'Write-through: every write goes to cache AND memory (consistent, slow). Write-back: writes go to cache only; dirty lines written on eviction (faster, complex).' },
        { front: 'What is the TLB?', back: 'Translation Lookaside Buffer: a cache for virtual-to-physical address translations. TLB miss requires expensive page table walk.' },
        { front: 'What is a page fault?', back: 'Accessing a virtual page not in physical memory. The OS loads the page from disk (swap), which takes milliseconds — orders of magnitude slower than memory access.' },
        { front: 'LRU replacement policy', back: 'Least Recently Used: evict the cache line that was accessed longest ago. Best general-purpose policy but expensive to implement exactly in hardware.' },
      ],
    },
    {
      title: 'ARM Assembly Instructions',
      description: 'Common ARM assembly instructions and their uses.',
      cards: [
        { front: 'MOV R0, #42', back: 'Move immediate value 42 into register R0.' },
        { front: 'LDR R0, [R1]', back: 'Load the word at the memory address in R1 into R0.' },
        { front: 'STR R0, [R1, #4]', back: 'Store the value in R0 to memory at address R1 + 4 (offset addressing).' },
        { front: 'BL function_label', back: 'Branch with Link: jump to function_label and save return address in LR (R14). Used for function calls.' },
        { front: 'BX LR', back: 'Branch to address in Link Register — return from function.' },
        { front: 'CMP R0, R1', back: 'Compare R0 and R1 by computing R0 - R1 and setting condition flags (N, Z, C, V). No result stored.' },
        { front: 'PUSH {R4-R6, LR}', back: 'Save registers R4, R5, R6, and LR onto the stack. Used at function entry to preserve callee-saved registers.' },
        { front: 'What makes ARM conditional execution unique?', back: 'Almost any instruction can be conditionally executed (MOVEQ, ADDNE) based on flags, avoiding branch penalties.' },
      ],
    },
  ],

  priyasharma: [
    {
      title: 'Organic Chemistry Reactions',
      description: 'Key reaction mechanisms and conditions in organic chemistry.',
      cards: [
        { front: 'SN1 mechanism', back: 'Two steps: leaving group departs forming carbocation, then nucleophile attacks. Unimolecular rate. Favors tertiary substrates, weak nucleophiles, polar protic solvents.' },
        { front: 'SN2 mechanism', back: 'One concerted step: nucleophile attacks as leaving group departs. Bimolecular rate. Favors primary substrates, strong nucleophiles, polar aprotic solvents. Walden inversion.' },
        { front: 'E1 vs E2', back: 'E1: two-step, carbocation intermediate, weak base, tertiary substrates. E2: one-step concerted, strong base, anti-periplanar geometry required.' },
        { front: 'Zaitsev\'s rule', back: 'In elimination reactions, the more substituted alkene is the major product (more stable due to hyperconjugation). Exception: bulky bases (Hofmann product).' },
        { front: 'What determines SN1 vs SN2?', back: 'Substrate (tertiary → SN1, primary → SN2), nucleophile strength, solvent polarity and protic/aprotic nature, and leaving group ability.' },
        { front: 'Markovnikov\'s rule', back: 'In electrophilic addition to alkenes, the electrophile adds to the less substituted carbon (H to the C with more Hs), giving the more substituted (stable) carbocation.' },
        { front: 'Anti-Markovnikov addition', back: 'Occurs with peroxide-initiated HBr addition (radical mechanism). Also hydroboration-oxidation gives anti-Markovnikov alcohol.' },
        { front: 'Grignard reagent reaction with carbonyl', back: 'RMgX attacks the electrophilic carbonyl carbon. Aldehyde → secondary alcohol. Ketone → tertiary alcohol. Formaldehyde → primary alcohol.' },
        { front: 'Acid-base in organic chemistry', back: 'Stronger acid = more stable conjugate base. Stability factors: electronegativity, size, resonance, induction, orbital (sp > sp2 > sp3).' },
        { front: 'Chirality and R/S assignment', back: 'Assign priorities by atomic number (CIP rules). Orient lowest priority away from you. Clockwise = R, counterclockwise = S.' },
      ],
    },
    {
      title: 'Biochem Key Enzymes',
      description: 'Important enzymes in metabolic pathways and their regulation.',
      cards: [
        { front: 'Hexokinase', back: 'First step of glycolysis: phosphorylates glucose → glucose-6-phosphate. Inhibited by glucose-6-phosphate (product inhibition). Traps glucose in the cell.' },
        { front: 'Phosphofructokinase-1 (PFK-1)', back: 'Rate-limiting enzyme of glycolysis. Fructose-6-P → Fructose-1,6-bisP. Activated by AMP, fructose-2,6-bisP. Inhibited by ATP, citrate.' },
        { front: 'Pyruvate dehydrogenase', back: 'Links glycolysis to TCA cycle: pyruvate → acetyl-CoA + CO2 + NADH. Inhibited by acetyl-CoA and NADH. Activated by CoA and NAD+.' },
        { front: 'Citrate synthase', back: 'First step of TCA cycle: oxaloacetate + acetyl-CoA → citrate. Inhibited by ATP, NADH, citrate.' },
        { front: 'Isocitrate dehydrogenase', back: 'TCA cycle: isocitrate → α-ketoglutarate + CO2 + NADH. Rate-limiting step. Activated by ADP. Inhibited by ATP, NADH.' },
        { front: 'ATP synthase', back: 'Uses proton gradient (from ETC) to synthesize ATP from ADP + Pi. Located in inner mitochondrial membrane. ~30-32 ATP per glucose via oxidative phosphorylation.' },
        { front: 'Acetyl-CoA carboxylase', back: 'Rate-limiting enzyme of fatty acid synthesis: acetyl-CoA → malonyl-CoA. Activated by citrate, insulin. Inhibited by palmitoyl-CoA, glucagon.' },
        { front: 'Glycogen phosphorylase', back: 'Breaks down glycogen → glucose-1-phosphate. Activated by glucagon (liver) and epinephrine (muscle) via cAMP cascade.' },
      ],
    },
    {
      title: 'MCAT Vocab',
      description: 'High-yield MCAT vocabulary across all sections.',
      cards: [
        { front: 'Oxidative phosphorylation', back: 'The process where the electron transport chain creates a proton gradient used by ATP synthase to produce ATP. Occurs in inner mitochondrial membrane. Produces ~30-32 ATP/glucose.' },
        { front: 'Hardy-Weinberg equilibrium', back: 'p² + 2pq + q² = 1 (genotypes), p + q = 1 (alleles). Conditions: no mutation, random mating, no selection, large population, no migration.' },
        { front: 'Le Chatelier\'s principle', back: 'A system at equilibrium will shift to counteract any imposed stress: adding reactant shifts right, adding product shifts left, increasing pressure favors fewer moles of gas.' },
        { front: 'Michaelis-Menten equation', back: 'v = Vmax[S] / (Km + [S]). Km = substrate concentration at half Vmax. Low Km = high affinity.' },
        { front: 'Piaget\'s stages of cognitive development', back: 'Sensorimotor (0-2), Preoperational (2-7), Concrete operational (7-11), Formal operational (11+).' },
        { front: 'Erikson\'s psychosocial stages (key ones)', back: 'Identity vs Role Confusion (adolescence), Intimacy vs Isolation (young adult), Generativity vs Stagnation (middle adult).' },
        { front: 'Sympathetic vs parasympathetic nervous system', back: 'Sympathetic: fight-or-flight (increases HR, dilates pupils, inhibits digestion). Parasympathetic: rest-and-digest (decreases HR, constricts pupils, promotes digestion).' },
        { front: 'Henderson-Hasselbalch equation', back: 'pH = pKa + log([A-]/[HA]). When pH = pKa, [A-] = [HA] (half equivalence point). Buffer capacity is greatest at pH = pKa ± 1.' },
        { front: 'Central dogma of molecular biology', back: 'DNA → (transcription) → mRNA → (translation) → Protein. Exceptions: reverse transcriptase (RNA→DNA), RNA replication in some viruses.' },
        { front: 'Operant conditioning', back: 'Behavior modified by consequences. Positive reinforcement (add reward), negative reinforcement (remove aversive), punishment (add aversive or remove reward).' },
      ],
    },
  ],

  marcusjohnson: [
    {
      title: 'Finance Interview Questions',
      description: 'Common technical questions for investment banking interviews.',
      cards: [
        { front: 'Walk me through a DCF.', back: 'Project free cash flows (5-10 years), calculate terminal value (perpetuity growth or exit multiple), discount all to present using WACC, sum for enterprise value. Subtract net debt for equity value.' },
        { front: 'What is WACC?', back: 'Weighted Average Cost of Capital: (E/V × Re) + (D/V × Rd × (1-t)). Blends cost of equity (CAPM) and after-tax cost of debt, weighted by market values.' },
        { front: 'How does $10 depreciation affect the 3 statements?', back: 'IS: operating income down $10, tax savings of $10×t, net income down $10×(1-t). CFS: add back $10 depreciation (non-cash). BS: PP&E down $10, retained earnings down $10×(1-t), cash up by tax savings.' },
        { front: 'Enterprise Value formula', back: 'EV = Market Cap + Total Debt + Preferred Stock + Minority Interest - Cash. Represents the total value of the business to all capital providers.' },
        { front: 'Why might a company with positive net income go bankrupt?', back: 'Net income is accrual-based. Cash flow can be negative due to large capital expenditures, working capital buildup, debt repayments, or timing differences between revenue recognition and cash collection.' },
        { front: 'What is the difference between EV/EBITDA and P/E?', back: 'EV/EBITDA: capital-structure neutral, pre-tax (better for comparisons). P/E: affected by leverage and tax differences. EV/EBITDA is preferred for comparing companies with different capital structures.' },
        { front: 'What is a leveraged buyout (LBO)?', back: 'Acquiring a company using significant debt (60-80% of purchase price). Returns driven by debt paydown, EBITDA growth, and multiple expansion. Targets: stable cash flows, low capex.' },
        { front: 'Explain accretion vs dilution in M&A.', back: 'Accretive: combined EPS is higher than acquirer standalone EPS (good). Dilutive: combined EPS is lower (needs strong strategic rationale). Test: compare acquirer cost of acquisition to target earnings yield.' },
        { front: 'What is working capital?', back: 'Current assets - current liabilities. Measures short-term liquidity. Increases in WC consume cash (you are tying up money in receivables/inventory).' },
        { front: 'What is beta in CAPM?', back: 'Measures systematic risk of an asset relative to the market. β=1: moves with market. β>1: more volatile. β<1: less volatile. Used in Re = Rf + β(Rm - Rf).' },
      ],
    },
    {
      title: 'Financial Ratios',
      description: 'Key financial ratios for analysis and interviews.',
      cards: [
        { front: 'Gross Margin', back: '(Revenue - COGS) / Revenue. Measures production efficiency. Higher is better. Industry-dependent.' },
        { front: 'EBITDA Margin', back: 'EBITDA / Revenue. Operating profitability before D&A, interest, and tax. Useful for comparing companies with different capital structures.' },
        { front: 'Net Profit Margin', back: 'Net Income / Revenue. Bottom-line profitability after all expenses. Affected by capital structure and tax rates.' },
        { front: 'Return on Equity (ROE)', back: 'Net Income / Shareholders Equity. Measures profitability relative to shareholder investment. Can be inflated by high leverage (DuPont decomposition).' },
        { front: 'Debt-to-Equity Ratio', back: 'Total Debt / Shareholders Equity. Measures financial leverage. Higher ratio = more debt-financed = higher risk.' },
        { front: 'Current Ratio', back: 'Current Assets / Current Liabilities. Measures short-term liquidity. >1 means can cover short-term obligations. Too high may indicate inefficient asset use.' },
        { front: 'Interest Coverage Ratio', back: 'EBIT / Interest Expense. Measures ability to service debt. Below 1.5x is concerning. Lenders use this as a covenant.' },
        { front: 'Price-to-Earnings (P/E) Ratio', back: 'Share Price / Earnings Per Share. How much investors pay per dollar of earnings. Higher P/E implies higher growth expectations.' },
      ],
    },
    {
      title: 'Valuation Methods',
      description: 'Three core valuation approaches used in investment banking.',
      cards: [
        { front: 'DCF — when to use', back: 'When the company has predictable cash flows and you want an intrinsic value. Best for mature, stable businesses. Not suitable for pre-revenue startups.' },
        { front: 'Comparable Companies — what multiples', back: 'EV/EBITDA (most common), EV/Revenue (for unprofitable or high-growth), P/E (simple but affected by leverage). Use median of peer group.' },
        { front: 'Precedent Transactions — control premium', back: 'Transaction multiples are typically 20-40% higher than trading multiples because acquirers pay a premium for control (synergies, strategic value).' },
        { front: 'Terminal value — two methods', back: 'Gordon Growth: FCF(1+g)/(WACC-g). Exit Multiple: terminal EBITDA × EV/EBITDA multiple. Terminal value often represents 60-80% of total DCF value.' },
        { front: 'CAPM formula', back: 'Re = Rf + β(Rm - Rf). Risk-free rate + beta × equity risk premium. Typically: Rf = 10yr Treasury, ERP = 5-6%, β from comparable companies.' },
        { front: 'Free Cash Flow to Firm (FCFF)', back: 'EBIT(1-t) + D&A - CapEx - ΔWorking Capital. Cash available to all capital providers (debt and equity). Discount at WACC.' },
        { front: 'Football field chart', back: 'Side-by-side comparison of valuation ranges from each method (DCF, Comps, Precedents). Shows the overlap and helps identify a defensible valuation range.' },
        { front: 'Sum-of-the-parts valuation', back: 'Value each business segment separately using the most appropriate method, then sum. Used for conglomerates or companies with distinct business lines.' },
      ],
    },
  ],

  sofiarod: [
    {
      title: 'Psych Research Methods',
      description: 'Research design and methodology concepts in psychology.',
      cards: [
        { front: 'Independent variable vs dependent variable', back: 'IV: what the researcher manipulates (cause). DV: what is measured (effect). In an experiment on sleep and memory: sleep duration = IV, test score = DV.' },
        { front: 'Internal validity', back: 'The degree to which a study establishes a causal relationship between IV and DV, free from confounds. Maximized by random assignment and controls.' },
        { front: 'External validity', back: 'The degree to which findings generalize to other populations, settings, and times. Threatened by WEIRD samples and artificial lab conditions.' },
        { front: 'Random assignment vs random sampling', back: 'Random assignment: participants randomly placed into conditions (reduces confounds). Random sampling: participants randomly selected from population (increases generalizability).' },
        { front: 'What is a confounding variable?', back: 'An uncontrolled variable that correlates with both IV and DV, creating a spurious relationship. Controlled through random assignment, matching, or statistical control.' },
        { front: 'Correlation does not imply causation — why?', back: 'Three reasons: directionality problem (A causes B or B causes A?), third variable problem (C causes both), and coincidence.' },
        { front: 'What is operationalization?', back: 'Defining abstract concepts in terms of specific, measurable procedures. Example: operationalizing "anxiety" as score on the State-Trait Anxiety Inventory.' },
        { front: 'Inter-rater reliability', back: 'The degree of agreement between two or more raters measuring the same behavior. Measured by Cohen\'s kappa. Essential for observational studies.' },
      ],
    },
    {
      title: 'Cognitive Psychology Terms',
      description: 'Key concepts in cognitive psychology: attention, memory, and thinking.',
      cards: [
        { front: 'Working memory capacity', back: 'Approximately 4 chunks of information (updated from Miller\'s 7±2). Limited capacity system for active processing. Measured by complex span tasks.' },
        { front: 'Encoding specificity principle', back: 'Memory retrieval is best when the retrieval context matches the encoding context. Explains context-dependent and state-dependent memory effects.' },
        { front: 'Levels of processing (Craik & Lockhart)', back: 'Deeper semantic processing (meaning) produces stronger memory than shallow structural processing (font, case). Elaborative processing creates more retrieval cues.' },
        { front: 'What is priming?', back: 'Prior exposure to a stimulus influences response to a subsequent stimulus. Example: seeing "NURSE" speeds recognition of "DOCTOR." Demonstrates implicit memory.' },
        { front: 'Dual coding theory (Paivio)', back: 'Information is better remembered when encoded in both verbal and visual formats. Pictures and words together > words alone. Supports multimedia learning.' },
        { front: 'Cognitive load theory', back: 'Working memory has limited capacity. Intrinsic load (task complexity), extraneous load (poor design), germane load (schema building). Minimize extraneous to maximize learning.' },
        { front: 'What is the testing effect?', back: 'Actively retrieving information from memory strengthens that memory more than restudying. Practice tests > re-reading. The effort of retrieval is the key.' },
        { front: 'Schema theory', back: 'Schemas are mental frameworks that organize knowledge and guide perception, memory, and inference. They aid understanding but can cause distortion (fitting new info to existing schemas).' },
        { front: 'Inattentional blindness', back: 'Failing to notice a visible object when attention is directed elsewhere. Famous example: gorilla walking through basketball game. Demonstrates attention is selective.' },
        { front: 'Spacing effect', back: 'Distributed practice (studying over time) produces better long-term retention than massed practice (cramming). One of the most robust findings in cognitive psychology.' },
      ],
    },
    {
      title: 'Neuroscience Basics',
      description: 'Fundamental neuroscience concepts and brain structures.',
      cards: [
        { front: 'Resting membrane potential', back: '-70mV. Maintained by Na+/K+ ATPase pump (3 Na+ out, 2 K+ in). Inside of neuron is negatively charged relative to outside.' },
        { front: 'What triggers an action potential?', back: 'Depolarization reaching threshold (-55mV). Voltage-gated Na+ channels open, Na+ rushes in (depolarization to +40mV). Then K+ channels open (repolarization).' },
        { front: 'What is long-term potentiation (LTP)?', back: 'Strengthening of synaptic connections through repeated stimulation. Proposed neural mechanism for learning and memory. Requires NMDA receptor activation and calcium influx.' },
        { front: 'Hippocampus function', back: 'Critical for forming new explicit (declarative) memories. Damage causes anterograde amnesia (cannot form new memories). Famous case: patient H.M.' },
        { front: 'Amygdala function', back: 'Emotional processing, especially fear conditioning and threat detection. Projects to hypothalamus for stress response. Involved in emotional memory enhancement.' },
        { front: 'Broca\'s vs Wernicke\'s area', back: 'Broca (left frontal): speech production. Damage → non-fluent aphasia (know what to say but can\'t say it). Wernicke (left temporal): language comprehension. Damage → fluent but meaningless speech.' },
        { front: 'Dopamine pathways', back: 'Mesolimbic: reward and motivation (addiction). Mesocortical: cognition, executive function. Nigrostriatal: motor control (Parkinson\'s). Tuberoinfundibular: hormone regulation.' },
        { front: 'GABA and glutamate', back: 'GABA: primary inhibitory neurotransmitter (reduces neural activity). Glutamate: primary excitatory (increases activity). Balance between them is critical for normal brain function.' },
      ],
    },
  ],
};

// ─── SECTION 9: Conversation Messages (6 conversations) ─────────────────────

const conversations = {
  alex: [
    { sender: 'justin', content: 'Hey Alex, you down for a study session this week? I want to go over the DP lecture notes before the assignment drops.', date: '2026-02-05' },
    { sender: 'friend', content: 'Absolutely. I was actually going to message you about that. The memoization vs tabulation stuff is clicking but I want to practice more problems together.', date: '2026-02-05' },
    { sender: 'justin', content: 'Same. I made some flashcards on the DP concepts — want me to share the set so we can quiz each other?', date: '2026-02-06' },
    { sender: 'friend', content: 'Yes please. I will bring my whiteboard markers too. Nothing beats drawing out the recursion trees by hand.', date: '2026-02-06' },
    { sender: 'justin', content: 'Thursday 4pm at Siebel? We can grab the study room on the second floor.', date: '2026-02-07' },
    { sender: 'friend', content: 'Works for me. I will also prep some LeetCode mediums for us to work through — thinking coin change and house robber.', date: '2026-02-07' },
    { sender: 'justin', content: 'Perfect choices. I just solved house robber yesterday and the state transition is clean once you see it. I can walk you through my approach.', date: '2026-02-08' },
    { sender: 'friend', content: 'How was the linked list assignment? I finished last night — the iterator implementation was trickier than I expected.', date: '2026-02-12' },
    { sender: 'justin', content: 'Got it done. The doubly linked list delete had an edge case with the tail pointer that took me an hour to debug. Classic off-by-one territory.', date: '2026-02-12' },
    { sender: 'friend', content: 'Oh I hit that exact bug. Had to draw out the pointer diagram on paper before the fix was obvious.', date: '2026-02-13' },
    { sender: 'justin', content: 'Hey so I have my Stripe technical screen tomorrow. Any last-minute tips? You did the Amazon OA already right?', date: '2026-02-14' },
    { sender: 'friend', content: 'Talk through your approach before coding. They care about your thought process as much as the solution. And always clarify edge cases first — it shows maturity.', date: '2026-02-14' },
    { sender: 'justin', content: 'Good advice. I have been doing that in our practice sessions and it feels natural now. Fingers crossed.', date: '2026-02-14' },
    { sender: 'friend', content: 'You are going to crush it. Your DP skills are solid and you explain things clearly. That is literally what they are looking for.', date: '2026-02-15' },
    { sender: 'justin', content: 'UPDATE: Stripe screen went really well. The interviewer was super chill and the problem was a graph traversal that I recognized immediately.', date: '2026-02-16' },
    { sender: 'friend', content: 'Let\'s go! That is awesome. When do you hear back?', date: '2026-02-16' },
    { sender: 'justin', content: 'Recruiter said one to two weeks. Trying not to refresh my email every five minutes.', date: '2026-02-17' },
    { sender: 'friend', content: 'The waiting is the worst part. Distract yourself with the red-black tree assignment lol.', date: '2026-02-17' },
    { sender: 'justin', content: 'BIG NEWS. Stripe offered me the internship. $58/hr, payments infrastructure team in SF. I am genuinely in shock right now.', date: '2026-02-28' },
    { sender: 'friend', content: 'DUDE. That is incredible. Seriously congrats — you earned this. Payments infrastructure is exactly what you wanted too.', date: '2026-02-28' },
    { sender: 'justin', content: 'Thanks man. Could not have done it without all our study sessions. You helped me level up my problem-solving way faster than I would have on my own.', date: '2026-03-01' },
    { sender: 'friend', content: 'That goes both ways. Are you going to the ACM hackathon in April? We should team up.', date: '2026-03-03' },
    { sender: 'justin', content: 'Definitely in. I was thinking we could build something related to developer tools — maybe a code review assistant or a LeetCode progress tracker.', date: '2026-03-04' },
    { sender: 'friend', content: 'LeetCode tracker is a great idea. We could pull problem data from the API and build spaced repetition into the review schedule.', date: '2026-03-05' },
    { sender: 'justin', content: 'Love it. Let us scope it out this weekend. I will set up the repo and we can divide the work. This is going to be fun.', date: '2026-03-06' },
  ],

  maya: [
    { sender: 'justin', content: 'Hey Maya, I saw your pandas cheat sheet note — would you mind sharing it? I am trying to learn enough data wrangling for my side project.', date: '2026-02-08' },
    { sender: 'friend', content: 'Of course! I just shared it with friends visibility. The groupby section is the most useful part — once you get that, pandas makes way more sense.', date: '2026-02-08' },
    { sender: 'justin', content: 'Thanks! Quick question — what is the difference between apply and vectorized operations? My loop-based approach is painfully slow on a 100K row dataset.', date: '2026-02-10' },
    { sender: 'friend', content: 'Vectorized operations use NumPy under the hood and are 10-100x faster than apply. If you can express your logic as array operations instead of row-by-row, always do that. Only use apply as a last resort.', date: '2026-02-10' },
    { sender: 'justin', content: 'That explains a lot. I rewrote my data cleaning step using vectorized ops and it went from 45 seconds to under 1 second. Mind blown.', date: '2026-02-11' },
    { sender: 'friend', content: 'Welcome to the NumPy speed gospel. Once you see the difference you never go back to loops. What is your side project about?', date: '2026-02-11' },
    { sender: 'justin', content: 'Building a study analytics dashboard — tracking my LeetCode progress, study hours, and exam scores over time. Want to find patterns in what study methods actually work.', date: '2026-02-12' },
    { sender: 'friend', content: 'That is such a cool project. If you want, I can help you with the statistical analysis part. Correlation between study hours and exam scores, regression model to predict outcomes, that kind of thing.', date: '2026-02-13' },
    { sender: 'justin', content: 'That would be amazing. I know enough stats to be dangerous but not enough to be useful.', date: '2026-02-13' },
    { sender: 'friend', content: 'Ha, that is how I feel about algorithms. Speaking of which, can you explain the intuition behind Dijkstra to me? I need it for a graph-based recommendation system in my ML project.', date: '2026-02-18' },
    { sender: 'justin', content: 'Of course. Think of it like this: you are exploring outward from the source, always visiting the closest unvisited node first. The priority queue ensures you always pick the shortest known path.', date: '2026-02-18' },
    { sender: 'friend', content: 'Oh that makes more sense than the textbook explanation. So it is basically greedy — once you visit a node, you know the shortest path to it?', date: '2026-02-19' },
    { sender: 'justin', content: 'Exactly. That greedy property only works because all edges are non-negative. If you have negative edges, you need Bellman-Ford instead.', date: '2026-02-19' },
    { sender: 'friend', content: 'Thank you! I implemented it and my recommendation system is finding shortest paths through the user-item graph. Your explanation saved me hours of confusion.', date: '2026-02-22' },
    { sender: 'justin', content: 'Happy to help. We should do more of these cross-discipline knowledge swaps — you teach me stats, I teach you algorithms.', date: '2026-02-23' },
    { sender: 'friend', content: 'Deal. Are you stressing about internship decisions? I am weighing a data science internship at a healthcare startup vs a bigger company.', date: '2026-03-08' },
    { sender: 'justin', content: 'A little. I have Stripe as my top choice but waiting on Google. The uncertainty is hard. What are you leaning toward?', date: '2026-03-09' },
    { sender: 'friend', content: 'The healthcare startup. Smaller team means I would get more ownership, and using ML to improve patient outcomes feels meaningful. The big company would look better on a resume though.', date: '2026-03-10' },
    { sender: 'justin', content: 'Go with the one where you will learn the most. Resume prestige fades fast but skills compound. At least that is what Jordan told me and I think he is right.', date: '2026-03-11' },
    { sender: 'friend', content: 'That is really good advice. I think I knew the answer already but needed someone to validate it. Thanks Justin.', date: '2026-03-12' },
    { sender: 'justin', content: 'Anytime. We are all figuring this out together. Let me know when you decide — I want to celebrate with you either way.', date: '2026-03-13' },
    { sender: 'friend', content: 'Going with the healthcare startup! They want me to build a patient readmission prediction model. I am terrified and excited.', date: '2026-03-18' },
  ],

  jordan: [
    { sender: 'friend', content: 'Hey Justin, welcome to the group project team. I set up a Slack channel for us: #cs301-kvstore. Alex is already in.', date: '2026-01-25' },
    { sender: 'justin', content: 'Joined. I have been reading the Raft paper — the leader election section is clearer than I expected but log compaction looks brutal.', date: '2026-01-26' },
    { sender: 'friend', content: 'Yeah log compaction is the hardest part. We should save it for Milestone 2 and focus on getting basic consensus working first.', date: '2026-01-26' },
    { sender: 'justin', content: 'Agreed. How are you thinking about the network layer? gRPC seems like the right choice for structured RPC between nodes.', date: '2026-01-28' },
    { sender: 'friend', content: 'gRPC with protobuf is the way to go. I have used it in a previous embedded project for inter-process communication and it worked great. I can own the networking layer if you want to focus on consensus.', date: '2026-01-29' },
    { sender: 'justin', content: 'Deal. Alex is taking the storage engine. That gives us a clean separation of concerns. Weekly syncs Thursdays at 4?', date: '2026-01-30' },
    { sender: 'friend', content: 'Perfect. Quick question — as a senior who has been through recruiting, do you have any advice for someone going through it for the first time?', date: '2026-02-05' },
    { sender: 'justin', content: 'Absolutely — what are you curious about?', date: '2026-02-05' },
    { sender: 'friend', content: 'Well I just got rejected from Amazon and Goldman this week. Feeling a bit demoralized. How do you keep going when the rejections pile up?', date: '2026-02-08' },
    { sender: 'friend', content: 'Rejections are data, not verdicts. I got rejected from 15 companies before landing my first offer senior year. The process is a numbers game — apply broadly, prepare deeply, and do not take any single rejection personally.', date: '2026-02-08' },
    { sender: 'justin', content: 'That actually helps a lot. 15 rejections? I would never have guessed that from where you are now.', date: '2026-02-09' },
    { sender: 'friend', content: 'Everyone has a rejection pile they do not talk about. The people who get good outcomes are the ones who kept applying after the fifth rejection, not the ones who never got rejected.', date: '2026-02-09' },
    { sender: 'justin', content: 'The Raft leader election is working! I tested with three nodes and it correctly elects a new leader when I kill the current one. The randomized election timeout trick was key.', date: '2026-02-25' },
    { sender: 'friend', content: 'Nice work. I got the gRPC layer connected. Let us integrate this week — I can forward client requests from followers to the leader through the RPC channel.', date: '2026-02-26' },
    { sender: 'justin', content: 'Sounds good. Also — I got a Stripe offer today. Payments infrastructure team, $58/hr in SF.', date: '2026-02-28' },
    { sender: 'friend', content: 'Congratulations! Stripe is an amazing company with world-class engineering. The payments team works on some of the most interesting distributed systems problems in the industry.', date: '2026-03-01' },
    { sender: 'justin', content: 'Thanks Jordan. Your advice about not giving up after rejections was exactly what I needed to hear a few weeks ago.', date: '2026-03-01' },
    { sender: 'friend', content: 'Just paying it forward. Someone told me the same thing when I was in your shoes. SF is going to be an incredible experience — make the most of it.', date: '2026-03-02' },
    { sender: 'justin', content: 'How is your full-time job search going? Any offers yet?', date: '2026-03-10' },
    { sender: 'friend', content: 'Got an offer from Qualcomm for embedded systems engineering. Good team, good work, but I am still waiting on Apple. If Apple comes through I would lean that direction.', date: '2026-03-11' },
  ],

  priya: [
    { sender: 'friend', content: 'Hey Justin! I saw you at the library yesterday — were you in the third floor study room? I was right around the corner in the bio section.', date: '2026-02-10' },
    { sender: 'justin', content: 'Ha, yeah I was there until midnight working on the linked list assignment. Small world. How is MCAT prep going?', date: '2026-02-10' },
    { sender: 'friend', content: 'It has not started officially yet — that is a summer project. Right now I am drowning in organic chemistry reaction mechanisms. SN1 vs SN2 is the bane of my existence.', date: '2026-02-11' },
    { sender: 'justin', content: 'I have zero context for organic chemistry but the way you describe it sounds like debugging. You have inputs, a process, and you need to predict the output based on conditions.', date: '2026-02-11' },
    { sender: 'friend', content: 'That is actually a really helpful analogy. The substrate is like the input, the reaction conditions are like the environment, and the product is the output. I might steal that framing.', date: '2026-02-12' },
    { sender: 'justin', content: 'Please do. Honestly, talking to people outside CS gives me perspective I do not get from my own classes. How do you manage studying for so many science courses at once?', date: '2026-02-14' },
    { sender: 'friend', content: 'Structured 90-minute study blocks with zero phone. Pomodoro but longer. I physically put my phone in my backpack in another room. The first 10 minutes are painful but then I hit flow state.', date: '2026-02-15' },
    { sender: 'justin', content: 'I need to try that. I catch myself checking my phone every 15 minutes during study sessions. It is destroying my deep work capacity.', date: '2026-02-15' },
    { sender: 'friend', content: 'The trick is making the phone physically inaccessible, not just silenced. Out of sight, out of mind. Your brain stops looking for it after about 20 minutes.', date: '2026-02-16' },
    { sender: 'justin', content: 'Tried your method today. Got through an entire algorithms problem set without a single distraction. I am converted.', date: '2026-02-20' },
    { sender: 'friend', content: 'Welcome to the focused club! Also I have a random question — I want to build a simple study tracker app for my MCAT prep. Nothing fancy, just logging hours and topics. Do I need to learn to code for that?', date: '2026-02-25' },
    { sender: 'justin', content: 'You could use a spreadsheet honestly. But if you want a simple app, I could help you build one as a side project. It would be a fun way for me to practice React.', date: '2026-02-25' },
    { sender: 'friend', content: 'Really? That would be amazing! I do not want to take up your time though — I know you are juggling a lot with interviews and coursework.', date: '2026-02-26' },
    { sender: 'justin', content: 'It would honestly be fun and it would not be complicated. A simple form to log study sessions, a dashboard showing hours per topic, maybe a streak counter. Weekend project at most.', date: '2026-02-27' },
    { sender: 'friend', content: 'You are the best. I will write up what I need and send it to you. In exchange I will share my MCAT study strategy notes — some of the memory techniques apply to any kind of studying.', date: '2026-02-28' },
    { sender: 'justin', content: 'Deal. Your study techniques have already improved my productivity more than any productivity app ever has.', date: '2026-03-01' },
    { sender: 'friend', content: 'Heard you got the Stripe offer! Congrats! My roommate interned there last summer and said the culture is incredible.', date: '2026-03-02' },
    { sender: 'justin', content: 'Thank you! I am really excited. How are your med school prep plans shaping up?', date: '2026-03-03' },
    { sender: 'friend', content: 'On track. Research hours are piling up nicely and I just got asked to present a poster at the undergrad research symposium. Scary but exciting.', date: '2026-03-05' },
    { sender: 'justin', content: 'That is huge! You are going to crush it. If you need someone to practice your presentation on, I am happy to be a test audience even if I will not understand half the biology.', date: '2026-03-06' },
  ],

  marcus: [
    { sender: 'justin', content: 'Hey Marcus, that finance networking event you invited me to was wild. The energy in that room was completely different from any tech event I have been to.', date: '2026-02-08' },
    { sender: 'friend', content: 'Ha, welcome to Wall Street culture. Everyone is always "on" at those events. But beneath the suits and firm handshakes, they are just nervous students like us trying to land internships.', date: '2026-02-08' },
    { sender: 'justin', content: 'Fair point. I was impressed by how polished everyone\'s elevator pitch was though. In CS we just talk about our projects and hope for the best.', date: '2026-02-09' },
    { sender: 'friend', content: 'The pitch thing is actually a skill worth learning even for tech. Being able to explain what you do in 30 seconds is valuable in any industry. Want me to help you craft one?', date: '2026-02-09' },
    { sender: 'justin', content: 'That would be great actually. I have an on-site at Google coming up and the behavioral round is what I am most nervous about.', date: '2026-02-12' },
    { sender: 'friend', content: 'STAR method is your friend. Situation, Task, Action, Result. Have three strong stories ready and you can adapt them to any question. I will walk you through it.', date: '2026-02-12' },
    { sender: 'justin', content: 'Done. We practiced three stories and they feel so much tighter now. Your feedback on quantifying the results was the game changer.', date: '2026-02-15' },
    { sender: 'friend', content: 'Always quantify. "I improved the system" is weak. "I reduced API response time by 40% serving 50K daily users" is strong. Numbers make stories memorable.', date: '2026-02-15' },
    { sender: 'justin', content: 'Totally different topic — I need help with something. I am building a study analytics project and I want to add some basic financial modeling concepts. Like tracking ROI on study hours.', date: '2026-02-22' },
    { sender: 'friend', content: 'Oh that is a cool concept. Think of study hours as capital investment and exam scores as returns. You could calculate an "efficiency ratio" — score improvement per hour studied.', date: '2026-02-22' },
    { sender: 'justin', content: 'I love that framing. Can you help me set up the spreadsheet model? I can handle the code but the financial modeling logic is your territory.', date: '2026-02-23' },
    { sender: 'friend', content: 'Sent you a template. I also added a section on diminishing returns — at some point, extra study hours have less marginal impact. There is an optimal allocation across subjects.', date: '2026-02-24' },
    { sender: 'justin', content: 'This is brilliant. Diminishing returns on study hours is basically the same concept as the knapsack problem in algorithms. Optimize allocation given constraints.', date: '2026-02-25' },
    { sender: 'friend', content: 'See, CS and finance are more similar than people think. Different vocabularies, same underlying optimization problems. Speaking of which — I need CS help. How do I automate a DCF model in Excel with VBA?', date: '2026-03-01' },
    { sender: 'justin', content: 'VBA is like Python but worse in every way. I can show you the basics — loops, conditionals, accessing cells. Once you have those, you can automate any spreadsheet task.', date: '2026-03-01' },
    { sender: 'friend', content: 'You are saving my life. My internship at the IB will expect me to build models fast and VBA automation would give me a huge edge.', date: '2026-03-02' },
    { sender: 'justin', content: 'Got the Stripe offer! $58/hr in SF. I wanted to ask you — any tips on evaluating competing offers? I have four on the table.', date: '2026-03-03' },
    { sender: 'friend', content: 'Congrats! My advice: do not negotiate intern offers aggressively. Companies have less flexibility and you risk the relationship. Instead, ask for small perks — housing stipend, start date flexibility, team preference.', date: '2026-03-03' },
    { sender: 'justin', content: 'That is exactly the opposite of what I was going to do. I was about to try leveraging offers against each other. Thank you for the reality check.', date: '2026-03-04' },
    { sender: 'friend', content: 'In finance we negotiate everything, but intern recruiting is different. The companies remember how you handled the process. Be gracious, be decisive, and build the relationship for the long term.', date: '2026-03-05' },
    { sender: 'justin', content: 'Wisdom from the finance world. I appreciate you always giving me the perspective I cannot see from inside the tech bubble.', date: '2026-03-06' },
  ],

  sofia: [
    { sender: 'justin', content: 'Hey Sofia, we are in the same research methods section right? I think I saw you in Professor Walsh\'s Tuesday lecture.', date: '2026-02-10' },
    { sender: 'friend', content: 'Yes! I sit near the back. You are the CS student taking it as an elective right? What made you interested in research methods?', date: '2026-02-10' },
    { sender: 'justin', content: 'I want to do research eventually and realized I have no formal training in experimental design. CS teaches you to build things but not how to rigorously evaluate if they work.', date: '2026-02-11' },
    { sender: 'friend', content: 'That is a really mature perspective. Most CS students I know just run benchmarks and call it research. The whole framework of controlling variables, validity, and generalizability is so important.', date: '2026-02-11' },
    { sender: 'justin', content: 'Exactly. Quick question — what is the difference between internal and external validity again? I keep mixing them up.', date: '2026-02-15' },
    { sender: 'friend', content: 'Internal = can you prove causation (controlled experiment, no confounds). External = do your findings generalize (different populations, settings). Usually there is a tension between them — tight lab studies have high internal but low external validity.', date: '2026-02-15' },
    { sender: 'justin', content: 'That tension is exactly what I see in CS research. Controlled benchmarks versus real-world deployment. Thank you, that clicked.', date: '2026-02-16' },
    { sender: 'friend', content: 'I have been reading about cognitive load theory for my grad school applications. It is about how working memory has limited capacity and instructional design should minimize unnecessary load. Made me think about how you study.', date: '2026-02-22' },
    { sender: 'justin', content: 'That is fascinating. So when I am studying and also checking my phone, I am adding extraneous cognitive load that takes away from actual learning?', date: '2026-02-22' },
    { sender: 'friend', content: 'Exactly. Extraneous load is anything that does not contribute to learning — distractions, poorly designed materials, multitasking. Reduce that and you free up capacity for the actual content.', date: '2026-02-23' },
    { sender: 'justin', content: 'This explains why Priya\'s no-phone study blocks work so well. She is eliminating extraneous load without knowing the formal term for it.', date: '2026-02-23' },
    { sender: 'friend', content: 'Priya is a natural optimizer. The other thing is germane load — that is the effort of building mental schemas. Flashcards, teaching others, and practice problems all increase germane load, which is the good kind.', date: '2026-02-24' },
    { sender: 'justin', content: 'So the testing effect that you mentioned in class is really about increasing germane load? The effort of retrieval is what builds the schema?', date: '2026-02-25' },
    { sender: 'friend', content: 'Yes! You are connecting the dots perfectly. This is why just re-reading notes is so ineffective — it feels productive but creates almost no germane load.', date: '2026-02-25' },
    { sender: 'justin', content: 'I am completely rethinking how I study based on this conversation. How are your grad school applications going?', date: '2026-03-05' },
    { sender: 'friend', content: 'Stressful. I am applying to cognitive science PhD programs and the personal statements are killing me. How do you convey four years of intellectual growth in two pages?', date: '2026-03-06' },
    { sender: 'justin', content: 'I know the feeling from internship applications. My advice — tell one specific story really well rather than trying to cover everything. Show depth, not breadth.', date: '2026-03-07' },
    { sender: 'friend', content: 'That is actually great advice. I have been trying to mention every research project and it reads like a list instead of a narrative. I need to pick the one that matters most and go deep.', date: '2026-03-08' },
    { sender: 'justin', content: 'The application process is brutal no matter the field. But you are one of the most thoughtful people I know — any program would be lucky to have you.', date: '2026-03-09' },
    { sender: 'friend', content: 'That genuinely means a lot. This semester has been intense but conversations like this remind me why I love what I study. Thank you for being a great friend, Justin.', date: '2026-03-10' },
  ],
};

// ─── SECTION 10: Comment Content ─────────────────────────────────────────────

// Comments on Justin's shared notes (indices 0, 1, 2, 5, 6, 10, 13)
const justinNoteComments = {
  0: [
    { username: 'alexchen_cs', content: 'This DP explanation finally clicked for me, especially the memoization table visualization. The Fibonacci call tree diagram really shows why naive recursion is so wasteful.' },
    { username: 'mayapatel_ds', content: 'Do you have practice problems for this? I want to try the tabulation approach on some real problems. The coin change example was especially clear.' },
    { username: 'jordanwilliams', content: 'Saved this for interview prep. The comparison between top-down and bottom-up is the clearest I have seen anywhere, including textbooks.' },
  ],
  1: [
    { username: 'jordanwilliams', content: 'Great breakdown of round robin. We covered this in my embedded systems class too — real-time OS schedulers use a modified version with priority levels.' },
    { username: 'priyasharma', content: 'Even though I am pre-med, I found the scheduling analogy to hospital triage fascinating. Patients are processes, severity is priority, and the ER is the CPU.' },
    { username: 'alexchen_cs', content: 'The MLFQ section is gold. This is exactly what I needed for the OS midterm. The way it automatically adapts to process behavior is elegant.' },
    { username: 'sofiarod', content: 'The evaluation criteria table at the end is perfect for quick reference. I shared it with a friend in Information Science who is taking OS next semester.' },
  ],
  2: [
    { username: 'alexchen_cs', content: 'The HTTP/2 multiplexing section is really well written. I never understood how binary framing eliminates head-of-line blocking until reading this.' },
    { username: 'marcusjohnson', content: 'I never understood why HTTPS was important until reading your TLS explanation. The certificate chain of trust section made it concrete.' },
    { username: 'jordanwilliams', content: 'QUIC running over UDP is wild. The performance benefits on mobile networks make a lot of sense when you think about the packet loss patterns on cellular.' },
  ],
  5: [
    { username: 'mayapatel_ds', content: 'This pairs well with my stats notes on gradient descent. The backpropagation explanation connects the math to the intuition better than our ML textbook.' },
    { username: 'sofiarod', content: 'The cognitive architecture parallels to neural networks are interesting from a psych perspective. The activation function is like the threshold for neuron firing in real brains.' },
    { username: 'alexchen_cs', content: 'Bookmarked the transformer section. Self-attention finally makes sense — every token attending to every other token in parallel is such a clean idea.' },
  ],
  6: [
    { username: 'alexchen_cs', content: 'CAP theorem explanation is the clearest I have seen. The CP vs AP comparison with real-world system examples makes it immediately practical.' },
    { username: 'jordanwilliams', content: 'Shared this with my study group. Super helpful for our distributed systems project. The Raft section is directly applicable to what we are building.' },
    { username: 'marcusjohnson', content: 'Even from a finance perspective, the consistency vs availability tradeoff resonates. Trading systems face the exact same tension — do you halt trading on uncertainty or accept stale data?' },
  ],
  10: [
    { username: 'marcusjohnson', content: 'The behavioral question framework works for finance interviews too. STAR method is universal — I used your examples to structure my own IB interview prep.' },
    { username: 'alexchen_cs', content: 'Added your STAR method examples to my own prep doc. The section on pattern recognition for algorithm problems is exactly what I needed at this stage of prep.' },
    { username: 'sofiarod', content: 'Your approach to mock interviews is smart. Deliberate practice with immediate feedback is the fastest way to improve at any skill — that is well-established in cognitive psychology.' },
  ],
  13: [
    { username: 'jordanwilliams', content: 'Load balancer section is solid. Would love to see more on database sharding strategies — range-based vs hash-based partitioning is a topic I keep getting asked about in interviews.' },
    { username: 'alexchen_cs', content: 'Can you add a section on caching strategies? Cache-aside vs write-through is something I always get confused about. The rest of this primer is excellent though.' },
    { username: 'mayapatel_ds', content: 'The message queue section is relevant to my data pipeline project. We use Kafka for streaming sensor data and the producer-consumer decoupling pattern you describe is exactly our architecture.' },
  ],
};

// Justin's comments on friends' notes (3 per friend, 18 total)
const friendNoteComments = {
  alexchen_cs: [
    { noteIndex: 0, content: 'This Big-O guide is exactly what I wish I had at the start of the semester. The amortized analysis section at the end is a nice touch — most guides skip that.' },
    { noteIndex: 2, content: 'The BST deep dive is comprehensive. Your explanation of when AVL trees outperform red-black trees for read-heavy workloads versus write-heavy ones is nuanced and accurate.' },
    { noteIndex: 4, content: 'Great comparison of C++ and Java for interviews. I use Java but your point about STL being more powerful for competitive programming is making me reconsider.' },
  ],
  mayapatel_ds: [
    { noteIndex: 0, content: 'This pandas cheat sheet is going on my wall. The groupby and aggregation section alone would have saved me hours on my analytics dashboard project.' },
    { noteIndex: 1, content: 'The bias-variance tradeoff explanation with the bullseye analogy is the best I have encountered. Made me finally understand why adding more features can actually hurt performance.' },
    { noteIndex: 3, content: 'Linear regression explained this clearly should be a textbook chapter. The regularization section connecting L1 sparsity to feature selection was an insight I had not seen elsewhere.' },
  ],
  jordanwilliams: [
    { noteIndex: 0, content: 'Digital logic was my weakest area in CS foundations. Your Karnaugh map walkthrough made Boolean minimization intuitive instead of tedious. De Morgan\'s laws finally stick.' },
    { noteIndex: 2, content: 'The memory hierarchy note is incredibly practical. Understanding cache locality has already changed how I write code — I think about data layout in memory now.' },
    { noteIndex: 4, content: 'The hardware vs software tradeoffs note resonates with me as someone choosing between infrastructure and application development. Your point about embedded systems as the middle ground is insightful.' },
  ],
  priyasharma: [
    { noteIndex: 0, content: 'I understood maybe 60% of the organic chemistry but the reaction mechanism framework is fascinating. The decision tree for SN1 vs SN2 vs E1 vs E2 is like an algorithm flowchart — I love cross-discipline patterns.' },
    { noteIndex: 1, content: 'Your MCAT study strategy is incredibly structured. The phased approach with content review, practice, and full-length exams mirrors how we prep for technical interviews. Stealing the spaced repetition strategy.' },
    { noteIndex: 4, content: 'The med school application timeline is daunting but you clearly have it mapped out. The emphasis on research hours and meaningful clinical experience reminds me that depth matters more than breadth in any application.' },
  ],
  marcusjohnson: [
    { noteIndex: 0, content: 'The IB recruiting guide is eye-opening. The networking-first approach is so different from tech where the resume and technical skills are the primary filter. Both worlds could learn from each other.' },
    { noteIndex: 1, content: 'Financial modeling basics translated to my world: the three-statement model is like a state machine where each statement feeds into the others. The DCF section was surprisingly intuitive once I mapped it to present value calculations.' },
    { noteIndex: 3, content: 'These Excel shortcuts are productivity cheat codes. I have been using Ctrl+Arrow and Ctrl+Shift+Arrow in VS Code and they work the same way. The F4 absolute reference trick alone is worth the read.' },
  ],
  sofiarod: [
    { noteIndex: 0, content: 'The memory and learning note is directly applicable to how I design my study system. Spaced repetition backed by cognitive psychology research is exactly why I built flashcard features into my app.' },
    { noteIndex: 1, content: 'Research design and statistics from a psych perspective fills gaps in my CS statistics knowledge. The emphasis on effect size over p-values is a nuance that CS research papers often miss.' },
    { noteIndex: 3, content: 'Neuroscience basics is fascinating. The section on neuroplasticity and LTP as the neural basis of learning connects to everything I have been reading about spaced repetition. The brain physically changes when we learn.' },
  ],
};

// Comments on shared flashcard sets
const flashcardSetComments = [
  // Justin's shared sets
  { setOwner: 'justin', setIndex: 0, username: 'alexchen_cs', content: 'Used this DP set before the midterm and scored 91% on the DP section. The coin change and knapsack cards were exactly what was tested.' },
  { setOwner: 'justin', setIndex: 0, username: 'mayapatel_ds', content: 'These cards helped me review DP concepts in 20 minutes flat. Perfect for quick review sessions between classes.' },
  { setOwner: 'justin', setIndex: 1, username: 'jordanwilliams', content: 'The scheduling algorithm cards are spot on. I would add a card about the difference between cooperative and preemptive multitasking — it came up on our OS exam.' },
  { setOwner: 'justin', setIndex: 1, username: 'priyasharma', content: 'I do not understand half of these but the MLFQ card reminded me of hospital triage systems. Cross-discipline connections are the best.' },
  { setOwner: 'justin', setIndex: 2, username: 'mayapatel_ds', content: 'The neural network terminology set is exactly what I needed for my ML class. The backpropagation and Adam optimizer cards cleared up confusion I had for weeks.' },
  { setOwner: 'justin', setIndex: 2, username: 'sofiarod', content: 'Interesting to compare artificial neural network terminology with actual neuroscience. The activation function analogy to biological neuron firing thresholds is apt.' },
  { setOwner: 'justin', setIndex: 3, username: 'alexchen_cs', content: 'CAP theorem cards are essential for our distributed systems project. I review these before every group meeting to keep the concepts fresh.' },
  { setOwner: 'justin', setIndex: 4, username: 'jordanwilliams', content: 'TCP/IP cards are great for quick networking review. The HTTP evolution cards (1.1 vs 2 vs 3) are particularly well-crafted.' },
  { setOwner: 'justin', setIndex: 5, username: 'alexchen_cs', content: 'Database cards saved me on the SQL quiz. The B+ tree and MVCC cards are the most important ones for understanding real database performance.' },
  { setOwner: 'justin', setIndex: 10, username: 'marcusjohnson', content: 'The data structures quick reference set is perfect for last-minute interview prep. I keep coming back to the hash map and BST complexity cards.' },
  { setOwner: 'justin', setIndex: 11, username: 'alexchen_cs', content: 'SQL interview questions set covers all the bases. Window functions and CTEs are the ones that trip people up most — good to have cards specifically for those.' },
  { setOwner: 'justin', setIndex: 14, username: 'jordanwilliams', content: 'Git commands reference is handy. I always forget the difference between git fetch and git pull. This set is staying in my regular rotation.' },
  { setOwner: 'justin', setIndex: 15, username: 'mayapatel_ds', content: 'React concepts explained this concisely should be its own tutorial. The Virtual DOM and reconciliation card is the clearest explanation I have seen.' },
  { setOwner: 'justin', setIndex: 17, username: 'marcusjohnson', content: 'System design patterns are relevant even in finance. The consistent hashing and circuit breaker patterns apply to trading system architecture too.' },
  { setOwner: 'justin', setIndex: 19, username: 'sofiarod', content: 'Behavioral interview cards using the STAR method are universally useful. I am adapting this format for my grad school interview prep.' },
  // Friends' shared sets
  { setOwner: 'alexchen_cs', setIndex: 0, username: 'justin', content: 'Your sorting algorithms set is comprehensive. The Timsort card is a great addition — most sets skip the hybrid algorithms that are actually used in practice.' },
  { setOwner: 'alexchen_cs', setIndex: 1, username: 'justin', content: 'Tree traversal cards are clean and well-organized. The Morris Traversal card is a nice advanced addition for interview prep.' },
  { setOwner: 'mayapatel_ds', setIndex: 0, username: 'justin', content: 'Statistics key terms set is helping me understand the ML papers I am trying to read. The bias-variance tradeoff card is one I keep revisiting.' },
  { setOwner: 'mayapatel_ds', setIndex: 2, username: 'justin', content: 'Python data science toolkit is bookmarked. The train_test_split and cross_val_score cards are immediately applicable to my analytics project.' },
  { setOwner: 'jordanwilliams', setIndex: 0, username: 'justin', content: 'Digital logic gates set is a great refresher. The universal gate card explaining how NAND alone can build any circuit is a fact I keep forgetting.' },
  { setOwner: 'jordanwilliams', setIndex: 1, username: 'justin', content: 'Memory hierarchy terms cards are essential for understanding system performance. The three Cs of cache misses is something every CS student should know.' },
  { setOwner: 'priyasharma', setIndex: 0, username: 'justin', content: 'Organic chemistry reactions set is wild — the amount of conditions you need to memorize is like learning a new programming language. Respect for pre-med students.' },
  { setOwner: 'priyasharma', setIndex: 2, username: 'justin', content: 'MCAT vocab set covers an insane range of topics. The Hardy-Weinberg and Henderson-Hasselbalch cards show how much math is in medicine.' },
  { setOwner: 'marcusjohnson', setIndex: 0, username: 'justin', content: 'Finance interview questions set is fascinating from a CS perspective. The DCF walkthrough card maps directly to present value calculations in algorithm analysis.' },
  { setOwner: 'marcusjohnson', setIndex: 2, username: 'justin', content: 'Valuation methods cards are clear and well-structured. The football field chart card is a concept I had never heard of but makes total sense for presenting analysis.' },
  { setOwner: 'sofiarod', setIndex: 1, username: 'justin', content: 'Cognitive psychology terms are directly applicable to how I design study tools. The spacing effect and testing effect cards validate the approach in my flashcard app.' },
  { setOwner: 'sofiarod', setIndex: 2, username: 'justin', content: 'Neuroscience basics cards on LTP and dopamine pathways connect to learning in ways I had not considered. The brain is the original neural network.' },
];

module.exports = {
  justinNotes,
  noteSummaryFallbacks,
  friendNotes,
  flashcardFallbacks,
  manualFlashcardSets,
  friendFlashcardSets,
  conversations,
  justinNoteComments,
  friendNoteComments,
  flashcardSetComments,
};

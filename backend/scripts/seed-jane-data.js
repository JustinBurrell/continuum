// =============================================================================
// seed-jane-data.js - Content data for Jane Doe demo account
// =============================================================================

// ─── Notes ───────────────────────────────────────────────────────────────────

const personalNotes = [
  // Lecture notes (8)
  {
    title: 'Data Structures - Trees & Graphs',
    contentType: 'html',
    content: `<p>A <strong>binary search tree</strong> keeps things ordered: left child is always less than the parent, right child is always greater. Search, insert, and delete all run in O(log n) on average, but degrade to O(n) if the tree becomes unbalanced. One useful property: in-order traversal of a BST always gives a sorted sequence.</p><p>To fix the balance problem, we have self-balancing trees. <strong>AVL trees</strong> enforce that the height difference between left and right subtrees is at most 1, using rotations on insert and delete. <strong>Red-Black trees</strong> use a looser balance rule but generally have faster insertions.</p><p>For graphs, the two main representations are the adjacency matrix and the adjacency list. A matrix takes O(V²) space but gives O(1) edge lookups. A list uses O(V+E) space and works much better for sparse graphs, which is most real-world graphs.</p><p><strong>BFS</strong> (breadth-first search) uses a queue and finds shortest paths in unweighted graphs. <strong>DFS</strong> (depth-first search) uses a stack or recursion and is useful for cycle detection and topological sorting.</p>`,
    type: 'lecture', tags: ['data-structures', 'trees', 'graphs', 'cs'], subject: 'CS 201', visibility: 'private', isPinned: false,
  },
  {
    title: 'Operating Systems - Process Scheduling',
    contentType: 'html',
    content: `<p>There are four main CPU scheduling algorithms worth knowing. <strong>FCFS</strong> (first-come, first-served) is simple but causes the convoy effect - short processes get stuck behind long ones. <strong>SJF</strong> (shortest job first) minimizes average waiting time but requires predicting burst times, and can starve long processes. <strong>Round Robin</strong> is preemptive and gives each process a time quantum - great for time-sharing, but quantum size matters a lot. Too small and you waste time on context switches; too large and it degenerates into FCFS. <strong>Priority scheduling</strong> has a starvation problem, which you fix with aging - gradually increasing the priority of waiting processes.</p><p>Every context switch costs something. The OS has to save registers, update the PCB, and flush the TLB. In practice this runs about 1–10 microseconds per switch, which adds up under heavy load.</p><p>Multilevel queue scheduling separates processes into foreground (interactive, uses RR) and background (batch, uses FCFS). Processes are assigned to a queue based on their type and generally stay there.</p>`,
    type: 'lecture', tags: ['os', 'scheduling', 'processes'], subject: 'CS 350', visibility: 'private', isPinned: false,
  },
  {
    title: 'Computer Networks - TCP/IP Stack',
    contentType: 'html',
    content: `<p>The TCP/IP model has four layers. The <strong>application layer</strong> is where user-facing protocols live - HTTP, DNS, SMTP. The <strong>transport layer</strong> handles end-to-end communication with TCP and UDP. The <strong>network layer</strong> handles IP routing and ICMP. The <strong>link layer</strong> handles physical transmission over Ethernet and WiFi.</p><p><strong>TCP</strong> and <strong>UDP</strong> are the two main transport protocols. TCP is connection-oriented and provides reliable, ordered delivery with flow and congestion control. It is used for HTTP, FTP, and SMTP. UDP is connectionless and best-effort - no guarantees, but much lower latency. It is used for DNS lookups, video streaming, and gaming.</p><p>Establishing a TCP connection takes a three-way handshake: the client sends SYN, the server responds with SYN-ACK, and the client sends ACK.</p><p>TCP congestion control works in phases. It starts with <strong>slow start</strong>, where the congestion window grows exponentially. Then it enters <strong>congestion avoidance</strong>, growing linearly. If three duplicate ACKs arrive, fast retransmit kicks in and immediately retransmits the lost segment.</p>`,
    type: 'lecture', tags: ['networking', 'tcp', 'protocols'], subject: 'CS 450', visibility: 'private', isPinned: false,
  },
  {
    title: 'Database Systems - Indexing & Query Optimization',
    contentType: 'html',
    content: `<p>A <strong>B+ tree</strong> is the most common index structure in relational databases. Internal nodes hold keys only, all actual data is in the leaf nodes, and the leaf nodes are linked together in a list - which is what makes range scans efficient. Search is O(log n). MySQL InnoDB uses B+ trees by default.</p><p><strong>Hash indexes</strong> give O(1) exact lookups but can only handle equality predicates. No range queries, no ordering - they are purely for "where x equals exactly this value."</p><p>To understand query performance in Postgres, use EXPLAIN ANALYZE. It shows you whether the planner chose a sequential scan, an index scan, or an index-only scan, and what the actual row estimates looked like. For joins, a <strong>nested loop join</strong> is O(n²) and works well when the inner table is small. A <strong>hash join</strong> runs in O(n+m) and is better for large tables.</p><p>Normalization removes redundancy. <strong>1NF</strong> requires atomic values - no repeating groups. <strong>2NF</strong> eliminates partial dependencies (every non-key column must depend on the whole key). <strong>3NF</strong> eliminates transitive dependencies (non-key columns depend only on the key, not on other non-key columns).</p>`,
    type: 'lecture', tags: ['databases', 'sql', 'indexing'], subject: 'CS 430', visibility: 'private', isPinned: false,
  },
  {
    title: 'Machine Learning - Gradient Descent',
    contentType: 'html',
    content: `<p>Gradient descent minimizes the loss function J(θ) by repeatedly stepping in the direction of steepest descent. The update rule is <strong>θ = θ − α · ∇J(θ)</strong>, where α is the learning rate.</p><p>There are three main variants. <strong>Batch GD</strong> computes the gradient on the full dataset - stable, but slow for large data. <strong>SGD</strong> uses one sample per step, which is fast and noisy. <strong>Mini-batch</strong> splits the difference with batches of 32–512 samples, and is what most practitioners actually use.</p><p>The learning rate matters a lot. Too large and the loss diverges. Too small and training crawls. Adaptive optimizers like <strong>Adam</strong>, <strong>RMSProp</strong>, and <strong>AdaGrad</strong> adjust the learning rate per parameter automatically, which is why Adam is the go-to default for most tasks.</p><p>Deep networks with sigmoid or tanh activations suffer from vanishing gradients - the gradient shrinks exponentially as it backpropagates through layers. The fix is to use <strong>ReLU</strong> activations, add <strong>batch normalization</strong>, and use <strong>gradient clipping</strong> for very deep or recurrent models.</p>`,
    type: 'lecture', tags: ['ml', 'gradient-descent', 'optimization'], subject: 'CS 540', visibility: 'private', isPinned: false,
  },
  {
    title: 'Compilers - Parsing & AST',
    contentType: 'html',
    content: `<p>Compilers start with <strong>lexical analysis</strong>: the tokenizer reads raw source code and converts it into a token stream. Tokens are the smallest meaningful units - keywords, identifiers, literals, and operators.</p><p>Next comes parsing, which uses a <strong>context-free grammar</strong> to enforce structure. Grammars are written as production rules like S → aSb | ε, and derivation trees show how the input follows those rules.</p><p><strong>LL(1)</strong> parsing is top-down - it starts from the start symbol and tries to derive the input using one token of lookahead. This is what recursive descent parsers do. <strong>LR(1)</strong> is bottom-up and more powerful - it starts from the input and reduces back to the start symbol. LR handles left recursion, which LL cannot.</p><p>The output of parsing is an <strong>AST</strong> (Abstract Syntax Tree), not a raw parse tree. A parse tree includes every grammar symbol, even redundant things like parentheses and semicolons. The AST strips those out and keeps only the meaningful structure. The AST is then passed to semantic analysis and code generation.</p>`,
    type: 'lecture', tags: ['compilers', 'parsing', 'ast'], subject: 'CS 460', visibility: 'private', isPinned: false,
  },
  {
    title: 'Distributed Systems - Consensus Algorithms',
    contentType: 'html',
    content: `<p>The core consensus problem: get N nodes to agree on a single value even when some of them fail.</p><p><strong>Paxos</strong> has three roles - proposer, acceptor, and learner. It runs in two phases: Prepare → Promise, then Accept → Accepted. A value is chosen once a majority of acceptors agree. Paxos is provably correct but notoriously hard to implement in practice.</p><p><strong>Raft</strong> was designed specifically to be easier to understand. It breaks consensus into leader election and log replication. The leader sends heartbeats to followers. If a follower times out without hearing from a leader, it starts a new election. A majority quorum - n/2 + 1 nodes - is required for any decision.</p><p>The <strong>CAP theorem</strong> says a distributed system can only guarantee two of three things at once: Consistency (every read returns the latest write), Availability (every request gets a response), and Partition Tolerance (the system keeps working despite network splits). HBase and Zookeeper are CP systems. Cassandra and DynamoDB are AP systems.</p>`,
    type: 'lecture', tags: ['distributed-systems', 'consensus', 'raft'], subject: 'CS 580', visibility: 'private', isPinned: false,
  },
  {
    title: 'Algorithms - Dynamic Programming',
    contentType: 'html',
    content: `<p>Dynamic programming applies when a problem has two properties: <strong>optimal substructure</strong> (the optimal solution is built from optimal sub-solutions) and <strong>overlapping subproblems</strong> (the same sub-problems get solved repeatedly in a naive recursive approach).</p><p>There are two ways to do DP. <strong>Top-down with memoization</strong> keeps the recursive structure but caches results so each subproblem is only solved once. <strong>Bottom-up tabulation</strong> fills a table iteratively from the base cases up, which eliminates recursion overhead entirely.</p><p>The classic problems to know: Fibonacci runs in O(n) with memoization vs O(2^n) naive. 0/1 Knapsack is O(nW) where n is items and W is capacity. Longest Common Subsequence is O(nm). Coin change (minimum coins for a target) is O(amount × number of coin denominations).</p><p>The most important habit is defining the state clearly before writing any code. dp[i] should have a precise English meaning like "the minimum number of coins to make amount i." The transition is just how to compute dp[i] from previously computed values.</p>`,
    type: 'lecture', tags: ['algorithms', 'dp', 'optimization'], subject: 'CS 310', visibility: 'private', isPinned: false,
  },
  // General notes (5)
  {
    title: 'Internship Prep Checklist',
    contentType: 'html',
    content: `<p>For the resume: update it with the latest projects, quantify every bullet point with numbers where possible, and tailor it per company rather than sending the same version everywhere.</p><p>On the technical side:</p><ul><li>LeetCode: 2 mediums per day</li><li>System design: at least one reading per day</li><li>Review CS fundamentals - OS, networks, and databases are the most likely topics</li></ul><p>For behavioral prep, have STAR-format stories ready for at least 10 scenarios. Priority themes: leadership, handling conflict, dealing with failure, and collaboration.</p><p>Target applications:</p><ul><li>Figma (product design)</li><li>Shopify (frontend)</li><li>Stripe (full-stack)</li><li>Spotify (mobile)</li><li>Linear (product)</li></ul>`,
    type: 'general', tags: ['career', 'internship', 'checklist'], subject: 'Career', visibility: 'private', isPinned: true,
  },
  {
    title: 'Side Project Ideas',
    contentType: 'html',
    content: `<p>A few project ideas I want to work through, roughly in priority order.</p><p><strong>High priority:</strong></p><ol><li><strong>Portfolio rewrite</strong> - Next.js + Tailwind, dark mode, better project showcases</li><li><strong>Study timer app</strong> - Pomodoro with session analytics and streak tracking</li></ol><p><strong>Medium priority:</strong></p><ol start="3"><li><strong>Recipe organizer</strong> - CRUD with tagging and a meal planning calendar</li><li><strong>Habit tracker</strong> - daily check-ins with a heatmap visualization</li></ol><p><strong>Low priority / someday:</strong></p><ol start="5"><li><strong>Open source contribution</strong> - find a good first issue on a tool I already use</li><li><strong>Chrome extension</strong> - tab manager with auto-grouping</li></ol><p>General rule: focus on shipping, not perfecting. Every project should solve a real problem I actually have, and I should document the process as I go - potential blog post material.</p>`,
    type: 'general', tags: ['projects', 'ideas', 'coding'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Books to Read This Semester',
    contentType: 'html',
    content: `<p><strong>Technical books:</strong></p><ul><li><em>Designing Data-Intensive Applications</em> by Kleppmann - in progress</li><li><em>The Pragmatic Programmer</em> by Hunt &amp; Thomas</li><li><em>Clean Code</em> by Martin</li></ul><p><strong>Career and mindset:</strong></p><ul><li><em>So Good They Can't Ignore You</em> by Newport</li><li><em>Atomic Habits</em> by Clear - re-read</li></ul><p><strong>For fun:</strong></p><ul><li><em>The Design of Everyday Things</em> by Norman</li><li><em>Where Good Ideas Come From</em> by Johnson</li></ul><p>Currently on DDIA Chapter 5 (Replication).</p>`,
    type: 'general', tags: ['books', 'reading', 'learning'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Weekly Review Template',
    contentType: 'html',
    content: `<p><strong>What went well this week?</strong></p><ul><li></li></ul><p><strong>What didn't go well?</strong></p><ul><li></li></ul><p><strong>What did I learn?</strong></p><ul><li></li></ul><p><strong>Tasks completed:</strong></p><ul><li></li></ul><p><strong>Tasks carried over:</strong></p><ul><li></li></ul><p><strong>Top 3 priorities for next week:</strong></p><ol><li></li><li></li><li></li></ol><p><strong>Energy and focus check-in:</strong></p><ul><li>Sleep avg:</li><li>Exercise:</li><li>Stress level (1–10):</li></ul>`,
    type: 'general', tags: ['productivity', 'template', 'weekly-review'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'CSS Tips & Tricks',
    contentType: 'html',
    content: `<p>Keeping this note for the CSS things I keep looking up.</p><p>For <strong>centering</strong>: flexbox needs display flex, align-items center, and justify-content center. Grid is even simpler - display grid plus place-items center handles both axes at once.</p><p>For <strong>responsive text</strong>: clamp() is the cleanest approach. Something like clamp(1rem, 2.5vw, 2rem) gives a minimum size, a viewport-relative size, and a maximum cap all in one line.</p><p>For a <strong>sticky header</strong>: position sticky, top 0, and a z-index high enough to sit above content - z-index 100 usually works.</p><p>For a <strong>custom scrollbar</strong>: target ::-webkit-scrollbar with a small width like 6px, then style ::-webkit-scrollbar-thumb with a background color and border-radius to round the edges.</p>`,
    type: 'general', tags: ['css', 'frontend', 'tips'], subject: 'Web Dev', visibility: 'private', isPinned: false,
  },
  // Journal entries (4)
  {
    title: 'Journal - First Week of Semester',
    contentType: 'html',
    content: `<p>Feeling good about this semester. My schedule is manageable - 4 courses, no 8am classes for once. The distributed systems course is going to be hard but I wanted to take something that would push me.</p><p>Started going to the gym again after a month off. Even just 3x a week makes a huge difference in focus.</p><p>Applied to Figma and Shopify already. Trying not to obsess over checking email. Just submit and move on.</p>`,
    type: 'journal', tags: ['journal', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Journal - Midterm Week',
    contentType: 'html',
    content: `<p>Two exams in two days. OS was hard but I feel okay about it. DB was way easier than I expected - the indexing questions were exactly what I studied.</p><p>Took a full day off after they were done. Watched movies, cooked, didn't open my laptop once. Really needed it.</p><p>Got a first-round interview at Figma. Nervous but excited. Practicing system design every day this week.</p>`,
    type: 'journal', tags: ['journal', 'exams', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Journal - Interview Post-Mortem',
    contentType: 'html',
    content: `<p>Went okay. The coding portion was fine (medium LC, sliding window). The system design was rough - I blanked on the load balancing piece and rambled.</p><p>Interviewer was kind and gave hints. I recovered by the end.</p><p>Things to work on:</p><ul><li>Practice talking through design decisions out loud</li><li>Review consistent hashing, CDN architecture</li><li>Don't panic when I get stuck - just say what I'm thinking</li></ul><p>Will know in a week. Fingers crossed.</p>`,
    type: 'journal', tags: ['journal', 'interview', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Journal - End of March',
    contentType: 'html',
    content: `<p>Lot happening. Got the Shopify offer - still deciding. Figma rejected after the final round but honestly I learned a lot. No hard feelings, just more to work on.</p><p>Course project is going well. My group is solid - everyone actually does their part.</p><p>Starting to feel the end of semester crunch but it's manageable. Just need to stay consistent through April.</p>`,
    type: 'journal', tags: ['journal', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  // Research/todo notes (3)
  {
    title: 'Research - State Management Options',
    contentType: 'html',
    content: `<p>Comparing the main React state management options.</p><p><strong>Zustand</strong> is lightweight with minimal boilerplate. The API is very simple - you create a store with a function that receives a set callback, and define your state and actions inline. Good for small to medium apps.</p><p><strong>Jotai</strong> takes an atomic model inspired by Recoil. It works well for derived or computed state where values depend on each other.</p><p><strong>Redux Toolkit</strong> is the industry standard for large apps. It is heavy, but the devtools are excellent and most teams are already familiar with the pattern.</p><p>My decision: Zustand for my side project. For internship work, I'll just follow whatever the team is already using.</p>`,
    type: 'research', tags: ['react', 'state-management', 'research'], subject: 'Web Dev', visibility: 'private', isPinned: false,
  },
  {
    title: 'Todo - Final Project Milestones',
    contentType: 'html',
    content: `<p>Final project: building a distributed key-value store. Milestones broken down by week.</p><p><strong>Week 1 (done):</strong></p><ul><li>Basic TCP server/client</li><li>Simple in-memory hash map</li></ul><p><strong>Week 2 (in progress):</strong></p><ul><li>Persistent storage (write-ahead log)</li><li>Replication to 2 replicas</li></ul><p><strong>Week 3:</strong></p><ul><li>Leader election</li><li>Read from replica</li></ul><p><strong>Week 4:</strong></p><ul><li>Load testing</li><li>Write-up and presentation</li></ul><p>Using Go for this. Channel-based concurrency is a great fit for the networking and replication pieces.</p>`,
    type: 'todo', tags: ['project', 'distributed-systems', 'go'], subject: 'CS 580', visibility: 'private', isPinned: false,
  },
  {
    title: 'Research - TypeScript Generics',
    contentType: 'html',
    content: `<p>TypeScript generics let you write reusable code without sacrificing type safety. The core idea is to make a function or type work across multiple types instead of duplicating logic for each one.</p><p>A basic generic function looks like this: a function called identity with a type parameter T takes an argument of type T and returns T. The type flows through without you having to specify it explicitly at the call site.</p><p>You can also constrain generics. If you add "extends { length: number }" to the type parameter, TypeScript will only accept types that have a length property - so strings and arrays work, raw numbers do not.</p><p><strong>Conditional types</strong> let you branch on type information, like writing a type that resolves to "yes" if T is a string and "no" otherwise.</p><p>The built-in <strong>utility types</strong> cover the most common patterns: Partial makes all properties optional, Required makes them all required, Readonly locks them down, Pick and Omit select or exclude specific keys, and ReturnType and Parameters extract type information from function types.</p>`,
    type: 'research', tags: ['typescript', 'generics', 'frontend'], subject: 'Web Dev', visibility: 'private', isPinned: false,
  },
];

const sharedNotes = [
  // Shared lecture notes (8)
  {
    title: 'System Design - URL Shortener',
    contentType: 'html',
    content: `<p>A URL shortener takes a long URL and returns a short one, then redirects on visit. The scale assumption here is about 100M URLs per day, heavily read-heavy.</p><p>For <strong>ID generation</strong>, Base62 encode a counter or a random ID. Seven characters gives 62^7 ≈ 3.5 trillion unique URLs, which is plenty.</p><p>For <strong>storage</strong>, use a key-value store. Redis handles hot URLs in memory for speed. Cassandra works well for persistence at scale.</p><p>For <strong>redirects</strong>, the choice between 301 and 302 matters. A 301 is a permanent redirect - browsers cache it, so subsequent visits skip your server entirely, reducing load but losing the ability to track clicks. A 302 is temporary - every visit goes through your server, which lets you count clicks but adds latency.</p><p>The <strong>read-to-write ratio</strong> is about 100:1. Caching the top 20% of URLs by traffic will cover around 80% of all redirect requests (Pareto distribution). CDN edge nodes handle the global latency problem for redirects.</p><p>The database schema needs at minimum: short_url, original_url, user_id, created_at, and expires_at.</p>`,
    type: 'lecture', tags: ['system-design', 'backend', 'scale'], subject: 'System Design', visibility: 'friends', isPinned: true,
  },
  {
    title: 'System Design - Design a Chat System',
    contentType: 'html',
    content: `<p>The core flow for real-time chat: the client connects via WebSocket, sends a message to the server, which fans it out to all recipients. For offline users, the message goes into a queue (Kafka works well here) and gets delivered when they reconnect.</p><p>For <strong>storage</strong>, messages should go in a NoSQL store like Cassandra - the access pattern is append-heavy and you read by time range, which Cassandra handles well. User and conversation metadata can stay in SQL since it is relational and not write-heavy. Keep hot conversations in Redis for fast access.</p><p><strong>Presence</strong> tracking uses a heartbeat approach. Clients ping the server every 30 seconds. Last-seen timestamps go into Redis with a TTL so stale entries expire automatically.</p><p>At <strong>scale</strong>, run WebSocket servers horizontally behind a load balancer. The tricky part is that messages need to reach recipients who might be connected to a different server. Redis pub/sub solves this - when a message arrives on one server, it publishes to Redis, and all other servers subscribed to that conversation deliver it to their connected clients.</p>`,
    type: 'lecture', tags: ['system-design', 'websockets', 'chat'], subject: 'System Design', visibility: 'friends', isPinned: false,
  },
  {
    title: 'React Hooks - Deep Dive',
    contentType: 'html',
    content: `<p><strong>useState</strong> manages local component state and triggers a re-render whenever the state changes. For expensive initial values, you can pass a function instead of a value - useState(() => expensiveCalc()) - and it only runs once.</p><p><strong>useEffect</strong> runs after render and handles side effects like subscriptions, timers, and data fetching. Return a cleanup function to handle unsubscribing. The dependency array controls when the effect re-runs.</p><p><strong>useCallback</strong> and <strong>useMemo</strong> memoize functions and values respectively. The rule of thumb: only use them when you are passing something to a child component that would otherwise re-render unnecessarily, or when a computation is genuinely expensive. Premature optimization is real - profile before reaching for these.</p><p><strong>useRef</strong> gives you a mutable container that persists across renders without causing re-renders. Useful for DOM access, storing a previous value of a prop, or holding a cancel token for an async operation.</p><p><strong>Custom hooks</strong> are just functions that call other hooks. They let you extract stateful logic and reuse it across components. They must start with "use" so React can enforce the rules of hooks.</p>`,
    type: 'lecture', tags: ['react', 'hooks', 'frontend'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'REST vs GraphQL vs tRPC',
    contentType: 'html',
    content: `<p><strong>REST</strong> is the standard: simple, cache-friendly, and easy to reason about. The downside is over-fetching (getting more data than you need) and under-fetching (needing multiple requests to get everything). Still the right default for most APIs.</p><p><strong>GraphQL</strong> lets the client specify exactly the shape of the response it wants, which eliminates over and under-fetching entirely. The trade-off is a more complex server setup and harder HTTP caching (everything goes to one endpoint). It shines for complex data graphs or when you have many different client types (web, mobile, third-party) with different data needs.</p><p><strong>tRPC</strong> gives you end-to-end TypeScript type safety with zero schema definition step. The function signatures on the server become the types on the client automatically. The limitation: it only works within a TypeScript monorepo, so it is best for the T3 stack or small teams where the frontend and backend live in the same repo.</p><p>Summary: CRUD app → REST. Complex graph with multiple clients → GraphQL. Full TypeScript monorepo → tRPC.</p>`,
    type: 'lecture', tags: ['api', 'graphql', 'rest', 'backend'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Cloud Computing - AWS Core Services',
    contentType: 'html',
    content: `<p>A quick reference for the AWS services that come up most often.</p><p><strong>Compute:</strong> EC2 gives you virtual machines with full control. Lambda is serverless and event-driven - you pay per invocation, not per hour. ECS and EKS handle containers, with ECS using Docker and EKS using Kubernetes.</p><p><strong>Storage:</strong> S3 is object storage with 11 nines of durability - essentially indestructible for practical purposes. EBS is block storage that attaches to EC2 instances, like a hard drive. RDS is managed relational databases (Postgres, MySQL, etc.) with automated backups. DynamoDB is managed NoSQL with single-digit millisecond performance at any scale.</p><p><strong>Networking:</strong> VPC gives you an isolated virtual network. CloudFront is the CDN. Route 53 is DNS. ALB (Application Load Balancer) and NLB (Network Load Balancer) handle traffic distribution.</p><p><strong>Messaging:</strong> SQS is a managed queue for decoupling services. SNS is pub/sub for fan-out delivery. Kinesis handles real-time data streams at high throughput.</p>`,
    type: 'lecture', tags: ['aws', 'cloud', 'devops'], subject: 'Cloud Computing', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Frontend Performance Optimization',
    contentType: 'html',
    content: `<p>The three <strong>Core Web Vitals</strong> Google uses for ranking: LCP (Largest Contentful Paint) should be under 2.5 seconds, FID (First Input Delay) should be under 100ms, and CLS (Cumulative Layout Shift) should be under 0.1.</p><p><strong>Optimization techniques:</strong></p><ul><li>Code splitting with React.lazy + Suspense - load components only when needed</li><li>Image optimization: use WebP format, lazy loading, and srcset for responsive images</li><li>Bundle analysis with webpack-bundle-analyzer to find what is making your bundle fat</li><li>Tree shaking via ES modules to eliminate unused code</li><li>Debounce and throttle event handlers for scroll, resize, and input events</li><li>Virtual lists with react-window for rendering long lists without DOM overhead</li></ul><p><strong>Caching:</strong> Service workers handle offline support and cache management. A CDN serves static assets from edge locations close to users. HTTP cache headers - Cache-Control and ETag - tell browsers when to reuse cached responses.</p><p><strong>Tools:</strong> Lighthouse in Chrome DevTools gives a quick performance audit. WebPageTest is better for real-world testing from actual geographic locations.</p>`,
    type: 'lecture', tags: ['performance', 'frontend', 'web'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Docker & Containers Basics',
    contentType: 'html',
    content: `<p>Three core Docker concepts: an <strong>image</strong> is a read-only template built from a Dockerfile. A <strong>container</strong> is a running instance of that image. A <strong>registry</strong> is where images are stored - Docker Hub is the public one, ECR is AWS's managed version.</p><p>A typical Node.js Dockerfile starts from an alpine base image, sets a working directory, copies over the package files, runs npm ci with production-only dependencies, copies the rest of the source, exposes the app port, and sets the start command. The order matters - putting package files first means Docker can cache the dependency layer and skip reinstalling when only source files change.</p><p>The commands you will use constantly: docker build to build an image, docker run with the -p flag to map ports, docker ps to see running containers, docker logs to view output, and docker exec -it with sh to get a shell inside a running container.</p><p><strong>Docker Compose</strong> lets you define multi-container apps in a single yaml file - typically the app server, a database, and Redis all running together with a single command.</p>`,
    type: 'lecture', tags: ['docker', 'devops', 'containers'], subject: 'DevOps', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Web Accessibility (a11y) Guide',
    contentType: 'html',
    content: `<p>About 1 in 5 people have some form of disability. Beyond the ethical case, accessibility matters for SEO, legal compliance, and simply making a better product for everyone - good a11y often improves UX across the board.</p><p>The <strong>WCAG 2.1</strong> guidelines organize requirements around four principles called POUR. <strong>Perceivable</strong> means providing text alternatives, captions, and adequate color contrast. <strong>Operable</strong> means everything works with a keyboard, nothing triggers seizures, and users have enough time to complete tasks. <strong>Understandable</strong> means the content is readable and predictable and errors are handled gracefully. <strong>Robust</strong> means the implementation is compatible with assistive technologies.</p><p>A practical checklist for any web project:</p><ul><li>Alt text on all images</li><li>Color contrast ratio of at least 4.5:1 for text, 3:1 for UI elements</li><li>Focus styles visible on all interactive elements</li><li>Semantic HTML throughout - button, nav, main, proper heading hierarchy</li><li>ARIA labels on icon-only buttons (since there is no visible text)</li><li>Form labels properly linked to their inputs</li></ul><p><strong>Tools:</strong> axe DevTools as a Chrome extension catches most issues automatically. Lighthouse has an accessibility audit built in. For deeper testing, use a screen reader - NVDA on Windows or VoiceOver on Mac.</p>`,
    type: 'lecture', tags: ['accessibility', 'frontend', 'ux'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  // Shared general notes (6)
  {
    title: 'Group Project - Sprint 1 Plan',
    contentType: 'html',
    content: `<p>CS 580 final project - distributed key-value store. Sprint 1 plan.</p><p><strong>Team:</strong></p><ul><li>Jane (lead): server architecture, Raft implementation</li><li>Chris: storage layer, write-ahead log</li><li>Logan: client library, testing harness</li></ul><p><strong>Sprint 1 goals (2 weeks):</strong></p><ul><li>Repo setup, CI pipeline</li><li>Basic KV server (get/set/delete over TCP)</li><li>Persistent log format spec</li><li>Leader election skeleton</li></ul><p>Meeting: Tuesdays 7pm on Discord.</p><p>Links: GitHub at github.com/[team]/kv-store, project board on Notion, rubric on the course page.</p>`,
    type: 'general', tags: ['project', 'distributed-systems', 'team'], subject: 'CS 580', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Interview Prep - Behavioral Questions',
    contentType: 'html',
    content: `<p>A bank of behavioral stories I can draw on in interviews.</p><p><strong>Tell me about yourself:</strong> "CS junior with a focus on full-stack and product. I've built [projects], done [coursework], and am looking for a role where I can ship user-facing features and grow as an engineer."</p><p><strong>Handling a challenge (STAR):</strong> The distributed systems project had a teammate who stopped responding mid-sprint. I needed to either cover their module or miss the deadline. I split the remaining work with the other teammate and communicated with the professor early. We shipped on time and I learned to set check-in points much earlier in group projects.</p><p><strong>Leadership without authority (STAR):</strong> A study group I joined had no structure and kept missing sessions. I organized without being the formal leader - created a shared Notion board and set up a recurring weekly meeting. Group average went from C+ to B+.</p><p><strong>Failure:</strong> Failed the first ML midterm. Rather than re-reading notes, I overcorrected by doing practice problems every day until the final. Aced it. Now I always practice over passive review.</p>`,
    type: 'general', tags: ['interview', 'behavioral', 'career'], subject: 'Career', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Study Group - DB Final Exam Topics',
    contentType: 'html',
    content: `<p>Topics for the DB final, sorted by how likely they are to appear.</p><p><strong>High priority (very likely on exam):</strong></p><ul><li>Transaction isolation levels, from READ UNCOMMITTED through SERIALIZABLE</li><li>Deadlock detection and prevention</li><li>B+ tree operations - insert, delete, and search</li><li>Query optimization: join algorithms and index selection</li><li>ACID properties with concrete examples</li></ul><p><strong>Medium priority:</strong></p><ul><li>Normalization from 1NF through BCNF</li><li>Converting an ER diagram to a relational schema</li><li>Concurrency control: 2PL and MVCC</li></ul><p><strong>Low priority:</strong></p><ul><li>Distributed transactions and two-phase commit</li></ul><p><strong>Study group schedule:</strong></p><ul><li>Wednesday 6pm: transactions and concurrency</li><li>Friday 4pm: indexing and query optimization</li><li>Sunday: full practice exam</li></ul>`,
    type: 'general', tags: ['databases', 'study-group', 'exam-prep'], subject: 'CS 430', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Resources - Best YouTube Channels for CS',
    contentType: 'html',
    content: `<p>The channels I actually go back to, organized by topic.</p><p><strong>Algorithms and data structures:</strong> Abdul Bari has the clearest explanations of DP and graph algorithms I have found anywhere. WilliamFiset has a great graph theory series. NeetCode is the best for LeetCode pattern practice.</p><p><strong>System design:</strong> Gaurav Sen covers the fundamentals well. ByteByteGo is visual and fast-paced - good for review. Exponent does mock interviews which is useful for seeing how someone actually talks through a design.</p><p><strong>CS concepts:</strong> MIT OpenCourseWare is actual MIT lecture content for free. CS Dojo is beginner-friendly. Reducible does deep dives into the math behind CS topics.</p><p><strong>Frontend and web:</strong> Fireship for quick hits and staying current. Kevin Powell is the best CSS resource on YouTube. Jack Herrington covers advanced React patterns that go beyond the docs.</p>`,
    type: 'general', tags: ['resources', 'youtube', 'learning'], subject: null, visibility: 'friends', isPinned: false,
  },
  {
    title: 'Networking Tips - Making the Most of Career Fairs',
    contentType: 'html',
    content: `<p><strong>Before the fair:</strong> Research your top 10 target companies in advance. Tailor your 30-second pitch to fit each company type. Print more resumes than you think you need - 20+ is not excessive. Upload your resume to company portals before you show up so they can find you in the system.</p><p><strong>At the fair:</strong> Go early when it is less crowded and recruiters are fresh. Lead with your elevator pitch - who you are, what you are interested in, and why this specific company. Ask good questions like "What does onboarding look like for interns?" and "What does a typical day on the team involve?" Always get a business card or LinkedIn profile before walking away.</p><p><strong>After the fair:</strong> Email within 24 hours while they still remember you. Connect on LinkedIn with a personal note referencing something from your conversation. Follow up on your application status after about a week if you have not heard anything.</p><p><strong>What not to do:</strong> Do not read off your resume - you should know it cold. Do not ask about salary at the fair. Do not hover waiting for a gap in someone's conversation - wait for a natural opening.</p>`,
    type: 'general', tags: ['career', 'networking', 'tips'], subject: 'Career', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Open Source Contribution Guide',
    contentType: 'html',
    content: `<p><strong>Finding good first issues:</strong> Search GitHub using label:"good first issue" combined with label:"help wanted". The sites goodfirstissue.dev and up-for-grabs.net aggregate these across many projects.</p><p><strong>Workflow:</strong></p><ol><li>Fork the repo</li><li>Read CONTRIBUTING.md and CODE_OF_CONDUCT.md before doing anything else</li><li>Set up the local dev environment</li><li>Create a branch: git checkout -b fix/issue-123</li><li>Make the change and add tests</li><li>Submit a PR with a clear description that links back to the issue</li></ol><p><strong>What to contribute first:</strong> Fix typos in documentation, add missing tests, improve error messages, or take on small bug fixes that have a clear reproduction case. These are low-risk for the maintainer to review.</p><p><strong>Tips:</strong> Start small and understand the codebase before proposing big changes. Be patient - maintainers are often unpaid volunteers. Respond to review feedback quickly; a PR that goes quiet usually gets closed.</p>`,
    type: 'general', tags: ['open-source', 'github', 'career'], subject: null, visibility: 'friends', isPinned: false,
  },
  // Shared research notes (4)
  {
    title: 'Research - WebSockets vs Server-Sent Events vs Polling',
    contentType: 'html',
    content: `<p>Comparing the four options for getting data from server to client in real time.</p><p><strong>Short polling</strong> has the client ask the server every N seconds. Simple to implement, but wasteful - most responses come back empty.</p><p><strong>Long polling</strong> has the server hold the request open until data is available, then respond and let the client reconnect. Better than short polling, but still adds HTTP overhead on every cycle.</p><p><strong>Server-Sent Events (SSE)</strong> establish a persistent HTTP connection where the server pushes updates whenever it wants. It is one-way (server to client only), but that is fine for notifications and live feeds. Works well with existing HTTP infrastructure and has good browser support.</p><p><strong>WebSockets</strong> are a full-duplex persistent connection - both sides can push messages at any time. This is the right choice for chat, gaming, and collaborative editing where the client also needs to send data frequently.</p><p>When to use which: SSE for simple server-to-client updates where browser compatibility matters, WebSockets for anything interactive and real-time, polling when you do not actually need real-time and simplicity is the priority.</p>`,
    type: 'research', tags: ['websockets', 'sse', 'real-time', 'research'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Research - Database Selection Guide',
    contentType: 'html',
    content: `<p>A framework for picking the right database for a given problem.</p><p><strong>SQL (relational):</strong> Strong consistency, ACID guarantees, joins, and schema enforcement. The right choice for financial data, user accounts, and anything where the data is inherently relational. Postgres is the default choice; MySQL and SQLite are alternatives.</p><p><strong>Document (NoSQL):</strong> Flexible schema, nested data, and horizontal scaling. Good for user profiles, product catalogs, and CMS content where the shape of data varies. MongoDB and Firestore are the main options.</p><p><strong>Key-value:</strong> Extremely fast with a simple data model. Best for caching, session storage, and leaderboards. Redis is the dominant choice; DynamoDB also works well for key-value at scale.</p><p><strong>Column-family:</strong> Designed for write-heavy workloads with wide rows and time-series data. Best for analytics, IoT event logs, and high-volume append workloads. Cassandra and HBase are the main options.</p><p><strong>Graph:</strong> For highly connected data where relationship traversal is the primary query pattern - social networks, fraud detection, recommendation engines. Neo4j and Amazon Neptune are the go-to choices.</p>`,
    type: 'research', tags: ['databases', 'sql', 'nosql', 'research'], subject: 'System Design', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Research - React Query vs SWR vs Apollo',
    contentType: 'html',
    content: `<p>Comparing the three main data-fetching libraries for React.</p><p><strong>React Query (TanStack Query)</strong> is the most full-featured option: caching, background refresh, pagination, and optimistic updates all built in. It works with any async function, not just fetch. The DevTools are excellent for debugging cache state. Best for most React apps.</p><p><strong>SWR</strong> is lightweight and was created by Vercel. Simpler API, less configuration. Great for Next.js apps and situations where you just need straightforward data fetching without a lot of ceremony.</p><p><strong>Apollo Client</strong> is GraphQL-specific. It has a normalized cache and handles complex queries well. It is heavy though - only worth bringing in if you are actually using GraphQL.</p><p>My quick decision tree: REST or custom fetch → React Query. Next.js with simple needs → SWR. GraphQL → Apollo. Currently using React Query v5 and loving the devtools and the queryKey-based caching pattern.</p>`,
    type: 'research', tags: ['react', 'data-fetching', 'react-query', 'research'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Research - Git Workflow Strategies',
    contentType: 'html',
    content: `<p>Three main approaches to managing branches in a Git repo.</p><p><strong>Git Flow</strong> uses long-lived branches: main, develop, feature branches, hotfix branches, and release branches. It is structured and well-suited for versioned products with scheduled release cycles. The downside is complexity - there are a lot of branches to manage and the feedback loop is slower.</p><p><strong>GitHub Flow</strong> is much simpler: main plus short-lived feature branches, each one going through a PR before merging. You deploy directly from main. Good for web apps with continuous deployment where you want to stay close to production at all times.</p><p><strong>Trunk-Based Development</strong> is the most aggressive approach - everyone commits directly to main or uses very short-lived branches (hours, not days). Incomplete features hide behind feature flags. This works well for high-velocity teams and microservices but requires excellent test coverage and CI.</p><p>My recommendation: small team or web app → GitHub Flow. Larger team with feature flags → trunk-based. Mobile app or versioned software → Git Flow.</p><p><strong>Conventional commits</strong> are a structured message format I try to follow: feat, fix, docs, chore, refactor, and test as prefixes. Makes changelogs and git history much easier to search.</p>`,
    type: 'research', tags: ['git', 'workflow', 'devops', 'research'], subject: 'DevOps', visibility: 'friends', isPinned: false,
  },
  // Pinned shared notes (2)
  {
    title: 'Pinned - Quick Reference: Big-O Cheat Sheet',
    contentType: 'html',
    content: `<p>Common complexities from fastest to slowest: O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n²) &lt; O(2^n) &lt; O(n!).</p><p><strong>Data structure operations:</strong></p><ul><li>Array: access O(1), search O(n), insert O(n), delete O(n)</li><li>Linked List: access O(n), search O(n), insert O(1), delete O(1)</li><li>Hash Table: access O(1), search O(1), insert O(1), delete O(1) - all average case</li><li>BST (balanced): access O(log n), search O(log n), insert O(log n), delete O(log n)</li><li>Heap: access min/max O(1), search O(n), insert O(log n), delete O(log n)</li></ul><p><strong>Sorting algorithm complexities:</strong></p><ul><li>Quicksort: O(n log n) best and average, O(n²) worst, O(log n) space</li><li>Mergesort: O(n log n) all cases, O(n) space</li><li>Heapsort: O(n log n) all cases, O(1) space</li><li>Insertion sort: O(n) best (nearly sorted), O(n²) average and worst, O(1) space</li></ul>`,
    type: 'general', tags: ['algorithms', 'cheat-sheet', 'reference'], subject: 'CS', visibility: 'friends', isPinned: true,
  },
  {
    title: 'Pinned - Figma + Design Resources',
    contentType: 'html',
    content: `<p>A collection of design resources I come back to regularly.</p><p><strong>Figma tips:</strong> Always use Auto Layout - never rely on absolute positioning. Build components with variants so there is one source of truth. Keep colors, typography, and effects in a Styles library so changes propagate everywhere automatically.</p><p><strong>Color tools:</strong> coolors.co for generating palettes quickly. palettte.app for smooth gradient-based palettes. Realtime Colors lets you preview a palette live on an actual layout, which is much better than looking at swatches in isolation.</p><p><strong>Typography:</strong> typescale.com calculates a modular type scale from a base size and ratio. Google Fonts has a pairing tool built in. Font combinations I like: Inter + Fraunces, Geist + DM Serif.</p><p><strong>Inspiration:</strong> Dribbble for UI patterns and visual ideas. Mobbin for real app flows and interaction patterns from shipped products. Land-book for landing page design.</p><p><strong>Icon libraries:</strong> Lucide is MIT licensed with a consistent stroke weight - my default. Heroicons is from the Tailwind team and pairs well with Tailwind projects. Phosphor Icons offers multiple weights per icon if you need more variety.</p>`,
    type: 'general', tags: ['design', 'figma', 'resources'], subject: 'Design', visibility: 'friends', isPinned: true,
  },
];

// ─── Flashcard Sets ───────────────────────────────────────────────────────────

const flashcardSets = [
  // Private sets (5)
  {
    title: 'Data Structures - Trees & Graphs',
    description: 'Key concepts from the lecture notes',
    visibility: 'private',
    cards: [
      { front: 'What is the time complexity of BST search in the average case?', back: 'O(log n) - the tree is roughly balanced so each comparison halves the search space.' },
      { front: 'When does BST search degrade to O(n)?', back: 'When the tree is completely unbalanced (e.g., inserting sorted data), making it a linked list.' },
      { front: 'What is the difference between BFS and DFS?', back: 'BFS uses a queue and explores level-by-level. DFS uses a stack/recursion and goes deep before backtracking.' },
      { front: 'What is an adjacency matrix vs adjacency list?', back: 'Matrix: O(V²) space, O(1) edge lookup. List: O(V+E) space, better for sparse graphs.' },
      { front: 'What is an AVL tree?', back: 'A self-balancing BST where the height difference between left and right subtrees is at most 1. Uses rotations on insert/delete.' },
      { front: 'What traversal of a BST yields sorted output?', back: 'In-order traversal (left → root → right).' },
    ],
  },
  {
    title: 'Dynamic Programming Patterns',
    description: 'DP problem types and approaches',
    visibility: 'private',
    cards: [
      { front: 'What two properties indicate a problem can be solved with DP?', back: 'Optimal substructure and overlapping subproblems.' },
      { front: 'What is the difference between memoization and tabulation?', back: 'Memoization is top-down (recursive + cache). Tabulation is bottom-up (iterative table).' },
      { front: 'What is the time complexity of the 0/1 Knapsack problem?', back: 'O(nW) where n is number of items and W is knapsack capacity.' },
      { front: 'How do you find the Longest Common Subsequence?', back: 'dp[i][j] = length of LCS of first i chars of s1 and first j chars of s2. Time: O(nm).' },
      { front: 'What is the coin change problem?', back: 'Find minimum coins to make a target amount. dp[i] = min coins for amount i. O(amount × coins).' },
    ],
  },
  {
    title: 'OS Concepts',
    description: 'Operating systems fundamentals for exam',
    visibility: 'private',
    cards: [
      { front: 'What is a context switch?', back: 'Saving the state of a running process (registers, PCB) and loading the state of the next process to run.' },
      { front: 'What is Round Robin scheduling?', back: 'Preemptive scheduling where each process gets a time quantum. Good for time-sharing. Fairness over throughput.' },
      { front: 'What is the convoy effect in FCFS?', back: 'Short processes stuck waiting behind a long process. Hurts average wait time.' },
      { front: 'What is aging in priority scheduling?', back: 'Gradually increasing the priority of long-waiting processes to prevent starvation.' },
      { front: 'What are the phases of a context switch?', back: 'Save registers + PCB of current process, update scheduler, update TLB/memory map, restore registers of next process.' },
      { front: 'What is a process vs a thread?', back: 'A process has its own memory space. Threads share memory within a process. Threads are lighter and faster to create.' },
    ],
  },
  {
    title: 'TypeScript Utility Types',
    description: 'Quick reference for common TS utility types',
    visibility: 'private',
    cards: [
      { front: 'What does Partial<T> do?', back: 'Makes all properties of T optional.' },
      { front: 'What does Required<T> do?', back: 'Makes all properties of T required (opposite of Partial).' },
      { front: 'What does Pick<T, K> do?', back: 'Creates a type with only the specified keys K from T.' },
      { front: 'What does Omit<T, K> do?', back: 'Creates a type with all keys of T except the specified keys K.' },
      { front: 'What does ReturnType<F> do?', back: 'Extracts the return type of a function type F.' },
      { front: 'What does NonNullable<T> do?', back: 'Removes null and undefined from type T.' },
      { front: 'What does Record<K, V> do?', back: 'Creates an object type with keys K and values V.' },
      { front: 'What does Readonly<T> do?', back: 'Makes all properties of T read-only (cannot be reassigned).' },
    ],
  },
  {
    title: 'SQL Query Patterns',
    description: 'Common SQL patterns for the DB final',
    visibility: 'private',
    cards: [
      { front: 'What is the difference between WHERE and HAVING?', back: 'WHERE filters rows before grouping. HAVING filters groups after GROUP BY.' },
      { front: 'What does a LEFT JOIN return?', back: 'All rows from the left table, and matching rows from the right table. NULL for right-side columns with no match.' },
      { front: 'What is a correlated subquery?', back: 'A subquery that references columns from the outer query. Executes once per row of the outer query.' },
      { front: 'What is the difference between UNION and UNION ALL?', back: 'UNION removes duplicates. UNION ALL keeps all rows including duplicates. UNION ALL is faster.' },
    ],
  },
  // Friends-visible sets (5)
  {
    title: 'System Design Vocabulary',
    description: 'Key terms every engineer should know',
    visibility: 'friends',
    cards: [
      { front: 'What is horizontal vs vertical scaling?', back: 'Horizontal: add more machines. Vertical: add more power to one machine. Horizontal scales further but adds complexity.' },
      { front: 'What is a CDN?', back: 'Content Delivery Network - geographically distributed servers that cache static assets closer to users to reduce latency.' },
      { front: 'What is consistent hashing?', back: 'A technique for distributing data across nodes so that adding/removing a node only remaps a small fraction of keys.' },
      { front: 'What is a message queue?', back: 'Asynchronous communication between services. Producer puts messages in; consumers process them independently (e.g., Kafka, SQS).' },
      { front: 'What is the CAP theorem?', back: 'A distributed system can only guarantee 2 of: Consistency, Availability, Partition Tolerance.' },
      { front: 'What is database sharding?', back: 'Partitioning a database into horizontal shards (subsets of rows) across multiple servers for scale.' },
    ],
  },
  {
    title: 'React Patterns',
    description: 'Common patterns in production React codebases',
    visibility: 'friends',
    cards: [
      { front: 'What is the compound component pattern?', back: 'Parent component manages shared state; child components access it via Context. e.g., <Tabs>, <Tab>, <TabPanel>.' },
      { front: 'What is the render prop pattern?', back: 'A component takes a function as a prop and calls it to render its children, passing state as arguments.' },
      { front: 'What is the custom hook pattern?', back: 'Extract stateful logic into a reusable function prefixed with "use". Returns state and handlers.' },
      { front: 'When should you use useReducer over useState?', back: 'When state transitions are complex, depend on previous state, or multiple states are updated together.' },
      { front: 'What is code splitting in React?', back: 'React.lazy() + Suspense to load components only when needed, reducing initial bundle size.' },
    ],
  },
  {
    title: 'Docker Commands Reference',
    description: 'Commands used in DevOps coursework',
    visibility: 'friends',
    cards: [
      { front: 'How do you build a Docker image from a Dockerfile?', back: 'docker build -t <name>:<tag> .' },
      { front: 'How do you run a container and map ports?', back: 'docker run -p <host_port>:<container_port> <image>' },
      { front: 'How do you see running containers?', back: 'docker ps - add -a to see stopped containers too.' },
      { front: 'How do you shell into a running container?', back: 'docker exec -it <container_id> sh (or bash if available).' },
      { front: 'What is docker-compose used for?', back: 'Defining and running multi-container applications with a single docker-compose.yml config file.' },
      { front: 'How do you clean up unused images and containers?', back: 'docker system prune - removes all stopped containers, unused networks, dangling images.' },
    ],
  },
  {
    title: 'AWS Services Quick Reference',
    description: 'What each service does at a glance',
    visibility: 'friends',
    cards: [
      { front: 'What is S3 used for?', back: 'Object storage - storing files (images, PDFs, backups) with high durability and simple HTTP access.' },
      { front: 'What is Lambda?', back: 'Serverless compute - run code in response to events (HTTP requests, S3 events, scheduled timers) without managing servers.' },
      { front: 'What is SQS?', back: 'Simple Queue Service - managed message queue for decoupling services asynchronously.' },
      { front: 'What is CloudFront?', back: "AWS's CDN - distributes content from edge locations globally to reduce latency for end users." },
      { front: 'What is RDS?', back: 'Relational Database Service - managed SQL databases (Postgres, MySQL, etc.) with automated backups and scaling.' },
    ],
  },
  {
    title: 'Behavioral Interview STAR Stories',
    description: 'Shared prep material for interview season',
    visibility: 'friends',
    cards: [
      { front: 'Tell me about a time you worked on a difficult team project.', back: 'S: Distributed systems project, teammate went MIA mid-sprint.\nT: Cover the storage module or miss the deadline.\nA: Split the work with the remaining member, updated the professor early.\nR: Shipped on time, got an A-. Learned to set early check-ins.' },
      { front: 'Tell me about a failure and what you learned.', back: 'S: Failed the first ML midterm (scored 58%).\nT: Needed to significantly improve for the final.\nA: Changed study strategy - more practice problems, less passive reading.\nR: Scored 91% on the final. Now I always practice over reviewing notes.' },
      { front: 'Tell me about a time you led without formal authority.', back: 'S: Study group had no structure, missed sessions.\nT: Needed to organize without being the assigned leader.\nA: Created a shared Notion board, set up a weekly sync.\nR: Attendance improved, group average went from C+ to B+.' },
      { front: 'Why do you want to work here?', back: 'Research the company\'s product, mission, and engineering blog. Tie your interests to something specific they\'re building. Show you\'ve used the product.' },
    ],
  },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

const tomorrow = () => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d;
};
const daysFromNow = (n) => {
  const d = new Date(); d.setDate(d.getDate() + n); return d;
};
const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
};

const tasks = {
  todo: [
    { title: 'Finish distributed systems final project write-up', dueDate: daysFromNow(5), type: 'project', priority: 'high', description: 'Document architecture decisions and include benchmark results.' },
    { title: 'Study for OS final exam', dueDate: daysFromNow(8), type: 'study', priority: 'high', description: 'Focus on scheduling algorithms, memory management, and deadlocks.' },
    { title: 'Submit Stripe internship application', dueDate: daysFromNow(3), type: 'professional', priority: 'high', description: 'Tailor resume for payments infrastructure role. Write cover letter.' },
    { title: 'Complete LeetCode medium set (trees)', dueDate: daysFromNow(4), type: 'study', priority: 'medium', description: '10 tree problems. Focus on DFS/BFS traversal patterns.' },
    { title: 'Read DDIA Chapter 6 - Partitioning', dueDate: daysFromNow(6), type: 'homework', priority: 'medium', description: 'Take notes for distributed systems discussion.' },
    { title: 'Review pull request from Logan', dueDate: daysFromNow(2), type: 'project', priority: 'medium', description: 'Check the client library implementation for the KV store project.' },
    { title: 'Update portfolio with new projects', dueDate: daysFromNow(14), type: 'personal', priority: 'low', description: 'Add the compiler project and KV store. Update tech stack list.' },
  ],
  in_progress: [
    { title: 'Implement Raft leader election', dueDate: daysFromNow(3), type: 'project', priority: 'high', description: 'Heartbeat mechanism + election timer. Reference: Raft paper §5.2.' },
    { title: 'Prepare system design interview for Shopify', dueDate: tomorrow(), type: 'professional', priority: 'high', description: 'Practice designing a rate limiter and a notification system out loud.' },
    { title: 'DB course - query optimization assignment', dueDate: daysFromNow(2), type: 'homework', priority: 'high', description: 'Three queries to optimize using indexes and join reordering.' },
    { title: 'Build study timer app MVP', dueDate: daysFromNow(10), type: 'project', priority: 'medium', description: 'Pomodoro timer with session log. React + local storage to start.' },
    { title: 'Review behavioral interview stories', dueDate: daysFromNow(1), type: 'study', priority: 'medium', description: 'Practice STAR format out loud for 10 scenarios.' },
    { title: 'Set up Docker for local dev environment', dueDate: daysFromNow(3), type: 'project', priority: 'medium', description: 'Containerize app + db + redis in docker-compose.yml.' },
    { title: 'Write blog post draft - DP explained visually', dueDate: daysFromNow(12), type: 'personal', priority: 'low', description: 'Target audience: CS freshmen. Use Fibonacci and coin change as examples.' },
  ],
  completed: [
    { title: 'Submit OS midterm essay', dueDate: daysAgo(7), type: 'homework', priority: 'high', description: 'Comparison of scheduling algorithms with examples.' },
    { title: 'Complete LeetCode weekly challenge', dueDate: daysAgo(2), type: 'study', priority: 'medium', description: 'Two medium problems solved under contest conditions.' },
    { title: 'Apply to Figma Product Design Intern', dueDate: daysAgo(14), type: 'professional', priority: 'high', description: 'Submitted resume + portfolio link + answers to application questions.' },
    { title: 'DB assignment 2 - normalization', dueDate: daysAgo(5), type: 'homework', priority: 'medium', description: 'Normalize a messy schema to 3NF. Justify each step.' },
    { title: 'Read first 3 chapters of DDIA', dueDate: daysAgo(10), type: 'study', priority: 'medium', description: 'Reliable, scalable, maintainable applications section.' },
    { title: 'Set up CI pipeline for KV store project', dueDate: daysAgo(8), type: 'project', priority: 'medium', description: 'GitHub Actions running go test on every push.' },
    { title: 'Career fair prep - elevator pitches', dueDate: daysAgo(3), type: 'professional', priority: 'high', description: 'Practiced 30-second pitches for 5 target companies.' },
  ],
};

// ─── Applications ─────────────────────────────────────────────────────────────

const applications = [
  // Draft (5)
  { company: 'Linear', position: 'Frontend Engineer Intern', location: 'San Francisco, CA', status: 'draft', appliedAt: null, notes: 'Need to tailor resume to emphasize React + TypeScript. Find the right eng blog post to reference in cover letter.' },
  { company: 'Vercel', position: 'Developer Experience Intern', location: 'Remote', status: 'draft', appliedAt: null, notes: 'Check if they\'re even hiring interns this cycle. Follow @leeerob on Twitter for updates.' },
  { company: 'Notion', position: 'Software Engineering Intern', location: 'New York, NY', status: 'draft', appliedAt: null, notes: 'Heavy user of the product. Should be authentic in cover letter. Review their tech stack first.' },
  { company: 'Stripe', position: 'Engineering Intern - Payments Infrastructure', location: 'Seattle, WA', status: 'draft', appliedAt: null, notes: 'Read the Stripe blog - especially the payments reliability post. Very technical bar.' },
  { company: 'Datadog', position: 'Software Engineering Intern', location: 'New York, NY', status: 'draft', appliedAt: null, notes: 'Interesting distributed systems work. Relevance to course project. Apply after finishing KV store.' },

  // Applied (5)
  { company: 'Spotify', position: 'iOS Engineer Intern', location: 'New York, NY', status: 'applied', appliedAt: new Date('2026-01-15'), notes: 'Applied through company portal. No referral. Expected 2-4 week response time.' },
  { company: 'Airbnb', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: new Date('2026-01-20'), notes: 'Applied via referral from upperclassman. Strong product interest - used the app a lot while traveling.' },
  { company: 'Dropbox', position: 'Frontend Engineer Intern', location: 'Remote', status: 'applied', appliedAt: new Date('2026-01-28'), notes: 'Good product design culture. Strong React focus. Resume submitted, waiting on response.' },
  { company: 'Twilio', position: 'Software Engineer Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: new Date('2026-02-03'), notes: 'APIs and developer tools interest. Submitted through career fair portal.' },
  { company: 'HashiCorp', position: 'Engineering Intern - Platform', location: 'Remote', status: 'applied', appliedAt: new Date('2026-02-10'), notes: 'DevOps + distributed systems is a perfect match. Resume tailored for infrastructure work.' },

  // Interview (5)
  {
    company: 'Figma',
    position: 'Software Engineer Intern - Editor',
    location: 'San Francisco, CA',
    status: 'interview',
    appliedAt: new Date('2026-01-08'),
    notes: 'Phone screen passed. Two technical rounds scheduled. System design + coding.',
    contacts: [{ name: 'Priya Nair', role: 'Engineering Recruiter', email: 'priya.nair@figma.com', linkedIn: 'linkedin.com/in/priyanair', notes: 'Very responsive. Said to email with any questions.' }],
  },
  {
    company: 'Shopify',
    position: 'Frontend Engineer Intern',
    location: 'Remote',
    status: 'interview',
    appliedAt: new Date('2026-01-12'),
    notes: 'OA completed (2 mediums, both solved). Virtual onsite in two weeks.',
    contacts: [{ name: 'Ben Foster', role: 'Technical Recruiter', email: 'b.foster@shopify.com', linkedIn: '', notes: 'Confirmed interview date via email.' }],
  },
  {
    company: 'Palantir',
    position: 'Forward Deployed Engineering Intern',
    location: 'New York, NY',
    status: 'interview',
    appliedAt: new Date('2026-01-18'),
    notes: 'Passed the Karat interview. Next round: case study + technical interview with an FDE.',
    contacts: [{ name: 'Mia Chen', role: 'Campus Recruiter', email: 'mchen@palantir.com', linkedIn: 'linkedin.com/in/mia-chen', notes: 'Met at career fair. She fast-tracked my application.' }],
  },
  {
    company: 'DoorDash',
    position: 'Software Engineering Intern',
    location: 'San Francisco, CA',
    status: 'interview',
    appliedAt: new Date('2026-01-22'),
    notes: 'Phone screen was behavioral only. Technical round scheduled for next Tuesday.',
    contacts: [{ name: 'James Liu', role: 'HR Coordinator', email: 'james.liu@doordash.com', linkedIn: '', notes: 'Scheduling contact only.' }],
  },
  {
    company: 'MongoDB',
    position: 'Software Engineering Intern - Query Engine',
    location: 'New York, NY',
    status: 'interview',
    appliedAt: new Date('2026-02-01'),
    notes: 'Reached out after DB course got me interested in query optimization. Two-round virtual onsite.',
    contacts: [{ name: 'Sara Kim', role: 'University Recruiter', email: 'sara.kim@mongodb.com', linkedIn: 'linkedin.com/in/saraki', notes: 'Quick to respond. Very welcoming process.' }],
  },

  // Offer (5)
  { company: 'Shopify', position: 'Frontend Engineer Intern', location: 'Remote', status: 'offer', appliedAt: new Date('2026-01-12'), notes: 'Offer received! $55/hr + housing stipend. Decision deadline March 15. Comparing with Figma outcome.' },
  { company: 'Twitch', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: new Date('2025-11-30'), notes: 'Early return offer from last year\'s externship. $58/hr. Team was great - leaning toward accepting.' },
  { company: 'Ramp', position: 'Software Engineering Intern', location: 'New York, NY', status: 'offer', appliedAt: new Date('2026-01-05'), notes: 'Fast process - offer in 2 weeks. Strong engineering culture. $60/hr. Fintech exposure is valuable.' },
  { company: 'Notion', position: 'Software Engineering Intern', location: 'New York, NY', status: 'offer', appliedAt: new Date('2025-12-10'), notes: 'Dream product to work on. $52/hr + relocation. Culture fit was outstanding in every round.' },
  { company: 'Brex', position: 'Full-Stack Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: new Date('2026-01-25'), notes: 'Fintech + full-stack is a great combo. $58/hr. Interesting Elixir + TypeScript stack.' },

  // Rejected (5)
  { company: 'Google', position: 'Software Engineering Intern (STEP)', location: 'Multiple', status: 'rejected', appliedAt: new Date('2025-12-01'), notes: 'Rejected after the technical phone screen. Felt rushed on the last problem. Need more practice under time pressure.' },
  { company: 'Meta', position: 'Software Engineering Intern', location: 'Menlo Park, CA', status: 'rejected', appliedAt: new Date('2025-12-05'), notes: 'OA passed but rejected before interview. No feedback given. Volume rejections common for Meta.' },
  { company: 'Apple', position: 'Software Engineering Intern', location: 'Cupertino, CA', status: 'rejected', appliedAt: new Date('2025-11-28'), notes: 'No response for 6 weeks then form rejection. Heard their process is very slow and inconsistent.' },
  { company: 'Uber', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'rejected', appliedAt: new Date('2026-01-10'), notes: 'Rejected after virtual onsite. Struggled with the systems design question (real-time driver matching). Need to revisit geospatial indexing.' },
  { company: 'Twitter / X', position: 'Engineering Intern', location: 'San Francisco, CA', status: 'rejected', appliedAt: new Date('2025-12-20'), notes: 'Ghosted for 2 months then got a rejection. Heard the process is chaotic post-acquisition.' },

  // Withdrawn (5)
  { company: 'Goldman Sachs', position: 'Technology Analyst Intern', location: 'New York, NY', status: 'withdrawn', appliedAt: new Date('2025-11-15'), notes: 'Withdrew after getting better offers. Finance tech roles are well-paying but I prefer product-focused engineering.' },
  { company: 'JP Morgan', position: 'Software Engineering Intern', location: 'New York, NY', status: 'withdrawn', appliedAt: new Date('2025-11-20'), notes: 'Withdrew before phone screen. The more I researched, the less interested I was in the banking tech stack.' },
  { company: 'Oracle', position: 'Cloud Engineering Intern', location: 'Austin, TX', status: 'withdrawn', appliedAt: new Date('2025-12-10'), notes: 'Withdrew during the interview process. Culture didn\'t feel like a fit based on my research.' },
  { company: 'IBM', position: 'Software Developer Intern', location: 'Remote', status: 'withdrawn', appliedAt: new Date('2026-01-08'), notes: 'Offer came but compensation was well below market. Legacy systems work wasn\'t aligned with my learning goals.' },
  { company: 'Salesforce', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: new Date('2025-12-15'), notes: 'Withdrew after deciding the CRM space wasn\'t interesting enough. Wanted product companies with strong engineering cultures.' },
];

// ─── Resume ───────────────────────────────────────────────────────────────────

const resume = {
  fileName: 'jane_doe_resume.pdf',
  cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
  cloudinaryPublicId: 'resumes/jane_doe_resume',
  feedback: {
    overallScore: 82,
    strengths: [
      'Strong technical skills section with relevant modern technologies (React, TypeScript, Node.js, PostgreSQL, Docker)',
      'Quantified impact on project bullet points - "reduced load time by 40%" is more compelling than vague descriptions',
      'Education section is well-formatted with GPA and relevant coursework clearly highlighted',
    ],
    improvements: [
      'Work experience section is thin - consider expanding the project descriptions to fill the gap before first internship',
      'Missing a summary/objective statement; a 2-line summary tailored per role can significantly improve recruiter engagement',
      'Action verbs could be stronger - replace "worked on" and "helped with" with "engineered", "architected", "led"',
    ],
    sections: [
      { name: 'Summary', score: 60, feedback: 'No summary present. Add a 2-line tailored statement for each application type.' },
      { name: 'Experience', score: 72, feedback: 'Only course projects - valid for a junior, but try to add at least one external role (TA, freelance, open source).' },
      { name: 'Skills', score: 91, feedback: 'Excellent. Well-organized into categories. Remove any skills you can\'t discuss in an interview.' },
      { name: 'Education', score: 95, feedback: 'Perfect. GPA listed, relevant coursework included, honors noted.' },
    ],
    keywordOptimization: {
      presentKeywords: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST API', 'Git', 'Agile', 'AWS'],
      missingKeywords: ['System design', 'CI/CD', 'Microservices', 'Redis', 'Kubernetes'],
    },
  },
};

// ─── Messages ─────────────────────────────────────────────────────────────────

const conversations = [
  {
    friend: 'chrisnguyen',
    messages: [
      { from: 'jane', content: 'Hey! Did you finish the write-ahead log implementation for the KV store?' },
      { from: 'friend', content: 'Almost! Just debugging the recovery logic when we replay the log on startup. Should be done tonight.' },
      { from: 'jane', content: 'Nice. I\'m still stuck on the leader election - the election timer keeps firing too early.' },
      { from: 'friend', content: 'Are you randomizing the timeout? The Raft paper says 150–300ms range.' },
      { from: 'jane', content: 'Oh wait, I was using a fixed 200ms. That would cause split votes. Good catch.' },
      { from: 'friend', content: 'Classic. Let me know when your election is working, then we can test replication end to end.' },
      { from: 'jane', content: 'Will do. Meeting still on for Tuesday to review Logan\'s client code?' },
      { from: 'friend', content: 'Yep, 7pm Discord. I\'ll send the agenda tonight.' },
    ],
  },
  {
    friend: 'ryanfoster',
    messages: [
      { from: 'friend', content: 'Jane! Just found out I\'m interviewing at Figma next week. Any tips?' },
      { from: 'jane', content: 'Oh nice! I just did their technical round. The coding portion is pretty standard - medium LeetCode level.' },
      { from: 'friend', content: 'What about system design? I heard they ask product-specific questions.' },
      { from: 'jane', content: 'Yeah they asked me to design a feature in Figma. I\'d study multiplayer/real-time design and CDN for assets.' },
      { from: 'friend', content: 'That\'s really helpful. Did they give you a take-home beforehand?' },
      { from: 'jane', content: 'No take-home for me - went straight to virtual onsite. YMMV though.' },
      { from: 'friend', content: 'Got it. I\'ll focus on system design this week. Thanks!' },
    ],
  },
  {
    friend: 'zoeanderson',
    messages: [
      { from: 'jane', content: 'Hey Zoe! Are you going to the AI safety reading group meeting this week?' },
      { from: 'friend', content: 'Yes! We\'re covering the Constitutional AI paper. Have you read it?' },
      { from: 'jane', content: 'Skimmed it. The RLHF from AI feedback part is fascinating - basically using a Claude model to evaluate Claude.' },
      { from: 'friend', content: 'Exactly. It has big implications for scalable oversight. We can\'t have humans label everything forever.' },
      { from: 'jane', content: 'Agreed. I\'m more interested in the interpretability side - understanding what\'s actually happening inside models.' },
      { from: 'friend', content: 'There\'s a great Anthropic post on superposition if you haven\'t seen it.' },
      { from: 'jane', content: 'Bookmarked! See you Thursday.' },
      { from: 'friend', content: 'See you then! Bringing snacks 🎉' },
    ],
  },
  {
    friend: 'logancarter',
    messages: [
      { from: 'friend', content: 'Quick question - what consensus algorithm are you implementing for the final project?' },
      { from: 'jane', content: 'Raft. We looked at Paxos but the paper is notoriously hard to implement correctly. Raft was designed to be understandable.' },
      { from: 'friend', content: 'Smart. I\'m doing Raft too. Are you using any existing libraries or building from scratch?' },
      { from: 'jane', content: 'From scratch - it\'s a graduate course, so they want the full implementation. But I\'m reading the etcd source code for reference.' },
      { from: 'friend', content: 'Good call. The etcd implementation is clean. How are you handling log compaction?' },
      { from: 'jane', content: 'Snapshotting after every 100 log entries. Probably overkill for a project but it demonstrates the concept.' },
      { from: 'friend', content: 'Nice. Let me know if you want to compare implementations after we both finish.' },
    ],
  },
  {
    friend: 'kiananderson',
    messages: [
      { from: 'jane', content: 'Kian, I saw your tweet about the accessibility audit you did on your portfolio. Can you share what tools you used?' },
      { from: 'friend', content: 'Sure! I used axe DevTools extension + manual keyboard navigation + VoiceOver on Mac.' },
      { from: 'jane', content: 'Did you find many issues?' },
      { from: 'friend', content: 'A surprising number. Icon-only buttons had no aria-labels, focus styles were removed by my CSS reset, form errors weren\'t announced.' },
      { from: 'jane', content: 'I should do this for my portfolio too. Is there a quick checklist somewhere?' },
      { from: 'friend', content: 'A11y Project has a great one. And WebAIM contrast checker is your best friend for colors.' },
      { from: 'jane', content: 'Bookmarked both. Thanks!' },
      { from: 'friend', content: 'Accessibility is honestly one of those things that improves UX for everyone, not just users with disabilities.' },
      { from: 'jane', content: 'Exactly, it\'s not just a compliance checkbox. Makes the product better.' },
    ],
  },
  {
    friend: 'isabellachang',
    messages: [
      { from: 'friend', content: 'Jane! I just found out I got the Figma internship!!!' },
      { from: 'jane', content: 'OH CONGRATS!! That\'s amazing, I know how hard you worked for that!' },
      { from: 'friend', content: 'I seriously can\'t believe it. I bombed the first coding question and thought it was over.' },
      { from: 'jane', content: 'Interviews are so unpredictable. They clearly saw your potential overall.' },
      { from: 'friend', content: 'You helped me so much with system design prep - thank you seriously.' },
      { from: 'jane', content: 'You did the work! I just gave you a few tips. When do you start?' },
      { from: 'friend', content: 'June 2nd. San Francisco. I\'m so excited and terrified.' },
      { from: 'jane', content: 'You\'re going to crush it. Let me know if you want to debrief the process sometime.' },
    ],
  },
];

// ─── Activity Summaries ────────────────────────────────────────────────────────
// Used by seed-jane.js to create Activity documents after seeding content

const activityMeta = {
  noteShareCount: 8,      // number of Jane's friends-visible notes to create share activities for
  commentCount: 12,       // total comments from friends on Jane's notes
  taskCompleteCount: 5,   // completed tasks to create activity entries for
};

module.exports = {
  personalNotes,
  sharedNotes,
  flashcardSets,
  tasks,
  applications,
  resume,
  conversations,
  activityMeta,
};

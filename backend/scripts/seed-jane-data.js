// =============================================================================
// seed-jane-data.js — Content data for Jane Doe demo account
// =============================================================================

// ─── Notes ───────────────────────────────────────────────────────────────────

const personalNotes = [
  // Lecture notes (8)
  {
    title: 'Data Structures — Trees & Graphs',
    content: `# Trees & Graphs\n\n## Binary Search Trees\n- Left child < parent < right child\n- Search, insert, delete: O(log n) average, O(n) worst\n- In-order traversal yields sorted sequence\n\n## Balanced Trees\n- AVL: height diff ≤ 1, rotations on insert/delete\n- Red-Black: looser balance, faster inserts\n\n## Graph Representations\n- Adjacency matrix: O(V²) space, O(1) edge lookup\n- Adjacency list: O(V+E) space, better for sparse graphs\n\n## BFS vs DFS\n- BFS: shortest path in unweighted graph, uses queue\n- DFS: cycle detection, topological sort, uses stack/recursion`,
    type: 'lecture', tags: ['data-structures', 'trees', 'graphs', 'cs'], subject: 'CS 201', visibility: 'private', isPinned: false,
  },
  {
    title: 'Operating Systems — Process Scheduling',
    content: `# Process Scheduling\n\n## CPU Scheduling Algorithms\n- **FCFS**: simple, convoy effect\n- **SJF**: optimal avg wait, requires burst time prediction\n- **Round Robin**: preemptive, good for time-sharing (quantum size matters)\n- **Priority Scheduling**: starvation problem → aging solution\n\n## Context Switch Overhead\n- Save/restore registers, PCB update, TLB flush\n- Cost: 1–10 μs per switch\n\n## Multilevel Queue\n- Foreground (RR) vs background (FCFS)\n- Processes assigned to queue by type, don't move`,
    type: 'lecture', tags: ['os', 'scheduling', 'processes'], subject: 'CS 350', visibility: 'private', isPinned: false,
  },
  {
    title: 'Computer Networks — TCP/IP Stack',
    content: `# TCP/IP Stack\n\n## Layers\n1. Application (HTTP, DNS, SMTP)\n2. Transport (TCP, UDP)\n3. Network (IP, ICMP)\n4. Link (Ethernet, WiFi)\n\n## TCP vs UDP\n| TCP | UDP |\n|-----|-----|\n| Connection-oriented | Connectionless |\n| Reliable delivery | Best-effort |\n| Flow/congestion control | Low latency |\n| HTTP, FTP, SMTP | DNS, video, gaming |\n\n## Three-Way Handshake\nSYN → SYN-ACK → ACK\n\n## Congestion Control\n- Slow start → exponential growth\n- Congestion avoidance → linear growth\n- Fast retransmit on triple dup-ACK`,
    type: 'lecture', tags: ['networking', 'tcp', 'protocols'], subject: 'CS 450', visibility: 'private', isPinned: false,
  },
  {
    title: 'Database Systems — Indexing & Query Optimization',
    content: `# Indexing & Query Optimization\n\n## B+ Tree Index\n- All data in leaf nodes, internal nodes are keys only\n- Leaf nodes linked as a list → efficient range scans\n- O(log n) search, widely used (MySQL InnoDB)\n\n## Hash Index\n- O(1) exact lookups, no range queries\n- Good for equality predicates only\n\n## Query Execution Plans\n- EXPLAIN ANALYZE in Postgres\n- Seq scan vs Index scan vs Index-only scan\n- Nested loop join: O(n²), works well with small inner table\n- Hash join: O(n+m), good for large tables\n\n## Normalization\n- 1NF: atomic values\n- 2NF: no partial dependency\n- 3NF: no transitive dependency`,
    type: 'lecture', tags: ['databases', 'sql', 'indexing'], subject: 'CS 430', visibility: 'private', isPinned: false,
  },
  {
    title: 'Machine Learning — Gradient Descent',
    content: `# Gradient Descent\n\n## Core Idea\nMinimize loss function J(θ) by iteratively stepping in the direction of steepest descent:\n\n**θ = θ − α · ∇J(θ)**\n\n## Variants\n- **Batch GD**: uses full dataset, stable but slow\n- **SGD**: one sample per step, noisy but fast\n- **Mini-batch**: balance between batch and SGD (batch size 32–512)\n\n## Learning Rate α\n- Too large → diverges\n- Too small → slow convergence\n- Adaptive: Adam, RMSProp, AdaGrad\n\n## Vanishing/Exploding Gradients\n- Problem in deep networks with sigmoid/tanh\n- Fix: ReLU activations, batch norm, gradient clipping`,
    type: 'lecture', tags: ['ml', 'gradient-descent', 'optimization'], subject: 'CS 540', visibility: 'private', isPinned: false,
  },
  {
    title: 'Compilers — Parsing & AST',
    content: `# Parsing & Abstract Syntax Trees\n\n## Lexical Analysis\n- Tokenizer converts source → token stream\n- Tokens: keywords, identifiers, literals, operators\n\n## Context-Free Grammars\n- Production rules: S → aSb | ε\n- Derivation trees show parse structure\n\n## LL vs LR Parsing\n- LL(1): top-down, 1 token lookahead, recursive descent\n- LR(1): bottom-up, more powerful, handles left recursion\n\n## AST vs Parse Tree\n- Parse tree includes every grammar symbol\n- AST omits redundant nodes (parens, semicolons)\n- AST is input to semantic analysis + code generation`,
    type: 'lecture', tags: ['compilers', 'parsing', 'ast'], subject: 'CS 460', visibility: 'private', isPinned: false,
  },
  {
    title: 'Distributed Systems — Consensus Algorithms',
    content: `# Consensus Algorithms\n\n## Problem\nGet N nodes to agree on a single value despite failures.\n\n## Paxos\n- Proposer, Acceptor, Learner roles\n- Two phases: Prepare → Promise, Accept → Accepted\n- Complex, hard to implement correctly\n\n## Raft\n- Leader election + log replication\n- Leader sends heartbeats; followers time out → new election\n- Majority quorum (n/2 + 1) required\n- Easier to understand than Paxos\n\n## CAP Theorem\n- Can only guarantee 2 of: Consistency, Availability, Partition tolerance\n- CP: HBase, Zookeeper\n- AP: Cassandra, DynamoDB`,
    type: 'lecture', tags: ['distributed-systems', 'consensus', 'raft'], subject: 'CS 580', visibility: 'private', isPinned: false,
  },
  {
    title: 'Algorithms — Dynamic Programming',
    content: `# Dynamic Programming\n\n## When to Use\n- Optimal substructure: optimal solution uses optimal sub-solutions\n- Overlapping subproblems: same sub-problems solved repeatedly\n\n## Approaches\n- **Top-down (memoization)**: recursive + cache results\n- **Bottom-up (tabulation)**: fill table iteratively\n\n## Classic Problems\n- Fibonacci: O(n) with memo vs O(2^n) naive\n- 0/1 Knapsack: O(nW)\n- LCS: O(nm)\n- Coin change: O(amount × coins)\n\n## Key Insight\nDefine state clearly. dp[i] = \"answer for subproblem i\". Transition = how to build dp[i] from smaller states.`,
    type: 'lecture', tags: ['algorithms', 'dp', 'optimization'], subject: 'CS 310', visibility: 'private', isPinned: false,
  },
  // General notes (5)
  {
    title: 'Internship Prep Checklist',
    content: `# Internship Prep Checklist\n\n## Resume\n- [ ] Update with latest projects\n- [ ] Quantify all bullet points\n- [ ] Tailor per company\n\n## Technical\n- [ ] LeetCode: 2 mediums/day\n- [ ] System design: 1 reading/day\n- [ ] Review CS fundamentals (OS, networks, databases)\n\n## Behavioral\n- [ ] STAR format for 10 stories\n- [ ] Prep for: leadership, conflict, failure, collaboration\n\n## Applications\n- [ ] Figma (product design)\n- [ ] Shopify (frontend)\n- [ ] Stripe (full-stack)\n- [ ] Spotify (mobile)\n- [ ] Linear (product)`,
    type: 'general', tags: ['career', 'internship', 'checklist'], subject: 'Career', visibility: 'private', isPinned: true,
  },
  {
    title: 'Side Project Ideas',
    content: `# Side Project Ideas\n\n## High Priority\n1. **Portfolio rewrite** — Next.js + Tailwind, dark mode, project showcases\n2. **Study timer app** — Pomodoro with session analytics, streak tracking\n\n## Medium Priority\n3. **Recipe organizer** — CRUD + tagging, meal planning calendar\n4. **Habit tracker** — daily check-ins, heatmap visualization\n\n## Low Priority / Someday\n5. **Open source contrib** — find a good first issue on a tool I use\n6. **Chrome extension** — tab manager with auto-grouping\n\n## Notes\n- Focus on shipping, not perfecting\n- Each project should solve a real problem I have\n- Document process for blog posts`,
    type: 'general', tags: ['projects', 'ideas', 'coding'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Books to Read This Semester',
    content: `# Reading List\n\n## Technical\n- *Designing Data-Intensive Applications* — Kleppmann (in progress)\n- *The Pragmatic Programmer* — Hunt & Thomas\n- *Clean Code* — Martin\n\n## Career & Mindset\n- *So Good They Can't Ignore You* — Newport\n- *Atomic Habits* — Clear (re-read)\n\n## For Fun\n- *The Design of Everyday Things* — Norman\n- *Where Good Ideas Come From* — Johnson\n\n## Currently Reading\n- DDIA, Chapter 5 (Replication)`,
    type: 'general', tags: ['books', 'reading', 'learning'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Weekly Review Template',
    content: `# Weekly Review\n\n## What went well this week?\n-\n\n## What didn't go well?\n-\n\n## What did I learn?\n-\n\n## Tasks completed\n-\n\n## Tasks carried over\n-\n\n## Top 3 priorities for next week\n1.\n2.\n3.\n\n## Energy & focus check-in\n- Sleep avg:\n- Exercise:\n- Stress level (1-10):`,
    type: 'general', tags: ['productivity', 'template', 'weekly-review'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'CSS Tips & Tricks',
    content: `# CSS Tips I Keep Forgetting\n\n## Centering\n\`\`\`css\n/* Flexbox center */\ndisplay: flex; align-items: center; justify-content: center;\n\n/* Grid center */\ndisplay: grid; place-items: center;\n\`\`\`\n\n## Responsive Text\n\`\`\`css\nfont-size: clamp(1rem, 2.5vw, 2rem);\n\`\`\`\n\n## Sticky Header\n\`\`\`css\nposition: sticky; top: 0; z-index: 100;\n\`\`\`\n\n## Custom Scrollbar\n\`\`\`css\n::-webkit-scrollbar { width: 6px; }\n::-webkit-scrollbar-thumb { background: #888; border-radius: 3px; }\n\`\`\``,
    type: 'general', tags: ['css', 'frontend', 'tips'], subject: 'Web Dev', visibility: 'private', isPinned: false,
  },
  // Journal entries (4)
  {
    title: 'Journal — First Week of Semester',
    content: `# First Week Back\n\nFeeling good about this semester. My schedule is manageable — 4 courses, no 8am classes for once. The distributed systems course is going to be hard but I wanted to take something that would push me.\n\nStarted going to the gym again after a month off. Even just 3x a week makes a huge difference in focus.\n\nApplied to Figma and Shopify already. Trying not to obsess over checking email. Just submit and move on.`,
    type: 'journal', tags: ['journal', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Journal — Midterm Week',
    content: `# Midterm Week\n\nTwo exams in two days. OS was hard but I feel okay about it. DB was way easier than I expected — the indexing questions were exactly what I studied.\n\nTook a full day off after they were done. Watched movies, cooked, didn't open my laptop once. Really needed it.\n\nGot a first-round interview at Figma. Nervous but excited. Practicing system design every day this week.`,
    type: 'journal', tags: ['journal', 'exams', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Journal — Interview Post-Mortem',
    content: `# Figma Interview — Technical Round\n\nWent okay. The coding portion was fine (medium LC, sliding window). The system design was rough — I blanked on the load balancing piece and rambled.\n\nInterviewer was kind and gave hints. I recovered by the end.\n\nThings to work on:\n- Practice talking through design decisions out loud\n- Review consistent hashing, CDN architecture\n- Don't panic when I get stuck — just say what I'm thinking\n\nWill know in a week. Fingers crossed.`,
    type: 'journal', tags: ['journal', 'interview', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  {
    title: 'Journal — End of March',
    content: `# End of March Check-In\n\nLot happening. Got the Shopify offer — still deciding. Figma rejected after the final round but honestly I learned a lot. No hard feelings, just more to work on.\n\nCourse project is going well. My group is solid — everyone actually does their part.\n\nStarting to feel the end of semester crunch but it's manageable. Just need to stay consistent through April.`,
    type: 'journal', tags: ['journal', 'reflection'], subject: null, visibility: 'private', isPinned: false,
  },
  // Research/todo notes (3)
  {
    title: 'Research — State Management Options',
    content: `# React State Management Research\n\n## Options Compared\n\n### Zustand\n- Lightweight, minimal boilerplate\n- Simple API: create(set => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }))\n- Good for small-medium apps\n\n### Jotai\n- Atomic model, inspired by Recoil\n- Great for derived/computed state\n\n### Redux Toolkit\n- Industry standard for large apps\n- Heavy but powerful devtools\n- Best if team is already familiar\n\n## Decision\nFor my side project: Zustand. For internship work: follow whatever the team uses.`,
    type: 'research', tags: ['react', 'state-management', 'research'], subject: 'Web Dev', visibility: 'private', isPinned: false,
  },
  {
    title: 'Todo — Final Project Milestones',
    content: `# Final Project: Distributed Key-Value Store\n\n## Milestones\n\n### Week 1 (done)\n- [x] Basic TCP server/client\n- [x] Simple in-memory hash map\n\n### Week 2 (in progress)\n- [x] Persistent storage (write-ahead log)\n- [ ] Replication to 2 replicas\n\n### Week 3\n- [ ] Leader election\n- [ ] Read from replica\n\n### Week 4\n- [ ] Load testing\n- [ ] Write-up and presentation\n\n## Notes\nUsing Go for this. Channel-based concurrency is a great fit.`,
    type: 'todo', tags: ['project', 'distributed-systems', 'go'], subject: 'CS 580', visibility: 'private', isPinned: false,
  },
  {
    title: 'Research — TypeScript Generics',
    content: `# TypeScript Generics Deep Dive\n\n## Why Generics\nAvoid code duplication while preserving type safety.\n\n## Basic Example\n\`\`\`ts\nfunction identity<T>(arg: T): T { return arg; }\n\`\`\`\n\n## Constrained Generics\n\`\`\`ts\nfunction getLength<T extends { length: number }>(arg: T): number {\n  return arg.length;\n}\n\`\`\`\n\n## Conditional Types\n\`\`\`ts\ntype IsString<T> = T extends string ? 'yes' : 'no';\n\`\`\`\n\n## Utility Types\n- Partial<T>, Required<T>, Readonly<T>\n- Pick<T, K>, Omit<T, K>\n- ReturnType<F>, Parameters<F>`,
    type: 'research', tags: ['typescript', 'generics', 'frontend'], subject: 'Web Dev', visibility: 'private', isPinned: false,
  },
];

const sharedNotes = [
  // Shared lecture notes (8)
  {
    title: 'System Design — URL Shortener',
    content: `# System Design: URL Shortener\n\n## Requirements\n- Shorten URL, redirect on visit, ~100M URLs/day read-heavy\n\n## Core Design\n1. **ID generation**: Base62 encode a counter or random ID → 7 chars = 62^7 ≈ 3.5T URLs\n2. **Storage**: KV store (Redis for hot URLs, Cassandra for persistence)\n3. **Redirect**: 301 (cached by browser) vs 302 (track every visit)\n\n## Scale\n- Read:Write ≈ 100:1\n- Cache top 20% URLs (handles 80% of traffic)\n- CDN edge nodes for global redirect latency\n\n## DB Schema\n\`\`\`\nshort_url | original_url | user_id | created_at | expires_at\n\`\`\``,
    type: 'lecture', tags: ['system-design', 'backend', 'scale'], subject: 'System Design', visibility: 'friends', isPinned: true,
  },
  {
    title: 'System Design — Design a Chat System',
    content: `# System Design: Real-Time Chat\n\n## Core Flow\n1. Client connects via WebSocket\n2. Message → server → fan-out to recipients\n3. Offline users → message queue (Kafka) → push on reconnect\n\n## Storage\n- **Messages**: NoSQL (Cassandra) — append-heavy, time-ordered reads\n- **User/conversation metadata**: SQL\n- Hot conversations in Redis\n\n## Presence\n- Heartbeat every 30s\n- Last-seen stored in Redis with TTL\n\n## Scale\n- Horizontal WebSocket servers behind a load balancer\n- Pub/Sub (Redis) for cross-server message delivery`,
    type: 'lecture', tags: ['system-design', 'websockets', 'chat'], subject: 'System Design', visibility: 'friends', isPinned: false,
  },
  {
    title: 'React Hooks — Deep Dive',
    content: `# React Hooks Reference\n\n## useState\n- Local component state\n- Re-renders on state update\n- Lazy init: useState(() => expensiveCalc())\n\n## useEffect\n- Runs after render\n- Cleanup function for subscriptions/timers\n- Deps array controls when it runs\n\n## useCallback & useMemo\n- Memoize functions/values\n- Only use when passing to child components or expensive computations\n- Premature optimization is real — profile first\n\n## useRef\n- Mutable ref, no re-render on change\n- DOM access, storing previous values, cancel tokens\n\n## Custom Hooks\n- Extract reusable stateful logic\n- Must start with 'use'`,
    type: 'lecture', tags: ['react', 'hooks', 'frontend'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'REST vs GraphQL vs tRPC',
    content: `# API Design: REST vs GraphQL vs tRPC\n\n## REST\n- Standard, simple, cache-friendly\n- Over/under-fetching common\n- Good default for most APIs\n\n## GraphQL\n- Client specifies shape of response\n- Eliminates over/under-fetching\n- More complex server setup, harder caching\n- Best for: complex data graphs, many client types\n\n## tRPC\n- TypeScript end-to-end type safety\n- No schema definition step\n- Only works for TypeScript monorepos\n- Best for: T3 stack, small teams\n\n## Recommendation\n- CRUD app: REST\n- Complex graph + multiple clients: GraphQL\n- Full TypeScript monorepo: tRPC`,
    type: 'lecture', tags: ['api', 'graphql', 'rest', 'backend'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Cloud Computing — AWS Core Services',
    content: `# AWS Core Services Cheat Sheet\n\n## Compute\n- **EC2**: virtual machines, full control\n- **Lambda**: serverless, event-driven, pay-per-invocation\n- **ECS/EKS**: containers (Docker / Kubernetes)\n\n## Storage\n- **S3**: object storage, highly durable (11 9s)\n- **EBS**: block storage attached to EC2\n- **RDS**: managed relational DB (Postgres, MySQL)\n- **DynamoDB**: managed NoSQL, single-digit ms at any scale\n\n## Networking\n- **VPC**: isolated virtual network\n- **CloudFront**: CDN\n- **Route 53**: DNS\n- **ALB/NLB**: load balancers\n\n## Messaging\n- **SQS**: managed queue\n- **SNS**: pub/sub\n- **Kinesis**: real-time data streams`,
    type: 'lecture', tags: ['aws', 'cloud', 'devops'], subject: 'Cloud Computing', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Frontend Performance Optimization',
    content: `# Frontend Performance\n\n## Core Web Vitals\n- **LCP** (Largest Contentful Paint): < 2.5s\n- **FID** (First Input Delay): < 100ms\n- **CLS** (Cumulative Layout Shift): < 0.1\n\n## Optimization Techniques\n- Code splitting (React.lazy + Suspense)\n- Image optimization (WebP, lazy loading, srcset)\n- Bundle analysis (webpack-bundle-analyzer)\n- Tree shaking (ES modules)\n- Debounce/throttle event handlers\n- Virtual lists for long lists (react-window)\n\n## Caching\n- Service workers for offline + cache\n- CDN for static assets\n- HTTP cache headers (Cache-Control, ETag)\n\n## Tools\n- Lighthouse in Chrome DevTools\n- WebPageTest for real-world testing`,
    type: 'lecture', tags: ['performance', 'frontend', 'web'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Docker & Containers Basics',
    content: `# Docker Basics\n\n## Core Concepts\n- **Image**: read-only template (Dockerfile → image)\n- **Container**: running instance of an image\n- **Registry**: storage for images (Docker Hub, ECR)\n\n## Dockerfile Example\n\`\`\`dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]\n\`\`\`\n\n## Useful Commands\n\`\`\`bash\ndocker build -t myapp .\ndocker run -p 3000:3000 myapp\ndocker ps / docker logs / docker exec -it <id> sh\n\`\`\`\n\n## Docker Compose\nDefine multi-container apps (app + db + redis) in docker-compose.yml`,
    type: 'lecture', tags: ['docker', 'devops', 'containers'], subject: 'DevOps', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Web Accessibility (a11y) Guide',
    content: `# Web Accessibility\n\n## Why It Matters\n~1 in 5 people have a disability. Also: SEO, legal requirements, better UX for everyone.\n\n## WCAG 2.1 Principles (POUR)\n- **Perceivable**: text alternatives, captions, contrast\n- **Operable**: keyboard accessible, no seizure triggers, enough time\n- **Understandable**: readable, predictable, error handling\n- **Robust**: compatible with assistive technologies\n\n## Practical Checklist\n- Alt text on all images\n- Color contrast ≥ 4.5:1 (text), 3:1 (UI elements)\n- Focus visible on all interactive elements\n- Semantic HTML (button, nav, main, heading hierarchy)\n- ARIA labels for icon-only buttons\n- Form labels linked to inputs\n\n## Tools\n- axe DevTools (Chrome extension)\n- Lighthouse accessibility audit\n- Screen reader testing (NVDA, VoiceOver)`,
    type: 'lecture', tags: ['accessibility', 'frontend', 'ux'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  // Shared general notes (6)
  {
    title: 'Group Project — Sprint 1 Plan',
    content: `# CS 580 Final Project — Sprint 1\n\n## Team\n- Jane (lead): server architecture, Raft implementation\n- Chris: storage layer, write-ahead log\n- Logan: client library, testing harness\n\n## Sprint 1 Goals (2 weeks)\n- [ ] Repo setup, CI pipeline\n- [ ] Basic KV server (get/set/delete over TCP)\n- [ ] Persistent log format spec\n- [ ] Leader election skeleton\n\n## Meeting: Tuesdays 7pm (Discord)\n\n## Links\n- GitHub: github.com/[team]/kv-store\n- Notion: [project board link]\n- Rubric: [course page]`,
    type: 'general', tags: ['project', 'distributed-systems', 'team'], subject: 'CS 580', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Interview Prep — Behavioral Questions',
    content: `# Behavioral Interview Bank\n\n## Tell me about yourself\n"CS junior with a focus on full-stack and product. I've built [projects], done [coursework], and am looking for a role where I can ship user-facing features and grow as an engineer."\n\n## Challenges\n**S**: Distributed systems project, teammate stopped responding\n**T**: Needed to cover their module or miss the deadline\n**A**: Split the work, communicated with professor early\n**R**: Shipped on time, learned to set early check-in points\n\n## Leadership\n**S**: Study group without clear direction\n**T**: Organize without being the formal leader\n**A**: Created shared Notion, set recurring meeting\n**R**: Group avg grade went from C+ to B+\n\n## Failure\nFailed first ML midterm. Overcorrected on practice problems after, aced the final.`,
    type: 'general', tags: ['interview', 'behavioral', 'career'], subject: 'Career', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Study Group — DB Final Exam Topics',
    content: `# DB Final Exam Topics\n\n## High Priority (likely on exam)\n- Transaction isolation levels (READ UNCOMMITTED through SERIALIZABLE)\n- Deadlock detection and prevention\n- B+ tree operations (insert, delete, search)\n- Query optimization (join algorithms, index selection)\n- ACID properties with examples\n\n## Medium Priority\n- Normalization (1NF → BCNF)\n- ER diagram to relational schema\n- Concurrency control (2PL, MVCC)\n\n## Low Priority\n- Distributed transactions, 2PC\n\n## Study Group Schedule\n- Wednesday 6pm: transactions + concurrency\n- Friday 4pm: indexing + query opt\n- Sunday: full practice exam`,
    type: 'general', tags: ['databases', 'study-group', 'exam-prep'], subject: 'CS 430', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Resources — Best YouTube Channels for CS',
    content: `# Best CS YouTube Channels\n\n## Algorithms & DS\n- **Abdul Bari** — best explanations of DP, graphs\n- **WilliamFiset** — graph theory series\n- **NeetCode** — LeetCode patterns\n\n## System Design\n- **Gaurav Sen** — system design fundamentals\n- **ByteByteGo** — visual, fast-paced\n- **Exponent** — mock interviews\n\n## CS Concepts\n- **MIT OpenCourseWare** — actual MIT lectures\n- **CS Dojo** — beginner-friendly\n- **Reducible** — math + CS deep dives\n\n## Frontend / Web\n- **Fireship** — quick hits, entertaining\n- **Kevin Powell** — CSS master class\n- **Jack Herrington** — advanced React patterns`,
    type: 'general', tags: ['resources', 'youtube', 'learning'], subject: null, visibility: 'friends', isPinned: false,
  },
  {
    title: 'Networking Tips — Making the Most of Career Fairs',
    content: `# Career Fair Strategy\n\n## Before\n- Research top 10 target companies\n- Tailor 30-second pitch per company type\n- Print 20+ resumes (bring more than you think)\n- Upload resume to company portals beforehand\n\n## At the Fair\n- Go early (less crowded, recruiters fresh)\n- Elevator pitch: who you are, what you're interested in, why this company\n- Ask good questions: "What does the onboarding look like for interns?"\n- Get business card or LinkedIn\n\n## After\n- Email within 24 hours: "Great meeting you at [school] career fair..."\n- Connect on LinkedIn with a personal note\n- Follow up on application status after 1 week\n\n## Don't\n- Read off your resume\n- Ask about salary at the fair\n- Hover waiting for a gap — use a natural opening`,
    type: 'general', tags: ['career', 'networking', 'tips'], subject: 'Career', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Open Source Contribution Guide',
    content: `# Getting Started with Open Source\n\n## Finding Good First Issues\n- GitHub: label:"good first issue" + label:"help wanted"\n- goodfirstissue.dev\n- up-for-grabs.net\n\n## Workflow\n1. Fork the repo\n2. Read CONTRIBUTING.md and CODE_OF_CONDUCT.md\n3. Set up local dev environment\n4. Create a branch: git checkout -b fix/issue-123\n5. Make the change, add tests\n6. Submit PR with clear description linking the issue\n\n## Good First Contributions\n- Fix typos in docs\n- Add missing tests\n- Improve error messages\n- Small bug fixes with a clear repro case\n\n## Tips\n- Start small — understand the codebase before big changes\n- Be patient — maintainers are busy\n- Respond to review feedback quickly`,
    type: 'general', tags: ['open-source', 'github', 'career'], subject: null, visibility: 'friends', isPinned: false,
  },
  // Shared research notes (4)
  {
    title: 'Research — WebSockets vs Server-Sent Events vs Polling',
    content: `# Real-Time Communication Options\n\n## Short Polling\n- Client asks server every N seconds\n- Simple, but wasteful (most responses are empty)\n\n## Long Polling\n- Server holds request open until data available\n- Better than short polling, but still HTTP overhead\n\n## Server-Sent Events (SSE)\n- Server pushes updates over persistent HTTP connection\n- One-way (server → client)\n- Good for: notifications, live feeds\n\n## WebSockets\n- Full-duplex, persistent connection\n- Both sides can push at any time\n- Good for: chat, gaming, collaborative editing\n\n## When to Use What\n- Simple updates + browser compat: SSE\n- Interactive real-time: WebSockets\n- Simple, no real-time needed: polling`,
    type: 'research', tags: ['websockets', 'sse', 'real-time', 'research'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Research — Database Selection Guide',
    content: `# Choosing a Database\n\n## SQL (Relational)\n- Strong consistency, ACID, joins, schema enforcement\n- Best for: financial data, user accounts, anything relational\n- Options: Postgres (default choice), MySQL, SQLite\n\n## Document (NoSQL)\n- Flexible schema, nested data, horizontal scaling\n- Best for: user profiles, product catalogs, CMS\n- Options: MongoDB, Firestore\n\n## Key-Value\n- Extremely fast, simple data model\n- Best for: caching, sessions, leaderboards\n- Options: Redis, DynamoDB\n\n## Column-Family\n- Write-heavy, time-series, wide rows\n- Best for: analytics, IoT, event logs\n- Options: Cassandra, HBase\n\n## Graph\n- Highly connected data, relationship queries\n- Best for: social networks, fraud detection\n- Options: Neo4j, Amazon Neptune`,
    type: 'research', tags: ['databases', 'sql', 'nosql', 'research'], subject: 'System Design', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Research — React Query vs SWR vs Apollo',
    content: `# Data Fetching Libraries Compared\n\n## React Query (TanStack Query)\n- Full-featured: caching, background refresh, pagination, optimistic updates\n- Works with any async function\n- DevTools are excellent\n- Best for: most React apps\n\n## SWR\n- Lightweight, created by Vercel\n- Simpler API, less configuration\n- Great for: Next.js apps, simple data fetching\n\n## Apollo Client\n- GraphQL-specific\n- Normalized cache, complex queries\n- Heavy — only worth it for GraphQL\n\n## Conclusion\n- REST/fetch API: React Query\n- Next.js simple: SWR\n- GraphQL: Apollo\n\nCurrently using React Query v5 — loving the devtools and the queryKey pattern.`,
    type: 'research', tags: ['react', 'data-fetching', 'react-query', 'research'], subject: 'Web Dev', visibility: 'friends', isPinned: false,
  },
  {
    title: 'Research — Git Workflow Strategies',
    content: `# Git Workflows\n\n## Git Flow\n- Long-lived branches: main, develop, feature/*, hotfix/*, release/*\n- Good for: versioned products with scheduled releases\n- Complex — many branches to manage\n\n## GitHub Flow\n- Simple: main + feature branches + PRs\n- Deploy from main\n- Good for: web apps with continuous deployment\n\n## Trunk-Based Development\n- Everyone commits to main (or very short-lived branches)\n- Feature flags for incomplete work\n- Good for: high-velocity teams, microservices\n\n## Recommendation\n- Small team / web app: GitHub Flow\n- Larger team: Trunk-based with feature flags\n- Mobile app / versioned: Git Flow\n\n## Conventional Commits\nfeat: | fix: | docs: | chore: | refactor: | test:`,
    type: 'research', tags: ['git', 'workflow', 'devops', 'research'], subject: 'DevOps', visibility: 'friends', isPinned: false,
  },
  // Pinned shared notes (2)
  {
    title: 'Pinned — Quick Reference: Big-O Cheat Sheet',
    content: `# Big-O Complexity Cheat Sheet\n\n## Common Complexities (fast → slow)\nO(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n) < O(n!)\n\n## Data Structure Operations\n| Structure | Access | Search | Insert | Delete |\n|-----------|--------|--------|--------|--------|\n| Array | O(1) | O(n) | O(n) | O(n) |\n| Linked List | O(n) | O(n) | O(1) | O(1) |\n| Hash Table | O(1) | O(1) | O(1) | O(1) |\n| BST (avg) | O(log n) | O(log n) | O(log n) | O(log n) |\n| Heap | O(1) | O(n) | O(log n) | O(log n) |\n\n## Sorting Algorithms\n| Algorithm | Best | Avg | Worst | Space |\n|-----------|------|-----|-------|-------|\n| Quicksort | O(n log n) | O(n log n) | O(n²) | O(log n) |\n| Mergesort | O(n log n) | O(n log n) | O(n log n) | O(n) |\n| Heapsort | O(n log n) | O(n log n) | O(n log n) | O(1) |\n| Insertion | O(n) | O(n²) | O(n²) | O(1) |`,
    type: 'general', tags: ['algorithms', 'cheat-sheet', 'reference'], subject: 'CS', visibility: 'friends', isPinned: true,
  },
  {
    title: 'Pinned — Figma + Design Resources',
    content: `# Design Resources\n\n## Figma\n- Auto Layout: always use it, never absolute position\n- Components + variants: one source of truth\n- Styles library: colors, type, effects\n\n## Color Tools\n- coolors.co — palette generator\n- palettte.app — smooth gradient palettes\n- realtime colors — live preview on a real layout\n\n## Typography\n- typescale.com — modular scale calculator\n- Google Fonts pairing tool\n- Font pairs: Inter + Fraunces, Geist + DM Serif\n\n## Inspiration\n- dribbble.com (UI patterns)\n- mobbin.com (real app flows)\n- land-book.com (landing pages)\n\n## Icon Libraries\n- Lucide (MIT, consistent stroke)\n- Heroicons (Tailwind team)\n- Phosphor Icons (varied weights)`,
    type: 'general', tags: ['design', 'figma', 'resources'], subject: 'Design', visibility: 'friends', isPinned: true,
  },
];

// ─── Flashcard Sets ───────────────────────────────────────────────────────────

const flashcardSets = [
  // Private sets (5)
  {
    title: 'Data Structures — Trees & Graphs',
    description: 'Key concepts from the lecture notes',
    visibility: 'private',
    cards: [
      { front: 'What is the time complexity of BST search in the average case?', back: 'O(log n) — the tree is roughly balanced so each comparison halves the search space.' },
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
      { front: 'What is a CDN?', back: 'Content Delivery Network — geographically distributed servers that cache static assets closer to users to reduce latency.' },
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
      { front: 'How do you see running containers?', back: 'docker ps — add -a to see stopped containers too.' },
      { front: 'How do you shell into a running container?', back: 'docker exec -it <container_id> sh (or bash if available).' },
      { front: 'What is docker-compose used for?', back: 'Defining and running multi-container applications with a single docker-compose.yml config file.' },
      { front: 'How do you clean up unused images and containers?', back: 'docker system prune — removes all stopped containers, unused networks, dangling images.' },
    ],
  },
  {
    title: 'AWS Services Quick Reference',
    description: 'What each service does at a glance',
    visibility: 'friends',
    cards: [
      { front: 'What is S3 used for?', back: 'Object storage — storing files (images, PDFs, backups) with high durability and simple HTTP access.' },
      { front: 'What is Lambda?', back: 'Serverless compute — run code in response to events (HTTP requests, S3 events, scheduled timers) without managing servers.' },
      { front: 'What is SQS?', back: 'Simple Queue Service — managed message queue for decoupling services asynchronously.' },
      { front: 'What is CloudFront?', back: "AWS's CDN — distributes content from edge locations globally to reduce latency for end users." },
      { front: 'What is RDS?', back: 'Relational Database Service — managed SQL databases (Postgres, MySQL, etc.) with automated backups and scaling.' },
    ],
  },
  {
    title: 'Behavioral Interview STAR Stories',
    description: 'Shared prep material for interview season',
    visibility: 'friends',
    cards: [
      { front: 'Tell me about a time you worked on a difficult team project.', back: 'S: Distributed systems project, teammate went MIA mid-sprint.\nT: Cover the storage module or miss the deadline.\nA: Split the work with the remaining member, updated the professor early.\nR: Shipped on time, got an A-. Learned to set early check-ins.' },
      { front: 'Tell me about a failure and what you learned.', back: 'S: Failed the first ML midterm (scored 58%).\nT: Needed to significantly improve for the final.\nA: Changed study strategy — more practice problems, less passive reading.\nR: Scored 91% on the final. Now I always practice over reviewing notes.' },
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
    { title: 'Read DDIA Chapter 6 — Partitioning', dueDate: daysFromNow(6), type: 'homework', priority: 'medium', description: 'Take notes for distributed systems discussion.' },
    { title: 'Review pull request from Logan', dueDate: daysFromNow(2), type: 'project', priority: 'medium', description: 'Check the client library implementation for the KV store project.' },
    { title: 'Update portfolio with new projects', dueDate: daysFromNow(14), type: 'personal', priority: 'low', description: 'Add the compiler project and KV store. Update tech stack list.' },
  ],
  in_progress: [
    { title: 'Implement Raft leader election', dueDate: daysFromNow(3), type: 'project', priority: 'high', description: 'Heartbeat mechanism + election timer. Reference: Raft paper §5.2.' },
    { title: 'Prepare system design interview for Shopify', dueDate: tomorrow(), type: 'professional', priority: 'high', description: 'Practice designing a rate limiter and a notification system out loud.' },
    { title: 'DB course — query optimization assignment', dueDate: daysFromNow(2), type: 'homework', priority: 'high', description: 'Three queries to optimize using indexes and join reordering.' },
    { title: 'Build study timer app MVP', dueDate: daysFromNow(10), type: 'project', priority: 'medium', description: 'Pomodoro timer with session log. React + local storage to start.' },
    { title: 'Review behavioral interview stories', dueDate: daysFromNow(1), type: 'study', priority: 'medium', description: 'Practice STAR format out loud for 10 scenarios.' },
    { title: 'Set up Docker for local dev environment', dueDate: daysFromNow(3), type: 'project', priority: 'medium', description: 'Containerize app + db + redis in docker-compose.yml.' },
    { title: 'Write blog post draft — DP explained visually', dueDate: daysFromNow(12), type: 'personal', priority: 'low', description: 'Target audience: CS freshmen. Use Fibonacci and coin change as examples.' },
  ],
  completed: [
    { title: 'Submit OS midterm essay', dueDate: daysAgo(7), type: 'homework', priority: 'high', description: 'Comparison of scheduling algorithms with examples.' },
    { title: 'Complete LeetCode weekly challenge', dueDate: daysAgo(2), type: 'study', priority: 'medium', description: 'Two medium problems solved under contest conditions.' },
    { title: 'Apply to Figma Product Design Intern', dueDate: daysAgo(14), type: 'professional', priority: 'high', description: 'Submitted resume + portfolio link + answers to application questions.' },
    { title: 'DB assignment 2 — normalization', dueDate: daysAgo(5), type: 'homework', priority: 'medium', description: 'Normalize a messy schema to 3NF. Justify each step.' },
    { title: 'Read first 3 chapters of DDIA', dueDate: daysAgo(10), type: 'study', priority: 'medium', description: 'Reliable, scalable, maintainable applications section.' },
    { title: 'Set up CI pipeline for KV store project', dueDate: daysAgo(8), type: 'project', priority: 'medium', description: 'GitHub Actions running go test on every push.' },
    { title: 'Career fair prep — elevator pitches', dueDate: daysAgo(3), type: 'professional', priority: 'high', description: 'Practiced 30-second pitches for 5 target companies.' },
  ],
};

// ─── Applications ─────────────────────────────────────────────────────────────

const applications = [
  // Draft (5)
  { company: 'Linear', position: 'Frontend Engineer Intern', location: 'San Francisco, CA', status: 'draft', appliedAt: null, notes: 'Need to tailor resume to emphasize React + TypeScript. Find the right eng blog post to reference in cover letter.' },
  { company: 'Vercel', position: 'Developer Experience Intern', location: 'Remote', status: 'draft', appliedAt: null, notes: 'Check if they\'re even hiring interns this cycle. Follow @leeerob on Twitter for updates.' },
  { company: 'Notion', position: 'Software Engineering Intern', location: 'New York, NY', status: 'draft', appliedAt: null, notes: 'Heavy user of the product. Should be authentic in cover letter. Review their tech stack first.' },
  { company: 'Stripe', position: 'Engineering Intern — Payments Infrastructure', location: 'Seattle, WA', status: 'draft', appliedAt: null, notes: 'Read the Stripe blog — especially the payments reliability post. Very technical bar.' },
  { company: 'Datadog', position: 'Software Engineering Intern', location: 'New York, NY', status: 'draft', appliedAt: null, notes: 'Interesting distributed systems work. Relevance to course project. Apply after finishing KV store.' },

  // Applied (5)
  { company: 'Spotify', position: 'iOS Engineer Intern', location: 'New York, NY', status: 'applied', appliedAt: new Date('2026-01-15'), notes: 'Applied through company portal. No referral. Expected 2-4 week response time.' },
  { company: 'Airbnb', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: new Date('2026-01-20'), notes: 'Applied via referral from upperclassman. Strong product interest — used the app a lot while traveling.' },
  { company: 'Dropbox', position: 'Frontend Engineer Intern', location: 'Remote', status: 'applied', appliedAt: new Date('2026-01-28'), notes: 'Good product design culture. Strong React focus. Resume submitted, waiting on response.' },
  { company: 'Twilio', position: 'Software Engineer Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: new Date('2026-02-03'), notes: 'APIs and developer tools interest. Submitted through career fair portal.' },
  { company: 'HashiCorp', position: 'Engineering Intern — Platform', location: 'Remote', status: 'applied', appliedAt: new Date('2026-02-10'), notes: 'DevOps + distributed systems is a perfect match. Resume tailored for infrastructure work.' },

  // Interview (5)
  {
    company: 'Figma',
    position: 'Software Engineer Intern — Editor',
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
    position: 'Software Engineering Intern — Query Engine',
    location: 'New York, NY',
    status: 'interview',
    appliedAt: new Date('2026-02-01'),
    notes: 'Reached out after DB course got me interested in query optimization. Two-round virtual onsite.',
    contacts: [{ name: 'Sara Kim', role: 'University Recruiter', email: 'sara.kim@mongodb.com', linkedIn: 'linkedin.com/in/saraki', notes: 'Quick to respond. Very welcoming process.' }],
  },

  // Offer (5)
  { company: 'Shopify', position: 'Frontend Engineer Intern', location: 'Remote', status: 'offer', appliedAt: new Date('2026-01-12'), notes: 'Offer received! $55/hr + housing stipend. Decision deadline March 15. Comparing with Figma outcome.' },
  { company: 'Twitch', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: new Date('2025-11-30'), notes: 'Early return offer from last year\'s externship. $58/hr. Team was great — leaning toward accepting.' },
  { company: 'Ramp', position: 'Software Engineering Intern', location: 'New York, NY', status: 'offer', appliedAt: new Date('2026-01-05'), notes: 'Fast process — offer in 2 weeks. Strong engineering culture. $60/hr. Fintech exposure is valuable.' },
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
      'Quantified impact on project bullet points — "reduced load time by 40%" is more compelling than vague descriptions',
      'Education section is well-formatted with GPA and relevant coursework clearly highlighted',
    ],
    improvements: [
      'Work experience section is thin — consider expanding the project descriptions to fill the gap before first internship',
      'Missing a summary/objective statement; a 2-line summary tailored per role can significantly improve recruiter engagement',
      'Action verbs could be stronger — replace "worked on" and "helped with" with "engineered", "architected", "led"',
    ],
    sections: [
      { name: 'Summary', score: 60, feedback: 'No summary present. Add a 2-line tailored statement for each application type.' },
      { name: 'Experience', score: 72, feedback: 'Only course projects — valid for a junior, but try to add at least one external role (TA, freelance, open source).' },
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
      { from: 'jane', content: 'Nice. I\'m still stuck on the leader election — the election timer keeps firing too early.' },
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
      { from: 'jane', content: 'Oh nice! I just did their technical round. The coding portion is pretty standard — medium LeetCode level.' },
      { from: 'friend', content: 'What about system design? I heard they ask product-specific questions.' },
      { from: 'jane', content: 'Yeah they asked me to design a feature in Figma. I\'d study multiplayer/real-time design and CDN for assets.' },
      { from: 'friend', content: 'That\'s really helpful. Did they give you a take-home beforehand?' },
      { from: 'jane', content: 'No take-home for me — went straight to virtual onsite. YMMV though.' },
      { from: 'friend', content: 'Got it. I\'ll focus on system design this week. Thanks!' },
    ],
  },
  {
    friend: 'zoeanderson',
    messages: [
      { from: 'jane', content: 'Hey Zoe! Are you going to the AI safety reading group meeting this week?' },
      { from: 'friend', content: 'Yes! We\'re covering the Constitutional AI paper. Have you read it?' },
      { from: 'jane', content: 'Skimmed it. The RLHF from AI feedback part is fascinating — basically using a Claude model to evaluate Claude.' },
      { from: 'friend', content: 'Exactly. It has big implications for scalable oversight. We can\'t have humans label everything forever.' },
      { from: 'jane', content: 'Agreed. I\'m more interested in the interpretability side — understanding what\'s actually happening inside models.' },
      { from: 'friend', content: 'There\'s a great Anthropic post on superposition if you haven\'t seen it.' },
      { from: 'jane', content: 'Bookmarked! See you Thursday.' },
      { from: 'friend', content: 'See you then! Bringing snacks 🎉' },
    ],
  },
  {
    friend: 'logancarter',
    messages: [
      { from: 'friend', content: 'Quick question — what consensus algorithm are you implementing for the final project?' },
      { from: 'jane', content: 'Raft. We looked at Paxos but the paper is notoriously hard to implement correctly. Raft was designed to be understandable.' },
      { from: 'friend', content: 'Smart. I\'m doing Raft too. Are you using any existing libraries or building from scratch?' },
      { from: 'jane', content: 'From scratch — it\'s a graduate course, so they want the full implementation. But I\'m reading the etcd source code for reference.' },
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
      { from: 'friend', content: 'You helped me so much with system design prep — thank you seriously.' },
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

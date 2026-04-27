// =============================================================================
// seed.js — Demo data seeder for Continuum
// =============================================================================
//
// Usage:
//   node backend/scripts/seed.js           # idempotent — skips if data exists
//   node backend/scripts/seed.js --clean   # wipes seed data and reseeds
//   node backend/scripts/seed.js --no-ai   # skips Groq calls, uses fallbacks
// =============================================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const {
  User, Note, FlashcardSet, Flashcard, Task, Application,
  Friendship, Conversation, Message, Comment, Activity, StudySession,
} = require('../models');
const { generateSummary, generateFlashcards } = require('../services/groq.service');
const { sendShareMessage } = require('../services/share.service');
const seedData = require('./seed-justin-data');

const CLEAN = process.argv.includes('--clean');
const NO_AI = process.argv.includes('--no-ai');

// ─── Seed Friend Data ───────────────────────────────────────────────────────

const SEED_FRIENDS = [
  {
    username: 'alexchen_cs',
    email: 'alexchen_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Alex',
    lastName: 'Chen',
    bio: 'CS sophomore obsessed with algorithms and competitive programming. ACM member, LeetCode grinder, aspiring SWE intern.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'mayapatel_ds',
    email: 'mayapatel_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Maya',
    lastName: 'Patel',
    bio: 'Data Science & Stats junior. Python, pandas, and a lot of coffee. Research assistant in the ML lab.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'jordanwilliams_demo',
    email: 'jordanwilliams_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Jordan',
    lastName: 'Williams',
    bio: 'Senior in Computer Engineering. Building embedded systems and debating hardware vs software career paths.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'priyasharma_demo',
    email: 'priyasharma_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Priya',
    lastName: 'Sharma',
    bio: 'Pre-med sophomore. Bio major with a minor in chemistry. MCAT prep starts this summer.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'marcusjohnson_demo',
    email: 'marcusjohnson_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Marcus',
    lastName: 'Johnson',
    bio: 'Finance junior eyeing investment banking. Excel wizard, DCF enthusiast, networking machine.',
    settings: { activityVisibility: 'friends' },
  },
  {
    username: 'sofiarod_demo',
    email: 'sofiarod_demo@example.com',
    password: 'Demo@1234',
    firstName: 'Sofia',
    lastName: 'Rodriguez',
    bio: 'Psych junior interested in cognitive science and UX research. Applying to grad school this fall.',
    settings: { activityVisibility: 'friends' },
  },
];

const SEED_USERNAMES = SEED_FRIENDS.map(f => f.username);

// ─── Non-Friend Users (searchable, no friendship with Justin) ────────────────

const SEED_STRANGERS = [
  { username: 'aaronmitchell_demo', firstName: 'Aaron', lastName: 'Mitchell', bio: 'CS junior into cybersecurity and CTF competitions. Trying to break into bug bounty.' },
  { username: 'abbygrant_demo', firstName: 'Abby', lastName: 'Grant', bio: 'English lit senior writing her thesis on postcolonial fiction. Coffee shop regular.' },
  { username: 'adrianreyes_demo', firstName: 'Adrian', lastName: 'Reyes', bio: 'Mechanical engineering junior. Formula SAE team lead. Loves CAD and motorsport.' },
  { username: 'alanawhite_demo', firstName: 'Alana', lastName: 'White', bio: 'Public health sophomore. Interested in global health policy and epidemiology.' },
  { username: 'alexisford_demo', firstName: 'Alexis', lastName: 'Ford', bio: 'Accounting junior with a minor in data analytics. CPA prep starts next year.' },
  { username: 'aliciamoreno_demo', firstName: 'Alicia', lastName: 'Moreno', bio: 'Architecture student designing sustainable housing. Studio life is real.' },
  { username: 'allisonbell_demo', firstName: 'Allison', lastName: 'Bell', bio: 'Music performance major and part-time piano teacher. Classical meets jazz.' },
  { username: 'amandalee_demo', firstName: 'Amanda', lastName: 'Lee', bio: 'Pre-law junior. Mock trial president. Interested in intellectual property law.' },
  { username: 'amirahassan_demo', firstName: 'Amira', lastName: 'Hassan', bio: 'Neuroscience sophomore. Lab assistant studying memory consolidation.' },
  { username: 'andrewkim_demo', firstName: 'Andrew', lastName: 'Kim', bio: 'Software engineering senior with a backend focus. Interning at a startup this summer.' },
  { username: 'angelapark_demo', firstName: 'Angela', lastName: 'Park', bio: 'Marketing major obsessed with brand strategy and social media analytics.' },
  { username: 'anthonygreen_demo', firstName: 'Anthony', lastName: 'Green', bio: 'Econ major with a quant focus. Interested in hedge funds and algorithmic trading.' },
  { username: 'aryankapoor_demo', firstName: 'Aryan', lastName: 'Kapoor', bio: 'Data engineering junior. Loves Spark, Kafka, and building data pipelines at scale.' },
  { username: 'ashleythomas_demo', firstName: 'Ashley', lastName: 'Thomas', bio: 'Kinesiology senior studying sports performance. Training for her first triathlon.' },
  { username: 'austinwalker_demo', firstName: 'Austin', lastName: 'Walker', bio: 'Game dev enthusiast. Unity and Unreal projects in progress. Indie dev dreams.' },
  { username: 'averyharris_demo', firstName: 'Avery', lastName: 'Harris', bio: 'Biology sophomore on the pre-vet track. Currently studying for the GRE.' },
  { username: 'ayeshazahid_demo', firstName: 'Ayesha', lastName: 'Zahid', bio: 'Chemical engineering junior. Research in polymer synthesis and sustainable materials.' },
  { username: 'baileyrogers_demo', firstName: 'Bailey', lastName: 'Rogers', bio: 'Political science senior interning on a state senator campaign.' },
  { username: 'benswanson_demo', firstName: 'Ben', lastName: 'Swanson', bio: 'Stats and CS double major. Applying for quant research roles. Kaggle competitor.' },
  { username: 'brettjohnson_demo', firstName: 'Brett', lastName: 'Johnson', bio: 'Finance junior on the investment club board. DCF and comps all day.' },
  { username: 'brittanycox_demo', firstName: 'Brittany', lastName: 'Cox', bio: 'Communications major and campus newspaper editor. Aspiring journalist.' },
  { username: 'camelolivier_demo', firstName: 'Camel', lastName: 'Olivier', bio: 'International relations junior. Studied abroad in Paris last semester. Fluent in French.' },
  { username: 'carlosfernandez_demo', firstName: 'Carlos', lastName: 'Fernandez', bio: 'Electrical engineering senior specializing in signal processing and embedded systems.' },
  { username: 'carolinehall_demo', firstName: 'Caroline', lastName: 'Hall', bio: 'Graphic design junior building her portfolio. UI/UX freelance work on the side.' },
  { username: 'cassandralewis_demo', firstName: 'Cassandra', lastName: 'Lewis', bio: 'Sociology senior studying urban inequality and housing policy.' },
  { username: 'chandlerdavis_demo', firstName: 'Chandler', lastName: 'Davis', bio: 'Supply chain management junior with internship at a logistics company.' },
  { username: 'charlottehill_demo', firstName: 'Charlotte', lastName: 'Hill', bio: 'Environmental science sophomore. Research on microplastics in freshwater systems.' },
  { username: 'chrisnguyen_demo', firstName: 'Chris', lastName: 'Nguyen', bio: 'CS and math double major. Exploring formal verification and type theory.' },
  { username: 'christinabaker_demo', firstName: 'Christina', lastName: 'Baker', bio: 'Nursing junior. Clinical rotations start in the fall. Future ICU nurse.' },
  { username: 'claudiavega_demo', firstName: 'Claudia', lastName: 'Vega', bio: 'Psychology senior running a study on social media and anxiety in college students.' },
  { username: 'connorflynn_demo', firstName: 'Connor', lastName: 'Flynn', bio: 'Philosophy and CS double major. Interested in AI ethics and philosophy of mind.' },
  { username: 'coopermartin_demo', firstName: 'Cooper', lastName: 'Martin', bio: 'Aerospace engineering junior. Rocketry club president. SpaceX internship goal.' },
  { username: 'coreystone_demo', firstName: 'Corey', lastName: 'Stone', bio: 'Business analytics junior. Python for finance, Tableau dashboards, Excel power user.' },
  { username: 'daniellebrown_demo', firstName: 'Danielle', lastName: 'Brown', bio: 'Creative writing MFA. Short stories published in two literary journals this year.' },
  { username: 'davidwilson_demo', firstName: 'David', lastName: 'Wilson', bio: 'Mechanical engineering senior with a robotics specialization. ROS and SLAM all day.' },
  { username: 'demi_okonkwo_demo', firstName: 'Demi', lastName: 'Okonkwo', bio: 'Pre-med senior. MCAT score: 518. Applying to MD/PhD programs this cycle.' },
  { username: 'derek_santos_demo', firstName: 'Derek', lastName: 'Santos', bio: 'Sports management junior. Working on a thesis about NIL deals in college athletics.' },
  { username: 'dianachen_demo', firstName: 'Diana', lastName: 'Chen', bio: 'Biochem and CS double major. Computational drug discovery research assistant.' },
  { username: 'dominicross_demo', firstName: 'Dominic', lastName: 'Ross', bio: 'Economics senior writing on cryptocurrency adoption in emerging markets.' },
  { username: 'dylanmurphy_demo', firstName: 'Dylan', lastName: 'Murphy', bio: 'Computer science sophomore. Just finished my first internship at a SaaS company.' },
  { username: 'emilyharrison_demo', firstName: 'Emily', lastName: 'Harrison', bio: 'Art history junior with a minor in museum studies. Interning at a local gallery.' },
  { username: 'ericrogers_demo', firstName: 'Eric', lastName: 'Rogers', bio: 'Physics senior doing undergraduate research in quantum optics lab.' },
  { username: 'erikamorales_demo', firstName: 'Erika', lastName: 'Morales', bio: 'Industrial engineering junior. Passionate about lean manufacturing and operations research.' },
  { username: 'ethancooper_demo', firstName: 'Ethan', lastName: 'Cooper', bio: 'CS junior specializing in NLP. Built a sentiment analysis tool for course reviews.' },
  { username: 'evawong_demo', firstName: 'Eva', lastName: 'Wong', bio: 'Health informatics senior. Bridging EHR data and ML for clinical decision support.' },
  { username: 'faithturner_demo', firstName: 'Faith', lastName: 'Turner', bio: 'Education major. Student teaching this semester. Passionate about math pedagogy.' },
  { username: 'fionasmith_demo', firstName: 'Fiona', lastName: 'Smith', bio: 'Environmental studies junior. Campus sustainability committee co-chair.' },
  { username: 'gabriellalopez_demo', firstName: 'Gabriella', lastName: 'Lopez', bio: 'Theater performance major and improv team captain. Also fluent in Spanish.' },
  { username: 'garretthughes_demo', firstName: 'Garrett', lastName: 'Hughes', bio: 'Finance and accounting double major. Passed CFA Level I last December.' },
  { username: 'gemmaoverton_demo', firstName: 'Gemma', lastName: 'Overton', bio: 'Biology junior with a focus on genetics. CRISPR research assistant.' },
  { username: 'grantpayne_demo', firstName: 'Grant', lastName: 'Payne', bio: 'Management information systems senior. SAP certification in progress.' },
  { username: 'graciecallahan_demo', firstName: 'Gracie', lastName: 'Callahan', bio: 'Social work junior. Volunteer crisis counselor. Mental health advocacy on campus.' },
  { username: 'hannahwebb_demo', firstName: 'Hannah', lastName: 'Webb', bio: 'Journalism and political science double major. Campus radio host.' },
  { username: 'harperscott_demo', firstName: 'Harper', lastName: 'Scott', bio: 'Marketing junior focusing on brand strategy. Founder of a small Etsy shop.' },
  { username: 'henryfields_demo', firstName: 'Henry', lastName: 'Fields', bio: 'History and economics double major. Writing a thesis on the 2008 financial crisis.' },
  { username: 'isabellachang_demo', firstName: 'Isabella', lastName: 'Chang', bio: 'CS sophomore interested in full-stack development. Built 3 projects this semester.' },
  { username: 'ivannazaro_demo', firstName: 'Ivan', lastName: 'Nazaro', bio: 'Materials science and engineering senior. Research in solid-state batteries.' },
  { username: 'jadewashington_demo', firstName: 'Jade', lastName: 'Washington', bio: "Criminal justice junior. Internship with a public defender's office this summer." },
  { username: 'jakeoliver_demo', firstName: 'Jake', lastName: 'Oliver', bio: 'Accounting senior. Big Four internship lined up. Loves golf and tax law trivia.' },
  { username: 'jasmineyoung_demo', firstName: 'Jasmine', lastName: 'Young', bio: 'Pre-pharmacy junior. Completing 300 hours of pharmacy observation this year.' },
  { username: 'jasonmendez_demo', firstName: 'Jason', lastName: 'Mendez', bio: 'Civil engineering senior. Structural analysis and bridge design competition winner.' },
  { username: 'jaydennelson_demo', firstName: 'Jayden', lastName: 'Nelson', bio: 'Sports science and exercise physiology major. Strength and conditioning coach.' },
  { username: 'jessicaadams_demo', firstName: 'Jessica', lastName: 'Adams', bio: 'Psychology and statistics double major. Running logistic regression on clinical data.' },
  { username: 'jonathanreeves_demo', firstName: 'Jonathan', lastName: 'Reeves', bio: 'Computer engineering junior. FPGA design and embedded Linux enthusiast.' },
  { username: 'juliacosta_demo', firstName: 'Julia', lastName: 'Costa', bio: 'International business junior with a semester abroad in São Paulo.' },
  { username: 'justinstewart_demo', firstName: 'Justin', lastName: 'Stewart', bio: 'CS sophomore. Currently grinding LeetCode and looking for internships.' },
  { username: 'kaileyjones_demo', firstName: 'Kailey', lastName: 'Jones', bio: 'Elementary education major. Student teaching at Lincoln Elementary this fall.' },
  { username: 'karenshaw_demo', firstName: 'Karen', lastName: 'Shaw', bio: 'Food science and nutrition junior. Research on gut microbiome and cognitive health.' },
  { username: 'karlmorrison_demo', firstName: 'Karl', lastName: 'Morrison', bio: 'Philosophy junior wrestling with ethics of autonomous systems and AI.' },
  { username: 'katelyn_price_demo', firstName: 'Katelyn', lastName: 'Price', bio: 'Marketing and design double major. Brand consulting side hustle.' },
  { username: 'keirajohnston_demo', firstName: 'Keira', lastName: 'Johnston', bio: 'Biology senior heading to medical school in the fall. Pediatrics interest.' },
  { username: 'kevinzhang_demo', firstName: 'Kevin', lastName: 'Zhang', bio: 'ML engineer track. PyTorch, transformers, and fine-tuning LLMs for fun.' },
  { username: 'kiananderson_demo', firstName: 'Kian', lastName: 'Anderson', bio: 'Human-computer interaction junior. Obsessed with accessibility and inclusive design.' },
  { username: 'kristinawills_demo', firstName: 'Kristina', lastName: 'Wills', bio: 'Communications and PR major. Runs the campus events Instagram page.' },
  { username: 'kylewatson_demo', firstName: 'Kyle', lastName: 'Watson', bio: 'Civil and environmental engineering senior. Capstone: stormwater management system.' },
  { username: 'laurencollins_demo', firstName: 'Lauren', lastName: 'Collins', bio: 'Human resources management junior. SHRM certification prep in progress.' },
  { username: 'leahowens_demo', firstName: 'Leah', lastName: 'Owens', bio: 'Chemistry sophomore doing undergraduate research in organometallics.' },
  { username: 'lewisbishop_demo', firstName: 'Lewis', lastName: 'Bishop', bio: 'Economics and philosophy double major. Writing about behavioral nudges in policy.' },
  { username: 'lilymcgee_demo', firstName: 'Lily', lastName: 'McGee', bio: 'Graphic design senior with a portfolio in editorial illustration and branding.' },
  { username: 'linaberger_demo', firstName: 'Lina', lastName: 'Berger', bio: 'German and international relations double major. Exchange student program coordinator.' },
  { username: 'logancarter_demo', firstName: 'Logan', lastName: 'Carter', bio: 'CS junior doing research on distributed systems and consensus algorithms.' },
  { username: 'luisaguerra_demo', firstName: 'Luisa', lastName: 'Guerra', bio: 'Public relations junior. Campus newspaper features editor. Aspiring media strategist.' },
  { username: 'lukethompson_demo', firstName: 'Luke', lastName: 'Thompson', bio: 'Athletic training junior. Working with the football team as a student trainer.' },
  { username: 'madisonperkins_demo', firstName: 'Madison', lastName: 'Perkins', bio: 'Sociology and criminology double major. Research on recidivism and prison reform.' },
  { username: 'marcohernandez_demo', firstName: 'Marco', lastName: 'Hernandez', bio: 'Information systems senior. Specializing in ERP implementation and IT consulting.' },
  { username: 'marissaward_demo', firstName: 'Marissa', lastName: 'Ward', bio: 'Nursing junior completing clinical hours at the county hospital. ICU focus.' },
  { username: 'matthewevans_demo', firstName: 'Matthew', lastName: 'Evans', bio: 'CS and linguistics double major. NLP research on code-switching in bilingual texts.' },
  { username: 'meganlewis_demo', firstName: 'Megan', lastName: 'Lewis', bio: 'Finance junior with an internship at a regional bank. CFA prep in progress.' },
  { username: 'melissacruz_demo', firstName: 'Melissa', lastName: 'Cruz', bio: 'Healthcare management junior. Interning at a hospital administration office.' },
  { username: 'michaelrobbins_demo', firstName: 'Michael', lastName: 'Robbins', bio: 'Physics and CS double major. Applying for PhD programs in quantum computing.' },
  { username: 'migueltorres_demo', firstName: 'Miguel', lastName: 'Torres', bio: 'Mechanical engineering junior. Renewable energy focus. Solar car team captain.' },
  { username: 'morgandixon_demo', firstName: 'Morgan', lastName: 'Dixon', bio: 'Psychology and data science double major. Running sentiment analysis on therapy transcripts.' },
  { username: 'naomirichards_demo', firstName: 'Naomi', lastName: 'Richards', bio: 'Pre-med senior with a research background in infectious disease and immunology.' },
  { username: 'nathanielbrown_demo', firstName: 'Nathaniel', lastName: 'Brown', bio: 'CS sophomore learning systems programming in Rust. OS project in progress.' },
  { username: 'nicolassimon_demo', firstName: 'Nicolas', lastName: 'Simon', bio: 'International economics junior. Thesis on trade policy post-COVID.' },
  { username: 'nicolewagner_demo', firstName: 'Nicole', lastName: 'Wagner', bio: 'Biology and chemistry double major on the pre-pharmacy track.' },
  { username: 'noahcoleman_demo', firstName: 'Noah', lastName: 'Coleman', bio: 'CS junior focused on computer vision. Working on a real-time pose estimation project.' },
  { username: 'oliviachang_demo', firstName: 'Olivia', lastName: 'Chang', bio: 'Biomedical engineering sophomore. Research in drug delivery systems.' },
  { username: 'owenparker_demo', firstName: 'Owen', lastName: 'Parker', bio: 'Political science and communications double major. Student government vice president.' },
  { username: 'paigethornton_demo', firstName: 'Paige', lastName: 'Thornton', bio: 'Fashion merchandising junior. Runs a sustainable fashion blog with 5k followers.' },
  { username: 'patrickhughes_demo', firstName: 'Patrick', lastName: 'Hughes', bio: 'Finance senior with a CFA Level I. Aiming for equity research at a bulge bracket.' },
  { username: 'paulavargas_demo', firstName: 'Paula', lastName: 'Vargas', bio: 'Biochemistry senior heading to a PhD in pharmacology. Enzyme kinetics researcher.' },
  { username: 'philippedumont_demo', firstName: 'Philippe', lastName: 'Dumont', bio: 'French and economics double major. Exchange student from Lyon on a one-year program.' },
  { username: 'rachelmontgomery_demo', firstName: 'Rachel', lastName: 'Montgomery', bio: 'Psychology junior doing research on trauma and cognitive behavioral therapy.' },
  { username: 'ryanfoster_demo', firstName: 'Ryan', lastName: 'Foster', bio: 'Computer science junior. Competitive programmer, top 5% on Codeforces.' },
  { username: 'samaraellis_demo', firstName: 'Samara', lastName: 'Ellis', bio: 'Digital marketing and analytics senior. Google Analytics certified.' },
  { username: 'samuelwhite_demo', firstName: 'Samuel', lastName: 'White', bio: 'Operations research junior using optimization models for supply chain problems.' },
  { username: 'sarahcampbell_demo', firstName: 'Sarah', lastName: 'Campbell', bio: 'Biostatistics senior applying for epidemiology PhD programs. R and Stata daily.' },
  { username: 'scottmanning_demo', firstName: 'Scott', lastName: 'Manning', bio: 'History junior specializing in Cold War and US foreign policy.' },
  { username: 'sierrarobinson_demo', firstName: 'Sierra', lastName: 'Robinson', bio: 'Environmental engineering junior. Capstone: air quality modeling for urban areas.' },
  { username: 'stephaniegrant_demo', firstName: 'Stephanie', lastName: 'Grant', bio: 'Accounting and information systems double major. ERP systems internship this summer.' },
  { username: 'tannerwood_demo', firstName: 'Tanner', lastName: 'Wood', bio: 'Finance junior. Investment club treasurer. Day trading on the side.' },
  { username: 'taylormorgan_demo', firstName: 'Taylor', lastName: 'Morgan', bio: 'CS and graphic design double major. Building a design system for a startup.' },
  { username: 'tianarobinson_demo', firstName: 'Tiana', lastName: 'Robinson', bio: 'Social work and psychology double major. Runs a peer support program on campus.' },
  { username: 'timothyjackson_demo', firstName: 'Timothy', lastName: 'Jackson', bio: 'Agricultural economics junior. Research on food deserts and market access.' },
  { username: 'traceyholmes_demo', firstName: 'Tracey', lastName: 'Holmes', bio: 'Statistics junior applying ML methods to healthcare outcomes research.' },
  { username: 'trevornash_demo', firstName: 'Trevor', lastName: 'Nash', bio: 'CS sophomore. Full-stack side projects and open source contributor.' },
  { username: 'tylercole_demo', firstName: 'Tyler', lastName: 'Cole', bio: 'Sports analytics junior. Python and R for basketball performance modeling.' },
  { username: 'vanessaramirez_demo', firstName: 'Vanessa', lastName: 'Ramirez', bio: 'International business and Spanish double major. Study abroad coordinator.' },
  { username: 'victorchukwu_demo', firstName: 'Victor', lastName: 'Chukwu', bio: 'Finance and economics junior. Interested in venture capital and startup ecosystems.' },
  { username: 'victoriastone_demo', firstName: 'Victoria', lastName: 'Stone', bio: 'Marketing and communications senior. Digital advertising campaign manager.' },
  { username: 'wendyhamilton_demo', firstName: 'Wendy', lastName: 'Hamilton', bio: 'Biomedical engineering senior. Capstone: wearable sensor for cardiac monitoring.' },
  { username: 'williamford_demo', firstName: 'William', lastName: 'Ford', bio: 'CS senior focused on distributed systems. Docker, Kubernetes, and cloud-native dev.' },
  { username: 'xaviermeyer_demo', firstName: 'Xavier', lastName: 'Meyer', bio: 'Data science and economics double major. Building predictive models for real estate.' },
  { username: 'yasminenakamura_demo', firstName: 'Yasmine', lastName: 'Nakamura', bio: 'Japanese and linguistics double major. Computational linguistics research assistant.' },
  { username: 'zacharyevansholt_demo', firstName: 'Zachary', lastName: 'Evans', bio: 'CS junior. Backend systems, Go, and distributed databases.' },
  { username: 'zaraali_demo', firstName: 'Zara', lastName: 'Ali', bio: 'Public health senior. Thesis on maternal mortality disparities in urban hospitals.' },
  { username: 'zoeanderson_demo', firstName: 'Zoe', lastName: 'Anderson', bio: 'Computer science junior. AI safety reading group organizer. ML + alignment research.' },
].map(s => ({
  ...s,
  email: `${s.username}@example.com`,
  password: 'Demo@1234',
  settings: { activityVisibility: 'public' },
}));

const SEED_STRANGER_USERNAMES = SEED_STRANGERS.map(s => s.username);

// Jane's seed friends share usernames with Justin's strangers list.
// Exclude them from deletion so seed-jane data stays intact when seed-justin --clean runs.
const JANE_FRIEND_USERNAMES = [
  'carolinehall_demo', 'chrisnguyen_demo', 'connorflynn_demo', 'dianachen_demo', 'ethancooper_demo',
  'evawong_demo', 'graciecallahan_demo', 'isabellachang_demo', 'jadewashington_demo', 'jasonmendez_demo',
  'kevinzhang_demo', 'kiananderson_demo', 'logancarter_demo', 'michaelrobbins_demo', 'noahcoleman_demo',
  'rachelmontgomery_demo', 'ryanfoster_demo', 'taylormorgan_demo', 'trevornash_demo', 'zoeanderson_demo',
];

// ─── Clean Function ─────────────────────────────────────────────────────────

async function cleanSeedData(justinId) {
  console.log('Cleaning seed data...');

  // Find ALL seed users by flag — works regardless of current username, handling
  // migration from old usernames (e.g. 'sofiarod' → 'sofiarod_demo').
  // Exclude Justin and Jane's friends (identified by their stable emails).
  const janeFriendEmails = JANE_FRIEND_USERNAMES.map(u => `${u}@example.com`);
  const seedUsers = await User.find({
    isSeedUser: true,
    _id: { $ne: justinId },
    email: { $nin: janeFriendEmails },
  });
  const seedIds = seedUsers.map(u => u._id);
  const allIds = [justinId, ...seedIds];

  // Delete all seed-related data
  await Note.deleteMany({ userId: { $in: allIds } });
  await FlashcardSet.deleteMany({ userId: { $in: allIds } });
  await Flashcard.deleteMany({
    setId: { $in: (await FlashcardSet.find({ userId: { $in: allIds } }).select('_id')).map(s => s._id) },
  }).catch(() => {}); // sets already deleted, flashcards may be orphaned
  // Clean orphaned flashcards by looking for sets that no longer exist
  const existingSetIds = (await FlashcardSet.find().select('_id')).map(s => s._id);
  if (existingSetIds.length === 0) {
    await Flashcard.deleteMany({});
  }
  await StudySession.deleteMany({ userId: { $in: allIds } });
  await Task.deleteMany({ userId: justinId });
  // Delete all friend-owned tasks where Justin is a participant.
  // Targeting by participant covers orphans from prior seed runs where friend
  // users were recreated with new _ids — seedIds only holds current users.
  await Task.deleteMany({ 'participants.userId': justinId, userId: { $ne: justinId } });
  await Application.deleteMany({ userId: justinId });
  await Comment.deleteMany({ userId: { $in: allIds } });
  await Activity.deleteMany({ userId: { $in: allIds } });
  await Message.deleteMany({ senderId: { $in: allIds } });
  await Conversation.deleteMany({ participants: { $in: allIds } });
  await Friendship.deleteMany({
    $or: [
      { user1: { $in: allIds } },
      { user2: { $in: allIds } },
    ],
  });

  // Delete the seed friend and stranger users (not Justin, not Jane's friends)
  await User.deleteMany({ _id: { $in: seedIds } });

  console.log('Clean complete.');
}

// ─── SECTION 1: Seed Users ──────────────────────────────────────────────────

async function seedFriends() {
  console.log('Seeding friend users...');
  const friends = [];

  for (const data of SEED_FRIENDS) {
    let user = await User.findOne({ $or: [{ username: data.username }, { email: data.email }] });
    if (!user) {
      user = new User({ ...data, isSeedUser: true });
      await user.save();
      console.log(`  Created user: ${data.username}`);
    } else {
      if (user.username !== data.username) {
        user.username = data.username;
        await user.save();
      }
      console.log(`  User exists: ${data.username}`);
    }
    friends.push(user);
  }

  return friends;
}

// ─── SECTION 1b: Stranger Users (searchable, not friends with Justin) ────────

async function seedStrangers() {
  console.log('Seeding stranger users...');
  let created = 0;

  for (const data of SEED_STRANGERS) {
    const existing = await User.findOne({ $or: [{ username: data.username }, { email: data.email }] });
    if (!existing) {
      await new User({ ...data, isSeedUser: true }).save();
      created++;
    } else if (existing.username !== data.username) {
      existing.username = data.username;
      await existing.save();
    }
  }

  console.log(`  ${created} stranger users created (${SEED_STRANGERS.length - created} already existed).`);
}

// ─── SECTION 2: Friendships ─────────────────────────────────────────────────

async function seedFriendships(justin, friends) {
  console.log('Seeding friendships...');

  // Justin <-> each friend
  for (const friend of friends) {
    const existing = await Friendship.findOne({
      $or: [
        { user1: justin._id, user2: friend._id },
        { user1: friend._id, user2: justin._id },
      ],
    });
    if (!existing) {
      const f = new Friendship({
        user1: justin._id,
        user2: friend._id,
        requestedBy: justin._id,
        status: 'accepted',
        requestedAt: new Date('2026-01-21'),
        respondedAt: new Date('2026-01-22'),
      });
      await f.save();
    }
  }

  // Inter-friend friendships
  const friendMap = {};
  for (const f of friends) {
    friendMap[f.username] = f;
  }

  const interFriendPairs = [
    ['alexchen_cs', 'mayapatel_ds'],
    ['alexchen_cs', 'jordanwilliams_demo'],
    ['mayapatel_ds', 'priyasharma_demo'],
    ['marcusjohnson_demo', 'sofiarod_demo'],
    ['jordanwilliams_demo', 'marcusjohnson_demo'],
  ];

  for (const [u1, u2] of interFriendPairs) {
    const f1 = friendMap[u1];
    const f2 = friendMap[u2];
    const existing = await Friendship.findOne({
      $or: [
        { user1: f1._id, user2: f2._id },
        { user1: f2._id, user2: f1._id },
      ],
    });
    if (!existing) {
      const f = new Friendship({
        user1: f1._id,
        user2: f2._id,
        requestedBy: f1._id,
        status: 'accepted',
        requestedAt: new Date('2026-01-23'),
        respondedAt: new Date('2026-01-24'),
      });
      await f.save();
    }
  }

  console.log('  Friendships created.');
}

// ─── SECTION 3: Justin's Notes ──────────────────────────────────────────────

async function seedJustinNotes(justin, friends) {
  console.log('Seeding Justin\'s notes...');
  const allFriendIds = friends.map(f => f._id);
  const notes = [];

  // Date spread: lecture/research (0-9) across Jan 20 - Mar 15
  //              general (10-14) across Feb 1 - Mar 10
  //              todo (15-19) across Mar 1 - Apr 5
  //              journal (20-24) across Feb 9 - Apr 26
  const dateMap = [
    '2026-01-22', '2026-01-28', '2026-02-03', '2026-02-08', '2026-02-14', // 0-4
    '2026-02-19', '2026-02-25', '2026-03-02', '2026-03-07', '2026-03-12', // 5-9
    '2026-02-01', '2026-02-06', '2026-02-11', '2026-02-16', '2026-02-21', // 10-14
    '2026-03-01', '2026-03-05', '2026-03-08', '2026-03-16', '2026-03-20', // 15-19
    '2026-02-09', '2026-03-01', '2026-03-15', '2026-04-05', '2026-04-26', // 20-24
  ];

  // Notes with hasFlashcards = true: indices 0-5, 7-9 (not 6 originally, but spec says 0-5 and 7-9)
  const hasFlashcardsIndices = [0, 1, 2, 3, 4, 5, 7, 8, 9];
  // Notes indices 1 and 2 have visibility 'specific' with all friends
  const specificIndices = [1, 2];

  for (let i = 0; i < seedData.justinNotes.length; i++) {
    const noteData = seedData.justinNotes[i];
    const sharedWith = specificIndices.includes(i) ? allFriendIds : [];

    const note = await Note.create({
      userId: justin._id,
      title: noteData.title,
      content: noteData.content,
      contentType: noteData.contentType || 'html',
      type: noteData.type,
      tags: noteData.tags,
      subject: noteData.subject,
      visibility: noteData.visibility,
      sharedWith,
      isPinned: noteData.isPinned,
      hasFlashcards: hasFlashcardsIndices.includes(i),
    });

    // Update createdAt
    await Note.updateOne({ _id: note._id }, { createdAt: new Date(dateMap[i]) });

    // AI summaries for notes 0-9
    if (i < 10) {
      let summary;
      if (!NO_AI) {
        try {
          await new Promise(r => setTimeout(r, 500));
          const result = await generateSummary(noteData.content, justin._id);
          summary = {
            quickSummary: result.quickSummary,
            detailedSummary: result.detailedSummary,
            generatedAt: new Date(),
            model: result.model,
            tokenCount: result.tokenCount,
          };
        } catch (err) {
          console.log(`  AI summary failed for note ${i}, using fallback: ${err.message}`);
          summary = null;
        }
      }
      if (!summary) {
        const fb = seedData.noteSummaryFallbacks[i];
        summary = {
          quickSummary: fb.quickSummary,
          detailedSummary: fb.detailedSummary,
          generatedAt: new Date(),
          model: 'fallback',
          tokenCount: 0,
        };
      }
      await Note.updateOne({ _id: note._id }, { summary });
    }

    notes.push(note);
    console.log(`  Note ${i}: ${noteData.title}`);
  }

  return notes;
}

// ─── SECTION 4: Friends' Notes ──────────────────────────────────────────────

async function seedFriendNotes(friends) {
  console.log('Seeding friend notes...');
  const friendNoteMap = {}; // username -> [noteDoc]

  const friendDateStart = new Date('2026-02-01');

  for (const friend of friends) {
    const notesData = seedData.friendNotes[friend.username];
    if (!notesData) continue;

    friendNoteMap[friend.username] = [];

    for (let i = 0; i < notesData.length; i++) {
      const nd = notesData[i];
      const note = await Note.create({
        userId: friend._id,
        title: nd.title,
        content: nd.content,
        contentType: nd.contentType || 'html',
        type: 'general',
        tags: nd.tags,
        subject: nd.subject || '',
        visibility: 'friends',
        isPinned: false,
      });

      // Spread dates: each friend's notes over Feb-Mar
      const dayOffset = i * 7 + friends.indexOf(friend) * 3;
      const noteDate = new Date(friendDateStart);
      noteDate.setDate(noteDate.getDate() + dayOffset);
      await Note.updateOne({ _id: note._id }, { createdAt: noteDate });

      friendNoteMap[friend.username].push(note);
    }
    console.log(`  ${friend.username}: ${notesData.length} notes`);
  }

  return friendNoteMap;
}

// ─── SECTION 5: Justin's Flashcard Sets ─────────────────────────────────────

async function seedJustinFlashcardSets(justin, justinNotes) {
  console.log('Seeding Justin\'s flashcard sets...');
  const allSets = [];

  // AI-generated sets (10) — linked to notes
  const aiSetDefs = [
    { title: 'Dynamic Programming Concepts', noteIndex: 0, visibility: 'friends' },
    { title: 'OS Scheduling Algorithms', noteIndex: 1, visibility: 'friends' },
    { title: 'Neural Network Key Terms', noteIndex: 5, visibility: 'friends' },
    { title: 'Distributed Systems Vocab', noteIndex: 6, visibility: 'friends' },
    { title: 'TCP/IP and Networking', noteIndex: 2, visibility: 'friends' },
    { title: 'Database Systems Review', noteIndex: 3, visibility: 'friends' },
    { title: 'Cryptography Basics', noteIndex: 7, visibility: 'friends' },
    { title: 'Graph Algorithm Vocab', noteIndex: 9, visibility: 'friends' },
    { title: 'Compiler Terminology', noteIndex: 4, visibility: 'private' },
    { title: 'Quantum Computing Intro Terms', noteIndex: 8, visibility: 'friends' },
  ];

  for (let i = 0; i < aiSetDefs.length; i++) {
    const def = aiSetDefs[i];
    const sourceNote = justinNotes[def.noteIndex];

    let cards;
    if (!NO_AI) {
      try {
        await new Promise(r => setTimeout(r, 500));
        const result = await generateFlashcards(sourceNote.content || seedData.justinNotes[def.noteIndex].content, justin._id);
        cards = result.cards;
      } catch (err) {
        console.log(`  AI flashcards failed for set ${i}, using fallback: ${err.message}`);
        cards = null;
      }
    }
    if (!cards) {
      cards = seedData.flashcardFallbacks[i];
    }

    const set = await FlashcardSet.create({
      userId: justin._id,
      noteId: sourceNote._id,
      title: def.title,
      description: `AI-generated flashcards from "${seedData.justinNotes[def.noteIndex].title}"`,
      totalCards: cards.length,
      visibility: def.visibility,
      isAIGenerated: true,
      generatedAt: new Date(),
      studySessionCount: Math.floor(Math.random() * 5) + 1,
      lastStudiedAt: new Date('2026-03-10'),
    });

    for (let j = 0; j < cards.length; j++) {
      await Flashcard.create({
        setId: set._id,
        front: cards[j].front,
        back: cards[j].back,
        order: j,
      });
    }

    // Update source note hasFlashcards
    await Note.updateOne({ _id: sourceNote._id }, { hasFlashcards: true });

    allSets.push(set);
    console.log(`  AI Set ${i}: ${def.title} (${cards.length} cards)`);
  }

  // Manual sets (10) — no linked note
  for (let i = 0; i < seedData.manualFlashcardSets.length; i++) {
    const ms = seedData.manualFlashcardSets[i];

    const set = await FlashcardSet.create({
      userId: justin._id,
      noteId: null,
      title: ms.title,
      description: ms.description,
      totalCards: ms.cards.length,
      visibility: ms.visibility,
      isAIGenerated: false,
      studySessionCount: Math.floor(Math.random() * 3),
      lastStudiedAt: new Date('2026-03-08'),
    });

    for (let j = 0; j < ms.cards.length; j++) {
      await Flashcard.create({
        setId: set._id,
        front: ms.cards[j].front,
        back: ms.cards[j].back,
        order: j,
      });
    }

    allSets.push(set);
    console.log(`  Manual Set ${i + 10}: ${ms.title} (${ms.cards.length} cards)`);
  }

  return allSets;
}

// ─── SECTION 6: Friends' Flashcard Sets ─────────────────────────────────────

async function seedFriendFlashcardSets(friends) {
  console.log('Seeding friend flashcard sets...');
  const friendSetMap = {}; // username -> [setDoc]

  for (const friend of friends) {
    const setsData = seedData.friendFlashcardSets[friend.username];
    if (!setsData) continue;

    friendSetMap[friend.username] = [];

    for (let i = 0; i < setsData.length; i++) {
      const sd = setsData[i];
      const set = await FlashcardSet.create({
        userId: friend._id,
        noteId: null,
        title: sd.title,
        description: sd.description || `${friend.firstName}'s ${sd.title} flashcard set`,
        totalCards: sd.cards.length,
        visibility: 'friends',
        isAIGenerated: false,
        studySessionCount: Math.floor(Math.random() * 4) + 1,
        lastStudiedAt: new Date('2026-03-05'),
      });

      for (let j = 0; j < sd.cards.length; j++) {
        await Flashcard.create({
          setId: set._id,
          front: sd.cards[j].front,
          back: sd.cards[j].back,
          order: j,
        });
      }

      friendSetMap[friend.username].push(set);
    }
    console.log(`  ${friend.username}: ${setsData.length} sets`);
  }

  return friendSetMap;
}

// ─── SECTION 7: Tasks ───────────────────────────────────────────────────────

async function seedTasks(justin, friends) {
  console.log('Seeding tasks...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  const allTasks = [
    // homework (8)
    { title: 'Submit Assignment 1: Big-O Analysis', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-01-28', duration: 120, description: 'Analyze time/space complexity of 5 algorithms. Submit on Gradescope.' },
    { title: 'Submit Assignment 2: Linked List Implementation', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-02-10', duration: 180, description: 'Implement singly and doubly linked lists in Java with iterator support.' },
    { title: 'Submit Assignment 3: Red-Black Trees', type: 'homework', status: 'completed', priority: 'high', dueDate: '2026-02-24', duration: 240, description: 'Implement insert and delete for red-black trees. Include balancing rotations.' },
    { title: 'Submit Assignment 4: DP Coin Change', type: 'homework', status: 'in_progress', priority: 'high', dueDate: '2026-03-20', duration: 180, description: 'Solve coin change with memoization and tabulation. Compare approaches.' },
    { title: 'Implement Graph Traversal BFS/DFS', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-03-27', duration: 120, description: 'Implement BFS and DFS on adjacency list. Include cycle detection.' },
    { title: 'Write Compiler Lexer in Java', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-04-03', duration: 180, description: 'Build a lexer for a subset of C. Tokenize keywords, operators, literals.' },
    { title: 'SQL Query Optimization Lab', type: 'homework', status: 'todo', priority: 'medium', dueDate: '2026-04-10', duration: 120, description: 'Analyze query execution plans. Add indexes to improve 5 slow queries.' },
    { title: 'Final Project Report Draft', type: 'homework', status: 'todo', priority: 'high', dueDate: '2026-04-17', duration: 300, description: 'Write 10-page report on distributed KV store architecture and benchmarks.' },
    // study (8)
    { title: 'Study for OS Midterm', type: 'study', status: 'completed', priority: 'high', dueDate: '2026-02-20', duration: 240, description: 'Review process scheduling, memory management, and synchronization.' },
    { title: 'Review Data Structures for Midterm', type: 'study', status: 'completed', priority: 'high', dueDate: '2026-02-18', duration: 240, description: 'Trees, heaps, hash tables, graphs. Practice problems from textbook Ch 4-8.' },
    { title: 'Flashcard Review: DP Concepts', type: 'study', status: 'completed', priority: 'medium', dueDate: '2026-03-05', duration: 60, description: 'Run through DP flashcard set. Focus on optimal substructure and overlapping subproblems.' },
    { title: 'Study for Networks Quiz', type: 'study', status: 'in_progress', priority: 'high', dueDate: '2026-03-19', duration: 120, description: 'TCP handshake, congestion control, HTTP/2 vs HTTP/3.' },
    { title: 'Compilers Midterm Prep', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-03-26', duration: 240, description: 'Lexing, parsing (LL/LR), AST construction, type checking.' },
    { title: 'Database Final Exam Study Session', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-04-09', duration: 300, description: 'Normalization, transactions, ACID, concurrency control, query optimization.' },
    { title: 'Algorithm Final Review', type: 'study', status: 'todo', priority: 'high', dueDate: '2026-04-14', duration: 300, description: 'DP, greedy, graph algorithms, NP-completeness, amortized analysis.' },
    { title: 'Systems Design Interview Prep', type: 'study', status: 'todo', priority: 'medium', dueDate: '2026-04-20', duration: 180, description: 'Practice designing URL shortener, chat system, and news feed.' },
    // project (7)
    { title: 'Final Project: Distributed Key-Value Store', type: 'project', status: 'in_progress', priority: 'high', dueDate: '2026-04-25', duration: 600, description: 'Raft consensus, consistent hashing, gRPC communication layer.' },
    { title: 'Build REST API with Express', type: 'project', status: 'completed', priority: 'medium', dueDate: '2026-02-07', duration: 300, description: 'CRUD endpoints for notes and tasks. JWT auth middleware.' },
    { title: 'Design Database Schema for Group Project', type: 'project', status: 'completed', priority: 'high', dueDate: '2026-02-28', duration: 180, description: 'ER diagram, collection design, index strategy for KV store metadata.' },
    { title: 'Implement Authentication Module', type: 'project', status: 'completed', priority: 'high', dueDate: '2026-03-07', duration: 240, description: 'JWT tokens, refresh flow, password hashing, rate limiting.' },
    { title: 'Write Unit Tests for KV Store', type: 'project', status: 'todo', priority: 'medium', dueDate: '2026-04-11', duration: 180, description: 'Jest test suite for put/get/delete operations. Mock Raft consensus.' },
    { title: 'Deploy Project to Heroku', type: 'project', status: 'todo', priority: 'low', dueDate: '2026-04-22', duration: 120, description: 'Dockerize, set up CI/CD pipeline, configure environment variables.' },
    { title: 'Record Project Demo Video', type: 'project', status: 'todo', priority: 'medium', dueDate: '2026-04-28', duration: 120, description: '5-minute walkthrough of architecture, live demo of key operations.' },
    // exam (6)
    { title: 'CS 211 Data Structures Midterm', type: 'exam', status: 'completed', priority: 'high', dueDate: '2026-02-19', duration: 120, description: 'Covers arrays through balanced BSTs. 2 hours, closed book.' },
    { title: 'CS 301 Operating Systems Midterm', type: 'exam', status: 'completed', priority: 'high', dueDate: '2026-02-26', duration: 120, description: 'Processes, threads, scheduling, deadlocks. Open note.' },
    { title: 'CS 350 Networks Quiz', type: 'exam', status: 'completed', priority: 'medium', dueDate: '2026-03-05', duration: 45, description: 'Application and transport layer protocols. 45 minutes.' },
    { title: 'CS 211 Data Structures Final', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-16', duration: 120, description: 'Comprehensive. DP, graphs, NP-completeness added.' },
    { title: 'CS 301 OS Final Exam', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-23', duration: 120, description: 'Full semester. File systems and security added to midterm topics.' },
    { title: 'CS 320 Compilers Final', type: 'exam', status: 'todo', priority: 'high', dueDate: '2026-04-21', duration: 120, description: 'Lexing through code generation. Includes optimization passes.' },
    // club (5)
    { title: 'ACM Weekly Meeting: Feb 5', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-02-05', duration: 60, description: 'Guest speaker on open source contributions.' },
    { title: 'ACM Weekly Meeting: Feb 19', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-02-19', duration: 60, description: 'LeetCode contest practice session.' },
    { title: 'HackIllinois Prep Session', type: 'club', status: 'completed', priority: 'medium', dueDate: '2026-03-01', duration: 120, description: 'Form teams, brainstorm project ideas, set up dev environments.' },
    { title: 'ACM Weekly Meeting: Mar 5', type: 'club', status: 'completed', priority: 'low', dueDate: '2026-03-05', duration: 60, description: 'Mock interview workshop with industry mentors.' },
    { title: 'ACM Spring Hackathon', type: 'club', status: 'todo', priority: 'medium', dueDate: '2026-04-12', duration: 1440, description: '24-hour hackathon. Theme: developer tools.' },
    // professional (7)
    { title: 'Update LinkedIn Profile', type: 'professional', status: 'completed', priority: 'medium', dueDate: '2026-01-25', duration: 60, description: 'Add fall semester projects, update skills section.' },
    { title: 'Tailor Resume for Google Application', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-01-30', duration: 90, description: 'Highlight distributed systems coursework and API project.' },
    { title: 'Submit Google SWE Intern Application', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-02-01', duration: 60, description: 'Applied via careers.google.com. Referral from ACM alum.' },
    { title: 'Prep for Stripe Technical Screen', type: 'professional', status: 'completed', priority: 'high', dueDate: '2026-02-15', duration: 180, description: 'Practice API design questions, payments domain knowledge.' },
    { title: 'Send Thank You to Google Recruiter', type: 'professional', status: 'completed', priority: 'medium', dueDate: '2026-03-03', duration: 15, description: 'Email Sarah Kim after the technical screen.' },
    { title: 'Research Companies for Fall Recruiting', type: 'professional', status: 'todo', priority: 'low', dueDate: '2026-04-05', duration: 120, description: 'Make list of companies with fall 2026 new grad openings.' },
    { title: 'Finalize Internship Decision', type: 'professional', status: 'todo', priority: 'high', dueDate: '2026-04-15', duration: 60, description: 'Compare Stripe, HubSpot, Shopify offers. Deadline Apr 15.' },
    // personal (5)
    { title: 'Buy Algorithm Design textbook', type: 'personal', status: 'completed', priority: 'medium', dueDate: '2026-01-22', duration: 30, description: 'Kleinberg & Tardos, 2nd edition. Check campus bookstore first.' },
    { title: 'Set up development environment', type: 'personal', status: 'completed', priority: 'high', dueDate: '2026-01-21', duration: 120, description: 'Install Node 20, MongoDB, VS Code extensions, configure ESLint.' },
    { title: 'Schedule advisor meeting', type: 'personal', status: 'completed', priority: 'medium', dueDate: '2026-02-03', duration: 30, description: 'Discuss fall course selection and research opportunities.' },
    { title: 'Register for Fall 2026 classes', type: 'personal', status: 'todo', priority: 'high', dueDate: '2026-04-08', duration: 60, description: 'Priority: ML, Distributed Systems, Security. Backup: Graphics.' },
    { title: 'Buy new laptop charger', type: 'personal', status: 'todo', priority: 'low', dueDate: '2026-03-30', duration: 15, description: 'MacBook Pro USB-C charger. Check Amazon vs Apple Store.' },
    // other (6)
    { title: 'Watch MIT OCW: Advanced Algorithms Lecture 5', type: 'other', status: 'completed', priority: 'low', dueDate: '2026-02-08', duration: 90, description: 'Amortized analysis and Fibonacci heaps.' },
    { title: 'Read "Designing Data-Intensive Applications" Ch 1-2', type: 'other', status: 'completed', priority: 'medium', dueDate: '2026-02-22', duration: 120, description: 'Foundations of data systems, data models and query languages.' },
    { title: 'Write blog post: What I Learned from My First LeetCode 150', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-04-03', duration: 120, description: 'Reflect on patterns, time management, and growth mindset.' },
    { title: 'Explore Rust for Systems Programming', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-04-07', duration: 180, description: 'Work through Rust Book chapters 1-4. Build a CLI tool.' },
    { title: 'Set up personal portfolio website', type: 'other', status: 'in_progress', priority: 'medium', dueDate: '2026-04-20', duration: 300, description: 'Next.js + Tailwind. Deploy on Vercel. Showcase 3 projects.' },
    { title: 'Read "Clean Code" Ch 3-5', type: 'other', status: 'todo', priority: 'low', dueDate: '2026-03-28', duration: 90, description: 'Functions, comments, and formatting. Take notes.' },
  ];

  const createdTasks = [];
  for (const t of allTasks) {
    const task = await Task.create({
      userId: justin._id,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      dueDate: new Date(t.dueDate),
      duration: t.duration || 60,
      description: t.description,
    });
    createdTasks.push(task);
  }

  // ── Shared tasks: Justin → friends ────────────────────────────────────────
  const alexId    = friendMap.alexchen_cs._id;
  const mayaId    = friendMap.mayapatel_ds._id;
  const jordanId  = friendMap.jordanwilliams_demo._id;
  const priyaId   = friendMap.priyasharma_demo._id;
  const marcusId  = friendMap.marcusjohnson_demo._id;
  const sofiaId   = friendMap.sofiarod_demo._id;

  const sharedTaskDefs = [
    {
      title: 'Group Project: System Design Document',
      type: 'project', status: 'in_progress', priority: 'high',
      dueDate: '2026-04-04',
      description: 'Co-authored system design doc for distributed KV store. Covers architecture, data flow, and failure modes.',
      participants: [{ userId: alexId, status: 'in_progress' }],
    },
    {
      title: 'ACM Workshop: ML Demo Prep',
      type: 'project', status: 'todo', priority: 'medium',
      dueDate: '2026-04-08',
      description: 'Prepare the live ML demo for the ACM spring workshop. Justin handles backend pipeline, Maya handles model selection.',
      participants: [{ userId: mayaId, status: 'todo' }],
    },
    {
      title: 'Study Group: OS Final Exam',
      type: 'study', status: 'todo', priority: 'high',
      dueDate: '2026-04-18',
      description: 'Three-way study session for CS 301 OS final. Divide topics: Justin → scheduling, Jordan → memory, Alex → file systems.',
      participants: [{ userId: jordanId, status: 'todo' }, { userId: alexId, status: 'todo' }],
    },
    {
      title: 'MCAT Study Plan Review',
      type: 'study', status: 'in_progress', priority: 'high',
      dueDate: '2026-04-15',
      description: 'Help Priya map out a 10-week MCAT study schedule. Justin contributes a scheduling algorithm template.',
      participants: [{ userId: priyaId, status: 'in_progress' }],
    },
    {
      title: 'HackIllinois Project: Study Planner App',
      type: 'project', status: 'in_progress', priority: 'high',
      dueDate: '2026-04-13',
      description: '24h hackathon project. Justin handles API and backend, Alex handles frontend, Jordan handles hardware integration.',
      participants: [{ userId: alexId, status: 'in_progress' }, { userId: jordanId, status: 'todo' }],
    },
    {
      title: 'Investment Research: Fintech Sector Analysis',
      type: 'project', status: 'todo', priority: 'medium',
      dueDate: '2026-04-21',
      description: 'Collaborative deep dive into fintech valuations with Marcus. Justin provides data modeling, Marcus provides financial modeling.',
      participants: [{ userId: marcusId, status: 'todo' }],
    },
    {
      title: 'UX Research: Campus App Survey',
      type: 'project', status: 'todo', priority: 'low',
      dueDate: '2026-04-25',
      description: 'Sofia is running a UX research project. Justin is helping with the data analysis piece for her capstone.',
      participants: [{ userId: sofiaId, status: 'todo' }],
    },
  ];

  for (const td of sharedTaskDefs) {
    const task = await Task.create({
      userId: justin._id,
      title: td.title,
      type: td.type,
      status: td.status,
      priority: td.priority,
      dueDate: new Date(td.dueDate),
      description: td.description,
      isShared: true,
      participants: td.participants,
    });
    createdTasks.push(task);
  }

  // ── Shared tasks: friends → Justin (so Justin sees them in /tasks/shared) ─
  const incomingSharedTasks = [
    {
      ownerId: alexId,
      title: 'LeetCode Mock Contest: Graph Problems',
      type: 'study', status: 'todo', priority: 'medium',
      dueDate: '2026-04-06',
      description: 'Alex is running a mock contest prep session. Justin and Alex grind 3 medium/hard graph problems together.',
      participants: [{ userId: justin._id, status: 'todo' }],
    },
    {
      ownerId: mayaId,
      title: 'ML Research: Feature Engineering Deep Dive',
      type: 'study', status: 'in_progress', priority: 'high',
      dueDate: '2026-04-10',
      description: "Maya's research group session on feature engineering techniques. Justin joining to review sklearn pipelines.",
      participants: [{ userId: justin._id, status: 'in_progress' }],
    },
    {
      ownerId: jordanId,
      title: 'Embedded Systems Lab Report',
      type: 'homework', status: 'todo', priority: 'medium',
      dueDate: '2026-04-09',
      description: "Jordan's lab report on interrupt-driven I/O. Justin helping review the software side.",
      participants: [{ userId: justin._id, status: 'todo' }],
    },
    {
      ownerId: marcusId,
      title: 'Finance Club: Pitch Competition Prep',
      type: 'project', status: 'in_progress', priority: 'high',
      dueDate: '2026-04-12',
      description: 'Marcus is leading the pitch for finance club. Justin helping structure the data slides.',
      participants: [{ userId: justin._id, status: 'todo' }],
    },
  ];

  for (const td of incomingSharedTasks) {
    const task = await Task.create({
      userId: td.ownerId,
      title: td.title,
      type: td.type,
      status: td.status,
      priority: td.priority,
      dueDate: new Date(td.dueDate),
      description: td.description,
      isShared: true,
      participants: td.participants,
    });
    createdTasks.push(task);
  }

  console.log(`  Created ${createdTasks.length} tasks (${sharedTaskDefs.length + incomingSharedTasks.length} shared).`);
  return createdTasks;
}

// ─── SECTION 8: Applications ────────────────────────────────────────────────

async function seedApplications(justin) {
  console.log('Seeding applications...');

  const apps = [
    // draft (6)
    { company: 'Airbnb', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Need to tailor resume for marketplace/payments team.' },
    { company: 'Lyft', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Focus on distributed systems experience.' },
    { company: 'Twitter/X', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Research recent engineering blog posts.' },
    { company: 'Salesforce', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'draft', notes: 'Check if they have a cloud infrastructure team.' },
    { company: 'Adobe', position: 'Software Engineering Intern', location: 'San Jose, CA', status: 'draft', notes: 'Creative Cloud or Document Cloud team preferred.' },
    { company: 'Robinhood', position: 'Software Engineering Intern', location: 'Menlo Park, CA', status: 'draft', notes: 'Fintech angle — mention Marcus finance connection.' },
    // applied (8)
    { company: 'Meta', position: 'Software Engineering Intern', location: 'Menlo Park, CA', status: 'applied', appliedAt: '2026-02-02', notes: 'Applied to Infrastructure team. Heard back takes 2-4 weeks.' },
    { company: 'Microsoft', position: 'Software Engineering Intern', location: 'Redmond, WA', status: 'applied', appliedAt: '2026-02-05', notes: 'Applied to Azure team. Got auto-confirmation email.' },
    { company: 'Uber', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: '2026-02-10', notes: 'Referral from Jordan\'s roommate.' },
    { company: 'LinkedIn', position: 'Software Engineering Intern', location: 'Sunnyvale, CA', status: 'applied', appliedAt: '2026-02-12', notes: 'Applied via university portal.' },
    { company: 'Coinbase', position: 'Software Engineering Intern', location: 'Remote', status: 'applied', appliedAt: '2026-02-15', notes: 'Crypto/blockchain team. Mentioned distributed systems coursework.' },
    { company: 'DoorDash', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'applied', appliedAt: '2026-02-18', notes: 'Logistics/routing team.' },
    { company: 'Netflix', position: 'Software Engineering Intern', location: 'Los Gatos, CA', status: 'applied', appliedAt: '2026-02-20', notes: 'Streaming infrastructure team. Long shot but worth trying.' },
    { company: 'Palantir', position: 'Software Engineering Intern', location: 'New York, NY', status: 'applied', appliedAt: '2026-02-22', notes: 'Forward Deployed Engineer track.' },
    // interview (8)
    { company: 'Google', position: 'Software Engineering Intern', location: 'Mountain View, CA', status: 'interview', appliedAt: '2026-02-01', interviewDates: ['2026-02-20', '2026-03-10'], notes: 'Technical screen done. On-site loop scheduled Mar 10. Focus: coding + system design.', contacts: [{ name: 'Sarah Kim', role: 'University Recruiter', email: 'sarahkim@google.com', lastContactDate: new Date('2026-03-03'), notes: 'Very responsive. Sent prep materials.' }], followUpReminders: [{ date: new Date('2026-03-15'), description: 'Follow up on loop results', completed: false }] },
    { company: 'Apple', position: 'Software Engineering Intern', location: 'Cupertino, CA', status: 'interview', appliedAt: '2026-02-03', interviewDates: ['2026-02-25'], notes: 'First round phone screen completed. Waiting for next steps.', contacts: [{ name: 'David Park', role: 'Engineering Manager', email: 'dpark@apple.com', lastContactDate: new Date('2026-02-25'), notes: 'Interviewed me for the WebKit team.' }], followUpReminders: [{ date: new Date('2026-03-05'), description: 'Check in about next round', completed: false }] },
    { company: 'Nvidia', position: 'Software Engineering Intern', location: 'Santa Clara, CA', status: 'interview', appliedAt: '2026-02-08', interviewDates: ['2026-03-01'], notes: 'Technical screen focused on GPU programming concepts.', contacts: [{ name: 'Lisa Chen', role: 'Technical Recruiter', lastContactDate: new Date('2026-03-01'), notes: 'Said results in 1-2 weeks.' }], followUpReminders: [{ date: new Date('2026-03-14'), description: 'Follow up on screen results', completed: false }] },
    { company: 'Jane Street', position: 'Quantitative Developer Intern', location: 'New York, NY', status: 'interview', appliedAt: '2026-01-28', interviewDates: ['2026-02-15'], notes: 'OA completed. Heavy on math and probability.', contacts: [], followUpReminders: [] },
    { company: 'Two Sigma', position: 'Software Engineering Intern', location: 'New York, NY', status: 'interview', appliedAt: '2026-02-01', interviewDates: ['2026-02-22'], notes: 'First interview done. Systems design focus.', contacts: [{ name: 'Rachel Lee', role: 'Campus Recruiter', lastContactDate: new Date('2026-02-22'), notes: 'Mentioned second round in March.' }], followUpReminders: [{ date: new Date('2026-03-08'), description: 'Ask about second round scheduling', completed: false }] },
    { company: 'Figma', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'interview', appliedAt: '2026-02-05', interviewDates: ['2026-03-05'], notes: 'Design + coding round. Build a collaborative feature.', contacts: [], followUpReminders: [{ date: new Date('2026-03-12'), description: 'Follow up on round results', completed: false }] },
    { company: 'Notion', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'interview', appliedAt: '2026-02-07', interviewDates: ['2026-03-03'], notes: 'Values interview completed. Discussed productivity tooling passion.', contacts: [], followUpReminders: [{ date: new Date('2026-03-10'), description: 'Check for next steps', completed: false }] },
    { company: 'Vercel', position: 'Software Engineering Intern', location: 'Remote', status: 'interview', appliedAt: '2026-02-10', interviewDates: ['2026-03-06'], notes: 'Technical screen on Next.js and edge computing.', contacts: [], followUpReminders: [{ date: new Date('2026-03-13'), description: 'Follow up on technical screen', completed: false }] },
    // offer (4)
    { company: 'Stripe', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: '2026-01-25', interviewDates: ['2026-02-10', '2026-02-18'], offerReceivedAt: '2026-02-28', deadlineDate: '2026-04-15', salary: '$58/hr', notes: 'Payments infrastructure team. Best offer so far. 12-week program.', contacts: [{ name: 'Mike Thompson', role: 'Engineering Manager', email: 'mthompson@stripe.com', lastContactDate: new Date('2026-02-28'), notes: 'Sent offer letter. Very welcoming team.' }], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Make final decision before deadline', completed: false }] },
    { company: 'HubSpot', position: 'Software Engineering Intern', location: 'Cambridge, MA', status: 'offer', appliedAt: '2026-01-28', interviewDates: ['2026-02-12', '2026-02-20'], offerReceivedAt: '2026-03-05', deadlineDate: '2026-04-15', salary: '$50/hr', notes: 'CRM platform team. Good culture, hybrid work.', contacts: [{ name: 'Emily Watson', role: 'Recruiter', lastContactDate: new Date('2026-03-05'), notes: 'Sent benefits package details.' }], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Decide on offer', completed: false }] },
    { company: 'Shopify', position: 'Software Engineering Intern', location: 'Remote', status: 'offer', appliedAt: '2026-02-01', interviewDates: ['2026-02-18', '2026-02-28'], offerReceivedAt: '2026-03-10', salary: '$52/hr (CAD adjusted)', notes: 'Commerce platform. Fully remote. Good mentorship program.', contacts: [], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Respond to offer', completed: false }] },
    { company: 'Twilio', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'offer', appliedAt: '2026-02-03', interviewDates: ['2026-02-20', '2026-03-01'], offerReceivedAt: '2026-03-12', salary: '$48/hr', notes: 'Communications API team. Interesting product but lower comp.', contacts: [], followUpReminders: [{ date: new Date('2026-04-10'), description: 'Respond to offer', completed: false }] },
    // rejected (8)
    { company: 'Amazon', position: 'Software Engineering Intern', location: 'Seattle, WA', status: 'rejected', appliedAt: '2026-01-25', notes: 'OA score was borderline. Need more LC practice.' },
    { company: 'Goldman Sachs', position: 'Software Engineering Intern', location: 'New York, NY', status: 'rejected', appliedAt: '2026-01-27', notes: 'Rejected after HireVue. Finance questions caught me off guard.' },
    { company: 'Citadel', position: 'Software Engineering Intern', location: 'Chicago, IL', status: 'rejected', appliedAt: '2026-01-28', notes: 'Did not pass the OA. Need stronger math foundation.' },
    { company: 'Roblox', position: 'Software Engineering Intern', location: 'San Mateo, CA', status: 'rejected', appliedAt: '2026-02-01', notes: 'No response after 4 weeks. Assumed rejection.' },
    { company: 'ByteDance', position: 'Software Engineering Intern', location: 'San Jose, CA', status: 'rejected', appliedAt: '2026-02-03', notes: 'Rejected after phone screen. Interviewer focused heavily on system design.' },
    { company: 'Snap', position: 'Software Engineering Intern', location: 'Santa Monica, CA', status: 'rejected', appliedAt: '2026-02-05', notes: 'Form rejection email. Very competitive cycle.' },
    { company: 'Pinterest', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'rejected', appliedAt: '2026-02-08', notes: 'Position filled before my application was reviewed.' },
    { company: 'Datadog', position: 'Software Engineering Intern', location: 'New York, NY', status: 'rejected', appliedAt: '2026-02-10', notes: 'Made it to final round but did not receive offer.' },
    // withdrawn (6)
    { company: 'Zillow', position: 'Software Engineering Intern', location: 'Seattle, WA', status: 'withdrawn', appliedAt: '2026-01-30', notes: 'Withdrew after receiving Stripe offer. Did not want to continue process.' },
    { company: 'Dropbox', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-01', notes: 'Withdrew to reduce interview load.' },
    { company: 'Asana', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-03', notes: 'Timeline did not align with my schedule.' },
    { company: 'Box', position: 'Software Engineering Intern', location: 'Redwood City, CA', status: 'withdrawn', appliedAt: '2026-02-05', notes: 'Withdrew after getting enough active interviews.' },
    { company: 'Qualtrics', position: 'Software Engineering Intern', location: 'Provo, UT', status: 'withdrawn', appliedAt: '2026-02-08', notes: 'Location was not ideal. Withdrew early.' },
    { company: 'Okta', position: 'Software Engineering Intern', location: 'San Francisco, CA', status: 'withdrawn', appliedAt: '2026-02-10', notes: 'Withdrew to focus on top-choice companies.' },
  ];

  for (const a of apps) {
    const appData = {
      userId: justin._id,
      company: a.company,
      position: a.position,
      location: a.location,
      status: a.status,
      notes: a.notes,
    };
    if (a.appliedAt) appData.appliedAt = new Date(a.appliedAt);
    if (a.interviewDates) appData.interviewDates = a.interviewDates.map(d => new Date(d));
    if (a.offerReceivedAt) appData.offerReceivedAt = new Date(a.offerReceivedAt);
    if (a.deadlineDate) appData.deadlineDate = new Date(a.deadlineDate);
    if (a.salary) appData.salary = a.salary;
    if (a.contacts) appData.contacts = a.contacts;
    if (a.followUpReminders) appData.followUpReminders = a.followUpReminders;

    await Application.create(appData);
  }

  console.log(`  Created ${apps.length} applications.`);
}

// ─── SECTION 9: Conversations & Messages ────────────────────────────────────

async function seedConversations(justin, friends) {
  console.log('Seeding conversations...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;

  const convKeys = [
    { key: 'alex', username: 'alexchen_cs' },
    { key: 'maya', username: 'mayapatel_ds' },
    { key: 'jordan', username: 'jordanwilliams_demo' },
    { key: 'priya', username: 'priyasharma_demo' },
    { key: 'marcus', username: 'marcusjohnson_demo' },
    { key: 'sofia', username: 'sofiarod_demo' },
  ];

  for (const { key, username } of convKeys) {
    const friend = friendMap[username];
    const msgsData = seedData.conversations[key];
    if (!msgsData || !friend) continue;

    // Create conversation
    const conv = await Conversation.create({
      participants: [justin._id, friend._id],
      unreadCounts: [
        { userId: justin._id, count: 0 },
        { userId: friend._id, count: 0 },
      ],
    });

    // Create messages
    let lastMsg = null;
    for (const m of msgsData) {
      const senderId = m.sender === 'justin' ? justin._id : friend._id;
      const msgDate = new Date(m.date);

      const msg = await Message.create({
        conversationId: conv._id,
        senderId,
        content: m.content,
        readBy: [
          { userId: justin._id, readAt: msgDate },
          { userId: friend._id, readAt: msgDate },
        ],
      });

      // Set createdAt
      await Message.updateOne({ _id: msg._id }, { createdAt: msgDate });
      lastMsg = { senderId, content: m.content.slice(0, 200), sentAt: msgDate };
    }

    // Update conversation lastMessage
    if (lastMsg) {
      await Conversation.updateOne({ _id: conv._id }, { lastMessage: lastMsg });
    }

    console.log(`  ${key}: ${msgsData.length} messages`);
  }
}

// ─── SECTION 10: Comments & Likes ───────────────────────────────────────────

async function seedComments(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks) {
  console.log('Seeding comments...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;
  const allFriendIds = friends.map(f => f._id);

  const allComments = [];

  // Comments on Justin's shared notes
  for (const [noteIndexStr, comments] of Object.entries(seedData.justinNoteComments)) {
    const noteIndex = parseInt(noteIndexStr);
    const note = justinNotes[noteIndex];
    if (!note) continue;

    for (const c of comments) {
      const commenter = friendMap[c.username];
      if (!commenter) continue;

      const comment = await Comment.create({
        targetId: note._id,
        targetType: 'note',
        userId: commenter._id,
        content: c.content,
      });

      // Add 2-4 likes from random friends
      const likers = allFriendIds
        .filter(id => !id.equals(commenter._id))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2);
      await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });

      allComments.push(comment);
    }
  }

  // Justin's comments on friends' notes
  for (const [username, comments] of Object.entries(seedData.friendNoteComments)) {
    const friendNotesArr = friendNoteMap[username];
    if (!friendNotesArr) continue;

    for (const c of comments) {
      const note = friendNotesArr[c.noteIndex];
      if (!note) continue;

      const comment = await Comment.create({
        targetId: note._id,
        targetType: 'note',
        userId: justin._id,
        content: c.content,
      });

      // Add 2-3 likes
      const likers = allFriendIds
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 2) + 2);
      await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });

      allComments.push(comment);
    }
  }

  // Comments on flashcard sets
  for (const c of seedData.flashcardSetComments) {
    let targetSet;
    if (c.setOwner === 'justin') {
      targetSet = justinSets[c.setIndex];
    } else {
      const ownerSets = friendSetMap[c.setOwner];
      if (ownerSets) targetSet = ownerSets[c.setIndex];
    }
    if (!targetSet) continue;

    const commenter = c.username === 'justin' ? justin : friendMap[c.username];
    if (!commenter) continue;

    const commenterId = c.username === 'justin' ? justin._id : commenter._id;

    const comment = await Comment.create({
      targetId: targetSet._id,
      targetType: 'flashcardSet',
      userId: commenterId,
      content: c.content,
    });

    // Add 2-3 likes
    const possibleLikers = [justin._id, ...allFriendIds].filter(id => !id.equals(commenterId));
    const likers = possibleLikers
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 2);
    await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });

    allComments.push(comment);
  }

  // Comments on shared tasks (from participants + Justin)
  const sharedTasks = tasks.filter(t => t.isShared);
  const taskCommentPool = [
    "Making solid progress on this — let's sync before the due date.",
    "I added some notes to the shared doc. Check the third section.",
    "This is due sooner than I thought. Can we meet Tuesday evening?",
    "Just pushed my part. Needs review before we submit.",
    "Anyone want to do a quick 30-min call to divide the remaining work?",
    "I finished my section. Going to take another pass tonight.",
    "Looking great so far — I think we're ahead of schedule!",
    "Left some comments inline. Nothing major, just a few suggestions.",
    "Can we move the deadline back by two days? I have an exam Thursday.",
    "This is actually really interesting work — glad we teamed up.",
    "Let's use the library room Friday at 3pm to finish this up.",
    "I created a shared doc for the outline. Dropping the link in DM.",
  ];

  for (const task of sharedTasks.slice(0, 8)) {
    const participantIds = (task.participants || []).map(p => p.userId?.toString ? p.userId : p.userId);
    const allPossible = [justin._id, ...allFriendIds].filter(id =>
      id.toString() === task.userId.toString() || participantIds.some(p => p.toString() === id.toString())
    );
    const commentCount = Math.min(allPossible.length, Math.floor(Math.random() * 3) + 2);
    const shuffled = [...allPossible].sort(() => Math.random() - 0.5).slice(0, commentCount);

    for (const commenterId of shuffled) {
      const text = taskCommentPool[Math.floor(Math.random() * taskCommentPool.length)];
      const comment = await Comment.create({
        targetId: task._id,
        targetType: 'task',
        userId: commenterId,
        content: text,
      });
      const likers = allPossible.filter(id => !id.equals(commenterId)).slice(0, 2);
      if (likers.length > 0) {
        await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });
      }
      allComments.push(comment);
    }
  }

  console.log(`  Created ${allComments.length} comments with likes (including task comments).`);
  return allComments;
}

// ─── SECTION 10a: Replies ────────────────────────────────────────────────────

async function seedReplies(justin, friends, justinNotes, justinSets, friendSetMap, topLevelComments) {
  console.log('Seeding comment replies...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;
  const allIds = [justin._id, ...friends.map(f => f._id)];

  const resolveUser = (username) => username === 'justin' ? justin : friendMap[username];

  // Build lookup: `${targetId}:${userId}` → Comment _id
  const commentLookup = new Map();
  for (const c of topLevelComments) {
    const key = `${c.targetId.toString()}:${c.userId.toString()}`;
    if (!commentLookup.has(key)) commentLookup.set(key, c._id);
  }

  let count = 0;

  // Replies on Justin's shared notes
  for (const r of seedData.noteCommentReplies) {
    const note = justinNotes[r.noteIndex];
    if (!note) continue;
    const commenter = resolveUser(r.commenterUsername);
    if (!commenter) continue;
    const replier = resolveUser(r.replierUsername);
    if (!replier) continue;

    const key = `${note._id.toString()}:${commenter._id.toString()}`;
    const parentId = commentLookup.get(key);
    if (!parentId) continue;

    const reply = await Comment.create({
      targetId: note._id,
      targetType: 'note',
      userId: replier._id,
      content: r.content,
      parentId,
    });

    const likers = allIds
      .filter(id => !id.equals(replier._id))
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 1);
    if (likers.length > 0) {
      await Comment.updateOne({ _id: reply._id }, { $push: { likes: { $each: likers } } });
    }
    count++;
  }

  // Replies on flashcard set comments
  for (const r of seedData.flashcardSetCommentReplies) {
    let targetSet;
    if (r.setOwner === 'justin') {
      targetSet = justinSets[r.setIndex];
    } else {
      const ownerSets = friendSetMap[r.setOwner];
      if (ownerSets) targetSet = ownerSets[r.setIndex];
    }
    if (!targetSet) continue;

    const commenter = resolveUser(r.commenterUsername);
    if (!commenter) continue;
    const replier = resolveUser(r.replierUsername);
    if (!replier) continue;

    const key = `${targetSet._id.toString()}:${commenter._id.toString()}`;
    const parentId = commentLookup.get(key);
    if (!parentId) continue;

    const reply = await Comment.create({
      targetId: targetSet._id,
      targetType: 'flashcardSet',
      userId: replier._id,
      content: r.content,
      parentId,
    });

    const likers = allIds
      .filter(id => !id.equals(replier._id))
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 1);
    if (likers.length > 0) {
      await Comment.updateOne({ _id: reply._id }, { $push: { likes: { $each: likers } } });
    }
    count++;
  }

  console.log(`  Created ${count} replies.`);
}

// ─── SECTION 10b: Extra Comments — ensures every visible piece of content ────
// has at least some engagement (comments from Justin and/or friends)

async function seedExtraComments(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks) {
  console.log('Seeding extra comments on all visible content...');
  const friendMap = {};
  for (const f of friends) friendMap[f.username] = f;
  const allFriendIds = friends.map(f => f._id);
  let count = 0;

  const noteCommentBank = [
    'These notes are incredibly well-organized. Bookmarking for the final.',
    'This is exactly what I needed before the midterm. Thanks for sharing!',
    'The diagrams here really help visualize the concepts.',
    'I was confused about this topic but this cleared it up.',
    'Great breakdown. The examples make it easy to follow.',
    'Really solid notes. The summary at the top is super helpful.',
    'This is going to save me so much time during review week.',
    "Can you share the slides too? I'd love to cross-reference.",
    'Loved how you structured the problem-solving section.',
    'This is better than the textbook honestly.',
    'The step-by-step walkthrough here is really clear.',
    'I added this to my study list. Really helpful overview.',
  ];

  const setCommentBank = [
    'This set is perfect for last-minute review before the exam.',
    'The cards are concise and actually memorable. Nice work.',
    'I ran through this three times. Feeling much more confident now.',
    'Would it be possible to add a few more cards on the edge cases?',
    "Best flashcard set I've seen for this topic. Sharing with my study group.",
    'The front/back format here is really well balanced.',
    'Going to use this for the final exam prep sprint.',
    'I got 100% on the quiz after studying these. Legend.',
    'Super clean set. No filler, just the key concepts.',
    'Could you add pronunciation guides on a few of these?',
  ];

  // All Justin's shared notes: friends comment, Justin may respond
  const justinSharedNotes = justinNotes.filter(n => n.visibility === 'friends' || n.visibility === 'specific');
  for (const note of justinSharedNotes) {
    const existingCount = await Comment.countDocuments({ targetId: note._id, targetType: 'note' });
    if (existingCount >= 2) continue; // already has comments from main seedComments

    // 2-3 random friends comment
    const commenters = [...allFriendIds].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 2);
    for (const cId of commenters) {
      const text = noteCommentBank[Math.floor(Math.random() * noteCommentBank.length)];
      const comment = await Comment.create({ targetId: note._id, targetType: 'note', userId: cId, content: text });
      const likers = allFriendIds.filter(id => !id.equals(cId)).slice(0, 2);
      if (likers.length) await Comment.updateOne({ _id: comment._id }, { $push: { likes: { $each: likers } } });
      count++;
    }

    // Justin responds to at least 1
    const justinText = noteCommentBank[Math.floor(Math.random() * noteCommentBank.length)];
    const justinReply = await Comment.create({ targetId: note._id, targetType: 'note', userId: justin._id, content: `Thanks! ${justinText.toLowerCase()}` });
    const replyLikers = allFriendIds.slice(0, 2);
    if (replyLikers.length) await Comment.updateOne({ _id: justinReply._id }, { $push: { likes: { $each: replyLikers } } });
    count++;
  }

  // All friends' notes: Justin comments on each
  for (const [username, fNotes] of Object.entries(friendNoteMap)) {
    const friend = Object.values(friendNoteMap).length ? friends.find(f => f.username === username) : null;
    for (const note of fNotes) {
      const existing = await Comment.countDocuments({ targetId: note._id, targetType: 'note', userId: justin._id });
      if (existing > 0) continue;
      const text = noteCommentBank[Math.floor(Math.random() * noteCommentBank.length)];
      const c = await Comment.create({ targetId: note._id, targetType: 'note', userId: justin._id, content: text });
      // 1-3 random friends like Justin's comment
      const likers = [...allFriendIds].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
      if (likers.length) await Comment.updateOne({ _id: c._id }, { $push: { likes: { $each: likers } } });
      count++;
    }
  }

  // All shared flashcard sets (Justin's): friends comment
  const sharedJustinSets = justinSets.filter(s => s.visibility !== 'private');
  for (const set of sharedJustinSets) {
    const existing = await Comment.countDocuments({ targetId: set._id, targetType: 'flashcardSet' });
    if (existing >= 2) continue;
    const commenters = [...allFriendIds].sort(() => Math.random() - 0.5).slice(0, 2);
    for (const cId of commenters) {
      const text = setCommentBank[Math.floor(Math.random() * setCommentBank.length)];
      const c = await Comment.create({ targetId: set._id, targetType: 'flashcardSet', userId: cId, content: text });
      const likers = allFriendIds.filter(id => !id.equals(cId)).slice(0, 2);
      if (likers.length) await Comment.updateOne({ _id: c._id }, { $push: { likes: { $each: likers } } });
      count++;
    }
  }

  // All friends' flashcard sets: Justin comments on each
  for (const [, fSets] of Object.entries(friendSetMap)) {
    for (const set of fSets) {
      const existing = await Comment.countDocuments({ targetId: set._id, targetType: 'flashcardSet', userId: justin._id });
      if (existing > 0) continue;
      const text = setCommentBank[Math.floor(Math.random() * setCommentBank.length)];
      const c = await Comment.create({ targetId: set._id, targetType: 'flashcardSet', userId: justin._id, content: text });
      const likers = [...allFriendIds].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
      if (likers.length) await Comment.updateOne({ _id: c._id }, { $push: { likes: { $each: likers } } });
      count++;
    }
  }

  console.log(`  Created ${count} extra comments.`);
}

// ─── SECTION 11: Activity Feed ──────────────────────────────────────────────

async function seedActivities(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks, comments) {
  console.log('Seeding activities...');
  const allFriendIds = friends.map(f => f._id);
  let count = 0;

  // Helper: friend name objects for sharedWithNames metadata
  const friendNameObj = (f) => ({ _id: f._id, firstName: f.firstName, lastName: f.lastName });
  const allFriendNames = friends.map(friendNameObj);

  // Activity dates: spread across the last 60 days, anchored to now so they never go into the future
  const activityWindowMs = 60 * 24 * 60 * 60 * 1000; // 60 days in ms
  let actDate = new Date(Date.now() - activityWindowMs);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const capDate = new Date(Date.now() - 30 * 60 * 1000); // cap at 30 min ago
  const bumpDate = () => {
    actDate = new Date(actDate.getTime() + (Math.floor(Math.random() * 2) + 1) * oneDayMs);
    return actDate < capDate ? new Date(actDate) : new Date(capDate);
  };

  // Justin's shared notes activities
  // Indices 1, 2 are 'specific' (shared with all friends), rest are 'friends'
  const specificNoteIndices = [1, 2];
  const sharedNoteIndices = [0, 1, 2, 5, 6, 10, 13];
  for (const i of sharedNoteIndices) {
    const note = justinNotes[i];
    if (!note) continue;
    const noteTitle = seedData.justinNotes[i].title;
    const ts = bumpDate();

    if (specificNoteIndices.includes(i)) {
      // Specific friends — sharer sees names, each recipient sees "with you"
      await Activity.create({
        userId: justin._id,
        type: 'note_shared',
        targetId: note._id,
        targetType: 'note',
        visibleTo: [justin._id],
        metadata: { noteTitle, sharedWithNames: allFriendNames },
        createdAt: ts,
      });
      count++;
      for (const friend of friends) {
        await Activity.create({
          userId: justin._id,
          type: 'note_shared',
          targetId: note._id,
          targetType: 'note',
          visibleTo: [friend._id],
          metadata: { noteTitle, isRecipient: true },
          createdAt: ts,
        });
        count++;
      }
    } else {
      // Friends visibility — single activity with sharedWithAll
      await Activity.create({
        userId: justin._id,
        type: 'note_shared',
        targetId: note._id,
        targetType: 'note',
        visibleTo: [justin._id, ...allFriendIds],
        metadata: { noteTitle, sharedWithAll: true },
        createdAt: ts,
      });
      count++;
    }
  }

  // Justin's shared flashcard set activities (all are 'friends' visibility)
  const sharedSetIndices = [0, 1, 2, 3, 4, 5, 6, 7, 9];
  for (const i of sharedSetIndices) {
    const set = justinSets[i];
    if (!set || set.visibility === 'private') continue;
    await Activity.create({
      userId: justin._id,
      type: 'flashcard_shared',
      targetId: set._id,
      targetType: 'flashcardSet',
      visibleTo: [justin._id, ...allFriendIds],
      metadata: { setTitle: set.title, sharedWithAll: true },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Shared task activity — shared with Alex Chen specifically
  const sharedTask = tasks.find(t => t.isShared);
  if (sharedTask) {
    const alex = friends.find(f => f.username === 'alexchen_cs');
    const ts = bumpDate();
    if (alex) {
      // Sharer sees participant names
      await Activity.create({
        userId: justin._id,
        type: 'task_created',
        targetId: sharedTask._id,
        targetType: 'task',
        visibleTo: [justin._id, ...allFriendIds.filter(id => !id.equals(alex._id))],
        metadata: { taskTitle: sharedTask.title, sharedWithNames: [friendNameObj(alex)] },
        createdAt: ts,
      });
      count++;
      // Recipient sees "with you"
      await Activity.create({
        userId: justin._id,
        type: 'task_created',
        targetId: sharedTask._id,
        targetType: 'task',
        visibleTo: [alex._id],
        metadata: { taskTitle: sharedTask.title, isRecipient: true },
        createdAt: ts,
      });
      count++;
    }
  }

  // Justin's comment activities (pick 5)
  const justinComments = comments.filter(c => c.userId.equals(justin._id)).slice(0, 5);
  for (const comment of justinComments) {
    await Activity.create({
      userId: justin._id,
      type: 'comment_added',
      targetId: comment.targetId,
      targetType: comment.targetType,
      visibleTo: [justin._id, ...allFriendIds],
      metadata: { commentPreview: comment.content.slice(0, 100), commentId: comment._id.toString() },
      createdAt: bumpDate(),
    });
    count++;
  }

  // Friends' activities — richer: notes, sets, shared tasks, and comments
  for (const friend of friends) {
    const fNotes = friendNoteMap[friend.username];
    const fSets  = friendSetMap[friend.username];
    const otherFriendIds = allFriendIds.filter(id => !id.equals(friend._id));
    const visibleToAll = [friend._id, justin._id, ...otherFriendIds];

    // All friend notes shared (not just 2)
    if (fNotes) {
      for (const fNote of fNotes) {
        await Activity.create({
          userId: friend._id,
          type: 'note_shared',
          targetId: fNote._id,
          targetType: 'note',
          visibleTo: visibleToAll,
          metadata: { noteTitle: fNote.title, sharedWithAll: true },
          createdAt: bumpDate(),
        });
        count++;
      }
    }

    // All friend flashcard sets shared
    if (fSets) {
      for (const fSet of fSets) {
        await Activity.create({
          userId: friend._id,
          type: 'flashcard_shared',
          targetId: fSet._id,
          targetType: 'flashcardSet',
          visibleTo: visibleToAll,
          metadata: { setTitle: fSet.title, sharedWithAll: true },
          createdAt: bumpDate(),
        });
        count++;
      }
    }

    // Task activities for tasks that this friend owns that are shared
    const friendSharedTasks = tasks.filter(t => t.userId.toString() === friend._id.toString() && t.isShared);
    for (const ft of friendSharedTasks) {
      const participantNames = (ft.participants || []).map(p => {
        const pid = p.userId?.toString ? p.userId.toString() : p.userId;
        const participantFriend = friends.find(f => f._id.toString() === pid);
        if (participantFriend) return friendNameObj(participantFriend);
        if (pid === justin._id.toString()) return { _id: justin._id, firstName: justin.firstName, lastName: justin.lastName };
        return null;
      }).filter(Boolean);

      await Activity.create({
        userId: friend._id,
        type: 'task_created',
        targetId: ft._id,
        targetType: 'task',
        visibleTo: visibleToAll,
        metadata: { taskTitle: ft.title, sharedWithNames: participantNames, sharedWithAll: false },
        createdAt: bumpDate(),
      });
      count++;
    }

    // Comment activities for friends who commented on Justin's notes
    const friendComments = comments.filter(c => c.userId.equals(friend._id)).slice(0, 3);
    for (const fc of friendComments) {
      await Activity.create({
        userId: friend._id,
        type: 'comment_added',
        targetId: fc.targetId,
        targetType: fc.targetType,
        visibleTo: visibleToAll,
        metadata: { commentPreview: fc.content.slice(0, 100), commentId: fc._id.toString() },
        createdAt: bumpDate(),
      });
      count++;
    }

    // Like activities (2 per friend)
    if (fNotes && fNotes.length > 0) {
      await Activity.create({
        userId: friend._id,
        type: 'like_added',
        targetId: fNotes[0]._id,
        targetType: 'note',
        visibleTo: visibleToAll,
        metadata: { noteTitle: fNotes[0].title },
        createdAt: bumpDate(),
      });
      count++;
    }
  }

  // Task activities for Justin's outgoing shared tasks
  const justinSharedTasks = tasks.filter(t => t.userId.toString() === justin._id.toString() && t.isShared);
  for (const jt of justinSharedTasks) {
    const participantNames = (jt.participants || []).map(p => {
      const pid = p.userId?.toString ? p.userId.toString() : p.userId;
      const pFriend = friends.find(f => f._id.toString() === pid);
      return pFriend ? friendNameObj(pFriend) : null;
    }).filter(Boolean);

    if (participantNames.length === 0) continue;

    const ts = bumpDate();
    // Owner sees all participant names
    await Activity.create({
      userId: justin._id,
      type: 'task_created',
      targetId: jt._id,
      targetType: 'task',
      visibleTo: [justin._id],
      metadata: { taskTitle: jt.title, sharedWithNames: participantNames },
      createdAt: ts,
    });
    count++;

    // Each participant gets a "with you" entry
    for (const pName of participantNames) {
      const recipientFriend = friends.find(f => f._id.toString() === pName._id.toString());
      if (!recipientFriend) continue;
      await Activity.create({
        userId: justin._id,
        type: 'task_created',
        targetId: jt._id,
        targetType: 'task',
        visibleTo: [recipientFriend._id],
        metadata: { taskTitle: jt.title, isRecipient: true },
        createdAt: ts,
      });
      count++;
      // Non-participant friends see the general activity
      await Activity.create({
        userId: justin._id,
        type: 'task_created',
        targetId: jt._id,
        targetType: 'task',
        visibleTo: allFriendIds.filter(id => !id.equals(recipientFriend._id) && !id.equals(justin._id)),
        metadata: { taskTitle: jt.title, sharedWithNames: participantNames },
        createdAt: ts,
      });
      count++;
    }
  }

  console.log(`  Created ${count} activities.`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

// ─── SECTION 12: Share Messages ──────────────────────────────────────────────

async function seedShareMessages(justin, friends, justinNotes, justinSets, tasks) {
  console.log('Seeding share messages...');
  let count = 0;

  // Send share messages for notes with visibility: 'specific'
  for (const note of justinNotes) {
    if (note.visibility === 'specific' && note.sharedWith?.length > 0) {
      for (const recipientId of note.sharedWith) {
        await sendShareMessage(justin._id, recipientId, 'note', note.title, note._id);
        count++;
      }
    }
  }

  // Send share messages for flashcard sets with visibility: 'specific'
  for (const set of justinSets) {
    if (set.visibility === 'specific' && set.sharedWith?.length > 0) {
      for (const recipientId of set.sharedWith) {
        await sendShareMessage(justin._id, recipientId, 'flashcardSet', set.title, set._id);
        count++;
      }
    }
  }

  // Send share messages for shared tasks
  for (const task of tasks) {
    if (task.isShared && task.participants?.length > 0) {
      for (const p of task.participants) {
        const pId = p.userId?._id || p.userId;
        await sendShareMessage(justin._id, pId, 'task', task.title, task._id);
        count++;
      }
    }
  }

  console.log(`  Created ${count} share messages.`);
}

// ─── SECTION 13: Study Sessions ─────────────────────────────────────────────

async function seedStudySessions(justin, justinSets) {
  console.log('Seeding study sessions...');

  // Seed sessions over the last 7 days to create a visible streak
  // Today = 2026-04-01, go back 6 days for a 7-day streak
  const today = new Date('2026-04-01T20:00:00Z');
  const sessionDays = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    d.setUTCHours(18 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
    sessionDays.push(d);
  }

  let created = 0;
  for (let i = 0; i < sessionDays.length; i++) {
    const completedAt = sessionDays[i];
    // Rotate through the first 3 sets
    const set = justinSets[i % Math.min(3, justinSets.length)];
    if (!set) continue;

    // Fetch cards for this set
    const cards = await Flashcard.find({ setId: set._id, deletedAt: null }).lean();
    if (!cards.length) continue;

    // Build card results — slightly improving performance over days
    const correctRate = 0.5 + (i / sessionDays.length) * 0.4; // 50% → 90%
    const cardResults = cards.slice(0, Math.min(cards.length, 8)).map(card => ({
      cardId: card._id,
      correct: Math.random() < correctRate,
    }));

    const totalCards = cardResults.length;
    const correctCount = cardResults.filter(r => r.correct).length;
    const score = Math.round((correctCount / totalCards) * 100);
    const durationSeconds = 60 + Math.floor(Math.random() * 180); // 1-4 min

    await StudySession.create({
      userId: justin._id,
      setId: set._id,
      completedAt,
      durationSeconds,
      totalCards,
      correctCount,
      score,
      cardResults,
    });

    // Keep FlashcardSet counters consistent
    await FlashcardSet.findByIdAndUpdate(set._id, {
      lastStudiedAt: completedAt,
      $inc: { studySessionCount: 1 },
    });

    created++;
  }

  console.log(`  Created ${created} study sessions (7-day streak)`);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find Justin
    const justin = await User.findOne({ email: 'justinburrell715@gmail.com' });
    if (!justin) {
      console.error('Justin not found — register with justinburrell715@gmail.com first.');
      process.exit(1);
    }
    console.log(`Found Justin: ${justin._id}`);

    // 2. Idempotency check
    const existing = await Note.findOne({
      userId: justin._id,
      title: 'Dynamic Programming: From Recursion to Optimization',
    });
    if (existing && !CLEAN) {
      console.log('Seed data already exists. Use --clean to reseed.');
      process.exit(0);
    }

    // 3. Clean if requested
    if (CLEAN) {
      await cleanSeedData(justin._id);
    }

    // 4. Seed users and friendships
    const friends = await seedFriends();
    await seedStrangers();
    await seedFriendships(justin, friends);

    // 5. Seed notes
    const justinNotes = await seedJustinNotes(justin, friends);
    const friendNoteMap = await seedFriendNotes(friends);

    // 6. Seed flashcard sets
    const justinSets = await seedJustinFlashcardSets(justin, justinNotes);
    const friendSetMap = await seedFriendFlashcardSets(friends);

    // 6.5. Seed study sessions (requires justinSets + their cards to exist)
    await seedStudySessions(justin, justinSets);

    // 7. Seed tasks and applications
    const tasks = await seedTasks(justin, friends);
    await seedApplications(justin);

    // 8. Seed conversations
    await seedConversations(justin, friends);

    // 8.5. Seed share messages (auto-messages for shared content)
    await seedShareMessages(justin, friends, justinNotes, justinSets, tasks);

    // 9. Seed comments and activities
    const comments = await seedComments(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks);
    await seedReplies(justin, friends, justinNotes, justinSets, friendSetMap, comments);
    await seedExtraComments(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks);
    await seedActivities(justin, friends, justinNotes, friendNoteMap, justinSets, friendSetMap, tasks, comments);

    // 10. Update Justin's activity visibility and ensure founder + team roles are set
    await User.updateOne({ _id: justin._id }, {
      'settings.activityVisibility': 'friends',
      roles: ['founder', 'team'],
    });

    // Bust Redis activity cache so dashboard/activity pages don't show stale data
    try {
      const { invalidatePattern } = require('../lib/cache');
      await invalidatePattern(`activity:${justin._id}:first`);
      const allIds = [...allFriendIds, justin._id];
      for (const uid of allIds) await invalidatePattern(`activity:${uid}:first`);
    } catch (_) {}

    console.log('\nSeed complete!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();

/**
 * Curated knowledge for the Virtual Assistant — Community Connect Hub only.
 * Answers must not reference information outside this system.
 */

export const ASSISTANT_SCOPE_MESSAGE =
  'I can only answer questions about Community Connect Hub — how to register, log in, and use features in this platform. Please ask something about the system.';

export const ASSISTANT_GREETING =
  'Hello! I am the Community Connect Hub Virtual Assistant. Ask me about registering, logging in, submitting requests, projects, WDC meetings, letters, or your dashboard.';

export const STARTER_QUESTIONS = [
  'What is Community Connect Hub?',
  'How do I use the system?',
  'How do I register as a resident?',
  'How do I log in?',
  'How do I submit a service request?',
];

/** @typedef {{ id: string, question: string, keywords: string[], answer: string, roles?: string[] }} AssistantEntry */

/** @type {AssistantEntry[]} */
export const ASSISTANT_KNOWLEDGE = [
  {
    id: 'getting-started',
    question: 'How do I use the system?',
    keywords: [
      'use', 'using', 'guide', 'help', 'start', 'started', 'begin', 'navigate',
      'steps', 'workflow', 'howto', 'tutorial', 'learn', 'new', 'first', 'time',
    ],
    answer:
      'Here is a quick guide to using Community Connect Hub:\n\n1. Register — On the home page, click Get Started. Enter your details, ward, NID, and password, then accept Terms & Conditions.\n2. Log in — Click Login, enter your email and password, and open your role dashboard.\n3. Explore the sidebar — Residents use Requests, Projects, Announcements, and Profile. Officials see extra tools for WDC, letters, or approvals.\n4. Submit a request — Go to Requests → Submit Request (project, letter, complaint, or feedback).\n5. Track progress — Check Requests, Projects, and notifications (bell icon) for updates.\n6. Get help — Use this Virtual Assistant anytime for step-by-step guidance on system features.',
  },
  {
    id: 'purpose',
    question: 'What is Community Connect Hub?',
    keywords: [
      'purpose', 'what', 'community', 'connect', 'hub', 'about', 'system', 'platform',
      'why', 'use', 'using', 'madang', 'governance', 'digital',
    ],
    answer:
      'Community Connect Hub is a Digital Governance & WDC Management System for Madang Province. It helps ward residents, councillors, and government officials track projects, manage service requests, schedule WDC meetings, and deliver transparent digital governance. The pilot area is Ward 5 Nabasa under Madang Urban LLG.\n\nTo start using it: register from the home page, log in, then use the sidebar menu for Requests, Projects, Announcements, and your Profile. Ask me "How do I use the system?" for a full step-by-step guide.',
  },
  {
    id: 'who-can-use',
    question: 'Who can use the system?',
    keywords: ['who', 'roles', 'users', 'official', 'resident', 'councillor', 'wdc', 'mayor', 'admin'],
    answer:
      'The system supports several roles: Residents (submit requests, track projects, view announcements), WDC members (review requests, community needs, meetings, resolutions), Ward Councillors (projects, letters, announcements, proposals), Mayor and provincial stakeholders (approvals, funding, reports), and System Administrators (user management and approvals).',
  },
  {
    id: 'register-resident',
    question: 'How do I register as a resident?',
    keywords: ['register', 'signup', 'sign', 'up', 'create', 'account', 'resident', 'new', 'join'],
    answer:
      'From the home page, click Get Started or Register now. Enter your first and last name, email, 10-digit National ID (NID), phone, ward, and password. You must accept the Terms & Conditions before registering. After registration, log in with your email and password.',
  },
  {
    id: 'register-official',
    question: 'How do officials register?',
    keywords: ['official', 'pre-registered', 'pre', 'registered', 'councillor', 'wdc', 'mayor', 'admin'],
    answer:
      'Officials must be pre-registered by a System Administrator first. On the login page, use Complete official registration, then sign up with your pre-registered email and NID. Your role and ward are assigned from the pre-registration record.',
  },
  {
    id: 'login',
    question: 'How do I log in?',
    keywords: ['login', 'log in', 'signin', 'sign in', 'log', 'password', 'email', 'access', 'sign on'],
    answer:
      'How to log in to Community Connect Hub:\n\n1. Open the home page and click Login (top right or main button).\n2. Enter the email address you used when registering.\n3. Enter your password.\n4. Click the Login button.\n5. You will be taken to your dashboard based on your role (resident, councillor, WDC, mayor, etc.).\n\nForgot your password? Click Forgot Password on the login page to reset it by email.',
  },
  {
    id: 'nid',
    question: 'Why do I need a National ID (NID)?',
    keywords: ['nid', 'national', 'id', 'identity', 'identification', 'number', '10', 'digit'],
    answer:
      'Your 10-digit National ID (NID) uniquely identifies you in Community Connect Hub. It is required at registration and links your profile to your ward. Each NID can only be registered once in the system.',
  },
  {
    id: 'password',
    question: 'What are the password requirements?',
    keywords: ['password', 'requirements', 'rules', 'strong', 'characters', 'reset'],
    answer:
      'Passwords must be at least 8 characters and include uppercase, lowercase, a number, and a special character. Use Forgot Password on the login page if you need to reset it.',
  },
  {
    id: 'ward',
    question: 'Which ward can I select?',
    keywords: ['ward', 'nabasa', 'madang', 'urban', 'llg', 'select', 'area', 'zone'],
    answer:
      'Residents register under a Madang Urban LLG ward (Ward 1 through Ward 10). The pilot focus is Ward 5 Nabasa. Your ward determines which projects, announcements, and requests you see in the system.',
  },
  {
    id: 'requests',
    question: 'How do I submit a service request?',
    keywords: ['request', 'submit', 'service', 'application', 'inbox', 'need'],
    answer:
      'After logging in as a resident, go to Requests and click Submit Request. You can submit a Project Request, Letter Request, Complaint, or Feedback. Fill in the category, description, and any supporting details, then submit. You can track status from the same page.',
  },
  {
    id: 'project-request',
    question: 'How do project requests work?',
    keywords: ['project', 'water', 'road', 'infrastructure', 'dsip', 'funding', 'community'],
    answer:
      'Residents submit project requests (e.g. water supply, road repair, street lighting). When the same project category is requested by 5 or more residents in a ward, it becomes a Community Need. The WDC reviews it and forwards it to the Ward Councillor, who may write a proposal for Mayor review and funding.',
  },
  {
    id: 'community-need',
    question: 'What is a community need?',
    keywords: ['community', 'need', 'needs', 'five', '5', 'threshold', 'forward', 'forwarded'],
    answer:
      'A Community Need forms when 5 or more residents in a ward request the same project category (for example, Water Supply). The WDC records and groups these requests, then forwards the community need to the Ward Councillor for review and proposal writing.',
  },
  {
    id: 'letters',
    question: 'How do I request a letter?',
    keywords: ['letter', 'reference', 'support', 'statutory', 'declaration', 'character', 'councillor'],
    answer:
      'Submit a Letter Request from the Requests page. Choose Reference Letter, Support Letter, or Statutory Declaration, describe why you need it, and submit. Your Ward Councillor prepares the official letter, signs it digitally, and notifies you when it is ready. You can download the signed letter as a PDF from Requests.',
  },
  {
    id: 'character-reference',
    question: 'How do I get a character reference?',
    keywords: ['character', 'reference', 'certify', 'employment', 'official', 'mullg'],
    answer:
      'Submit a Letter Request and select Reference Letter. The Ward Councillor uses the official Madang Urban LLG character reference template, fills in your details, signs the letter, and sends it to you. Download the completed PDF from your Requests page.',
  },
  {
    id: 'complaints',
    question: 'How do I lodge a complaint?',
    keywords: ['complaint', 'complaints', 'issue', 'problem', 'report', 'grievance'],
    answer:
      'Residents can lodge complaints from the Complaints section or by submitting a Complaint request type. Complaints are reviewed by WDC members and the Ward Councillor within your ward.',
  },
  {
    id: 'announcements',
    question: 'Where do I see announcements?',
    keywords: ['announcement', 'announcements', 'news', 'notice', 'bulletin', 'update'],
    answer:
      'Go to Announcements in the sidebar. Ward councillors and officials post public or ward-only announcements. Residents see announcements for their ward and general notices from Madang Urban LLG.',
  },
  {
    id: 'projects',
    question: 'How do I track projects?',
    keywords: ['projects', 'track', 'tracking', 'progress', 'dsip', 'psip', 'funded', 'status'],
    answer:
      'Open Projects from your dashboard to see ward projects, including DSIP, PSIP, and ward-funded work. Project status shows whether a project is pending, in progress, funded, or completed. Residents can rate projects to show progress to funding stakeholders and provincial government.',
  },
  {
    id: 'wdc',
    question: 'What does the WDC do in the system?',
    keywords: ['wdc', 'development', 'committee', 'chairman', 'secretary', 'treasurer', 'member'],
    answer:
      'The Ward Development Committee (WDC) reviews resident requests, identifies community needs (5+ similar project requests), forwards needs to the councillor, manages meetings and resolutions, prepares documents (minutes, reports, acquittals), and handles complaints in the ward.',
  },
  {
    id: 'councillor',
    question: 'What can a Ward Councillor do?',
    keywords: ['councillor', 'councilor', 'ward', 'proposal', 'mayor', 'letter', 'announcement'],
    answer:
      'Ward Councillors manage ward projects, review forwarded community needs, write project proposals for the Mayor, create signed reference/support/statutory letters for residents, post ward announcements, and view performance scorecards on their dashboard.',
  },
  {
    id: 'meetings',
    question: 'How are WDC meetings managed?',
    keywords: ['meeting', 'meetings', 'schedule', 'minutes', 'agenda', 'resolution'],
    answer:
      'WDC members use the Meetings section to schedule and record ward development meetings. Resolutions passed in meetings are stored under Resolutions. WDC Documents can generate meeting minutes and formal reports.',
  },
  {
    id: 'profile',
    question: 'How do I update my profile?',
    keywords: ['profile', 'photo', 'picture', 'email', 'phone', 'update', 'account', 'settings'],
    answer:
      'Open Profile from the sidebar. You can update your contact details, upload a profile photo, and change your password. Keep your email current so you receive notifications when letters or requests are ready.',
  },
  {
    id: 'dashboard',
    question: 'What is on my dashboard?',
    keywords: ['dashboard', 'home', 'overview', 'panel', 'after', 'login'],
    answer:
      'Your dashboard depends on your role. Residents see projects, requests, and announcements for their ward. Councillors see projects, requests, community needs, letters, and announcements. WDC members see resident requests, community needs, meetings, and documents. Each role has a sidebar menu for its features.',
  },
  {
    id: 'funding',
    question: 'How does project funding work?',
    keywords: ['funding', 'fund', 'mayor', 'approve', 'approved', 'dda', 'psip', 'dsip', 'pec'],
    answer:
      'After a councillor submits a proposal, the Mayor reviews priority and available ward funds. Projects may proceed with councillor ward funds or be forwarded for DSIP, PSIP, DDA, or other stakeholder funding. Funding agencies and provincial roles track approved projects in their dashboards.',
  },
  {
    id: 'ratings',
    question: 'Can I rate a project?',
    keywords: ['rate', 'rating', 'ratings', 'score', 'feedback', 'performance', 'progress'],
    answer:
      'Yes. Residents can rate projects from start to completion. Ratings help funding stakeholders and provincial government see community satisfaction and project progress in the ward.',
  },
  {
    id: 'terms',
    question: 'Do I need to accept Terms and Conditions?',
    keywords: ['terms', 'conditions', 'accept', 'agreement', 'policy', 'privacy'],
    answer:
      'Yes. You must tick and accept the Terms & Conditions before completing registration. The Register button stays disabled until you accept them.',
  },
  {
    id: 'notifications',
    question: 'How do notifications work?',
    keywords: ['notification', 'notifications', 'alert', 'bell', 'notify', 'message'],
    answer:
      'The notification bell in the header shows updates such as when your letter is ready, request status changes, or new announcements. Push notifications may also be enabled for important ward updates.',
  },
  {
    id: 'documents',
    question: 'What are WDC Documents?',
    keywords: ['document', 'documents', 'minutes', 'report', 'acquittal', 'generator', 'template'],
    answer:
      'WDC members can open WDC Documents to generate official templates: Meeting Minutes, Project Reports, WDC Resolutions, and Acquittal Reports. Documents can be signed digitally and exported as PDFs.',
  },
  {
    id: 'acquittals',
    question: 'What are acquittal reports?',
    keywords: ['acquittal', 'acquittals', 'finance', 'treasurer', 'expenditure', 'llg'],
    answer:
      'Acquittal reports document how ward project funds were spent. The WDC Treasurer prepares the report and both Treasurer and Chairman (Ward Councillor) signatures are required before submission to LLG and District Administration.',
  },
];

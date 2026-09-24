# EduTech Compiler & Brightspace LMS (D2L) LTI 1.3 Integration

## Executive Summary

**EduTech Compiler** is an enterprise-grade, web-based interactive programming environment and automated assessment platform built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Monaco Editor** (the VS Code core editor).

It is specifically designed for integration with Learning Management Systems (LMS) like **D2L Brightspace** using the **LTI 1.3 (Learning Tools Interoperability) Advantage** standard.

### Core Capabilities
1. **Interactive Multi-Language Compiler ("Free Code")**:
   - In-browser code editing with syntax highlighting, auto-completion, and customizable themes.
   - Supports 10 programming languages: Python 3, JavaScript (Node.js), C, C++, Java, PHP, Ruby, Kotlin, Rust, and C#.
   - Real-time stdin input passing, stdout capture, stderr/compilation diagnostics, execution time measurement, and memory tracking.
2. **Automated Assessment & Problem Library ("Problems")**:
   - Problem browsing with difficulty filtering (Easy, Medium, Hard), topic categories, and keyword search.
   - Multi-language boilerplate and function signatures per problem.
   - Dual-tier test cases: **Visible** (for student practice/debugging) and **Hidden** (for strict evaluation and anti-cheat grading).
   - Automated test-runner checking student outputs against expected outputs with score calculation.
3. **Faculty / Instructor Portal ("Faculty")**:
   - Interactive problem creation UI: custom constraints, test cases, points weighting, hints, memory limits, and time limits.
4. **Admin Dashboard ("Admin")**:
   - Platform branding, custom theme builder (colors, borders, shadows, dark mode), execution limit overrides, and system settings.
5. **D2L Brightspace LTI 1.3 Integration**:
   - OIDC 1.0 authentication and LTI 1.3 Resource Link launch.
   - Role detection (Student vs Instructor vs Administrator).
   - LTI Assignment & Grade Services (AGS) Grade Passback: automatically sending grades, scores, and completion timestamps back into Brightspace Gradebook.
6. **Flexible Execution Engine**:
   - **Engine A (Local Sandboxed Engine)**: Fast, native server-side execution via Node.js child processes for environments where Judge0 is not running.
   - **Engine B (Judge0 Containerized Engine)**: Dockerized, multi-container isolated sandbox running on port 2358 with isolate sandbox cgroups.

---

## Technical Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15.4.4 (App Router) | Server-side rendering, API routes, static generation |
| **Frontend UI** | React 19.1.0, Tailwind CSS 3.4 | Dynamic UI, glassmorphism design, animations |
| **Animation** | Framer Motion 12, Canvas-Confetti, tsParticles | Futuristic UI effects, celebration confetti |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | Industrial-strength code editing (VS Code engine) |
| **State Management** | Zustand 5.0 | Reactive global state with optional localStorage sync |
| **LTI & Auth** | JSON Web Tokens (`jsonwebtoken`), `crypto-js` | LTI 1.3 JWT verification and JWKS endpoint |
| **Execution Sandbox**| Next.js API Routes (`/api/judge0/submissions`) + Local runtimes / Judge0 Docker | Code compilation and isolated execution |

---

## System Architecture & End-to-End Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant LMS as D2L Brightspace
    participant App as Next.js Web App
    participant API as Next.js API Routes
    participant Exec as Execution Engine (Judge0 / Local)
    participant DB as Server Database (Target)

    Note over LMS,App: 1. LTI 1.3 Authentication & Launch
    Student->>LMS: Clicks "Programming Assignment" in Course
    LMS->>App: POST /api/lti/launch (OIDC id_token + state)
    App->>App: Verify JWT signature using Brightspace JWKS
    App-->>Student: Render problem in Assignment Context (Role = Student)

    Note over Student,Exec: 2. Code Authoring & Execution
    Student->>App: Writes code & clicks "Run Code" / "Submit"
    App->>API: POST /api/judge0/submissions (code, language_id, stdin)
    API->>Exec: Spawn process / container with resource limits
    Exec-->>API: stdout, stderr, execution_time, exit_code
    API->>API: Store submission in memory / database
    API-->>App: Return token / result
    App-->>Student: Display test results & points breakdown

    Note over App,LMS: 3. Automatic Grade Passback
    App->>API: POST /api/d2l/grade-passback (userId, gradeItemId, score)
    API->>LMS: LTI Advantage AGS Request (OAuth2 Bearer Token)
    LMS-->>Student: Grade updated in Brightspace Gradebook!
```

---

## Deep Dive: How the LMS Brightspace Integration Works

### 1. The LTI 1.3 Advantage Flow
LTI 1.3 is built on **OAuth 2.0** and **OpenID Connect (OIDC)** using signed JSON Web Tokens (JWT) with asymmetric cryptography (RS256).

1. **Initiation**: When a user clicks a tool link in Brightspace, Brightspace initiates an OIDC launch to the tool.
2. **Tool Launch (`/api/lti/launch`)**:
   - Brightspace sends a signed `id_token` (JWT) containing context claims:
     - `https://purl.imsglobal.org/spec/lti/claim/roles`: User roles (`http://purl.imsglobal.org/vocab/lis/v2/membership#Learner` or `#Instructor`).
     - `https://purl.imsglobal.org/spec/lti/claim/context`: Course ID and course title.
     - `https://purl.imsglobal.org/spec/lti/claim/resource_link`: Specific assignment or quiz ID.
     - `https://purl.imsglobal.org/spec/lti-ags/claim/endpoint`: Endpoint URL for automatic grade passback (`lineitem` and `lineitems`).
3. **Public Keyset (`/api/.well-known/jwks.json`)**:
   - Brightspace verifies messages from our tool by fetching our public RSA keys from `https://your-domain.com/api/.well-known/jwks.json`.
4. **Assignment & Grade Services (`/api/d2l/grade-passback`)**:
   - When a student completes an assignment, the compiler calculates the score based on passing test cases.
   - The platform sends an authenticated score payload back to D2L's AGS lineitem endpoint:
   ```json
   {
     "userId": "student-d2l-id",
     "scoreGiven": 85,
     "scoreMaximum": 100,
     "comment": "All visible and 3/4 hidden test cases passed.",
     "timestamp": "2026-09-10T14:30:00Z",
     "activityProgress": "Completed",
     "gradingProgress": "FullyGraded"
   }
   ```

---

## Codebase Directory & File Summary

```
brightspace-compiler/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── .well-known/
│   │   │   │   └── jwks.json/route.ts      # Exposes RSA public keys for Brightspace to verify our tool
│   │   │   ├── d2l/
│   │   │   │   └── grade-passback/route.ts # Receives grade requests & communicates with D2L Gradebook API
│   │   │   ├── execute/route.ts            # Secure local process execution engine
│   │   │   ├── judge0/
│   │   │   │   ├── [...route]/route.ts     # Proxy router to external/Docker Judge0 instance
│   │   │   │   └── submissions/
│   │   │   │       ├── route.ts            # Local emulation of Judge0 POST /submissions
│   │   │   │       └── [token]/route.ts    # Polling endpoint for submission results
│   │   │   ├── lti/
│   │   │   │   └── launch/route.ts         # Handles OIDC LTI 1.3 launch from Brightspace
│   │   │   └── submission/route.ts         # Alternative submission endpoint
│   │   ├── globals.css                     # Global styles, Tailwind utility extensions, animations
│   │   ├── layout.tsx                      # Root HTML layout, font injection (Geist), ThemeProvider
│   │   └── page.tsx                        # Application entry page rendering <MainApp />
│   ├── components/
│   │   ├── ui/                             # Radix UI + Tailwind design system components
│   │   │   ├── button.tsx                  # Polymorphic button component with gradient variants
│   │   │   ├── input.tsx                   # Styled input & textarea components
│   │   │   └── tabs.tsx                    # Accessible tabs navigation component
│   │   ├── AdminPage.tsx                   # Admin dashboard: themes, settings, maintenance mode
│   │   ├── CodeCompiler.tsx                # Free code runner: Monaco editor, language selector, terminal tabs
│   │   ├── DevRoleSwitcher.tsx             # Floating toolbar to test Student/Instructor/Admin roles locally
│   │   ├── FacultyPage.tsx                 # Problem authoring tool: test cases, hints, score points
│   │   ├── LanguageSwitcher.tsx            # Dropdown component with language logos & version details
│   │   ├── MainApp.tsx                     # Top-level view router (Home, Compiler, Problems, Faculty, Admin)
│   │   ├── QuestionBrowser.tsx             # Problem library catalog: search, filters, difficulty tags
│   │   ├── QuestionSolver.tsx              # Student workspace: problem description, editor, test case runner
│   │   ├── ThemeProvider.tsx               # Dynamic theme context applying CSS variables
│   │   └── ThemeToggle.tsx                 # Light / Dark mode toggle button
│   ├── config/
│   │   └── languages.ts                    # Language metadata: IDs, run commands, default starter templates
│   ├── hooks/
│   │   └── useLTIContext.ts                # React hook extracting LTI parameters, role, and assignment context
│   ├── lib/
│   │   ├── judge0.ts                       # Axios client for external Judge0 API
│   │   ├── judge0-proxy.ts                 # Proxy wrapper with retry & poll mechanics
│   │   └── storage.ts                      # In-memory global submission cache
│   ├── store/
│   │   ├── adminStore.ts                   # Zustand store for theme customization & platform settings
│   │   ├── editorStore.ts                  # Zustand store for editor code, language, stdin, stdout
│   │   └── questionStore.ts                # Zustand store for problem library, submissions, and filters
│   └── types/
│       ├── index.ts                        # TypeScript interfaces (Question, TestCase, Submission, etc.)
│       ├── global.d.ts                     # Ambient declarations for globalThis submissions
│       └── declarations.d.ts               # Typings for canvas-confetti and particles.js
├── docker-compose.yml                      # Docker Compose specification for Judge0, PostgreSQL, and Redis
├── judge0.conf                             # Configuration parameters for Judge0 sandbox
├── package.json                            # Node.js dependencies and lifecycle scripts
├── tsconfig.json                           # TypeScript compiler configuration
├── next.config.ts                          # Next.js optimization and standalone build configuration
└── DEPLOYMENT.md                           # Deployment guide for server and cloud environments
```

---

## Current State vs Production Database Needs

### Current Storage Mechanism (In-Memory / Client-Side)
| Data Entity | Current Implementation | Limitation |
|---|---|---|
| **Problems & Test Cases** | Hardcoded in `questionStore.ts` | Resets on reload; newly created faculty problems lost |
| **Submissions & Results** | In-memory `Map` in `storage.ts` | Lost on server restart; no historical analytics |
| **Theme & Admin Settings**| Browser `localStorage` in `adminStore.ts` | Only saved on the individual user's browser |
| **LTI Sessions & State** | URL parameters and in-memory hook | No persistent record of student attempts or course link |

### Database Architecture Required for Production
To make this fully persistent and production-ready on a server, a relational database (**PostgreSQL**) should be connected with an ORM like **Prisma** or **Drizzle**.

#### Target Database Schema:
```mermaid
erDiagram
    USERS ||--o{ SUBMISSIONS : makes
    COURSES ||--o{ ASSIGNMENTS : contains
    ASSIGNMENTS ||--o{ QUESTIONS : includes
    QUESTIONS ||--o{ TEST_CASES : has
    QUESTIONS ||--o{ SUBMISSIONS : receives
    SUBMISSIONS ||--o{ TEST_RESULTS : contains

    USERS {
        string id PK "Brightspace user_id or internal UUID"
        string email
        string name
        string role "student | instructor | admin"
        datetime createdAt
    }

    COURSES {
        string id PK "Brightspace context_id"
        string title
        datetime createdAt
    }

    ASSIGNMENTS {
        string id PK "Brightspace resource_link_id"
        string courseId FK
        string gradeItemId "Brightspace LineItem ID"
        int maxPoints
        datetime dueDate
    }

    QUESTIONS {
        string id PK
        string title
        text description
        string difficulty "Easy | Medium | Hard"
        string category
        int timeLimit
        int memoryLimit
        json supportedLanguages
    }

    TEST_CASES {
        string id PK
        string questionId FK
        text input
        text expectedOutput
        int points
        boolean isHidden
    }

    SUBMISSIONS {
        string id PK "Token UUID"
        string userId FK
        string questionId FK
        int languageId
        text code
        int totalScore
        string status "Accepted | Wrong Answer | Runtime Error"
        datetime submittedAt
        boolean gradeSentToD2L
    }

    TEST_RESULTS {
        string id PK
        string submissionId FK
        string testCaseId FK
        boolean passed
        text actualOutput
        float executionTime
    }
```

---

## Step-by-Step Local Testing Guide

Before deploying to the production server, test the entire flow on your local machine:

### 1. Test Locally with Dev Role Switcher
1. Start the application:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000` in your browser.
3. Use the floating **Dev Role Switcher** at the bottom-left:
   - **Student View**: Test solving problems, running test cases, and viewing outputs.
   - **Faculty View**: Test creating custom questions and adding test cases.
   - **Admin View**: Test theme customization and platform configurations.

### 2. Test Code Execution
- Go to **Free Code**:
  - Test Python (`print("Hello World")`)
  - Test JavaScript (`console.log("Hello World")`)
  - Test C++ (`cout << "Hello World";`)
  - Test Java (`System.out.println("Hello World");`)
- Both compiling and execution happen via `/api/judge0/submissions` which uses our built-in local execution engine.

### 3. Test Brightspace LTI 1.3 Locally Using a Tunnel
Because Brightspace requires an HTTPS URL to send LTI launch payloads:
1. Expose your local port 3000 to HTTPS using Tunnelmole or Ngrok:
   ```bash
   npx tunnelmole 3000
   # Or: ngrok http 3000
   ```
2. You will receive an HTTPS URL, for example: `https://edutech.tunnelmole.net`.
3. In D2L Brightspace Admin Tools → **Manage Extensibility** → **LTI Advantage**:
   - Register Tool:
     - **Tool URL**: `https://edutech.tunnelmole.net/api/lti/launch`
     - **JWKS URL**: `https://edutech.tunnelmole.net/api/.well-known/jwks.json`
4. Create an External Learning Tool link in a Brightspace Course and launch it.
5. Brightspace will POST the signed `id_token` to `/api/lti/launch`, and the compiler will open in the assignment context!

---

## Production Server Deployment Checklist

When you are ready to put this on your server:
1. **Server Setup**:
   - Install Node.js 18+ or 20+, Docker (optional if using Judge0), and PostgreSQL.
2. **Database Provisioning**:
   - Create PostgreSQL database (e.g., `brightspace_compiler`).
   - Add database URL to `.env.local`:
     ```env
     DATABASE_URL="postgresql://user:password@localhost:5432/brightspace_compiler"
     ```
3. **Environment Variables**:
   ```env
   NEXT_PUBLIC_BASE_URL=https://compiler.yourdomain.com
   LTI_CLIENT_ID=your-brightspace-client-id
   LTI_SECRET=your-brightspace-secret
   LTI_ISSUER=https://your-brightspace-instance.com
   LTI_KEYSET_URL=https://your-brightspace-instance.com/d2l/lti/authenticate/jwks
   LTI_AUTH_URL=https://your-brightspace-instance.com/d2l/lti/authenticate
   ```
4. **Build & Start**:
   ```bash
   npm run build
   npm run start
   ```
   (Or run under **PM2** / **systemd** behind Nginx reverse proxy with SSL certificate via Let's Encrypt).

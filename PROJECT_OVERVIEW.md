# EduTech Code Assessment & Compiler — D2L Brightspace LTI 1.3 Integration

Comprehensive project scope, architecture, workflow, and operational documentation for the **EduTech Code Assessment & Compiler** platform integrated with **D2L Brightspace LMS** via **IMS Global LTI 1.3 Advantage**.

---

## 1. Executive Summary & Project Scope

The **EduTech Code Assessment & Compiler** is an enterprise-grade, cloud-native automated programming assessment and code execution platform designed specifically for seamless embedding within **D2L Brightspace Learning Management System (LMS)**.

### Primary Purpose:
- Enable instructors to author, manage, and assign multi-language coding questions and structured assessments directly inside Brightspace courses.
- Allow students to write, compile, run, debug, and submit programming assignments inside a secure, sandboxed browser IDE without leaving Brightspace.
- Support deep LMS integration where individual coding assessments appear as native Brightspace course content topics, complete with Brightspace visibility controls (Show/Hide), due date enforcement, and automated gradebook synchronization.

---

## 2. System Architecture & Brightspace Integration

```
+-----------------------------------------------------------------------------------+
|                            D2L Brightspace LMS                                    |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  |   Course Content   |   |     Assignments     |   |        Gradebook         |  |
|  |   Sidebar Topics   |   |   (Dropbox Folders) |   |    (LineItems / Scores)  |  |
|  +---------+----------+   +----------+----------+   +------------^-------------+  |
+------------|-------------------------|---------------------------|----------------+
             |                         |                           |
    1. OIDC / LTI 1.3 Launch           | Direct Launch             | 6. LTI AGS Grade Sync
    (id_token / RSA-256 JWT)           | with assignment_id        | (Automatic Score Push)
             |                         |                           |
+------------v-------------------------v---------------------------+----------------+
|                   EduTech Compiler Platform (Next.js Application)                 |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Next.js App Router (Base: /compiler)                                        |  |
|  |  • /api/lti/login_initiations  (OIDC Authenticate)                          |  |
|  |  • /api/lti/launch             (JWT Verification & Role Resolution)         |  |
|  |  • /api/lti/jwks               (Public Keyset Endpoint)                     |  |
|  |  • /api/assignments           (Assessment Lifecycle & LMS Topic Links)     |  |
|  |  • /api/piston/execute         (Multi-language Code Runner)                 |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +--------------------------+  +---------------------------+  +-----------------+  |
|  |     Instructor View      |  |       Learner View        |  |  Monaco Editor  |  |
|  | • Assessment Management  |  | • Direct Problem Solver   |  | • Multi-language|  |
|  | • Question Bank & Import |  | • Real-time Test Runs     |  | • Test Execution|  |
|  | • Results & CSV Export   |  | • Submitted State Screen  |  | • Dark/Light UI |  |
|  +--------------------------+  +---------------------------+  +-----------------+  |
+---------------------------------------+-------------------------------------------+
                                        |
                         Sandboxed Code Compilation
                                        |
+---------------------------------------v-------------------------------------------+
|                          Piston Execution Engine                                  |
|   (Isolated Docker container running Python, C++, Java, JS, Rust, Go, etc.)       |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Functionality Matrix

| Feature | Description | Instructor | Learner |
| :--- | :--- | :---: | :---: |
| **LTI 1.3 Single Sign-On** | Seamless launch from Brightspace with zero passwords; auto-provisions profile and course membership. | Yes | Yes |
| **Role-Based Experience** | Automatically renders Faculty Dashboard or Student Workspace based on Brightspace role. | Yes | Yes |
| **Direct Topic Deep Launch** | Launching an assessment link from Brightspace opens *that exact assessment* directly. | Yes | Yes |
| **Monaco Code Editor** | Production IDE with syntax highlighting, auto-complete, bracket matching, and multi-file support. | Yes | Yes |
| **Multi-Language Compiler** | Sandboxed execution across Python, C++, Java, C, JavaScript, Go, Rust, and more via Piston. | Yes | Yes |
| **Automated Test Cases** | Immediate grading against public sample tests and hidden evaluation test cases. | Yes | Yes |
| **Camera & Anti-Cheat Proctoring** | Live webcam streaming, pre-exam camera verification, periodic snapshot audit capture, tab-switch detection, fullscreen lock, and copy-paste prevention. | Configure | Enforced |
| **Submission Result Tracking** | Real-time score calculation, runtime/memory stats, and detailed test case failure explanations. | Yes | Yes |
| **Dedicated Submitted Screen** | Clean confirmation screen preventing re-submission and displaying scores and timestamps. | No | Yes |
| **Grade Export & CSV** | 1-click CSV download of student results, marks breakdown, and timestamps. | Yes | No |
| **Question Bank & Importer** | Universal question authoring or importing from LeetCode, CodeChef, and HackerRank. | Yes | No |

---

## 4. Instructor / Faculty Workflow

```mermaid
flowchart TD
    A["Instructor opens Brightspace Course"] --> B["Clicks Course Content -> 'edutech compiler'"]
    B --> C["Compiler launches inside Brightspace (Faculty Dashboard)"]
    C --> D["Clicks '+ Create Assessment'"]
    D --> E["Enters Title, Due Date, Max Points & selects Problems"]
    E --> F["Assessment created in Course Container"]
    F --> G["Instructor clicks 'LMS Link' on assessment card"]
    G --> H["Goes to Brightspace Content -> 'Existing Activities' -> 'External Learning Tools'"]
    H --> I["Pastes copied LMS Link & Saves"]
    I --> J["Assessment appears as a native sidebar topic in Brightspace"]
    J --> K["Instructor toggles Eye icon 👁️ (Show / Hide) as needed"]
    K --> L["Instructor can click topic anytime to review live Student Results & CSV Export"]
```

### Detailed Steps for Instructors:
1. **Accessing the Tool**:
   - The instructor navigates to their Brightspace course (e.g. *Advanced C++*) and clicks the compiler tool topic in the course content sidebar.
   - The system validates the instructor's LTI 1.3 JWT claims and automatically presents the **Faculty Management Dashboard**.
2. **Creating an Assessment**:
   - Under the course module container, the instructor clicks **`+ Create Assessment`**.
   - Specifies assessment metadata: Title (e.g., `Midterm Python Assessment`), Due Date, Instructions, and Max Points.
   - Selects one or more programming problems from the Question Bank (or authors new questions).
   - Clicks **Submit**. The assessment is published immediately for enrolled course students.
3. **Placing in Brightspace Content**:
   - On the newly created assessment card, the instructor clicks the **`LMS Link`** button. The unique direct launch URL is copied to their clipboard.
   - In Brightspace, under the desired module (e.g. `edutech compiler`), the instructor clicks **Existing Activities ➔ External Learning Tools ➔ Create New LTI Link**.
   - Enters the title and pastes the link.
   - The assessment is now an individual item in the Brightspace Content sidebar.
4. **Visibility & Deadlines**:
   - The instructor can toggle the Brightspace **Eye 👁️** icon to hide the assessment until the scheduled exam time, or reveal it to learners.
5. **Monitoring & Grading**:
   - Instructors can click **`View Results`** at any time to see each student's submission timestamp, pass/fail status per test case, and total points scored.
   - Clicking **`Export CSV`** downloads a spreadsheet ready for departmental reporting or offline gradebook archiving.

---

## 5. Learner / Student Workflow

```mermaid
flowchart TD
    A["Student logs into Brightspace"] --> B["Navigates to Course Content sidebar"]
    B --> C{"Is assessment visible?"}
    C -- "Hidden (Eye with slash)" --> D["Student cannot see or access test"]
    C -- "Visible (Eye active)" --> E["Student clicks Assessment Topic in sidebar"]
    E --> F{"Has student already submitted?"}
    F -- "Yes" --> G["Dedicated 'Submitted' Screen displayed with score & timestamp"]
    F -- "No" --> H["Direct Assessment Solver Workspace opens"]
    H --> I["Writes code in Monaco Editor & runs against sample tests"]
    I --> J["Tests pass -> Student clicks 'Submit Assessment'"]
    J --> K["Code evaluated against hidden test cases"]
    K --> L["Submission recorded as 'SUBMITTED' & score finalized"]
    L --> M["Completion screen displayed: 'Your assessment is submitted!'"]
```

### Detailed Steps for Learners:
1. **Launching the Assessment**:
   - When revealed by the instructor, the learner sees the topic link in their Brightspace sidebar (e.g. `Midterm Python Assessment`).
   - Clicking the topic launches the tool directly inside the Brightspace Sequence Viewer iframe.
2. **Automated Direct Routing**:
   - Rather than landing on a generic homepage, the application detects `assignment_id` from the launch parameters.
   - The tool automatically bypasses container navigation and loads the dedicated **Learner Assignment Solver** for that specific assessment.
3. **Solving & Testing**:
   - The learner reads the problem description, constraints, and examples on the left panel.
   - Writes code in the Monaco Editor on the right panel.
   - Clicks **Run Code** to execute against visible sample test cases with standard input/output. Real-time stdout, stderr, execution time, and memory usage are shown.
4. **Final Submission**:
   - When satisfied, the student clicks **Submit Assessment**.
   - The system executes all test cases (both visible and hidden evaluation cases) via the sandboxed Piston engine.
   - The final score is recorded and status transitions to `SUBMITTED`.
5. **Submitted State Protection**:
   - Once submitted, if the student returns to the assessment link in Brightspace, the system detects their completed status.
   - Instead of re-opening the editable workspace, the branded completion screen is displayed:
     > 🎓 **Your assessment "[Assessment Title]" is submitted!**  
     > *Score: 100 / 100 • Status: Submitted • Submitted on Oct 16, 2026*
   - This prevents accidental re-submissions and provides immediate peace of mind to students.

---

## 6. Technical Flow & Key Mechanisms

### 1. LTI 1.3 Advantage Protocol Flow
1. **OIDC Login Initiation (`GET/POST /api/lti/login_initiations`)**:
   - Brightspace sends `iss`, `login_hint`, `target_link_uri`, and `client_id`.
   - The platform verifies parameters and redirects to `${iss}/d2l/lti/authenticate` with a signed state and nonce.
   - Any targeted `assignment_id` in query parameters or `target_link_uri` is captured and preserved in a secure cookie.
2. **LTI Launch (`POST /api/lti/launch`)**:
   - Brightspace returns an RSA-256 signed `id_token` (JWT).
   - The platform decodes claims:
     - `https://purl.imsglobal.org/spec/lti/claim/roles` ➔ Resolves Faculty vs. Learner.
     - `https://purl.imsglobal.org/spec/lti/claim/context` ➔ Identifies OrgUnit/Course.
     - `https://purl.imsglobal.org/spec/lti/claim/resource_link` ➔ Identifies link launch.
     - `assignment_id` ➔ Preserved and passed to frontend redirect.
   - Sets secure session cookies (`SameSite=None; Secure`) and redirects browser via HTTP 303 to `/compiler`.

### 2. Auto-Enrollment & Zero-Config Learner Sync
- In traditional tools, instructors must manually assign students to tests before they appear.
- Our platform implements **On-Demand Auto-Enrollment (`ensureAssignmentLearner`)**:
  - When a student launches from Brightspace, their user record and course enrollment are dynamically synced.
  - All published assessments in the course are immediately accessible to legitimate course learners, eliminating "No Assessment Found" zero-state bugs.

### 3. Sandboxed Code Execution (Piston Engine)
- Code submissions are executed inside isolated Docker containers with strict CPU time limits (default 5–10s) and memory caps (128–256 MB).
- Supports standard I/O redirection, handling complex algorithmic problems, infinite loop protection, and multi-file project structures.

### 4. Camera & Anti-Cheat Proctoring Engine (`useCameraProctoring` & `ProctoringPreCheckModal`)
- **Pre-Exam Camera Verification (`ProctoringPreCheckModal`)**:
  - Before entering a proctored assessment, learners must grant webcam permissions, preview their live video feed, and agree to academic integrity terms.
- **Continuous Webcam Monitoring & Snapshot Audits**:
  - Live video stream captures periodic high-resolution frame snapshots at configured intervals (default: every 30 seconds).
  - Snapshots are securely uploaded to `/api/proctoring` as tamper-evident evidence logs for instructor review.
- **Client-Side Anti-Cheat Guardrails**:
  - **Tab-Switch Detection**: Monitors when a student blurs or navigates away from the exam tab, logging automated violation warnings.
  - **Fullscreen Lock**: Enforces workspace fullscreen mode; exiting triggers immediate visual warnings and proctor flags.
  - **Clipboard Isolation**: Blocks external copy/paste inside the Monaco code editor to preserve assessment integrity.

---

## 7. Security, Iframe Compliance & Best Practices

1. **Iframe & Cross-Origin Security (`SameSite=None; Secure`)**:
   - Brightspace embeds external tools inside an `<iframe>`.
   - All session and contextual cookies are explicitly configured with `SameSite=None; Secure; Partitioned` so modern browsers (Chrome, Safari, Firefox) never drop authentication across origins.
2. **Canonical Domain Redirection**:
   - The launch handlers inspect reverse-proxy headers (`X-Forwarded-Host`, `X-Forwarded-Proto`) and enforce canonical public URLs (`https://learning.edutechcloud.com/compiler`), preventing broken redirects to `localhost:4000`.
3. **Integrity & Role Enforcement**:
   - API endpoints verify user roles (`x-user-role: FACULTY` / `LEARNER`) on every mutation. Students cannot edit questions, alter due dates, or view other students' submissions.

---

## 8. Deployment & Operational Checklist

### Server Environment Variables (`.env`):
```env
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://learning.edutechcloud.com/compiler
APP_DOMAIN=learning.edutechcloud.com

# Brightspace LTI 1.3
LTI_CLIENT_ID=your-brightspace-client-id
LTI_DEPLOYMENT_ID=your-deployment-id
LTI_TOKEN_URL=https://auth.brightspace.com/core/connect/token
LTI_KEYSET_URL=https://corplms.d2l-partners.brightspace.com/d2l/.well-known/jwks
LTI_TOOL_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Piston Engine
PISTON_API_URL=http://localhost:2000/api/v2
```

### Git & PM2 Management Commands:
```bash
# Push updates from local
git add .
git commit -m "feat: brightspace lti 1.3 deep assessment launch"
git push

# Deploy on remote server
git pull
pm2 restart edutech-compiler
```

---

*Document generated for EduTech Brightspace Integration Team. Version 2.4 — Updated October 2026.*


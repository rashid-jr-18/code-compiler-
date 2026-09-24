# API Documentation & D2L Brightspace LMS Integration Guide

This document provides an exhaustive reference of all application endpoints, role permissions, and the complete technical specification for integrating this compiler platform with **D2L Brightspace LMS** via **LTI 1.3 Advantage** and **Assignment & Grade Services (AGS) 2.0**.

---

## 1. System Architecture & Role Model Overview

The platform supports 3 primary operational roles:
1. **Administrator (`ADMIN`)**: Platform-wide settings, global question library management, user role assignments, and LTI registration configuration.
2. **Faculty (`FACULTY`)**: Course-scoped management. Faculty can:
   - Select questions from the library to configure course-specific **Assignments**.
   - Set start dates, due dates, and point allocations.
   - Inspect learner submissions, review run-time outputs and code.
   - Authoritatively review/approve grades.
   - **Trigger Brightspace Gradebook Passback** via AGS (LTI 1.3).
3. **Learner (`LEARNER`)**: Course-scoped assessment completion. Learners can:
   - View assigned assignments and deadlines.
   - Run sample test cases in the online Monaco code editor.
   - Submit solutions for automated server-side evaluation.
   - **Strict Architectural Rule**: Learner submissions are scored and stored in the internal database only. **Scores are NEVER automatically pushed to Brightspace upon learner submission.** Only Faculty can publish scores to the Brightspace Gradebook after review.

---

## 2. Complete API Catalog

| Method | Endpoint | Source File | Category | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LTI 1.3 & Brightspace** | | | | | |
| `GET` | `/api/lti/login_initiations` | `src/app/api/lti/login_initiations/route.ts` | LTI 1.3 | Public / Brightspace | OIDC Login Initiation endpoint. Validates `iss` and redirects to Brightspace auth. |
| `POST` | `/api/lti/launch` | `src/app/api/lti/launch/route.ts` | LTI 1.3 | Public / Brightspace | LTI 1.3 Launch handler. Verifies JWT signature, auto-provisions user/course/role, issues session cookie. |
| `GET` | `/api/lti/jwks` | `src/app/api/lti/jwks/route.ts` | LTI 1.3 | Public | Exposes public JSON Web Key Set (JWKS) for Brightspace to verify tool signatures. |
| `POST` | `/api/d2l/grade-passback` | `src/app/api/d2l/grade-passback/route.ts` | AGS Passback | Faculty / Admin | **Faculty-triggered** grade export to Brightspace Gradebook via LTI 1.3 AGS 2.0. |
| **Courses & Roster** | | | | | |
| `GET` | `/api/courses` | `src/app/api/courses/route.ts` | Courses | Authenticated | Lists courses accessible by the active user. |
| `POST` | `/api/courses` | `src/app/api/courses/route.ts` | Courses | Admin | Creates a new course and assigns instructor. |
| `GET` | `/api/courses/[id]` | `src/app/api/courses/[id]/route.ts` | Courses | Course Member | Fetches course details, instructor, and statistics. |
| `GET` | `/api/courses/[id]/members` | `src/app/api/courses/[id]/members/route.ts` | Courses | Course Member | Lists enrolled learners and instructors in the course. |
| `POST` | `/api/courses/[id]/members` | `src/app/api/courses/[id]/members/route.ts` | Courses | Faculty / Admin | Enrolls a user into the course. |
| **Assignments & Assessments** | | | | | |
| `GET` | `/api/assignments` | `src/app/api/assignments/route.ts` | Assignments | Course Member | Fetches assignments for a course (filtered by learner or instructor view). |
| `POST` | `/api/assignments` | `src/app/api/assignments/route.ts` | Assignments | Faculty / Admin | Creates a new course assessment with selected questions and point values. |
| `GET` | `/api/assignments/[id]` | `src/app/api/assignments/[id]/route.ts` | Assignments | Course Member | Returns assignment details. **Sanitizes hidden test cases for Learners**. |
| `POST` | `/api/assignments/[id]/submit` | `src/app/api/assignments/[id]/submit/route.ts` | Assessment | Learner | Submits code for authoritative evaluation against all test cases. Local save only. |
| `GET` | `/api/assignments/[id]/results` | `src/app/api/assignments/[id]/results/route.ts` | Assessment | Faculty / Admin | Retrieves all learner submissions, execution logs, and review statuses. |
| `POST` | `/api/assignments/[id]/results` | `src/app/api/assignments/[id]/results/route.ts` | Assessment | Faculty / Admin | Toggles manual review/approval status for a learner's submission. |
| **Question Library** | | | | | |
| `GET` | `/api/questions` | `src/app/api/questions/route.ts` | Problems | Authenticated | Retrieves reusable problem bank (with difficulty, tags, starter templates). |
| `POST` | `/api/questions` | `src/app/api/questions/route.ts` | Problems | Faculty / Admin | Creates a new reusable problem with public and hidden test cases. |
| `GET` | `/api/questions/[id]` | `src/app/api/questions/[id]/route.ts` | Problems | Authenticated | Gets question details. Strips hidden test cases if caller is a learner. |
| **Code Execution Engine** | | | | | |
| `POST` | `/api/code/run` | `src/app/api/code/run/route.ts` | Execution | Authenticated | Runs code against sample/custom inputs (safe practice runner). |
| `POST` | `/api/judge0/submissions` | `src/app/api/judge0/submissions/route.ts` | Judge0 / Local | Authenticated | Native async compiler & sandbox execution for 10 languages. |
| `GET` | `/api/judge0/submissions/[token]` | `src/app/api/judge0/submissions/[token]/route.ts` | Judge0 / Local | Authenticated | Polls status and output of a running execution. |
| `POST` | `/api/execute` | `src/app/api/execute/route.ts` | Execution | Authenticated | Synchronous native execution with timeout and security screening. |
| `ALL` | `/api/judge0/[...route]` | `src/app/api/judge0/[...route]/route.ts` | Judge0 Proxy | Authenticated | Reverse-proxy to external Judge0 instance when configured. |

---

## 3. Detailed Endpoint Specifications

### 3.1 Course Management

#### `GET /api/courses`
- **Description**: Returns all courses the current user has access to.
- **Headers**: `x-user-id: <string>`, `x-user-role: ADMIN | FACULTY | LEARNER`
- **Response** (`200 OK`):
```json
[
  {
    "id": "course-cs101",
    "name": "CS101: Introduction to Computer Science",
    "code": "CS101",
    "term": "Fall 2026",
    "facultyId": "user-faculty-1",
    "faculty": { "id": "user-faculty-1", "name": "Prof. Alan Turing", "email": "turing@university.edu" },
    "assignmentsCount": 2,
    "membersCount": 3
  }
]
```

#### `GET /api/courses/[id]/members`
- **Description**: Returns enrolled students and instructors for course `[id]`.
- **Response** (`200 OK`):
```json
[
  {
    "userId": "user-learner-1",
    "name": "Alice Johnson",
    "email": "alice@university.edu",
    "role": "LEARNER",
    "enrolledAt": "2026-09-01T00:00:00.000Z"
  }
]
```

---

### 3.2 Assignment & Assessment Endpoints

#### `POST /api/assignments`
- **Description**: Faculty creates a course-specific assessment.
- **Access**: `FACULTY` or `ADMIN`
- **Request Body**:
```json
{
  "title": "Assignment 1: Algorithms & Data Structures",
  "description": "Implement Two Sum and Palindrome Check in Python or Java",
  "courseId": "course-cs101",
  "dueDate": "2026-09-25T23:59:59.000Z",
  "maxMarks": 100,
  "questionIds": ["q-two-sum", "q-valid-palindrome"],
  "assignedLearnerIds": ["user-learner-1", "user-learner-2"]
}
```
- **Response** (`201 Created`):
```json
{
  "id": "assign-1741600000",
  "title": "Assignment 1: Algorithms & Data Structures",
  "courseId": "course-cs101",
  "status": "PUBLISHED",
  "questions": [
    { "questionId": "q-two-sum", "points": 50 },
    { "questionId": "q-valid-palindrome", "points": 50 }
  ]
}
```

#### `GET /api/assignments/[id]`
- **Description**: Retrieves assignment information.
- **Security Check**:
  - If requested by `LEARNER`, hidden test cases are stripped. Only `sampleInput` and `sampleOutput` are returned.
  - If requested by `FACULTY` or `ADMIN`, complete test cases (including hidden verification cases) are included.

#### `POST /api/assignments/[id]/submit`
- **Description**: Learner submits solution for evaluation.
- **Access**: `LEARNER` enrolled in the course.
- **Behavior**:
  1. Runs code against ALL test cases (public + hidden) using server-side sandbox.
  2. Calculates score based on weighted points.
  3. Records `AuthoritativeSubmission` record with breakdown.
  4. Updates learner status to `SUBMITTED`.
  5. **DOES NOT SEND GRADE TO BRIGHTSPACE.**
- **Request Body**:
```json
{
  "questionId": "q-two-sum",
  "code": "class Solution:\n    def twoSum(self, nums, target):\n        ...",
  "languageId": 71
}
```
- **Response** (`200 OK`):
```json
{
  "submissionId": "sub-1741604123",
  "status": "GRADED",
  "score": 50,
  "maxScore": 50,
  "passedTestCases": 3,
  "totalTestCases": 3,
  "executionTime": "0.042s",
  "testResults": [
    { "testCaseId": "tc-1", "passed": true, "isHidden": false },
    { "testCaseId": "tc-2", "passed": true, "isHidden": false },
    { "testCaseId": "tc-3", "passed": true, "isHidden": true }
  ]
}
```

#### `GET /api/assignments/[id]/results`
- **Description**: Faculty review dashboard. Lists all submissions with code, outputs, and review flags.
- **Access**: `FACULTY` or `ADMIN`
- **Response** (`200 OK`):
```json
[
  {
    "learnerId": "user-learner-1",
    "learnerName": "Alice Johnson",
    "learnerEmail": "alice@university.edu",
    "totalScore": 95,
    "maxScore": 100,
    "percentage": 95.0,
    "status": "SUBMITTED",
    "isReviewed": true,
    "gradeExported": false,
    "submissions": [
      {
        "questionId": "q-two-sum",
        "questionTitle": "Two Sum",
        "score": 50,
        "maxScore": 50,
        "languageId": 71,
        "code": "def twoSum(nums, target): ...",
        "submittedAt": "2026-09-10T14:30:00.000Z"
      }
    ]
  }
]
```

---

## 4. Brightspace LTI 1.3 & AGS Integration

### 4.1 Handshake & Security Workflow

```
+---------------------------+                        +----------------------------------+
|   D2L Brightspace (LMS)   |                        |   Brightspace Compiler (App)     |
+---------------------------+                        +----------------------------------+
              |                                                        |
              | 1. Student / Faculty clicks tool link in Brightspace   |
              | -----------------------------------------------------> | GET /api/lti/login_initiations
              |                                                        | (Validates iss & client_id)
              | 2. Redirects to Brightspace Authorization Server       |
              | <----------------------------------------------------- |
              |                                                        |
              | 3. Posts signed id_token (OIDC Launch)                 |
              | -----------------------------------------------------> | POST /api/lti/launch
              |                                                        | (Verifies JWT signature via JWKS)
              |                                                        | (Extracts User ID, Course, Roles)
              |                                                        | (Sets secure session cookie)
              |                                                        |
              | 4. Student solves coding assignment                    |
              |    Runs sample tests & submits solution                |
              |    Internal database grades and saves submission       |
              |    *** NO GRADE SENT TO BRIGHTSPACE ***                |
              |                                                        |
              | 5. Faculty reviews results & verifies learner code     |
              |    Faculty clicks [Export to Brightspace]              |
              | -----------------------------------------------------> | POST /api/d2l/grade-passback
              |                                                        |
              | 6. Server requests OAuth 2.0 Access Token via JWT      |
              | <----------------------------------------------------- | POST https://auth.brightspace.com/core/connect/token
              | 7. Returns Bearer Access Token (AGS Scopes)            |
              | -----------------------------------------------------> |
              |                                                        |
              | 8. Passes grade via Assignment & Grade Services (AGS)  |
              | <----------------------------------------------------- | POST /d2l/api/lti/ags/2.0/lineitems/{id}/scores
              | 9. 200 OK - Grade registered in Brightspace Gradebook  |
              | -----------------------------------------------------> |
```

---

### 4.2 Brightspace LTI Endpoints

#### Endpoint 1: OIDC Login Initiations
- **Endpoint**: `GET /api/lti/login_initiations`
- **File**: `src/app/api/lti/login_initiations/route.ts`
- **Role**: Entry point when user clicks the external tool in Brightspace.
- **Query Parameters Received from Brightspace**:
  - `iss`: Issuer identifier (e.g. `https://auth.brightspace.com`)
  - `login_hint`: Brightspace user session identifier
  - `target_link_uri`: Destination URL
  - `client_id`: OAuth Client ID
  - `lti_deployment_id`: Brightspace Deployment ID
- **Action**: Generates cryptographic `state` and `nonce`, cookies them, and redirects user to Brightspace's OIDC authorization endpoint.

#### Endpoint 2: LTI 1.3 Launch Handler
- **Endpoint**: `POST /api/lti/launch`
- **File**: `src/app/api/lti/launch/route.ts`
- **Role**: Receives OIDC `id_token` POSTed by Brightspace.
- **Validation**:
  - Validates `state` against cookie to block CSRF attacks.
  - Fetches Brightspace Keyset (`/d2l/api/lti/v13/jwks`) and verifies token signature using RSA SHA-256 (`RS256`).
  - Validates `iss`, `aud`, `exp`, and `nonce`.
- **Claim Extraction**:
  - Role: Inspects `https://purl.imsglobal.org/spec/lti/claim/roles` (maps `#Instructor` to `FACULTY`, `#Learner` to `LEARNER`).
  - Course Context: Inspects `https://purl.imsglobal.org/spec/lti/claim/context`.
  - Gradebook AGS Endpoint: Inspects `https://purl.imsglobal.org/spec/lti-ags/claim/endpoint`.
- **Action**: Auto-provisions user and course in local database, sets session cookie, and redirects user directly to their assigned course assessment workspace.

#### Endpoint 3: Public Keyset (JWKS)
- **Endpoint**: `GET /api/lti/jwks`
- **File**: `src/app/api/lti/jwks/route.ts`
- **Role**: Public key endpoint registered in Brightspace to verify assertions created by this tool.
- **Format** (`RFC 7517`):
```json
{
  "keys": [
    {
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "kid": "brightspace-compiler-key-1",
      "n": "<base64url-modulus>",
      "e": "AQAB"
    }
  ]
}
```

#### Endpoint 4: Faculty Gradebook Passback (AGS)
- **Endpoint**: `POST /api/d2l/grade-passback`
- **File**: `src/app/api/d2l/grade-passback/route.ts`
- **Role**: **Strictly Faculty/Admin only**. Posts final validated scores into Brightspace Gradebook.
- **Request Body**:
```json
{
  "assignmentId": "assign-1",
  "learnerId": "user-learner-1",
  "score": 95,
  "maxScore": 100,
  "comment": "All 10 unit tests passed. Code verified by instructor."
}
```
- **Brightspace AGS Outgoing Request**:
  - Method: `POST`
  - URL: `https://<brightspace-domain>/d2l/api/lti/ags/2.0/lineitems/{lineItemId}/scores`
  - Headers:
    ```http
    Authorization: Bearer <Brightspace_AGS_OAuth_Token>
    Content-Type: application/vnd.ims.lis.v1.score+json
    ```
  - Payload:
    ```json
    {
      "timestamp": "2026-09-10T16:45:00.000Z",
      "scoreGiven": 95,
      "scoreMaximum": 100,
      "comment": "All 10 unit tests passed. Code verified by instructor.",
      "activityProgress": "Completed",
      "gradingProgress": "FullyGraded",
      "userId": "12345"
    }
    ```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Grade successfully posted to Brightspace Gradebook",
  "data": {
    "learnerId": "user-learner-1",
    "scoreGiven": 95,
    "scoreMaximum": 100,
    "exportedAt": "2026-09-10T16:45:02.120Z"
  }
}
```

---

## 5. Brightspace Admin Configuration Steps

To register this application in D2L Brightspace:

1. Log in as an Administrator in **D2L Brightspace**.
2. Navigate to **Admin Tools** (gear icon) -> **Manage Extensibility** -> **LTI Advantage**.
3. Click **Register Tool** and select **Standard Registration**:
   - **Name**: `EduTech Code Compiler`
   - **Domain**: `https://your-server-domain.com`
   - **Redirect URLs**: `https://your-server-domain.com/api/lti/launch`
   - **OpenID Connect Initiation URL**: `https://your-server-domain.com/api/lti/login_initiations`
   - **Keyset URL**: `https://your-server-domain.com/api/lti/jwks`
   - **Extensions**: Select both:
     - `Assignment and Grade Services (AGS)`
     - `Names and Role Provisioning Services (NRPS)`
4. Save the tool registration. Brightspace will generate:
   - `Client ID`
   - `Brightspace Keyset URL`
   - `Brightspace OAuth2 Access Token URL`
5. Click **View Deployments** -> **New Deployment**:
   - Select the registered tool.
   - Set **Status** to `Active`.
   - Under **Extensions**, ensure **Assignment and Grade Services** is checked.
   - Under **Security Settings**, check:
     - `Share user name with tool provider`
     - `Share user email with tool provider`
     - `Share link information with tool provider`
   - Select which Org Units / Courses can use the tool.
   - Note down the generated **`Deployment ID`**.
6. Create an **External Learning Tool Link**:
   - URL: `https://your-server-domain.com`
   - Type: `LTI 1.3`
   - Place this link within a Course Module under **Content**.

---

## 6. Server Environment Variables

Create or update `.env.local` on the production server:

```ini
# ==========================================
# 1. APPLICATION ENVIRONMENT
# ==========================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL="https://your-server-domain.com"

# ==========================================
# 2. POSTGRESQL DATABASE (PRISMA)
# ==========================================
DATABASE_URL="postgresql://dbuser:StrongPassword@db-host.com:5432/brightspace_compiler?schema=public"

# ==========================================
# 3. D2L BRIGHTSPACE LTI 1.3 CREDENTIALS
# ==========================================
LTI_CLIENT_ID="<client-id-from-brightspace>"
LTI_DEPLOYMENT_ID="<deployment-id-from-brightspace>"
LTI_ISSUER="https://auth.brightspace.com"
LTI_KEYSET_URL="https://<your-institution>.brightspace.com/d2l/api/lti/v13/jwks"
LTI_TOKEN_URL="https://auth.brightspace.com/core/connect/token"

# RSA Private Key for Signing Tool Assertions (PEM format)
LTI_TOOL_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
LTI_TOOL_KEY_ID="brightspace-compiler-key-1"

# ==========================================
# 4. CODE EXECUTION (JUDGE0 / LOCAL)
# ==========================================
# Leave empty to use native local compilation across 10 languages
# Or provide external Judge0 URL if running standalone Judge0 cluster
NEXT_PUBLIC_JUDGE0_URL=""
```

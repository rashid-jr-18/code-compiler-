export interface Language {
  id: number;
  name: string;
  mime: string;
  extension: string;
  defaultCode: string;
}

export interface ExecutionResult {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string;
  memory?: number;
  status: {
    id: number;
    description: string;
  };
}

export interface SubmissionResponse {
  token: string;
}


export interface PistonFile {
  name?: string;
  content: string;
  encoding?: string;
}

export interface PistonExecuteRequest {
  language: string;
  version?: string;
  files: PistonFile[];
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface PistonStageResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string | null;
}

export interface PistonExecuteResponse {
  language: string;
  version: string;
  run: PistonStageResult;
  compile?: PistonStageResult;
}

export interface PistonConfig {
  apiUrl: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  points: number;
  description?: string;
  isHidden?: boolean;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  supportedLanguages: number[]; // Language IDs
  testCases: TestCase[];
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
  sampleInput?: string;
  sampleOutput?: string;
  hints?: string[];
  tags?: string[];
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime?: number;
  memoryUsed?: number;
  error?: string;
  points: number;
  maxPoints: number;
}

export interface SubmissionResult {
  questionId: string;
  languageId: number;
  code: string;
  totalScore: number;
  maxScore: number;
  passedTests: number;
  totalTests: number;
  testResults: TestResult[];
  overallStatus: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  submittedAt: Date;
  d2lSubmissionId?: string;
  d2lGradeItemId?: string;
  gradeSentToD2L?: boolean;
}

export type Submission = SubmissionResult;

export interface D2LGradePassbackData {
  userId: string;
  gradeItemId: string;
  score: number;
  maxScore: number;
  submissionId: string;
  timestamp: Date;
}

export interface ProblemLibraryFilter {
  categories: string[];
  difficulties: ('Easy' | 'Medium' | 'Hard')[];
  tags: string[];
  languages: number[];
  searchQuery: string;
  sortBy: 'title' | 'difficulty' | 'category' | 'createdAt' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

export type QuestionFilter = ProblemLibraryFilter;

export interface AssignmentContext {
  isD2LAssignment: boolean;
  d2lUserId?: string;
  d2lCourseId?: string;
  d2lAssignmentId?: string;
  d2lGradeItemId?: string;
  maxAttempts?: number;
  currentAttempt?: number;
  dueDate?: Date;
  allowLateSubmission?: boolean;
}

export interface QuizContext {
  isD2LQuiz: boolean;
  d2lUserId?: string;
  d2lCourseId?: string;
  d2lQuizId?: string;
  timeLimit?: number;
  startTime?: Date;
  maxAttempts?: number;
  currentAttempt?: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  darkMode: boolean;
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface AdminSettings {
  platformName: string;
  logo?: string;
  favicon?: string;
  welcomeMessage: string;
  footerText: string;
  enableRegistration: boolean;
  enableGuestMode: boolean;
  maxExecutionTime: number;
  maxMemoryLimit: number;
  maxCodeLength: number;
  enableAnalytics: boolean;
  analyticsProvider?: 'google' | 'mixpanel' | 'custom';
  analyticsId?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  supportEmail: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  enableD2LIntegration: boolean;
  d2lClientId?: string;
  d2lClientSecret?: string;
  d2lInstanceUrl?: string;
  enableAutoGrading: boolean;
  gradingWebhookUrl?: string;
  enableNotifications: boolean;
  emailProvider?: 'smtp' | 'sendgrid' | 'mailgun';
  emailSettings?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    from?: string;
  };
  institutionPolicy?: InstitutionPolicy;
}

export interface InstitutionPolicy {
  allowCameraProctoring: boolean;
  allowKioskMode: boolean;
  allowAutoSubmit: boolean;
  minViolationLimit: number;
  allowCopyPaste: boolean;
}

export interface ProctoringConfig {
  enableCamera: boolean;
  enableKiosk: boolean;
  violationLimit: number;
  actionOnLimit: 'AUTO_SUBMIT' | 'FLAG_REVIEW' | 'WARN_ONLY';
  snapshotIntervalSeconds?: number;
}

export type ProctoringEventType =
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'COPY_PASTE_ATTEMPT'
  | 'WINDOW_BLUR'
  | 'PERIODIC_SNAPSHOT'
  | 'CAMERA_OFFLINE'
  | 'MULTIPLE_FACES'
  | 'NO_FACE_DETECTED';

export interface ProctoringEvent {
  id: string;
  sessionId: string;
  assignmentId: string;
  learnerId: string;
  eventType: ProctoringEventType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  evidenceImageUrl?: string;
  notes?: string;
  reviewStatus?: 'PENDING' | 'CONFIRMED' | 'DISMISSED';
}

export interface ProctoringSession {
  id: string;
  assignmentId: string;
  learnerId: string;
  startedAt: string;
  endedAt?: string;
  consentAcceptedAt: string;
  totalViolations: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED_FOR_REVIEW' | 'AUTO_SUBMITTED';
  events: ProctoringEvent[];
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canManageProblems: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------------------------------
// LTI 1.3 Advantage & Course Architecture Models
// -------------------------------------------------------------

export type AppRole = 'ADMIN' | 'FACULTY' | 'LEARNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  ltiSubject?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Course {
  id: string;
  title: string;
  code?: string;
  term?: string;
  facultyId?: string;
  ltiContextId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CourseMember {
  id: string;
  courseId: string;
  userId: string;
  role: 'FACULTY' | 'LEARNER';
  user?: User;
  createdAt?: Date | string;
}

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface AssignmentQuestion {
  id: string;
  assignmentId: string;
  questionId: string;
  points: number;
  order: number;
  question?: Question;
}

export type AssignmentLearnerStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED' | 'EXPORTED';
export type PassbackStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface AssignmentLearner {
  id: string;
  assignmentId: string;
  learnerId: string;
  status: AssignmentLearnerStatus;
  score: number;
  reviewed: boolean;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  exported: boolean;
  exportedAt?: Date | string;
  exportedBy?: string;
  passbackStatus?: PassbackStatus;
  passbackError?: string;
  learner?: User;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AssessmentContainer {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  resourceLinkId?: string;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Assignment {
  id: string;
  containerId?: string;
  courseId: string;
  title: string;
  instructions: string;
  maxPoints: number;
  startDate?: Date | string;
  dueDate: Date | string;
  createdBy: string;
  status: AssignmentStatus;
  resourceLinkId?: string;
  lineItemUrl?: string;
  proctoringConfig?: ProctoringConfig;
  questions: AssignmentQuestion[];
  learners?: AssignmentLearner[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AuthoritativeSubmission {
  id: string;
  assignmentId: string;
  questionId: string;
  learnerId: string;
  code: string;
  languageId: number;
  status: string;
  score: number;
  submittedAt: Date | string;
  testResults: TestResult[];
}

// -------------------------------------------------------------
// Streak & Activity Tracking (LeetCode style)
// -------------------------------------------------------------

export interface UserStreak {
  userId: string;
  currentStreak: number;
  maxStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalSolved: number;
  totalSubmissions: number;
  activityDates: Record<string, number>; // date -> count of executions/submissions
}

// -------------------------------------------------------------
// Course Community & Discussion Forum Models
// -------------------------------------------------------------

export interface CommunityPost {
  id: string;
  courseId: string;
  questionId?: string;
  questionTitle?: string;
  authorId: string;
  authorName: string;
  authorRole: 'FACULTY' | 'LEARNER' | 'ADMIN';
  title: string;
  content: string;
  codeSnippet?: string;
  language?: string;
  tags: string[];
  upvotes: string[]; // userIds who upvoted
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: 'FACULTY' | 'LEARNER' | 'ADMIN';
  content: string;
  codeSnippet?: string;
  language?: string;
  isAccepted?: boolean;
  upvotes: string[];
  createdAt: string;
}

// -------------------------------------------------------------
// Detailed Learner Profile & Analytics Models
// -------------------------------------------------------------

export interface UserCodingStats {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'LEARNER';
  classRank?: number;
  totalCourseLearners?: number;
  streak: UserStreak;
  solvedBreakdown: {
    totalSolved: number;
    totalProblems: number;
    easySolved: number;
    totalEasy: number;
    mediumSolved: number;
    totalMedium: number;
    hardSolved: number;
    totalHard: number;
    databaseSolved: number;
    totalDatabase: number;
    attemptingCount: number;
  };
  recentSubmissions: {
    id: string;
    questionId: string;
    questionTitle: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    language: string;
    status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | string;
    score: number;
    maxScore: number;
    submittedAt: string;
  }[];
  communityEngagement: {
    postsCount: number;
    repliesCount: number;
    acceptedAnswersCount: number;
    upvotesReceived: number;
  };
}



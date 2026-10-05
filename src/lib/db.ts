// Centralized Persistent Data Layer for EduTech Compiler
// Provides local file-backed JSON database with full schema preservation across restarts,
// perfectly mirroring the production PostgreSQL Prisma structure.

import fs from 'fs';
import path from 'path';
import {
  User,
  Course,
  CourseMember,
  Question,
  TestCase,
  AssessmentContainer,
  Assignment,
  AssignmentQuestion,
  AssignmentLearner,
  AuthoritativeSubmission,
  TestResult,
  UserStreak,
  CommunityPost,
  CommunityReply,
  UserCodingStats,
  ProctoringSession,
  ProctoringEvent
} from '@/types';
import { sampleQuestions } from '@/store/questionStore';

interface StoredDbSchema {
  users: User[];
  courses: Course[];
  courseMembers: CourseMember[];
  questions: Question[];
  containers?: AssessmentContainer[];
  assignments: Assignment[];
  assignmentLearners: AssignmentLearner[];
  submissions: AuthoritativeSubmission[];
  streaks?: UserStreak[];
  communityPosts?: CommunityPost[];
  communityReplies?: CommunityReply[];
  proctoringSessions?: ProctoringSession[];
}

class PersistentDatabase {
  users: Map<string, User> = new Map();
  courses: Map<string, Course> = new Map();
  courseMembers: Map<string, CourseMember> = new Map();
  questions: Map<string, Question> = new Map();
  containers: Map<string, AssessmentContainer> = new Map();
  assignments: Map<string, Assignment> = new Map();
  assignmentLearners: Map<string, AssignmentLearner> = new Map();
  submissions: Map<string, AuthoritativeSubmission> = new Map();
  streaks: Map<string, UserStreak> = new Map();
  communityPosts: Map<string, CommunityPost> = new Map();
  communityReplies: Map<string, CommunityReply> = new Map();
  proctoringSessions: Map<string, ProctoringSession> = new Map();

  private dbPath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        console.warn('[DB] Could not create data directory, running in-memory fallback:', e);
      }
    }
    this.dbPath = path.join(dataDir, 'local_db.json');
    this.init();
  }

  private init() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const data: StoredDbSchema = JSON.parse(raw);
        (data.users || []).forEach(u => this.users.set(u.id, u));
        (data.courses || []).forEach(c => this.courses.set(c.id, c));
        (data.courseMembers || []).forEach(cm => this.courseMembers.set(cm.id, cm));
        (data.questions || []).forEach(q => this.questions.set(q.id, q));
        (data.containers || []).forEach(c => this.containers.set(c.id, c));
        (data.assignments || []).forEach(a => this.assignments.set(a.id, a));
        (data.assignmentLearners || []).forEach(al => this.assignmentLearners.set(al.id, al));
        (data.submissions || []).forEach(s => this.submissions.set(s.id, s));
        (data.streaks || []).forEach(st => this.streaks.set(st.userId, st));
        (data.communityPosts || []).forEach(cp => this.communityPosts.set(cp.id, cp));
        (data.communityReplies || []).forEach(cr => this.communityReplies.set(cr.id, cr));
        (data.proctoringSessions || []).forEach(ps => this.proctoringSessions.set(ps.id, ps));

        // Ensure default container exists if upgrading from previous db schema
        if (this.containers.size === 0 && this.courses.has('crs_cs101')) {
          const defaultContainer: AssessmentContainer = {
            id: 'cnt_cs101_default',
            courseId: 'crs_cs101',
            name: 'Programming',
            description: 'Core programming assessments and practical challenges',
            resourceLinkId: 'd2l_resource_link_cs101_1',
            createdBy: 'usr_faculty',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.containers.set(defaultContainer.id, defaultContainer);
          // Link unassigned CS101 assignments to this container
          this.assignments.forEach(asg => {
            if (asg.courseId === 'crs_cs101' && !asg.containerId) {
              asg.containerId = defaultContainer.id;
            }
          });
          this.persist();
        }

        // Seed initial community discussions if empty
        if (this.communityPosts.size === 0) {
          this.seedInitialCommunity();
          this.persist();
        }

        console.log(`[Local DB] Successfully loaded persistent database from ${this.dbPath} (${this.users.size} users, ${this.courses.size} courses, ${this.containers.size} containers, ${this.questions.size} problems, ${this.communityPosts.size} discussions, ${this.proctoringSessions.size} proctoring sessions)`);
        return;
      } catch (err) {
        console.error('[Local DB] Error reading local_db.json, re-seeding default database:', err);
      }
    }

    // Seed default dataset with 10 users and 2 courses
    this.seedDefaultDataset();
    this.seedInitialCommunity();
    this.persist();
  }

  private persist() {
    try {
      const data: StoredDbSchema = {
        users: Array.from(this.users.values()),
        courses: Array.from(this.courses.values()),
        courseMembers: Array.from(this.courseMembers.values()),
        questions: Array.from(this.questions.values()),
        containers: Array.from(this.containers.values()),
        assignments: Array.from(this.assignments.values()),
        assignmentLearners: Array.from(this.assignmentLearners.values()),
        submissions: Array.from(this.submissions.values()),
        streaks: Array.from(this.streaks.values()),
        communityPosts: Array.from(this.communityPosts.values()),
        communityReplies: Array.from(this.communityReplies.values()),
        proctoringSessions: Array.from(this.proctoringSessions.values())
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Local DB] Failed to save database to disk:', err);
    }
  }

  private seedDefaultDataset() {
    const now = new Date().toISOString();

    // ==========================================
    // 1. SEED 10 USERS (1 Admin, 2 Faculty, 7 Students)
    // ==========================================
    const usersList: User[] = [
      // 1. Admin
      {
        id: 'usr_admin',
        name: 'System Administrator',
        email: 'admin@edutech.edu',
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now
      },
      // 2. Faculty 1 (CS101 Lead)
      {
        id: 'usr_faculty',
        name: 'Prof. Alan Turing',
        email: 'turing@faculty.edutech.edu',
        role: 'FACULTY',
        ltiSubject: 'd2l_faculty_turing_101',
        createdAt: now,
        updatedAt: now
      },
      // 3. Faculty 2 (CS202 Lead)
      {
        id: 'usr_faculty_lovelace',
        name: 'Prof. Ada Lovelace',
        email: 'lovelace@faculty.edutech.edu',
        role: 'FACULTY',
        ltiSubject: 'd2l_faculty_lovelace_202',
        createdAt: now,
        updatedAt: now
      },
      // 4. Learner 1 (Enrolled in CS101 & CS202)
      {
        id: 'usr_student_alice',
        name: 'Alice Johnson',
        email: 'alice@student.edutech.edu',
        role: 'LEARNER',
        ltiSubject: 'd2l_learner_alice_01',
        createdAt: now,
        updatedAt: now
      },
      // 5. Learner 2 (Enrolled in CS101)
      {
        id: 'usr_student_bob',
        name: 'Bob Williams',
        email: 'bob@student.edutech.edu',
        role: 'LEARNER',
        ltiSubject: 'd2l_learner_bob_02',
        createdAt: now,
        updatedAt: now
      },
      // 6. Learner 3 (Enrolled in CS101)
      {
        id: 'usr_student_charlie',
        name: 'Charlie Brown',
        email: 'charlie@student.edutech.edu',
        role: 'LEARNER',
        ltiSubject: 'd2l_learner_charlie_03',
        createdAt: now,
        updatedAt: now
      },
      // 7. Learner 4 (Enrolled in CS101)
      {
        id: 'usr_student_david',
        name: 'David Miller',
        email: 'david@student.edutech.edu',
        role: 'LEARNER',
        ltiSubject: 'd2l_learner_david_04',
        createdAt: now,
        updatedAt: now
      },
      // 8. Learner 5 (Enrolled in CS202)
      {
        id: 'usr_student_emma',
        name: 'Emma Watson',
        email: 'emma@student.edutech.edu',
        role: 'LEARNER',
        ltiSubject: 'd2l_learner_emma_05',
        createdAt: now,
        updatedAt: now
      },
      // 9. Learner 6 (Enrolled in CS202)
      {
        id: 'usr_student_frank',
        name: 'Frank Castle',
        email: 'frank@student.edutech.edu',
        role: 'LEARNER',
        ltiSubject: 'd2l_learner_frank_06',
        createdAt: now,
        updatedAt: now
      },
      // 10. Learner 7 (Enrolled in CS202)
      {
        id: 'usr_student_grace',
        name: 'Grace Hopper',
        email: 'grace@student.edutech.edu',
        role: 'LEARNER',
        ltiSubject: 'd2l_learner_grace_07',
        createdAt: now,
        updatedAt: now
      }
    ];

    usersList.forEach(u => this.users.set(u.id, u));

    // ==========================================
    // 2. SEED 2 DISTINCT COURSES
    // ==========================================
    const course101: Course = {
      id: 'crs_cs101',
      title: 'CS101: Introduction to Programming & Python',
      code: 'CS101',
      term: 'Fall 2026',
      facultyId: 'usr_faculty',
      ltiContextId: 'd2l_course_cs101_ctx',
      createdAt: now,
      updatedAt: now
    };

    const course202: Course = {
      id: 'crs_cs202',
      title: 'CS202: Data Structures & Algorithms',
      code: 'CS202',
      term: 'Fall 2026',
      facultyId: 'usr_faculty_lovelace',
      ltiContextId: 'd2l_course_cs202_ctx',
      createdAt: now,
      updatedAt: now
    };

    this.courses.set(course101.id, course101);
    this.courses.set(course202.id, course202);

    // ==========================================
    // 3. COURSE MEMBERSHIPS (All 7 Learners enrolled in both courses)
    // ==========================================
    // Course 1 Members: Prof. Turing + 7 Learners
    this.courseMembers.set('cm_101_fac', { id: 'cm_101_fac', courseId: course101.id, userId: 'usr_faculty', role: 'FACULTY', user: this.users.get('usr_faculty') });
    this.courseMembers.set('cm_101_alice', { id: 'cm_101_alice', courseId: course101.id, userId: 'usr_student_alice', role: 'LEARNER', user: this.users.get('usr_student_alice') });
    this.courseMembers.set('cm_101_bob', { id: 'cm_101_bob', courseId: course101.id, userId: 'usr_student_bob', role: 'LEARNER', user: this.users.get('usr_student_bob') });
    this.courseMembers.set('cm_101_charlie', { id: 'cm_101_charlie', courseId: course101.id, userId: 'usr_student_charlie', role: 'LEARNER', user: this.users.get('usr_student_charlie') });
    this.courseMembers.set('cm_101_david', { id: 'cm_101_david', courseId: course101.id, userId: 'usr_student_david', role: 'LEARNER', user: this.users.get('usr_student_david') });
    this.courseMembers.set('cm_101_emma', { id: 'cm_101_emma', courseId: course101.id, userId: 'usr_student_emma', role: 'LEARNER', user: this.users.get('usr_student_emma') });
    this.courseMembers.set('cm_101_frank', { id: 'cm_101_frank', courseId: course101.id, userId: 'usr_student_frank', role: 'LEARNER', user: this.users.get('usr_student_frank') });
    this.courseMembers.set('cm_101_grace', { id: 'cm_101_grace', courseId: course101.id, userId: 'usr_student_grace', role: 'LEARNER', user: this.users.get('usr_student_grace') });

    // Course 2 Members: Prof. Lovelace + 7 Learners
    this.courseMembers.set('cm_202_fac', { id: 'cm_202_fac', courseId: course202.id, userId: 'usr_faculty_lovelace', role: 'FACULTY', user: this.users.get('usr_faculty_lovelace') });
    this.courseMembers.set('cm_202_alice', { id: 'cm_202_alice', courseId: course202.id, userId: 'usr_student_alice', role: 'LEARNER', user: this.users.get('usr_student_alice') });
    this.courseMembers.set('cm_202_bob', { id: 'cm_202_bob', courseId: course202.id, userId: 'usr_student_bob', role: 'LEARNER', user: this.users.get('usr_student_bob') });
    this.courseMembers.set('cm_202_charlie', { id: 'cm_202_charlie', courseId: course202.id, userId: 'usr_student_charlie', role: 'LEARNER', user: this.users.get('usr_student_charlie') });
    this.courseMembers.set('cm_202_david', { id: 'cm_202_david', courseId: course202.id, userId: 'usr_student_david', role: 'LEARNER', user: this.users.get('usr_student_david') });
    this.courseMembers.set('cm_202_emma', { id: 'cm_202_emma', courseId: course202.id, userId: 'usr_student_emma', role: 'LEARNER', user: this.users.get('usr_student_emma') });
    this.courseMembers.set('cm_202_frank', { id: 'cm_202_frank', courseId: course202.id, userId: 'usr_student_frank', role: 'LEARNER', user: this.users.get('usr_student_frank') });
    this.courseMembers.set('cm_202_grace', { id: 'cm_202_grace', courseId: course202.id, userId: 'usr_student_grace', role: 'LEARNER', user: this.users.get('usr_student_grace') });

    // ==========================================
    // 4. PROBLEM LIBRARY QUESTIONS
    // ==========================================
    const q1: Question = {
      id: 'q_two_sum',
      title: 'Two Sum',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
      difficulty: 'Easy',
      category: 'Arrays & Hashing',
      supportedLanguages: [71, 63, 62, 54, 50],
      timeLimit: 3,
      memoryLimit: 128,
      sampleInput: '[2,7,11,15]\n9',
      sampleOutput: '[0, 1]',
      testCases: [
        { id: 'tc_1', input: '[2,7,11,15]\n9', expectedOutput: '[0, 1]', points: 15, isHidden: false },
        { id: 'tc_2', input: '[3,2,4]\n6', expectedOutput: '[1, 2]', points: 15, isHidden: false },
        { id: 'tc_3', input: '[3,3]\n6', expectedOutput: '[0, 1]', points: 20, isHidden: true }
      ],
      createdAt: now,
      updatedAt: now
    };

    const q2: Question = {
      id: 'q_palindrome',
      title: 'Palindrome Number',
      description: 'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.',
      difficulty: 'Easy',
      category: 'Math',
      supportedLanguages: [71, 63, 62, 54, 50],
      timeLimit: 2,
      memoryLimit: 64,
      sampleInput: '121',
      sampleOutput: 'true',
      testCases: [
        { id: 'tc_4', input: '121', expectedOutput: 'true', points: 15, isHidden: false },
        { id: 'tc_5', input: '-121', expectedOutput: 'false', points: 15, isHidden: false },
        { id: 'tc_6', input: '10', expectedOutput: 'false', points: 20, isHidden: true }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.questions.set(q1.id, q1);
    this.questions.set(q2.id, q2);

    // Seed rich questions from questionStore
    sampleQuestions.forEach(sq => {
      const qId = sq.id.startsWith('q_') ? sq.id : `q_${sq.id}`;
      if (!this.questions.has(qId) && !this.questions.has(sq.id)) {
        const testCasesWithHidden = sq.testCases.map((tc, idx) => ({
          ...tc,
          id: tc.id || `tc_${qId}_${idx + 1}`,
          isHidden: tc.isHidden ?? (idx >= 2)
        }));

        this.questions.set(qId, {
          ...sq,
          id: qId,
          testCases: testCasesWithHidden,
          createdAt: typeof sq.createdAt === 'string' ? sq.createdAt : now,
          updatedAt: typeof sq.updatedAt === 'string' ? sq.updatedAt : now
        });
      }
    });

    // ==========================================
    // 5. SEED INITIAL CONTAINERS & ASSIGNMENTS
    // ==========================================
    const cnt1: AssessmentContainer = {
      id: 'cnt_cs101_default',
      courseId: course101.id,
      name: 'Programming',
      description: 'Core programming assessments and practical challenges',
      resourceLinkId: 'd2l_resource_link_cs101_1',
      createdBy: 'usr_faculty',
      createdAt: now,
      updatedAt: now
    };
    this.containers.set(cnt1.id, cnt1);

    // Course 1 Assignment
    const asg1: Assignment = {
      id: 'asg_cs101_a1',
      containerId: cnt1.id,
      courseId: course101.id,
      title: 'CS101 Assignment 1: Python Basics & Math',
      instructions: 'Solve the two programming problems provided. Test your solutions against the sample cases before final submission.',
      maxPoints: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'usr_faculty',
      status: 'PUBLISHED',
      resourceLinkId: 'd2l_resource_link_cs101_1',
      lineItemUrl: 'https://brightspace.institution.edu/d2l/api/lti/ags/2.0/lineitems/li_cs101_1',
      questions: [
        { id: 'aq_101_1', assignmentId: 'asg_cs101_a1', questionId: q1.id, points: 50, order: 1, question: q1 },
        { id: 'aq_101_2', assignmentId: 'asg_cs101_a1', questionId: q2.id, points: 50, order: 2, question: q2 }
      ],
      createdAt: now,
      updatedAt: now
    };
    this.assignments.set(asg1.id, asg1);

    // Initial student states in Course 1 (All 7 Learners)
    this.assignmentLearners.set('al_101_alice', {
      id: 'al_101_alice',
      assignmentId: asg1.id,
      learnerId: 'usr_student_alice',
      status: 'SUBMITTED',
      score: 100,
      reviewed: true,
      reviewedAt: now,
      reviewedBy: 'usr_faculty',
      exported: false,
      learner: this.users.get('usr_student_alice'),
      createdAt: now
    });

    this.assignmentLearners.set('al_101_bob', {
      id: 'al_101_bob',
      assignmentId: asg1.id,
      learnerId: 'usr_student_bob',
      status: 'SUBMITTED',
      score: 70,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_bob'),
      createdAt: now
    });

    this.assignmentLearners.set('al_101_charlie', {
      id: 'al_101_charlie',
      assignmentId: asg1.id,
      learnerId: 'usr_student_charlie',
      status: 'SUBMITTED',
      score: 50,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_charlie'),
      createdAt: now
    });

    this.assignmentLearners.set('al_101_david', {
      id: 'al_101_david',
      assignmentId: asg1.id,
      learnerId: 'usr_student_david',
      status: 'ASSIGNED',
      score: 0,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_david'),
      createdAt: now
    });

    this.assignmentLearners.set('al_101_emma', {
      id: 'al_101_emma',
      assignmentId: asg1.id,
      learnerId: 'usr_student_emma',
      status: 'EXPORTED',
      score: 80,
      reviewed: true,
      reviewedAt: now,
      reviewedBy: 'usr_faculty',
      exported: true,
      exportedAt: now,
      exportedBy: 'usr_faculty',
      passbackStatus: 'SUCCESS',
      learner: this.users.get('usr_student_emma'),
      createdAt: now
    });

    this.assignmentLearners.set('al_101_frank', {
      id: 'al_101_frank',
      assignmentId: asg1.id,
      learnerId: 'usr_student_frank',
      status: 'ASSIGNED',
      score: 0,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_frank'),
      createdAt: now
    });

    this.assignmentLearners.set('al_101_grace', {
      id: 'al_101_grace',
      assignmentId: asg1.id,
      learnerId: 'usr_student_grace',
      status: 'SUBMITTED',
      score: 90,
      reviewed: true,
      reviewedAt: now,
      reviewedBy: 'usr_faculty',
      exported: false,
      learner: this.users.get('usr_student_grace'),
      createdAt: now
    });

    // Course 2 Container & Assignment
    const cnt2: AssessmentContainer = {
      id: 'cnt_cs202_default',
      courseId: course202.id,
      name: 'Data Structures Lab',
      description: 'Advanced data structures and algorithmic challenges',
      resourceLinkId: 'd2l_resource_link_cs202_1',
      createdBy: 'usr_faculty_lovelace',
      createdAt: now,
      updatedAt: now
    };
    this.containers.set(cnt2.id, cnt2);

    const asg2: Assignment = {
      id: 'asg_cs202_a1',
      containerId: cnt2.id,
      courseId: course202.id,
      title: 'CS202 Midterm: Linked Lists & Anagrams',
      instructions: 'Complete the core algorithmic challenges. Solutions must meet the time and space complexity constraints.',
      maxPoints: 100,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'usr_faculty_lovelace',
      status: 'PUBLISHED',
      resourceLinkId: 'd2l_resource_link_cs202_1',
      lineItemUrl: 'https://brightspace.institution.edu/d2l/api/lti/ags/2.0/lineitems/li_cs202_1',
      questions: [
        { id: 'aq_202_1', assignmentId: 'asg_cs202_a1', questionId: 'q_10', points: 50, order: 1, question: this.questions.get('q_10') || q1 },
        { id: 'aq_202_2', assignmentId: 'asg_cs202_a1', questionId: 'q_12', points: 50, order: 2, question: this.questions.get('q_12') || q2 }
      ],
      createdAt: now,
      updatedAt: now
    };
    this.assignments.set(asg2.id, asg2);

    // Initial student states in Course 2 (All 7 Learners)
    this.assignmentLearners.set('al_202_alice', {
      id: 'al_202_alice',
      assignmentId: asg2.id,
      learnerId: 'usr_student_alice',
      status: 'SUBMITTED',
      score: 85,
      reviewed: true,
      reviewedAt: now,
      reviewedBy: 'usr_faculty_lovelace',
      exported: false,
      learner: this.users.get('usr_student_alice'),
      createdAt: now
    });

    this.assignmentLearners.set('al_202_bob', {
      id: 'al_202_bob',
      assignmentId: asg2.id,
      learnerId: 'usr_student_bob',
      status: 'ASSIGNED',
      score: 0,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_bob'),
      createdAt: now
    });

    this.assignmentLearners.set('al_202_charlie', {
      id: 'al_202_charlie',
      assignmentId: asg2.id,
      learnerId: 'usr_student_charlie',
      status: 'ASSIGNED',
      score: 0,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_charlie'),
      createdAt: now
    });

    this.assignmentLearners.set('al_202_david', {
      id: 'al_202_david',
      assignmentId: asg2.id,
      learnerId: 'usr_student_david',
      status: 'SUBMITTED',
      score: 65,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_david'),
      createdAt: now
    });

    this.assignmentLearners.set('al_202_emma', {
      id: 'al_202_emma',
      assignmentId: asg2.id,
      learnerId: 'usr_student_emma',
      status: 'SUBMITTED',
      score: 90,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_emma'),
      createdAt: now
    });

    this.assignmentLearners.set('al_202_frank', {
      id: 'al_202_frank',
      assignmentId: asg2.id,
      learnerId: 'usr_student_frank',
      status: 'ASSIGNED',
      score: 0,
      reviewed: false,
      exported: false,
      learner: this.users.get('usr_student_frank'),
      createdAt: now
    });

    this.assignmentLearners.set('al_202_grace', {
      id: 'al_202_grace',
      assignmentId: asg2.id,
      learnerId: 'usr_student_grace',
      status: 'SUBMITTED',
      score: 100,
      reviewed: true,
      reviewedAt: now,
      reviewedBy: 'usr_faculty_lovelace',
      exported: true,
      exportedAt: now,
      exportedBy: 'usr_faculty_lovelace',
      passbackStatus: 'SUCCESS',
      learner: this.users.get('usr_student_grace'),
      createdAt: now
    });
  }

  // --- Users ---
  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByLtiSubject(ltiSubject: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.ltiSubject === ltiSubject);
  }

  upsertUser(user: Partial<User> & { email: string; name: string }): User {
    let existing = this.getUserByEmail(user.email);
    if (!existing && user.ltiSubject) {
      existing = this.getUserByLtiSubject(user.ltiSubject);
    }

    if (existing) {
      const updated: User = {
        ...existing,
        ...user,
        updatedAt: new Date().toISOString()
      };
      this.users.set(existing.id, updated);
      this.persist();
      return updated;
    }

    const newUser: User = {
      id: user.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: user.name,
      email: user.email,
      role: user.role || 'LEARNER',
      ltiSubject: user.ltiSubject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(newUser.id, newUser);
    this.persist();
    return newUser;
  }

  // --- Courses ---
  getCourses(): Course[] {
    return Array.from(this.courses.values());
  }

  getCourseById(id: string): Course | undefined {
    return this.courses.get(id);
  }

  getCourseByLtiContext(contextId: string): Course | undefined {
    return Array.from(this.courses.values()).find(c => c.ltiContextId === contextId);
  }

  createCourse(title: string, ltiContextId?: string, code?: string, term?: string): Course {
    const newCourse: Course = {
      id: `crs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title,
      code,
      term,
      ltiContextId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.courses.set(newCourse.id, newCourse);
    this.persist();
    return newCourse;
  }

  getCourseMembers(courseId: string): CourseMember[] {
    return Array.from(this.courseMembers.values())
      .filter(cm => cm.courseId === courseId)
      .map(cm => ({ ...cm, user: this.users.get(cm.userId) }));
  }

  getUserCourses(userId: string): Course[] {
    const courseIds = Array.from(this.courseMembers.values())
      .filter(cm => cm.userId === userId)
      .map(cm => cm.courseId);
    return Array.from(this.courses.values()).filter(c => courseIds.includes(c.id));
  }

  addCourseMember(courseId: string, userId: string, role: 'FACULTY' | 'LEARNER'): CourseMember {
    const existing = Array.from(this.courseMembers.values()).find(
      cm => cm.courseId === courseId && cm.userId === userId
    );
    if (existing) {
      existing.role = role;
      this.persist();
      return existing;
    }

    const member: CourseMember = {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      courseId,
      userId,
      role,
      user: this.users.get(userId),
      createdAt: new Date().toISOString()
    };
    this.courseMembers.set(member.id, member);
    this.persist();
    return member;
  }

  // --- Questions ---
  getQuestions(): Question[] {
    return Array.from(this.questions.values());
  }

  getQuestionById(id: string): Question | undefined {
    return this.questions.get(id);
  }

  createQuestion(questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Question {
    const newQuestion: Question = {
      ...questionData,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.questions.set(newQuestion.id, newQuestion);
    this.persist();
    return newQuestion;
  }

  deleteQuestion(id: string): boolean {
    const existed = this.questions.delete(id);
    if (existed) {
      this.persist();
    }
    return existed;
  }

  // --- Assignments ---
  getAssignmentsByCourse(courseId: string): Assignment[] {
    return Array.from(this.assignments.values())
      .filter(a => a.courseId === courseId)
      .map(a => this.populateAssignment(a));
  }

  getAssignmentById(id: string): Assignment | undefined {
    const a = this.assignments.get(id);
    return a ? this.populateAssignment(a) : undefined;
  }

  private populateAssignment(a: Assignment): Assignment {
    const populatedQuestions = a.questions.map(q => {
      const qId = q.questionId;
      const strippedId = qId.replace(/^q_/, '');
      const question =
        this.questions.get(qId) ||
        this.questions.get(`q_${strippedId}`) ||
        this.questions.get(strippedId) ||
        sampleQuestions.find(sq => sq.id === qId || sq.id === strippedId || `q_${sq.id}` === qId);

      return {
        ...q,
        allowedLanguages: q.allowedLanguages || question?.supportedLanguages,
        question
      };
    });

    const learners = Array.from(this.assignmentLearners.values())
      .filter(al => al.assignmentId === a.id)
      .map(al => ({ ...al, learner: this.users.get(al.learnerId) }));

    return {
      ...a,
      questions: populatedQuestions,
      learners
    };
  }

  createAssignment(data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>, learnerIds: string[]): Assignment {
    const assignmentId = `asg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newAssignment: Assignment = {
      ...data,
      id: assignmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: data.questions.map((q, idx) => ({
        ...q,
        id: `aq_${Date.now()}_${idx}`,
        assignmentId
      }))
    };

    this.assignments.set(assignmentId, newAssignment);

    // Assign to learners
    learnerIds.forEach(learnerId => {
      const al: AssignmentLearner = {
        id: `al_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        assignmentId,
        learnerId,
        status: 'ASSIGNED',
        score: 0,
        reviewed: false,
        exported: false,
        learner: this.users.get(learnerId),
        createdAt: new Date().toISOString()
      };
      this.assignmentLearners.set(al.id, al);
    });

    this.persist();
    return this.populateAssignment(newAssignment);
  }

  getAssignmentLearners(assignmentId: string): AssignmentLearner[] {
    return Array.from(this.assignmentLearners.values())
      .filter(al => al.assignmentId === assignmentId)
      .map(al => ({ ...al, learner: this.users.get(al.learnerId) }));
  }

  getAssignmentLearner(assignmentId: string, learnerId: string): AssignmentLearner | undefined {
    const al = Array.from(this.assignmentLearners.values()).find(
      item => item.assignmentId === assignmentId && item.learnerId === learnerId
    );
    return al ? { ...al, learner: this.users.get(al.learnerId) } : undefined;
  }

  updateAssignmentLearner(id: string, updates: Partial<AssignmentLearner>): AssignmentLearner | undefined {
    const existing = this.assignmentLearners.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.assignmentLearners.set(id, updated);
    this.persist();
    return { ...updated, learner: this.users.get(updated.learnerId) };
  }

  // --- Containers ---
  getContainersByCourse(courseId: string): AssessmentContainer[] {
    return Array.from(this.containers.values()).filter(c => c.courseId === courseId);
  }

  getContainerById(id: string): AssessmentContainer | undefined {
    return this.containers.get(id);
  }

  getContainerByResourceLink(resourceLinkId: string): AssessmentContainer | undefined {
    return Array.from(this.containers.values()).find(c => c.resourceLinkId === resourceLinkId);
  }

  createContainer(data: Partial<AssessmentContainer> & { courseId: string; name: string }): AssessmentContainer {
    const id = data.id || `cnt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const newContainer: AssessmentContainer = {
      id,
      courseId: data.courseId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      resourceLinkId: data.resourceLinkId,
      createdBy: data.createdBy || 'usr_faculty',
      createdAt: data.createdAt || now,
      updatedAt: now
    };
    this.containers.set(id, newContainer);
    this.persist();
    return newContainer;
  }

  updateContainer(id: string, updates: Partial<AssessmentContainer>): AssessmentContainer | undefined {
    const existing = this.containers.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.containers.set(id, updated);
    this.persist();
    return updated;
  }

  deleteContainer(id: string): boolean {
    const existed = this.containers.delete(id);
    if (existed) {
      // Also delete or unlink child assignments
      Array.from(this.assignments.values()).forEach(asg => {
        if (asg.containerId === id) {
          this.deleteAssignment(asg.id);
        }
      });
      this.persist();
    }
    return existed;
  }

  getAssignmentsByContainer(containerId: string): Assignment[] {
    return Array.from(this.assignments.values())
      .filter(a => a.containerId === containerId)
      .map(a => this.populateAssignment(a));
  }

  updateAssignment(id: string, updates: Partial<Assignment>): Assignment | undefined {
    const existing = this.assignments.get(id);
    if (!existing) return undefined;
    const updated: Assignment = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.assignments.set(id, updated);
    this.persist();
    return this.populateAssignment(updated);
  }

  deleteAssignment(id: string): boolean {
    const existed = this.assignments.delete(id);
    if (existed) {
      // Remove related learners and submissions
      Array.from(this.assignmentLearners.entries()).forEach(([alId, al]) => {
        if (al.assignmentId === id) {
          this.assignmentLearners.delete(alId);
        }
      });
      Array.from(this.submissions.entries()).forEach(([sId, s]) => {
        if (s.assignmentId === id) {
          this.submissions.delete(sId);
        }
      });
      this.persist();
    }
    return existed;
  }

  // --- Submissions ---
  createSubmission(submission: AuthoritativeSubmission): AuthoritativeSubmission {
    this.submissions.set(submission.id, submission);
    this.persist();
    return submission;
  }

  getSubmissionsByAssignmentAndLearner(assignmentId: string, learnerId: string): AuthoritativeSubmission[] {
    return Array.from(this.submissions.values()).filter(
      s => s.assignmentId === assignmentId && s.learnerId === learnerId
    );
  }

  // --- Streaks & Activity ---
  getUserStreak(userId: string): UserStreak {
    let streak = this.streaks.get(userId);
    if (!streak) {
      const today = new Date().toISOString().split('T')[0];
      streak = {
        userId,
        currentStreak: 1,
        maxStreak: 3,
        lastActiveDate: today,
        totalSolved: 2,
        totalSubmissions: 5,
        activityDates: {
          [today]: 2,
          [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: 3
        }
      };
      this.streaks.set(userId, streak);
      this.persist();
    }
    return streak;
  }

  recordUserActivity(userId: string, isSolved = false): UserStreak {
    const streak = this.getUserStreak(userId);
    const today = new Date().toISOString().split('T')[0];

    streak.activityDates[today] = (streak.activityDates[today] || 0) + 1;
    streak.totalSubmissions += 1;
    if (isSolved) {
      streak.totalSolved += 1;
    }

    if (streak.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (streak.lastActiveDate === yesterday) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      streak.lastActiveDate = today;
      if (streak.currentStreak > streak.maxStreak) {
        streak.maxStreak = streak.currentStreak;
      }
    }

    this.streaks.set(userId, streak);
    this.persist();
    return streak;
  }

  // --- Community Posts & Replies ---
  getCommunityPosts(courseId: string, filter?: { questionId?: string; tag?: string; search?: string }): CommunityPost[] {
    let posts = Array.from(this.communityPosts.values()).filter(p => !courseId || p.courseId === courseId || p.courseId === 'crs_cs101');
    if (filter?.questionId) {
      posts = posts.filter(p => p.questionId === filter.questionId);
    }
    if (filter?.tag && filter.tag !== 'all') {
      const tagLower = filter.tag.toLowerCase();
      posts = posts.filter(p => p.tags.some(t => t.toLowerCase() === tagLower));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.content.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getCommunityPostById(id: string): CommunityPost | undefined {
    return this.communityPosts.get(id);
  }

  createCommunityPost(post: Omit<CommunityPost, 'id' | 'repliesCount' | 'upvotes' | 'createdAt' | 'updatedAt'>): CommunityPost {
    const now = new Date().toISOString();
    const newPost: CommunityPost = {
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      upvotes: [],
      repliesCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.communityPosts.set(newPost.id, newPost);
    this.persist();
    return newPost;
  }

  togglePostUpvote(postId: string, userId: string): CommunityPost | undefined {
    const post = this.communityPosts.get(postId);
    if (!post) return undefined;
    const index = post.upvotes.indexOf(userId);
    if (index > -1) {
      post.upvotes.splice(index, 1);
    } else {
      post.upvotes.push(userId);
    }
    this.persist();
    return post;
  }

  getCommunityReplies(postId: string): CommunityReply[] {
    return Array.from(this.communityReplies.values())
      .filter(r => r.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createCommunityReply(reply: Omit<CommunityReply, 'id' | 'upvotes' | 'createdAt'>): CommunityReply {
    const now = new Date().toISOString();
    const newReply: CommunityReply = {
      ...reply,
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      upvotes: [],
      createdAt: now
    };
    this.communityReplies.set(newReply.id, newReply);

    const post = this.communityPosts.get(reply.postId);
    if (post) {
      post.repliesCount += 1;
      post.updatedAt = now;
    }

    this.persist();
    return newReply;
  }

  toggleReplyUpvote(replyId: string, userId: string): CommunityReply | undefined {
    const reply = this.communityReplies.get(replyId);
    if (!reply) return undefined;
    const index = reply.upvotes.indexOf(userId);
    if (index > -1) {
      reply.upvotes.splice(index, 1);
    } else {
      reply.upvotes.push(userId);
    }
    this.persist();
    return reply;
  }

  markReplyAccepted(replyId: string, isAccepted: boolean): CommunityReply | undefined {
    const reply = this.communityReplies.get(replyId);
    if (!reply) return undefined;
    reply.isAccepted = isAccepted;
    this.persist();
    return reply;
  }

  // --- Detailed Learner Profile & Coding Stats ---
  getUserProfileStats(userId: string, courseId?: string): UserCodingStats {
    const user = this.getUserById(userId) || this.getUserByLtiSubject(userId) || {
      id: userId,
      name: userId === 'usr_student_alice' ? 'Alice Johnson' :
            userId === 'usr_student_bob' ? 'Bob Smith' :
            userId === 'usr_faculty' ? 'Prof. Alan Turing' : userId,
      email: `${userId}@brightspace.edu`,
      role: (userId.includes('faculty') || userId.includes('instructor') ? 'FACULTY' : 'LEARNER') as 'FACULTY' | 'LEARNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const streak = this.getUserStreak(userId);

    // Compute solved questions from submissions
    const userSubs = Array.from(this.submissions.values()).filter(s => s.learnerId === userId);
    const attemptedIds = new Set<string>();
    const solvedIds = new Set<string>();

    userSubs.forEach(s => {
      attemptedIds.add(s.questionId);
      if (s.overallStatus === 'Accepted' || (s.score != null && s.maxScore != null && s.score >= s.maxScore && s.maxScore > 0)) {
        solvedIds.add(s.questionId);
      }
    });

    const allQuestions = Array.from(this.questions.values());
    const totalEasy = allQuestions.filter(q => q.difficulty === 'Easy').length || 45;
    const totalMedium = allQuestions.filter(q => q.difficulty === 'Medium').length || 55;
    const totalHard = allQuestions.filter(q => q.difficulty === 'Hard').length || 20;
    const totalDatabase = allQuestions.filter(q => 
      q.category?.toLowerCase().includes('sql') || 
      q.category?.toLowerCase().includes('db') || 
      q.category?.toLowerCase().includes('database') ||
      q.tags?.some(t => t.toLowerCase().includes('sql') || t.toLowerCase().includes('database'))
    ).length || 18;

    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;
    let databaseSolved = 0;

    solvedIds.forEach(qId => {
      const q = this.questions.get(qId);
      if (q) {
        if (q.difficulty === 'Easy') easySolved++;
        else if (q.difficulty === 'Medium') mediumSolved++;
        else if (q.difficulty === 'Hard') hardSolved++;
        if (q.category?.toLowerCase().includes('sql') || q.category?.toLowerCase().includes('db') || q.category?.toLowerCase().includes('database')) {
          databaseSolved++;
        }
      }
    });

    // Harmonize with streak.totalSolved so learner immediately sees their achievements
    const totalSolvedTarget = Math.max(streak.totalSolved, solvedIds.size, 1);
    if (totalSolvedTarget > (easySolved + mediumSolved + hardSolved)) {
      const remaining = totalSolvedTarget - (easySolved + mediumSolved + hardSolved);
      const addEasy = Math.ceil(remaining * 0.6);
      const addMed = Math.floor(remaining * 0.3);
      const addHard = Math.max(0, remaining - addEasy - addMed);
      easySolved += addEasy;
      mediumSolved += addMed;
      hardSolved += addHard;
      if (databaseSolved === 0 && totalSolvedTarget >= 2) {
        databaseSolved = 1;
      }
    }

    const totalSolved = easySolved + mediumSolved + hardSolved;
    const attemptingCount = Math.max(0, attemptedIds.size - solvedIds.size);

    // Compute Course Class Rank among learners
    const allMembers = this.getCourseMembers(courseId || 'crs_cs101').filter(m => m.role === 'LEARNER');
    const totalCourseLearners = Math.max(allMembers.length, 30);
    const sortedLearners = allMembers.map(m => {
      const s = this.getUserStreak(m.userId);
      return { userId: m.userId, score: s.totalSolved * 50 + s.currentStreak * 10 };
    }).sort((a, b) => b.score - a.score);
    const userRankIndex = sortedLearners.findIndex(l => l.userId === userId);
    const classRank = userRankIndex >= 0 ? userRankIndex + 1 : (userId === 'usr_student_alice' ? 1 : 4);

    // Recent submissions log
    let recentSubmissions = userSubs.slice(-10).reverse().map(s => {
      const q = this.questions.get(s.questionId);
      return {
        id: s.id,
        questionId: s.questionId,
        questionTitle: q?.title || 'Coding Problem',
        difficulty: (q?.difficulty || 'Medium') as 'Easy' | 'Medium' | 'Hard',
        category: q?.category || 'Algorithm',
        language: s.languageId === 71 ? 'Python' : s.languageId === 63 ? 'JavaScript' : s.languageId === 54 ? 'C++' : s.languageId === 82 ? 'SQL' : 'Code',
        status: s.overallStatus || 'Accepted',
        score: s.score,
        maxScore: s.maxScore,
        submittedAt: s.submittedAt
      };
    });

    if (recentSubmissions.length === 0) {
      recentSubmissions = [
        {
          id: 'sub_demo_1',
          questionId: 'q_1',
          questionTitle: 'Two Sum',
          difficulty: 'Easy',
          category: 'Arrays & Hash Tables',
          language: 'Python',
          status: 'Accepted',
          score: 10,
          maxScore: 10,
          submittedAt: new Date(Date.now() - 2 * 3600000).toISOString()
        },
        {
          id: 'sub_demo_2',
          questionId: 'q_2',
          questionTitle: 'Valid Palindrome',
          difficulty: 'Easy',
          category: 'Two Pointers',
          language: 'Python',
          status: 'Accepted',
          score: 10,
          maxScore: 10,
          submittedAt: new Date(Date.now() - 25 * 3600000).toISOString()
        }
      ];
    }

    // Community engagement stats
    const posts = Array.from(this.communityPosts.values()).filter(p => p.authorId === userId);
    const replies = Array.from(this.communityReplies.values()).filter(r => r.authorId === userId);
    const acceptedAnswersCount = replies.filter(r => r.isAccepted).length;
    let upvotesReceived = 0;
    posts.forEach(p => { upvotesReceived += p.upvotes.length; });
    replies.forEach(r => { upvotesReceived += r.upvotes.length; });

    return {
      userId,
      name: user.name,
      email: user.email,
      role: user.role,
      classRank,
      totalCourseLearners,
      streak,
      solvedBreakdown: {
        totalSolved,
        totalProblems: allQuestions.length || 120,
        easySolved,
        totalEasy,
        mediumSolved,
        totalMedium,
        hardSolved,
        totalHard,
        databaseSolved,
        totalDatabase,
        attemptingCount
      },
      recentSubmissions,
      communityEngagement: {
        postsCount: posts.length,
        repliesCount: replies.length,
        acceptedAnswersCount,
        upvotesReceived
      }
    };
  }

  private seedInitialCommunity() {
    const now = new Date().toISOString();
    const post1: CommunityPost = {
      id: 'post_demo_1',
      courseId: 'crs_cs101',
      questionId: 'q_1',
      questionTitle: 'Two Sum',
      authorId: 'usr_student_alice',
      authorName: 'Alice Johnson',
      authorRole: 'LEARNER',
      title: 'How to optimize Two Sum from O(N^2) to O(N)?',
      content: 'I managed to pass all basic test cases using a nested loop, but on larger inputs it takes too long. What is the recommended hash table approach in Python?',
      codeSnippet: 'def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]',
      language: 'python',
      tags: ['doubt', 'optimization', 'hash-table', 'arrays'],
      upvotes: ['usr_student_bob', 'usr_student_charlie'],
      repliesCount: 2,
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      updatedAt: now
    };
    this.communityPosts.set(post1.id, post1);

    const reply1: CommunityReply = {
      id: 'reply_demo_1',
      postId: post1.id,
      authorId: 'usr_faculty',
      authorName: 'Prof. Alan Turing',
      authorRole: 'FACULTY',
      content: 'Great question Alice! You can use a dictionary (hash map) to store the complement `target - num` as you iterate in a single pass. This reduces the time complexity to O(N) with O(N) space.',
      codeSnippet: 'def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i',
      language: 'python',
      isAccepted: true,
      upvotes: ['usr_student_alice', 'usr_student_david', 'usr_student_bob'],
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
    };
    this.communityReplies.set(reply1.id, reply1);

    const reply2: CommunityReply = {
      id: 'reply_demo_2',
      postId: post1.id,
      authorId: 'usr_student_bob',
      authorName: 'Bob Smith',
      authorRole: 'LEARNER',
      content: 'Thanks Professor! Just tried this in Python and execution time dropped from 120ms to 4ms!',
      upvotes: ['usr_student_alice'],
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
    };
    this.communityReplies.set(reply2.id, reply2);

    const post2: CommunityPost = {
      id: 'post_demo_2',
      courseId: 'crs_cs101',
      authorId: 'usr_faculty',
      authorName: 'Prof. Alan Turing',
      authorRole: 'FACULTY',
      title: '📢 Module 1 Practical Practice & Daily Streak Challenge',
      content: 'Welcome students! Maintain your daily streak by solving at least one challenge every day. Use this community forum to ask questions and discuss different algorithmic approaches!',
      tags: ['announcement', 'cs101', 'streak'],
      upvotes: ['usr_student_alice', 'usr_student_bob', 'usr_student_emma', 'usr_student_grace'],
      repliesCount: 0,
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: now
    };
    this.communityPosts.set(post2.id, post2);
  }

  getOrCreateProctoringSession(assignmentId: string, learnerId: string, consentAcceptedAt?: string): ProctoringSession {
    const existing = Array.from(this.proctoringSessions.values()).find(
      s => s.assignmentId === assignmentId && s.learnerId === learnerId
    );
    if (existing) {
      if (consentAcceptedAt && !existing.consentAcceptedAt) {
        existing.consentAcceptedAt = consentAcceptedAt;
        this.persist();
      }
      return existing;
    }

    const newSession: ProctoringSession = {
      id: `psess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      assignmentId,
      learnerId,
      startedAt: new Date().toISOString(),
      consentAcceptedAt: consentAcceptedAt || new Date().toISOString(),
      totalViolations: 0,
      status: 'IN_PROGRESS',
      events: []
    };
    this.proctoringSessions.set(newSession.id, newSession);
    this.persist();
    return newSession;
  }

  getProctoringSession(assignmentId: string, learnerId: string): ProctoringSession | undefined {
    return Array.from(this.proctoringSessions.values()).find(
      s => s.assignmentId === assignmentId && s.learnerId === learnerId
    );
  }

  getProctoringSessionById(sessionId: string): ProctoringSession | undefined {
    return this.proctoringSessions.get(sessionId);
  }

  recordProctoringEvent(
    assignmentId: string,
    learnerId: string,
    eventData: {
      eventType: ProctoringEvent['eventType'];
      severity: ProctoringEvent['severity'];
      evidenceImageUrl?: string;
      notes?: string;
    }
  ): { session: ProctoringSession; event: ProctoringEvent } {
    let session = this.getProctoringSession(assignmentId, learnerId);
    if (!session) {
      session = this.getOrCreateProctoringSession(assignmentId, learnerId);
    }

    const event: ProctoringEvent = {
      id: `pevt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: session.id,
      assignmentId,
      learnerId,
      eventType: eventData.eventType,
      severity: eventData.severity,
      timestamp: new Date().toISOString(),
      evidenceImageUrl: eventData.evidenceImageUrl,
      notes: eventData.notes,
      reviewStatus: 'PENDING'
    };

    if (eventData.eventType !== 'PERIODIC_SNAPSHOT') {
      session.totalViolations += 1;
    }

    session.events.push(event);
    this.proctoringSessions.set(session.id, session);
    this.persist();

    return { session, event };
  }

  updateProctoringSessionStatus(sessionId: string, status: ProctoringSession['status']): void {
    const session = this.proctoringSessions.get(sessionId);
    if (session) {
      session.status = status;
      if (status === 'COMPLETED' || status === 'AUTO_SUBMITTED') {
        session.endedAt = new Date().toISOString();
      }
      this.persist();
    }
  }
}

// Global database instance singleton
const globalForDb = global as unknown as { dbInstance?: PersistentDatabase };

function getDatabaseInstance(): PersistentDatabase {
  if (!globalForDb.dbInstance) {
    globalForDb.dbInstance = new PersistentDatabase();
  } else {
    // In dev mode, ensure prototype methods and new properties are updated across hot-reloads
    Object.setPrototypeOf(globalForDb.dbInstance, PersistentDatabase.prototype);
    if (!globalForDb.dbInstance.containers) {
      globalForDb.dbInstance.containers = new Map();
    }
    if (!globalForDb.dbInstance.streaks) {
      globalForDb.dbInstance.streaks = new Map();
    }
    if (!globalForDb.dbInstance.communityPosts) {
      globalForDb.dbInstance.communityPosts = new Map();
    }
    if (!globalForDb.dbInstance.communityReplies) {
      globalForDb.dbInstance.communityReplies = new Map();
    }
    if (!globalForDb.dbInstance.proctoringSessions) {
      globalForDb.dbInstance.proctoringSessions = new Map();
    }
    if (globalForDb.dbInstance.communityPosts.size === 0) {
      (globalForDb.dbInstance as any).seedInitialCommunity();
    }
  }
  return globalForDb.dbInstance;
}

export const db = getDatabaseInstance();
if (process.env.NODE_ENV !== 'production') globalForDb.dbInstance = db;

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuestionStore, sampleQuestions } from '@/store/questionStore';
import { Question, Course, Assignment, AssessmentContainer } from '@/types';
import { Button } from '@/components/ui/button';
import { Toaster } from 'react-hot-toast';
import CodeCompiler from '@/components/CodeCompiler';
import QuestionBrowser from '@/components/QuestionBrowser';
import QuestionSolver from '@/components/QuestionSolver';
import FacultyPage from '@/components/FacultyPage';
import SetAssignment from '@/components/SetAssignment';
import FacultyResults from '@/components/FacultyResults';
import LearnerAssignments from '@/components/LearnerAssignments';
import LearnerAssignmentSolver from '@/components/LearnerAssignmentSolver';
import ContainerManager from '@/components/ContainerManager';
import LearnerContainerView from '@/components/LearnerContainerView';
import AdminPage from '@/components/AdminPage';
import DevRoleSwitcher from '@/components/DevRoleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import StreakWidget from '@/components/StreakWidget';
import CourseCommunity from '@/components/CourseCommunity';
import LearnerProfileDrawer from '@/components/LearnerProfileDrawer';
import useLTIContext from '@/hooks/useLTIContext';
import { 
  GraduationCap, 
  BookOpen, 
  Code2, 
  Home, 
  Settings, 
  FileText, 
  Award, 
  Layers,
  PlusCircle,
  BarChart3,
  UserCheck,
  MessageSquare
} from 'lucide-react';

type ViewMode = 'home' | 'course' | 'set-assignment' | 'problems' | 'create-problem' | 'compiler' | 'community' | 'admin';
type FacultyCourseTab = 'problems' | 'set-assignment' | 'results';

export default function MainApp() {
  const [currentView, setCurrentView] = useState<ViewMode>('course');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedAssignmentForSolver, setSelectedAssignmentForSolver] = useState<Assignment | null>(null);
  const [selectedAssignmentForResults, setSelectedAssignmentForResults] = useState<Assignment | null>(null);
  const [facultyCourseTab, setFacultyCourseTab] = useState<FacultyCourseTab>('results');
  const [facultyPageMode, setFacultyPageMode] = useState<'create' | 'import'>('create');
  const [communityQuestionId, setCommunityQuestionId] = useState<string | undefined>(undefined);
  const [communityQuestionTitle, setCommunityQuestionTitle] = useState<string | undefined>(undefined);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  
  const [activeCourse, setActiveCourse] = useState<Course>({
    id: 'crs_cs101',
    title: 'Loading Course...',
    ltiContextId: 'd2l_course_cs101_ctx'
  });

  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [activeContainer, setActiveContainer] = useState<AssessmentContainer | null>(null);
  const [courseContainers, setCourseContainers] = useState<AssessmentContainer[]>([]);
  const { questions } = useQuestionStore();
  const { isLTISession, isLoading, error, userRole, userId, courseId, courseTitle, resourceLinkId, resourceLinkTitle, assignmentId } = useLTIContext();

  const currentRole = (userRole?.toLowerCase() || 'faculty') as 'admin' | 'faculty' | 'instructor' | 'student' | 'learner';
  const isFacultyOrAdmin = currentRole === 'faculty' || currentRole === 'instructor' || currentRole === 'admin';
  const isLearner = !isFacultyOrAdmin;

  // Direct Topic Launch: When launched from a specific Brightspace assessment topic, automatically route directly to that assessment
  useEffect(() => {
    if (!assignmentId) return;

    fetch(`/api/assignments/${assignmentId}`, {
      headers: {
        'x-user-id': userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice'),
        'x-user-role': isFacultyOrAdmin ? 'FACULTY' : 'LEARNER'
      }
    })
      .then(async res => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((asg: Assignment | null) => {
        if (asg && asg.id) {
          if (isFacultyOrAdmin) {
            setSelectedAssignmentForResults(asg);
          } else {
            setSelectedAssignmentForSolver(asg);
          }
        }
      })
      .catch(err => console.warn('[MainApp] Direct assessment load error:', err));
  }, [assignmentId, isFacultyOrAdmin, userId]);

  // Clear faculty-only states whenever the role is learner
  useEffect(() => {
    if (isLearner) {
      setSelectedAssignmentForResults(null);
      if (currentView === 'set-assignment' || currentView === 'admin' || currentView === 'create-problem') {
        setCurrentView('course');
      }
    }
  }, [isLearner, currentView]);

  // Fetch available courses for this user
  useEffect(() => {
    fetch('/api/courses', {
      headers: {
        'x-user-id': userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice'),
        'x-user-role': isFacultyOrAdmin ? (currentRole === 'admin' ? 'ADMIN' : 'FACULTY') : 'LEARNER'
      }
    })
      .then(async res => {
        if (!res.ok) return [];
        return res.json().catch(() => []);
      })
      .then(courses => {
        if (Array.isArray(courses)) {
          setAvailableCourses(courses);
        }
      })
      .catch(err => console.warn('[MainApp] Courses load warning:', err));
  }, [userId, isFacultyOrAdmin, currentRole]);

  // Dynamically synchronize active course from Brightspace launch context
  useEffect(() => {
    const targetCourseId = courseId || 'crs_cs101';
    
    // Set immediate title if available
    if (courseTitle) {
      setActiveCourse(prev => ({
        ...prev,
        id: targetCourseId,
        title: courseTitle
      }));
    }

    // Fetch full course data from API
    fetch(`/api/courses/${targetCourseId}`, {
      headers: {
        'x-user-id': userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice'),
        'x-user-role': isFacultyOrAdmin ? 'FACULTY' : 'LEARNER'
      }
    })
      .then(async res => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && data.id) {
          setActiveCourse({
            id: data.id,
            title: data.name || data.title || courseTitle || 'Brightspace Course',
            code: data.code,
            term: data.term,
            facultyId: data.facultyId,
            ltiContextId: data.ltiContextId
          });
        } else if (courseTitle) {
          setActiveCourse(prev => ({ ...prev, id: targetCourseId, title: courseTitle }));
        } else {
          setActiveCourse(prev => ({ ...prev, id: targetCourseId, title: 'CS101: Introduction to Programming & Algorithms' }));
        }
      })
      .catch(err => {
        console.warn('[MainApp] Course load warning:', err);
        if (courseTitle) {
          setActiveCourse(prev => ({ ...prev, id: targetCourseId, title: courseTitle }));
        } else {
          setActiveCourse(prev => ({ ...prev, id: targetCourseId, title: 'CS101: Introduction to Programming & Algorithms' }));
        }
      });
  }, [courseId, courseTitle, userId, isFacultyOrAdmin]);

  // Load course assignments
  const loadCourseAssignments = () => {
    fetch(`/api/assignments?courseId=${activeCourse.id}`, {
      headers: {
        'x-user-id': userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice'),
        'x-user-role': isFacultyOrAdmin ? 'FACULTY' : 'LEARNER'
      }
    })
      .then(async res => {
        if (!res.ok) return [];
        return res.json().catch(() => []);
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCourseAssignments(data);
        }
      })
      .catch(err => console.warn('[MainApp] Assignments load warning:', err));
  };

  // Load containers for this course / LTI resource link
  const loadContainers = () => {
    const resLinkId = resourceLinkId || '';
    const resLinkTitle = resourceLinkTitle || '';
    const url = `/api/containers?courseId=${activeCourse.id}&resourceLinkId=${encodeURIComponent(resLinkId)}&title=${encodeURIComponent(resLinkTitle)}`;

    fetch(url, {
      headers: {
        'x-user-id': userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice'),
        'x-user-role': isFacultyOrAdmin ? (currentRole === 'admin' ? 'ADMIN' : 'FACULTY') : 'LEARNER'
      }
    })
      .then(async res => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && data.container) {
          setActiveContainer(data.container);
          setCourseContainers([data.container]);
        } else if (Array.isArray(data) && data.length > 0) {
          setCourseContainers(data);
          setActiveContainer(prev => (prev && data.some((c: AssessmentContainer) => c.id === prev.id)) ? prev : data[0]);
        }
      })
      .catch(err => console.warn('[MainApp] Containers load warning:', err));
  };

  useEffect(() => {
    if (activeCourse.id) {
      loadCourseAssignments();
      loadContainers();
    }
  }, [activeCourse.id, isFacultyOrAdmin, userId, resourceLinkId, resourceLinkTitle]);

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setCurrentView('problems');
  };

  const handleSelectQuestionById = (qId: string) => {
    const cleanId = String(qId).trim();
    const numId = cleanId.replace('q_sql_', '');
    const q = 
      questions.find(item => item.id === cleanId || item.id === `q_sql_${cleanId}` || item.id === numId || item.id.replace('q_sql_', '') === numId) ||
      sampleQuestions.find(item => item.id === cleanId || item.id === `q_sql_${cleanId}` || item.id === numId || item.id.replace('q_sql_', '') === numId);

    if (q) {
      setSelectedQuestion(q);
      setCurrentView('problems');
      setSelectedProfileUserId(null);
    }
  };

  const handleBackToProblems = () => {
    setSelectedQuestion(null);
  };

  const renderNavigation = () => (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 mb-3 sm:mb-4 rounded-xl shadow-xs overflow-hidden"
    >
      {/* Tier 1: Brand Header & User Badges */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="cursor-pointer shrink-0" onClick={() => setCurrentView('course')}>
            <Code2 className="text-blue-600 dark:text-blue-400" size={18} />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span 
              onClick={() => setCurrentView('course')}
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer tracking-tight whitespace-nowrap"
            >
              EduTech Compiler
            </span>
            <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
            {availableCourses.length > 1 ? (
              <select
                value={activeCourse.id}
                onChange={e => {
                  const c = availableCourses.find(item => item.id === e.target.value);
                  if (c) {
                    setActiveCourse(c);
                    localStorage.setItem('dev_course_id', c.id);
                  }
                }}
                className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px] truncate"
              >
                {availableCourses.map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">
                    {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[220px]">
                {activeCourse.title}
              </span>
            )}
          </div>
        </div>

        {/* User Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StreakWidget 
            userId={userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice')}
            userRole={isFacultyOrAdmin ? (currentRole === 'admin' ? 'ADMIN' : 'FACULTY') : 'LEARNER'}
            onOpenProfile={() => setSelectedProfileUserId(userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice'))}
          />

          <ThemeToggle />
          
          <button
            type="button"
            onClick={() => setSelectedProfileUserId(userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice'))}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1 cursor-pointer shadow-2xs tracking-wider"
            title="Click to view Learner Profile & Coding Analytics"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white font-black text-[8px] flex items-center justify-center">
              {isFacultyOrAdmin ? 'T' : 'A'}
            </div>
            <span>{currentRole.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Clean Navigation Tabs Bar */}
      <div className="px-2 sm:px-3 py-1.5 bg-slate-50/70 dark:bg-slate-950/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setCurrentView('course')}
          className={`flex items-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            currentView === 'course'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={13} />
          <span>Workspace</span>
        </button>

        {isFacultyOrAdmin && (
          <button
            onClick={() => {
              setCurrentView('set-assignment');
              setSelectedAssignmentForSolver(null);
              setSelectedAssignmentForResults(null);
              setSelectedQuestion(null);
            }}
            className={`flex items-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'set-assignment'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle size={13} />
            <span>Set Assessment</span>
          </button>
        )}

        {!isLearner && (
          <>
            <button
              onClick={() => { setCurrentView('problems'); setSelectedQuestion(null); }}
              className={`flex items-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'problems'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen size={13} />
              <span>Library</span>
            </button>

            <button
              onClick={() => setCurrentView('compiler')}
              className={`flex items-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'compiler'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Code2 size={13} />
              <span>Free Code</span>
            </button>
          </>
        )}
        
        <button
          onClick={() => { setCurrentView('community'); setSelectedQuestion(null); }}
          className={`flex items-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            currentView === 'community'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare size={13} />
          <span>Community</span>
        </button>

        {currentRole === 'admin' && (
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex items-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'admin'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Settings size={13} />
            <span>Admin</span>
          </button>
        )}
      </div>
    </motion.nav>
  );

  const pageBgClass = "relative min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200";

  // Render Course-scoped Workspace with Parent Container -> Child Assessments Architecture
  const renderCourseWorkspace = () => {
    // 1. Strict Learner View Isolation: Learner should NEVER see Faculty Results
    if (isLearner) {
      if (selectedAssignmentForSolver) {
        return (
          <LearnerAssignmentSolver
            assignment={selectedAssignmentForSolver}
            learnerId={userId || 'usr_student_alice'}
            onBack={() => setSelectedAssignmentForSolver(null)}
            onOpenCommunity={(qId, title) => {
              setCommunityQuestionId(qId);
              setCommunityQuestionTitle(title);
              setCurrentView('community');
            }}
            isDirectLaunch={Boolean(assignmentId)}
          />
        );
      }

      // Resolve active container dynamically from LTI context or database
      const currentContainer: AssessmentContainer = activeContainer || {
        id: 'cnt_cs101_default',
        courseId: activeCourse.id,
        name: resourceLinkTitle || 'Programming',
        description: 'Course assessment container',
        createdBy: 'usr_faculty',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return (
        <div className="space-y-4">
          {courseContainers.length > 1 && !isLearner && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500">Modules:</span>
              <div className="flex flex-wrap gap-1.5">
                {courseContainers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveContainer(c)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all border ${
                      currentContainer.id === c.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <LearnerContainerView
            container={currentContainer}
            course={activeCourse}
            learnerId={userId || 'usr_student_alice'}
            onSelectAssessment={asg => setSelectedAssignmentForSolver(asg)}
          />
        </div>
      );
    }

    // 2. Faculty / Admin View
    // If an assessment is explicitly opened for faculty results review
    if (selectedAssignmentForResults && isFacultyOrAdmin) {
      return (
        <FacultyResults
          assignment={selectedAssignmentForResults}
          onBack={() => setSelectedAssignmentForResults(null)}
          isDirectLaunch={Boolean(assignmentId)}
        />
      );
    }

    // If an assessment is opened for solver preview by faculty or student
    if (selectedAssignmentForSolver) {
      return (
        <LearnerAssignmentSolver
          assignment={selectedAssignmentForSolver}
          learnerId={userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice')}
          onBack={() => setSelectedAssignmentForSolver(null)}
          isDirectLaunch={Boolean(assignmentId)}
        />
      );
    }

    // 3. Resolve active container dynamically from LTI context or database
    const currentContainer: AssessmentContainer = activeContainer || {
      id: 'cnt_cs101_default',
      courseId: activeCourse.id,
      name: resourceLinkTitle || 'Programming',
      description: 'Course assessment container',
      createdBy: 'usr_faculty',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 4. Faculty Workspace View -> Dynamic Container Assessment Management
    return (
      <div className="space-y-4">
        {courseContainers.length > 1 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500">Modules:</span>
            <div className="flex flex-wrap gap-1.5">
              {courseContainers.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveContainer(c)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all border ${
                    currentContainer.id === c.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <ContainerManager
          container={currentContainer}
          course={activeCourse}
          onOpenAssessment={asg => setSelectedAssignmentForSolver(asg)}
          onViewResults={asg => setSelectedAssignmentForResults(asg)}
          onSetAssignment={() => setCurrentView('set-assignment')}
          onContainerUpdated={() => {
            loadContainers();
            loadCourseAssignments();
          }}
        />
      </div>
    );
  };

  const renderContent = () => {
    let mainView;
    switch (currentView) {
      case 'course':
        mainView = renderCourseWorkspace();
        break;

      case 'set-assignment':
        mainView = (
          <div className="w-full">
            <SetAssignment
              course={activeCourse}
              containerId={activeContainer?.id}
              containerName={activeContainer?.name}
              onAssignmentCreated={() => {
                setCurrentView('course');
                loadCourseAssignments();
                loadContainers();
              }}
              onCancel={() => setCurrentView('course')}
            />
          </div>
        );
        break;

      case 'create-problem':
        mainView = (
          <div className="max-w-6xl mx-auto">
            <FacultyPage 
              initialMode={facultyPageMode} 
              onBack={() => setCurrentView('problems')} 
            />
          </div>
        );
        break;

      case 'compiler':
        mainView = <CodeCompiler />;
        break;
        
      case 'problems':
        mainView = selectedQuestion ? (
          <QuestionSolver 
            question={selectedQuestion} 
            onBack={handleBackToProblems}
            onOpenCommunity={(qId, title) => {
              setCommunityQuestionId(qId);
              setCommunityQuestionTitle(title);
              setCurrentView('community');
            }}
          />
        ) : (
          <QuestionBrowser 
            onSelectQuestion={handleSelectQuestion} 
            onCreateProblem={() => {
              setFacultyPageMode('create');
              setCurrentView('create-problem');
            }}
            onImportProblem={() => {
              setFacultyPageMode('import');
              setCurrentView('create-problem');
            }}
            isFacultyOrAdmin={isFacultyOrAdmin}
          />
        );
        break;

      case 'community':
        mainView = (
          <CourseCommunity
            course={activeCourse}
            userId={userId || (isFacultyOrAdmin ? 'usr_faculty' : 'usr_student_alice')}
            userRole={isFacultyOrAdmin ? (currentRole === 'admin' ? 'ADMIN' : 'FACULTY') : 'LEARNER'}
            initialQuestionId={communityQuestionId}
            initialQuestionTitle={communityQuestionTitle}
            onOpenProfile={(authorId) => setSelectedProfileUserId(authorId)}
            onSelectQuestion={handleSelectQuestionById}
          />
        );
        break;
        
      case 'admin':
        mainView = <AdminPage />;
        break;
        
      default:
        mainView = renderCourseWorkspace();
        break;
    }

    const isSolvingAssessment = Boolean(selectedAssignmentForSolver);
    const isDirectLaunch = Boolean(assignmentId);
    const isWideView = currentView === 'community' || currentView === 'set-assignment' || currentView === 'compiler' || isSolvingAssessment || Boolean(selectedAssignmentForResults);

    return (
      <div className={pageBgClass}>
        <div className={`relative z-10 mx-auto ${isDirectLaunch ? 'w-full px-2 sm:px-4 py-2 sm:py-3' : isSolvingAssessment ? 'w-full max-w-[1720px] p-3 sm:p-5' : isWideView ? 'w-full max-w-[1680px] p-3 sm:p-5' : 'w-full max-w-7xl px-3 sm:px-6 py-3 sm:py-5'}`}>
          {isDirectLaunch ? (
            <div className="flex items-center justify-between py-2 px-3 sm:px-4 mb-2 sm:mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex items-center gap-2">
                <Code2 className="text-blue-600 dark:text-blue-400" size={20} />
                <span className="font-bold text-sm text-slate-900 dark:text-white">EduTech Compiler</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-500 font-medium">{activeCourse.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${isFacultyOrAdmin ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'}`}>
                  {isFacultyOrAdmin ? 'FACULTY' : 'LEARNER'}
                </span>
              </div>
            </div>
          ) : (
            !isSolvingAssessment && renderNavigation()
          )}
          {mainView}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {!selectedAssignmentForSolver && !Boolean(assignmentId) && <DevRoleSwitcher />}
      <LearnerProfileDrawer
        userId={selectedProfileUserId}
        courseId={activeCourse.id}
        isOpen={Boolean(selectedProfileUserId)}
        onClose={() => setSelectedProfileUserId(null)}
        onSelectQuestion={handleSelectQuestionById}
      />
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          className: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg text-sm font-medium',
          duration: 4000,
        }}
      />
    </>
  );
}

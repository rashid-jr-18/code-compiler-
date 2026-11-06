'use client';

import { useEffect, useState } from 'react';
import { useQuestionStore } from '@/store/questionStore';

interface LTIContext {
  isLTISession: boolean;
  userId?: string;
  courseId?: string;
  courseTitle?: string;
  resourceLinkId?: string;
  resourceLinkTitle?: string;
  assignmentId?: string;
  quizId?: string;
  userRole?: 'student' | 'instructor' | 'admin' | 'faculty' | 'learner';
  isLoading: boolean;
  error?: string;
}

export const useLTIContext = (): LTIContext => {
  const [ltiContext, setLTIContext] = useState<LTIContext>({
    isLTISession: false,
    isLoading: true,
  });

  const { assignmentContext, quizContext } = useQuestionStore();

  useEffect(() => {
    const checkLTISession = async () => {
      try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const urlParams = new URLSearchParams(window.location.search);
        const sessionData = typeof window !== 'undefined' ? sessionStorage.getItem('lti_session') : null;

        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return undefined;
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : undefined;
        };

        // Determine if there is an active live LTI session launched from LMS
        const hasLiveLtiLaunch = Boolean(
          urlParams.has('lti_message_type') ||
          urlParams.has('id_token') ||
          urlParams.has('user_id') ||
          sessionData ||
          getCookie('lti_session') ||
          getCookie('user_id')
        );

        // If no live LMS launch occurred AND in development, fallback to Dev Testing Hub
        if (!hasLiveLtiLaunch && isDevelopment) {
          const devRole = (urlParams.get('role') || (typeof window !== 'undefined' ? localStorage.getItem('dev_user_role') : null) || 'faculty') as 'faculty' | 'learner' | 'admin';
          const devUserId = urlParams.get('user_id') || (typeof window !== 'undefined' ? localStorage.getItem('dev_user_id') : null) || 'usr_faculty';
          const devCourseId = urlParams.get('course_id') || (typeof window !== 'undefined' ? localStorage.getItem('dev_course_id') : null) || getCookie('course_id') || 'crs_cs101';
          const devCourseTitle = urlParams.get('course_title') || (devCourseId === 'crs_cs202' ? 'CS202: Data Structures' : 'CS101: Python Programming');
          const devResourceLinkId = urlParams.get('resource_link_id') || 'd2l_resource_link_cs101_1';
          const devResourceLinkTitle = urlParams.get('resource_link_title') || urlParams.get('container_name') || 'Programming';

          setLTIContext({
            isLTISession: true,
            userId: devUserId,
            courseId: devCourseId,
            courseTitle: devCourseTitle,
            resourceLinkId: devResourceLinkId,
            resourceLinkTitle: devResourceLinkTitle,
            assignmentId: assignmentContext?.id || 'dev_assignment_789',
            quizId: quizContext?.id,
            userRole: devRole,
            isLoading: false,
          });
          return;
        }

        // Live Brightspace Production mode - parse LTI launch context
        let ltiData: Record<string, string> = {};
        if (sessionData) {
          try {
            ltiData = JSON.parse(sessionData);
          } catch (e) {
            console.error('Failed to parse LTI session data:', e);
          }
        }

        const userId = urlParams.get('user_id') || getCookie('user_id') || ltiData.user_id;
        const courseId = urlParams.get('course_id') || urlParams.get('context_id') || getCookie('course_id') || ltiData.context_id || ltiData.course_id || 'crs_cs101';
        const courseTitle = urlParams.get('course_title') || getCookie('course_title') || ltiData.course_title || ltiData.context_title || 'Brightspace Course';
        const resourceLinkId = urlParams.get('resource_link_id') || ltiData.resource_link_id;
        const resourceLinkTitle = urlParams.get('resource_link_title') || ltiData.resource_link_title || ltiData.resource_link_description || 'Programming';
        const rawRole = urlParams.get('role') || urlParams.get('roles') || getCookie('user_role') || '';
        let userRole: 'student' | 'instructor' | 'admin' | 'faculty' | 'learner' = 'learner';
        const lowerUserId = (userId || '').toLowerCase();
        
        // 1. Authoritative Brightspace Role check (LTI 1.3 claims)
        const isBrightspaceInstructor = rawRole.toLowerCase().includes('instructor') || 
          rawRole.toLowerCase().includes('faculty') ||
          rawRole.toLowerCase().includes('teacher') ||
          rawRole.toLowerCase().includes('professor') ||
          rawRole.toLowerCase().includes('trainer') ||
          rawRole.toLowerCase().includes('mentor') ||
          rawRole.toLowerCase().includes('facilitator') ||
          rawRole.toLowerCase().includes('lecturer') ||
          rawRole.toLowerCase().includes('tutor') ||
          rawRole.toLowerCase().includes('evaluator') ||
          rawRole.toLowerCase().includes('grader') ||
          rawRole.toLowerCase().includes('staff') ||
          rawRole.toLowerCase().includes('teachingassistant') ||
          rawRole.toLowerCase().includes('courseleader') ||
          rawRole.toLowerCase().includes('course_admin');

        const isBrightspaceAdmin = rawRole.toLowerCase().includes('admin');
        const isBrightspaceLearner = rawRole.toLowerCase().includes('learner') || 
          rawRole.toLowerCase().includes('student') ||
          rawRole.toLowerCase().includes('trainee') ||
          rawRole.toLowerCase().includes('scholar') ||
          rawRole.toLowerCase().includes('participant') ||
          rawRole.toLowerCase().includes('cadet') ||
          rawRole.toLowerCase().includes('apprentice') ||
          rawRole.toLowerCase().includes('candidate') ||
          rawRole.toLowerCase().includes('member');

        if (isBrightspaceInstructor) {
          userRole = 'faculty';
        } else if (isBrightspaceAdmin) {
          userRole = 'admin';
        } else if (isBrightspaceLearner) {
          userRole = 'learner';
        } else if (
          lowerUserId.includes('instructor') || 
          lowerUserId.includes('faculty') || 
          lowerUserId.includes('teacher') ||
          lowerUserId.includes('professor') ||
          lowerUserId.includes('trainer')
        ) {
          // Fallback if role claim omitted: instructor account (e.g. instructor009)
          userRole = 'faculty';
        } else {
          // Default for all student accounts (e.g. learner, learner009, Emma, alice) is strictly learner
          userRole = 'learner';
        }

        console.log('%c🎓 [BRIGHTSPACE LTI ROLE IN BROWSER]', 'background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
        console.log('👉 URL Query Role:', urlParams.get('role'));
        console.log('👉 Cookie Role:', getCookie('user_role'));
        console.log('👉 Raw Roles from Brightspace:', urlParams.get('raw_roles') || 'none');
        console.log('👉 Final UI Role:', userRole);
        // Only treat as direct assignment launch if the current URL actually contains assignment_id
        const assignmentId = urlParams.get('assignment_id') || undefined;

        setLTIContext({
          isLTISession: true,
          userId,
          courseId,
          courseTitle,
          resourceLinkId,
          resourceLinkTitle,
          assignmentId,
          quizId: quizContext?.id,
          userRole,
          isLoading: false,
        });
      } catch (error) {
        console.error('[useLTIContext] Resolution error:', error);
        // Fallback gracefully in development mode
        if (process.env.NODE_ENV === 'development') {
          setLTIContext({
            isLTISession: true,
            userId: 'usr_faculty',
            courseId: 'crs_cs101',
            courseTitle: 'CS101: Python Programming',
            resourceLinkId: 'd2l_resource_link_cs101_1',
            resourceLinkTitle: 'Programming',
            userRole: 'faculty',
            isLoading: false,
          });
        } else {
          setLTIContext({
            isLTISession: false,
            isLoading: false,
            error: 'Failed to validate Brightspace LTI session.',
          });
        }
      }
    };

    checkLTISession();
  }, [assignmentContext, quizContext]);

  return ltiContext;
};

export default useLTIContext;

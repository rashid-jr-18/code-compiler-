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
          sessionData ||
          getCookie('lti_session')
        );

        // If in development mode AND no live LMS launch occurred, use Dev Testing Hub
        if (isDevelopment || !hasLiveLtiLaunch) {
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
        const userRole = rawRole.toLowerCase().includes('instructor') || rawRole.toLowerCase().includes('faculty')
          ? 'faculty'
          : rawRole.toLowerCase().includes('admin')
          ? 'admin'
          : 'learner';

        setLTIContext({
          isLTISession: true,
          userId,
          courseId,
          courseTitle,
          resourceLinkId,
          resourceLinkTitle,
          assignmentId: assignmentContext?.id,
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

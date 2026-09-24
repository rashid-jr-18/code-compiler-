'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  ThumbsDown,
  Reply,
  CornerDownRight,
  CheckCircle2, 
  Sparkles, 
  Tag, 
  Search, 
  ArrowLeft, 
  Code2, 
  Send, 
  User as UserIcon, 
  GraduationCap, 
  HelpCircle, 
  Lightbulb, 
  Megaphone,
  BookOpen,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityPost, CommunityReply, Course } from '@/types';
import toast from 'react-hot-toast';

interface CourseCommunityProps {
  course: Course;
  userId?: string;
  userRole?: string;
  initialQuestionId?: string;
  initialQuestionTitle?: string;
  onSelectQuestion?: (questionId: string) => void;
  onOpenProfile?: (authorId: string) => void;
}

export default function CourseCommunity({
  course,
  userId = 'usr_faculty',
  userRole = 'FACULTY',
  initialQuestionId,
  initialQuestionTitle,
  onSelectQuestion,
  onOpenProfile
}: CourseCommunityProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  // Filters & Sorting
  const [filterType, setFilterType] = useState<'all' | 'doubt' | 'solution' | 'announcement' | 'my-submissions'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'replies'>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // New Post Modal
  const [isNewPostOpen, setIsNewPostOpen] = useState(Boolean(initialQuestionId));
  const [newTitle, setNewTitle] = useState(initialQuestionTitle ? `Doubt about ${initialQuestionTitle}` : '');
  const [newContent, setNewContent] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [newLanguage, setNewLanguage] = useState('python');
  const [newTagInput, setNewTagInput] = useState(initialQuestionTitle ? `${initialQuestionTitle.toLowerCase().replace(/\s+/g, '-')}, doubt` : 'doubt');
  const [linkedQuestionId, setLinkedQuestionId] = useState(initialQuestionId || '');
  const [linkedQuestionTitle, setLinkedQuestionTitle] = useState(initialQuestionTitle || '');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Reply to Main Post (inside post box under code snippet)
  const [isPostReplyOpen, setIsPostReplyOpen] = useState(false);
  const [postReplyContent, setPostReplyContent] = useState('');
  const [postReplyCode, setPostReplyCode] = useState('');
  const [showPostCodeSnippet, setShowPostCodeSnippet] = useState(false);
  const [isSubmittingPostReply, setIsSubmittingPostReply] = useState(false);

  // Inline Reply to specific comments in the thread
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [commentReplyDrafts, setCommentReplyDrafts] = useState<Record<string, { content: string; code: string; showCode: boolean }>>({});
  const [isSubmittingCommentReply, setIsSubmittingCommentReply] = useState<Record<string, boolean>>({});

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('courseId', course.id);
      if (filterType !== 'all') params.set('tag', filterType);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/community?${params.toString()}`, {
        headers: {
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        }
      });
      const json = await res.json();
      if (json.success && json.posts) {
        setPosts(json.posts);
      }
    } catch (err) {
      console.error('Failed to load community discussions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [course.id, filterType]);

  const loadPostDetails = async (post: CommunityPost) => {
    setSelectedPost(post);
    setIsLoadingReplies(true);
    try {
      const res = await fetch(`/api/community/${post.id}`, {
        headers: {
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        }
      });
      const json = await res.json();
      if (json.success && json.replies) {
        setReplies(json.replies);
      }
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter both a title and description');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const tags = newTagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({
          courseId: course.id,
          questionId: linkedQuestionId || undefined,
          questionTitle: linkedQuestionTitle || undefined,
          title: newTitle.trim(),
          content: newContent.trim(),
          codeSnippet: newCodeSnippet.trim() || undefined,
          language: newLanguage,
          tags
        })
      });

      const json = await res.json();
      if (json.success && json.post) {
        toast.success('Discussion posted to Course Community!');
        setIsNewPostOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewCodeSnippet('');
        fetchPosts();
        loadPostDetails(json.post);
      } else {
        throw new Error(json.error || 'Failed to create post');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error posting discussion');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleToggleUpvote = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({ action: 'upvote' })
      });
      const json = await res.json();
      if (json.success && json.post) {
        setPosts(prev => prev.map(p => p.id === postId ? json.post : p));
        if (selectedPost?.id === postId) {
          setSelectedPost(json.post);
        }
      }
    } catch (err) {
      toast.error('Failed to upvote');
    }
  };

  const handleToggleDownvote = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({ action: 'downvote' })
      });
      const json = await res.json();
      if (json.success && json.post) {
        setPosts(prev => prev.map(p => p.id === postId ? json.post : p));
        if (selectedPost?.id === postId) {
          setSelectedPost(json.post);
        }
      }
    } catch (err) {
      toast.error('Failed to downvote');
    }
  };

  const handleCreatePostReply = async () => {
    if (!selectedPost || !postReplyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setIsSubmittingPostReply(true);
    try {
      const res = await fetch(`/api/community/${selectedPost.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({
          action: 'reply',
          content: postReplyContent.trim(),
          codeSnippet: postReplyCode.trim() || undefined,
          language: 'python'
        })
      });

      const json = await res.json();
      if (json.success && json.reply) {
        setReplies(prev => [...prev, json.reply]);
        setPostReplyContent('');
        setPostReplyCode('');
        setShowPostCodeSnippet(false);
        setIsPostReplyOpen(false);
        toast.success('Reply posted!');
        fetchPosts();
      } else {
        toast.error(json.error || 'Failed to post reply');
      }
    } catch (err) {
      toast.error('Failed to post reply');
    } finally {
      setIsSubmittingPostReply(false);
    }
  };

  const toggleInlineCommentReply = (commentId: string, authorName: string) => {
    if (activeReplyCommentId === commentId) {
      setActiveReplyCommentId(null);
    } else {
      setActiveReplyCommentId(commentId);
      if (!commentReplyDrafts[commentId]?.content) {
        setCommentReplyDrafts(prev => ({
          ...prev,
          [commentId]: {
            content: `@${authorName} `,
            code: '',
            showCode: false
          }
        }));
      }
      setTimeout(() => {
        const inputEl = document.getElementById(`inline-reply-input-${commentId}`);
        if (inputEl) {
          inputEl.focus();
        }
      }, 50);
    }
  };

  const handleCreateCommentReply = async (parentComment: CommunityReply) => {
    if (!selectedPost) return;
    const draft = commentReplyDrafts[parentComment.id];
    if (!draft || !draft.content.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setIsSubmittingCommentReply(prev => ({ ...prev, [parentComment.id]: true }));
    try {
      const res = await fetch(`/api/community/${selectedPost.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({
          action: 'reply',
          content: draft.content.trim(),
          codeSnippet: draft.code.trim() || undefined,
          language: 'python',
          parentReplyId: parentComment.id,
          replyToAuthorName: parentComment.authorName
        })
      });

      const json = await res.json();
      if (json.success && json.reply) {
        setReplies(prev => [...prev, json.reply]);
        setCommentReplyDrafts(prev => {
          const next = { ...prev };
          delete next[parentComment.id];
          return next;
        });
        setActiveReplyCommentId(null);
        toast.success('Reply added!');
        fetchPosts();
      } else {
        toast.error(json.error || 'Failed to post reply');
      }
    } catch (err) {
      toast.error('Failed to post reply');
    } finally {
      setIsSubmittingCommentReply(prev => ({ ...prev, [parentComment.id]: false }));
    }
  };

  const handleToggleReplyUpvote = async (replyId: string) => {
    if (!selectedPost) return;
    try {
      const res = await fetch(`/api/community/${selectedPost.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({ action: 'upvote_reply', replyId })
      });
      const json = await res.json();
      if (json.success && json.reply) {
        setReplies(prev => prev.map(r => r.id === replyId ? json.reply : r));
      }
    } catch (err) {
      toast.error('Failed to upvote reply');
    }
  };

  const handleToggleReplyDownvote = async (replyId: string) => {
    if (!selectedPost) return;
    try {
      const res = await fetch(`/api/community/${selectedPost.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({ action: 'downvote_reply', replyId })
      });
      const json = await res.json();
      if (json.success && json.reply) {
        setReplies(prev => prev.map(r => r.id === replyId ? json.reply : r));
      }
    } catch (err) {
      toast.error('Failed to downvote reply');
    }
  };

  const handleMarkAccepted = async (replyId: string, currentStatus: boolean) => {
    if (!selectedPost) return;
    try {
      const res = await fetch(`/api/community/${selectedPost.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-role': userRole.toUpperCase()
        },
        body: JSON.stringify({ action: 'accept_reply', replyId, isAccepted: !currentStatus })
      });
      const json = await res.json();
      if (json.success && json.reply) {
        setReplies(prev => prev.map(r => r.id === replyId ? json.reply : r));
        toast.success(currentStatus ? 'Unmarked accepted answer' : 'Marked as accepted answer! 🌟');
      }
    } catch (err) {
      toast.error('Failed to update accepted status');
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filterType === 'doubt') return p.tags?.some(t => t.toLowerCase().includes('doubt'));
    if (filterType === 'solution') return p.tags?.some(t => t.toLowerCase().includes('solution'));
    if (filterType === 'announcement') return p.authorRole === 'FACULTY' || p.tags?.some(t => t.toLowerCase().includes('announcement'));
    if (filterType === 'my-submissions') return p.authorId === userId;
    return true;
  }).filter(p => {
    if (selectedTag) return p.tags?.some(t => t.toLowerCase().includes(selectedTag.toLowerCase()));
    return true;
  }).filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.questionTitle && p.questionTitle.toLowerCase().includes(q)) ||
        p.authorName.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'upvotes') return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
    if (sortBy === 'replies') return (b.repliesCount || 0) - (a.repliesCount || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="w-full space-y-6">
      {/* Community Header (Full Width) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Course Forum
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {course.title}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Community & Problem Discussions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Ask questions, share code solutions, explore approaches, and collaborate with your peers & instructor.
          </p>
        </div>

        <Button
          onClick={() => setIsNewPostOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 h-9 shadow-sm shrink-0 flex items-center gap-1.5 rounded-xl cursor-pointer"
        >
          <Plus size={16} />
          <span>New Discussion</span>
        </Button>
      </div>

      {/* 2-Column Responsive Layout: Left Sidebar + Right Feed */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Quick CTA */}
          <Button
            onClick={() => setIsNewPostOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm h-10 shadow-sm flex items-center justify-center gap-2 rounded-xl cursor-pointer"
          >
            <Plus size={16} />
            <span>Start New Discussion</span>
          </Button>

          {/* Channels / Categories Navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Forum Channels
            </div>

            {/* All Posts */}
            <button
              type="button"
              onClick={() => { setFilterType('all'); setSelectedTag(null); if (selectedPost) setSelectedPost(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all' && !selectedTag
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare size={15} />
                <span>All Posts</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                filterType === 'all' && !selectedTag ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {posts.length}
              </span>
            </button>

            {/* Doubts & Questions */}
            <button
              type="button"
              onClick={() => { setFilterType('doubt'); setSelectedTag(null); if (selectedPost) setSelectedPost(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'doubt'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <HelpCircle size={15} className={filterType === 'doubt' ? 'text-white' : 'text-amber-500'} />
                <span>Doubts & Questions</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                filterType === 'doubt' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {posts.filter(p => p.tags?.some(t => t.toLowerCase().includes('doubt'))).length || 2}
              </span>
            </button>

            {/* Solutions & Approaches */}
            <button
              type="button"
              onClick={() => { setFilterType('solution'); setSelectedTag(null); if (selectedPost) setSelectedPost(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'solution'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Lightbulb size={15} className={filterType === 'solution' ? 'text-white' : 'text-emerald-500'} />
                <span>Solutions & Approaches</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                filterType === 'solution' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {posts.filter(p => p.tags?.some(t => t.toLowerCase().includes('solution'))).length || 1}
              </span>
            </button>

            {/* Announcements */}
            <button
              type="button"
              onClick={() => { setFilterType('announcement'); setSelectedTag(null); if (selectedPost) setSelectedPost(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'announcement'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Megaphone size={15} className={filterType === 'announcement' ? 'text-white' : 'text-purple-500'} />
                <span>Announcements</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                filterType === 'announcement' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {posts.filter(p => p.authorRole === 'FACULTY').length || 1}
              </span>
            </button>

            {/* My Submissions & Queries */}
            <button
              type="button"
              onClick={() => { setFilterType('my-submissions'); setSelectedTag(null); if (selectedPost) setSelectedPost(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'my-submissions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={15} className={filterType === 'my-submissions' ? 'text-white' : 'text-blue-500'} />
                <span>My Posts & Queries</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                filterType === 'my-submissions' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {posts.filter(p => p.authorId === userId).length}
              </span>
            </button>
          </div>

          {/* Popular Problem Tags */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Tag size={13} className="text-blue-500" />
                <span>Popular Tags</span>
              </span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear tag
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['database', 'sql', 'hash-table', 'arrays', 'optimization', 'two-pointers', 'dynamic-programming', 'stack'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(prev => prev === tag ? null : tag);
                    if (selectedPost) setSelectedPost(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Learning Card */}
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-slate-900 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 p-4 space-y-2">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Discussion Etiquette</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              When posting a doubt, include the runtime error or failing test case. When sharing solutions, provide time/space complexity analysis!
            </p>
          </div>
        </aside>

        {/* Right Main Column (Full width flex-1) */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Main View: Post Detail OR Discussion Feed */}
          {selectedPost ? (
            /* ================== POST DETAIL VIEW ================== */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
          {/* Back button */}
          <button
            type="button"
            onClick={() => { setSelectedPost(null); fetchPosts(); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to All Discussions</span>
          </button>

          {/* Question / Post Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedPost.authorRole === 'FACULTY'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {selectedPost.authorRole === 'FACULTY' ? '👨‍🏫 Instructor' : '🎓 Learner'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.(selectedPost.authorId)}
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                    title="View Profile & Analytics"
                  >
                    {selectedPost.authorName}
                  </button>
                  <span className="text-xs text-slate-400">
                    • {new Date(selectedPost.createdAt).toLocaleDateString()} at {new Date(selectedPost.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedPost.title}
                </h1>
              </div>

              {/* Upvote, Downvote & Reply Actions */}
              <div className="flex items-center gap-1.5 self-start">
                <button
                  type="button"
                  onClick={() => handleToggleUpvote(selectedPost.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    selectedPost.upvotes?.includes(userId)
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-600 dark:text-blue-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                  }`}
                  title="Like post"
                >
                  <ThumbsUp size={16} />
                  <span className="text-xs font-bold font-mono">{selectedPost.upvotes?.length || 0}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleDownvote(selectedPost.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    selectedPost.downvotes?.includes(userId)
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-600 dark:text-rose-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                  }`}
                  title="Dislike post"
                >
                  <ThumbsDown size={16} />
                  <span className="text-xs font-bold font-mono">{selectedPost.downvotes?.length || 0}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPostReplyOpen(prev => !prev);
                    if (!isPostReplyOpen) {
                      setTimeout(() => {
                        document.getElementById('post-inline-reply-input')?.focus();
                      }, 50);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    isPostReplyOpen
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400 hover:text-blue-600'
                  }`}
                  title="Reply to post"
                >
                  <Reply size={16} />
                  <span className="text-xs font-bold">Reply</span>
                </button>
              </div>
            </div>

            {/* Linked Problem reference */}
            {selectedPost.questionTitle && (
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Related Challenge: {selectedPost.questionTitle}
                  </span>
                </div>
                {onSelectQuestion && selectedPost.questionId && (
                  <button
                    type="button"
                    onClick={() => onSelectQuestion(selectedPost.questionId!)}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Solve Problem →
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {selectedPost.content}
            </p>

            {/* Code Snippet */}
            {selectedPost.codeSnippet && (
              <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800">
                <div className="bg-slate-800 text-slate-300 text-[11px] font-mono px-3 py-1.5 flex items-center justify-between">
                  <span>Code ({selectedPost.language || 'Code'})</span>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                  <code>{selectedPost.codeSnippet}</code>
                </pre>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {selectedPost.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  #{t}
                </span>
              ))}
            </div>

            {/* Post Bottom Action Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleUpvote(selectedPost.id)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedPost.upvotes?.includes(userId)
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-600 dark:text-blue-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  <ThumbsUp size={13} />
                  <span>{selectedPost.upvotes?.length || 0}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleDownvote(selectedPost.id)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedPost.downvotes?.includes(userId)
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-600 dark:text-rose-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  <ThumbsDown size={13} />
                  <span>{selectedPost.downvotes?.length || 0}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPostReplyOpen(prev => !prev);
                  if (!isPostReplyOpen) {
                    setTimeout(() => {
                      document.getElementById('post-inline-reply-input')?.focus();
                    }, 50);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isPostReplyOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400'
                }`}
              >
                <Reply size={13} />
                <span>Reply</span>
              </button>
            </div>

            {/* Single-Line Inline Reply to Post (Matching image style) */}
            <AnimatePresence>
              {isPostReplyOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {userRole.toUpperCase() === 'FACULTY' ? 'A' : 'R'}
                    </div>
                    <div className="flex-1 relative flex items-center">
                      <input
                        id="post-inline-reply-input"
                        type="text"
                        value={postReplyContent}
                        onChange={e => setPostReplyContent(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey && postReplyContent.trim()) {
                            e.preventDefault();
                            handleCreatePostReply();
                          }
                        }}
                        placeholder="Type reply here..."
                        className="w-full pl-4 pr-24 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                        autoFocus
                      />
                      <div className="absolute right-1.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPostCodeSnippet(!showPostCodeSnippet)}
                          className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors ${
                            showPostCodeSnippet ? 'text-blue-600 dark:text-blue-400' : ''
                          }`}
                          title="Add Code Snippet"
                        >
                          <Code2 size={13} />
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreatePostReply}
                          disabled={isSubmittingPostReply || !postReplyContent.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] h-6 px-2.5 rounded-full shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Send size={11} />
                          <span>Reply</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {showPostCodeSnippet && (
                    <div className="pl-9 space-y-1">
                      <textarea
                        rows={3}
                        value={postReplyCode}
                        onChange={e => setPostReplyCode(e.target.value)}
                        placeholder="def solution():\n    ..."
                        className="w-full p-2.5 text-xs font-mono bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Replies Thread */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Responses</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                {replies.length}
              </span>
            </h3>

            {isLoadingReplies ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading replies...</div>
            ) : replies.length === 0 ? (
              <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                No replies yet. Be the first to share an approach or explanation!
              </div>
            ) : (
              (() => {
                const parentIds = new Set(replies.map(r => r.id));
                const topLevelReplies = replies.filter(r => !r.parentReplyId || !parentIds.has(r.parentReplyId));
                const getChildReplies = (parentId: string) => replies.filter(r => r.parentReplyId === parentId);

                return (
                  <div className="space-y-4">
                    {topLevelReplies.map(parentReply => {
                      const isInstructor = parentReply.authorRole === 'FACULTY' || parentReply.authorRole === 'ADMIN';
                      const hasUpvoted = parentReply.upvotes?.includes(userId);
                      const hasDownvoted = parentReply.downvotes?.includes(userId);
                      const canAccept = userRole.toUpperCase() === 'FACULTY' || selectedPost.authorId === userId;
                      const childReplies = getChildReplies(parentReply.id);
                      const isReplyingToThis = activeReplyCommentId === parentReply.id;
                      const currentDraft = commentReplyDrafts[parentReply.id]?.content || '';
                      const showChildCode = Boolean(commentReplyDrafts[parentReply.id]?.showCode);

                      return (
                        <div key={parentReply.id} className="space-y-3">
                          {/* Parent Comment Card */}
                          <div
                            id={`reply-${parentReply.id}`}
                            className={`p-4 sm:p-5 rounded-xl border bg-white dark:bg-slate-900 transition-all ${
                              parentReply.isAccepted
                                ? 'border-emerald-500/80 bg-emerald-50/15 dark:bg-emerald-950/20'
                                : isInstructor
                                ? 'border-amber-300 dark:border-amber-900/60'
                                : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {parentReply.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onOpenProfile?.(parentReply.authorId)}
                                    className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                                    title="View Learner Profile & Analytics"
                                  >
                                    {parentReply.authorName}
                                  </button>
                                  {isInstructor ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                      👨‍🏫 Instructor
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      🎓 Learner
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    • {new Date(parentReply.createdAt).toLocaleDateString()}
                                  </span>

                                  {parentReply.isAccepted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                      <CheckCircle2 size={11} />
                                      <span>Accepted Solution</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right Actions: Accept */}
                              {canAccept && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAccepted(parentReply.id, Boolean(parentReply.isAccepted))}
                                  className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
                                    parentReply.isAccepted
                                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                                      : 'text-slate-400 hover:text-emerald-600'
                                  }`}
                                  title="Mark as verified solution"
                                >
                                  {parentReply.isAccepted ? '✓ Accepted' : 'Mark Accepted'}
                                </button>
                              )}
                            </div>

                            {/* Comment Body */}
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-9">
                              {parentReply.content}
                            </p>

                            {/* Code Snippet */}
                            {parentReply.codeSnippet && (
                              <div className="mt-2.5 ml-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                <pre className="p-2.5 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                                  <code>{parentReply.codeSnippet}</code>
                                </pre>
                              </div>
                            )}

                            {/* Bottom Toolbar: Upvote, Downvote, Reply (exact matching screenshot) */}
                            <div className="flex items-center gap-3 mt-3 ml-9 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleReplyUpvote(parentReply.id)}
                                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                    hasUpvoted
                                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-600 dark:text-blue-400 font-bold'
                                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                  }`}
                                  title="Upvote"
                                >
                                  <ThumbsUp size={11} />
                                  <span>{parentReply.upvotes?.length || 0}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleReplyDownvote(parentReply.id)}
                                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                    hasDownvoted
                                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-600 dark:text-rose-400 font-bold'
                                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                  }`}
                                  title="Downvote"
                                >
                                  <ThumbsDown size={11} />
                                  <span>{parentReply.downvotes?.length || 0}</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleInlineCommentReply(parentReply.id, parentReply.authorName)}
                                className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                  isReplyingToThis
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                              >
                                <Reply size={12} />
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>

                          {/* EXACT ONE-LINE INLINE REPLY ROW (as shown in user screenshot) */}
                          <AnimatePresence>
                            {isReplyingToThis && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-5 sm:ml-9 space-y-2"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                    {userRole.toUpperCase() === 'FACULTY' ? 'A' : 'R'}
                                  </div>
                                  <div className="flex-1 relative flex items-center">
                                    <input
                                      id={`inline-reply-input-${parentReply.id}`}
                                      type="text"
                                      value={currentDraft}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setCommentReplyDrafts(prev => ({
                                          ...prev,
                                          [parentReply.id]: {
                                            content: val,
                                            code: prev[parentReply.id]?.code || '',
                                            showCode: Boolean(prev[parentReply.id]?.showCode)
                                          }
                                        }));
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey && currentDraft.trim()) {
                                          e.preventDefault();
                                          handleCreateCommentReply(parentReply);
                                        }
                                      }}
                                      placeholder="Type reply here..."
                                      className="w-full pl-4 pr-24 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 shadow-2xs"
                                      autoFocus
                                    />
                                    <div className="absolute right-1.5 flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCommentReplyDrafts(prev => ({
                                            ...prev,
                                            [parentReply.id]: {
                                              content: prev[parentReply.id]?.content || '',
                                              code: prev[parentReply.id]?.code || '',
                                              showCode: !prev[parentReply.id]?.showCode
                                            }
                                          }));
                                        }}
                                        className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors ${
                                          showChildCode ? 'text-blue-600 dark:text-blue-400' : ''
                                        }`}
                                        title="Add Code Snippet"
                                      >
                                        <Code2 size={13} />
                                      </button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleCreateCommentReply(parentReply)}
                                        disabled={Boolean(isSubmittingCommentReply[parentReply.id]) || !currentDraft.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] h-6 px-2.5 rounded-full shadow-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <Send size={11} />
                                        <span>Reply</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {showChildCode && (
                                  <div className="pl-9 space-y-1">
                                    <textarea
                                      rows={2}
                                      value={commentReplyDrafts[parentReply.id]?.code || ''}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setCommentReplyDrafts(prev => ({
                                          ...prev,
                                          [parentReply.id]: {
                                            content: prev[parentReply.id]?.content || '',
                                            code: val,
                                            showCode: true
                                          }
                                        }));
                                      }}
                                      placeholder="def snippet():\n    ..."
                                      className="w-full p-2 text-xs font-mono bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Nested Replies directly under parent, preserving perfect order */}
                          {childReplies.length > 0 && (
                            <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-5 sm:ml-9 pl-3 sm:pl-4 space-y-2.5">
                              {childReplies.map(child => {
                                const isChildInstructor = child.authorRole === 'FACULTY' || child.authorRole === 'ADMIN';
                                const childHasUpvoted = child.upvotes?.includes(userId);
                                const childHasDownvoted = child.downvotes?.includes(userId);
                                const isChildReplyOpen = activeReplyCommentId === child.id;
                                const childDraft = commentReplyDrafts[child.id]?.content || '';
                                const showChildSnippet = Boolean(commentReplyDrafts[child.id]?.showCode);

                                return (
                                  <div key={child.id} className="space-y-2">
                                    <div
                                      id={`reply-${child.id}`}
                                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 space-y-2"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {child.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => onOpenProfile?.(child.authorId)}
                                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                                          >
                                            {child.authorName}
                                          </button>
                                          {isChildInstructor ? (
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                              👨‍🏫 Instructor
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                              Learner
                                            </span>
                                          )}
                                          <span className="text-[11px] text-slate-400">
                                            • {new Date(child.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleReplyUpvote(child.id)}
                                            className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${
                                              childHasUpvoted
                                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-600 dark:text-blue-400 font-bold'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                            }`}
                                            title="Upvote"
                                          >
                                            <ThumbsUp size={10} />
                                            <span>{child.upvotes?.length || 0}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleReplyDownvote(child.id)}
                                            className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${
                                              childHasDownvoted
                                                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-600 dark:text-rose-400 font-bold'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                            }`}
                                            title="Downvote"
                                          >
                                            <ThumbsDown size={10} />
                                            <span>{child.downvotes?.length || 0}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleInlineCommentReply(child.id, child.authorName)}
                                            className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-all flex items-center gap-0.5 cursor-pointer ${
                                              isChildReplyOpen
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
                                            }`}
                                          >
                                            <Reply size={10} />
                                            <span>Reply</span>
                                          </button>
                                        </div>
                                      </div>

                                      {child.replyToAuthorName && (
                                        <div className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                          <CornerDownRight size={11} />
                                          <span>Replying to <span className="font-bold">@{child.replyToAuthorName}</span></span>
                                        </div>
                                      )}

                                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                        {child.content}
                                      </p>

                                      {child.codeSnippet && (
                                        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                          <pre className="p-2 bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                                            <code>{child.codeSnippet}</code>
                                          </pre>
                                        </div>
                                      )}
                                    </div>

                                    {/* Inline reply directly under child reply */}
                                    <AnimatePresence>
                                      {isChildReplyOpen && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="ml-4 space-y-2"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                              {userRole.toUpperCase() === 'FACULTY' ? 'A' : 'R'}
                                            </div>
                                            <div className="flex-1 relative flex items-center">
                                              <input
                                                id={`inline-reply-input-${child.id}`}
                                                type="text"
                                                value={childDraft}
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setCommentReplyDrafts(prev => ({
                                                    ...prev,
                                                    [child.id]: {
                                                      content: val,
                                                      code: prev[child.id]?.code || '',
                                                      showCode: Boolean(prev[child.id]?.showCode)
                                                    }
                                                  }));
                                                }}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter' && !e.shiftKey && childDraft.trim()) {
                                                    e.preventDefault();
                                                    handleCreateCommentReply(parentReply);
                                                  }
                                                }}
                                                placeholder="Type reply here..."
                                                className="w-full pl-3 pr-20 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                                                autoFocus
                                              />
                                              <div className="absolute right-1 flex items-center gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  onClick={() => handleCreateCommentReply(parentReply)}
                                                  disabled={Boolean(isSubmittingCommentReply[parentReply.id]) || !childDraft.trim()}
                                                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] h-5 px-2 rounded-full flex items-center gap-0.5 cursor-pointer"
                                                >
                                                  <Send size={10} />
                                                  <span>Reply</span>
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </motion.div>
      ) : (
        /* ================== DISCUSSION FEED ================== */
        <div className="space-y-4">
          {/* Top Controls: Search Bar & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search discussions by topic, code, or author..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">🕒 Newest First</option>
                <option value="upvotes">🔥 Most Upvoted</option>
                <option value="replies">💬 Most Replies</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(filterType !== 'all' || selectedTag || searchQuery) && (
            <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 px-3.5 py-2 rounded-xl border border-blue-200/70 dark:border-blue-900/40 text-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Filter size={13} />
                <span>
                  Filtering by: <strong>{filterType !== 'all' ? filterType : ''}{selectedTag ? ` #${selectedTag}` : ''}{searchQuery ? ` "${searchQuery}"` : ''}</strong>
                  <span className="text-slate-400 ml-1 font-normal">({filteredPosts.length} results)</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterType('all');
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Clear all filters ✕
              </button>
            </div>
          )}

          {/* Posts List */}
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
              Loading community discussions...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No matching discussions found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No posts match your current search or filter. Try clearing filters or create a new discussion!
              </p>
              <Button
                onClick={() => setIsNewPostOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 px-4 rounded-lg shadow-sm"
              >
                Create Discussion
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map(post => {
                const isInstructor = post.authorRole === 'FACULTY' || post.authorRole === 'ADMIN';
                const hasUpvoted = post.upvotes?.includes(userId);
                const hasDownvoted = post.downvotes?.includes(userId);

                return (
                  <div
                    key={post.id}
                    onClick={() => loadPostDetails(post)}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs cursor-pointer group space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isInstructor
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {isInstructor ? '👨‍🏫 Instructor' : '🎓 Learner'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProfile?.(post.authorId);
                            }}
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                            title="View Learner Profile & Analytics"
                          >
                            {post.authorName}
                          </button>
                          <span className="text-xs text-slate-400">
                            • {new Date(post.createdAt).toLocaleDateString()}
                          </span>

                          {post.questionTitle && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              Challenge: {post.questionTitle}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {post.title}
                        </h3>
                      </div>

                      {/* Upvotes & Downvotes Counter */}
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleUpvote(post.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            hasUpvoted
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-600 dark:text-blue-400'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                          }`}
                          title="Like post"
                        >
                          <ThumbsUp size={12} />
                          <span className="font-mono">{post.upvotes?.length || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDownvote(post.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            hasDownvoted
                              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                          }`}
                          title="Dislike post"
                        >
                          <ThumbsDown size={12} />
                          <span className="font-mono">{post.downvotes?.length || 0}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {post.content}
                    </p>

                    {/* Footer: Tags & Reply Count */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 text-slate-500 font-semibold text-xs">
                        <MessageSquare size={13} />
                        <span>{post.repliesCount} {post.repliesCount === 1 ? 'reply' : 'replies'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
        </div>
      </div>

      {/* ================== NEW DISCUSSION MODAL ================== */}
      <AnimatePresence>
        {isNewPostOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-600" />
                  <span>Start New Discussion</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g., How to handle edge cases with negative numbers in Two Sum?"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {linkedQuestionTitle && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Linked Problem: {linkedQuestionTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setLinkedQuestionId(''); setLinkedQuestionTitle(''); }}
                      className="text-slate-400 hover:text-red-500 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description & Details *
                  </label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Explain what you are trying to do, where you are stuck, or what you learned..."
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Optional Code Snippet</span>
                    <select
                      value={newLanguage}
                      onChange={e => setNewLanguage(e.target.value)}
                      className="bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[10px]"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="sql">SQL</option>
                    </select>
                  </label>
                  <textarea
                    rows={4}
                    value={newCodeSnippet}
                    onChange={e => setNewCodeSnippet(e.target.value)}
                    placeholder="Paste your snippet here..."
                    className="w-full p-2.5 text-xs font-mono bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    placeholder="e.g. doubt, arrays, time-complexity"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewPostOpen(false)}
                  className="text-xs h-8 px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreatePost}
                  disabled={isSubmittingPost || !newTitle.trim() || !newContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-4"
                >
                  {isSubmittingPost ? 'Publishing...' : 'Publish Discussion'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


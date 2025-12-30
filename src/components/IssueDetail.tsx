import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { issuesAPI, commentsAPI, projectsAPI } from '../api';
import type { IssueWithDetails, Comment,  User } from '../api';

function IssueDetail() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<IssueWithDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    title: '',
    description: '',
    status: '' as IssueWithDetails['status'],
    priority: '' as IssueWithDetails['priority'],
    assignee_id: ''
  });

  useEffect(() => {
    if (issueId) {
      loadIssue();
      loadComments();
    }
  }, [issueId]);

  useEffect(() => {
    if (issue) {
      loadProjectMembers();
      setUpdateForm({
        title: issue.title,
        description: issue.description || '',
        status: issue.status,
        priority: issue.priority,
        assignee_id: issue.assignee?.id || ''
      });
    }
  }, [issue]);

  const loadIssue = async () => {
    if (!issueId) return;
    try {
      const response = await issuesAPI.getIssue(issueId);
      setIssue(response.data);
    } catch (error) {
      console.error('Failed to load issue:', error);
    }
  };

  const loadComments = async () => {
    if (!issueId) return;
    try {
      const response = await commentsAPI.getComments(issueId);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async () => {
    if (!issue) return;
    try {
      // Get project details first to find project ID
      const projectsResponse = await projectsAPI.getProjects();
      const project = projectsResponse.data.find(p => p.id === issue.project_id);
      if (project) {
        const membersResponse = await projectsAPI.getProjectMembers(project.id);
        setMembers(membersResponse.data);
      }
    } catch (error) {
      console.error('Failed to load project members:', error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !issueId) return;

    setPostingComment(true);
    try {
      await commentsAPI.createComment(issueId, { body: commentText });
      setCommentText('');
      await loadComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueId) return;

    try {
      const updateData: any = {};
      if (updateForm.title !== issue?.title) updateData.title = updateForm.title;
      if (updateForm.description !== (issue?.description || '')) updateData.description = updateForm.description;
      if (updateForm.status !== issue?.status) updateData.status = updateForm.status;
      if (updateForm.priority !== issue?.priority) updateData.priority = updateForm.priority;
      if (updateForm.assignee_id !== (issue?.assignee?.id || '')) {
        updateData.assignee_id = updateForm.assignee_id || null;
      }

      if (Object.keys(updateData).length > 0) {
        await issuesAPI.updateIssue(issueId, updateData);
        await loadIssue();
        setShowUpdateForm(false);
      }
    } catch (error) {
      console.error('Failed to update issue:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Issue not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          {!showUpdateForm ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{issue.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                  {issue.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(issue.priority)}`}>
                  {issue.priority}
                </span>
                {issue.assignee && (
                  <span className="text-sm text-gray-600">
                    Assigned to {issue.assignee.name}
                  </span>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdateIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={updateForm.priority}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                  <select
                    value={updateForm.assignee_id}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, assignee_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpdateForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="flex space-x-2 ml-4">
          {!showUpdateForm && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Edit Issue
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Back
          </button>
        </div>
      </div>

      {/* Issue Description */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Description</h2>
        </div>
        <div className="px-6 py-4">
          {!showUpdateForm ? (
            <p className="text-gray-700 whitespace-pre-wrap">
              {issue.description || 'No description provided.'}
            </p>
          ) : (
            <textarea
              value={updateForm.description}
              onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the issue..."
            />
          )}
        </div>
      </div>

      {/* Issue Metadata */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Details</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Reporter</dt>
              <dd className="mt-1 text-sm text-gray-900">{issue.reporter.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(issue.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(issue.updated_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Issue ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {issue.id.slice(0, 8)}...
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Comments ({comments.length})
          </h2>
        </div>
        <div className="px-6 py-4">
          {/* Existing Comments */}
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {comment.author.name} • {new Date(comment.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handlePostComment} className="border-t border-gray-200 pt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a comment
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your comment here..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {postingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default IssueDetail;

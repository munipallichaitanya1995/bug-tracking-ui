import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { issuesAPI, projectsAPI } from '../api';
import type { IssueWithDetails, Project, User } from '../api';
import IssueForm from './IssueForm';

function ProjectIssues() {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdStr = projectId || '';
  const [issues, setIssues] = useState<IssueWithDetails[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    q: ''
  });

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadMembers();
      loadIssues();
    }
  }, [projectId, filters]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      // Get project details from projects list (since we don't have individual project API)
      const projectsResponse = await projectsAPI.getProjects();
      const foundProject = projectsResponse.data.find(p => p.id === projectId);
      setProject(foundProject || null);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadMembers = async () => {
    if (!projectId) return;
    try {
      const response = await projectsAPI.getProjectMembers(projectId);
      setMembers(response.data.map((m: any) => m));
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadIssues = async () => {
    if (!projectId) return;
    try {
      const params = {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assignee && { assignee: filters.assignee }),
        ...(filters.q && { q: filters.q })
      };
      const response = await issuesAPI.getIssues(projectId, params);
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {project ? project.name : 'Project'} Issues
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Create Issue
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Assignees</option>
              {members.map((member) => (
                <option key={member?.id} value={member?.id?.toString()}>
                  {member?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search issues..."
              value={filters.q}
              onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No issues found</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Create First Issue
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    to={`/issues/${issue.id}`}
                    className="text-lg font-medium text-gray-900 hover:text-blue-600"
                  >
                    {issue.title}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {issue.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    {issue.assignee && (
                      <span className="text-sm text-gray-500">
                        Assigned to {issue.assignee.name}
                      </span>
                    )}
                    {issue.comments_count && issue.comments_count > 0 ? (
                      <span className="text-sm text-gray-500">
                        💬 {issue.comments_count} comment{issue.comments_count > 1 ? 's' : ''}
                      </span>
                    ):null}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>by {issue.reporter.name}</p>
                  <p>{new Date(issue.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreateForm && projectId && (
        <IssueForm
          projectId={projectId}
          members={members}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            loadIssues(); // Reload issues after creation
          }}
        />
      )}
    </div>
  );
}

export default ProjectIssues;

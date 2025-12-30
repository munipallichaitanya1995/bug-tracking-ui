import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;  // UUID string
  name: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;  // UUID string
  name: string;
  key: string;
  description?: string;
  created_at: string;
  creator_id: string;  // UUID string
}

export interface Issue {
  id: string;  // UUID string
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project_id: string;  // UUID string
  reporter_id: string;  // UUID string
  assignee_id?: string;  // UUID string
  created_at: string;
  updated_at: string;
}

export interface IssueWithDetails extends Issue {
  reporter: User;
  assignee?: User;
  comments_count?: number;
}

export interface Comment {
  id: string;  // UUID string
  body: string;
  issue_id: string;  // UUID string
  author_id: string;  // UUID string
  created_at: string;
  author: User;
}

export interface ProjectMember {
  project_id: string;  // UUID string
  user_id: string;  // UUID string
  role: 'member' | 'maintainer';
  user: User;
}

// Auth API
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),

  logout: () => api.post('/api/auth/logout'),

  getProfile: () => api.get('/api/me'),

  updateProfile: (data: { name?: string; email?: string; password?: string }) =>
    api.put('/api/me', data),
};

// Projects API
export const projectsAPI = {
  getProjects: () => api.get<Project[]>('/api/projects'),

  createProject: (data: { name: string; key: string; description?: string; initial_members?: string[] }) =>
    api.post('/api/projects', data),

  getProjectMembers: (projectId: string) =>
    api.get(`/api/projects/${projectId}/members`),

  addProjectMember: (projectId: string, data: { email: string; role: 'member' | 'maintainer' }) =>
    api.post(`/api/projects/${projectId}/members`, data),
};

// Issues API
export const issuesAPI = {
  getIssues: (projectId: string, params?: {
    q?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    sort?: string;
    order?: string;
  }) => api.get(`/api/projects/${projectId}/issues`, { params }),

  getIssue: (issueId: string) => api.get(`/api/issues/${issueId}`),

  createIssue: (projectId: string, data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assignee_id?: string;
  }) => api.post(`/api/projects/${projectId}/issues`, data),

  updateIssue: (issueId: string, data: Partial<{
    title: string;
    description?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee_id?: string;
  }>) => api.patch(`/api/issues/${issueId}`, data),

  deleteIssue: (issueId: string) => api.delete(`/api/issues/${issueId}`),
};

// Comments API
export const commentsAPI = {
  getComments: (issueId: string) => api.get(`/api/issues/${issueId}/comments`),

  createComment: (issueId: string, data: { body: string }) =>
    api.post(`/api/issues/${issueId}/comments`, data),
};

export default api;

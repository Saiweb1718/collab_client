import client, { SERVER_URL } from './client.js';

// ---- Auth ----
export const authApi = {
  signup: (body) => client.post('/auth/signup', body),
  login: (body) => client.post('/auth/login', body),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
};

// ---- Clusters (companies / workspaces) ----
export const clusterApi = {
  list: () => client.get('/clusters'),
  create: (clusterName) => client.post('/clusters', { clusterName }),
  join: (clusterCode) => client.post('/clusters/join', { clusterCode }),
  get: (clusterId) => client.get(`/clusters/${clusterId}`),
  update: (clusterId, body) => client.patch(`/clusters/${clusterId}`, body),
  remove: (clusterId, confirmName) =>
    client.delete(`/clusters/${clusterId}`, { data: { confirmName } }),
  members: (clusterId) => client.get(`/clusters/${clusterId}/members`),
  setRole: (clusterId, userId, role) =>
    client.patch(`/clusters/${clusterId}/members/${userId}`, { role }),
  removeMember: (clusterId, userId) => client.delete(`/clusters/${clusterId}/members/${userId}`),
  transferOwnership: (clusterId, userId) =>
    client.post(`/clusters/${clusterId}/transfer-ownership`, { userId }),
};

// ---- Projects ----
export const projectApi = {
  mine: () => client.get('/projects'),
  byCluster: (clusterId) => client.get(`/projects/cluster/${clusterId}`),
  get: (projectId) => client.get(`/projects/${projectId}`),
  create: (body) => client.post('/projects', body),
  update: (projectId, body) => client.patch(`/projects/${projectId}`, body),
  remove: (projectId, confirmName) =>
    client.delete(`/projects/${projectId}`, { data: { confirmName } }),
  leave: (projectId) => client.post('/projects/leave', { projectId }),
  members: (projectId) => client.get(`/projects/${projectId}/members`),
  addMember: (projectId, userId) => client.post(`/projects/${projectId}/members`, { userId }),
  removeMember: (projectId, userId) => client.delete(`/projects/${projectId}/members/${userId}`),
  setMemberRole: (projectId, userId, role) =>
    client.patch(`/projects/${projectId}/members/${userId}`, { role }),
  // join requests / approvals
  requestJoin: (projectId, message) => client.post(`/projects/${projectId}/request`, { message }),
  listRequests: (projectId) => client.get(`/projects/${projectId}/requests`),
  decideRequest: (projectId, requestId, decision) =>
    client.post(`/projects/${projectId}/requests/${requestId}`, { decision }),
};

// ---- Tasks ----
export const taskApi = {
  byProject: (projectId) => client.get(`/tasks/project/${projectId}`),
  mine: (params) => client.get('/tasks/mine', { params }), // { status, range }
  get: (taskId) => client.get(`/tasks/${taskId}`),
  create: (body) => client.post('/tasks', body),
  update: (taskId, body) => client.patch(`/tasks/${taskId}`, body),
  remove: (taskId) => client.delete(`/tasks/${taskId}`),
  assign: (taskId, userId) => client.post(`/tasks/${taskId}/assign`, { userId }),
  unassign: (taskId, userId) => client.delete(`/tasks/${taskId}/assign/${userId}`),
};

// ---- Chat ----
export const chatApi = {
  list: () => client.get('/chats'),
  unreadCount: () => client.get('/chats/unread-count'),
  messages: (chatId, params) => client.get(`/chats/${chatId}/messages`, { params }),
  members: (chatId) => client.get(`/chats/${chatId}/members`),
  openDirect: (userId) => client.post('/chats/direct', { userId }),
  markRead: (chatId) => client.post(`/chats/${chatId}/read`),
};

// ---- Users / profile ----
export const userApi = {
  search: (q) => client.get('/users/search', { params: { q } }),
  get: (userId) => client.get(`/users/${userId}`),
  updateProfile: (body) => client.patch('/users/me', body),
  changePassword: (body) => client.post('/users/me/password', body),
};

// ---- Notifications ----
export const notificationApi = {
  list: (params) => client.get('/notifications', { params }),
  unreadCount: () => client.get('/notifications/unread-count'),
  markRead: (id) => client.post(`/notifications/${id}/read`),
  markAllRead: () => client.post('/notifications/read-all'),
};

// ---- Search ----
export const searchApi = {
  global: (q) => client.get('/search', { params: { q } }),
};

// ---- Uploads (Supabase Storage) ----
export const uploadApi = {
  status: () => client.get('/uploads/status'),
  file: async (file, folder = 'chat', onProgress) => {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post(`/uploads?folder=${folder}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / (e.total || 1)) * 100)),
    });
    return res; // { data: { url, type, name, size } }
  },
};

export { SERVER_URL };

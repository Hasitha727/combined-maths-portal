// API Client for ASP.NET Core Backend
const API_BASE = '/api';

export const api = {
  // Auth
  async getUsers() {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async login(userId) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to log in');
    return res.json();
  },

  async loginWithCredentials(identifier, password) {
    const res = await fetch(`${API_BASE}/auth/login-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },

  async registerStudent(studentData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  // File Upload
  async uploadFile(file, folder = 'general') {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/files/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'File upload failed');
    }
    return data; // { fileName, fileUrl, fileSizeMb }
  },

  // Papers
  async getPapers() {
    const res = await fetch(`${API_BASE}/papers`);
    if (!res.ok) throw new Error('Failed to fetch papers');
    return res.json();
  },

  async createPaper(paperData) {
    const res = await fetch(`${API_BASE}/papers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paperData),
    });
    if (!res.ok) throw new Error('Failed to create paper');
    return res.json();
  },

  async deletePaper(id) {
    const res = await fetch(`${API_BASE}/papers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete paper');
    return true;
  },

  // Submissions
  async getSubmissions(paperId = null, studentIndex = null) {
    const params = new URLSearchParams();
    if (paperId) params.append('paperId', paperId);
    if (studentIndex) params.append('studentIndex', studentIndex);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE}/submissions${queryString}`);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },

  async submitAnswer(payload) {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit answer');
    return res.json();
  },

  async gradeSubmission(submissionId, marks, feedback) {
    const res = await fetch(`${API_BASE}/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marks, feedback }),
    });
    if (!res.ok) throw new Error('Failed to grade submission');
    return res.json();
  },

  // Exam Sessions
  async startExamSession(paperId, studentIndex) {
    const res = await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId, studentIndex }),
    });
    if (!res.ok) throw new Error('Failed to start exam session');
    return res.json();
  },

  async getActiveSession(studentIndex, paperId) {
    const res = await fetch(`${API_BASE}/sessions/active?studentIndex=${encodeURIComponent(studentIndex)}&paperId=${encodeURIComponent(paperId)}`);
    if (!res.ok) return null;
    return res.json();
  },

  async logTabSwitch(sessionId) {
    if (!sessionId) return null;
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/tab-switch`, {
      method: 'POST',
    });
    if (!res.ok) return null;
    return res.json();
  }
};

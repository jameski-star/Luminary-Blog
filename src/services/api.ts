const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';

let token: string | null = localStorage.getItem('luminary_token');

export function setApiToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('luminary_token', t);
  else localStorage.removeItem('luminary_token');
}

export function getApiToken() {
  return token;
}

export function isApiMode() {
  return !!BASE;
}

async function request<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }

  return data as T;
}

export const api = {
  auth: {
    signup(body: { name: string; email: string; password: string }) {
      return request<{ token: string; user: import('../types').User }>('/auth/signup', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
    signin(body: { email: string; password: string }) {
      return request<{ token: string; user: import('../types').User }>('/auth/signin', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
    me() {
      return request<{ user: import('../types').User }>('/auth/me');
    },
    updateProfile(body: { name?: string; bio?: string; avatar?: string }) {
      return request<{ user: import('../types').User }>('/auth/profile', {
        method: 'PATCH', body: JSON.stringify(body),
      });
    },
  },

  posts: {
    list(params?: Record<string, string>) {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ posts: import('../types').BlogPost[]; total: number; page: number; totalPages: number }>(`/posts${qs}`);
    },
    search(q: string) {
      return request<{ posts: import('../types').BlogPost[]; total: number }>(`/posts/search?q=${encodeURIComponent(q)}`);
    },
    get(slug: string) {
      return request<{ post: import('../types').BlogPost }>(`/posts/${slug}`);
    },
    create(body: Partial<import('../types').BlogPost>) {
      return request<{ post: import('../types').BlogPost }>('/posts', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
    update(id: string, body: Partial<import('../types').BlogPost>) {
      return request<{ post: import('../types').BlogPost }>(`/posts/${id}`, {
        method: 'PUT', body: JSON.stringify(body),
      });
    },
    delete(id: string) {
      return request<{ ok: boolean }>(`/posts/${id}`, { method: 'DELETE' });
    },
    like(id: string) {
      return request<{ likes: number; liked: boolean }>(`/posts/${id}/like`, { method: 'POST' });
    },
    my(status?: string) {
      const qs = status ? `?status=${status}` : '';
      return request<{ posts: import('../types').BlogPost[] }>(`/posts/my${qs}`);
    },
  },

  admin: {
    posts(params?: Record<string, string>) {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ posts: import('../types').BlogPost[]; total: number }>(`/admin/posts${qs}`);
    },
    setStatus(id: string, status: string) {
      return request<{ post: import('../types').BlogPost }>(`/admin/posts/${id}/status`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      });
    },
    approve(id: string) {
      return request<{ post: import('../types').BlogPost }>(`/admin/posts/${id}/approve`, {
        method: 'PATCH',
      });
    },
    deletePost(id: string) {
      return request<{ ok: boolean }>(`/admin/posts/${id}`, { method: 'DELETE' });
    },
    users() {
      return request<{ users: import('../types').User[] }>('/admin/users');
    },
    promoteUser(id: string) {
      return request<{ user: import('../types').User }>(`/admin/users/${id}/promote`, {
        method: 'PATCH',
      });
    },
    banUser(id: string) {
      return request<{ user: import('../types').User }>(`/admin/users/${id}/ban`, {
        method: 'PATCH',
      });
    },
    unbanUser(id: string) {
      return request<{ user: import('../types').User }>(`/admin/users/${id}/unban`, {
        method: 'PATCH',
      });
    },
  },

  gemini: {
    pipeline(body: { topic: string; keywords: string[] }) {
      return request<import('../types').PipelineResult & { excerpt?: string; tags?: string[] }>('/gemini/pipeline', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
    audit(body: { content: string }) {
      return request<import('../types').AuditResult>('/gemini/audit', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
    format(body: { content: string }) {
      return request<{ content: string }>('/gemini/format', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
  },

  seo: {
    keywords(body: { topic: string }) {
      return request<import('../types').KeywordResearch>('/seo/keywords', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
    competitors(body: { keyword: string }) {
      return request<{ competitors: import('../types').CompetitorAnalysis[]; keyword: string }>('/seo/competitors', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
    optimize(body: { title: string; content: string; keywords?: string[] }) {
      return request<import('../types').ContentOptimization>('/seo/optimize', {
        method: 'POST', body: JSON.stringify(body),
      });
    },
  },
};

import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================================
// REQUEST INTERCEPTOR
// ==========================================================

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {

    const token =
      localStorage.getItem('access_token');

    const tenant = JSON.parse(
      localStorage.getItem('tenant') || 'null'
    );

    const loginSlug =
      localStorage.getItem('login_tenant_slug');

    // JWT Token
    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // --------------------------------------------------
    // LOGIN REQUEST
    // --------------------------------------------------

    if (
      config.url?.startsWith('/api/auth/login')
    ) {
      if (loginSlug) {
        config.headers['X-Tenant-Slug'] =
          loginSlug;
      }
    }

    // --------------------------------------------------
    // SUPER ADMIN ROUTES
    // --------------------------------------------------

    else if (
      config.url?.startsWith('/api/super_admin')
    ) {
      config.headers['X-Tenant-Slug'] =
        'eventsphere-admin';
    }

    // --------------------------------------------------
    // ORGANIZATION ROUTES
    // --------------------------------------------------

    else if (tenant?.slug) {
      config.headers['X-Tenant-Slug'] =
        tenant.slug;
    }
  }

  return config;
});

// ==========================================================
// RESPONSE INTERCEPTOR
// ==========================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {

    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem(
        'access_token'
      );

      localStorage.removeItem(
        'refresh_token'
      );

      localStorage.removeItem(
        'tenant'
      );
    }

    return Promise.reject(error);
  }
);

export default api;
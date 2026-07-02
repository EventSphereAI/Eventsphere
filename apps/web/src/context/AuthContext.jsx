"use client";

import {
createContext,
useContext,
useEffect,
useState,
useCallback,
} from "react";

import { useRouter } from "next/navigation";
import api from "@/utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [user, setUser] = useState(null);
const [tenant, setTenant] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const router = useRouter();

// =========================================================
// FETCH CURRENT USER
// =========================================================

const fetchMe = useCallback(async () => {
const token = localStorage.getItem("access_token");


if (!token) {
  setLoading(false);
  return;
}

try {
  const { data } = await api.get("/api/auth/me");

  setUser(data);

// Restore tenant from localStorage
  const savedTenant = localStorage.getItem("tenant");

if (savedTenant) {
  setTenant(JSON.parse(savedTenant));
}
  setError(null);
  
} catch (err) {
  console.error("Failed to fetch user:", err);

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tenant");

  setUser(null);
  setTenant(null);
} finally {
  setLoading(false);
}


}, []);

useEffect(() => {
fetchMe();
}, [fetchMe]);

// =========================================================
// SIGNUP
// =========================================================

const signup = async (
orgSlug,
orgName,
email,
password,
name
) => {
try {
const { data } = await api.post(
"/api/auth/register-tenant",
{
org_slug: orgSlug,
org_name: orgName,
email,
password,
name,
}
);


  localStorage.setItem(
    "access_token",
    data.access_token
  );

  localStorage.setItem(
    "refresh_token",
    data.refresh_token
  );

  localStorage.setItem(
    "tenant",
    JSON.stringify(data.tenant)
  );

  setUser(data.user);
  setTenant(data.tenant);

  setError(null);

  router.push("/dashboard");

  return data;
} catch (err) {
  const message =
    err.response?.data?.detail ||
    "Signup failed";

  setError(message);

  throw new Error(message);
}


};

// =========================================================
// LOGIN
// =========================================================

const login = async (
orgSlug,
email,
password
) => {
try {
localStorage.setItem(
"login_tenant_slug",
orgSlug
);


  const { data } = await api.post(
    "/api/auth/login",
    {
      email,
      password,
    }
  );

  localStorage.setItem(
    "access_token",
    data.access_token
  );

  localStorage.setItem(
    "refresh_token",
    data.refresh_token
  );

  localStorage.setItem(
    "tenant",
    JSON.stringify(data.tenant)
  );

  localStorage.removeItem(
    "login_tenant_slug"
  );

  setUser(data.user);
  setTenant(data.tenant);

  setError(null);

await fetchMe();

router.push("/dashboard");

  return data;
} catch (err) {
  localStorage.removeItem(
    "login_tenant_slug"
  );

  const message =
    err.response?.data?.detail ||
    "Login failed";

  setError(message);

  throw new Error(message);
}


};

// =========================================================
// LOGOUT
// =========================================================

const logout = () => {
localStorage.removeItem(
"access_token"
);


localStorage.removeItem(
  "refresh_token"
);

localStorage.removeItem(
  "tenant"
);

localStorage.removeItem(
  "login_tenant_slug"
);

setUser(null);
setTenant(null);
setError(null);

router.push("/login");


};

// =========================================================
// CONTEXT
// =========================================================

const value = {
user,
tenant,
loading,
error,
login,
signup,
logout,
refreshUser: fetchMe,
};

return (
<AuthContext.Provider value={value}>
{children}
</AuthContext.Provider>
);
}

export function useAuth() {
const context = useContext(AuthContext);

if (!context) {
throw new Error(
"useAuth must be used inside AuthProvider"
);
}

return context;
}

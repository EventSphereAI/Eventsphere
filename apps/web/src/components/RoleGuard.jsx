'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RoleGuard({
  children,
  allowedRoles,
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (
      !allowedRoles.includes(user.role)
    ) {
      router.push('/dashboard');
    }
  }, [
    user,
    loading,
    allowedRoles,
    router,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (
    !user ||
    !allowedRoles.includes(user.role)
  ) {
    return null;
  }

  return children;
}
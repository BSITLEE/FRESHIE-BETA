import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useUserStore, type UserRole } from '../../utils/useUserStore';
import type { ReactNode } from 'react';

export function RequireRole({
  role,
  children,
}: {
  role: Exclude<UserRole, 'child'>;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { userState } = useUserStore();

  useEffect(() => {
    if (!userState.role) {
      navigate('/');
      return;
    }
    if (userState.role !== role) {
      if (userState.role === 'admin') navigate('/admin-dashboard');
      else if (userState.role === 'teacher') navigate('/teacher-dashboard');
      else navigate('/parent-dashboard');
    }
  }, [navigate, role, userState.role]);

  if (!userState.role) return null;
  if (userState.role !== role) return null;
  return <>{children}</>;
}


'use client';

import { useState, useEffect } from 'react';
import { getToken, getUser, isAuthenticated } from '@/lib/auth';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; displayName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const userData = getUser();
    setAuthenticated(!!token);
    setUser(userData);
    setLoading(false);
  }, []);

  return { authenticated, user, loading, isAuthenticated };
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/boards');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading your Kanban workspace...</p>
        <div className="flex gap-4 mt-2">
          <a
            href="/login"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Go to Login
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="/register"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  Kanban,
  Plus,
  LogOut,
  Users,
  Columns,
  Loader2,
  Calendar,
  X,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface BoardSummary {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  members: { id: string; role: string; user: { id: string; name: string; email: string } }[];
  _count: { columns: number };
  updatedAt: string;
}

export default function BoardsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchBoards();
    }
  }, [user, authLoading, router]);

  const fetchBoards = async () => {
    try {
      const res = await api.get('/boards');
      setBoards(res.data);
    } catch (err: any) {
      console.error('Failed to load boards', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/boards', { title, description });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      // Navigate straight to the new board
      router.push(`/boards/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create board');
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Kanban className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-wide">MiniKanban</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold uppercase text-white shadow-md">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Workspaces</h1>
            <p className="text-slate-400 text-sm mt-1">
              Select a Kanban board or create a new one to collaborate
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Board</span>
          </button>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 max-w-lg mx-auto mt-12">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Kanban className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">No boards yet</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              Create your first Kanban board to start organizing tasks with drag-and-drop.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-md transition-all"
            >
              Create New Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((b) => {
              const isOwner = b.ownerId === user?.id;
              return (
                <div
                  key={b.id}
                  onClick={() => router.push(`/boards/${b.id}`)}
                  className="group relative bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {b.title}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isOwner
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {isOwner ? (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          <span>Owner</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>Member</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-2 h-8 mb-6">
                    {b.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Columns className="w-3.5 h-3.5" />
                        {b._count?.columns || 0} cols
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {b.members?.length || 1}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {new Date(b.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-2">Create New Board</h2>
            <p className="text-slate-400 text-xs mb-6">
              Create a board. Default &apos;To Do&apos;, &apos;In Progress&apos;, and &apos;Done&apos; columns will be auto-generated.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                  Board Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product Launch Q3"
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this workflow is for..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

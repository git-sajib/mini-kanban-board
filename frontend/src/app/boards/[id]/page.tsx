'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ShareBoardModal } from '@/components/kanban/ShareBoardModal';
import {
  ArrowLeft,
  Share2,
  Trash2,
  Loader2,
  Kanban,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await api.get(`/boards/${boardId}`);
      setBoard(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load board or permission denied',
      );
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && boardId) {
      fetchBoard();
    }
  }, [user, authLoading, boardId, router, fetchBoard]);

  const handleDeleteBoard = async () => {
    if (!confirm('Are you sure you want to delete this entire board? This action cannot be undone.')) return;

    try {
      await api.delete(`/boards/${boardId}`);
      router.push('/boards');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete board');
    }
  };

  const handleMemberAdded = (newMember: any) => {
    setBoard((prev: any) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const handleMemberRemoved = (userId: string) => {
    setBoard((prev: any) => ({
      ...prev,
      members: prev.members.filter((m: any) => m.userId !== userId),
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 max-w-md text-center mb-4">
          <p className="font-medium text-sm">{error || 'Board not found'}</p>
        </div>
        <Link
          href="/boards"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Return to Workspaces
        </Link>
      </div>
    );
  }

  const isOwner = board.ownerId === user?.id;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Board Header Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden mr-2">
          <Link
            href="/boards"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
            title="Back to boards"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-5 w-[1px] bg-slate-800 flex-shrink-0" />

          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-xs">
                {board.title}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border flex-shrink-0 ${
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
            {board.description && (
              <p className="hidden sm:block text-[11px] text-slate-400 truncate max-w-md">
                {board.description}
              </p>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Members Avatars Stack */}
          <div
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center -space-x-2 cursor-pointer hover:opacity-90 transition-opacity mr-2"
            title="View collaborators"
          >
            {board.members?.slice(0, 4).map((m: any) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold uppercase text-white shadow-sm"
                title={m.user.name}
              >
                {m.user.name[0]}
              </div>
            ))}
            {board.members?.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300">
                +{board.members.length - 4}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium border border-slate-700/60 shadow-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Share</span>
          </button>

          {isOwner && (
            <button
              onClick={handleDeleteBoard}
              title="Delete Board"
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Kanban Board Canvas */}
      <KanbanBoard
        boardId={board.id}
        initialColumns={board.columns || []}
        members={board.members || []}
      />

      {/* Share Board Modal */}
      {isShareModalOpen && (
        <ShareBoardModal
          boardId={board.id}
          isOwner={isOwner}
          members={board.members || []}
          onClose={() => setIsShareModalOpen(false)}
          onMemberAdded={handleMemberAdded}
          onMemberRemoved={handleMemberRemoved}
        />
      )}
    </div>
  );
}

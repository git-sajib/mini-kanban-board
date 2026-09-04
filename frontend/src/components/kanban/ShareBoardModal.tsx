'use client';

import React, { useState } from 'react';
import { X, UserPlus, Trash2, Search, Shield, User, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface ShareBoardModalProps {
  boardId: string;
  isOwner: boolean;
  members: Member[];
  onClose: () => void;
  onMemberAdded: (newMember: Member) => void;
  onMemberRemoved: (userId: string) => void;
}

export function ShareBoardModal({
  boardId,
  isOwner,
  members,
  onClose,
  onMemberAdded,
  onMemberRemoved,
}: ShareBoardModalProps) {
  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      // Filter out users that are already members
      const existingIds = new Set(members.map((m) => m.user.id));
      setSearchResults(res.data.filter((u: any) => !existingIds.has(u.id)));
    } catch {
      // Ignore search error
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (targetEmail: string) => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await api.post(`/boards/${boardId}/members`, { email: targetEmail });
      onMemberAdded(res.data);
      setSuccess(`User ${targetEmail} added successfully!`);
      setEmail('');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add user to board');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this board?`)) return;

    try {
      await api.delete(`/boards/${boardId}/members/${userId}`);
      onMemberRemoved(userId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Board Collaboration</h2>
        <p className="text-slate-400 text-xs mb-6">
          Share this board with registered team members to collaborate in real-time
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            {success}
          </div>
        )}

        {/* Invite by Email or Search */}
        {isOwner ? (
          <div className="mb-6 pb-6 border-b border-slate-800">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
              Invite by Email or Name
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery || email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search user name or type email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleInvite(email || searchQuery)}
                disabled={submitting || (!email && !searchQuery)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Invite</span>
              </button>
            </div>

            {/* Quick Search Dropdown suggestions */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleInvite(u.email)}
                    className="p-2.5 flex items-center justify-between hover:bg-indigo-600/20 cursor-pointer border-b border-slate-700/50 last:border-none"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <span className="text-xs text-indigo-400 font-medium">Add +</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
            Only the board owner can invite or manage members.
          </div>
        )}

        {/* Current Members List */}
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Current Collaborators ({members.length})
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {members.map((m) => {
              const isMemberOwner = m.role === 'OWNER';
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold uppercase text-white shadow">
                      {m.user.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{m.user.name}</span>
                        {isMemberOwner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Shield className="w-2.5 h-2.5" /> Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/50">
                            <User className="w-2.5 h-2.5" /> Member
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{m.user.email}</p>
                    </div>
                  </div>

                  {isOwner && !isMemberOwner && (
                    <button
                      onClick={() => handleRemove(m.user.id, m.user.name)}
                      title="Remove user"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

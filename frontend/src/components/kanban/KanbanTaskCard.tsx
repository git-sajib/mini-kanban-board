'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, User as UserIcon, AlignLeft } from 'lucide-react';

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  columnId: string;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
}

interface KanbanTaskCardProps {
  task: TaskItem;
  index: number;
  onOpenDetails: (task: TaskItem) => void;
}

export function KanbanTaskCard({ task, index, onOpenDetails }: KanbanTaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative bg-slate-800/80 hover:bg-slate-800 border rounded-xl p-3.5 shadow-sm transition-all duration-150 cursor-pointer ${
            snapshot.isDragging
              ? 'border-indigo-500 shadow-xl shadow-indigo-500/20 rotate-1 scale-[1.02] z-50 bg-slate-800'
              : 'border-slate-700/60 hover:border-slate-600'
          }`}
          onClick={() => onOpenDetails(task)}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
              {task.title}
            </h4>

            <div
              {...provided.dragHandleProps}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-300 transition-opacity cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-700/50 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              {task.description && <AlignLeft className="w-3 h-3 text-slate-500" />}
            </div>

            {task.assignee ? (
              <div
                className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20 text-[10px]"
                title={`Assigned to ${task.assignee.name} (${task.assignee.email})`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold uppercase">
                  {task.assignee.name[0]}
                </div>
                <span className="truncate max-w-[80px]">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                <UserIcon className="w-3 h-3" /> Unassigned
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

'use client';

import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { KanbanTaskCard, TaskItem } from './KanbanTaskCard';
import { Plus, Trash2 } from 'lucide-react';

export interface ColumnItem {
  id: string;
  title: string;
  order: number;
  tasks: TaskItem[];
}

interface KanbanColumnProps {
  column: ColumnItem;
  onAddTask: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onOpenTaskDetails: (task: TaskItem) => void;
}

export function KanbanColumn({
  column,
  onAddTask,
  onDeleteColumn,
  onOpenTaskDetails,
}: KanbanColumnProps) {
  return (
    <div className="w-[82vw] sm:w-80 max-w-[340px] flex-shrink-0 flex flex-col max-h-full bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Column Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
          <h3 className="font-semibold text-sm text-white tracking-wide">
            {column.title}
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTask(column.id)}
            title="Add Task"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteColumn(column.id)}
            title="Delete Column"
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Droppable Task List */}
      <Droppable droppableId={column.id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-950/20' : 'bg-transparent'
            }`}
          >
            {column.tasks.map((task, index) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                index={index}
                onOpenDetails={onOpenTaskDetails}
              />
            ))}
            {provided.placeholder}

            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-800/80 rounded-xl text-slate-500 text-xs p-4 text-center">
                <span>No tasks here</span>
                <button
                  onClick={() => onAddTask(column.id)}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  + Add one
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Column Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full py-2 px-3 flex items-center justify-center gap-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/50"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
}

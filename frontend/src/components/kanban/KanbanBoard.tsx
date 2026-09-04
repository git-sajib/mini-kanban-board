'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn, ColumnItem } from './KanbanColumn';
import { TaskItem } from './KanbanTaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateColumnModal } from './CreateColumnModal';
import { TaskDetailModal } from './TaskDetailModal';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface KanbanBoardProps {
  boardId: string;
  initialColumns: ColumnItem[];
  members: Member[];
}

export function KanbanBoard({ boardId, initialColumns, members }: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);
  const [activeColumnForNewTask, setActiveColumnForNewTask] = useState<string | null>(null);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Sync state if initialColumns change
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Dropped in same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
    const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    // Backup state for rollback
    const previousColumns = [...columns];

    // Optimistic state calculation
    const nextColumns = columns.map((col) => ({
      ...col,
      tasks: [...col.tasks],
    }));

    const sourceTasks = nextColumns[sourceColIndex].tasks;
    const destTasks = nextColumns[destColIndex].tasks;

    const [movedTask] = sourceTasks.splice(source.index, 1);
    const updatedMovedTask = {
      ...movedTask,
      columnId: destination.droppableId,
      order: destination.index,
    };

    destTasks.splice(destination.index, 0, updatedMovedTask);

    // Re-index orders locally
    nextColumns[sourceColIndex].tasks = sourceTasks.map((t, idx) => ({ ...t, order: idx }));
    nextColumns[destColIndex].tasks = destTasks.map((t, idx) => ({ ...t, order: idx }));

    setColumns(nextColumns);

    // Call Backend API
    try {
      await api.patch(`/tasks/${draggableId}/move`, {
        sourceColumnId: source.droppableId,
        targetColumnId: destination.droppableId,
        newOrder: destination.index,
      });
    } catch (err: any) {
      console.error('Failed to persist task movement', err);
      // Rollback on failure
      setColumns(previousColumns);
      alert('Could not move task. Changes have been reverted.');
    }
  };

  const handleTaskCreated = (newTask: TaskItem) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === newTask.columnId) {
          return {
            ...col,
            tasks: [...col.tasks, newTask],
          };
        }
        return col;
      }),
    );
  };

  const handleTaskUpdated = (updatedTask: TaskItem) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === updatedTask.columnId) {
          return {
            ...col,
            tasks: col.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          };
        }
        return col;
      }),
    );
  };

  const handleTaskDeleted = (taskId: string, columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          };
        }
        return col;
      }),
    );
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column and all its tasks?')) return;

    try {
      await api.delete(`/columns/${columnId}`);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete column');
    }
  };

  const handleColumnCreated = (newColumn: ColumnItem) => {
    setColumns((prev) => [...prev, newColumn]);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-4 sm:gap-6 p-4 sm:p-6 overflow-x-auto overflow-y-hidden items-start">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onAddTask={(colId) => setActiveColumnForNewTask(colId)}
              onDeleteColumn={handleDeleteColumn}
              onOpenTaskDetails={(task) => setSelectedTask(task)}
            />
          ))}

          {/* Add Column Button */}
          <div className="w-72 sm:w-80 flex-shrink-0">
            <button
              onClick={() => setIsCreateColumnOpen(true)}
              className="w-full py-4 px-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/30 hover:bg-slate-900/60 text-slate-400 hover:text-white transition-all text-sm font-medium backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Column</span>
            </button>
          </div>
        </div>
      </DragDropContext>

      {/* Modals */}
      {activeColumnForNewTask && (
        <CreateTaskModal
          columnId={activeColumnForNewTask}
          members={members}
          onClose={() => setActiveColumnForNewTask(null)}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {isCreateColumnOpen && (
        <CreateColumnModal
          boardId={boardId}
          onClose={() => setIsCreateColumnOpen(false)}
          onColumnCreated={handleColumnCreated}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, MessageCircle, Calendar, Edit2, Save, X, Download, GripVertical } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type BetaFeedback = Database['public']['Tables']['beta_feedback']['Row'];
type FeedbackStatus = 'to_discuss' | 'low' | 'high' | 'to_implement';

interface KanbanColumn {
  id: FeedbackStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const defaultColumns: KanbanColumn[] = [
  {
    id: 'to_discuss',
    title: 'To Discuss',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  {
    id: 'low',
    title: 'Low Priority',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700'
  },
  {
    id: 'high',
    title: 'High Priority',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700'
  },
  {
    id: 'to_implement',
    title: 'To Implement',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-700'
  },
];

export function FeedbackKanban() {
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null);
  const [estimateValue, setEstimateValue] = useState<number>(0);
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string | null>(null);
  const [columnTitleValue, setColumnTitleValue] = useState<string>('');

  useEffect(() => {
    fetchFeedback();
    loadColumnTitles();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .in('status', ['to_discuss', 'low', 'high', 'to_implement'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadColumnTitles = () => {
    const savedTitles = localStorage.getItem('kanban-column-titles');
    if (savedTitles) {
      try {
        const parsedTitles = JSON.parse(savedTitles);
        setColumns(prev => prev.map(col => ({
          ...col,
          title: parsedTitles[col.id] || col.title
        })));
      } catch (error) {
        console.error('Error loading column titles:', error);
      }
    }
  };

  const saveColumnTitles = (newColumns: KanbanColumn[]) => {
    const titles = newColumns.reduce((acc, col) => {
      acc[col.id] = col.title;
      return acc;
    }, {} as Record<string, string>);
    localStorage.setItem('kanban-column-titles', JSON.stringify(titles));
  };

  const startEditingColumnTitle = (columnId: string, currentTitle: string) => {
    setEditingColumnTitle(columnId);
    setColumnTitleValue(currentTitle);
  };

  const saveColumnTitle = (columnId: string) => {
    const newColumns = columns.map(col => 
      col.id === columnId ? { ...col, title: columnTitleValue.trim() || col.title } : col
    );
    setColumns(newColumns);
    saveColumnTitles(newColumns);
    setEditingColumnTitle(null);
    setColumnTitleValue('');
  };

  const cancelEditingColumnTitle = () => {
    setEditingColumnTitle(null);
    setColumnTitleValue('');
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const { error } = await supabase
        .from('beta_feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;
      
      setFeedback(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating feedback status:', error);
    }
  };

  const updateDevelopmentEstimate = async (feedbackId: string, estimate: number) => {
    try {
      const { error } = await supabase
        .from('beta_feedback')
        .update({ development_estimate: estimate })
        .eq('id', feedbackId);

      if (error) throw error;
      
      setFeedback(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { ...item, development_estimate: estimate }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating development estimate:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, feedbackId: string) => {
    setDraggedItem(feedbackId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    
    const draggedElement = e.currentTarget as HTMLElement;
    const rect = draggedElement.getBoundingClientRect();
    
    const dragPreview = draggedElement.cloneNode(true) as HTMLElement;
    dragPreview.style.width = `${rect.width}px`;
    dragPreview.style.transform = 'rotate(5deg)';
    dragPreview.style.opacity = '0.9';
    dragPreview.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    dragPreview.style.borderRadius = '12px';
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    dragPreview.style.left = '-1000px';
    dragPreview.style.pointerEvents = 'none';
    dragPreview.style.zIndex = '9999';
    
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, rect.width / 2, rect.height / 2);
    
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview);
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnId: FeedbackStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: FeedbackStatus) => {
    e.preventDefault();
    if (draggedItem) {
      const draggedFeedback = feedback.find(item => item.id === draggedItem);
      if (draggedFeedback && draggedFeedback.status !== newStatus) {
        updateFeedbackStatus(draggedItem, newStatus);
      }
    }
    setDraggedItem(null);
    setDragOverColumn(null);
    setIsDragging(false);
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'general_comment':
        return <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getFeedbackTypeBadge = (type: string) => {
    const styles = {
      bug_report: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
      suggestion: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
      general_comment: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    };
    
    const labels = {
      bug_report: 'Bug',
      suggestion: 'Suggestion',
      general_comment: 'Comment',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const getFeedbackByStatus = (status: FeedbackStatus) => {
    return feedback.filter(item => item.status === status);
  };

  const getTotalManHours = () => {
    return feedback
      .filter(item => item.status === 'to_implement')
      .reduce((total, item) => total + (item.development_estimate || 0), 0);
  };

  const startEditingEstimate = (feedbackId: string, currentEstimate: number) => {
    setEditingEstimate(feedbackId);
    setEstimateValue(currentEstimate);
  };

  const saveEstimate = async (feedbackId: string) => {
    await updateDevelopmentEstimate(feedbackId, estimateValue);
    setEditingEstimate(null);
  };

  const cancelEditingEstimate = () => {
    setEditingEstimate(null);
    setEstimateValue(0);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    columns.forEach((column) => {
      const headers = [
        'Date',
        'Type', 
        'Device Type',
        'Device Model',
        'Comment',
        'Email',
        'Anonymous',
        'Status'
      ];

      if (column.id === 'to_implement') {
        headers.splice(-1, 0, 'Development Estimate');
      }

      const statusFeedback = feedback.filter(item => item.status === column.id);

      const rows = statusFeedback.map(item => {
        const baseRow = [
          new Date(item.created_at).toLocaleDateString(),
          item.feedback_type.replace('_', ' '),
          item.device_type,
          item.device_model,
          item.comment,
          item.email || 'N/A',
          item.is_anonymous ? 'Yes' : 'No',
          item.status.replace('_', ' ')
        ];

        if (column.id === 'to_implement') {
          baseRow.splice(-1, 0, `${item.development_estimate || 0} hours`);
        }

        return baseRow;
      });

      const worksheetData = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      const colWidths = headers.map((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...rows.map(row => (row[index] || '').toString().length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, column.title);
    });

    XLSX.writeFile(workbook, 'Feedback-Kanban.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-purple-900 bg-clip-text text-transparent mb-2">
              Feedback Kanban Board
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Manage feedback priorities and development estimates</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-800 transition-all shadow-lg"
          >
            <Download className="h-5 w-5" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-green-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Development Estimate</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {getTotalManHours()} hours
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total implementation time
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnFeedback = getFeedbackByStatus(column.id);
          const isDropTarget = dragOverColumn === column.id;
          const canDrop = isDragging && draggedItem;
          const draggedFeedback = draggedItem ? feedback.find(item => item.id === draggedItem) : null;
          const isValidDrop = draggedFeedback ? draggedFeedback.status !== column.id : true;
          
          return (
            <div
              key={column.id}
              className={`
                group ${column.bgColor} ${column.borderColor} 
                border-2 rounded-lg p-4 min-h-[600px] transition-all duration-200 ease-in-out
                ${canDrop ? 'border-dashed' : 'border-solid'}
                ${isDropTarget && isValidDrop ? 
                  'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02] shadow-lg' : 
                  canDrop && isValidDrop ? 'border-gray-300 dark:border-gray-600' : ''
                }
                ${isDropTarget && !isValidDrop ? 
                  'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20' : ''
                }
              `}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="mb-4">
                <div className={`font-semibold text-lg ${column.color} mb-2 flex items-center justify-between`}>
                  {editingColumnTitle === column.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={columnTitleValue}
                        onChange={(e) => setColumnTitleValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveColumnTitle(column.id);
                          if (e.key === 'Escape') cancelEditingColumnTitle();
                        }}
                      />
                      <button
                        onClick={() => saveColumnTitle(column.id)}
                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditingColumnTitle}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1">{column.title}</span>
                      <button
                        onClick={() => startEditingColumnTitle(column.id, column.title)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {isDropTarget && isValidDrop && (
                    <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 animate-pulse ml-2">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      <span className="text-xs font-normal">Drop here</span>
                    </div>
                  )}
                  {isDropTarget && !isValidDrop && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 ml-2">
                      <X className="w-3 h-3" />
                      <span className="text-xs font-normal">Already here</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {columnFeedback.length} items
                  </span>
                  {column.id === 'to_implement' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {columnFeedback.reduce((total, item) => total + (item.development_estimate || 0), 0)} hours
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {columnFeedback.map((item) => {
                  const isBeingDragged = draggedItem === item.id;
                  
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={`
                        group relative bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 
                        transition-all duration-200 ease-in-out
                        ${isBeingDragged ? 
                          'opacity-40 scale-95 rotate-2 shadow-2xl border-blue-300 dark:border-blue-600' : 
                          'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 cursor-grab active:cursor-grabbing'
                        }
                        ${isDragging && !isBeingDragged ? 'opacity-75' : ''}
                      `}
                    >
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      
                      <div className="pl-2">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getFeedbackTypeIcon(item.feedback_type)}
                            {getFeedbackTypeBadge(item.feedback_type)}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {item.device_type} - {item.device_model}
                          </div>
                          {!item.is_anonymous && item.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.email}
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <p
                            className={`text-sm text-gray-800 dark:text-gray-200 transition-all cursor-pointer ${editingEstimate === item.id ? '' : (item.id === expandedCommentId ? '' : 'line-clamp-3')}`}
                            onClick={() => setExpandedCommentId(item.id)}
                          >
                            {item.comment}
                          </p>
                          {item.id === expandedCommentId && (
                            <button
                              className="mt-1 text-xs text-blue-600 dark:text-blue-400 underline float-right"
                              onClick={() => setExpandedCommentId(null)}
                            >
                              Show less
                            </button>
                          )}
                        </div>

                        {column.id === 'to_implement' && (
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Estimate:
                              </span>
                              {editingEstimate === item.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="999"
                                    step="0.5"
                                    value={estimateValue}
                                    onChange={(e) => setEstimateValue(parseFloat(e.target.value) || 0)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEstimate(item.id)
                                      if (e.key === 'Escape') cancelEditingEstimate()
                                    }}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveEstimate(item.id)}
                                    className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditingEstimate}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {item.development_estimate || 0} hours
                                  </span>
                                  <button
                                    onClick={() => startEditingEstimate(item.id, item.development_estimate || 0)}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {columnFeedback.length === 0 && (
                  <div className={`text-center py-8 transition-all duration-200 ${
                    isDropTarget && isValidDrop ? 'scale-105' : ''
                  }`}>
                    <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isDropTarget && isValidDrop ? 'Drop feedback here' : 'No feedback in this column'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

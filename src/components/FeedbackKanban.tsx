import React, { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, MessageCircle, Calendar, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type BetaFeedback = Database['public']['Tables']['beta_feedback']['Row'];
type FeedbackStatus = 'to_discuss' | 'low' | 'high' | 'to_implement' /*| 'archived' | 'published'*/;

interface KanbanColumn {
  id: FeedbackStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const columns: KanbanColumn[] = [
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
  // {
  //   id: 'archived',
  //   title: 'Archived',
  //   color: 'text-purple-700 dark:text-purple-300',
  //   bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  //   borderColor: 'border-purple-200 dark:border-purple-700'
  // },
  // {
  //   id: 'published',
  //   title: 'Published',
  //   color: 'text-emerald-700 dark:text-emerald-300',
  //   bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  //   borderColor: 'border-emerald-200 dark:border-emerald-700'
  // }
];

export function FeedbackKanban() {
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null);
  const [estimateValue, setEstimateValue] = useState<number>(0);
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .in('status', ['to_discuss', 'low', 'high', 'to_implement'/*, 'archived', 'published'*/])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const { error } = await supabase
        .from('beta_feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;
      
      // Update local state
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
      
      // Update local state
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
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: FeedbackStatus) => {
    e.preventDefault();
    if (draggedItem) {
      updateFeedbackStatus(draggedItem, newStatus);
      setDraggedItem(null);
    }
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

  const getTotalManDays = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          Feedback Kanban Board
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Manage feedback priorities and development estimates</p>
      </div>

      {/* Total Man Days Summary */}
      <div className="mb-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-green-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Development Estimate</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {getTotalManDays()} days
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total implementation time
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnFeedback = getFeedbackByStatus(column.id);
          
          return (
            <div
              key={column.id}
              className={`${column.bgColor} ${column.borderColor} border-2 border-dashed rounded-lg p-4 min-h-[600px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="mb-4">
                <h3 className={`font-semibold text-lg ${column.color} mb-2`}>
                  {column.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {columnFeedback.length} items
                  </span>
                  {column.id === 'to_implement' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {columnFeedback.reduce((total, item) => total + (item.development_estimate || 0), 0)} days
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback Cards */}
              <div className="space-y-3">
                {columnFeedback.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-all ${
                      draggedItem === item.id ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getFeedbackTypeIcon(item.feedback_type)}
                        {getFeedbackTypeBadge(item.feedback_type)}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Device Info */}
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

                    {/* Comment */}
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

                    {/* Development Estimate (only for "To Implement" column) */}
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
                                value={estimateValue}
                                onChange={(e) => setEstimateValue(parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
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
                                {item.development_estimate || 0} days
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
                ))}

                {columnFeedback.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No feedback in this column
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
import React, { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, MessageCircle, Search, Download, CheckCircle, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type BetaFeedback = Database['public']['Tables']['beta_feedback']['Row'];
type FeedbackStatus = 'to_discuss' | 'low' | 'high' | 'to_implement' | 'archived'/* | 'published'*/;

export function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<BetaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Multi-select functionality
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<FeedbackStatus>('to_discuss');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const itemsPerPage = 10;

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFeedback = filteredFeedback.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    filterFeedback();
  }, [feedback, searchTerm, typeFilter, deviceFilter, statusFilter]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFeedback = () => {
    let filtered = feedback;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.device_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.feedback_type === typeFilter);
    }

    if (deviceFilter !== 'all') {
      filtered = filtered.filter(item => item.device_type === deviceFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredFeedback(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const { error } = await supabase
        .from('beta_feedback')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', feedbackId);

      if (error) throw error;
      await fetchFeedback();
    } catch (error) {
      console.error('Error updating feedback status:', error);
    }
  };

  const handleFeedbackSelection = (feedbackId: string) => {
    setSelectedFeedback(prev =>
      prev.includes(feedbackId)
        ? prev.filter(id => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const selectAllVisibleFeedback = () => {
    const visibleFeedbackIds = currentFeedback.map(item => item.id);
    const allSelected = visibleFeedbackIds.every(id => selectedFeedback.includes(id));
    
    if (allSelected) {
      setSelectedFeedback(prev => prev.filter(id => !visibleFeedbackIds.includes(id)));
    } else {
      setSelectedFeedback(prev => [...new Set([...prev, ...visibleFeedbackIds])]);
    }
  };

  const updateBulkFeedbackStatus = async () => {
    if (selectedFeedback.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('beta_feedback')
        .update({ 
          status: bulkStatus, 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedFeedback);

      if (error) throw error;
      await fetchFeedback();
      setSelectedFeedback([]);
    } catch (error) {
      console.error('Error updating feedback status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const feedbackToExport = selectedFeedback.length > 0 
      ? filteredFeedback.filter(item => selectedFeedback.includes(item.id))
      : filteredFeedback;
    
    const headers = ['Date', 'Type', 'Device Type', 'Device Model', 'Comment', 'Email', 'Anonymous', 'Status'];
    const csvContent = [
      headers.join(','),
      ...feedbackToExport.map(item => [
        new Date(item.created_at).toLocaleDateString(),
        item.feedback_type.replace('_', ' '),
        item.device_type,
        item.device_model,
        `"${item.comment.replace(/"/g, '""')}"`, // Escape quotes in comment
        item.email || 'N/A',
        item.is_anonymous ? 'Yes' : 'No',
        item.status.replace('_', ' ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFeedback.length > 0 ? 'selected-beta-feedback.csv' : 'beta-feedback.csv';
    a.click();
    URL.revokeObjectURL(url);
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

  const getStatusBadge = (status: FeedbackStatus) => {
    const styles = {
      to_discuss: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
      high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
      to_implement: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
      archived: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700'
      // published: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    };
    
    const labels = {
      to_discuss: 'To Discuss',
      low: 'Low Priority',
      high: 'High Priority',
      to_implement: 'To Implement',
      archived: 'Archived'
      // published: 'Published',
    };
    
    return (
      <span className={`px-3 py-1 rounded-md text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStats = () => {
    const total = feedback.length;
    const bugReports = feedback.filter(f => f.feedback_type === 'bug_report').length;
    const suggestions = feedback.filter(f => f.feedback_type === 'suggestion').length;
    const comments = feedback.filter(f => f.feedback_type === 'general_comment').length;
    const archived = feedback.filter(f => f.status === 'archived').length;
    // const published = feedback.filter(f => f.status === 'published').length;

    return { total, bugReports, suggestions, comments, archived/*, published*/ };
  };

  const stats = getStats();

  const changePage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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
          Beta Feedback Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Review and manage feedback from beta testers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-blue-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Feedback</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-red-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bug Reports</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.bugReports}</p>
            </div>
            <Bug className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suggestions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.suggestions}</p>
            </div>
            <Lightbulb className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-blue-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Comments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.comments}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-purple-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Archived</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.archived}</p>
            </div>
            <Archive className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
{/* 
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-emerald-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.published}</p>
            </div>
            <Eye className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div> */}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-blue-100 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-grow">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Types</option>
              <option value="bug_report">Bug Reports</option>
              <option value="suggestion">Suggestions</option>
              <option value="general_comment">General Comments</option>
            </select>

            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Devices</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              <option value="to_discuss">To Discuss</option>
              <option value="low">Low Priority</option>
              <option value="high">High Priority</option>
              <option value="to_implement">To Implement</option>
              <option value="archived">Archived</option>
              {/* <option value="published">Published</option> */}
            </select>
          </div>
          
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-md hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>{selectedFeedback.length > 0 ? `Export Selected (${selectedFeedback.length})` : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="mb-4 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedFeedback.length} feedback items selected
            </span>
            <button
              onClick={selectAllVisibleFeedback}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {currentFeedback.every(item => selectedFeedback.includes(item.id))
                ? 'Deselect All'
                : 'Select All Visible'}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as FeedbackStatus)}
              className="border border-gray-200 dark:border-gray-600 rounded-md px-4 py-1 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              disabled={selectedFeedback.length === 0}
            >
              <option value="to_discuss">To Discuss</option>
              <option value="low">Low Priority</option>
              <option value="high">High Priority</option>
              <option value="to_implement">To Implement</option>
              <option value="archived">Archived</option>
              {/* <option value="published">Published</option> */}
            </select>
            
            <button
              onClick={updateBulkFeedbackStatus}
              disabled={selectedFeedback.length === 0 || isProcessing}
              className="flex items-center space-x-2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-md hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Update Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-blue-100 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {currentFeedback.map((item) => (
            <div key={item.id} className={`p-6 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors ${
              selectedFeedback.includes(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/30' : ''
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedFeedback.includes(item.id)}
                    onChange={() => handleFeedbackSelection(item.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  {getFeedbackTypeIcon(item.feedback_type)}
                  {getFeedbackTypeBadge(item.feedback_type)}
                  {getStatusBadge(item.status)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {item.device_type} - {item.device_model}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.is_anonymous ? 'Anonymous' : item.email}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{item.comment}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(item.updated_at).toLocaleDateString()} at {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                <select
                  value={item.status}
                  onChange={(e) => updateFeedbackStatus(item.id, e.target.value as FeedbackStatus)}
                  className="text-sm border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="to_discuss">To Discuss</option>
                  <option value="low">Low Priority</option>
                  <option value="high">High Priority</option>
                  <option value="to_implement">To Implement</option>
                  <option value="archived">Archived</option>
                  {/* <option value="published">Published</option> */}
                </select>
              </div>
            </div>
          ))}
        </div>

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No feedback found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {filteredFeedback.length > itemsPerPage && (
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredFeedback.length)} of {filteredFeedback.length} feedback items
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
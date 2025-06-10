import React, { useState, useEffect } from 'react';
import { Users, Smartphone, Clock, CheckCircle, Download, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type BetaTester = Database['public']['Tables']['beta_testers']['Row'];

export function AdminDashboard() {
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [filteredTesters, setFilteredTesters] = useState<BetaTester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  // Add new state variables
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<BetaTester['status']>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const testersPerPage = 10;

  // Calculate pagination values
  const indexOfLastTester = currentPage * testersPerPage;
  const indexOfFirstTester = indexOfLastTester - testersPerPage;
  const currentTesters = filteredTesters.slice(indexOfFirstTester, indexOfLastTester);
  const totalPages = Math.ceil(filteredTesters.length / testersPerPage);

  useEffect(() => {
    fetchTesters();
  }, []);

  useEffect(() => {
    filterTesters();
  }, [testers, searchTerm, statusFilter, deviceFilter]);

  const fetchTesters = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_testers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTesters(data || []);
    } catch (error) {
      console.error('Error fetching testers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTesters = () => {
    let filtered = testers;

    if (searchTerm) {
      filtered = filtered.filter(tester =>
        tester.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tester.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tester => tester.status === statusFilter);
    }

    if (deviceFilter !== 'all') {
      filtered = filtered.filter(tester => tester.device_type === deviceFilter);
    }

    setFilteredTesters(filtered);
  };

  const updateTesterStatus = async (testerId: string, newStatus: BetaTester['status']) => {
    try {
      const { error } = await supabase
        .from('beta_testers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', testerId);

      if (error) throw error;
      await fetchTesters();
    } catch (error) {
      console.error('Error updating tester status:', error);
    }
  };

  const exportToCSV = () => {
    // Determine which testers to export - either selected ones or all filtered ones
    const testersToExport = selectedTesters.length > 0 
      ? filteredTesters.filter(tester => selectedTesters.includes(tester.id))
      : filteredTesters;
    
    const headers = ['Name', 'Email', 'Device Type', 'Device Model', 'Experience', 'Status', 'Registration Date'];
    const csvContent = [
      headers.join(','),
      ...testersToExport.map(tester => [
        tester.full_name,
        tester.email,
        tester.device_type,
        tester.device_model,
        tester.experience_level,
        tester.status,
        new Date(tester.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedTesters.length > 0 ? 'selected-beta-testers.csv' : 'beta-testers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: BetaTester['status']) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
      approved: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
      invited: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
      active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
      declined: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
    };
    
    return (
      <span className={`px-3 py-1 rounded-md text-xs font-medium border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStats = () => {
    const total = testers.length;
    const pending = testers.filter(t => t.status === 'pending').length;
    const active = testers.filter(t => t.status === 'active').length;
    const approved = testers.filter(t => t.status === 'approved').length;

    return { total, pending, active, approved };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-200 dark:border-yellow-700 border-t-yellow-600 dark:border-t-yellow-400"></div>
      </div>
    );
  }

  // Add these new functions
  const handleTesterSelection = (testerId: string) => {
    setSelectedTesters(prev =>
      prev.includes(testerId)
        ? prev.filter(id => id !== testerId)
        : [...prev, testerId]
    );
  };

  const selectAllVisibleTesters = () => {
    const visibleTesterIds = currentTesters.map(tester => tester.id);
    const allSelected = visibleTesterIds.every(id => selectedTesters.includes(id));
    
    if (allSelected) {
      setSelectedTesters(prev => prev.filter(id => !visibleTesterIds.includes(id)));
    } else {
      setSelectedTesters(prev => [...new Set([...prev, ...visibleTesterIds])]);
    }
  };

  const updateBulkTesterStatus = async () => {
    if (selectedTesters.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('beta_testers')
        .update({ 
          status: bulkStatus, 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedTesters);

      if (error) throw error;
      await fetchTesters();
      setSelectedTesters([]);
    } catch (error) {
      console.error('Error updating tester status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const changePage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
          Beta Testers Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Manage and track your beta testing program</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applicants</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-orange-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-green-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Testers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
            </div>
            <Smartphone className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 px-3 py-4 mb-4">
          <div className="flex justify-between gap-4">
            <div className="relative flex flex-grow gap-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-w-0 flex-grow pr-3 py-1 border border-gray-200 dark:border-gray-600 rounded-md focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div className='flex gap-4'>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-md focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="invited">Invited</option>
              <option value="active">Active</option>
              <option value="declined">Declined</option>
            </select>

            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-md focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Devices</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="huawei">Huawei</option>
            </select>
            </div>
          </div>
      </div>

      {/* Bulk Actions */}
      <div className="mb-4 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-sm border border-yellow-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedTesters.length} testers selected
            </span>
            <button
              onClick={selectAllVisibleTesters}
              className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
            >
              {currentTesters.every(tester => selectedTesters.includes(tester.id))
                ? 'Deselect All'
                : 'Select All Visible'}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as BetaTester['status'])}
              className="border border-gray-200 dark:border-gray-600 rounded-md px-4 py-1 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={selectedTesters.length === 0}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="invited">Invited</option>
              <option value="active">Active</option>
              <option value="declined">Declined</option>
            </select>
            
            <button
              onClick={updateBulkTesterStatus}
              disabled={selectedTesters.length === 0 || isProcessing}
              className="flex items-center space-x-2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 text-white rounded-md hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Update Status</span>
            </button>
            
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-500 dark:to-orange-500 text-white rounded-md hover:from-yellow-700 hover:to-orange-700 dark:hover:from-yellow-600 dark:hover:to-orange-600 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>{selectedTesters.length > 0 ? `Export Selected (${selectedTesters.length})` : 'Export CSV'}</span>
          </button>
          </div>
        </div>
      </div>

      {/* Testers Table */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={currentTesters.length > 0 && currentTesters.every(tester => selectedTesters.includes(tester.id))}
                    onChange={selectAllVisibleTesters}
                    className="h-4 w-4 text-yellow-600 rounded border-gray-300 dark:border-gray-600 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tester
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentTesters.map((tester) => (
                <tr key={tester.id} className={`hover:bg-yellow-50/30 dark:hover:bg-yellow-900/20 transition-colors ${
                  selectedTesters.includes(tester.id) ? 'bg-yellow-50/50 dark:bg-yellow-900/30' : ''
                }`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTesters.includes(tester.id)}
                      onChange={() => handleTesterSelection(tester.id)}
                      className="h-4 w-4 text-yellow-600 rounded border-gray-300 dark:border-gray-600 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{tester.full_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{tester.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">{tester.device_type}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{tester.device_model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-gray-900 dark:text-gray-100">{tester.experience_level}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(tester.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tester.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={tester.status}
                      onChange={(e) => updateTesterStatus(tester.id, e.target.value as BetaTester['status'])}
                      className="text-sm border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="invited">Invited</option>
                      <option value="active">Active</option>
                      <option value="declined">Declined</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTesters.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No testers found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTesters.length > 15 && (
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {indexOfFirstTester + 1}-{Math.min(indexOfLastTester, filteredTesters.length)} of {filteredTesters.length} testers
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
              // Show pages around current page
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
                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
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
  );
}








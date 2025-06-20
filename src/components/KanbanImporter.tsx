import React, { useState, useCallback } from 'react';
import { MessageSquare, Bug, Lightbulb, MessageCircle, Calendar, Edit2, Save, X, Download, GripVertical, Upload, FileText, AlertCircle, DownloadIcon, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

type FeedbackType = 'bug_report' | 'suggestion' | 'general_comment';
type FeedbackStatus = 'to_discuss' | 'low' | 'high' | 'to_implement';

interface ImportedFeedback {
  id: string;
  type: FeedbackType;
  module: string;
  title: string;
  description: string;
  status: FeedbackStatus;
  development_estimate?: number;
  created_at: string;
}

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

export function KanbanImporter() {
  const [feedback, setFeedback] = useState<ImportedFeedback[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null);
  const [estimateValue, setEstimateValue] = useState<number>(0);
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string | null>(null);
  const [columnTitleValue, setColumnTitleValue] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<KanbanColumn | null>(null);
 
   // Prevent default drag behaviors on document
   React.useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDocumentDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragenter', preventDefaults, false);
    document.addEventListener('dragover', preventDefaults, false);
    document.addEventListener('dragleave', handleDocumentDragLeave, false);
    document.addEventListener('drop', handleDocumentDrop, false);

    return () => {
      document.removeEventListener('dragenter', preventDefaults, false);
      document.removeEventListener('dragover', preventDefaults, false);
      document.removeEventListener('dragleave', handleDocumentDragLeave, false);
      document.removeEventListener('drop', handleDocumentDrop, false);
    };
  }, []);

  const processFile = useCallback((file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadError('Please select a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setUploadError('CSV file must contain at least a header row and one data row.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['type', 'module', 'title', 'description', 'status'];
        
        const missingHeaders = requiredHeaders.filter(header => 
          !headers.some(h => h.includes(header))
        );
        
        if (missingHeaders.length > 0) {
          setUploadError(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        const typeIndex = headers.findIndex(h => h.includes('type'));
        const moduleIndex = headers.findIndex(h => h.includes('module'));
        const titleIndex = headers.findIndex(h => h.includes('title'));
        const descriptionIndex = headers.findIndex(h => h.includes('description'));
        const statusIndex = headers.findIndex(h => h.includes('status'));

        const parsedFeedback: ImportedFeedback[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length < requiredHeaders.length) continue;

          const typeValue = values[typeIndex]?.toLowerCase();
          const statusValue = values[statusIndex]?.toLowerCase();
          
          // Validate and map type
          let type: FeedbackType = 'general_comment';
          if (typeValue?.includes('bug')) type = 'bug_report';
          else if (typeValue?.includes('suggestion')) type = 'suggestion';
          
          // Validate and map status
          let status: FeedbackStatus = 'to_discuss';
          if (statusValue?.includes('low')) status = 'low';
          else if (statusValue?.includes('high')) status = 'high';
          else if (statusValue?.includes('implement')) status = 'to_implement';

          parsedFeedback.push({
            id: `imported-${Date.now()}-${i}`,
            type,
            module: values[moduleIndex] || 'Unknown',
            title: values[titleIndex] || 'Untitled',
            description: values[descriptionIndex] || 'No description',
            status, // Use the computed status
            development_estimate: 0,
            created_at: new Date().toISOString()
          });
        }

        if (parsedFeedback.length === 0) {
          setUploadError('No valid feedback entries found in the CSV file.');
          return;
        }

        setFeedback(parsedFeedback);
        setIsUploaded(true);
        setUploadError(null);
        
      } catch {
        setUploadError('Error parsing CSV file. Please check the format and try again.');
      }
    };

    reader.readAsText(file);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  }, [processFile]);

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const updateFeedbackStatus = (feedbackId: string, newStatus: FeedbackStatus) => {
    setFeedback(prev => 
      prev.map(item => 
        item.id === feedbackId 
          ? { ...item, status: newStatus }
          : item
      )
    );
  };

  const updateDevelopmentEstimate = (feedbackId: string, estimate: number) => {
    setFeedback(prev => 
      prev.map(item => 
        item.id === feedbackId 
          ? { ...item, development_estimate: estimate }
          : item
      )
    );
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

  const getFeedbackTypeIcon = (type: FeedbackType) => {
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

  const getFeedbackTypeBadge = (type: FeedbackType) => {
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
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[type]}`}>
        {labels[type]}
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

  const startEditingColumnTitle = (columnId: string, currentTitle: string) => {
    setEditingColumnTitle(columnId);
    setColumnTitleValue(currentTitle);
  };

  const saveColumnTitle = (columnId: string) => {
    const newColumns = columns.map(col => 
      col.id === columnId ? { ...col, title: columnTitleValue.trim() || col.title } : col
    );
    setColumns(newColumns);
    setEditingColumnTitle(null);
    setColumnTitleValue('');
  };

  const cancelEditingColumnTitle = () => {
    setEditingColumnTitle(null);
    setColumnTitleValue('');
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (column) {
      setColumnToDelete(column);
    }
  };

  const confirmDeleteColumn = () => {
    if (!columnToDelete) return;

    setFeedback(prev =>
      prev.map(f =>
        f.status === columnToDelete.id ? { ...f, status: 'to_discuss' } : f
      )
    );

    const newColumns = columns.filter(c => c.id !== columnToDelete.id);
    setColumns(newColumns);
    
    setColumnToDelete(null);
  };
 
   const startEditingEstimate = (feedbackId: string, currentEstimate: number) => {
     setEditingEstimate(feedbackId);
    setEstimateValue(currentEstimate);
  };

  const saveEstimate = (feedbackId: string) => {
    updateDevelopmentEstimate(feedbackId, estimateValue);
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
        'Type',
        'Module',
        'Title', 
        'Description',
        'Status',
        'Created Date'
      ];

      if (column.id === 'to_implement') {
        headers.splice(-1, 0, 'Development Estimate');
      }

      const statusFeedback = feedback.filter(item => item.status === column.id);

      const rows = statusFeedback.map(item => {
        const baseRow = [
          item.type.replace('_', ' '),
          item.module,
          item.title,
          item.description,
          item.status.replace('_', ' '),
          new Date(item.created_at).toLocaleDateString()
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

    XLSX.writeFile(workbook, 'Imported-Feedback-Kanban.xlsx');
  };

  const resetImporter = () => {
    setFeedback([]);
    setIsUploaded(false);
    setUploadError(null);
    setColumns(defaultColumns);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Type', 'Module', 'Title', 'Description', 'Status'],
      ['bug_report', 'Authentication', 'Login fails with special characters', 'Users cannot login when password contains special characters like @#$', 'to_discuss'],
      ['suggestion', 'UI/UX', 'Add dark mode toggle', 'Users would like a dark mode option in the settings menu', 'low'],
      ['general_comment', 'Performance', 'Page loads slowly', 'The dashboard takes more than 5 seconds to load on mobile devices', 'high'],
      ['bug_report', 'Database', 'Data not saving correctly', 'User profile changes are not being persisted to the database', 'to_implement']
    ];

    const csvContent = sampleData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-feedback.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {columnToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full border border-gray-200 dark:border-gray-400">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-16 w-16 text-yellow-500 dark:text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Group?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete the "{columnToDelete.title}" group? All feedback items in this group will be moved to the first group. This action cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setColumnToDelete(null)}
                  className="px-6 py-2 rounded-md shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteColumn}
                  className="px-6 py-2 rounded-md shadow-lg bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent mb-2">
              Feedbacks collected
            </h1>
          </div>
        </div>
      </div>

      {!isUploaded ? (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            
            
            <div 
              className={`mb-6 border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
                isDragOver 
                  ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              
              {isDragOver ? (
                <div className="text-blue-600 dark:text-blue-400">
                  <Upload className="h-12 w-12 mx-auto mb-3 animate-bounce" />
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Drag and drop your CSV file here, or
                  </p>
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all shadow-lg cursor-pointer transition-all duration-200"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Choose CSV File</span>
                  </label>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-800 dark:text-red-300">{uploadError}</p>
                </div>
              </div>
            )}

            <div className="text-left bg-gray-50 dark:bg-gray-100/10 bg-gray-300/10 border border-gray-200/80 dark:border-gray-600/80 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">CSV Format Requirements:</h3>
                <button
                  onClick={downloadSampleCSV}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg 
                    hover:from-gray-500 hover:to-gray-600 focus:ring-2 focus:ring-gray-200 shadow-lg cursor-pointer transition-all duration-200"
                >
                  <DownloadIcon className='h-5 w-5 mr-2' />
                  Download CSV Sample
                </button>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• <strong>Type:</strong> bug_report, suggestion, or general_comment</li>
                <li>• <strong>Module:</strong> The module or component name</li>
                <li>• <strong>Title:</strong> Brief title of the feedback</li>
                <li>• <strong>Description:</strong> Detailed description</li>
                <li>• <strong>Status:</strong> to_discuss, low, high, or to_implement</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-green-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Feedbacks during UAT/Testing ({feedback.length} items)
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {getTotalManHours()} hours
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total implementation time
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={exportToExcel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-700 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 ease-in-out shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={resetImporter}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-500 hover:to-gray-700 dark:hover:from-gray-600 dark:hover:to-gray-700 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800 transition-all shadow-lg"
                  >
                    <Upload className="h-4 w-4" />
                    <span>New Import</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-${columns.length} gap-4`}>
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
                  <div className="mb-4 relative">
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
                        <div className="flex-1 flex items-center">
                          <span>{column.title}</span>
                          <button title='Edit group title'
                            onClick={() => startEditingColumnTitle(column.id, column.title)}
                            className="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          {(column.id === 'low' || column.id === 'high') && (
                            <button title="Delete group"
                              onClick={() => handleDeleteColumn(column.id)}
                              className="ml-1 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-5 w-5 absolute -top-2 -right-2" />
                            </button>
                          )}
                        </div>
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
                                {getFeedbackTypeIcon(item.type)}
                                {getFeedbackTypeBadge(item.type)}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="mb-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Module: {item.module}
                              </div>
                            </div>

                            <div className="mb-3">
                              <p
                                className={`text-sm text-gray-800 dark:text-gray-200 transition-all cursor-pointer ${editingEstimate === item.id ? '' : (item.id === expandedCommentId ? '' : 'line-clamp-3')}`}
                                onClick={() => setExpandedCommentId(item.id === expandedCommentId ? null : item.id)}
                              >
                                {item.description}
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
      )}
    </div>
  );
}

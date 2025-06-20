import React, { useState, useEffect } from 'react';
import { Send, ExternalLink, Smartphone, AlertCircle, CheckCircle, Download, MessageSquare, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { sendEmail, generateInvitationEmailContent, generateFeedbackInvitationEmailContent } from '../services/emailService';

type BetaTester = Database['public']['Tables']['beta_testers']['Row'];
type BetaInvitation = Database['public']['Tables']['beta_invitations']['Row'];
type InvitationWithTester = BetaInvitation & {
  beta_testers: {
    id: string;
    full_name: string;
    email: string;
  } | null;
};

export function InvitationManager() {
  const [approvedTesters, setApprovedTesters] = useState<BetaTester[]>([]);
  const [invitations, setInvitations] = useState<InvitationWithTester[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'google_play' | 'app_store'>('google_play');
  const [appId, setAppId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Add pagination state
  const [currentTesterPage, setCurrentTesterPage] = useState(1);
  const [currentInvitationPage, setCurrentInvitationPage] = useState(1);
  const [testersPerPage, setTestersPerPage] = useState(10);
  const [invitationsPerPage, setInvitationsPerPage] = useState(10);
  const [testerSearchTerm, setTesterSearchTerm] = useState('');
  const [invitationSearchTerm, setInvitationSearchTerm] = useState('');
 
   // Add new state variables
   const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
   const [isSendingFeedbackInvitations, setIsSendingFeedbackInvitations] = useState(false);

  // Add a new state variable for tracking email sending
  const [emailSendingStatus, setEmailSendingStatus] = useState<{
    total: number;
    sent: number;
    failed: number;
  } | null>(null);

  // Add state for feedback invitation email sending status
  const [feedbackEmailSendingStatus, setFeedbackEmailSendingStatus] = useState<{
    total: number;
    sent: number;
    failed: number;
  } | null>(null);

  // Add state to track successful resends
  const [successfulResends, setSuccessfulResends] = useState<Set<string>>(new Set());

  // Define getFilteredTesters function before using it
  const getFilteredTesters = () => {
    return approvedTesters.filter(tester => {
      const platform = selectedPlatform;
      if (platform === 'google_play') {
        return tester.device_type === 'android';
      }
      if (platform === 'app_store') {
        return tester.device_type === 'ios';
      }
      return true;
    });
  };

  // Calculate pagination values for testers
  const filteredTesters = getFilteredTesters().filter(
    (tester) =>
      tester.full_name.toLowerCase().includes(testerSearchTerm.toLowerCase()) ||
      tester.email.toLowerCase().includes(testerSearchTerm.toLowerCase())
  );
  const indexOfLastTester = currentTesterPage * testersPerPage;
  const indexOfFirstTester = indexOfLastTester - testersPerPage;
  const currentTesters = filteredTesters.slice(indexOfFirstTester, indexOfLastTester);
  const totalTesterPages = Math.ceil(filteredTesters.length / testersPerPage);

  // Calculate pagination values for invitations
  const filteredInvitations = invitations.filter((invitation) => {
    const tester = invitation.beta_testers;
    if (!tester) return false;
    return (
      tester.full_name.toLowerCase().includes(invitationSearchTerm.toLowerCase()) ||
      tester.email.toLowerCase().includes(invitationSearchTerm.toLowerCase())
    );
  });
  const indexOfLastInvitation = currentInvitationPage * invitationsPerPage;
  const indexOfFirstInvitation = indexOfLastInvitation - invitationsPerPage;
  const currentInvitations = filteredInvitations.slice(indexOfFirstInvitation, indexOfLastInvitation);
  const totalInvitationPages = Math.ceil(filteredInvitations.length / invitationsPerPage);

  // Add pagination functions
  const changeTesterPage = (pageNumber: number) => {
    setCurrentTesterPage(pageNumber);
  };

  const changeInvitationPage = (pageNumber: number) => {
    setCurrentInvitationPage(pageNumber);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Update the query to join beta_testers with beta_invitations
      const [testersResult, invitationsResult] = await Promise.all([
        supabase
          .from('beta_testers')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false }),
        supabase
          .from('beta_invitations')
          .select(`
            *,
            beta_testers (
              id,
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
      ]);

      if (testersResult.error) throw testersResult.error;
      if (invitationsResult.error) throw invitationsResult.error;

      setApprovedTesters(testersResult.data || []);
      setInvitations((invitationsResult.data as InvitationWithTester[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTesterSelection = (testerId: string) => {
    setSelectedTesters(prev =>
      prev.includes(testerId)
        ? prev.filter(id => id !== testerId)
        : [...prev, testerId]
    );
  };

  const selectAllTesters = () => {
    const visibleTesterIds = currentTesters.map(tester => tester.id);
    const allSelected = visibleTesterIds.every(tester => selectedTesters.includes(tester));
    
    if (allSelected) {
      setSelectedTesters(prev => prev.filter(id => !visibleTesterIds.includes(id)));
    } else {
      setSelectedTesters(prev => [...new Set([...prev, ...visibleTesterIds])]);
    }
  };

  const sendInvitations = async () => {
    if (!appId.trim()) {
      setMessage({ type: 'error', text: 'Please enter the app ID first.' });
      return;
    }

    if (selectedTesters.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one tester.' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    setEmailSendingStatus({ total: selectedTesters.length, sent: 0, failed: 0 });

    try {
      // Get selected tester data
      const selectedTesterData = approvedTesters.filter(tester =>
        selectedTesters.includes(tester.id)
      );
      
      // Send emails to each tester
      let sentCount = 0;
      let failedCount = 0;
      
      // Get platform display name
      const platformDisplayName = selectedPlatform === 'google_play' 
        ? 'Google Play Store' :  'Apple TestFlight';
        // : 'Apple TestFlight' 
        //   : 'Huawei AppGallery';
      
      // Send emails in sequence to avoid rate limits
      for (const tester of selectedTesterData) {
        const invitationLink = generateInvitationLink(selectedPlatform, appId);
        
        const emailContent = generateInvitationEmailContent(
          tester.full_name,
          platformDisplayName,
          invitationLink
        );
        
        const emailSent = await sendEmail({
          to: tester.email,
          subject: 'You\'re Invited to Join Our Beta Test!',
          html: emailContent
        });
        
        if (emailSent) {
          sentCount++;
        } else {
          failedCount++;
        }
        
        // Update status after each email
        setEmailSendingStatus({
          total: selectedTesters.length,
          sent: sentCount,
          failed: failedCount
        });
      }

      // Only update database if at least one email was sent successfully
      if (sentCount > 0) {
        // Insert invitations into database for successful emails only
        const successfulInvitations = selectedTesterData
          .filter((_, index) => index < sentCount)
          .map(tester => ({
            tester_id: tester.id,
            platform: selectedPlatform,
            invitation_link: generateInvitationLink(selectedPlatform, appId),
            status: 'sent' as const,
          }));

        // Insert invitations into database
        const { error } = await supabase
          .from('beta_invitations')
          .insert(successfulInvitations);

        if (error) throw error;

        // Update tester status to 'invited' for successful emails only
        const successfulTesterIds = selectedTesterData
          .filter((_, index) => index < sentCount)
          .map(tester => tester.id);

        if (successfulTesterIds.length > 0) {
          const { error: updateError } = await supabase
            .from('beta_testers')
            .update({ status: 'invited' })
            .in('id', successfulTesterIds);

          if (updateError) throw updateError;
        }
      }

      // Set final message
      if (failedCount === 0) {
        setMessage({
          type: 'success',
          text: `Successfully sent ${sentCount} invitation email(s) to testers for ${selectedPlatform.replace('_', ' ')}.`
        });
      } else {
        setMessage({
          type: 'error',
          text: `Sent ${sentCount} invitation(s), but failed to send ${failedCount} invitation(s). Please try again for the failed ones.`
        });
      }

      setSelectedTesters([]);
      await fetchData();
    } catch (error) {
      console.error('Error sending invitations:', error);
      setMessage({ type: 'error', text: 'Failed to send invitations. Please try again.' });
    } finally {
      setIsProcessing(false);
      setEmailSendingStatus(null);
    }
  };

  // Add new function to generate platform CSV
  const generatePlatformCSV = async () => {
    if (selectedTesters.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one tester.' });
      return;
    }

    setIsGeneratingCSV(true);
    setMessage(null);

    try {
      // Get selected testers
      const selectedTesterData = approvedTesters.filter(tester => 
        selectedTesters.includes(tester.id)
      );
      
      // Define CSV headers and content based on platform
      let headers: string[] = [];
      let csvRows: string[][] = [];
      
      switch (selectedPlatform) {
        case 'google_play':
          // Google Play format (email only)
          headers = ['Email'];
          csvRows = selectedTesterData.map(tester => [tester.email]);
          break;
          
        case 'app_store':
          // TestFlight format (email, first name, last name)
          headers = ['Email', 'First Name', 'Last Name'];
          csvRows = selectedTesterData.map(tester => {
            // Split full name into first and last name
            const nameParts = tester.full_name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            return [tester.email, firstName, lastName];
          });
          break;
          
        // case 'huawei_gallery':
        //   // Huawei format (email, name)
        //   headers = ['Email', 'Name'];
        //   csvRows = selectedTesterData.map(tester => [
        //     tester.email, 
        //     tester.full_name
        //   ]);
        //   break;
      }
      
      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPlatform}-testers.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Update tester status to 'invited'
      const { error: updateError } = await supabase
        .from('beta_testers')
        .update({ status: 'approved' })
        .in('id', selectedTesters);

      if (updateError) throw updateError;
      
      setMessage({
        type: 'success',
        text: `Successfully generated CSV for ${selectedTesterData.length} tester(s) for ${selectedPlatform.replace('_', ' ')}.`
      });
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error generating CSV:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to generate CSV file. Please try again.' 
      });
    } finally {
      setIsGeneratingCSV(false);
    }
  };

  const generateInvitationLink = (platform: string, appId: string) => {
    switch (platform) {
      case 'google_play':
        return `https://play.google.com/apps/testing/${appId}`;
      case 'app_store':
        return `https://testflight.apple.com/join/${appId}`;
      // case 'huawei_gallery':
      //   return `https://developer.huawei.com/consumer/en/service/josp/agc/index.html#/myProject/${appId}/9249519184596224953`;
      default:
        return '';
    }
  };

  // Add a new function to resend an invitation
  const resendInvitation = async (invitation: BetaInvitation) => {
    setIsProcessing(true);
    setMessage(null);
    
    try {
      // Get the tester information
      const { data: testerData, error: testerError } = await supabase
        .from('beta_testers')
        .select('*')
        .eq('id', invitation.tester_id)
        .single();
      
      if (testerError) throw testerError;
      if (!testerData) throw new Error('Tester not found');
      
      // Get platform display name
      const platformDisplayName = invitation.platform === 'google_play' 
        ? 'Google Play Store' : 'Apple TestFlight';
        // : invitation.platform === 'app_store' 
        //   ? 'Apple TestFlight' 
        //   : 'Huawei AppGallery';
      
      // Generate email content
      const emailContent = generateInvitationEmailContent(
        testerData.full_name,
        platformDisplayName,
        invitation.invitation_link
      );
      
      // Send the email
      const emailSent = await sendEmail({
        to: testerData.email,
        subject: 'You\'re Invited to Join Our Beta Test! (Reminder)',
        html: emailContent
      });
      
      if (emailSent) {
        // Update the invitation record with a new sent timestamp
        const { error: updateError } = await supabase
          .from('beta_invitations')
          .update({ 
            invitation_sent_at: new Date().toISOString(),
            status: 'sent'
          })
          .eq('id', invitation.id);
        
        if (updateError) throw updateError;
        
        // Add to successful resends set
        setSuccessfulResends(prev => new Set(prev).add(invitation.id));
        
        // Remove from successful resends after 2 seconds
        setTimeout(() => {
          setSuccessfulResends(prev => {
            const newSet = new Set(prev);
            newSet.delete(invitation.id);
            return newSet;
          });
        }, 2000);
        
        setMessage({
          type: 'success',
          text: `Successfully resent invitation to ${testerData.full_name}.`
        });
        
        // Refresh data
        await fetchData();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      setMessage({
        type: 'error',
        text: 'Failed to resend invitation. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Add new function to send feedback invitations to all registered testers
  const sendFeedbackInvitations = async () => {
    setIsSendingFeedbackInvitations(true);
    setMessage(null);

    try {
      const { data: allTesters, error: testersError } = await supabase
        .from('beta_testers')
        .select('*')
        .eq('status', 'invited') // to change to approved after testing
        .order('created_at', { ascending: false });

      if (testersError) throw testersError;
      if (!allTesters || allTesters.length === 0) {
        setMessage({ type: 'error', text: 'No registered testers found.' });
        return;
      }

      setFeedbackEmailSendingStatus({ total: allTesters.length, sent: 0, failed: 0 });

      // Send emails to each tester
      let sentCount = 0;
      let failedCount = 0;
      
      // Construct the feedback URL (assuming it's /feedback)
      const feedbackUrl = `${window.location.origin}/feedback`;
      
      // Send emails in sequence to avoid rate limits
      for (const tester of allTesters) {
        const emailContent = generateFeedbackInvitationEmailContent(
          tester.full_name,
          feedbackUrl
        );
        
        const emailSent = await sendEmail({
          to: tester.email,
          subject: 'Share Your Feedback - Help Us Improve Our App!',
          html: emailContent
        });
        
        if (emailSent) {
          sentCount++;
        } else {
          failedCount++;
        }
        
        // Update status after each email
        setFeedbackEmailSendingStatus({
          total: allTesters.length,
          sent: sentCount,
          failed: failedCount
        });
      }

      // Set final message
      if (failedCount === 0) {
        setMessage({
          type: 'success',
          text: `Successfully sent ${sentCount} feedback invitation email(s) to all registered testers.`
        });
      } else {
        setMessage({
          type: 'error',
          text: `Sent ${sentCount} feedback invitation(s), but failed to send ${failedCount} invitation(s). Please try again for the failed ones.`
        });
      }

    } catch (error) {
      console.error('Error sending feedback invitations:', error);
      setMessage({ type: 'error', text: 'Failed to send feedback invitations. Please try again.' });
    } finally {
      setIsSendingFeedbackInvitations(false);
      setFeedbackEmailSendingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-200 dark:border-yellow-700 border-t-yellow-600 dark:border-t-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
              Beta Invitation Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Send beta testing invitations to approved testers</p>
          </div>
          
          {/* Feedback Invitation Button */}
          <button
            onClick={sendFeedbackInvitations}
            disabled={isSendingFeedbackInvitations}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-indigo-600 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingFeedbackInvitations ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                {feedbackEmailSendingStatus && (
                  <span className="text-xs">
                    {feedbackEmailSendingStatus.sent}/{feedbackEmailSendingStatus.total}
                  </span>
                )}
              </>
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
            <span>Send Invites for Feedback</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <p className={message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Configuration Panel */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 p-6 mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Invitation Configuration</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Platform
            </label>
            <select
              id="platform"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as typeof selectedPlatform)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="google_play">Google Play Store</option>
              <option value="app_store">Apple App Store (TestFlight)</option>
              {/* <option value="huawei_gallery">Huawei AppGallery</option> */}
            </select>
          </div>

          <div>
            <label htmlFor="appId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              App ID / Package Name
            </label>
            <input
              type="text"
              id="appId"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="com.example.app or TestFlight ID"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTesters.length} of {filteredTesters.length} testers selected for <span className='capitalize'>{selectedPlatform.replace('_', ' ')}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={generatePlatformCSV}
              disabled={isGeneratingCSV || selectedTesters.length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingCSV ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              <span>Generate Platform CSV</span>
            </button>
            
            <button
              onClick={sendInvitations}
              disabled={isProcessing || selectedTesters.length === 0 || !appId.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-500 dark:to-orange-500 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 dark:hover:from-yellow-600 dark:hover:to-orange-600 focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  {emailSendingStatus && (
                    <span className="text-xs">
                      {emailSendingStatus.sent}/{emailSendingStatus.total}
                    </span>
                  )}
                </>
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span>Send Invitations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Testers List */}
      <div className="mb-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Approved Testers ({filteredTesters.length})
            </h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search testers..."
                value={testerSearchTerm}
                onChange={(e) => setTesterSearchTerm(e.target.value)}
                className="px-3 py-2 w-full sm:w-auto border border-gray-200 dark:border-gray-600 rounded-md focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={selectAllTesters}
                className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium"
              >
                {currentTesters.length > 0 && currentTesters.every(tester => selectedTesters.includes(tester.id))
                  ? 'Deselect All Visible'
                  : 'Select All Visible'}
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {currentTesters.map((tester) => {
            const isSelected = selectedTesters.includes(tester.id);
            const hasInvitation = invitations.some(inv => 
              inv.tester_id === tester.id && inv.platform === selectedPlatform
            );

            return (
              <div
                key={tester.id}
                className={`p-6 flex items-center justify-between hover:bg-yellow-50/30 dark:hover:bg-yellow-900/20 transition-colors ${
                  isSelected ? 'bg-yellow-50/50 dark:bg-yellow-900/30' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleTesterSelection(tester.id)}
                    className="h-5 w-5 text-yellow-600 rounded border-gray-300 dark:border-gray-600 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{tester.full_name}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{tester.email}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {tester.device_type} - {tester.device_model}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-500 capitalize">
                        {tester.experience_level} level
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {hasInvitation && (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Invited</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add pagination for testers */}
        {filteredTesters.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Show</span>
                <select
                    id="testersPerPage"
                    value={testersPerPage}
                    onChange={(e) => {
                        setTestersPerPage(Number(e.target.value));
                        setCurrentTesterPage(1);
                    }}
                    className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-md focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                <span>entries</span>
                <span className="hidden sm:inline-block pl-4">
                  Showing {indexOfFirstTester + 1}-{Math.min(indexOfLastTester, filteredTesters.length)} of {filteredTesters.length}
                </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changeTesterPage(currentTesterPage - 1)}
                disabled={currentTesterPage === 1}
                className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalTesterPages) }, (_, i) => {
                let pageNum = currentTesterPage;
                if (currentTesterPage <= 3) {
                  pageNum = i + 1;
                } else if (currentTesterPage >= totalTesterPages - 2) {
                  pageNum = totalTesterPages - 4 + i;
                } else {
                  pageNum = currentTesterPage - 2 + i;
                }
                
                if (pageNum > 0 && pageNum <= totalTesterPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changeTesterPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        currentTesterPage === pageNum
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
                onClick={() => changeTesterPage(currentTesterPage + 1)}
                disabled={currentTesterPage === totalTesterPages}
                className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filteredTesters.length === 0 && (
          <div className="text-center py-12">
            <Smartphone className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No approved testers available for {selectedPlatform.replace('_', ' ')}.
            </p>
          </div>
        )}
      </div>

      {/* Recent Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg border border-yellow-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Invitations ({filteredInvitations.length})</h2>
              <input
                  type="text"
                  placeholder="Search invitations..."
                  value={invitationSearchTerm}
                  onChange={(e) => setInvitationSearchTerm(e.target.value)}
                  className="px-3 py-2 w-full sm:w-auto border border-gray-200 dark:border-gray-600 rounded-md focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentInvitations.map((invitation) => {
              // Get tester information from the joined data
              const tester = invitation.beta_testers;
              const testerName = tester ? tester.full_name : 'Unknown Tester';
              const testerEmail = tester ? tester.email : 'No email available';
              
              // Format the date with time
              const invitationDate = new Date(invitation.invitation_sent_at || invitation.created_at);
              const formattedDate = invitationDate.toLocaleDateString() + ' ' + 
                                   invitationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={invitation.id} className="p-6 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {testerName} <span className='px-3 py-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-gray-700/50 px-2 rounded-md'>{testerEmail}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className='capitalize'>{invitation.platform.replace('_', ' ')}</span> • {formattedDate}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invitation.status === 'sent' ? 'bg-orange-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      invitation.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      invitation.status === 'declined' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                      'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
                    }`}>
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </span>
                    
                    <button
                      onClick={() => resendInvitation(invitation)}
                      disabled={isProcessing}
                      className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 ${
                        successfulResends.has(invitation.id)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/50'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-800 dark:border-yellow-300 border-t-transparent" />
                      ) : successfulResends.has(invitation.id) ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Sent</span>
                        </>
                      ) : (
                        'Resend'
                      )}
                    </button>
                    
                    <a 
                      href={invitation.invitation_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination controls */}
          {filteredInvitations.length > 0 && (
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Show</span>
                    <select
                        id="invitationsPerPage"
                        value={invitationsPerPage}
                        onChange={(e) => {
                            setInvitationsPerPage(Number(e.target.value));
                            setCurrentInvitationPage(1);
                        }}
                        className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-md focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <span>entries</span>
                    <span className="hidden sm:inline-block pl-4">
                      Showing {indexOfFirstInvitation + 1}-{Math.min(indexOfLastInvitation, filteredInvitations.length)} of {filteredInvitations.length}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                      onClick={() => changeInvitationPage(currentInvitationPage - 1)}
                      disabled={currentInvitationPage === 1}
                      className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Page {currentInvitationPage} of {Math.max(1, totalInvitationPages)}
                    </span>
                    <button
                      onClick={() => changeInvitationPage(currentInvitationPage + 1)}
                      disabled={currentInvitationPage === totalInvitationPages || totalInvitationPages === 0}
                      className="px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

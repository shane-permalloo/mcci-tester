import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle, AlertCircle, Bug, Lightbulb, MessageCircle, ChevronLeftIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateRequired } from '../utils/validation';
import { Link } from 'react-router-dom';

interface FormErrors {
  deviceType: string;
  deviceModel: string;
  feedbackType: string;
  comment: string;
  email: string;
}

export function FeedbackForm() {
  const [formData, setFormData] = useState({
    deviceType: '' as 'ios' | 'android' | /*'huawei' |*/ '',
    deviceModel: '',
    feedbackType: '' as 'bug_report' | 'suggestion' | 'general_comment' | '',
    comment: '',
    isAnonymous: false,
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({
    deviceType: '',
    deviceModel: '',
    feedbackType: '',
    comment: '',
    email: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  const validateField = (name: string, value: string) => {
    let validation;
    
    switch (name) {
      case 'deviceType':
        validation = validateRequired(value, 'Device platform');
        break;
      case 'deviceModel':
        validation = validateRequired(value, 'Device model');
        break;
      case 'feedbackType':
        validation = validateRequired(value, 'Feedback type');
        break;
      case 'comment':
        validation = validateRequired(value, 'Comment');
        if (validation.isValid && value.length < 10) {
          validation = { isValid: false, message: 'Comment must be at least 10 characters long' };
        }
        break;
      case 'email':
        if (!formData.isAnonymous && !value.trim()) {
          validation = { isValid: false, message: 'Email is required for non-anonymous feedback' };
        } else if (value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          validation = emailRegex.test(value) 
            ? { isValid: true, message: '' }
            : { isValid: false, message: 'Please enter a valid email address' };
        } else {
          validation = { isValid: true, message: '' };
        }
        break;
      default:
        validation = { isValid: true, message: '' };
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: validation.message
    }));
    
    return validation.isValid;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (touched[name]) {
      validateField(name, value);
    }
    
    // Re-validate email when anonymous status changes
    if (name === 'isAnonymous' && touched.email) {
      validateField('email', formData.email);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const fields = ['deviceType', 'deviceModel', 'feedbackType', 'comment'];
    if (!formData.isAnonymous) {
      fields.push('email');
    }
    
    let isValid = true;
    
    fields.forEach(field => {
      const fieldIsValid = validateField(field, formData[field as keyof typeof formData] as string);
      if (!fieldIsValid) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['deviceType', 'deviceModel', 'feedbackType', 'comment'];
    if (!formData.isAnonymous) {
      allFields.push('email');
    }
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const { error } = await supabase.from('beta_feedback').insert({
        device_type: formData.deviceType,
        device_model: formData.deviceModel,
        feedback_type: formData.feedbackType,
        comment: formData.comment,
        is_anonymous: formData.isAnonymous,
        email: formData.isAnonymous ? null : formData.email,
      });

      if (error) throw error;

      setSubmitStatus('success');
      setMessage('Thank you for your feedback! We appreciate your input and will review it carefully.');
      setFormData({
        deviceType: '',
        deviceModel: '',
        feedbackType: '',
        comment: '',
        isAnonymous: false,
        email: '',
      });
      setTouched({});
      setErrors({
        deviceType: '',
        deviceModel: '',
        feedbackType: '',
        comment: '',
        email: '',
      });
    } catch (error) {
      setSubmitStatus('error');
      setMessage('Something went wrong. Please try again.');
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="h-4 w-4" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
      case 'general_comment':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full">
        {/* Back home Button */}
        <div className="absolute top-4 left-4 z-50">
          <Link
            to="/"
            aria-label="Back to Home"
            title="Back to Home"
            className="p-3 flex items-center space-x-2 bg-white/80 dark:bg-gray-800/40 backdrop-blur-lg border border-purple-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-500 rounded-full transition-all shadow-lg"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
        </div>
        {/* Header */}
        <div className="text-center mb-4 group">
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-md mb-4"
          style={{zIndex: 10}}
          >
            <MessageSquare className="h-8 w-8 text-white" />

          </div>
          <img 
                src="https://taxfreeshopping.mu/wp-content/uploads/2024/08/cropped-mcci-favicon-192x192.png"
                alt="MCCI Logo"
                className="h-16 w-16 inline-block ml-2 relative -top-3 -left-12 origin-center rotate-90 transition-all group-hover:-left-4 group-hover:rotate-0"
              />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
           MCCI Shopping Route Mobile App: Feedback
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Help us improve the app by sharing your feedback, reporting bugs, or suggesting new features.
          </p>
        </div>

        {/* Status Message */}
        {submitStatus && (
          <div className={`mb-8 p-4 rounded-lg flex items-start space-x-3 ${
            submitStatus === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {submitStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <p className={submitStatus === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
              {message}
            </p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl border border-blue-100 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  <img
                src="https://taxfreeshopping.mu/wp-content/uploads/2024/08/cropped-mcci-favicon-192x192.png"
                alt="MCCI Logo"
                className="h-6 w-6 inline-block mr-2 relative -top-0.5"
              />
              Feedback Details</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Platform *
                  </label>
                  <select
                    id="deviceType"
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                      errors.deviceType && touched.deviceType
                        ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                        : 'border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  >
                    <option value="">Select your platform</option>
                    <option value="ios">iOS (iPhone/iPad)</option>
                    <option value="android">Android</option>
                    {/* <option value="huawei">Huawei</option> */}
                  </select>
                  {errors.deviceType && touched.deviceType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deviceType}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Model *
                  </label>
                  <input
                    type="text"
                    id="deviceModel"
                    name="deviceModel"
                    value={formData.deviceModel}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                      errors.deviceModel && touched.deviceModel
                        ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                        : 'border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="e.g., iPhone 15 Pro, Galaxy S23"
                  />
                  {errors.deviceModel && touched.deviceModel && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deviceModel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback Type */}
            <div>
              <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback Type *
              </label>
              <select
                id="feedbackType"
                name="feedbackType"
                value={formData.feedbackType}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                  errors.feedbackType && touched.feedbackType
                    ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              >
                <option value="">Select feedback type</option>
                <option value="bug_report">🐛 Bug Report - Something isn't working</option>
                <option value="suggestion">💡 Suggestion - Feature request or improvement</option>
                <option value="general_comment">💬 General Comment - Other feedback</option>
              </select>
              {errors.feedbackType && touched.feedbackType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.feedbackType}</p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Feedback *
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={6}
                value={formData.comment}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 rounded-lg border transition-all outline-none resize-none ${
                  errors.comment && touched.comment
                    ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder="Please describe your feedback in detail. For bug reports, include steps to reproduce the issue."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.comment && touched.comment ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.comment}</p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Minimum 10 characters</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">{formData.comment.length}/1000</p>
              </div>
            </div>

            {/* Anonymous Option */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <div>
                <label htmlFor="isAnonymous" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Submit anonymously
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Check this if you prefer not to provide your email address
                </p>
              </div>
            </div>

            {/* Email (conditional) */}
            {!formData.isAnonymous && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                    errors.email && touched.email
                      ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="your.email@example.com"
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  We may contact you for follow-up questions about your feedback
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-500 dark:to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-300">
          <p>Your feedback helps us improve the app for everyone. Thank you for being part of our beta program!</p>
          <p>Mauritius Network Services Ltd. © All rights reserved | <a className="text-blue-600 dark:text-purple-400 hover:underline" href="https://mns.mu/wp-content/uploads/2024/07/DC0-MNS_Privacy-Notice.pdf" target="_blank">Privacy Notice</a>
</p>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Smartphone, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail, validateRequired } from '../utils/validation';

interface FormErrors {
  fullName: string;
  email: string;
  deviceType: string;
  deviceModel: string;
  experienceLevel: string;
}

export function BetaRegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    deviceType: '' as 'ios' | 'android' | 'huawei' | '',
    deviceModel: '',
    experienceLevel: '' as 'beginner' | 'intermediate' | 'expert' | '',
  });
  const [errors, setErrors] = useState<FormErrors>({
    fullName: '',
    email: '',
    deviceType: '',
    deviceModel: '',
    experienceLevel: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  const validateField = (name: string, value: string) => {
    let validation;
    
    switch (name) {
      case 'fullName':
        validation = validateRequired(value, 'Full name');
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'deviceType':
        validation = validateRequired(value, 'Device platform');
        break;
      case 'deviceModel':
        validation = validateRequired(value, 'Device model');
        break;
      case 'experienceLevel':
        validation = validateRequired(value, 'Experience level');
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const fields = ['fullName', 'email', 'deviceType', 'deviceModel', 'experienceLevel'];
    let isValid = true;
    
    fields.forEach(field => {
      const fieldIsValid = validateField(field, formData[field as keyof typeof formData]);
      if (!fieldIsValid) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['fullName', 'email', 'deviceType', 'deviceModel', 'experienceLevel'];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const { error } = await supabase.from('beta_testers').insert({
        full_name: formData.fullName,
        email: formData.email,
        device_type: formData.deviceType,
        device_model: formData.deviceModel,
        experience_level: formData.experienceLevel,
        status: 'pending',
      });

      if (error) throw error;

      setSubmitStatus('success');
      setMessage('Thank you for joining our beta program! We\'ll be in touch soon.');
      setFormData({
        fullName: '',
        email: '',
        deviceType: '',
        deviceModel: '',
        experienceLevel: '',
      });
      setTouched({});
      setErrors({
        fullName: '',
        email: '',
        deviceType: '',
        deviceModel: '',
        experienceLevel: '',
      });
    } catch (error) {
      setSubmitStatus('error');
      setMessage('Something went wrong. Please try again.');
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-4 group">
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 dark:from-yellow-400 dark:to-orange-500 rounded-md mb-4"
          style={{zIndex: 10}}
          >
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <img 
                src="https://taxfreeshopping.mu/wp-content/uploads/2024/08/cropped-mcci-favicon-192x192.png"
                alt="MCCI Logo"
                className="h-16 w-16 inline-block ml-2 relative -top-3 -left-12 origin-center rotate-90 transition-all group-hover:-left-4 group-hover:rotate-0"
              />
          <h1 className="text-3xl font-bold max-w-xl mx-auto bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">
            Join Our Beta Program to test the new MCCI Shopping Route Mobile App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
            Be among the first to test a new shopping experience on our new mobile app. Testing will start as from <span className='font-semibold bg-gradient-to-r from-blue-400 to-purple-500 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent'>23 June 2025</span>.
          </p>
        </div>

        {/* Status Message */}
        {submitStatus && (
          <div className={`mb-8 p-4 rounded-md flex items-start space-x-3 ${
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
        <div className='flex justify-center flex-row grid grid-cols-1 md:grid-cols-2 group'>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl lg:rounded-r-none lg:rounded-r-lg border-r-0 lg:border-r-1 shadow-2xl border border-orange-100 dark:border-gray-700 p-8">
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  <img
                src="https://taxfreeshopping.mu/wp-content/uploads/2024/08/cropped-mcci-favicon-192x192.png"
                alt="MCCI Logo"
                className="h-6 w-6 inline-block mr-2 relative -top-0.5"
              />
              Personal Information</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 rounded-md border transition-all outline-none ${
                        errors.fullName && touched.fullName
                          ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                          : 'border-gray-200 dark:border-gray-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && touched.fullName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                    )}
                  </div>
                  
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
                      className={`w-full px-4 py-3 rounded-md border transition-all outline-none ${
                        errors.email && touched.email
                          ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                          : 'border-gray-200 dark:border-gray-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                      placeholder="Enter your email"
                    />
                    {errors.email && touched.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>
                </div>
                {/* Experience Level */}
              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Testing Experience Level *
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 rounded-md border transition-all outline-none ${
                    errors.experienceLevel && touched.experienceLevel
                      ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-gray-200 dark:border-gray-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                >
                  <option value="">Select your experience level</option>
                  <option value="beginner">Beginner - New to beta testing</option>
                  <option value="intermediate">Intermediate - Some beta testing experience</option>
                  <option value="expert">Expert - Extensive beta testing experience</option>
                </select>
                {errors.experienceLevel && touched.experienceLevel && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.experienceLevel}</p>
                )}
              </div>

              </div>

              {/* Device Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  <img
                src="https://taxfreeshopping.mu/wp-content/uploads/2024/08/cropped-mcci-favicon-192x192.png"
                alt="MCCI Logo"
                className="h-6 w-6 inline-block mr-2 relative -top-0.5"
              />
              Device Information</h2>
                
                <div className="grid gap-6">
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
                      className={`w-full px-4 py-3 rounded-md border transition-all outline-none ${
                        errors.deviceType && touched.deviceType
                          ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                          : 'border-gray-200 dark:border-gray-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    >
                      <option value="">Select your platform</option>
                      <option value="ios">iOS (iPhone/iPad)</option>
                      <option value="android">Android</option>
                      <option value="huawei">Huawei</option>
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
                      className={`w-full px-4 py-3 rounded-md border transition-all outline-none ${
                        errors.deviceModel && touched.deviceModel
                          ? 'border-red-300 dark:border-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                          : 'border-gray-200 dark:border-gray-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                      placeholder="e.g., iPhone 15 Pro, Galaxy S23"
                    />
                    {errors.deviceModel && touched.deviceModel && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.deviceModel}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-500 dark:to-orange-500 text-white font-semibold py-4 px-6 rounded-md hover:from-yellow-700 hover:to-orange-700 dark:hover:from-yellow-600 dark:hover:to-orange-600 focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Join Beta Program</span>
                  </>
                )}
              </button>
            </form>
          </div>
          <div className="relative overflow-hidden hidden left-0 transition-all group-hover:-left-1 md:block bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg hover:backdrop-blur-xl rounded-xl rounded-tl-none rounded-bl-none shadow-2xl border border-orange-100 dark:border-gray-700"
            style={{
              backgroundImage: 'url(./src/assets/etrs-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              height: '100%', // or set specific height
              width: '100%',  // or set specific width
            }}>
              <div className='backdrop-blur-sm w-full h-full absolute top-0 left-0 right-0 bottom-0 group-hover:backdrop-blur-none transition-all'></div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 dark:text-gray-300">
          <p>Your information is secure and will only be used for beta testing purposes.</p>
        </div>
      </div>
    </div>
  );
}
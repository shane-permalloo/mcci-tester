export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email address is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

export const validateEmailForPlatform = (email: string, deviceType: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email address is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  const emailLower = email.toLowerCase();
  
  if (deviceType === 'ios') {
    // For iOS devices, require iCloud email
    if (!emailLower.endsWith('@icloud.com') && !emailLower.endsWith('@me.com') && !emailLower.endsWith('@mac.com')) {
      return { 
        isValid: false, 
        message: 'For iOS devices, please use an iCloud email address (@icloud.com, @me.com, or @mac.com)' 
      };
    }
  } else if (deviceType === 'android') {
    // For Android devices, require Gmail
    if (!emailLower.endsWith('@gmail.com')) {
      return { 
        isValid: false, 
        message: 'For Android devices, please use a Gmail email address (@gmail.com)' 
      };
    }
  }
  
  return { isValid: true, message: '' };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true, message: '' };
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
  if (value.length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters long` };
  }
  return { isValid: true, message: '' };
};
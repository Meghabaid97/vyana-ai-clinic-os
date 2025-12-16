// Validation utilities for form inputs

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password strength
 * Requirements: 8+ chars, uppercase, lowercase, number, special char
 */
export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("At least one special character (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates Aadhaar/Health ID format (12 digits)
 */
export const validateHealthId = (healthId: string): boolean => {
  return /^\d{12}$/.test(healthId);
};

/**
 * Format doctor name with credentials
 * Example: "Dr. Shirin Bakshi, MBBS, MD"
 */
export const formatDoctorName = (
  name: string,
  qualification?: string | null
): string => {
  const formattedName = name.startsWith("Dr.") ? name : `Dr. ${name}`;
  if (qualification) {
    return `${formattedName}, ${qualification}`;
  }
  return formattedName;
};

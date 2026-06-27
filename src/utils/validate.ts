export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('密码至少8个字符');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码需要包含小写字母');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需要包含大写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码需要包含数字');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('密码需要包含特殊字符(!@#$%^&*)');
  }

  return errors;
};

export const validateStudentEmail = (email: string): boolean => {
  return validateEmail(email);
};

export const validateFormData = (
  data: Record<string, any>,
  rules: Record<string, any>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = data[field];

    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field}不能为空`;
      return;
    }

    if (rule.type === 'email' && value && !validateEmail(value)) {
      errors[field] = '请输入有效的邮箱地址';
      return;
    }

    if (rule.type === 'phone' && value && !validatePhone(value)) {
      errors[field] = '请输入有效的电话号码';
      return;
    }

    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${rule.label}至少${rule.minLength}个字符`;
      return;
    }

    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `${rule.label}最多${rule.maxLength}个字符`;
      return;
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${rule.label}格式不正确`;
      return;
    }
  });

  return errors;
};

export const isValidDateRange = (
  startDate: Date,
  endDate: Date
): { valid: boolean; error?: string } => {
  if (endDate <= startDate) {
    return {
      valid: false,
      error: '结束时间必须晚于开始时间',
    };
  }

  return { valid: true };
};

export const isSignupDeadlineValid = (
  deadline: Date,
  startTime: Date
): { valid: boolean; error?: string } => {
  if (deadline >= startTime) {
    return {
      valid: false,
      error: '报名截止时间必须早于活动开始时间',
    };
  }

  return { valid: true };
};

export const validateName = (name) => {
  if (!name || name.trim().length === 0) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.length > 100) return 'Name must be less than 100 characters';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || phone.trim().length === 0) return 'Phone number is required';
  const cleanPhone = phone.replace(/[\s\-+]/g, '');
  if (!/^\d+$/.test(cleanPhone))
    return 'Phone number must contain only digits, spaces, dashes, or +';
  if (cleanPhone.length < 10) return 'Phone number must be at least 10 digits';
  if (phone.length > 15) return 'Phone number must be less than 15 characters';
  return null;
};

export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

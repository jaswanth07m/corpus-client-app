export const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};

export const maskEmail = (email?: string) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  return `${username.substring(0, 2)}${'*'.repeat(Math.max(0, username.length - 2))}@${domain}`;
};

export const maskPhone = (phone?: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return `**-****-${cleaned.substring(cleaned.length - 4)}`;
};

export const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const capitalize = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

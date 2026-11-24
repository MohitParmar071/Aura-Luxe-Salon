export function normalizePhone(raw) {
  if (typeof raw !== 'string') return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidIndianPhone(phone) {
  const normalized = normalizePhone(phone);
  // Indian mobile numbers typically start with 6, 7, 8, or 9 and are 10 digits
  return /^[6-9]\d{9}$/.test(normalized);
}

export function validateJoinInput(data) {
  const errors = {};
  const name = typeof data.customerName === 'string' ? data.customerName.trim() : '';
  if (!name || name.length < 2 || name.length > 50) {
    errors.customerName = 'Please enter a valid name (2-50 characters)';
  }

  const phone = normalizePhone(data.phone);
  if (!isValidIndianPhone(phone)) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number';
  }

  const services = Array.isArray(data.serviceSlugs) ? data.serviceSlugs : [];
  if (services.length < 1 || services.length > 3) {
    errors.services = 'Please select between 1 and 3 services';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      customerName: name,
      phone,
      serviceSlugs: services,
      barberPreference: data.barberPreference ? String(data.barberPreference).trim() : null,
    },
  };
}

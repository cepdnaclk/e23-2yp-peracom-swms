export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase());
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  return {
    ok: missing.length === 0,
    missing,
  };
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
}

export function validateScholarshipRequest(body) {
  const required = requireFields(body, ['title', 'description', 'funding_amount']);
  if (!required.ok) {
    return `Missing required fields: ${required.missing.join(', ')}`;
  }

  const amount = Number(body.funding_amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return 'funding_amount must be a positive number';
  }

  return null;
}

export function validateIssue(body) {
  const required = requireFields(body, ['category', 'description']);
  if (!required.ok) {
    return `Missing required fields: ${required.missing.join(', ')}`;
  }

  const allowed = ['scholarship', 'student', 'system', 'other'];
  if (!allowed.includes(body.category)) {
    return `category must be one of: ${allowed.join(', ')}`;
  }

  return null;
}

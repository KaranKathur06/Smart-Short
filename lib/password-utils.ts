export type PasswordStrength = 'weak' | 'medium' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  label: string;
  color: string;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      label: 'Weak',
      color: '#EF4444',
    };
  }

  let score = 0;
  const checks = {
    length: password.length >= 6,
    length8: password.length >= 8,
    length10: password.length >= 10,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^a-zA-Z0-9]/.test(password),
  };

  // Scoring system
  if (checks.length) score += 1;
  if (checks.length8) score += 1;
  if (checks.length10) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.numbers) score += 1;
  if (checks.symbols) score += 1;

  // Determine strength
  let strength: PasswordStrength;
  let label: string;
  let color: string;

  if (password.length < 6) {
    strength = 'weak';
    label = 'Weak';
    color = '#EF4444'; // Red
  } else if (password.length >= 6 && checks.lowercase && score < 4) {
    strength = 'medium';
    label = 'Medium';
    color = '#F97316'; // Orange
  } else if (password.length >= 8 && checks.numbers && score < 6) {
    strength = 'good';
    label = 'Good';
    color = '#EAB308'; // Yellow
  } else if (password.length >= 10 && checks.uppercase && checks.symbols) {
    strength = 'strong';
    label = 'Strong';
    color = '#22C55E'; // Green
  } else {
    strength = 'good';
    label = 'Good';
    color = '#EAB308';
  }

  return {
    strength,
    score,
    label,
    color,
  };
}

export function getPasswordStrengthWidth(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return '25%';
    case 'medium':
      return '50%';
    case 'good':
      return '75%';
    case 'strong':
      return '100%';
    default:
      return '0%';
  }
}


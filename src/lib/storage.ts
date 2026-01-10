// Auth storage
export interface Credentials {
  username: string;
  password: string;
}

const CREDENTIALS_KEY = 'wolfpack_credentials';
const AUTH_KEY = 'wolfpack_auth';

export function saveCredentials(credentials: Credentials): void {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function getCredentials(): Credentials | null {
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function setAuthenticated(value: boolean): void {
  localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

// Guide/Target storage
export interface GuideTarget {
  name: string;
  targetOrders: number;
  targetRevenue: number;
  targetConversion: number;
  chatCount: number;
}

export interface FormulaOverride {
  id: string;
  name: string;
  formula: string;
  enabled: boolean;
}

const TARGETS_KEY = 'wolfpack_targets';
const FORMULAS_KEY = 'wolfpack_formulas';

export function getTargets(): GuideTarget[] {
  const stored = localStorage.getItem(TARGETS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveTargets(targets: GuideTarget[]): void {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
}

export function getFormulas(): FormulaOverride[] {
  const stored = localStorage.getItem(FORMULAS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultFormulas();
    }
  }
  return getDefaultFormulas();
}

export function saveFormulas(formulas: FormulaOverride[]): void {
  localStorage.setItem(FORMULAS_KEY, JSON.stringify(formulas));
}

export function getDefaultFormulas(): FormulaOverride[] {
  return [
    {
      id: 'revenue_deficit',
      name: 'Revenue Deficit',
      formula: 'targetRevenue - newRevenue',
      enabled: true,
    },
    {
      id: 'order_deficit',
      name: 'Order Deficit',
      formula: 'targetOrders - orders',
      enabled: true,
    },
    {
      id: 'current_conversion',
      name: 'Current Conversion',
      formula: 'chatCount > 0 ? (orders / chatCount) * 100 : 0',
      enabled: true,
    },
    {
      id: 'orders_to_target',
      name: 'Orders to Reach Target Conversion',
      formula: 'Math.max(0, Math.ceil((targetConversion / 100) * chatCount - orders))',
      enabled: true,
    },
  ];
}

import {
  Transaction,
  PaginatedTransactions,
  DashboardSummary,
  AnalyticsData,
  ModelMetrics,
  PredictPayload,
  PolicySettings,
  FraudNewsItem
} from '../types';

/**
 * Resolves the backend API base URL:
 * 1. If VITE_API_BASE_URL or VITE_API_URL is configured in frontend/.env,
 *    use that URL (e.g. http://172.21.161.27:8000/api).
 * 2. Otherwise default to '/api', which Vite dev server proxies to http://127.0.0.1:8000.
 *    This allows mobile devices opening http://<laptop-ip>:5173 to reach the backend
 *    automatically without any CORS or manual IP configuration!
 */
export function getApiBaseUrl(): string {
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
    ''
  ).trim();

  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  return '/api';
}

export const BASE_URL = getApiBaseUrl();

export function formatApiError(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const msg = err.message || String(err);
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
    return `Backend API unreachable at ${BASE_URL}. Verify FastAPI is running on 0.0.0.0:8000 and phone & laptop share the same Wi-Fi.`;
  }
  return msg;
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Backend returned HTTP status ${res.status}`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch(`${BASE_URL}/dashboard/summary`);
    if (!res.ok) throw new Error(`Failed to fetch dashboard summary (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function fetchTransactions(params: {
  decision?: string;
  risk_level?: string;
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedTransactions> {
  const query = new URLSearchParams();
  if (params.decision && params.decision !== 'ALL') query.append('decision', params.decision);
  if (params.risk_level && params.risk_level !== 'ALL') query.append('risk_level', params.risk_level);
  if (params.search) query.append('search', params.search);
  if (params.date) query.append('date', params.date);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  try {
    const res = await fetch(`${BASE_URL}/transactions?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch transactions (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  try {
    const res = await fetch(`${BASE_URL}/transactions/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch transaction ${id} (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function predictTransaction(payload: PredictPayload): Promise<Transaction> {
  try {
    const res = await fetch(`${BASE_URL}/transactions/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Inference prediction failed (status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function verifyTransaction(id: string, action: 'APPROVE' | 'REJECT', notes?: string): Promise<Transaction> {
  try {
    const res = await fetch(`${BASE_URL}/transactions/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    });
    if (!res.ok) throw new Error(`Failed to process verification (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  try {
    const res = await fetch(`${BASE_URL}/analytics`);
    if (!res.ok) throw new Error(`Failed to fetch analytics data (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function fetchModelMetrics(): Promise<ModelMetrics> {
  try {
    const res = await fetch(`${BASE_URL}/model/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch model metrics (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function seedDemo(count: number = 40): Promise<{ status: string; message: string; count: number }> {
  try {
    const res = await fetch(`${BASE_URL}/demo/seed?count=${count}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to seed demo data (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function resetDemo(): Promise<{ status: string; message: string }> {
  try {
    const res = await fetch(`${BASE_URL}/demo/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to reset demo data (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export function getExportCsvUrl(decision?: string, risk_level?: string, search?: string): string {
  const query = new URLSearchParams();
  if (decision && decision !== 'ALL') query.append('decision', decision);
  if (risk_level && risk_level !== 'ALL') query.append('risk_level', risk_level);
  if (search) query.append('search', search);
  return `${BASE_URL}/transactions/export?${query.toString()}`;
}

export async function fetchSettings(): Promise<PolicySettings> {
  try {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error(`Failed to fetch policy settings (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function updateSettings(approve_threshold: number, verify_threshold: number): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve_threshold, verify_threshold }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update policy settings (status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function sendChatMessage(
  message: string,
  history: { role: string; content: string }[] = []
): Promise<{ status: string; reply: string; model: string }> {
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to generate Gemini response (status ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}

export async function fetchLiveFraudNews(): Promise<{ status: string; count: number; articles: FraudNewsItem[] }> {
  try {
    const res = await fetch(`${BASE_URL}/news/fraud-intel`);
    if (!res.ok) throw new Error(`Failed to fetch live fraud intel news (status ${res.status})`);
    return await res.json();
  } catch (err: any) {
    throw new Error(formatApiError(err));
  }
}



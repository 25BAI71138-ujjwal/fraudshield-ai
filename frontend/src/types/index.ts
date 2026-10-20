export type Decision = 'APPROVE' | 'VERIFY' | 'BLOCK';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING';

export interface Transaction {
  transaction_id: string;
  timestamp: string;
  amount: number;
  transaction_hour: number;
  transaction_frequency_24h: number;
  failed_attempts_24h: number;
  is_new_device: number;
  is_new_beneficiary: number;
  amount_deviation_score: number;
  location_risk_score: number;
  payment_method: string;
  merchant_category: string;
  fraud_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  reasons: string[];
  inference_time_ms: number;
  is_demo: boolean;
  verification_status: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface PaginatedTransactions {
  total: number;
  page: number;
  limit: number;
  transactions: Transaction[];
}

export interface DashboardSummary {
  total_transactions: number;
  approved_count: number;
  flagged_count: number;
  blocked_count: number;
  fraud_detection_rate: number;
  avg_inference_time_ms: number;
  total_volume: number;
  decision_distribution: {
    APPROVE: number;
    VERIFY: number;
    BLOCK: number;
  };
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
}

export interface AnalyticsData {
  hourly_trends: {
    hour: string;
    count: number;
    avg_risk: number;
    blocked: number;
  }[];
  risk_buckets: {
    range: string;
    count: number;
  }[];
  payment_channels: {
    channel: string;
    total: number;
    approved: number;
    verified: number;
    blocked: number;
  }[];
  top_reasons: {
    reason: string;
    count: number;
  }[];
  amount_tiers: {
    tier: string;
    count: number;
    avg_risk: number;
    blocked: number;
  }[];
}

export interface ModelMetrics {
  model_name: string;
  model_type: string;
  version: string;
  trained_at: string;
  dataset_metadata: {
    source: string;
    mode: string;
    description: string;
    limitations: string[];
  };
  dataset_stats: {
    total_samples: number;
    train_samples: number;
    test_samples: number;
    fraud_samples: number;
    legitimate_samples: number;
    fraud_rate_pct: number;
  };
  evaluation_metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    pr_auc: number;
    false_positive_rate: number;
    false_negative_rate: number;
    avg_inference_latency_ms: number;
    p95_inference_latency_ms: number;
  };
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
    total_test: number;
  };
  baseline_comparison: {
    model: string;
    metrics: {
      precision: number;
      recall: number;
      f1: number;
      roc_auc: number;
      pr_auc: number;
    };
  };
  feature_importances: {
    feature: string;
    importance: number;
  }[];
}

export interface PredictPayload {
  amount: number;
  transaction_hour: number;
  transaction_frequency_24h: number;
  failed_attempts_24h: number;
  is_new_device: number;
  is_new_beneficiary: number;
  amount_deviation_score: number;
  location_risk_score: number;
  payment_method?: string;
  merchant_category?: string;
}

export interface PolicySettings {
  approve_threshold: number;
  verify_threshold: number;
  policy: {
    low_risk: string;
    medium_risk: string;
    high_risk: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  status: string;
  reply: string;
  model: string;
}

export interface FraudNewsItem {
  id: string;
  title: string;
  source: string;
  pub_date: string;
  link: string;
  snippet: string;
  category: string;
  fraud_shield_vector: string;
}


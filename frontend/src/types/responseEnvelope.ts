export interface ErrorDetail {
  code?: string;
  message?: string;
  details?: any;
}

export interface ResponseEnvelope<T = any> {
  status: string;
  data: T | null;
  meta?: Record<string, any>;
  error?: ErrorDetail | null;
}

export default ResponseEnvelope;

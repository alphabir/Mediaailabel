export interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  scope: 'full' | 'read-only' | 'sandbox-only';
  status: 'active' | 'revoked';
}

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  status: 'active' | 'inactive';
  created: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  method: 'POST' | 'GET' | 'DELETE' | 'PUT';
  endpoint: string;
  statusCode: number;
  durationMs: number;
  requestPayload: string;
  responsePayload: string;
  ip: string;
}

export interface AnnotationItem {
  id: string;
  label: string;
  x: number; // percentage source width
  y: number; // percentage source height
  width: number; // percentage source width
  height: number; // percentage source height
  timestamp: number; // position in seconds
}

export interface ProjectMetadata {
  videoUrl: string;
  duration: number;
  resolution: string;
  codec: string;
  annotations: AnnotationItem[];
}

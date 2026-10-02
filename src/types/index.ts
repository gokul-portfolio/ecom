// Application type definitions
export interface HealthCheckResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    api: {
      status: string;
      latencyMs: number;
    };
    database: {
      provider: string;
      status: "connected" | "disconnected";
      latencyMs: number;
      error?: string;
    };
  };
  system: {
    nodeVersion: string;
    memory: {
      heapUsed: string;
      heapTotal: string;
      rss: string;
    };
  };
}

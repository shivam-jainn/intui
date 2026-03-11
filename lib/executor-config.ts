
export interface ExecutorConfig {
  url: string;
  isDevelopment: boolean;
  targetAudience?: string;
}

class ExecutorService {
  private static instance: ExecutorService;
  private config: ExecutorConfig;

  private constructor() {
    // Check if we are in development. Next.js sets this, but let's be robust
    const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
    const localUrl = "http://127.0.0.1:8080/execute";
    const gcrHost = process.env.GCR_Host;

    this.config = {
      url: isDevelopment ? localUrl : `${gcrHost}/execute`,
      isDevelopment,
      targetAudience: gcrHost,
    };
  }

  public static getInstance(): ExecutorService {
    if (!ExecutorService.instance) {
      ExecutorService.instance = new ExecutorService();
    }
    return ExecutorService.instance;
  }

  public getConfig(): ExecutorConfig {
    return this.config;
  }

  public validateConfig(): { valid: boolean; message?: string } {
    // Only enforce GCR_Host if we are explicitly NOT in development
    if (this.config.isDevelopment) {
      return { valid: true };
    }

    if (!process.env.GCR_Host) {
      return {
        valid: false,
        message: "Configuration error: GCR Host is not defined for production environment.",
      };
    }
    return { valid: true };
  }
}

export const executorService = ExecutorService.getInstance();

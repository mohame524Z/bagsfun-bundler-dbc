import { Connection, Commitment } from '@solana/web3.js';
import {
  RPCEndpoint,
  RPCHealthStatus,
  RPCManagerConfig
} from '@pump-bundler/types';
import { createLogger, retryAsync, sleep } from '@pump-bundler/utils';

const logger = createLogger('RPCManager');

export class RPCManager {
  private endpoints: RPCEndpoint[];
  private connections: Map<string, Connection> = new Map();
  private healthStatus: Map<string, RPCHealthStatus> = new Map();
  private currentEndpointIndex: number = 0;
  private config: RPCManagerConfig;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: RPCManagerConfig) {
    this.config = config;
    this.endpoints = config.endpoints.sort((a, b) => a.priority - b.priority);
    this.initializeConnections();

    if (config.healthCheckEnabled) {
      this.startHealthChecks();
    }
  }

  // ============================================
  // Initialization
  // ============================================

  private initializeConnections(): void {
    for (const endpoint of this.endpoints) {
      const connection = new Connection(endpoint.url, {
        commitment: 'confirmed' as Commitment,
        wsEndpoint: endpoint.wsUrl,
        confirmTransactionInitialTimeout: endpoint.timeout
      });

      this.connections.set(endpoint.id, connection);

      this.healthStatus.set(endpoint.id, {
        endpointId: endpoint.id,
        isHealthy: true,
        latency: 0,
        lastChecked: new Date(),
        errorCount: 0,
        successRate: 1.0
      });
    }

    logger.info(`Initialized ${this.endpoints.length} RPC endpoints`);
  }

  // ============================================
  // Connection Management
  // ============================================

  getCurrentConnection(): Connection {
    const endpoint = this.getCurrentEndpoint();
    const connection = this.connections.get(endpoint.id);

    if (!connection) {
      throw new Error(`Connection not found for endpoint ${endpoint.id}`);
    }

    return connection;
  }

  getCurrentEndpoint(): RPCEndpoint {
    return this.endpoints[this.currentEndpointIndex];
  }

  getConnection(endpointId: string): Connection | undefined {
    return this.connections.get(endpointId);
  }

  getAllConnections(): Map<string, Connection> {
    return this.connections;
  }

  // ============================================
  // Health Checks
  // ============================================

  private startHealthChecks(): void {
    const interval = this.endpoints[0]?.healthCheckInterval || 60000;

    this.healthCheckInterval = setInterval(() => {
      this.checkAllEndpointsHealth();
    }, interval);

    // Initial health check
    this.checkAllEndpointsHealth();
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  private async checkAllEndpointsHealth(): Promise<void> {
    const checks = this.endpoints.map(endpoint =>
      this.checkEndpointHealth(endpoint.id)
    );

    await Promise.allSettled(checks);
  }

  async checkEndpointHealth(endpointId: string): Promise<RPCHealthStatus> {
    const connection = this.connections.get(endpointId);
    const endpoint = this.endpoints.find(e => e.id === endpointId);

    if (!connection || !endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    const status = this.healthStatus.get(endpointId)!;
    const startTime = Date.now();

    try {
      // Test connection with a simple slot request
      await Promise.race([
        connection.getSlot(),
        sleep(endpoint.timeout).then(() => {
          throw new Error('Health check timeout');
        })
      ]);

      const latency = Date.now() - startTime;

      // Update success stats
      const totalChecks = status.errorCount + Math.floor(status.successRate * 100);
      const successCount = Math.floor(status.successRate * 100) + 1;
      const newSuccessRate = successCount / (totalChecks + 1);

      const updatedStatus: RPCHealthStatus = {
        endpointId,
        isHealthy: true,
        latency,
        lastChecked: new Date(),
        errorCount: status.errorCount,
        successRate: newSuccessRate
      };

      this.healthStatus.set(endpointId, updatedStatus);
      logger.debug(`${endpoint.name} healthy - Latency: ${latency}ms`);

      return updatedStatus;
    } catch (error) {
      const latency = Date.now() - startTime;

      const updatedStatus: RPCHealthStatus = {
        endpointId,
        isHealthy: false,
        latency,
        lastChecked: new Date(),
        errorCount: status.errorCount + 1,
        successRate: Math.max(0, status.successRate - 0.1)
      };

      this.healthStatus.set(endpointId, updatedStatus);
      logger.warn(`${endpoint.name} unhealthy - Error: ${(error as Error).message}`);

      // Auto-failover if current endpoint is unhealthy
      if (endpoint.id === this.getCurrentEndpoint().id && this.config.autoFailover) {
        await this.failover();
      }

      return updatedStatus;
    }
  }

  getHealthStatus(): RPCHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  getEndpointHealth(endpointId: string): RPCHealthStatus | undefined {
    return this.healthStatus.get(endpointId);
  }

  // ============================================
  // Failover
  // ============================================

  async failover(): Promise<boolean> {
    logger.warn('Initiating RPC failover...');

    const originalIndex = this.currentEndpointIndex;
    let attempts = 0;

    while (attempts < this.config.maxFailoverAttempts) {
      // Try next endpoint
      this.currentEndpointIndex =
        (this.currentEndpointIndex + 1) % this.endpoints.length;

      // Avoid infinite loop
      if (this.currentEndpointIndex === originalIndex && attempts > 0) {
        logger.error('All RPC endpoints exhausted');
        return false;
      }

      const nextEndpoint = this.endpoints[this.currentEndpointIndex];
      logger.info(`Trying endpoint: ${nextEndpoint.name}`);

      try {
        // Check if this endpoint is healthy
        const health = await this.checkEndpointHealth(nextEndpoint.id);

        if (health.isHealthy) {
          logger.success(`Failover successful to ${nextEndpoint.name}`);
          return true;
        }
      } catch (error) {
        logger.warn(`Endpoint ${nextEndpoint.name} failed health check`);
      }

      attempts++;
    }

    logger.error('Failover failed - no healthy endpoints available');
    return false;
  }

  async switchToEndpoint(endpointId: string): Promise<void> {
    const index = this.endpoints.findIndex(e => e.id === endpointId);

    if (index === -1) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    this.currentEndpointIndex = index;
    const endpoint = this.endpoints[index];

    logger.info(`Switched to endpoint: ${endpoint.name}`);

    // Check health of new endpoint
    await this.checkEndpointHealth(endpointId);
  }

  // ============================================
  // RPC Management
  // ============================================

  addCustomEndpoint(endpoint: RPCEndpoint): void {
    // Check if endpoint already exists
    if (this.endpoints.find(e => e.id === endpoint.id)) {
      throw new Error(`Endpoint ${endpoint.id} already exists`);
    }

    // Add to endpoints list
    this.endpoints.push(endpoint);
    this.endpoints.sort((a, b) => a.priority - b.priority);

    // Create connection
    const connection = new Connection(endpoint.url, {
      commitment: 'confirmed' as Commitment,
      wsEndpoint: endpoint.wsUrl,
      confirmTransactionInitialTimeout: endpoint.timeout
    });

    this.connections.set(endpoint.id, connection);

    // Initialize health status
    this.healthStatus.set(endpoint.id, {
      endpointId: endpoint.id,
      isHealthy: true,
      latency: 0,
      lastChecked: new Date(),
      errorCount: 0,
      successRate: 1.0
    });

    logger.info(`Added custom endpoint: ${endpoint.name}`);

    // Initial health check
    this.checkEndpointHealth(endpoint.id);
  }

  removeEndpoint(endpointId: string): void {
    const index = this.endpoints.findIndex(e => e.id === endpointId);

    if (index === -1) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    // Can't remove if it's the only endpoint
    if (this.endpoints.length === 1) {
      throw new Error('Cannot remove the only endpoint');
    }

    // Switch to another endpoint if removing current
    if (this.currentEndpointIndex === index) {
      this.currentEndpointIndex = (index + 1) % (this.endpoints.length - 1);
    } else if (this.currentEndpointIndex > index) {
      this.currentEndpointIndex--;
    }

    // Remove from collections
    this.endpoints.splice(index, 1);
    this.connections.delete(endpointId);
    this.healthStatus.delete(endpointId);

    logger.info(`Removed endpoint: ${endpointId}`);
  }

  updateEndpoint(endpointId: string, updates: Partial<RPCEndpoint>): void {
    const endpoint = this.endpoints.find(e => e.id === endpointId);

    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    // Update endpoint properties
    Object.assign(endpoint, updates);

    // If URL changed, recreate connection
    if (updates.url || updates.wsUrl) {
      const connection = new Connection(endpoint.url, {
        commitment: 'confirmed' as Commitment,
        wsEndpoint: endpoint.wsUrl,
        confirmTransactionInitialTimeout: endpoint.timeout
      });

      this.connections.set(endpointId, connection);
    }

    logger.info(`Updated endpoint: ${endpoint.name}`);

    // Re-check health
    this.checkEndpointHealth(endpointId);
  }

  getAllEndpoints(): RPCEndpoint[] {
    return [...this.endpoints];
  }

  // ============================================
  // Utility Methods
  // ============================================

  async executeWithFailover<T>(
    operation: (connection: Connection) => Promise<T>,
    maxAttempts?: number
  ): Promise<T> {
    const attempts = maxAttempts || this.config.maxFailoverAttempts;
    let lastError: Error | undefined;

    for (let i = 0; i < attempts; i++) {
      try {
        const connection = this.getCurrentConnection();
        return await operation(connection);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Operation failed: ${lastError.message}`);

        if (i < attempts - 1) {
          const failoverSuccess = await this.failover();
          if (!failoverSuccess) {
            break;
          }
        }
      }
    }

    throw lastError || new Error('Operation failed after all failover attempts');
  }

  getStats() {
    return {
      totalEndpoints: this.endpoints.length,
      currentEndpoint: this.getCurrentEndpoint().name,
      healthyEndpoints: Array.from(this.healthStatus.values()).filter(
        s => s.isHealthy
      ).length,
      averageLatency:
        Array.from(this.healthStatus.values()).reduce(
          (sum, s) => sum + s.latency,
          0
        ) / this.healthStatus.size
    };
  }

  // ============================================
  // Cleanup
  // ============================================

  destroy(): void {
    this.stopHealthChecks();
    this.connections.clear();
    this.healthStatus.clear();
    logger.info('RPCManager destroyed');
  }
}

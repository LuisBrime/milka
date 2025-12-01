export type ServiceKey = 'compiler' | 'fs';

export abstract class Service {
  abstract close(): Promise<void>;
}

/**
 * Source of truth for all services used accross `milka`.
 */
class ServiceRegistry {
  private services = new Map<ServiceKey, Service>();

  /**
   * Register a Service for it to be globally available,
   * it assumes the service is initialized with dependencies resolved.
   *
   * @param key - `ServiceKey` used to identify the registered service.
   * @param service - Instance of the registered service.
   */
  register<T extends Service>(
    key: ServiceKey,
    service: T,
  ) {
    // Register to Service Map.
    this.services.set(key, service);
  }

  get<T extends Service>(key: ServiceKey): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`service ${key} not registered…`);
    }

    return service as T;
  }

  /**
   * Closes all registered services.
   */
  async close() {
    for (const service of this.services.values()) {
      await service.close();
    }
  }
}

export const serviceRegistry = new ServiceRegistry();

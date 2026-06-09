import type {
  Shipment,
  Route,
  RiskProfile,
  Customer,
  Disruption,
  Task,
  AgentRun,
  AuditLog,
  ToolCall,
  MemoryEntry,
} from "@/lib/domain/types";
import type {
  ShipmentRepository,
  RouteRepository,
  RiskRepository,
  CustomerRepository,
  DisruptionRepository,
  TaskRepository,
  AgentRunRepository,
  AuditLogRepository,
  ToolCallRepository,
  MemoryRepository,
  Repositories,
} from "./types";
import * as seed from "@/lib/domain/seed";

// ────────────────────────────────────────────────────────────────────────────
// InMemoryMockRepository
//
// A fully functional repository implementation backed by in-process state.
// No database connection required — the application runs instantly. Populated
// with realistic enterprise logistics data from the seed module.
// ────────────────────────────────────────────────────────────────────────────

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

class InMemoryShipmentRepository implements ShipmentRepository {
  constructor(private data: Shipment[]) {}
  async list() {
    return clone(this.data);
  }
  async getById(id: string) {
    return clone(this.data.find((s) => s.id === id) ?? null);
  }
  async getByName(name: string) {
    const n = name.toLowerCase().replace(/\s+/g, "");
    return clone(
      this.data.find(
        (s) => s.name.toLowerCase().replace(/\s+/g, "") === n
      ) ?? null
    );
  }
  async listByCustomer(customerId: string) {
    return clone(this.data.filter((s) => s.customerId === customerId));
  }
  async listByRoute(routeId: string) {
    return clone(this.data.filter((s) => s.assignedRouteId === routeId));
  }
}

class InMemoryRouteRepository implements RouteRepository {
  constructor(private data: Route[]) {}
  async list() {
    return clone(this.data);
  }
  async getById(id: string) {
    return clone(this.data.find((r) => r.id === id) ?? null);
  }
  async getByName(name: string) {
    const n = name.toLowerCase();
    return clone(
      this.data.find(
        (r) => r.name.toLowerCase() === n || r.name.toLowerCase().includes(n)
      ) ?? null
    );
  }
}

class InMemoryRiskRepository implements RiskRepository {
  constructor(private data: RiskProfile[]) {}
  async list() {
    return clone(this.data);
  }
  async getByRoute(routeId: string) {
    return clone(this.data.find((r) => r.routeId === routeId) ?? null);
  }
}

class InMemoryCustomerRepository implements CustomerRepository {
  constructor(private data: Customer[]) {}
  async list() {
    return clone(this.data);
  }
  async getById(id: string) {
    return clone(this.data.find((c) => c.id === id) ?? null);
  }
  async listByShipment(shipmentId: string) {
    return clone(this.data.filter((c) => c.activeShipmentIds.includes(shipmentId)));
  }
}

class InMemoryDisruptionRepository implements DisruptionRepository {
  constructor(private data: Disruption[]) {}
  async list() {
    return clone(this.data);
  }
  async getById(id: string) {
    return clone(this.data.find((d) => d.id === id) ?? null);
  }
  async listActive() {
    return clone(this.data.filter((d) => d.status !== "resolved"));
  }
}

class InMemoryTaskRepository implements TaskRepository {
  constructor(private data: Task[]) {}
  async list() {
    return clone([...this.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
  async getById(id: string) {
    return clone(this.data.find((t) => t.id === id) ?? null);
  }
  async create(entity: Task) {
    this.data.unshift(entity);
    return clone(entity);
  }
  async update(id: string, patch: Partial<Task>) {
    const t = this.data.find((x) => x.id === id);
    if (!t) return null;
    Object.assign(t, patch);
    return clone(t);
  }
}

class InMemoryAgentRunRepository implements AgentRunRepository {
  constructor(private data: AgentRun[]) {}
  async list() {
    return clone([...this.data].sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
  }
  async getById(id: string) {
    return clone(this.data.find((r) => r.id === id) ?? null);
  }
  async create(entity: AgentRun) {
    this.data.unshift(entity);
    return clone(entity);
  }
  async update(id: string, patch: Partial<AgentRun>) {
    const r = this.data.find((x) => x.id === id);
    if (!r) return null;
    Object.assign(r, patch);
    return clone(r);
  }
}

class InMemoryAuditLogRepository implements AuditLogRepository {
  constructor(private data: AuditLog[]) {}
  async list() {
    return clone([...this.data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  }
  async getById(id: string) {
    return clone(this.data.find((a) => a.id === id) ?? null);
  }
  async create(entity: AuditLog) {
    this.data.unshift(entity);
    return clone(entity);
  }
  async listRecent(limit: number) {
    return clone(
      [...this.data]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit)
    );
  }
}

class InMemoryToolCallRepository implements ToolCallRepository {
  constructor(private data: ToolCall[]) {}
  async list() {
    return clone(this.data);
  }
  async getById(id: string) {
    return clone(this.data.find((t) => t.id === id) ?? null);
  }
  async create(entity: ToolCall) {
    this.data.unshift(entity);
    return clone(entity);
  }
  async listByRun(runId: string) {
    return clone(this.data.filter((t) => t.runId === runId));
  }
}

class InMemoryMemoryRepository implements MemoryRepository {
  constructor(private data: MemoryEntry[]) {}
  async list() {
    return clone([...this.data].sort((a, b) => b.reuseCount - a.reuseCount));
  }
  async getById(id: string) {
    return clone(this.data.find((m) => m.id === id) ?? null);
  }
  async create(entity: MemoryEntry) {
    this.data.unshift(entity);
    return clone(entity);
  }
  async retrieve(signals: string[], limit = 3) {
    const wanted = new Set(signals.map((s) => s.toLowerCase()));
    const scored = this.data
      .map((m) => {
        const overlap = m.signals.filter((s) => wanted.has(s.toLowerCase())).length;
        return { m, overlap };
      })
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || b.m.reuseCount - a.m.reuseCount)
      .slice(0, limit)
      .map((x) => clone(x.m));
    return scored;
  }
  async incrementReuse(id: string) {
    const m = this.data.find((x) => x.id === id);
    if (m) m.reuseCount += 1;
  }
}

// ── Singleton container ─────────────────────────────────────────────────────
// In serverless, module state persists for the life of a warm instance. Seed
// data is read-only; operational writes live for the request/instance lifetime
// and are always returned in the response payload, so the demo is deterministic.

let singleton: Repositories | null = null;

export function createInMemoryRepositories(): Repositories {
  return {
    shipments: new InMemoryShipmentRepository(clone(seed.shipments)),
    routes: new InMemoryRouteRepository(clone(seed.routes)),
    risks: new InMemoryRiskRepository(clone(seed.riskProfiles)),
    customers: new InMemoryCustomerRepository(clone(seed.customers)),
    disruptions: new InMemoryDisruptionRepository(clone(seed.disruptions)),
    tasks: new InMemoryTaskRepository(clone(seed.seedTasks)),
    agentRuns: new InMemoryAgentRunRepository(clone(seed.seedAgentRuns)),
    auditLogs: new InMemoryAuditLogRepository(clone(seed.seedAuditLogs)),
    toolCalls: new InMemoryToolCallRepository(clone(seed.seedToolCalls)),
    memory: new InMemoryMemoryRepository(clone(seed.memoryEntries)),
  };
}

export function getRepositories(): Repositories {
  if (!singleton) singleton = createInMemoryRepositories();
  return singleton;
}

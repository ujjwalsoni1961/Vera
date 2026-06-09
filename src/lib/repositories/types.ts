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

// ────────────────────────────────────────────────────────────────────────────
// Repository interfaces
//
// The application depends only on these interfaces — never on a concrete data
// source. Today they are backed by InMemoryMockRepository. A PostgreSQL
// implementation can be dropped in later without touching any caller.
// ────────────────────────────────────────────────────────────────────────────

export interface ReadRepository<T> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
}

export interface WriteRepository<T> extends ReadRepository<T> {
  create(entity: T): Promise<T>;
}

// Domain data (read-mostly operational records)
export interface ShipmentRepository extends ReadRepository<Shipment> {
  getByName(name: string): Promise<Shipment | null>;
  listByCustomer(customerId: string): Promise<Shipment[]>;
  listByRoute(routeId: string): Promise<Shipment[]>;
}

export interface RouteRepository extends ReadRepository<Route> {
  getByName(name: string): Promise<Route | null>;
}

export interface RiskRepository {
  getByRoute(routeId: string): Promise<RiskProfile | null>;
  list(): Promise<RiskProfile[]>;
}

export interface CustomerRepository extends ReadRepository<Customer> {
  listByShipment(shipmentId: string): Promise<Customer[]>;
}

export interface DisruptionRepository extends ReadRepository<Disruption> {
  listActive(): Promise<Disruption[]>;
}

// Operational / agentic records (read + append)
export interface TaskRepository extends WriteRepository<Task> {
  update(id: string, patch: Partial<Task>): Promise<Task | null>;
}

export interface AgentRunRepository extends WriteRepository<AgentRun> {
  update(id: string, patch: Partial<AgentRun>): Promise<AgentRun | null>;
}

export interface AuditLogRepository extends WriteRepository<AuditLog> {
  listRecent(limit: number): Promise<AuditLog[]>;
}

export interface ToolCallRepository extends WriteRepository<ToolCall> {
  listByRun(runId: string): Promise<ToolCall[]>;
}

export interface MemoryRepository extends WriteRepository<MemoryEntry> {
  /** Retrieve memories whose signals overlap with the query signals. */
  retrieve(signals: string[], limit?: number): Promise<MemoryEntry[]>;
  incrementReuse(id: string): Promise<void>;
}

export interface Repositories {
  shipments: ShipmentRepository;
  routes: RouteRepository;
  risks: RiskRepository;
  customers: CustomerRepository;
  disruptions: DisruptionRepository;
  tasks: TaskRepository;
  agentRuns: AgentRunRepository;
  auditLogs: AuditLogRepository;
  toolCalls: ToolCallRepository;
  memory: MemoryRepository;
}

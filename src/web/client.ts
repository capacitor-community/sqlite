/**
 * Main-thread half of the worker RPC.
 *
 * Two responsibilities beyond posting messages:
 *
 * - Ops that touch a specific connection are serialised per connection key (`RW_foo`), so two
 *   overlapping `run()` calls cannot interleave. The worker reads `changes()` inside the same op
 *   as the statement, which removes the read/write race; the queue removes the ordering surprise
 *   on top of it.
 * - Errors come back as a payload and are rebuilt into a real Error here, instead of the
 *   `throw new Error(\`${err}\`)` stringification the jeep facade used.
 */
import { fromErrorPayload, workerLoadFailure } from './errors';
import type { WorkerEvent, WorkerResponse } from './protocol';
import { BOOT_ID, EVENT_ID } from './protocol';
import { createSqliteWorker } from './worker-factory';

interface Pending {
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
}

export class WorkerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private queues = new Map<string, Promise<unknown>>();
  private booted: Promise<void> | null = null;
  /** Set by the facade so worker-raised events reach notifyListeners. */
  onEvent: ((event: string, data: any) => void) | null = null;

  get isStarted(): boolean {
    return this.worker !== null;
  }

  start(): Promise<void> {
    if (this.booted) return this.booted;
    const worker = createSqliteWorker();
    this.worker = worker;

    this.booted = new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent) => {
        const message = event.data as WorkerResponse;
        if (!message || typeof message.id !== 'number') return;
        if (message.id === BOOT_ID) {
          resolve();
          return;
        }
        if (message.id === EVENT_ID) {
          const raised = message as unknown as WorkerEvent;
          this.onEvent?.(raised.event, raised.data);
          return;
        }
        const entry = this.pending.get(message.id);
        if (!entry) return;
        this.pending.delete(message.id);
        if (message.ok) entry.resolve(message.result);
        else entry.reject(fromErrorPayload(message.error));
      };
      worker.onerror = (event) => {
        const error = workerLoadFailure((event as ErrorEvent).message ?? '');
        reject(error);
        this.failAll(error);
      };
    });
    return this.booted;
  }

  private failAll(error: Error): void {
    for (const entry of this.pending.values()) entry.reject(error);
    this.pending.clear();
  }

  private dispatch(op: string, args: Record<string, any>, transfer: Transferable[]): Promise<any> {
    const worker = this.worker;
    if (!worker) return Promise.reject(new Error('The SQLite worker is not running.'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, op, args }, transfer);
    });
  }

  /**
   * @param serializeKey when given, this op waits for the previous op on the same key. Use the
   *   `RO_`/`RW_` connection key so per-connection ordering is guaranteed without serialising
   *   unrelated databases against each other.
   */
  call(op: string, args: Record<string, any> = {}, serializeKey?: string, transfer: Transferable[] = []): Promise<any> {
    if (!serializeKey) return this.dispatch(op, args, transfer);
    const previous = this.queues.get(serializeKey) ?? Promise.resolve();
    const next = previous.then(
      () => this.dispatch(op, args, transfer),
      () => this.dispatch(op, args, transfer),
    );
    // Keep a settled-either-way tail so one failure does not wedge the queue.
    this.queues.set(
      serializeKey,
      next.catch(() => undefined),
    );
    return next;
  }

  releaseQueue(serializeKey: string): void {
    this.queues.delete(serializeKey);
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.booted = null;
    this.queues.clear();
    this.failAll(new Error('The SQLite worker was terminated.'));
  }
}

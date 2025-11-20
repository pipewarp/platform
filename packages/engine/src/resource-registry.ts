import type { Capability, WorkerMetadata } from "@lcase/types";

// NOTE: currently assumes one worker structure
// not final, just a sketch for getting/setting data
// data is also not quite right
export class ResourceRegistry {
  #workers = new Map<string, WorkerMetadata>();
  #capabilities = new Map<string, Capability>();

  getWorkers() {
    const workers: WorkerMetadata[] = [];
    this.#workers.forEach((w) => workers.push({ ...w }));
    return workers;
  }
  registerWorker(workerMetadata: WorkerMetadata) {
    this.#workers.set(workerMetadata.id, workerMetadata);
    for (const cap of workerMetadata.capabilities) {
      this.registerCapability(cap.name, cap);
    }
  }

  getCapability(name: string) {
    return { ...this.#capabilities.get(name) };
  }
  getCapabilities() {
    const caps: Capability[] = [];
    this.#capabilities.forEach((c) => caps.push({ ...c }));
    return caps;
  }
  registerCapability(name: string, capability: Capability) {
    this.#capabilities.set(name, { ...capability });
  }
}

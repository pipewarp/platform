import { AnyEvent } from "@pipewarp/types";

/**
 * QueuePort defines the interface for a message queue system.
 *
 * Methods:
 * - enqueue: Add a message to a specified queue.
 * - reserve: Reserve a message from a specified queue for processing.
 * - ack: Acknowledge successful processing of a message.
 * - nack: Negatively acknowledge a message, indicating processing failure.
 * - peek: View messages in a queue without removing them.
 *
 * All methods are asynchronous and return Promises.
 * @see EventEnvelope for the message structure.
 *
 * @interface QueuePort

 * @example
 * class MyQueue implements QueuePort {
 *   async enqueue(queue: string, message: EventEnvelope): Promise<void> {
 *    // Implementation here
 *   }
 *   async reserve(queue: string, workerId: string, waitMs?: number): Promise<EventEnvelope | null> {
 *     // Implementation here
 *   }
 *   async ack(queue: string, messageId: string): Promise<void> {
 *     // Implementation here
 *   }
 *   async nack(queue: string, messageId: string, reason: string): Promise<void> {
 *     // Implementation here
 *   }
 *
 *   async peek(queue: string, limit: number): Promise<EventEnvelope[]> {
 *     // Implementation here
 *   }
 * }
 */
export interface QueuePort {
  enqueue(queue: string, event: AnyEvent): Promise<void>;
  reserve(
    queue: string,
    workerId: string,
    holdMs?: number
  ): Promise<AnyEvent | null>;
  ack(queue: string, eventId: string): Promise<void>;
  nack(queue: string, eventId: string, reason: string): Promise<void>;
  peek(queue: string, number: number): Promise<AnyEvent[]>;
}

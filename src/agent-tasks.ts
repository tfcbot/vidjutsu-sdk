import type createFetchClient from "openapi-fetch";
import type { components, paths } from "./schema.js";

type FetchClient = ReturnType<typeof createFetchClient<paths>>;
type AgentTaskAccepted = components["schemas"]["AgentTaskAccepted"];
type AgentTaskEvent = components["schemas"]["AgentTaskEvent"];
type AgentTaskEventPage = components["schemas"]["AgentTaskEventPage"];
type CreateAgentTaskRequest = components["schemas"]["CreateAgentTaskRequest"];

export interface CreateAgentTaskOptions {
  idempotencyKey: string;
}

export interface TailAgentTaskOptions {
  after?: string;
  limit?: number;
  pollIntervalMs?: number;
  signal?: AbortSignal;
}

export interface AgentTaskNamespaces {
  agentTasks: {
    create(
      body: CreateAgentTaskRequest,
      options: CreateAgentTaskOptions,
    ): Promise<AgentTaskAccepted>;
    events(
      taskId: string,
      options?: Pick<TailAgentTaskOptions, "after" | "limit">,
    ): Promise<AgentTaskEventPage>;
    tail(
      taskId: string,
      options?: TailAgentTaskOptions,
    ): AsyncGenerator<AgentTaskEvent, void, void>;
  };
}

export function bindAgentTasks(client: FetchClient): AgentTaskNamespaces {
  const events = async (
    taskId: string,
    options: Pick<TailAgentTaskOptions, "after" | "limit"> = {},
  ): Promise<AgentTaskEventPage> => {
    const result = await client.GET("/v1/agent/tasks/events", {
      params: {
        query: { id: taskId, after: options.after, limit: options.limit },
      },
    });
    return requireData<AgentTaskEventPage>(result, "list agent task events");
  };

  return {
    agentTasks: {
      async create(body, options) {
        if (!options.idempotencyKey.trim()) {
          throw new Error("idempotencyKey is required");
        }
        const result = await client.POST("/v1/agent/tasks", {
          body,
          params: {
            header: { "Idempotency-Key": options.idempotencyKey },
          },
        });
        return requireData<AgentTaskAccepted>(result, "create agent task");
      },
      events,
      async *tail(taskId, options = {}) {
        let cursor = options.after;
        const seen = new Set<string>();
        const pollIntervalMs = options.pollIntervalMs ?? 1_000;
        while (!options.signal?.aborted) {
          const page = await events(taskId, {
            after: cursor,
            limit: options.limit ?? 100,
          });
          for (const event of page.events) {
            if (seen.has(event.id)) continue;
            seen.add(event.id);
            cursor = event.id;
            yield event;
          }
          if (page.terminal) return;
          await delay(pollIntervalMs, options.signal);
        }
      },
    },
  };
}

function requireData<T>(
  result: { data?: unknown; error?: unknown; response: Response },
  operation: string,
): T {
  if (result.data !== undefined) return result.data as T;
  const error = result.error as { message?: string; error?: string } | undefined;
  throw new Error(
    error?.message ??
      error?.error ??
      `VidJutsu failed to ${operation} (HTTP ${result.response.status})`,
  );
}

async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(signal.reason ?? new Error("Agent task tail aborted"));
      },
      { once: true },
    );
  });
}

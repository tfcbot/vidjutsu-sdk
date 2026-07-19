import { afterEach, describe, expect, test } from "bun:test";
import { createClient } from "../src/client.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("agent task SDK", () => {
  test("creates an idempotent task and tails ordered events to a terminal state", async () => {
    const requests: Request[] = [];
    let eventPoll = 0;
    globalThis.fetch = (async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.method === "POST") {
        return Response.json(
          {
            id: "job_task_1",
            status: "queued",
            statusUrl: "/v1/jobs?id=job_task_1",
            eventsUrl: "/v1/agent/tasks/events?id=job_task_1",
          },
          { status: 202 },
        );
      }
      eventPoll += 1;
      return Response.json({
        taskId: "job_task_1",
        events:
          eventPoll === 1
            ? [
                {
                  id: "evt_1",
                  taskId: "job_task_1",
                  sequence: 1,
                  type: "task.created",
                  data: { status: "queued" },
                  createdAt: 1,
                },
              ]
            : [
                {
                  id: "evt_2",
                  taskId: "job_task_1",
                  sequence: 2,
                  type: "task.completed",
                  data: { finalAssetId: "asset_1" },
                  createdAt: 2,
                },
              ],
        nextCursor: eventPoll === 1 ? "evt_1" : "evt_2",
        terminal: eventPoll > 1,
      });
    }) as typeof fetch;

    const client = createClient({
      baseUrl: "https://api.test",
      apiKey: "customer-key",
    });
    const accepted = await client.agentTasks.create(
      {
        prompt: "Clone this video and add replacement wall text",
        inputs: [{ name: "source", url: "https://cdn.test/source.mp4" }],
      },
      { idempotencyKey: "request-1" },
    );
    expect(accepted.id).toBe("job_task_1");

    const events = [];
    for await (const event of client.agentTasks.tail("job_task_1", {
      pollIntervalMs: 1,
    })) {
      events.push(event.type);
    }
    expect(events).toEqual(["task.created", "task.completed"]);
    expect(requests[0].headers.get("Idempotency-Key")).toBe("request-1");
    expect(new URL(requests[2].url).searchParams.get("after")).toBe("evt_1");
  });
});

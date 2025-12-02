import { Request, Response } from "express";
import { EventEmitter } from "events";

const emitter = new EventEmitter();
let version = Date.now();

function formatEvent(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function notifyHomepageUpdated() {
  version = Date.now();
  const payload = { version, updatedAt: new Date().toISOString() };
  emitter.emit("update", payload);
}

export function homepageStreamHandler(_req: Request, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(formatEvent({ version, ready: true }));

  const listener = (payload: unknown) => {
    res.write(formatEvent(payload));
  };

  const keepAlive = setInterval(() => {
    res.write(":heartbeat\n\n");
  }, 30000);

  emitter.on("update", listener);

  reqCleanup(res, listener, keepAlive);
}

function reqCleanup(res: Response, listener: (...args: any[]) => void, keepAlive: NodeJS.Timeout) {
  const cleanup = () => {
    clearInterval(keepAlive);
    emitter.off("update", listener);
  };

  res.on("close", () => {
    cleanup();
    res.end();
  });
  res.on("finish", cleanup);
}

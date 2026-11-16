// src/analytics/client.ts
var DEFAULT_FLUSH_INTERVAL_MS = 1e4;
var DEFAULT_MAX_BATCH_SIZE = 20;
var SESSION_STORAGE_KEY = "prism.sid";
var CAMPAIGN_STORAGE_KEY = "prism.utm";
var CAMPAIGN_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "ref"
];
var MAX_CAMPAIGN_VALUE_LENGTH = 100;
var noopClient = {
  track: () => {},
  flush: () => {}
};
var generateSessionId = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
var resolveSessionId = () => {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing)
      return existing;
    const sessionId = generateSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    return generateSessionId();
  }
};
var resolveFirstTouch = () => {
  try {
    const cached = window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (cached)
      return JSON.parse(cached);
  } catch {}
  const params = new URLSearchParams(window.location?.search ?? "");
  const touch = {};
  for (const key of CAMPAIGN_KEYS) {
    const value = params.get(key);
    if (value)
      touch[key] = value.slice(0, MAX_CAMPAIGN_VALUE_LENGTH);
  }
  if (Object.keys(touch).length === 0)
    return;
  try {
    window.sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(touch));
  } catch {}
  return touch;
};
var createPrismClient = (config) => {
  const {
    collectorUrl,
    product,
    flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
    maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
    fetch: fetchImpl
  } = config;
  if (!collectorUrl || typeof window === "undefined")
    return noopClient;
  const endpoint = `${collectorUrl.replace(/\/+$/, "")}/collect`;
  const sessionId = resolveSessionId();
  const firstTouch = resolveFirstTouch();
  const queue = [];
  let intervalId = null;
  const stopTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  const send = (useBeacon) => {
    if (queue.length === 0) {
      stopTimer();
      return;
    }
    const events = queue.splice(0, queue.length);
    const body = JSON.stringify({ product, events });
    stopTimer();
    if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        navigator.sendBeacon(endpoint, body);
        return;
      } catch {}
    }
    const doFetch = fetchImpl ?? globalThis.fetch;
    doFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(() => {});
  };
  const ensureTimer = () => {
    if (intervalId === null) {
      intervalId = setInterval(() => send(false), flushIntervalMs);
    }
  };
  const track = (name, properties) => {
    const event = { name, sessionId };
    const path = window.location?.pathname;
    if (path)
      event.path = path;
    const referrer = document.referrer;
    if (referrer)
      event.referrer = referrer;
    if (firstTouch || properties)
      event.properties = { ...firstTouch, ...properties };
    queue.push(event);
    ensureTimer();
    if (queue.length >= maxBatchSize)
      send(false);
  };
  const flush = () => send(false);
  window.addEventListener("pagehide", () => send(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden")
      send(true);
  });
  return { track, flush };
};
// src/analytics/usePageview.ts
import { useEffect, useRef } from "react";
var usePageview = (client, pathname) => {
  const lastPathname = useRef(null);
  useEffect(() => {
    if (lastPathname.current === pathname)
      return;
    lastPathname.current = pathname;
    client.track("pageview");
  }, [client, pathname]);
};
export {
  createPrismClient,
  usePageview
};

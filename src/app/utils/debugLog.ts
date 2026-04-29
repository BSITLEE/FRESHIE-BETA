const ENDPOINT = 'http://127.0.0.1:7303/ingest/cd4c46fd-862f-4a50-af51-9e0a5989d1cc';
const SESSION_ID = '4ed7f2';

type DebugPayload = {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

export function debugLog(payload: Omit<DebugPayload, 'sessionId' | 'timestamp'> & { timestamp?: number }) {
  const body = {
    sessionId: SESSION_ID,
    timestamp: payload.timestamp ?? Date.now(),
    runId: payload.runId,
    hypothesisId: payload.hypothesisId,
    location: payload.location,
    message: payload.message,
    data: payload.data ?? {},
  };

  // Primary (may be blocked by CORS/preflight in-browser)
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION_ID },
    body: JSON.stringify(body),
  }).catch(() => {});

  // Fallback: no-cors simple request to still reach logger
  fetch(ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  }).catch(() => {});
}


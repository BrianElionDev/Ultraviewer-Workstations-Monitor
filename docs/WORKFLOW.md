### Ultraviewer Monitor — Workflow Overview

End-to-end: how telemetry flows from the workstation to alerts and storage.

## 1) Startup

1. `src/agent/index.js` loads `settings`, `supabase`, and initializes `alertManager` via `src/notifications/index.js`.
2. Host info is read from `src/agent/utils.js`.
3. Logs boot line and invokes `oneCycle()`, then schedules it every `settings.checkIntervalMs`.

## 2) One monitoring cycle

1. Parallel checks:
   - `checkUltraViewer()` detects if UltraViewer desktop app is running.
   - `checkNetwork("8.8.8.8")` measures reachability and ping via `ping` lib then system ping.
2. Conditional heavy check:
   - Every `settings.speedTestEveryNCycles` cycles, `checkSpeed()` runs `npx fast --json --browser chrome` to capture download Mbps and latency. Falls back to PowerShell `Test-NetConnection`, system `ping`, and `ping` lib.
   - Last successful speed results are cached for use between heavy runs.
3. Compose metrics payload:
   - `hostname`, `os`, `is_ultraviewer_on`, `is_online`, `ping_ms`, `download_mbps`, `upload_mbps` (null), `speed_test_at`.
4. Persist:
   - Upsert to Supabase `workstations` using `hostname` as conflict key.

## 3) Alerting logic

1. State tracking:
   - `previousState` remembers last UltraViewer status, network status, and speed numbers.
2. On startup (configurable):
   - If `settings.alerts.startupStatus` is true, sends initial UltraViewer up/down and Network down (no "restored" on boot).
3. State changes:
   - UltraViewer false→true: `alertUltraViewerUp()`.
   - UltraViewer true→false: reminders via `alertUltraViewerDown()` if `settings.alerts.reminders`.
   - Network false→true: `alertNetworkUp()`.
   - Network true→false: reminders via `alertNetworkDown()` if `settings.alerts.reminders`.
4. Threshold breaches:
   - Download below `settings.thresholds.minDownloadMbps` → `alertSpeedThreshold()`.
   - Upload below `settings.thresholds.minUploadMbps` if `uploadCheckEnabled`.
   - Ping above `settings.thresholds.maxPingMs` → `alertPingThreshold()`.
5. Sustained slow-network policy:
   - If `download < alerts.slowNetWarningMbps`, sends `SUSTAINED_SLOW_NETWORK` medium-severity warning.
6. Cooldown & fanout:
   - `alertManager.triggerAlert()` enforces `settings.alerts.cooldownMs` per `(type, hostname)` and broadcasts to all registered channels.

## 4) Channels bootstrap

1. `src/notifications/index.js` reads `settings.alerts.channels` and registers:
   - Console (if enabled)
   - Log (Winston)
2. Each channel implements `send(alert)`.

## 5) Configuration surface

Driven by `src/config/settings.js` with env overrides:

- Intervals: `checkIntervalMs`, `speedTestEveryNCycles`
- Thresholds: `MIN_DOWNLOAD_MBPS`, `MIN_UPLOAD_MBPS`, `MAX_PING_MS`
- Alert toggles: `ALERTS_ENABLED`, `UPLOAD_CHECK_ENABLED`
- Alert behavior: `ALERT_COOLDOWN_MS`, `ALERT_STARTUP_STATUS`, `ALERT_REMINDERS`, channel flags
- Integrations: optional `CHROME_BIN`

## 6) Data model (Supabase)

- Table: `workstations`
  - Upserted by `hostname`
  - Columns used: `hostname`, `os`, `updated_at`, `is_ultraviewer_on`, `is_online`, `ping_ms`, `download_mbps`, `upload_mbps`, `speed_test_at`

## 7) Ops notes

- If fast-cli fails (headless/Chrome missing), system gracefully degrades to ping-only metrics.
- Cooldowns prevent alert spam during unstable connections.
- Increase `speedTestEveryNCycles` to reduce bandwidth/CPU if many agents run concurrently.

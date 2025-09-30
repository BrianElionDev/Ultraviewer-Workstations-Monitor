### Ultraviewer Monitor — File Reference

Concise reference for what each module does and its key exports/side effects. Paths are relative to `src/`.

## Agent

- `agent/index.js`

  - Orchestrates monitoring cycles. On start, logs host info and schedules `oneCycle()` every `settings.checkIntervalMs`.
  - In each cycle:
    - Parallel checks: `checkUltraViewer()` and `checkNetwork("8.8.8.8")`.
    - Runs `checkSpeed()` every `settings.speedTestEveryNCycles` cycles and memoizes last speed results to reuse between heavy runs.
    - Chooses `pingMs` preferring speed test ping; falls back to network ping.
    - Triggers notifications via `alertManager` on state changes or threshold breaches.
    - Upserts workstation status to Supabase `workstations` using `hostname` as conflict key.
  - Maintains `previousState` to detect changes for alerting.

- `agent/checkProcess.js`

  - `checkUltraViewer()` inspects running processes to detect the actual UltraViewer desktop app on Windows/macOS/Linux.
  - Explicitly excludes background services like `ultraviewer_service.exe` to avoid false positives.

- `agent/checkNetwork.js`

  - `checkNetwork(host)` attempts a ping using the `ping` library first; falls back to system `ping` command.
  - Returns `{ alive: boolean, time: number|null }` where `time` is the round-trip ms if parsable.

- `agent/checkSpeed.js`

  - `checkSpeed()` tries `npx fast --json --browser chrome` with detected Chrome to measure download and latency.
  - If `fast` is unavailable/fails, falls back to multiple ping strategies: PowerShell `Test-NetConnection`, system `ping`, then `ping` library.
  - Returns `{ download: number|null, upload: null, ping: number|null }`.

- `agent/utils.js`
  - `getHostInfo()` returns `{ desktopName, os }`.
  - `logInfo()`/`logError()` are thin wrappers over a Winston logger that logs to `agent.log` and console.

## Notifications

- `notifications/alertTypes.js`

  - Central enums for `ALERT_TYPES`, `ALERT_SEVERITY`, and `ALERT_CHANNELS`.

- `notifications/alertManager.js`

  - In-memory cooldown (`Map`) keyed by `type_hostname` to debounce alerts by `settings.alerts.cooldownMs`.
  - `triggerAlert(type, severity, data, message)` broadcasts to all registered channels and records history.
  - Convenience helpers: `alertUltraViewerDown/Up`, `alertNetworkDown/Up`, `alertSpeedThreshold`, `alertPingThreshold`, `alertWorkstationOffline`.

- `notifications/index.js`

  - Bootstraps channels based on `settings.alerts.channels` and environment variables.
  - Registers available channels with `alertManager` and re-exports `alertManager` and `alertTypes`.

- `notifications/channels/consoleChannel.js`

  - Pretty-prints alerts with ANSI color by severity and friendly event names.

- `notifications/channels/logChannel.js`

  - Sends alerts to a log transport (Winston-based). Enabled via `settings.alerts.channels.log`.

Note: Webhook and Email channels have been removed.

## Configuration

- `config/settings.js`
  - Runtime config with env overrides for intervals, thresholds, and alert behavior.
  - Notable flags: `alertsEnabled`, `uploadCheckEnabled`, `alerts.cooldownMs`, `alerts.reminders`, channel toggles.

## Data

- `db/supabase.js`
  - Exports a configured Supabase client used by `agent/index.js` to upsert `workstations` rows.

## Dashboard

- `dashboard/charts.js`

  - Helpers for charting/reports in the UI (consumes DB rows; not required for agent runtime).

- `dashboard/terminal.js`
  - Utilities for terminal-style UI output.

---

### Environment variables (selection)

- `ALERTS_ENABLED=true|false`
- `UPLOAD_CHECK_ENABLED=true|false`
- `MIN_DOWNLOAD_MBPS`, `MIN_UPLOAD_MBPS`, `MAX_PING_MS`
- `ALERT_COOLDOWN_MS`, `ALERT_STARTUP_STATUS`, `ALERT_REMINDERS`
- `ALERT_CONSOLE`, `ALERT_LOG`
- `CHROME_BIN` (optional; auto-detected on Windows if missing)

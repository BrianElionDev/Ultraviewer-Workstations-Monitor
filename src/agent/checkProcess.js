import { exec } from "child_process";
import os from "os";

// Only check for the actual UltraViewer application, not background services
const CANDIDATES = [
  "ultraviewer.exe",
  "UltraViewer.exe",
  "UltraViewer_Desktop.exe",
  "wine",
];

// Background services to exclude
const EXCLUDE_SERVICES = ["ultraviewer_service.exe"];

export function checkUltraViewer() {
  const platform = os.platform();

  return new Promise((resolve) => {
    const cmd =
      platform === "win32"
        ? "tasklist /v" // includes window titles sometimes
        : "ps -A -o pid,comm,args"; // show command and args

    exec(cmd, { windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) return resolve(false);

      const text = stdout.toLowerCase();

      // First, check if any excluded services are running
      const hasExcludedService = EXCLUDE_SERVICES.some((service) =>
        text.includes(service.toLowerCase())
      );

      // Look for actual UltraViewer application (not services)
      const foundApp = CANDIDATES.some((n) => text.includes(n.toLowerCase()));

      if (foundApp) {
        return resolve(true);
      }

      // If no app found but service is running, UltraViewer app is not active
      if (hasExcludedService) {
        return resolve(false);
      }

      // Fallback: no UltraViewer found
      resolve(false);
    });
  });
}

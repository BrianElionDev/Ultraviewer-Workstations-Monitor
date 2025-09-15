import { exec } from "child_process";
import os from "os";

const CANDIDATES = [
  "ultraviewer.exe",
  "UltraViewer.exe",
  "UltraViewer_Service.exe",
  "UltraViewer_Desktop.exe",
  "wine",
];

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

      // Quick pass - look for exact process names
      const foundName = CANDIDATES.some((n) => text.includes(n.toLowerCase()));
      if (foundName) {
        return resolve(true);
      }

      // Additional check: look for "ultraviewer" anywhere in process list (case insensitive)
      if (text.includes("ultraviewer")) {
        return resolve(true);
      }

      // Fallback: no UltraViewer found
      resolve(false);
    });
  });
}

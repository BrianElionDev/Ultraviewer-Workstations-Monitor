import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Returns Mbps + ping ms
export async function checkSpeed() {
  try {
    console.log("Starting speed test...");

    // Try fast-cli first with longer timeout
    try {
      const { stdout, stderr } = await execAsync("npx fast --json", {
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024,
      });

      if (stderr && stderr.trim()) {
        console.log(`Speed test stderr: ${stderr.trim()}`);
      }

      const cleanOutput = stdout.trim();
      const jsonStart = cleanOutput.indexOf("{");
      const jsonEnd = cleanOutput.lastIndexOf("}") + 1;

      if (jsonStart !== -1 && jsonEnd > 0) {
        const jsonString = cleanOutput.substring(jsonStart, jsonEnd);
        const result = JSON.parse(jsonString);

        const downloadMbps = result.downloadSpeed || null;
        const uploadMbps = null; // fast-cli doesn't provide upload speed
        const pingMs = result.latency || null;

        console.log(
          `Speed test results: ${downloadMbps} Mbps down, ${pingMs}ms ping`
        );

        return {
          download: downloadMbps,
          upload: uploadMbps,
          ping: pingMs,
        };
      }
    } catch (fastError) {
      console.log(`fast-cli failed: ${fastError.message}`);
    }

    // Fallback: Try multiple ping methods
    console.log("Using fallback ping test...");

    // Method 1: Try PowerShell Test-NetConnection (Windows)
    try {
      const { stdout } = await execAsync(
        'powershell -Command "try { $result = Test-NetConnection -ComputerName 8.8.8.8 -Port 53 -InformationLevel Quiet; if ($result) { Test-NetConnection -ComputerName 8.8.8.8 -Port 53 | Select-Object -ExpandProperty ResponseTime } else { $null } } catch { $null }"',
        {
          timeout: 10000,
        }
      );

      const pingMs = parseFloat(stdout.trim());
      if (!isNaN(pingMs) && pingMs > 0) {
        console.log(`PowerShell ping test: ${pingMs}ms`);
        return {
          download: null,
          upload: null,
          ping: pingMs,
        };
      }
    } catch (psError) {
      console.log(`PowerShell ping failed: ${psError.message}`);
    }

    // Method 2: Try standard ping command (cross-platform)
    try {
      const { stdout } = await execAsync("ping -n 1 8.8.8.8", {
        timeout: 10000,
      });

      // Parse ping output for response time
      const timeMatch = stdout.match(/time[<=](\d+)ms/i);
      if (timeMatch) {
        const pingMs = parseFloat(timeMatch[1]);
        console.log(`Standard ping test: ${pingMs}ms`);
        return {
          download: null,
          upload: null,
          ping: pingMs,
        };
      }
    } catch (pingError) {
      console.log(`Standard ping failed: ${pingError.message}`);
    }

    // Method 3: Try using the ping library as final fallback
    try {
      const ping = await import("ping");
      const res = await ping.default.promise.probe("8.8.8.8", { timeout: 3 });
      if (res.alive && res.time) {
        const pingMs = parseFloat(res.time);
        console.log(`Ping library test: ${pingMs}ms`);
        return {
          download: null,
          upload: null,
          ping: pingMs,
        };
      }
    } catch (pingLibError) {
      console.log(`Ping library failed: ${pingLibError.message}`);
    }

    console.log("All ping methods failed");
    return {
      download: null,
      upload: null,
      ping: null,
    };
  } catch (error) {
    console.log(`Speed test failed: ${error.message}`);
    console.log(`Error details: ${error.stack || "No stack trace available"}`);
    return { download: null, upload: null, ping: null };
  }
}

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

    // Fallback: Simple ping test only
    console.log("Using fallback ping test...");
    const { stdout } = await execAsync(
      'powershell "Test-NetConnection -ComputerName 8.8.8.8 -Port 53 | Select-Object -ExpandProperty ResponseTime"',
      {
        timeout: 10000,
      }
    );

    const pingMs = parseFloat(stdout.trim());

    console.log(`Fallback ping test: ${pingMs}ms`);

    return {
      download: null,
      upload: null,
      ping: isNaN(pingMs) ? null : pingMs,
    };
  } catch (error) {
    console.log(`Speed test failed: ${error.message}`);
    return { download: null, upload: null, ping: null };
  }
}

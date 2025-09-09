import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Returns Mbps + ping ms
export async function checkSpeed() {
  try {
    console.log("Starting speed test with fast-cli...");

    // Run fast-cli and parse output
    const { stdout } = await execAsync("fast --json");
    const result = JSON.parse(stdout);

    // fast-cli returns speeds in Mbps
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
  } catch (error) {
    console.log(`Speed test failed: ${error.message}`);
    return { download: null, upload: null, ping: null };
  }
}

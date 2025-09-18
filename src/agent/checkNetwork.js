import ping from "ping";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function checkNetwork(host = "8.8.8.8") {
  try {
    // Primary method: Use ping library
    const res = await ping.promise.probe(host, { timeout: 3 });
    if (res.alive && res.time) {
      return {
        alive: true,
        time: isFinite(Number(res.time)) ? Number(res.time) : null,
      };
    }
  } catch (pingError) {
    console.log(`Ping library failed: ${pingError.message}`);
  }

  // Fallback method: Try system ping command
  try {
    const { stdout } = await execAsync(`ping -n 1 ${host}`, {
      timeout: 5000,
    });

    // Check if ping was successful (look for "Reply from" or similar)
    const isAlive = /reply from|bytes from|time[<=]\d+ms/i.test(stdout);

    if (isAlive) {
      // Extract time from ping output
      const timeMatch = stdout.match(/time[<=](\d+)ms/i);
      const time = timeMatch ? parseFloat(timeMatch[1]) : null;

      return {
        alive: true,
        time: isFinite(time) ? time : null,
      };
    }
  } catch (execError) {
    console.log(`System ping command failed: ${execError.message}`);
  }

  // If all methods fail
  return { alive: false, time: null };
}

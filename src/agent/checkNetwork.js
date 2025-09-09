import ping from 'ping';

export async function checkNetwork(host = '8.8.8.8') {
  try {
    const res = await ping.promise.probe(host, { timeout: 3 });
    return {
      alive: !!res.alive,
      time: isFinite(Number(res.time)) ? Number(res.time) : null
    };
  } catch {
    return { alive: false, time: null };
  }
}

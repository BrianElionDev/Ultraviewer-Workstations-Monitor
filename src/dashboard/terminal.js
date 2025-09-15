import blessed from "blessed";
import { supabase } from "../db/supabase.js";

// Setup screen
const screen = blessed.screen();

// Table widget - using blessed table directly (no vulnerabilities)
const table = blessed.table({
  parent: screen,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  keys: true,
  fg: "white",
  selectedFg: "white",
  selectedBg: "blue",
  interactive: true,
  label: " Workstation Monitor ",
  border: { type: "line", fg: "cyan" },
  columnSpacing: 2,
  columnWidth: [15, 8, 12, 8, 10, 12, 15, 20], // adjust widths
});

// Initial empty data
let rows = [];
const headers = [
  "Host",
  "OS",
  "UV",
  "Online",
  "Ping",
  "Download",
  "Speed Test",
  "Updated",
];

// Render data into table
function renderTable() {
  // Use blessed table API directly (no vulnerabilities)
  const tableData = [headers, ...rows];
  table.setData(tableData);
  screen.render();
}

// Fetch latest snapshot
async function fetchAll() {
  const { data, error } = await supabase
    .from("workstations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Fetch error:", error.message);
    return;
  }

  rows = data.map((w) => [
    w.hostname || w.host_name || "Unknown",
    w.os || "Unknown",
    w.is_ultraviewer_on ? "ON" : "OFF",
    w.is_online ? "ON" : "OFF",
    w.ping_ms ? `${w.ping_ms}ms` : "-",
    w.download_mbps ? `${w.download_mbps}Mbps` : "-",
    w.speed_test_at ? new Date(w.speed_test_at).toLocaleTimeString() : "-",
    w.updated_at ? new Date(w.updated_at).toLocaleTimeString() : "-",
  ]);

  renderTable();
}

// Live subscription
supabase
  .channel("workstations-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "workstations" },
    (payload) => {
      const w = payload.new;
      // Update or add row
      const idx = rows.findIndex((r) => r[0] === (w.hostname || w.host_name));
      const row = [
        w.hostname || w.host_name || "Unknown",
        w.os || "Unknown",
        w.is_ultraviewer_on ? "ON" : "OFF",
        w.is_online ? "ON" : "OFF",
        w.ping_ms ? `${w.ping_ms}ms` : "-",
        w.download_mbps ? `${w.download_mbps}Mbps` : "-",
        w.speed_test_at ? new Date(w.speed_test_at).toLocaleTimeString() : "-",
        w.updated_at ? new Date(w.updated_at).toLocaleTimeString() : "-",
      ];
      if (idx >= 0) rows[idx] = row;
      else rows.push(row);

      renderTable();
    }
  )
  .subscribe();

// Quit on ESC, q, or Ctrl+C
screen.key(["escape", "q", "C-c"], () => process.exit(0));

// Run
(async function () {
  await fetchAll();
  renderTable();
})();

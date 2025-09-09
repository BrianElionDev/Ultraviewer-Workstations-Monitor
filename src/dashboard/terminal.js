import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { supabase } from '../db/supabase.js';

// Setup screen
const screen = blessed.screen();
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

// Table widget
const table = grid.set(0, 0, 12, 12, contrib.table, {
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  label: ' Workstation Monitor ',
  width: '100%',
  height: '100%',
  border: { type: 'line', fg: 'cyan' },
  columnSpacing: 2,
  columnWidth: [20, 12, 12, 10, 12, 12, 25] // adjust widths
});

// Initial empty data
let rows = [];

// Render data into table
function renderTable() {
  table.setData({
    headers: [
      'Host',
      'OS',
      'UltraViewer',
      'Online',
      'Ping (ms)',
      'Down (Mbps)',
      'Updated At'
    ],
    data: rows
  });
  screen.render();
}

// Fetch latest snapshot
async function fetchAll() {
  const { data, error } = await supabase
    .from('workstations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Fetch error:', error.message);
    return;
  }

  rows = data.map(w => [
    w.host_name,
    w.os,
    w.is_ultraviewer_on ? '✅' : '❌',
    w.is_online ? '🟢' : '🔴',
    w.ping_ms ?? '-',
    w.download_mbps ?? '-',
    new Date(w.updated_at).toLocaleTimeString()
  ]);

  renderTable();
}

// Live subscription
supabase
  .channel('workstations-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'workstations' },
    payload => {
      const w = payload.new;
      // Update or add row
      const idx = rows.findIndex(r => r[0] === w.host_name);
      const row = [
        w.hostname,
        w.os,
        w.is_ultraviewer_on ? '✅' : '❌',
        w.is_online ? '🟢' : '🔴',
        w.ping_ms ?? '-',
        w.download_mbps ?? '-',
        new Date(w.updated_at).toLocaleTimeString()
      ];
      if (idx >= 0) rows[idx] = row;
      else rows.push(row);

      renderTable();
    }
  )
  .subscribe();

// Quit on ESC, q, or Ctrl+C
screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

// Run
(async function () {
  await fetchAll();
  renderTable();
})();

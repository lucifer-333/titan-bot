/**
 * ==============================================================================
 * TITAN APEX v4.0 - ADVANCED EMBEDDED WEB CONTROL CENTER (src/modules/dashboard.js)
 * Standalone Zero-Dependency Local Web Panel with Real-Time Radar, Chat & Control HUD
 * URL: http://localhost:3000
 * ==============================================================================
 */

const http = require('http');

class WebDashboard {
  constructor(bots, config) {
    this.bots = bots;
    this.config = config;
    this.server = null;
    this.chatLog = [];
    this.maxChatHistory = 120;
    this.initChatListener();
  }

  initChatListener() {
    // Intercept chat events across all active bots
    setInterval(() => {
      this.bots.forEach(b => {
        if (!b._chatHooked) {
          b._chatHooked = true;
          b.on('chat', (sender, message) => {
            this.pushChat(sender, message, 'player');
          });
          b.on('messagestr', (msg) => {
            if (msg && !msg.startsWith('<') && !msg.includes('http')) {
              this.pushChat('Sistem', msg, 'system');
            }
          });
        }
      });
    }, 2000);
  }

  pushChat(sender, text, type = 'player') {
    const time = new Date().toLocaleTimeString('tr-TR');
    this.chatLog.push({ sender, text, type, time });
    if (this.chatLog.length > this.maxChatHistory) {
      this.chatLog.shift();
    }
  }

  start(port = 3000) {
    this.server = http.createServer((req, res) => {
      // 1. Live Telemetry API (Health, Food, Equipment, Coordinates, Entities)
      if (req.url === '/api/status') {
        const data = {
          owner: this.config.owner,
          server: this.config.host,
          timestamp: Date.now(),
          bots: this.bots.map(b => {
            const pos = b.entity ? b.entity.position.floored() : { x: 0, y: 0, z: 0 };
            const yaw = b.entity ? Math.round((b.entity.yaw * 180 / Math.PI) % 360) : 0;
            
            // Collect equipment
            const equipped = {
              helmet: b.inventory ? b.inventory.slots[5]?.name || 'Yok' : 'Yok',
              chestplate: b.inventory ? b.inventory.slots[6]?.name || 'Yok' : 'Yok',
              leggings: b.inventory ? b.inventory.slots[7]?.name || 'Yok' : 'Yok',
              boots: b.inventory ? b.inventory.slots[8]?.name || 'Yok' : 'Yok',
              mainhand: b.inventory ? b.inventory.slots[b.quickBarSlot + 36]?.name || 'Boş' : 'Boş',
              offhand: b.inventory ? b.inventory.slots[45]?.name || 'Boş' : 'Boş'
            };

            // Collect inventory items
            const inventoryItems = b.inventory ? b.inventory.items().map(i => ({
              name: i.name,
              count: i.count
            })) : [];

            return {
              username: b.username,
              health: Math.round(b.health || 20),
              food: Math.round(b.food || 20),
              oxygen: b.oxygenLevel,
              position: pos,
              yaw: yaw,
              equipped: equipped,
              inventory: inventoryItems
            };
          }),
          // Radar entity tracking
          radar: this.getRadarEntities()
        };

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
        return;
      }

      // 2. Chat Log API
      if (req.url === '/api/chat') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(this.chatLog));
        return;
      }

      // 3. Command & Chat Send API
      if (req.url.startsWith('/api/cmd?')) {
        const params = new URL(req.url, 'http://localhost').searchParams;
        const text = params.get('text');
        const asOwner = params.get('as') === 'owner';

        if (text && this.bots.length > 0) {
          if (asOwner) {
            // Emulate chat command from luciferdiyetm
            this.pushChat(this.config.owner, text, 'owner');
            this.bots.forEach(b => b.emit('chat', this.config.owner, text));
          } else {
            // Send direct chat message to server through first bot
            this.bots[0].chat(text);
            this.pushChat(this.bots[0].username, text, 'bot');
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, text }));
        return;
      }

      // 4. Standalone Full Web Application UI
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(this.renderHTML(port));
    });

    this.server.listen(port, () => {
      console.log(`[★] Canlı Web Paneli Başlatıldı: http://localhost:${port}`);
    });
  }

  getRadarEntities() {
    if (this.bots.length === 0 || !this.bots[0].entity) return [];
    const centerBot = this.bots[0];
    const centerPos = centerBot.entity.position;
    const entities = [];

    for (const id in centerBot.entities) {
      const e = centerBot.entities[id];
      if (!e || e === centerBot.entity) continue;
      const dist = Math.round(centerPos.distanceTo(e.position));
      if (dist > 35) continue;

      let type = 'neutral';
      if (e.type === 'player') {
        type = e.username === this.config.owner ? 'owner' : 'player';
      } else if (['zombie', 'skeleton', 'spider', 'creeper', 'drowned', 'enderman', 'witch', 'phantom'].includes(e.name)) {
        type = 'hostile';
      } else if (['cow', 'sheep', 'pig', 'chicken', 'horse', 'villager'].includes(e.name)) {
        type = 'passive';
      }

      entities.push({
        id: e.id,
        name: e.username || e.name,
        type: type,
        x: Math.round(e.position.x - centerPos.x),
        z: Math.round(e.position.z - centerPos.z),
        dist: dist
      });
    }
    return entities;
  }

  renderHTML(port) {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Apex v4.0 - Minecraft Bot Komuta & Canlı Radar Merkezi</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #131b2e;
      --card-border: #1e293b;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.35);
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand h1 { margin: 0; font-size: 22px; color: var(--accent); }
    .badge-status {
      background: #064e3b;
      color: #34d399;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: bold;
    }
    .layout-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    @media (max-width: 1024px) {
      .layout-grid { grid-template-columns: 1fr; }
    }
    .bot-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    .card-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .card-title h3 { margin: 0; font-size: 18px; color: #c084fc; }
    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 5px;
      color: var(--text-muted);
    }
    .stat-row strong { color: var(--text); }
    .meter-container {
      background: #0f172a;
      border-radius: 6px;
      height: 12px;
      overflow: hidden;
      margin-bottom: 12px;
      border: 1px solid #334155;
    }
    .meter-hp { background: linear-gradient(90deg, #ef4444, #f87171); height: 100%; transition: width 0.3s; }
    .meter-food { background: linear-gradient(90deg, #f59e0b, #fbbf24); height: 100%; transition: width 0.3s; }
    
    .gear-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      font-size: 11px;
      margin-top: 10px;
      background: #0b1120;
      padding: 10px;
      border-radius: 8px;
    }
    .gear-item { color: #cbd5e1; }
    .gear-item span { color: #64748b; display: block; font-size: 9px; text-transform: uppercase; }

    /* Hızlı Eylem Butonları */
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
      margin-top: 15px;
    }
    .btn-act {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-act:hover {
      background: var(--accent);
      color: #0f172a;
      border-color: var(--accent);
      box-shadow: 0 0 10px var(--accent-glow);
    }
    .btn-act.danger:hover {
      background: var(--danger);
      border-color: var(--danger);
      color: #fff;
    }

    /* Radar Canvas */
    .radar-box {
      text-align: center;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    #radarCanvas {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 50%;
      box-shadow: inset 0 0 20px rgba(56, 189, 248, 0.1);
    }

    /* Canlı Chat */
    .chat-panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      height: 480px;
    }
    .chat-history {
      flex: 1;
      overflow-y: auto;
      font-size: 12px;
      padding-right: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .chat-msg {
      background: #0b1120;
      padding: 6px 10px;
      border-radius: 6px;
      line-height: 1.4;
      word-break: break-word;
    }
    .chat-msg.owner { border-left: 3px solid #fbbf24; }
    .chat-msg.bot { border-left: 3px solid #38bdf8; }
    .chat-msg.system { border-left: 3px solid #94a3b8; color: #94a3b8; }
    .chat-msg .time { font-size: 10px; color: #64748b; margin-right: 6px; }
    .chat-msg .sender { font-weight: bold; color: #38bdf8; }

    .chat-controls {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .chat-input {
      flex: 1;
      background: #090d16;
      border: 1px solid #334155;
      color: #fff;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
    }
    .chat-input:focus { outline: none; border-color: var(--accent); }
    .btn-send {
      background: var(--accent);
      color: #090d16;
      border: none;
      padding: 0 18px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    .btn-send:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <h1>⚡ TITAN APEX v4.0</h1>
      <span class="badge-status">ONLINE (21 MOTOR)</span>
    </div>
    <div style="font-size: 13px; color: var(--text-muted);">
      Lider: <strong style="color: #fbbf24;">luciferdiyetm</strong> | Sunucu: <strong style="color: #38bdf8;">FAMILIA-adrC.aternos.me</strong>
    </div>
  </header>

  <div class="layout-grid">
    <!-- Sol Taraf: Bot Durumları ve Hızlı Komutlar -->
    <div>
      <div class="bot-cards" id="botCards"></div>

      <div class="card">
        <h3 style="margin-top:0; font-size:16px; color:var(--accent);">⚡ Hızlı Taktiksel Komut Paneli</h3>
        <div class="quick-actions">
          <button class="btn-act" onclick="quick('beni koru')">🛡️ Beni Koru</button>
          <button class="btn-act" onclick="quick('maden yap')">⛏️ Maden Kaz</button>
          <button class="btn-act" onclick="quick('odun kes')">🪓 Odun Kes</button>
          <button class="btn-act" onclick="quick('kasıl')">⚔️ Canavar Avla</button>
          <button class="btn-act" onclick="quick('hasat yap')">🌾 Tarla Hasat</button>
          <button class="btn-act" onclick="quick('balık tut')">🎣 Balık Tut</button>
          <button class="btn-act" onclick="quick('keşfe başla')">🗺️ Keşfe Çık</button>
          <button class="btn-act" onclick="quick('ticaret yap')">🤝 Köylü Takas</button>
          <button class="btn-act" onclick="quick('eşyaları at')">📦 Eşyaları Ver</button>
          <button class="btn-act" onclick="quick('ata bin')">🐎 Bineğe Bin</button>
          <button class="btn-act" onclick="quick('dans et')">💃 Dans Et</button>
          <button class="btn-act danger" onclick="quick('dur')">🛑 Hepsini Durdur</button>
        </div>
      </div>
    </div>

    <!-- Sağ Taraf: Canlı 2D Radar & Chat -->
    <div>
      <div class="radar-box">
        <h3 style="margin:0 0 10px 0; font-size:15px; color:#38bdf8;">📡 360° Canlı Radar (Yarıçap: 35m)</h3>
        <canvas id="radarCanvas" width="260" height="260"></canvas>
        <div style="font-size:11px; color:#94a3b8; margin-top:8px; display:flex; justify-content:center; gap:12px;">
          <span>🔵 Bot</span>
          <span>⭐ Lider</span>
          <span>🔴 Canavar</span>
          <span>🟢 Hayvan</span>
        </div>
      </div>

      <div class="chat-panel">
        <h3 style="margin:0 0 10px 0; font-size:15px; color:#c084fc;">💬 Canlı Sunucu Sohbeti & Komutlar</h3>
        <div class="chat-history" id="chatLogs"></div>
        <div class="chat-controls">
          <input type="text" id="chatInput" class="chat-input" placeholder="Lider olarak komut veya mesaj yaz..." onkeydown="if(event.key==='Enter') sendChat()">
          <button class="btn-send" onclick="sendChat()">Gönder</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('radarCanvas');
    const ctx = canvas.getContext('2d');

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        renderBots(data.bots);
        drawRadar(data.radar);
      } catch(_) {}
    }

    async function fetchChat() {
      try {
        const res = await fetch('/api/chat');
        const logs = await res.json();
        const box = document.getElementById('chatLogs');
        const shouldScroll = box.scrollTop + box.clientHeight >= box.scrollHeight - 20;

        box.innerHTML = logs.map(l => \`
          <div class="chat-msg \${l.type}">
            <span class="time">\${l.time}</span>
            <span class="sender">\${l.sender}:</span>
            <span>\${l.text}</span>
          </div>
        \`).join('');

        if (shouldScroll) box.scrollTop = box.scrollHeight;
      } catch(_) {}
    }

    function renderBots(bots) {
      const container = document.getElementById('botCards');
      container.innerHTML = bots.map(b => \`
        <div class="card">
          <div class="card-title">
            <h3>\${b.username}</h3>
            <span class="badge-status">HAZIR</span>
          </div>
          <div class="stat-row"><span>Can (HP):</span><strong>\${b.health} / 20 ❤️</strong></div>
          <div class="meter-container"><div class="meter-hp" style="width: \${(b.health/20)*100}%"></div></div>

          <div class="stat-row"><span>Açlık:</span><strong>\${b.food} / 20 🍗</strong></div>
          <div class="meter-container"><div class="meter-food" style="width: \${(b.food/20)*100}%"></div></div>

          <div class="stat-row"><span>Konum:</span><strong>X: \${b.position.x}, Y: \${b.position.y}, Z: \${b.position.z}</strong></div>
          <div class="stat-row"><span>Yön (Yaw):</span><strong>\${b.yaw}°</strong></div>

          <div class="gear-box">
            <div class="gear-item"><span>Başlık</span>\${b.equipped.helmet}</div>
            <div class="gear-item"><span>Zırh</span>\${b.equipped.chestplate}</div>
            <div class="gear-item"><span>Pantolon</span>\${b.equipped.leggings}</div>
            <div class="gear-item"><span>Bot</span>\${b.equipped.boots}</div>
            <div class="gear-item"><span>Ana El</span>\${b.equipped.mainhand}</div>
            <div class="gear-item"><span>Sol El</span>\${b.equipped.offhand}</div>
          </div>
        </div>
      \`).join('');
    }

    function drawRadar(entities) {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const scale = (w / 2) / 38; // 38 metre yarıçap

      ctx.clearRect(0, 0, w, h);

      // Radar halkaları
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      [10, 20, 30].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Merkez Bot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Varlıklar
      (entities || []).forEach(e => {
        const px = cx + e.x * scale;
        const py = cy + e.z * scale;

        ctx.beginPath();
        if (e.type === 'owner') {
          ctx.fillStyle = '#fbbf24';
          ctx.arc(px, py, 6, 0, Math.PI * 2);
        } else if (e.type === 'hostile') {
          ctx.fillStyle = '#ef4444';
          ctx.arc(px, py, 4, 0, Math.PI * 2);
        } else if (e.type === 'passive') {
          ctx.fillStyle = '#10b981';
          ctx.arc(px, py, 3, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.arc(px, py, 3, 0, Math.PI * 2);
        }
        ctx.fill();
      });
    }

    async function sendChat() {
      const input = document.getElementById('chatInput');
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      await fetch('/api/cmd?as=owner&text=' + encodeURIComponent(val));
      fetchChat();
    }

    async function quick(cmd) {
      await fetch('/api/cmd?as=owner&text=' + encodeURIComponent(cmd));
      fetchChat();
    }

    setInterval(fetchStatus, 1200);
    setInterval(fetchChat, 900);
    fetchStatus();
    fetchChat();
  </script>
</body>
</html>`;
  }
}

module.exports = WebDashboard;

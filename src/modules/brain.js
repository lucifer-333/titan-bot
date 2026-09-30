/**
 * ==============================================================================
 * DEEP EPISODIC MEMORY & AUTONOMOUS DECISION ENGINE (src/modules/brain.js)
 * Persistent JSON database, hostile kill lists, death chronicles, and tactical debriefs.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

class BrainEngine {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.memoryFilePath = path.join(__dirname, '../../data/memory.json');
    this.memory = {
      deaths: [],
      kills: [],
      enemyList: {}, // playerName -> { encounters, lastSeen, isHostile }
      discoveries: [],
      generalNotes: []
    };
    this.loadMemory();
  }

  loadMemory() {
    try {
      const dir = path.dirname(this.memoryFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (fs.existsSync(this.memoryFilePath)) {
        const raw = fs.readFileSync(this.memoryFilePath, 'utf8');
        this.memory = JSON.parse(raw);
      }
    } catch (_) {}
  }

  saveMemory() {
    try {
      fs.writeFileSync(this.memoryFilePath, JSON.stringify(this.memory, null, 2), 'utf8');
    } catch (_) {}
  }

  init() {
    // Record death events
    this.bot.on('death', () => {
      const pos = this.bot.entity ? this.bot.entity.position.floored() : { x: 0, y: 0, z: 0 };
      const deathEntry = {
        time: new Date().toLocaleString('tr-TR'),
        pos: [pos.x, pos.y, pos.z],
        reason: 'Savaş / Çevre Hasarı'
      };
      this.memory.deaths.push(deathEntry);
      this.saveMemory();
      console.log(`[Hafıza] Ölüm kaydedildi: [${pos.x}, ${pos.y}, ${pos.z}]`);
    });

    // Monitor entity encounters and recognize past foes
    this.bot.on('entitySpawn', (entity) => {
      if (entity.type === 'player' && entity.username && entity.username !== this.config.owner) {
        const u = entity.username.toLowerCase();
        if (this.memory.enemyList[u]?.isHostile) {
          this.bot.chat(`[${this.bot.username}] ⚠️ DİKKAT REİS! Bize daha önce saldıran düşman '${entity.username}' tespit edildi!`);
        }
      }
    });

    // Record hostile attacks from players
    this.bot.on('entityHurt', (entity) => {
      if (entity === this.bot.entity) {
        for (const id in this.bot.entities) {
          const e = this.bot.entities[id];
          if (e && e.type === 'player' && e.username !== this.config.owner) {
            const dist = this.bot.entity.position.distanceTo(e.position);
            if (dist <= 4.5) {
              const u = e.username.toLowerCase();
              this.memory.enemyList[u] = {
                encounters: (this.memory.enemyList[u]?.encounters || 0) + 1,
                lastSeen: new Date().toLocaleString('tr-TR'),
                isHostile: true
              };
              this.saveMemory();
              break;
            }
          }
        }
      }
    });
  }

  // Record a notable discovery
  recordDiscovery(type, details, pos) {
    this.memory.discoveries.push({
      type,
      details,
      pos: [Math.round(pos.x), Math.round(pos.y), Math.round(pos.z)],
      time: new Date().toLocaleString('tr-TR')
    });
    this.saveMemory();
  }

  // Provide situational debrief
  getDebrief() {
    const deathCount = this.memory.deaths.length;
    const lastDeath = deathCount > 0 ? this.memory.deaths[deathCount - 1] : null;
    const enemyCount = Object.keys(this.memory.enemyList).length;

    let msg = `Hafıza Durumu: Toplam Ölüm: ${deathCount}`;
    if (lastDeath) {
      msg += ` (Son: [${lastDeath.pos.join(', ')}])`;
    }
    msg += ` | Kayıtlı Düşman Sayısı: ${enemyCount}`;
    return msg;
  }
}

module.exports = BrainEngine;

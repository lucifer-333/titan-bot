/**
 * ==============================================================================
 * DYNAMIC ENVIRONMENTAL MAPPING & EXPLORATION ENGINE (src/modules/explorer.js)
 * Autonomous reconnaissance, biome sensing, POI discovery (villages, caves, ravines).
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class ExplorerEngine {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.isExploring = false;
    this.exploreTimer = null;
    this.pointsOfInterest = new Map(); // name -> { type, pos, timestamp }
    this.visitedChunks = new Set();
    this.currentCenter = null;
    this.exploreRadius = 96;
    this.stepAngle = 0;
  }

  init() {
    // Periodic POI scanner (runs every 4 seconds)
    setInterval(() => {
      if (this.bot.entity) {
        this.scanEnvironment();
      }
    }, 4000);
  }

  scanEnvironment() {
    if (!this.bot.entity) return;
    const currentPos = this.bot.entity.position.floored();

    // 1. Village Marker Detection (Bells, Crafting Stations, Villagers)
    const villageBlock = this.bot.findBlock({
      matching: (b) => b && (b.name === 'bell' || b.name === 'composter' || b.name === 'lectern' || b.name === 'blast_furnace' || b.name === 'cartography_table'),
      maxDistance: 32
    });

    const nearbyVillager = Object.values(this.bot.entities).find(e => 
      e && e.name === 'villager' && e.position && this.bot.entity && this.bot.entity.position && 
      this.bot.entity.position.distanceTo(e.position) <= 32
    );

    if ((villageBlock || nearbyVillager) && !this.pointsOfInterest.has('köy')) {
      const pos = villageBlock ? villageBlock.position : nearbyVillager.position.floored();
      this.pointsOfInterest.set('köy', { type: 'Köy / Yerleşim', pos, timestamp: Date.now() });
      this.bot.chat(`[${this.bot.username}] 🏘️ Yeni bir köy/yerleşim keşfedildi! Konum: [${pos.x}, ${pos.y}, ${pos.z}]`);
    }

    // 2. Cave & Ravine Mouth Detection (Dark underground drops with air)
    const caveAirBlock = this.bot.findBlock({
      matching: (b) => {
        if (!b || !b.position) return false;
        // Deep drops below surface with low light
        return b.name === 'cave_air' || (b.name === 'air' && typeof b.position.y === 'number' && b.position.y < 50 && b.light <= 3);
      },
      maxDistance: 24
    });

    if (caveAirBlock && caveAirBlock.position && !this.pointsOfInterest.has('mağara')) {
      const pos = caveAirBlock.position;
      this.pointsOfInterest.set('mağara', { type: 'Mağara Girişi', pos, timestamp: Date.now() });
      this.bot.chat(`[${this.bot.username}] 🕳️ Mağara/Maden yarığı tespit edildi: [${pos.x}, ${pos.y}, ${pos.z}]`);
    }

    // 3. Nether Portal / Obsidian Structure Detection
    const portalBlock = this.bot.findBlock({
      matching: (b) => b && (b.name === 'nether_portal' || b.name === 'crying_obsidian' || b.name === 'respawn_anchor'),
      maxDistance: 28
    });

    if (portalBlock && portalBlock.position && !this.pointsOfInterest.has('portal')) {
      const pos = portalBlock.position;
      this.pointsOfInterest.set('portal', { type: 'Portal / Kadim Yapı', pos, timestamp: Date.now() });
      this.bot.chat(`[${this.bot.username}] 🔮 Gizemli portal kalıntısı bulundu! Konum: [${pos.x}, ${pos.y}, ${pos.z}]`);
    }
  }

  startExploration(radius = 96) {
    if (this.isExploring) {
      this.bot.chat(`[${this.bot.username}] Keşif görevi zaten devam ediyor.`);
      return;
    }

    this.isExploring = true;
    this.exploreRadius = radius;
    this.currentCenter = this.bot.entity.position.clone();
    this.stepAngle = 0;
    this.bot.chat(`[${this.bot.username}] 🗺️ Keşif protokolü başlatıldı! Yarıçap: ${radius} blok.`);

    this.moveToNextScoutPoint();
  }

  async moveToNextScoutPoint() {
    if (!this.isExploring || !this.currentCenter) return;

    // Archimedean spiral waypoint generator for full coverage without redundant looping
    this.stepAngle += 0.85;
    const currentDist = Math.min(this.exploreRadius, 15 + (this.stepAngle * 4));
    
    const targetX = Math.round(this.currentCenter.x + Math.cos(this.stepAngle) * currentDist);
    const targetZ = Math.round(this.currentCenter.z + Math.sin(this.stepAngle) * currentDist);
    const targetY = Math.round(this.bot.entity.position.y);

    try {
      this.bot.pathfinder.setGoal(new goals.GoalNearXZ(targetX, targetZ, 4));
      
      // Wait for goal reached or timeout
      const checkArrival = setInterval(() => {
        if (!this.isExploring) {
          clearInterval(checkArrival);
          return;
        }

        const dist = Math.hypot(this.bot.entity.position.x - targetX, this.bot.entity.position.z - targetZ);
        if (dist <= 5) {
          clearInterval(checkArrival);
          setTimeout(() => this.moveToNextScoutPoint(), 1500);
        }
      }, 1000);

      // Force-advance if stuck
      setTimeout(() => {
        if (this.isExploring) {
          clearInterval(checkArrival);
          this.moveToNextScoutPoint();
        }
      }, 25000);

    } catch (err) {
      console.log(`[!] Keşif noktası hatası:`, err.message);
      setTimeout(() => this.moveToNextScoutPoint(), 2000);
    }
  }

  stopExploration() {
    this.isExploring = false;
    if (this.bot.pathfinder) {
      this.bot.pathfinder.setGoal(null);
    }
    this.bot.chat(`[${this.bot.username}] Keşif görevi durduruldu. Toplam keşfedilen bölge sayısı: ${this.pointsOfInterest.size}`);
  }

  listDiscoveredPOIs() {
    if (this.pointsOfInterest.size === 0) {
      this.bot.chat(`[${this.bot.username}] Henüz keşfedilmiş özel bir yapı (köy, mağara, portal) yok.`);
      return;
    }

    const entries = [];
    for (const [key, val] of this.pointsOfInterest.entries()) {
      entries.push(`${val.type} -> [${val.pos.x}, ${val.pos.y}, ${val.pos.z}]`);
    }
    this.bot.chat(`[${this.bot.username}] Keşif Raporu:\n` + entries.join('\n'));
  }
}

module.exports = ExplorerEngine;

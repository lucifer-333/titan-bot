/**
 * Tactical Military Formation & Escort Engine for Mineflayer
 * Dynamic real-time escort positioning around luciferdiyetm (Left Flank, Right Flank, Vanguard, Rear Guard).
 * Smooth GoalFollow tracking, auto-sprint, obstacle clearing, and anti-lost telemetry.
 */
const { goals } = require('mineflayer-pathfinder');

class FormationEngine {
  constructor(bot, id, config) {
    this.bot = bot;
    this.id = id;
    this.config = config;
    this.isFormed = false;
    this.formationInterval = null;
    this.lastTpaRequestTime = 0;
  }

  // Calculate tactical offset based on bot index
  // Bot 1: Left flank (-2.5 X)
  // Bot 2: Right flank (+2.5 X)
  // Bot 3: Vanguard (+2.5 Z)
  // Bot 4: Rear Guard (-2.5 Z)
  getTacticalOffset() {
    switch (this.id) {
      case 1: return { x: -2.2, z: -1.0 };
      case 2: return { x: 2.2, z: -1.0 };
      case 3: return { x: 0, z: 2.5 };
      default: return { x: 0, z: -2.5 };
    }
  }

  startEscort() {
    this.isFormed = true;
    const roleName = this.id === 1 ? 'Sol Muhafız' : 'Sağ Muhafız';
    this.bot.chat(`[${this.bot.username}] 🛡️ ${roleName} göreve başladı! Gölgen gibi yanındayım reis.`);

    if (this.formationInterval) clearInterval(this.formationInterval);

    // Initial check
    this.updateEscortGoal();

    // High-performance continuous escort loop
    this.formationInterval = setInterval(() => {
      if (!this.isFormed) {
        clearInterval(this.formationInterval);
        return;
      }
      this.updateEscortGoal();
    }, 1000);
  }

  updateEscortGoal() {
    if (!this.bot.entity || !this.bot.entity.position) return;

    const ownerPlayer = this.bot.players[this.config.owner];
    const owner = ownerPlayer?.entity;

    // If owner is not in render distance (far away)
    if (!owner || !owner.position) {
      const now = Date.now();
      if (now - this.lastTpaRequestTime > 15000) {
        this.lastTpaRequestTime = now;
        this.bot.chat(`[${this.bot.username}] Reis seni göremiyorum! Yanına gelmek için TPA atıyorum...`);
        this.bot.chat(`/tpa ${this.config.owner}`);
      }
      return;
    }

    const dist = this.bot.entity.position.distanceTo(owner.position);

    // Sprint if owner is far
    if (dist > 7) {
      this.bot.setControlState('sprint', true);
    } else {
      this.bot.setControlState('sprint', false);
    }

    // Set goal to stay closely around owner
    const offset = this.getTacticalOffset();
    const targetX = owner.position.x + offset.x;
    const targetY = owner.position.y;
    const targetZ = owner.position.z + offset.z;

    const distToSlot = this.bot.entity.position.distanceTo({ x: targetX, y: targetY, z: targetZ });

    if (distToSlot > 1.8) {
      this.bot.pathfinder.setGoal(new goals.GoalNear(targetX, targetY, targetZ, 1.2));
    }
  }

  disband() {
    this.isFormed = false;
    if (this.formationInterval) clearInterval(this.formationInterval);
    this.formationInterval = null;
    this.bot.pathfinder.setGoal(null);
    this.bot.setControlState('sprint', false);
  }
}

module.exports = FormationEngine;

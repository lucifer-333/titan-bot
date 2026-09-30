/**
 * Tactical Military Formation Engine for Mineflayer
 * Dynamic escort positioning around luciferdiyetm (Left Flank, Right Flank, Vanguard, Rear Guard).
 */
const { goals } = require('mineflayer-pathfinder');

class FormationEngine {
  constructor(bot, id, config) {
    this.bot = bot;
    this.id = id;
    this.config = config;
    this.isFormed = false;
    this.formationInterval = null;
  }

  // Calculate tactical offset based on bot index
  // Bot 1: Left flank (-2.5 X)
  // Bot 2: Right flank (+2.5 X)
  // Bot 3: Vanguard (+2.5 Z)
  // Bot 4: Rear Guard (-2.5 Z)
  getTacticalOffset() {
    switch (this.id) {
      case 1: return { x: -2.5, z: 0 };
      case 2: return { x: 2.5, z: 0 };
      case 3: return { x: 0, z: 2.5 };
      default: return { x: 0, z: -2.5 };
    }
  }

  startEscort() {
    this.isFormed = true;
    const offset = this.getTacticalOffset();
    const roleName = this.id === 1 ? 'Sol Muhafız' : 'Sağ Muhafız';
    this.bot.chat(`[${this.bot.username}] ${roleName} eskort pozisyonuna geçtim!`);

    if (this.formationInterval) clearInterval(this.formationInterval);
    this.formationInterval = setInterval(() => {
      if (!this.isFormed) {
        clearInterval(this.formationInterval);
        return;
      }

      const owner = this.bot.players[this.config.owner]?.entity;
      if (!owner) return;

      const targetX = owner.position.x + offset.x;
      const targetY = owner.position.y;
      const targetZ = owner.position.z + offset.z;

      const currentDist = this.bot.entity.position.distanceTo({ x: targetX, y: targetY, z: targetZ });
      if (currentDist > 2) {
        this.bot.pathfinder.setGoal(new goals.GoalNear(targetX, targetY, targetZ, 1.5));
      }
    }, 1200);
  }

  disband() {
    this.isFormed = false;
    if (this.formationInterval) clearInterval(this.formationInterval);
    this.formationInterval = null;
    this.bot.pathfinder.setGoal(null);
  }
}

module.exports = FormationEngine;

/**
 * GPS Waypoint & Spatial Navigation Engine for Mineflayer
 * Saves bases, points of interest, and guides the bot home across long distances.
 */
const { goals } = require('mineflayer-pathfinder');

class PathRecorderEngine {
  constructor(bot) {
    this.bot = bot;
    this.waypoints = new Map();
  }

  saveWaypoint(name, pos = null) {
    const targetPos = pos || this.bot.entity.position.floored();
    this.waypoints.set(name.toLowerCase(), targetPos);
    this.bot.chat(`[${this.bot.username}] '${name}' konumu kaydedildi: [${targetPos.x}, ${targetPos.y}, ${targetPos.z}]`);
  }

  async gotoWaypoint(name) {
    const pos = this.waypoints.get(name.toLowerCase());
    if (!pos) {
      this.bot.chat(`[${this.bot.username}] '${name}' adında kayıtlı bir konum bulamadım reis.`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] '${name}' konumuna doğru intikal ediyorum...`);
    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
      this.bot.chat(`[${this.bot.username}] '${name}' konumuna ulaştım reis!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Oraya ulaşamadım: ${err.message}`);
    }
  }

  listWaypoints() {
    if (this.waypoints.size === 0) {
      this.bot.chat(`[${this.bot.username}] Henüz kayıtlı konum yok reis.`);
      return;
    }
    const list = Array.from(this.waypoints.keys()).join(', ');
    this.bot.chat(`[${this.bot.username}] Kayıtlı noktalar: [${list}]`);
  }
}

module.exports = PathRecorderEngine;

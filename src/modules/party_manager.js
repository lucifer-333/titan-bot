/**
 * ==============================================================================
 * PARTY & SQUAD TACTICAL COORDINATION ENGINE (src/modules/party_manager.js)
 * Squad formation, hierarchy management, multi-bot priority command dispatching.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class PartyManagerEngine {
  constructor(bot, id, config) {
    this.bot = bot;
    this.id = id;
    this.config = config;
    this.partyLeader = config.owner;
    this.isInParty = true;
    this.currentStance = 'escort'; // 'escort', 'defend_area', 'assault', 'passive'
    this.squadMembers = [];
    this.anchorPosition = null;
  }

  setStance(stance, pos = null) {
    this.currentStance = stance;
    this.anchorPosition = pos || this.bot.entity.position.clone();

    switch (stance) {
      case 'defend_area':
        this.bot.chat(`[${this.bot.username}] 🛡️ Savunma pozisyonu alındı! Bölgeye giren tüm tehditler elenecektir.`);
        break;
      case 'assault':
        this.bot.chat(`[${this.bot.username}] ⚔️ Taarruz modu aktif! Liderin gösterdiği hedefe odaklanıldı.`);
        break;
      case 'escort':
        this.bot.chat(`[${this.bot.username}] 🎖️ Lider ${this.partyLeader} eskort formasyonundayım.`);
        break;
      default:
        this.bot.chat(`[${this.bot.username}] Pasif bekleme pozisyonuna geçildi.`);
    }
  }

  // Defend an anchor position against any incoming hostile mobs or players
  scanAndDefendAnchor(radius = 16) {
    if (this.currentStance !== 'defend_area' || !this.anchorPosition) return;

    for (const id in this.bot.entities) {
      const e = this.bot.entities[id];
      if (!e || e === this.bot.entity) continue;
      if (e.username === this.config.owner || (e.username && e.username.startsWith(this.config.baseName))) continue;

      const dist = this.anchorPosition.distanceTo(e.position);
      if (dist <= radius) {
        // Engage immediately
        if (this.bot.pvp && (!this.bot.pvp.target || !this.bot.pvp.target.isValid)) {
          this.bot.pvp.attack(e);
          break;
        }
      }
    }
  }

  // Supply transfer: toss requested items to party members or leader
  async supplyItem(itemName, count = 16) {
    const leaderEntity = this.bot.players[this.partyLeader]?.entity;
    if (!leaderEntity) {
      this.bot.chat(`[${this.bot.username}] Parti lideri görünürde yok.`);
      return;
    }

    const item = this.bot.inventory.items().find(i => i.name.includes(itemName));
    if (!item) {
      this.bot.chat(`[${this.bot.username}] İstenilen '${itemName}' envanterimde bulunamadı.`);
      return;
    }

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(leaderEntity.position.x, leaderEntity.position.y, leaderEntity.position.z, 2));
      await this.bot.toss(item.type, null, Math.min(item.count, count));
      this.bot.chat(`[${this.bot.username}] 🎁 ${Math.min(item.count, count)}x ${item.name} lidere teslim edildi!`);
    } catch (_) {}
  }
}

module.exports = PartyManagerEngine;

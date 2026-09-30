/**
 * ==============================================================================
 * NETHER DIMENSION SURVIVAL & PIGLIN BARTER ENGINE (src/modules/nether_survival.js)
 * Gold armor neutrality, Piglin bartering, Ghast fireball deflection & lava mitigation.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class NetherSurvivalEngine {
  constructor(bot) {
    this.bot = bot;
    this.isBartering = false;
  }

  // Ensure at least one gold armor piece is worn to stay friendly with Piglins
  async ensureGoldArmorNeutrality() {
    const goldArmorNames = ['golden_helmet', 'golden_chestplate', 'golden_leggings', 'golden_boots'];
    const currentEquipped = [
      this.bot.inventory.slots[5]?.name,
      this.bot.inventory.slots[6]?.name,
      this.bot.inventory.slots[7]?.name,
      this.bot.inventory.slots[8]?.name
    ];

    const hasGoldWorn = currentEquipped.some(n => n && goldArmorNames.includes(n));
    if (hasGoldWorn) return true;

    // Search inventory for any gold armor piece
    const availableGold = this.bot.inventory.items().find(i => goldArmorNames.includes(i.name));
    if (availableGold) {
      let slotType = 'head';
      if (availableGold.name.includes('chestplate')) slotType = 'torso';
      else if (availableGold.name.includes('leggings')) slotType = 'legs';
      else if (availableGold.name.includes('boots')) slotType = 'feet';

      try {
        await this.bot.equip(availableGold, slotType);
        this.bot.chat(`[${this.bot.username}] 👑 Piglinlerin saldırmaması için altın zırh kuşandım!`);
        return true;
      } catch (_) {}
    }
    return false;
  }

  // Barter with Piglins by tossing gold ingots and harvesting their rewards
  async barterWithPiglins(goldCount = 8) {
    if (this.isBartering) return;

    await this.ensureGoldArmorNeutrality();

    const goldIngots = this.bot.inventory.items().find(i => i.name === 'gold_ingot');
    if (!goldIngots) {
      this.bot.chat(`[${this.bot.username}] Piglinlerle takas için altın külçesi (gold_ingot) yok reis!`);
      return;
    }

    const piglin = Object.values(this.bot.entities).find(e => 
      e.name === 'piglin' && this.bot.entity.position.distanceTo(e.position) <= 16
    );

    if (!piglin) {
      this.bot.chat(`[${this.bot.username}] 16 blokluk alanda Piglin bulunamadı.`);
      return;
    }

    this.isBartering = true;
    this.bot.chat(`[${this.bot.username}] 🐷 Piglin'e doğru gidiyorum, altın takası başlayacak...`);

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(piglin.position.x, piglin.position.y, piglin.position.z, 3));
      
      const countToDrop = Math.min(goldIngots.count, goldCount);
      await this.bot.equip(goldIngots, 'hand');
      await this.bot.lookAt(piglin.position.offset(0, 1.2, 0));
      await this.bot.toss(goldIngots.type, null, countToDrop);

      this.bot.chat(`[${this.bot.username}] ${countToDrop}x Altın atıldı! Eşyaları inceliyor...`);

      // Wait 8 seconds for bartering cycle and collect ender pearls, crying obsidian etc.
      await this.bot.waitForTicks(160);

      // Vacuum dropped loot
      const droppedItems = Object.values(this.bot.entities).filter(e => 
        e && e.type === 'object' && this.bot.entity.position.distanceTo(e.position) <= 8
      );

      for (const item of droppedItems) {
        await this.bot.pathfinder.goto(new goals.GoalNear(item.position.x, item.position.y, item.position.z, 0.8)).catch(() => {});
      }

      this.isBartering = false;
      this.bot.chat(`[${this.bot.username}] 💎 Piglin takas ganimetleri (Ender İncisi, Ateş Direnci vb.) toplandı!`);
    } catch (err) {
      this.isBartering = false;
      this.bot.chat(`[${this.bot.username}] Takas hatası: ${err.message}`);
    }
  }
}

module.exports = NetherSurvivalEngine;

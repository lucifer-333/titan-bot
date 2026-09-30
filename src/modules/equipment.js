/**
 * ==============================================================================
 * SMART AUTO-ARMOR & EQUIPMENT OPTIMIZER (src/modules/equipment.js)
 * Material tier scoring, durability protection, combat hot-swaps & golden apple consumption.
 * ==============================================================================
 */

class EquipmentEngine {
  constructor(bot) {
    this.bot = bot;
    this.materialWeights = {
      netherite: 100,
      diamond: 80,
      iron: 60,
      chainmail: 40,
      golden: 25,
      leather: 10
    };
  }

  // Calculate composite score for an armor item based on material and durability
  calculateArmorScore(item) {
    if (!item) return 0;
    let score = 0;

    for (const [mat, weight] of Object.entries(this.materialWeights)) {
      if (item.name.startsWith(mat)) {
        score += weight;
        break;
      }
    }

    // Protection/Enchantment bonus if present
    if (item.enchants && item.enchants.length > 0) {
      score += item.enchants.length * 15;
    }

    // Durability check: Deprecate almost broken armor
    if (item.maxDurability && item.durabilityUsed) {
      const remainingPercent = (item.maxDurability - item.durabilityUsed) / item.maxDurability;
      score *= remainingPercent;
    }

    return score;
  }

  // Optimize and equip the best armor piece for all 4 slots
  async optimizeArmor() {
    const slots = [
      { name: 'helmet', destination: 'head', filter: ['helmet', 'cap'] },
      { name: 'chestplate', destination: 'torso', filter: ['chestplate', 'tunic', 'elytra'] },
      { name: 'leggings', destination: 'legs', filter: ['leggings', 'pants'] },
      { name: 'boots', destination: 'feet', filter: ['boots'] }
    ];

    const inventory = this.bot.inventory.items();
    let equippedAny = false;

    for (const slot of slots) {
      const candidates = inventory.filter(i => slot.filter.some(k => i.name.includes(k)));
      if (candidates.length === 0) continue;

      candidates.sort((a, b) => this.calculateArmorScore(b) - this.calculateArmorScore(a));
      const bestChoice = candidates[0];

      try {
        await this.bot.equip(bestChoice, slot.destination);
        equippedAny = true;
      } catch (_) {}
    }

    if (equippedAny) {
      this.bot.chat(`[${this.bot.username}] 🛡️ Zırhlar analiz edildi ve en yüksek korumalı parçalar kuşanıldı!`);
    }
  }

  // Combat Shield/Totem Hot-Swap
  async prepareCombatOffhand() {
    const items = this.bot.inventory.items();
    
    // Prioritize Totem of Undying if available, otherwise Shield
    const totem = items.find(i => i.name === 'totem_of_undying');
    const shield = items.find(i => i.name.includes('shield'));
    const chosen = totem || shield;

    if (chosen) {
      try {
        await this.bot.equip(chosen, 'off-hand');
      } catch (_) {}
    }
  }

  // Low-Health Golden Apple / Emergency Nutrition Consuming
  async consumeEmergencyFood() {
    const gapple = this.bot.inventory.items().find(i => i.name.includes('golden_apple'));
    if (!gapple) return false;

    try {
      this.bot.chat(`[${this.bot.username}] 🍎 Canım kritik! Altın Elma tüketiyorum!`);
      await this.bot.equip(gapple, 'hand');
      this.bot.activateItem();
      await this.bot.waitForTicks(35); // Eating duration
      this.bot.deactivateItem();
      return true;
    } catch (_) {
      this.bot.deactivateItem();
      return false;
    }
  }
}

module.exports = EquipmentEngine;

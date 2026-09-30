/**
 * ==============================================================================
 * ALCHEMY & AUTOMATED BREWING STAND ENGINE (src/modules/alchemy.js)
 * Autonomous potion brewing (Speed, Strength, Healing, Invisibility) and combat buffs.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class AlchemyEngine {
  constructor(bot) {
    this.bot = bot;
    this.isBrewing = false;
  }

  // Potion recipes: Ingredient sequence starting from water bottle
  getPotionRecipe(type) {
    switch (type.toLowerCase()) {
      case 'hız':
      case 'speed':
        return ['nether_wart', 'sugar', 'redstone'];
      case 'güç':
      case 'strength':
        return ['nether_wart', 'blaze_powder', 'redstone'];
      case 'iyileşme':
      case 'healing':
        return ['nether_wart', 'glistering_melon_slice', 'glowstone_dust'];
      case 'görünmezlik':
      case 'invisibility':
        return ['nether_wart', 'golden_carrot', 'fermented_spider_eye'];
      default:
        return ['nether_wart', 'sugar'];
    }
  }

  async brewPotion(potionType = 'hız') {
    if (this.isBrewing) return;

    const standBlock = this.bot.findBlock({
      matching: (b) => b && b.name === 'brewing_stand',
      maxDistance: 16
    });

    if (!standBlock) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda iksir masası (brewing stand) bulunamadı!`);
      return;
    }

    const recipe = this.getPotionRecipe(potionType);
    const blazePowder = this.bot.inventory.items().find(i => i.name === 'blaze_powder');
    const waterBottles = this.bot.inventory.items().filter(i => i.name === 'potion');

    if (!blazePowder) {
      this.bot.chat(`[${this.bot.username}] İksir masasını ısıtmak için Blaze Tozu (blaze_powder) eksik!`);
      return;
    }

    this.isBrewing = true;
    this.bot.chat(`[${this.bot.username}] 🧪 '${potionType}' iksiri için demleme işlemi başlatılıyor...`);

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(standBlock.position.x, standBlock.position.y, standBlock.position.z, 2));
      const stand = await this.bot.openBrewingStand(standBlock);

      // 1. Put Blaze Powder fuel if needed (slot 4 in brewing stand)
      if (stand.fuelLevel < 10) {
        await stand.putFuel(blazePowder.type, null, 1);
      }

      // 2. Put water bottles in bottle slots (slots 0, 1, 2)
      for (let i = 0; i < Math.min(waterBottles.length, 3); i++) {
        await stand.putBottle(i, waterBottles[i].type, null);
      }

      // 3. Sequential ingredient processing
      for (const ingredientName of recipe) {
        const ingredient = this.bot.inventory.items().find(i => i.name === ingredientName);
        if (!ingredient) {
          this.bot.chat(`[${this.bot.username}] Reçete için '${ingredientName}' eksik!`);
          break;
        }

        this.bot.chat(`[${this.bot.username}] '${ingredientName}' hazneye eklendi, kaynıyor...`);
        await stand.putIngredient(ingredient.type, null, 1);

        // Wait for brewing cycle (~20 seconds)
        await this.bot.waitForTicks(420);
      }

      // 4. Retrieve finished potions
      for (let i = 0; i < 3; i++) {
        if (stand.getBottle(i)) {
          await stand.takeBottle(i);
        }
      }

      stand.close();
      this.isBrewing = false;
      this.bot.chat(`[${this.bot.username}] ✨ İksirler başarıyla demlendi ve çantaya alındı!`);
    } catch (err) {
      this.isBrewing = false;
      this.bot.chat(`[${this.bot.username}] İksir demleme hatası: ${err.message}`);
    }
  }

  // Pre-battle combat buffing
  async drinkCombatPotions() {
    const combatPotions = this.bot.inventory.items().filter(i => 
      i.name === 'potion' && (i.name.includes('speed') || i.name.includes('strength') || i.name.includes('regen'))
    );

    if (combatPotions.length === 0) return;

    this.bot.chat(`[${this.bot.username}] ⚡ Savaş iksiri tüketiliyor!`);
    for (const pot of combatPotions) {
      try {
        await this.bot.equip(pot, 'hand');
        this.bot.activateItem();
        await this.bot.waitForTicks(35);
        this.bot.deactivateItem();
      } catch (_) {}
    }
  }
}

module.exports = AlchemyEngine;

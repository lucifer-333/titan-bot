/**
 * Automated Agriculture & Farming Engine for Mineflayer
 * Harvests mature crops (wheat, carrot, potato, beetroot) and auto-replants.
 */
const { goals } = require('mineflayer-pathfinder');

class FarmingEngine {
  constructor(bot) {
    this.bot = bot;
    this.isFarming = false;
    this.cropAges = {
      wheat: 7,
      carrots: 7,
      potatoes: 7,
      beetroots: 3
    };
  }

  isMature(block) {
    if (!block) return false;
    const maxAge = this.cropAges[block.name];
    if (maxAge === undefined) return false;
    return block.metadata === maxAge;
  }

  async harvestAndReplant() {
    this.isFarming = true;
    const matureBlocks = this.bot.findBlocks({
      matching: (b) => this.isMature(b),
      maxDistance: 24,
      count: 15
    });

    if (matureBlocks.length === 0) {
      this.bot.chat(`[${this.bot.username}] Etrafta olgunlaşmış ekin bulamadım reis.`);
      this.isFarming = false;
      return;
    }

    this.bot.chat(`[${this.bot.username}] ${matureBlocks.length} adet olgun ekin hasat ediliyor...`);

    for (const pos of matureBlocks) {
      if (!this.isFarming) break;
      const block = this.bot.blockAt(pos);
      if (!block) continue;
      const cropName = block.name;

      try {
        await this.bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
        await this.bot.dig(block);

        // Replant appropriate seed
        let seedName = null;
        if (cropName === 'wheat') seedName = 'wheat_seeds';
        else if (cropName === 'carrots') seedName = 'carrot';
        else if (cropName === 'potatoes') seedName = 'potato';
        else if (cropName === 'beetroots') seedName = 'beetroot_seeds';

        if (seedName) {
          const seed = this.bot.inventory.items().find(i => i.name === seedName);
          const farmland = this.bot.blockAt(pos.offset(0, -1, 0));
          if (seed && farmland && farmland.name === 'farmland') {
            await this.bot.equip(seed, 'hand');
            await this.bot.placeBlock(farmland, { x: 0, y: 1, z: 0 }).catch(() => {});
          }
        }
      } catch (err) {}
    }

    this.isFarming = false;
    this.bot.chat(`[${this.bot.username}] Hasat tamamlandı ve tekrar ekildi!`);
  }

  stop() {
    this.isFarming = false;
  }
}

module.exports = FarmingEngine;

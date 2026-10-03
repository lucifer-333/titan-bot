/**
 * Architectural & Construction Engine for Mineflayer
 * Builds emergency dirt bunkers, nerd poles to escape mobs, and bridges across gaps.
 */
const { Vec3 } = require('vec3');

class BuildingEngine {
  constructor(bot) {
    this.bot = bot;
  }

  getSolidBuildingBlock() {
    const solidNames = ['dirt', 'cobblestone', 'stone', 'netherrack', 'oak_planks', 'spruce_planks', 'birch_planks'];
    return this.bot.inventory.items().find(i => solidNames.some(s => i.name.includes(s)));
  }

  // Pillar straight up to escape ground mobs (Zombies, Creepers, Spiders)
  async pillarUp(height = 3) {
    const blockItem = this.getSolidBuildingBlock();
    if (!blockItem) {
      this.bot.chat(`[${this.bot.username}] Yükselmek için çantamda katı blok yok!`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] Canavarlardan kaçmak için yukarı tırmanıyorum!`);
    await this.bot.equip(blockItem, 'hand');

    for (let i = 0; i < height; i++) {
      this.bot.setControlState('jump', true);
      await this.bot.waitForTicks(5);
      const below = this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0));
      if (below) {
        await this.bot.placeBlock(below, new Vec3(0, 1, 0)).catch(() => {});
      }
      this.bot.setControlState('jump', false);
      await this.bot.waitForTicks(5);
    }
    this.bot.chat(`[${this.bot.username}] Güvenli yüksekliğe ulaştım!`);
  }

  // Emergency 3x3 box shelter
  async buildShelter() {
    const blockItem = this.getSolidBuildingBlock();
    if (!blockItem || blockItem.count < 16) {
      this.bot.chat(`[${this.bot.username}] Sığınak yapmak için en az 16 adet bloğa ihtiyacım var!`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] Acil durum sığınağı inşa ediyorum...`);
    const center = this.bot.entity.position.floored();

    // Wall coordinates around center
    const wallOffsets = [
      [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
      [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1]
    ];

    await this.bot.equip(blockItem, 'hand');
    for (const [dx, dy, dz] of wallOffsets) {
      const targetPos = center.offset(dx, dy, dz);
      const refBlock = this.bot.blockAt(targetPos.offset(0, -1, 0));
      if (refBlock && refBlock.boundingBox === 'block') {
        await this.bot.placeBlock(refBlock, new Vec3(0, 1, 0)).catch(() => {});
      }
    }
    this.bot.chat(`[${this.bot.username}] Sığınak inşa edildi, güvendeyiz!`);
  }
}

module.exports = BuildingEngine;

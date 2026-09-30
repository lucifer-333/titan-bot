/**
 * Automated Smelting & Furnace Engine for Mineflayer
 * Detects furnaces, inputs raw materials and fuel, and harvests finished ingots.
 */
class SmeltingEngine {
  constructor(bot) {
    this.bot = bot;
  }

  async smeltOresOrFood() {
    const furnaceBlock = this.bot.findBlock({
      matching: (b) => b && (b.name === 'furnace' || b.name === 'blast_furnace' || b.name === 'smoker'),
      maxDistance: 16
    });

    if (!furnaceBlock) {
      this.bot.chat(`[${this.bot.username}] Yakınlarda fırın veya döküm ocağı bulamadım!`);
      return;
    }

    const rawItem = this.bot.inventory.items().find(i => 
      i.name.includes('raw_') || i.name.includes('beef') || i.name.includes('porkchop') || i.name.includes('chicken') || i.name.includes('mutton') || i.name === 'cobblestone'
    );

    const fuelItem = this.bot.inventory.items().find(i => 
      i.name === 'coal' || i.name === 'charcoal' || i.name.includes('_planks') || i.name.includes('_log')
    );

    if (!rawItem || !fuelItem) {
      this.bot.chat(`[${this.bot.username}] Fırını çalıştırmak için ham malzeme ve yakıt (kömür/odun) gerekli.`);
      return;
    }

    this.bot.chat(`[${this.bot.username}] ${rawItem.name} eritilmek üzere fırına koyuluyor...`);
    try {
      await this.bot.pathfinder.goto(new (require('mineflayer-pathfinder').goals.GoalNear)(furnaceBlock.position.x, furnaceBlock.position.y, furnaceBlock.position.z, 2));
      const furnace = await this.bot.openFurnace(furnaceBlock);

      await furnace.putInput(rawItem.type, null, rawItem.count);
      await furnace.putFuel(fuelItem.type, null, fuelItem.count);

      // Collect any finished items
      if (furnace.outputItem()) {
        await furnace.takeOutput();
      }

      furnace.close();
      this.bot.chat(`[${this.bot.username}] Fırın çalıştırıldı, işlem başladı!`);
    } catch (err) {
      this.bot.chat(`[${this.bot.username}] Fırın hatası: ${err.message}`);
    }
  }
}

module.exports = SmeltingEngine;

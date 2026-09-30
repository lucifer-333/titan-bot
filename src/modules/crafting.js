/**
 * Autonomous Crafting Engine for Mineflayer
 * Automatically crafts planks, sticks, crafting tables, tools, and torches.
 */
class CraftingEngine {
  constructor(bot) {
    this.bot = bot;
  }

  async craftPlanks() {
    const logItem = this.bot.inventory.items().find(i => i.name.includes('_log') || i.name.includes('_stem'));
    if (!logItem) return false;

    const plankType = logItem.name.replace('_log', '_planks').replace('_stem', '_planks');
    const recipe = this.bot.recipesFor(this.bot.registry.itemsByName[plankType]?.id, null, 1, null)[0];
    if (recipe) {
      try {
        await this.bot.craft(recipe, logItem.count, null);
        this.bot.chat(`[${this.bot.username}] ${logItem.count * 4} adet tahta ürettim!`);
        return true;
      } catch (_) {}
    }
    return false;
  }

  async craftSticks() {
    const plankItem = this.bot.inventory.items().find(i => i.name.includes('_planks'));
    if (!plankItem || plankItem.count < 2) return false;

    const recipe = this.bot.recipesFor(this.bot.registry.itemsByName['stick']?.id, null, 1, null)[0];
    if (recipe) {
      try {
        await this.bot.craft(recipe, 1, null);
        this.bot.chat(`[${this.bot.username}] 4 adet çubuk ürettim!`);
        return true;
      } catch (_) {}
    }
    return false;
  }

  async craftTorches() {
    const coal = this.bot.inventory.items().find(i => i.name === 'coal' || i.name === 'charcoal');
    const stick = this.bot.inventory.items().find(i => i.name === 'stick');
    if (!coal || !stick) return false;

    const recipe = this.bot.recipesFor(this.bot.registry.itemsByName['torch']?.id, null, 1, null)[0];
    if (recipe) {
      try {
        await this.bot.craft(recipe, Math.min(coal.count, stick.count), null);
        this.bot.chat(`[${this.bot.username}] Meşale ürettim!`);
        return true;
      } catch (_) {}
    }
    return false;
  }

  async autoCraftEssentials() {
    this.bot.chat(`[${this.bot.username}] Temel ihtiyaç malzemelerini üretiyorum...`);
    await this.craftPlanks();
    await this.craftSticks();
    await this.craftTorches();
  }
}

module.exports = CraftingEngine;

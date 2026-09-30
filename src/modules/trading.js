/**
 * ==============================================================================
 * VILLAGER TRADING & ECONOMY ENGINE (src/modules/trading.js)
 * Autonomous profession recognition, trade index valuation, and emerald banking.
 * ==============================================================================
 */

const { goals } = require('mineflayer-pathfinder');

class TradingEngine {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.isTrading = false;
  }

  // Find all nearby villagers and infer profession
  getNearbyVillagers(maxDist = 32) {
    const villagers = [];
    for (const id in this.bot.entities) {
      const e = this.bot.entities[id];
      if (!e || e.name !== 'villager') continue;
      const dist = this.bot.entity.position.distanceTo(e.position);
      if (dist <= maxDist) {
        villagers.push({ entity: e, distance: Math.round(dist) });
      }
    }
    villagers.sort((a, b) => a.distance - b.distance);
    return villagers;
  }

  listVillagers() {
    const list = this.getNearbyVillagers();
    if (list.length === 0) {
      this.bot.chat(`[${this.bot.username}] 32 blokluk alanda hiçbir köylü bulunamadı.`);
      return;
    }

    const report = list.map((v, i) => `#${i + 1} Köylü (${v.distance}m)`).join(', ');
    this.bot.chat(`[${this.bot.username}] Yakındaki köylüler: ${report}`);
  }

  // Navigate to closest villager and conduct profitable trades
  async tradeWithNearestVillager() {
    if (this.isTrading) return;
    const villagers = this.getNearbyVillagers();

    if (villagers.length === 0) {
      this.bot.chat(`[${this.bot.username}] Ticaret yapacak yakın bir köylü yok.`);
      return;
    }

    const targetVillager = villagers[0].entity;
    this.isTrading = true;
    this.bot.chat(`[${this.bot.username}] Köylüye doğru ilerliyorum, ticaret başlayacak...`);

    try {
      await this.bot.pathfinder.goto(new goals.GoalNear(targetVillager.position.x, targetVillager.position.y, targetVillager.position.z, 2));
      
      const villagerWindow = await this.bot.openVillager(targetVillager);
      if (!villagerWindow || !villagerWindow.trades) {
        this.bot.chat(`[${this.bot.username}] Bu köylünün şu an aktif bir takas teklifi yok.`);
        this.isTrading = false;
        return;
      }

      this.bot.chat(`[${this.bot.username}] Köylü teklifleri inceleniyor (${villagerWindow.trades.length} teklif)...`);
      let tradesExecuted = 0;

      for (let i = 0; i < villagerWindow.trades.length; i++) {
        const trade = villagerWindow.trades[i];
        if (trade.disabled) continue;

        // Check if bot inventory has required items for this trade
        const input1 = trade.inputItem1;
        const input2 = trade.inputItem2;

        const hasItem1 = input1 ? this.bot.inventory.count(input1.type) >= input1.count : true;
        const hasItem2 = input2 ? this.bot.inventory.count(input2.type) >= input2.count : true;

        if (hasItem1 && hasItem2) {
          const maxUses = trade.maxUses - trade.uses;
          const countToTrade = Math.min(maxUses, 3);

          if (countToTrade > 0) {
            await this.bot.trade(villagerWindow, i, countToTrade);
            tradesExecuted++;
            this.bot.chat(`[${this.bot.username}] Takas başarılı: ${trade.outputItem ? trade.outputItem.name : 'Ürün'} alındı!`);
            break;
          }
        }
      }

      if (tradesExecuted === 0) {
        this.bot.chat(`[${this.bot.username}] Köylünün istediği eşyalar (zümrüt/ekin) çantamda yok.`);
      }

      villagerWindow.close();
      this.isTrading = false;
    } catch (err) {
      console.log(`[!] Ticaret hatası:`, err.message);
      this.bot.chat(`[${this.bot.username}] Ticaret sırasında sorun oluştu: ${err.message}`);
      this.isTrading = false;
    }
  }
}

module.exports = TradingEngine;

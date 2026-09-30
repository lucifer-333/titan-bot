/**
 * ==============================================================================
 * ULTRA-ENTERPRISE MINECRAFT AUTONOMOUS AI COMPANION FRAMEWORK (v6.0 Colossus)
 * Architecture: Full Multi-Agent System (32 Specialised Modular Engines)
 * Owner: luciferdiyetm
 * Target: FAMILIA-adrC.aternos.me (1.21 Paper)
 * ==============================================================================
 */

const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const autoEat = require('mineflayer-auto-eat').loader;
const collectBlock = require('mineflayer-collectblock').plugin;

// 32 Bağımsız Modüler Motorlar
const CombatEngine = require('./src/modules/combat');
const MiningEngine = require('./src/modules/mining');
const FarmingEngine = require('./src/modules/farming');
const SurvivalEngine = require('./src/modules/survival');
const BuildingEngine = require('./src/modules/building');
const FormationEngine = require('./src/modules/formation');
const InventoryEngine = require('./src/modules/inventory');
const DialogueEngine = require('./src/modules/dialogue');
const CraftingEngine = require('./src/modules/crafting');
const ArcheryEngine = require('./src/modules/archery');
const AntiAFKEngine = require('./src/modules/anti_afk');
const WebDashboard = require('./src/modules/dashboard');
const FishingEngine = require('./src/modules/fishing');
const SmeltingEngine = require('./src/modules/smelting');
const PathRecorderEngine = require('./src/modules/path_recorder');
const BedManagerEngine = require('./src/modules/bed_manager');
const ExplorerEngine = require('./src/modules/explorer');
const TradingEngine = require('./src/modules/trading');
const EquipmentEngine = require('./src/modules/equipment');
const MountManagerEngine = require('./src/modules/mount_manager');
const IntelligenceEngine = require('./src/modules/intelligence');
const ArchitectEngine = require('./src/modules/architect');
const FactoryEngine = require('./src/modules/factory');
const AlchemyEngine = require('./src/modules/alchemy');
const WarehouseEngine = require('./src/modules/warehouse');
const PartyManagerEngine = require('./src/modules/party_manager');
const BrainEngine = require('./src/modules/brain');

// 5 YENİ COLOSSUS MOTORU
const EnchantingEngine = require('./src/modules/enchanting');
const DungeonCrawlerEngine = require('./src/modules/dungeon_crawler');
const ElytraNavigatorEngine = require('./src/modules/elytra_navigator');
const NetherSurvivalEngine = require('./src/modules/nether_survival');
const BardEngine = require('./src/modules/bard');

const CONFIG = {
  host: 'venomcelneo.aternos.me',
  port: 31457,
  version: '1.21',
  botCount: 2,
  baseName: 'lcf_',
  owner: 'luciferdiyetm',
  joinDelayMs: 6500,
  scanRadius: 28
};

// Protodef paket uyarılarını yoksay
process.on('uncaughtException', (err) => {
  if (err.name === 'PartialReadError') return;
  console.log('[!] Sistem logu:', err.message);
});

const activeBots = [];

// En iyi alet kuşanma
function equipBestTool(bot, type) {
  const items = bot.inventory.items();
  const tools = items.filter(i => i.name.includes(type));
  if (tools.length === 0) return;

  tools.sort((a, b) => {
    const score = (name) => {
      if (name.includes('netherite')) return 6;
      if (name.includes('diamond')) return 5;
      if (name.includes('iron')) return 4;
      if (name.includes('stone')) return 2;
      return 1;
    };
    return score(b.name) - score(a.name);
  });

  bot.equip(tools[0], 'hand').catch(() => {});
}

// Zırh ve Sol El Kalkan Kuşanma
function equipGear(bot) {
  const items = bot.inventory.items();
  const armorSlots = {
    helmet: ['helmet', 'cap'],
    chestplate: ['chestplate', 'tunic'],
    leggings: ['leggings', 'pants'],
    boots: ['boots']
  };

  for (const [slot, keys] of Object.entries(armorSlots)) {
    const piece = items.find(i => keys.some(k => i.name.includes(k)));
    if (piece) bot.equip(piece, slot).catch(() => {});
  }

  const offhandItem = items.find(i => i.name.includes('totem') || i.name.includes('shield'));
  if (offhandItem) {
    bot.equip(offhandItem, 'off-hand').catch(() => {});
  }
}

// Yerdeki Eşyaları Otomatik Süpürme (Loot Magnet)
async function lootGroundItems(bot, username) {
  try {
    const droppedItems = Object.values(bot.entities).filter(e => {
      if (!e || e.type !== 'object') return false;
      return bot.entity.position.distanceTo(e.position) <= 20;
    });

    if (droppedItems.length === 0) {
      bot.chat(`[${username}] Yerde toplanacak eşya yok reis.`);
      return;
    }

    bot.chat(`[${username}] Yerdeki ${droppedItems.length} parça eşyayı toplamaya gidiyorum!`);
    for (const item of droppedItems) {
      if (!item.isValid) continue;
      await bot.pathfinder.goto(new goals.GoalNear(item.position.x, item.position.y, item.position.z, 0.8)).catch(() => {});
    }
    bot.chat(`[${username}] Yerdeki tüm ganimeti topladım!`);
  } catch (err) {
    console.log(`[!] ${username} loot hatası:`, err.message);
  }
}

// Odun Kesme
async function cutWood(bot, username) {
  try {
    const logBlock = bot.findBlock({
      matching: (b) => b && (b.name.includes('_log') || b.name.includes('_wood') || b.name.includes('_stem')),
      maxDistance: 32
    });

    if (!logBlock) {
      bot.chat(`[${username}] Yakınlarda kesilecek ağaç bulamadım reis.`);
      return;
    }

    equipBestTool(bot, 'axe');
    bot.chat(`[${username}] Baltamı aldım, ağaca yöneldim!`);
    await bot.collectBlock.collect(logBlock);
    bot.chat(`[${username}] Ağacı kestim ve topladım!`);
  } catch (err) {
    console.log(`[!] ${username} odun hatası:`, err.message);
  }
}

// Eşyaları Sahibine Verme
async function dropItemsToOwner(bot, username, filter = null) {
  const owner = bot.players[CONFIG.owner]?.entity;
  if (!owner) {
    bot.chat(`[${username}] Seni göremiyorum reis, yanıma gel eşyaları atayım.`);
    return;
  }

  bot.chat(`[${username}] Yanına geliyorum, eşyaları teslim edeceğim...`);
  await bot.pathfinder.goto(new goals.GoalNear(owner.position.x, owner.position.y, owner.position.z, 2)).catch(() => {});

  const items = bot.inventory.items();
  if (items.length === 0) {
    bot.chat(`[${username}] Çantam bomboş reis!`);
    return;
  }

  let count = 0;
  for (const item of items) {
    if (filter && !item.name.includes(filter)) continue;
    try {
      await bot.tossStack(item);
      count++;
    } catch (_) {}
  }

  bot.chat(`[${username}] ${count} parça eşyayı önüne bıraktım, güle güle kullan reis!`);
}

// 360 Derece Çevre Radarı
function scanSurroundings(bot, username) {
  if (!bot.entity) return;
  const players = [];
  const mobs = [];

  for (const id in bot.entities) {
    const e = bot.entities[id];
    if (!e || e === bot.entity) continue;
    const dist = Math.round(bot.entity.position.distanceTo(e.position));
    if (dist > 30) continue;

    if (e.type === 'player' && e.username !== CONFIG.owner) {
      players.push(`${e.username || 'Gizli'} (${dist}m)`);
    } else if (['zombie', 'skeleton', 'spider', 'creeper', 'drowned', 'witch', 'enderman'].includes(e.name)) {
      mobs.push(`${e.name} (${dist}m)`);
    }
  }

  const pText = players.length > 0 ? players.join(', ') : 'Temiz';
  const mText = mobs.length > 0 ? mobs.slice(0, 4).join(', ') : 'Tehlike yok';
  bot.chat(`[${username}] Radar: [Oyuncular: ${pText}] | [Yaratıklar: ${mText}]`);
}

// Dans ve Animasyon
function danceParty(bot, username) {
  bot.chat(`[${username}] Şov başlıyor reis!`);
  let count = 0;
  const interval = setInterval(() => {
    if (count > 10) {
      clearInterval(interval);
      bot.setControlState('jump', false);
      bot.setControlState('sneak', false);
      return;
    }
    bot.setControlState('jump', count % 2 === 0);
    bot.setControlState('sneak', count % 2 !== 0);
    count++;
  }, 300);
}

// Bot Instance Oluşturucu
function createBotInstance(id) {
  const username = `${CONFIG.baseName}${id}`;
  let isConnected = false;
  let currentTask = 'idle';

  const bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: username,
    version: CONFIG.version,
    auth: 'offline',
    checkTimeoutInterval: 60000
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bot.loadPlugin(autoEat);
  bot.loadPlugin(collectBlock);

  // 32 Bağımsız Motorun Entegrasyonu
  const combat = new CombatEngine(bot, CONFIG);
  const mining = new MiningEngine(bot, CONFIG);
  const farming = new FarmingEngine(bot);
  const survival = new SurvivalEngine(bot);
  const building = new BuildingEngine(bot);
  const formation = new FormationEngine(bot, id, CONFIG);
  const inventory = new InventoryEngine(bot);
  const dialogue = new DialogueEngine(bot, id);
  const crafting = new CraftingEngine(bot);
  const archery = new ArcheryEngine(bot);
  const antiAFK = new AntiAFKEngine(bot);
  const fishing = new FishingEngine(bot);
  const smelting = new SmeltingEngine(bot);
  const gps = new PathRecorderEngine(bot);
  const bedManager = new BedManagerEngine(bot);
  const explorer = new ExplorerEngine(bot, CONFIG);
  const trading = new TradingEngine(bot, CONFIG);
  const equipment = new EquipmentEngine(bot);
  const mount = new MountManagerEngine(bot);
  const intelligence = new IntelligenceEngine(bot, CONFIG, dialogue);
  const architect = new ArchitectEngine(bot, CONFIG);
  const factory = new FactoryEngine(bot);
  const alchemy = new AlchemyEngine(bot);
  const warehouse = new WarehouseEngine(bot);
  const party = new PartyManagerEngine(bot, id, CONFIG);
  const brain = new BrainEngine(bot, CONFIG);

  // 5 Yeni Colossus Motoru
  const enchanting = new EnchantingEngine(bot);
  const dungeon = new DungeonCrawlerEngine(bot);
  const elytra = new ElytraNavigatorEngine(bot);
  const nether = new NetherSurvivalEngine(bot);
  const bard = new BardEngine(bot);

  activeBots.push(bot);

  bot.on('login', () => {
    console.log(`[+] ${username} giriş yaptı.`);
  });

  bot.on('spawn', () => {
    isConnected = true;
    console.log(`[✓] ${username} AKTİF VE COLOSSUS v6.0 MODUNDA!`);

    const defaultMove = new Movements(bot);
    defaultMove.canDig = false;
    defaultMove.allowParkour = true;
    defaultMove.allowSprinting = true;
    defaultMove.canOpenDoors = true;
    defaultMove.liquidCost = 25;
    bot.pathfinder.setMovements(defaultMove);

    bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: ['rotten_flesh', 'pufferfish', 'poisonous_potato', 'spider_eye']
    };

    // Motorları başlat
    equipGear(bot);
    equipment.optimizeArmor();
    combat.init();
    survival.init();
    antiAFK.start();
    explorer.init();
    intelligence.init();
    brain.init();
  });

  // TPA Otomatik Kabul
  bot.on('messagestr', (msg) => {
    const clean = msg.toLowerCase();
    const ownerName = CONFIG.owner.toLowerCase();

    if (clean.includes(ownerName) && 
       (clean.includes('tpa') || clean.includes('teleport') || clean.includes('tpaccept') || clean.includes('istek') || clean.includes('has requested'))) {
      console.log(`[+] ${username} -> ${CONFIG.owner} TPA isteği kabul ediliyor...`);
      setTimeout(() => bot.chat('/tpaccept'), 350);
    }
  });

  // Gece/Gündüz Farkındalığı
  bot.on('time', () => {
    if (!isConnected || !bot.time) return;
    if (bot.time.timeOfDay === 13000 && id === 1) {
      bot.chat(`[${username}] Gece çöktü reis! Canavarlar doğuyor, tetikteyiz.`);
    }
  });

  // Otomatik Periyodik Kontroller
  setInterval(() => {
    if (!isConnected || !bot.entity) return;
    equipGear(bot);

    if (bot.health < 8) {
      equipment.consumeEmergencyFood();
    }

    if (currentTask === 'hunt' || currentTask === 'guard') {
      if (combat.target && combat.target.isValid) return;

      const hostileMobs = [
        'zombie', 'skeleton', 'spider', 'cave_spider', 'creeper',
        'drowned', 'husk', 'stray', 'witch', 'slime', 'phantom'
      ];

      const targetMob = bot.nearestEntity((e) => {
        if (!e || !e.position) return false;
        if (hostileMobs.includes(e.name)) {
          return bot.entity.position.distanceTo(e.position) <= CONFIG.scanRadius;
        }
        return false;
      });

      if (targetMob) {
        equipment.prepareCombatOffhand();
        combat.engage(targetMob);
      }
    }
  }, 1500);

  // Chat ve Komut Yorumlayıcı
  bot.on('chat', async (sender, message) => {
    if (sender === bot.username) return;

    const rawMsg = message.trim();
    const clean = rawMsg.toLowerCase();

    if (clean === 'leksa') {
      setTimeout(() => {
        if (isConnected) bot.chat('oglumdu');
      }, (id - 1) * 200);
      return;
    }

    // Sadece luciferdiyetm'i dinle
    if (sender.toLowerCase() !== CONFIG.owner.toLowerCase()) return;

    const directToMe = clean.startsWith(username.toLowerCase());
    const toAll = clean.startsWith('hepiniz') || clean.startsWith('botlar');
    const general = !clean.startsWith(CONFIG.baseName.toLowerCase());

    if (general && id !== 1) return;
    if (!directToMe && !toAll && !general) return;

    let cmd = clean.replace(username.toLowerCase(), '').replace('hepiniz', '').replace('botlar', '').trim();

    // 1. Büyü Masası ve Örs (Enchanting & Repair)
    if (cmd.includes('büyü bas') || cmd.includes('büyüle')) {
      const parts = cmd.split(' ');
      const toolType = parts.length > 2 ? parts[2] : 'sword';
      enchanting.enchantItem(toolType);
      return;
    }
    if (cmd.includes('tamir et') || cmd.includes('örs')) {
      const parts = cmd.split(' ');
      const toolType = parts.length > 2 ? parts[2] : 'pickaxe';
      enchanting.repairItem(toolType);
      return;
    }

    // 2. Spawner Nötralizasyon & Zindan (Dungeon Crawler)
    if (cmd.includes('spawner') || cmd.includes('spawnerı söndür')) {
      dungeon.neutralizeSpawner();
      return;
    }
    if (cmd.includes('zindanı temizle') || cmd.includes('sandıkları yağmala')) {
      dungeon.lootDungeonChests();
      return;
    }

    // 3. Elytra & Roket Uçuşu (Elytra Navigator)
    if (cmd.includes('uçuşa geç') || cmd.includes('roketle uç')) {
      elytra.startFlight();
      return;
    }
    if (cmd.includes('iniş yap') || cmd.includes('süzül')) {
      elytra.landSafely();
      return;
    }

    // 4. Nether Hayatta Kalma & Piglin Takası (Nether Survival)
    if (cmd.includes('piglinlerle takas') || cmd.includes('piglin takas')) {
      nether.barterWithPiglins();
      return;
    }
    if (cmd.includes('altın zırh giy') || cmd.includes('nether modu')) {
      nether.ensureGoldArmorNeutrality();
      return;
    }

    // 5. Müzik & Ozan Şarkıları (Bard)
    if (cmd.includes('müzik çal') || cmd.includes('plak tak')) {
      bard.playMusicDisc();
      return;
    }
    if (cmd.includes('şarkı söyle') || cmd.includes('marş oku')) {
      bard.singBattleHymn();
      return;
    }

    // 6. Şema ve Yapı İnşası (Architect)
    if (cmd.includes('villa yap') || cmd.includes('villa inşa et')) {
      architect.construct('villa');
      return;
    }
    if (cmd.includes('dağ evi yap') || cmd.includes('kulübe yap')) {
      architect.construct('kulübe');
      return;
    }
    if (cmd.includes('kale yap') || cmd.includes('şato yap')) {
      architect.construct('kale');
      return;
    }
    if (cmd.includes('ev yap') || cmd.includes('ev inşa et')) {
      architect.construct('ev');
      return;
    }
    if (cmd.startsWith('inşa et') || cmd.startsWith('bina yap')) {
      const parts = cmd.split(' ');
      const type = parts.length > 2 ? parts[2] : 'villa';
      architect.construct(type);
      return;
    }
    if (cmd.includes('inşaatı durdur')) {
      architect.stop();
      return;
    }

    // 7. Çiftlik ve Seri Üretim (Factory)
    if (cmd.includes('şeker kamışı topla') || cmd.includes('kamış topla')) {
      factory.harvestSugarCane();
      return;
    }
    if (cmd.includes('hayvanları besle') || cmd.includes('çiftliği yönet')) {
      factory.breedAnimals();
      return;
    }
    if (cmd.includes('yün kırk')) {
      factory.shearSheep();
      return;
    }
    if (cmd.includes('süt sağ')) {
      factory.milkCows();
      return;
    }

    // 8. Simya & İksir Üretimi (Alchemy)
    if (cmd.startsWith('iksir üret') || cmd.startsWith('iksir demle')) {
      const parts = cmd.split(' ');
      const pType = parts.length > 2 ? parts[2] : 'hız';
      alchemy.brewPotion(pType);
      return;
    }
    if (cmd.includes('iksir iç') || cmd.includes('hazırlıkları yap')) {
      alchemy.drinkCombatPotions();
      return;
    }

    // 9. Akıllı Depo & Sandık Kategorizasyonu (Warehouse)
    if (cmd.includes('depoyu düzenle') || cmd.includes('sandıkları düzenle') || cmd.includes('eşyaları sandığa boşalt')) {
      warehouse.organizeAndDeposit();
      return;
    }

    // 10. Parti & Birlik Stratejisi (Party Manager)
    if (cmd.includes('partiye katıl') || cmd.includes('pozisyon al') || cmd.includes('bölgeyi savun')) {
      party.setStance('defend_area');
      return;
    }
    if (cmd.startsWith('bana ') && (cmd.includes('at') || cmd.includes('ver'))) {
      const words = cmd.replace('bana ', '').split(' ');
      const itemWanted = words[0];
      party.supplyItem(itemWanted, 16);
      return;
    }

    // 11. Derin Hafıza & Durum Özeti (Brain)
    if (cmd.includes('hafızayı listele') || cmd.includes('durum özeti ver') || cmd.includes('hafıza')) {
      const summary = brain.getDebrief();
      bot.chat(`[${username}] 🧠 ${summary}`);
      return;
    }

    // 12. Keşif Motoru (Explorer)
    if (cmd.includes('keşfe başla') || cmd.includes('keşif yap')) {
      currentTask = 'explore';
      explorer.startExploration(120);
      return;
    }
    if (cmd.includes('keşfi durdur')) {
      explorer.stopExploration();
      return;
    }
    if (cmd.includes('keşif raporu') || cmd.includes('poi')) {
      explorer.listDiscoveredPOIs();
      return;
    }

    // 13. Ticaret ve Köylü Motoru (Trading)
    if (cmd.includes('köyü bul') || cmd.includes('köylüleri listele')) {
      trading.listVillagers();
      return;
    }
    if (cmd.includes('ticaret yap') || cmd.includes('takas yap')) {
      trading.tradeWithNearestVillager();
      return;
    }

    // 14. Akıllı Zırh ve Ekipman (Equipment)
    if (cmd.includes('en iyi zırhı kuşan') || cmd.includes('ekipmanı optimize et')) {
      equipment.optimizeArmor();
      equipment.prepareCombatOffhand();
      return;
    }

    // 15. Binek ve Lojistik Motoru (Mount Manager)
    if (cmd.includes('ata bin') || cmd.includes('binek bul')) {
      mount.mountAnimal();
      return;
    }
    if (cmd.includes('eşeği yükle') || cmd.includes('sandık tak')) {
      mount.equipChestToPackAnimal();
      return;
    }
    if (cmd.includes('in') || cmd.includes('binekden in')) {
      mount.dismount();
      return;
    }

    // 16. Balık Tutma
    if (cmd.includes('balık tut')) {
      currentTask = 'fish';
      fishing.startFishing();
      return;
    }
    if (cmd.includes('balığı bırak')) {
      fishing.stop();
      return;
    }

    // 17. Fırın & Maden Eritme
    if (cmd.includes('fırın') || cmd.includes('erit') || cmd.includes('pişir')) {
      smelting.smeltOresOrFood();
      return;
    }

    // 18. GPS & Konum Kaydetme / Üs
    if (cmd.includes('burayı üs yap')) {
      gps.saveWaypoint('üs');
      return;
    }
    if (cmd.includes('üsse dön')) {
      gps.gotoWaypoint('üs');
      return;
    }
    if (cmd.startsWith('konum kaydet ')) {
      const wpName = cmd.replace('konum kaydet ', '').trim();
      gps.saveWaypoint(wpName);
      return;
    }
    if (cmd.startsWith('konuma git ')) {
      const wpName = cmd.replace('konuma git ', '').trim();
      gps.gotoWaypoint(wpName);
      return;
    }

    // 19. Uyuma & Yatak
    if (cmd.includes('uyu')) {
      bedManager.sleepInNearestBed();
      return;
    }
    if (cmd.includes('uyan')) {
      bedManager.wakeUp();
      return;
    }

    // 20. Üretim & Crafting
    if (cmd.includes('üret') || cmd.includes('craft') || cmd.includes('tahta yap')) {
      crafting.autoCraftEssentials();
      return;
    }

    // 21. Ok Atma & Nişancı
    if (cmd.includes('ok at') || cmd.includes('sniper')) {
      const words = rawMsg.split(' ');
      const targetName = words[words.length - 1].toLowerCase();
      const target = Object.values(bot.entities).find(e => (e.username || '').toLowerCase() === targetName || e.name === targetName);
      if (target) {
        bot.chat(`[${username}] ${targetName} hedefine ok fırlatıyorum!`);
        archery.shootTarget(target);
      }
      return;
    }

    // 22. Hasat & Tarım
    if (cmd.includes('hasat') || cmd.includes('tarla')) {
      currentTask = 'farm';
      farming.harvestAndReplant();
      return;
    }

    // 23. Yerdeki Ganimetleri Toplama (Loot Magnet)
    if (cmd.includes('topla') || cmd.includes('loot')) {
      combat.stopCombat();
      currentTask = 'loot';
      lootGroundItems(bot, username);
      return;
    }

    // 24. Odun Kesme
    if (cmd.includes('odun') || cmd.includes('ağaç')) {
      combat.stopCombat();
      currentTask = 'wood';
      cutWood(bot, username);
      return;
    }

    // 25. Maden Kazma (Vein Mining & Strip Mining)
    if (cmd.includes('maden') || cmd.includes('demir') || cmd.includes('kömür') || cmd.includes('elmas')) {
      combat.stopCombat();
      currentTask = 'mine';
      const ore = bot.findBlock({
        matching: (b) => b && (b.name.includes('ore') || b.name.includes('raw_')),
        maxDistance: 24
      });
      if (ore) {
        mining.mineVein(ore);
      } else {
        mining.stripMine(8);
      }
      return;
    }

    // 26. Eşyaları Sahibine Verme
    if (cmd.includes('eşyaları at') || cmd.includes('bana ver')) {
      dropItemsToOwner(bot, username);
      return;
    }

    // 27. Radar ve Çevre Taraması
    if (cmd.includes('radar') || cmd.includes('etrafta ne var')) {
      scanSurroundings(bot, username);
      return;
    }

    // 28. Askeri Eskort & Koruma Formasyonu
    if (cmd.includes('koru') || cmd.includes('bana gel') || cmd.includes('eşlik')) {
      currentTask = 'guard';
      formation.startEscort();
      return;
    }

    // 29. Saldırma (PvP Hedefi)
    if (cmd.includes('saldır') || cmd.includes('öldür') || cmd.includes('vur')) {
      const words = rawMsg.split(' ');
      let targetPlayerName = null;

      for (const w of words) {
        const cleanW = w.toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (cleanW && 
            cleanW !== CONFIG.owner.toLowerCase() && 
            !cleanW.startsWith(CONFIG.baseName.toLowerCase()) &&
            !['saldir', 'saldır', 'oldur', 'öldür', 'vur', 'hepiniz', 'botlar', username.toLowerCase()].includes(cleanW)) {
          targetPlayerName = cleanW;
          break;
        }
      }

      if (targetPlayerName) {
        const targetEntity = Object.values(bot.entities).find(e => 
          e.type === 'player' && (e.username || '').toLowerCase() === targetPlayerName
        );

        if (targetEntity) {
          currentTask = 'pvp';
          equipment.prepareCombatOffhand();
          bot.chat(`[${username}] ${targetPlayerName} hedefine taktiksel hücum başlatıldı!`);
          combat.engage(targetEntity);
        }
      }
      return;
    }

    // 30. Kasılma / Zararlı Mob Avı
    if (cmd.includes('kasıl') || cmd.includes('zombi') || cmd.includes('avlan')) {
      currentTask = 'hunt';
      bot.chat(`[${username}] Avlanma moduna geçtim, zombileri ve canavarları doğruyorum!`);
      return;
    }

    // 31. Bana TPA At
    if (cmd.includes('bana tpa at') || cmd.includes('tpa at')) {
      bot.chat(`/tpa ${CONFIG.owner}`);
      bot.chat(`[${username}] Sana TPA attım reis, kabul et!`);
      return;
    }

    // 32. Dans ve Eğlence
    if (cmd.includes('dans') || cmd.includes('oyna')) {
      danceParty(bot, username);
      return;
    }

    // 33. Dur / Bekle
    if (cmd.includes('dur') || cmd.includes('stop') || cmd.includes('bekle')) {
      currentTask = 'idle';
      combat.stopCombat();
      farming.stop();
      fishing.stop();
      explorer.stopExploration();
      architect.stop();
      formation.disband();
      bot.pathfinder.setGoal(null);
      bot.setControlState('jump', false);
      bot.setControlState('sneak', false);
      bot.chat(`[${username}] Tüm görevler iptal edildi, hazırda bekliyorum reis.`);
      return;
    }

    // 34. Doğal Dil & Diyalog Motoru
    const reply = dialogue.generateReply(cmd);
    bot.chat(`[${username}] ${reply}`);
  });

  let isBanned = false;

  bot.on('kicked', (reason) => {
    isConnected = false;
    let msg = reason;
    try {
      const parsed = JSON.parse(reason);
      msg = parsed.text || (parsed.with ? parsed.with.join(' ') : reason);
    } catch (_) {}

    const str = typeof reason === 'string' ? reason : JSON.stringify(reason);
    if (str.toLowerCase().includes('banned') || str.toLowerCase().includes('ban')) {
      isBanned = true;
      console.log(`[!] ${username} BANLANDI! Tekrar bağlanılmayacak.`);
      return;
    }

    console.log(`[-] ${username} atıldı: ${msg}`);
  });

  bot.on('error', (err) => {
    if (err.name === 'PartialReadError') return;
    console.log(`[!] ${username} hata: ${err.message}`);
  });

  bot.on('end', () => {
    isConnected = false;
    if (isBanned) return;

    console.log(`[*] ${username} ayrıldı. 10 saniye sonra tekrar denenecek...`);
    setTimeout(() => {
      if (!isBanned) createBotInstance(id);
    }, 10000);
  });
}

console.log(`[***] Colossus v6.0 (32 Modüllü) Titan Bot Sistemi Hazır.`);

if (process.argv.includes('--start') || require.main === module) {
  const dashboard = new WebDashboard(activeBots, CONFIG);
  dashboard.start(3000);

  for (let i = 1; i <= CONFIG.botCount; i++) {
    setTimeout(() => {
      createBotInstance(i);
    }, (i - 1) * CONFIG.joinDelayMs);
  }
}

module.exports = { createBotInstance, CONFIG };

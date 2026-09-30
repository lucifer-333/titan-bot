# ⚡ TITAN v3.0 — Autonomous Minecraft Bot Army & Web Control Hub

> **Architect & Creator:** `lucifer` (`luciferdiyetm`)  
> **Platform:** Node.js / Mineflayer (Minecraft 1.21 Paper / Spigot / Vanilla)  
> **Architecture:** 32 Autonomous Engine Micro-Modules + Zero-Dependency Realtime Web Dashboard  

---

## 🌐 Language Navigation / Dil Seçimi / Dil Seçimi
- [English (EN)](#-english-en)
- [Türkçe (TR)](#-türkçe-tr)
- [Azərbaycanca (AZ)](#-azərbaycanca-az)

---

## 🇬🇧 English (EN)

### Overview
**Titan v3.0** is an enterprise-grade autonomous Minecraft bot system designed for tactical squad coordination, survival, complex architectural construction, industrial farming, and combat supremacy. Coordinated by a master orchestrator (`bot.js`), the squad operates 32 decoupled modular engines.

### Key Capabilities
- **Tactical Combat & Archery:** Jump-critical timing, dynamic circle-strafing, shield blocking, offhand Totem of Undying / golden apple management, and gravity-compensated parabolic bow trajectory targeting.
- **Parametric Architect Engine:** Constructs multi-story luxury villas (with balconies and panoramic windows), medieval castles with crenelations, and log cabins with automated material substitution (cobblestone, wood, deepslate, dirt).
- **Embedded Web HUD (`http://localhost:3000`):** Real-time web radar canvas, health/hunger telemetry, coordinates, inventory tracker, and bi-directional live chat/command terminal.
- **Automated Agriculture & Industry:** Sugar cane harvesting (preserving root stalks), livestock breeding, sheep shearing, cow milking, and crop replanting.
- **Advanced Navigation & Flight:** A* pathfinding, Archimedean spiral scouting, GPS base waypoints, and Elytra rocket propulsion with stall-flare safe landing.
- **Deep Nether Survival:** Piglin gold barter automation, mandatory gold armor equipping for piglin neutrality, and lava evasion.
- **Alchemy & Enchanting:** Automated potion brewing (speed, strength, healing), table enchanting, and anvil item repairs.
- **Sound Threat Telemetry:** Detects primed creeper hisses, explosions, and sudden damage, immediately broadcasting alerts to the owner.

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure server & owner in bot.js (CONFIG object)
# host: "your-server-ip", owner: "luciferdiyetm"

# 3. Launch Bot Squad and Web Dashboard
npm start
```

Access the local management panel at `http://localhost:3000`.

### In-Game Chat Commands (Owner: `luciferdiyetm`)
| Command | Action |
|---|---|
| `villa yap` / `villa inşa et` | Constructs a 2-story luxury modern villa with a terrace |
| `kale yap` / `şato yap` | Builds a fortified stone castle with towers and battlements |
| `dağ evi yap` / `kulübe yap` | Builds a 5x5 cozy wooden log cabin |
| `inşaatı durdur` | Immediately cancels active construction task |
| `beni koru` / `bölgeyi savun` | Enters combat bodyguard stance around the owner |
| `beni takip et` / `yanıma gel` | Engages tactical escort formation |
| `maden yap` / `ağaç kes` | Initiates autonomous vein mining or lumberjack mode |
| `uçuşa geç` / `iniş yap` | Activates Elytra firework rocket flight or stall-flare landing |
| `piglinlerle takas` | Starts automated Nether piglin gold bartering |
| `depoyu düzenle` | Sorts and categorizes inventory into surrounding chests |

---

## 🇹🇷 Türkçe (TR)

### Genel Bakış
**Titan v3.0**, Minecraft 1.21 sunucularında tam otonom hareket eden, taktiksel koruma sağlayan, gelişmiş mimari yapılar inşa eden ve yerel bir web paneli üzerinden anlık yönetilen yeni nesil bir bot ordusudur. `lucifer` (`luciferdiyetm`) tarafından geliştirilmiştir.

### Öne Çıkan Motorlar & Yetenekler
- **32 Bağımsız Modüler Motor:** Savaş, okçuluk, madencilik, çiftçilik, simya, büyü, elytra, zindan temizliği ve daha fazlası `src/modules/` altında çalışır.
- **Lüks Villa & Mimari Motoru (`architect.js`):** 2 katlı teraslı ve balkonlu modern villa, burçlu ve mazgallı ortaçağ kalesi veya ahşap dağ kulübesi inşa eder. Envanterde taş yoksa tahta veya toprağı otomatik alternatif olarak kullanır.
- **Gelişmiş Web Kontrol Paneli (`http://localhost:3000`):** Harici kütüphane gerektirmeyen sıfır gecikmeli arayüz. 2D çevre radarı, canlı can/açlık göstergesi, koordinat takibi ve canlı sohbet konsolu içerir.
- **PVP & PVE Üstünlüğü:** Zıplayarak kritik vuruş, kalkan bloklama, sol ele totem takma, altın elma yeme ve yerçekimi eğrisini hesaplayan keskin nişancı yay motoru.
- **Otomasyon & Fabrika:** Şeker kamışını kökünü kırmadan kesme, hayvan besleyip çoğaltma, koyun kırkma, inek sağma ve sandıkları kategorilerine göre (maden, blok, eşya, zırh) düzenleme.
- **Elytra & Nether Hayatta Kalma:** Havai fişekle elytra uçuşu, süzülerek güvenli iniş, Nether'da piglinlerle otomatik altın takası ve altın zırh takarak tarafsız kalma.

### Kurulum ve Çalıştırma
```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. bot.js dosyasındaki CONFIG ayarlarını yapın (sunucu IP ve sahip adı)

# 3. Botları ve Web Panelini Başlatın
npm start
```
Web paneline tarayıcınızdan `http://localhost:3000` adresinden ulaşabilirsiniz.

### Temel Sohbet Komutları (Sahip: `luciferdiyetm`)
| Komut | Eylem |
|---|---|
| `villa yap` | 2 katlı lüks teraslı modern villa diker |
| `kale yap` | Savunma surları ve burçları olan kale inşa eder |
| `dağ evi yap` | Ahşap kulübe kurar |
| `inşaatı durdur` | İnşaatı iptal eder |
| `beni koru` | Sahibin etrafında koruma kalkanı oluşturur, saldıranları yok eder |
| `uçuşa geç` / `iniş yap` | Elytra ile roketli uçuşu ve güvenli inişi yönetir |
| `piglinlerle takas` | Piglinlere altın külçesi atarak takas yapar |
| `iksir üret [tür]` | Simya standında hız, güç veya can iksiri demler |
| `depoyu düzenle` | Eşyaları kategorilerine göre etraftaki sandıklara boşaltır |

---

## 🇦🇿 Azərbaycanca (AZ)

### Ümumi Məlumat
**Titan v3.0**, Minecraft 1.21 serverləri üçün hazırlanmış, tam müstəqil qərarlar verən, taktiki mühafizə təmin edən, lüks binalar ucaldan və real-vaxt veb idarəetmə paneli olan ultra-müasir bot sistemidir. Müəllif: `lucifer` (`luciferdiyetm`).

### Əsas İmkanlar
- **32 Müstəqil Motor:** Döyüş, oxçuluq, mədənçilik, ferma, kimya (iktisir), ovsun, elytra uçuşu və zindan təmizlənməsi modulları.
- **Lüks Villa və Memarlıq Mühərriki (`architect.js`):** 2 mərtəbəli, eyvanlı və panoram pəncərəli lüks villa, daş qala və dağ koması tikir. İnventarda daş çatışmadıqda taxta və ya torpaqdan avtomatik alternativ kimi istifadə edir.
- **Veb İdarəetmə Paneli (`http://localhost:3000`):** 2D radar xəritəsi, botların can/aclıq vəziyyəti, kordinat izləmə və oyuna canlı mesaj yazmaq üçün inteqrasiya olunmuş konsol.
- **Taktiki Döyüş və Oxçuluq:** Kritik tullanış zərbələri, qalxanla müdafiə, ölümsüzlük totemi və qızıl alma istifadəsi, hədəfin məsafəsini və oxun trayektoriyasını hesablayan snayper ox atışı.
- **Nether və Elytra Sistemi:** Fişənglərlə göyə qalxma və yumşaq eniş, Nether-də Piglinlərlə qızıl külçəsi alveri və qızıl zireh geyinərək təhlükəsizlik təmin etmə.
- **Avtomatlaşdırılmış Ferma:** Şəkər qamışının kökünə toxunmadan yığımı, heyvanların bəslənməsi, qoyunların qırxılması və anbarların səliqəyə salınması.

### Quraşdırma və İşə Salma
```bash
# 1. Lazımi paketləri yükləyin
npm install

# 2. bot.js faylında server və sahib adını (CONFIG) yoxlayın

# 3. Botları və İdarəetmə Panelini Başladın
npm start
```
Lokal idarəetmə panelini açmaq üçün brauzerdə `http://localhost:3000` ünvanına daxil olun.

### Əsas Əmrlər (Sahib: `luciferdiyetm`)
| Əmr | Nəticə |
|---|---|
| `villa yap` | 2 mərtəbəli lüks villa tikintisinə başlayır |
| `kale yap` | Qala divarları və qüllələr tikir |
| `dağ evi yap` | Kompakt taxta ev ucaldır |
| `inşaatı durdur` | Tikintini dərhal saxlayır |
| `beni koru` | Sahibin ətrafını qoruyur və düşmənlərə hücum edir |
| `uçuşa geç` / `iniş yap` | Elytra ilə havaya qalxır və ya təhlükəsiz enir |
| `piglinlerle takas` | Piglinlərlə qızıl ticarətini başladır |
| `depoyu düzenle` | İnventarı ətrafdakı sandıqlara kateqoriya üzrə yerləşdirir |

---

## 🛠️ Project Structure / Proyekt Strukturu
```text
├── bot.js                  # Master Orchestrator & Command Router
├── package.json            # Node.js Metadata & Dependencies
├── .gitignore              # Git Ignore Rules (node_modules, logs)
├── README.md               # Trilingual Documentation
└── src/
    └── modules/
        ├── combat.js           # Melee PVP/PVE, Crits, Shield Timing
        ├── archery.js          # Sniper Gravity Bow Ballistics
        ├── architect.js        # Voxel Schematics (Villas, Castles, Cabins)
        ├── dashboard.js        # Real-time Web Control HUD (Port 3000)
        ├── elytra_navigator.js # Rocket Flight & Gliding
        ├── nether_survival.js  # Piglin Barter & Gold Armor Safety
        ├── factory.js          # Cane Farm, Sheep Shear, Cow Milk, Breeding
        ├── mining.js           # Vein Miner & Strip Mining
        ├── farming.js          # Crops Harvest & Auto-replant
        ├── alchemy.js          # Potion Brewing & Combat Drinking
        ├── enchanting.js       # Tier-3 Table Enchanting & Anvil Repair
        ├── warehouse.js        # Multi-chest Intelligent Sorter
        ├── intelligence.js     # Sound Wave Creeper/Explosion Alerts
        ├── brain.js            # Persistent Memory Logging
        ├── party_manager.js    # Squad Stances & Supply Logistics
        └── ...                 # 32 Decoupled Production Engines
```

---

## 📜 License & Credits
- **Author & Lead Developer:** `lucifer` (`luciferdiyetm`)
- **License:** MIT License

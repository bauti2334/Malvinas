// ==================== CONFIGURACIÓN DEL JUEGO ====================

const CONFIG = {
    // Recursos iniciales por facción
    initialResources: {
        argentina: {
            money: 5000,
            manpower: 10000,
            fuel: 8000,
            logistics: 100,
            political: 75,
            international: 40
        },
        uk: {
            money: 15000,
            manpower: 8000,
            fuel: 12000,
            logistics: 100,
            political: 85,
            international: 70
        }
    },
    
    // Costos por turno
    turnCosts: {
        money: 200,
        fuel: 100,
        logistics: 5
    },
    
    // Unidades navales INICIALES (gratis)
    initialNavalUnits: {
        argentina: [
            { id: 'belgrano', name: 'ARA General Belgrano', fuel: 30, attack: 70, defense: 60, hp: 100, maxHp: 100, type: 'cruiser' },
            { id: 'hercules', name: 'ARA Hércules', fuel: 25, attack: 50, defense: 55, hp: 80, maxHp: 80, type: 'destroyer' },
            { id: 'trinidad', name: 'ARA Santísima Trinidad', fuel: 25, attack: 50, defense: 55, hp: 80, maxHp: 80, type: 'destroyer' },
            { id: 'sanLuis', name: 'Sub. ARA San Luis', fuel: 20, attack: 80, defense: 40, hp: 60, maxHp: 60, type: 'submarine' }
        ],
        uk: [
            { id: 'hermes', name: 'HMS Hermes', fuel: 40, attack: 85, defense: 75, hp: 120, maxHp: 120, type: 'carrier' },
            { id: 'invincible', name: 'HMS Invincible', fuel: 40, attack: 85, defense: 75, hp: 120, maxHp: 120, type: 'carrier' },
            { id: 'sheffield', name: 'HMS Sheffield', fuel: 30, attack: 60, defense: 65, hp: 90, maxHp: 90, type: 'destroyer' },
            { id: 'conqueror', name: 'Sub. HMS Conqueror', fuel: 25, attack: 90, defense: 45, hp: 70, maxHp: 70, type: 'submarine' }
        ]
    },
    
    // Unidades navales COMPRABLES
    purchasableNavalUnits: {
        argentina: [
            { id: 'destroyer', name: 'Destructor Tipo 42', cost: 2000, fuel: 25, attack: 55, defense: 60, hp: 85, maxHp: 85, type: 'destroyer' },
            { id: 'corvette', name: 'Corbeta A-69', cost: 1200, fuel: 20, attack: 40, defense: 50, hp: 65, maxHp: 65, type: 'corvette' }
        ],
        uk: [
            { id: 'destroyer', name: 'Destructor Type 42', cost: 2500, fuel: 30, attack: 65, defense: 70, hp: 95, maxHp: 95, type: 'destroyer' },
            { id: 'frigate', name: 'Fragata Type 21', cost: 1800, fuel: 25, attack: 50, defense: 60, hp: 75, maxHp: 75, type: 'frigate' }
        ]
    },
    
    // Unidades aéreas
    airUnits: {
        argentina: [
            { id: 'skyhawk', name: 'A-4 Skyhawk', cost: 800, fuel: 50, attack: 75, defense: 30, missions: 20 },
            { id: 'dagger', name: 'IAI Dagger', cost: 900, fuel: 45, attack: 70, defense: 35, missions: 15 },
            { id: 'mirage', name: 'Mirage III', cost: 1200, fuel: 60, attack: 80, defense: 40, missions: 10 },
            { id: 'pucara', name: 'Pucará IA-58', cost: 400, fuel: 30, attack: 40, defense: 25, missions: 25 }
        ],
        uk: [
            { id: 'seaHarrier', name: 'Sea Harrier FRS.1', cost: 1500, fuel: 55, attack: 85, defense: 50, missions: 28 },
            { id: 'harrierGR3', name: 'Harrier GR.3', cost: 1300, fuel: 50, attack: 75, defense: 45, missions: 14 }
        ]
    },
    
    // Unidades terrestres
    groundUnits: {
        argentina: [
            { id: 'infantry', name: 'Infantería', symbol: '⬛', cost: 100, attack: 40, defense: 50, manpower: 50 },
            { id: 'marines', name: 'Infantería de Marina', symbol: '◆', cost: 150, attack: 50, defense: 55, manpower: 40 },
            { id: 'reg25', name: 'Regimiento 25', symbol: '▲', cost: 200, attack: 55, defense: 60, manpower: 35 },
            { id: 'artillery', name: 'Artillería', symbol: '●', cost: 300, attack: 70, defense: 30, manpower: 20 }
        ],
        uk: [
            { id: 'marines', name: 'Royal Marines', symbol: '⬛', cost: 200, attack: 65, defense: 60, manpower: 45 },
            { id: 'para', name: 'Parachute Regiment', symbol: '◆', cost: 250, attack: 70, defense: 55, manpower: 40 },
            { id: 'guards', name: 'Infantry Guards', symbol: '▲', cost: 180, attack: 60, defense: 65, manpower: 50 },
            { id: 'artillery', name: 'Artillería Ligera', symbol: '●', cost: 280, attack: 65, defense: 35, manpower: 25 }
        ]
    },
    
    // Zonas estratégicas de las Malvinas
    zones: [
        { id: 'puerto_argentino', name: 'Puerto Argentino/Stanley', x: 650, y: 450, type: 'capital', controller: 'argentina', troops: 0 },
        { id: 'goose_green', name: 'Goose Green', x: 500, y: 550, type: 'town', controller: 'argentina', troops: 0 },
        { id: 'san_carlos', name: 'San Carlos', x: 350, y: 400, type: 'bay', controller: 'argentina', troops: 0 },
        { id: 'darwin', name: 'Darwin', x: 480, y: 580, type: 'town', controller: 'argentina', troops: 0 },
        { id: 'mount_kent', name: 'Monte Kent', x: 580, y: 420, type: 'mountain', controller: 'argentina', troops: 0 },
        { id: 'naval_zone_east', name: 'Zona Naval Este', x: 850, y: 500, type: 'naval', controller: 'neutral', troops: 0 },
        { id: 'naval_zone_west', name: 'Zona Naval Oeste', x: 150, y: 500, type: 'naval', controller: 'neutral', troops: 0 },
        { id: 'naval_zone_north', name: 'Zona Naval Norte', x: 500, y: 200, type: 'naval', controller: 'neutral', troops: 0 },
        { id: 'naval_zone_south', name: 'Zona Naval Sur', x: 500, y: 700, type: 'naval', controller: 'neutral', troops: 0 }
    ],
    
    // Configuración del mapa
    map: {
        width: 1000,
        height: 800,
        // Contorno simplificado de las Malvinas (isla Soledad y Gran Malvina)
        islands: [
            // Gran Malvina (oeste)
            {
                points: [
                    {x: 200, y: 350}, {x: 250, y: 320}, {x: 300, y: 310},
                    {x: 350, y: 320}, {x: 400, y: 340}, {x: 450, y: 380},
                    {x: 470, y: 420}, {x: 480, y: 470}, {x: 475, y: 520},
                    {x: 460, y: 570}, {x: 430, y: 610}, {x: 380, y: 640},
                    {x: 330, y: 655}, {x: 280, y: 650}, {x: 230, y: 630},
                    {x: 190, y: 600}, {x: 160, y: 560}, {x: 145, y: 510},
                    {x: 140, y: 460}, {x: 150, y: 410}, {x: 170, y: 370}
                ],
                color: '#2d5016'
            },
            // Isla Soledad (este)
            {
                points: [
                    {x: 480, y: 380}, {x: 530, y: 360}, {x: 580, y: 350},
                    {x: 630, y: 355}, {x: 680, y: 370}, {x: 720, y: 400},
                    {x: 745, y: 440}, {x: 755, y: 490}, {x: 750, y: 540},
                    {x: 730, y: 580}, {x: 700, y: 610}, {x: 660, y: 630},
                    {x: 610, y: 640}, {x: 560, y: 635}, {x: 515, y: 620},
                    {x: 480, y: 590}, {x: 460, y: 550}, {x: 455, y: 500},
                    {x: 460, y: 450}, {x: 470, y: 410}
                ],
                color: '#2d5016'
            }
        ]
    },
    
    // Símbolos para unidades navales según tipo
    navalSymbols: {
        carrier: '🛳️',
        cruiser: '🚢',
        destroyer: '⚓',
        frigate: '⛴️',
        corvette: '🚤',
        submarine: '🔱'
    }
};

// Configuración de imágenes (puedes cambiar aquí por URLs reales)
CONFIG.images = {
    naval: {
        argentina: {
            belgrano: '🚢',
            hercules: '⚓',
            trinidad: '⚓',
            sanLuis: '🔱'
        },
        uk: {
            hermes: '🛳️',
            invincible: '🛳️',
            sheffield: '⚓',
            conqueror: '🔱'
        }
    },
    air: {
        argentina: {
            skyhawk: '✈️',
            dagger: '🛩️',
            mirage: '✈️',
            pucara: '🛩️'
        },
        uk: {
            seaHarrier: '✈️',
            harrierGR3: '🛩️'
        }
    }
};

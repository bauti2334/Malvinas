// ==================== CONFIGURACIÓN DEL JUEGO ====================

const CONFIG = {
    // Recursos iniciales por facción
    initialResources: {
        argentina: {
            money: 8000,
            manpower: 12000,
            fuel: 10000,
            logistics: 100,
            political: 75,
            international: 40
        },
        uk: {
            money: 20000,
            manpower: 10000,
            fuel: 15000,
            logistics: 100,
            political: 85,
            international: 70
        }
    },
    
    // Costos por turno
    turnCosts: {
        argentina: {
            money: 150,
            fuel: 80,
            logistics: 3
        },
        uk: {
            money: 250,
            fuel: 120,
            logistics: 5
        }
    },
    
    // ==================== UNIDADES NAVALES ====================
    initialNavalUnits: {
        argentina: [
            { id: 'belgrano', name: 'ARA General Belgrano', fuel: 30, attack: 70, defense: 60, hp: 100, maxHp: 100, type: 'cruiser', movable: true, moved: false, isCarrier: false },
            { id: 'hercules', name: 'ARA Hércules', fuel: 25, attack: 50, defense: 55, hp: 80, maxHp: 80, type: 'destroyer', movable: true, moved: false, isCarrier: false },
            { id: 'veinticinco_mayo', name: 'ARA 25 de Mayo', fuel: 35, attack: 40, defense: 60, hp: 100, maxHp: 100, type: 'carrier', movable: true, moved: false, isCarrier: true, aircraftCapacity: 20, currentAircraft: [] },
            { id: 'sanLuis', name: 'Sub. ARA San Luis', fuel: 20, attack: 80, defense: 40, hp: 60, maxHp: 60, type: 'submarine', movable: true, moved: false, isCarrier: false }
        ],
        uk: [
            { id: 'hermes', name: 'HMS Hermes', fuel: 40, attack: 50, defense: 75, hp: 120, maxHp: 120, type: 'carrier', movable: true, moved: false, isCarrier: true, aircraftCapacity: 28, currentAircraft: [] },
            { id: 'invincible', name: 'HMS Invincible', fuel: 40, attack: 50, defense: 75, hp: 120, maxHp: 120, type: 'carrier', movable: true, moved: false, isCarrier: true, aircraftCapacity: 22, currentAircraft: [] },
            { id: 'sheffield', name: 'HMS Sheffield', fuel: 30, attack: 60, defense: 65, hp: 90, maxHp: 90, type: 'destroyer', movable: true, moved: false, isCarrier: false },
            { id: 'conqueror', name: 'Sub. HMS Conqueror', fuel: 25, attack: 90, defense: 45, hp: 70, maxHp: 70, type: 'submarine', movable: true, moved: false, isCarrier: false }
        ]
    },
    
    // Unidades navales comprables
    purchasableNavalUnits: {
        argentina: [
            { id: 'destroyer', name: 'Destructor Tipo 42', cost: 2500, fuel: 25, attack: 55, defense: 60, hp: 85, maxHp: 85, type: 'destroyer', movable: true, moved: false, isCarrier: false },
            { id: 'amphibious', name: 'Transporte Anfibio', cost: 1800, fuel: 20, attack: 20, defense: 40, hp: 70, maxHp: 70, type: 'amphibious', movable: true, moved: false, isCarrier: false, troopCapacity: 200, currentTroops: 0 }
        ],
        uk: [
            { id: 'destroyer', name: 'Destructor Type 42', cost: 3000, fuel: 30, attack: 65, defense: 70, hp: 95, maxHp: 95, type: 'destroyer', movable: true, moved: false, isCarrier: false },
            { id: 'amphibious', name: 'Landing Platform Dock', cost: 2200, fuel: 25, attack: 25, defense: 50, hp: 80, maxHp: 80, type: 'amphibious', movable: true, moved: false, isCarrier: false, troopCapacity: 250, currentTroops: 0 }
        ]
    },
    
    // ==================== UNIDADES AÉREAS ====================
    // Aviones que spawnearan en portaviones
    carrierAircraft: {
        argentina: [
            { id: 'super_etendard', name: 'Super Étendard', attack: 85, defense: 35, fuel: 40, missions: 0, maxMissions: 2, canAttackShips: true, canAttackGround: true, assignedCarrier: null }
        ],
        uk: [
            { id: 'seaHarrier', name: 'Sea Harrier FRS.1', attack: 85, defense: 50, fuel: 45, missions: 0, maxMissions: 3, canAttackShips: true, canAttackGround: true, assignedCarrier: null }
        ]
    },
    
    // Aviones terrestres comprables
    airUnits: {
        argentina: [
            { id: 'skyhawk', name: 'A-4 Skyhawk', cost: 1000, fuel: 50, attack: 75, defense: 30, missions: 0, maxMissions: 3, canAttackShips: true, canAttackGround: true },
            { id: 'dagger', name: 'IAI Dagger', cost: 1200, fuel: 45, attack: 70, defense: 35, missions: 0, maxMissions: 3, canAttackShips: true, canAttackGround: false },
            { id: 'mirage', name: 'Mirage III', cost: 1500, fuel: 60, attack: 80, defense: 40, missions: 0, maxMissions: 2, canAttackShips: false, canAttackGround: false },
            { id: 'pucara', name: 'Pucará IA-58', cost: 600, fuel: 30, attack: 40, defense: 25, missions: 0, maxMissions: 4, canAttackShips: false, canAttackGround: true }
        ],
        uk: [
            { id: 'harrierGR3', name: 'Harrier GR.3', cost: 1700, fuel: 50, attack: 75, defense: 45, missions: 0, maxMissions: 3, canAttackShips: true, canAttackGround: true }
        ]
    },
    
    // ==================== UNIDADES TERRESTRES ====================
    groundUnits: {
        argentina: [
            { id: 'infantry', name: 'Infantería', symbol: '⬛', cost: 150, attack: 40, defense: 50, manpower: 50, movable: true, moved: false },
            { id: 'marines', name: 'Infantería de Marina', symbol: '◆', cost: 200, attack: 50, defense: 55, manpower: 40, movable: true, moved: false, canAmphibious: true },
            { id: 'reg25', name: 'Regimiento 25', symbol: '▲', cost: 250, attack: 55, defense: 60, manpower: 35, movable: true, moved: false },
            { id: 'artillery', name: 'Artillería', symbol: '●', cost: 350, attack: 70, defense: 30, manpower: 20, movable: true, moved: false },
            { id: 'aa', name: 'Artillería Antiaérea', symbol: '✦', cost: 300, attack: 30, defense: 40, antiAir: 70, manpower: 25, movable: true, moved: false }
        ],
        uk: [
            { id: 'marines', name: 'Royal Marines', symbol: '⬛', cost: 250, attack: 65, defense: 60, manpower: 45, movable: true, moved: false, canAmphibious: true },
            { id: 'para', name: 'Parachute Regiment', symbol: '◆', cost: 300, attack: 70, defense: 55, manpower: 40, movable: true, moved: false, canAmphibious: true },
            { id: 'guards', name: 'Infantry Guards', symbol: '▲', cost: 230, attack: 60, defense: 65, manpower: 50, movable: true, moved: false },
            { id: 'artillery', name: 'Artillería Ligera', symbol: '●', cost: 320, attack: 65, defense: 35, manpower: 25, movable: true, moved: false },
            { id: 'sas', name: 'SAS', symbol: '★', cost: 500, attack: 90, defense: 70, manpower: 20, movable: true, moved: false, canAmphibious: true }
        ]
    },
    
    // ==================== ZONAS ESTRATÉGICAS ====================
    zones: [
        // Zonas terrestres
        { id: 'puerto_argentino', name: 'Puerto Argentino/Stanley', x: 820, y: 480, radius: 25, type: 'capital', controller: 'argentina', troops: 0, canDeploy: true },
        { id: 'goose_green', name: 'Goose Green', x: 600, y: 620, radius: 20, type: 'town', controller: 'argentina', troops: 0, canDeploy: true },
        { id: 'san_carlos', name: 'Bahía San Carlos', x: 420, y: 460, radius: 22, type: 'bay', controller: 'neutral', troops: 0, canDeploy: true, isLandingZone: true },
        { id: 'darwin', name: 'Darwin', x: 560, y: 640, radius: 18, type: 'town', controller: 'argentina', troops: 0, canDeploy: true },
        { id: 'mount_kent', name: 'Monte Kent', x: 700, y: 440, radius: 18, type: 'mountain', controller: 'argentina', troops: 0, canDeploy: true },
        { id: 'pradera_ganso', name: 'Pradera del Ganso', x: 500, y: 580, radius: 18, type: 'plains', controller: 'argentina', troops: 0, canDeploy: true },
        { id: 'puerto_howard', name: 'Puerto Howard', x: 280, y: 520, radius: 18, type: 'town', controller: 'argentina', troops: 0, canDeploy: true },
        
        // Zonas navales
        { id: 'naval_east', name: 'Zona Naval Este', x: 1000, y: 500, radius: 40, type: 'naval', controller: 'neutral', troops: 0, canDeploy: false },
        { id: 'naval_west', name: 'Zona Naval Oeste', x: 100, y: 500, radius: 40, type: 'naval', controller: 'neutral', troops: 0, canDeploy: false },
        { id: 'naval_north', name: 'Zona Naval Norte', x: 550, y: 200, radius: 40, type: 'naval', controller: 'neutral', troops: 0, canDeploy: false },
        { id: 'naval_south', name: 'Zona Naval Sur', x: 550, y: 800, radius: 40, type: 'naval', controller: 'neutral', troops: 0, canDeploy: false }
    ],
    
    // ==================== MAPA DE MALVINAS ====================
    map: {
        width: 1200,
        height: 1000,
        
        // Contorno detallado de las Islas Malvinas
        islands: [
            // Gran Malvina (Isla Oeste)
            {
                name: 'Gran Malvina',
                color: '#2d5016',
                borderColor: '#1a3010',
                points: [
                    {x: 220, y: 320}, {x: 260, y: 300}, {x: 300, y: 290}, {x: 340, y: 285},
                    {x: 380, y: 290}, {x: 420, y: 300}, {x: 460, y: 320},
                    {x: 490, y: 340}, {x: 510, y: 370}, {x: 520, y: 400}, {x: 525, y: 430},
                    {x: 530, y: 460}, {x: 535, y: 490}, {x: 540, y: 520},
                    {x: 535, y: 550}, {x: 525, y: 580}, {x: 510, y: 610}, {x: 490, y: 640},
                    {x: 460, y: 665}, {x: 420, y: 680}, {x: 380, y: 690}, {x: 340, y: 695},
                    {x: 300, y: 690}, {x: 260, y: 680}, {x: 220, y: 665},
                    {x: 180, y: 645}, {x: 150, y: 620}, {x: 130, y: 590}, {x: 120, y: 560},
                    {x: 115, y: 520}, {x: 120, y: 480}, {x: 130, y: 440}, {x: 145, y: 400},
                    {x: 160, y: 370}, {x: 180, y: 345}
                ]
            },
            
            // Isla Soledad (Isla Este)
            {
                name: 'Isla Soledad',
                color: '#2d5016',
                borderColor: '#1a3010',
                points: [
                    {x: 540, y: 380}, {x: 580, y: 365}, {x: 620, y: 355}, {x: 660, y: 350},
                    {x: 700, y: 352}, {x: 740, y: 360}, {x: 780, y: 375},
                    {x: 820, y: 395}, {x: 855, y: 420}, {x: 880, y: 450}, {x: 895, y: 485},
                    {x: 900, y: 520}, {x: 895, y: 555}, {x: 880, y: 590},
                    {x: 860, y: 620}, {x: 830, y: 645}, {x: 795, y: 665}, {x: 760, y: 680},
                    {x: 720, y: 690}, {x: 680, y: 695}, {x: 640, y: 695}, {x: 600, y: 690},
                    {x: 560, y: 680}, {x: 525, y: 665},
                    {x: 540, y: 630}, {x: 545, y: 595}, {x: 545, y: 560}, {x: 543, y: 525},
                    {x: 540, y: 490}, {x: 538, y: 455}, {x: 538, y: 420}
                ]
            }
        ],
        
        lakes: [
            { x: 350, y: 450, radius: 15, color: '#1e3a5f' },
            { x: 650, y: 520, radius: 20, color: '#1e3a5f' }
        ]
    },
    
    // ==================== CONFIGURADOR DE IMÁGENES ====================
    images: {
        naval: {
            default: {
                carrier: '🛳️',
                cruiser: '🚢',
                destroyer: '⚓',
                frigate: '⛴️',
                corvette: '🚤',
                submarine: '🔱',
                amphibious: '🚢'
            },
            custom: {}
        },
        
        air: {
            default: {
                fighter: '✈️',
                bomber: '🛩️',
                attack: '✈️'
            },
            custom: {}
        },
        
        ground: {
            default: {
                infantry: '⬛',
                marines: '◆',
                special: '▲',
                artillery: '●',
                aa: '✦',
                elite: '★'
            },
            custom: {}
        }
    },
    
    // ==================== CONFIGURACIÓN DE JUEGO ====================
    gameplay: {
        movementSpeed: {
            naval: 80,
            ground: 50
        },
        
        attackRange: {
            naval: 200,
            artillery: 150,
            infantry: 50
        },
        
        fogOfWar: false,
        
        reinforcement: {
            enabled: true,
            costMultiplier: 1.5,
            turnsToArrive: 1
        },
        
        // Desgaste por movimiento
        attrition: {
            naval: 5,  // HP perdido por movimiento
            ground: 0  // Las tropas no pierden HP al moverse
        }
    },
    
    victoryConditions: {
        territorialControl: 0.8,
        navalSupremacy: true,
        economicCollapse: true,
        turnLimit: 50
    }
};

// ==================== FUNCIONES AUXILIARES ====================
CONFIG.getUnitImage = function(type, subtype, unitId) {
    if (this.images[type].custom[unitId]) {
        return this.images[type].custom[unitId];
    }
    
    if (this.images[type].default[subtype]) {
        return this.images[type].default[subtype];
    }
    
    return '❓';
};

CONFIG.getGroundSymbol = function(unitId, faction) {
    const units = this.groundUnits[faction];
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.symbol : '⬛';
};

CONFIG.isValidPosition = function(x, y) {
    return x >= 0 && x <= this.map.width && y >= 0 && y <= this.map.height;
};

CONFIG.isLandPosition = function(x, y) {
    for (let island of this.map.islands) {
        if (this.pointInPolygon(x, y, island.points)) {
            return true;
        }
    }
    return false;
};

CONFIG.pointInPolygon = function(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// ==================== ESTADO DEL JUEGO ====================
let gameState = {
    phase: 'menu', // menu, playing, victory, defeat
    playerFaction: null,
    enemyFaction: null,
    turn: 1,
    selectedUnit: null,
    selectedZone: null,
    
    resources: {
        player: null,
        enemy: null
    },
    
    units: {
        player: {
            naval: [],
            air: [],
            ground: []
        },
        enemy: {
            naval: [],
            air: [],
            ground: []
        }
    },
    
    zones: [],
    combatLog: []
};

// ==================== CANVAS Y MAPA ====================
let canvas, ctx;
let mapOffsetX = 0;
let mapOffsetY = 0;
let mapScale = 1;

// ==================== INICIALIZACIÓN ====================
window.onload = function() {
    canvas = document.getElementById('map-canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners del canvas
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('wheel', handleZoom);
    
    drawMenu();
};

function resizeCanvas() {
    const container = document.getElementById('map-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (gameState.phase === 'playing') {
        drawMap();
    }
}

// ==================== INICIO DEL JUEGO ====================
function startGame(faction) {
    gameState.phase = 'playing';
    gameState.playerFaction = faction;
    gameState.enemyFaction = faction === 'argentina' ? 'uk' : 'argentina';
    gameState.turn = 1;
    
    // Inicializar recursos
    gameState.resources.player = { ...CONFIG.initialResources[faction] };
    gameState.resources.enemy = { ...CONFIG.initialResources[gameState.enemyFaction] };
    
    // Inicializar zonas
    gameState.zones = JSON.parse(JSON.stringify(CONFIG.zones));
    
    // Si es Argentina, empieza con tropas en las islas
    if (faction === 'argentina') {
        gameState.zones.find(z => z.id === 'puerto_argentino').troops = 50;
        gameState.zones.find(z => z.id === 'puerto_argentino').controller = 'argentina';
        gameState.zones.find(z => z.id === 'goose_green').troops = 30;
        gameState.zones.find(z => z.id === 'goose_green').controller = 'argentina';
        gameState.zones.find(z => z.id === 'darwin').troops = 20;
        gameState.zones.find(z => z.id === 'darwin').controller = 'argentina';
    }
    
    // Inicializar unidades navales (posiciones iniciales)
    const playerNaval = CONFIG.initialNavalUnits[faction].map((u, i) => ({
        ...u,
        x: 500 + (i * 80) - 120,
        y: faction === 'argentina' ? 700 : 100,
        owner: 'player'
    }));
    
    const enemyNaval = CONFIG.initialNavalUnits[gameState.enemyFaction].map((u, i) => ({
        ...u,
        x: 500 + (i * 80) - 120,
        y: gameState.enemyFaction === 'argentina' ? 700 : 100,
        owner: 'enemy'
    }));
    
    gameState.units.player.naval = playerNaval;
    gameState.units.enemy.naval = enemyNaval;
    
    // Inicializar unidades aéreas y terrestres disponibles
    gameState.units.player.air = CONFIG.airUnits[faction].map(u => ({ ...u, qty: 0 }));
    gameState.units.player.ground = CONFIG.groundUnits[faction].map(u => ({ ...u, qty: 0 }));
    gameState.units.enemy.air = CONFIG.airUnits[gameState.enemyFaction].map(u => ({ ...u, qty: 0 }));
    gameState.units.enemy.ground = CONFIG.groundUnits[gameState.enemyFaction].map(u => ({ ...u, qty: 0 }));
    
    // Ocultar menú, mostrar juego
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').classList.add('active');
    
    updateUI();
    drawMap();
    
    addLog(`🎮 Turno 1 - ${faction === 'argentina' ? '🇦🇷 Argentina' : '🇬🇧 Reino Unido'} comienza la campaña`);
    setMessage(`Turno 1 - ${faction === 'argentina' ? '🇦🇷 Argentina' : '🇬🇧 Reino Unido'}`);
}

// ==================== ACTUALIZAR INTERFAZ ====================
function updateUI() {
    // Recursos
    document.getElementById('res-money').textContent = gameState.resources.player.money.toLocaleString();
    document.getElementById('res-manpower').textContent = gameState.resources.player.manpower.toLocaleString();
    document.getElementById('res-fuel').textContent = gameState.resources.player.fuel.toLocaleString();
    document.getElementById('res-logistics').textContent = gameState.resources.player.logistics;
    document.getElementById('res-political').textContent = gameState.resources.player.political;
    document.getElementById('res-international').textContent = gameState.resources.player.international;
    
    // Turno
    document.getElementById('turn-number').textContent = gameState.turn;
    
    // Flota del jugador
    updateFleetList();
    
    // Ejército del jugador
    updateArmyList();
}

function updateFleetList() {
    const fleetList = document.getElementById('fleet-list');
    fleetList.innerHTML = '';
    
    gameState.units.player.naval.forEach(ship => {
        const div = document.createElement('div');
        div.className = 'fleet-item';
        div.innerHTML = `
            <span>${CONFIG.navalSymbols[ship.type]} ${ship.name}</span>
            <span style="color: ${ship.hp > 50 ? '#22c55e' : ship.hp > 25 ? '#ffc107' : '#dc2626'}">${ship.hp}/${ship.maxHp} HP</span>
        `;
        fleetList.appendChild(div);
    });
}

function updateArmyList() {
    const armyList = document.getElementById('army-list');
    armyList.innerHTML = '';
    
    gameState.units.player.ground.forEach(unit => {
        if (unit.qty > 0) {
            const div = document.createElement('div');
            div.className = 'army-item';
            div.innerHTML = `
                <span>${unit.symbol} ${unit.name}</span>
                <span style="color: #22c55e">x${unit.qty}</span>
            `;
            armyList.appendChild(div);
        }
    });
    
    if (gameState.units.player.ground.every(u => u.qty === 0)) {
        armyList.innerHTML = '<p style="color: #64748b; text-align: center;">Sin unidades terrestres</p>';
    }
}

function setMessage(msg) {
    document.getElementById('status-message').textContent = msg;
}

function addLog(msg) {
    gameState.combatLog.push(msg);
    const logContent = document.getElementById('log-content');
    const p = document.createElement('p');
    p.textContent = msg;
    logContent.insertBefore(p, logContent.firstChild);
    
    // Mantener solo últimos 20 mensajes
    while (logContent.children.length > 20) {
        logContent.removeChild(logContent.lastChild);
    }
}

// ==================== DIBUJAR MAPA ====================
function drawMap() {
    // Limpiar canvas
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(mapOffsetX, mapOffsetY);
    ctx.scale(mapScale, mapScale);
    
    // Dibujar islas
    CONFIG.map.islands.forEach(island => {
        ctx.fillStyle = island.color;
        ctx.strokeStyle = '#1a3010';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(island.points[0].x, island.points[0].y);
        for (let i = 1; i < island.points.length; i++) {
            ctx.lineTo(island.points[i].x, island.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
    
    // Dibujar zonas estratégicas
    gameState.zones.forEach(zone => {
        // Color según controlador
        let color = '#888';
        if (zone.controller === 'argentina') color = '#4a9eff';
        if (zone.controller === 'uk') color = '#ff4a4a';
        
        const radius = zone.type === 'naval' ? 30 : 15;
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Nombre de la zona
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, zone.x, zone.y - radius - 10);
        
        // Tropas si tiene
        if (zone.troops > 0) {
            ctx.fillStyle = '#ffc107';
            ctx.font = 'bold 12px Courier New';
            ctx.fillText(`${zone.troops} 👥`, zone.x, zone.y + radius + 20);
        }
    });
    
    // Dibujar unidades navales del jugador
    gameState.units.player.naval.forEach(ship => {
        const symbol = CONFIG.navalSymbols[ship.type];
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, ship.x, ship.y);
        
        // Barra de HP
        const hpPercent = ship.hp / ship.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#ffc107' : '#dc2626';
        ctx.fillRect(ship.x - 20, ship.y + 15, 40 * hpPercent, 5);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(ship.x - 20, ship.y + 15, 40, 5);
        
        // Resaltar si está seleccionado
        if (gameState.selectedUnit && gameState.selectedUnit.unit === ship) {
            ctx.strokeStyle = '#ffc107';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(ship.x, ship.y, 40, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    
    // Dibujar unidades navales enemigas
    gameState.units.enemy.naval.forEach(ship => {
        const symbol = CONFIG.navalSymbols[ship.type];
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.7;
        ctx.fillText(symbol, ship.x, ship.y);
        ctx.globalAlpha = 1;
        
        // Barra de HP
        const hpPercent = ship.hp / ship.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#ffc107' : '#dc2626';
        ctx.fillRect(ship.x - 20, ship.y + 15, 40 * hpPercent, 5);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(ship.x - 20, ship.y + 15, 40, 5);
    });
    
    ctx.restore();
}

// ==================== INTERACCIÓN CON EL MAPA ====================
let isDragging = false;
let lastX, lastY;

function startDrag(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
}

function drag(e) {
    if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        mapOffsetX += dx;
        mapOffsetY += dy;
        lastX = e.clientX;
        lastY = e.clientY;
        drawMap();
    }
}

function endDrag() {
    isDragging = false;
}

function handleZoom(e) {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    mapScale = Math.max(0.5, Math.min(2, mapScale + delta));
    drawMap();
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - mapOffsetX) / mapScale;
    const y = (e.clientY - rect.top - mapOffsetY) / mapScale;
    
    // Verificar click en unidades navales del jugador
    for (let ship of gameState.units.player.naval) {
        const dist = Math.sqrt((x - ship.x) ** 2 + (y - ship.y) ** 2);
        if (dist < 40) {
            selectUnit('naval', ship, 'player');
            drawMap();
            return;
        }
    }
    
    // Verificar click en zonas
    for (let zone of gameState.zones) {
        const radius = zone.type === 'naval' ? 30 : 15;
        const dist = Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2);
        if (dist < radius) {
            selectZone(zone);
            return;
        }
    }
    
    // Deseleccionar
    gameState.selectedUnit = null;
    gameState.selectedZone = null;
    document.getElementById('unit-info').style.display = 'none';
    document.getElementById('zone-info').style.display = 'none';
    drawMap();
}

function selectUnit(type, unit, owner) {
    gameState.selectedUnit = { type, unit, owner };
    gameState.selectedZone = null;
    
    const unitInfo = document.getElementById('unit-info');
    const unitDetails = document.getElementById('unit-details');
    unitInfo.style.display = 'block';
    document.getElementById('zone-info').style.display = 'none';
    
    unitDetails.innerHTML = `
        <p><strong>${owner === 'player' ? '👤 Tu Unidad' : '🤖 Unidad Enemiga'}</strong></p>
        <p><strong>${unit.name}</strong></p>
        <p>HP: ${unit.hp}/${unit.maxHp}</p>
        <p>Ataque: ${unit.attack}</p>
        <p>Defensa: ${unit.defense}</p>
        <p>Combustible/turno: ${unit.fuel}</p>
    `;
}

function selectZone(zone) {
    gameState.selectedZone = zone;
    gameState.selectedUnit = null;
    
    const zoneInfo = document.getElementById('zone-info');
    const zoneDetails = document.getElementById('zone-details');
    zoneInfo.style.display = 'block';
    document.getElementById('unit-info').style.display = 'none';
    
    let controllerText = 'Neutral';
    if (zone.controller === 'argentina') controllerText = '🇦🇷 Argentina';
    if (zone.controller === 'uk') controllerText = '🇬🇧 Reino Unido';
    
    zoneDetails.innerHTML = `
        <p><strong>${zone.name}</strong></p>
        <p>Tipo: ${zone.type}</p>
        <p>Control: ${controllerText}</p>
        ${zone.troops > 0 ? `<p>Tropas: ${zone.troops} 👥</p>` : ''}
    `;
}

// ==================== TIENDA ====================
function toggleShop() {
    const modal = document.getElementById('shop-modal');
    modal.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
        populateShop();
    }
}

function populateShop() {
    // Unidades terrestres
    const groundShop = document.getElementById('shop-ground');
    groundShop.innerHTML = '';
    CONFIG.groundUnits[gameState.playerFaction].forEach(unit => {
        groundShop.innerHTML += createShopItem(unit, 'ground');
    });
    
    // Unidades aéreas
    const airShop = document.getElementById('shop-air');
    airShop.innerHTML = '';
    CONFIG.airUnits[gameState.playerFaction].forEach(unit => {
        airShop.innerHTML += createShopItem(unit, 'air');
    });
    
    // Unidades navales
    const navalShop = document.getElementById('shop-naval');
    navalShop.innerHTML = '';
    CONFIG.purchasableNavalUnits[gameState.playerFaction].forEach(unit => {
        navalShop.innerHTML += createShopItem(unit, 'naval');
    });
}

function createShopItem(unit, type) {
    const canAfford = gameState.resources.player.money >= unit.cost;
    return `
        <div class="shop-item">
            <div class="shop-item-header">
                <div>
                    <div class="shop-item-name">${type === 'ground' ? unit.symbol : ''} ${unit.name}</div>
                    <div class="shop-item-stats">Atq: ${unit.attack} | Def: ${unit.defense}</div>
                </div>
                <div class="shop-item-price">$${unit.cost}</div>
            </div>
            <button onclick="buyUnit('${type}', '${unit.id}')" ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'COMPRAR' : 'FONDOS INSUFICIENTES'}
            </button>
        </div>
    `;
}

function buyUnit(type, unitId) {
    let unit;
    if (type === 'ground') {
        unit = CONFIG.groundUnits[gameState.playerFaction].find(u => u.id === unitId);
    } else if (type === 'air') {
        unit = CONFIG.airUnits[gameState.playerFaction].find(u => u.id === unitId);
    } else if (type === 'naval') {
        unit = CONFIG.purchasableNavalUnits[gameState.playerFaction].find(u => u.id === unitId);
    }
    
    if (!unit || gameState.resources.player.money < unit.cost) {
        addLog('❌ Fondos insuficientes');
        return;
    }
    
    gameState.resources.player.money -= unit.cost;
    
    if (type === 'ground') {
        const playerUnit = gameState.units.player.ground.find(u => u.id === unitId);
        playerUnit.qty++;
    } else if (type === 'air') {
        const playerUnit = gameState.units.player.air.find(u => u.id === unitId);
        playerUnit.qty++;
    } else if (type === 'naval') {
        // Agregar barco a la flota
        const newShip = {
            ...unit,
            x: 500 + gameState.units.player.naval.length * 60,
            y: gameState.playerFaction === 'argentina' ? 700 : 100,
            owner: 'player'
        };
        gameState.units.player.naval.push(newShip);
    }
    
    addLog(`✅ Comprado: ${unit.name}`);
    updateUI();
    populateShop();
    drawMap();
}

// ==================== FIN DE TURNO ====================
function endTurn() {
    // Consumir recursos
    gameState.resources.player.money -= CONFIG.turnCosts.money;
    gameState.resources.player.fuel -= CONFIG.turnCosts.fuel;
    gameState.resources.player.logistics -= CONFIG.turnCosts.logistics;
    
    // Verificar condiciones de victoria/derrota
    if (checkVictoryConditions()) {
        return;
    }
    
    gameState.turn++;
    setMessage(`Turno ${gameState.turn} - IA pensando...`);
    document.getElementById('end-turn-btn').disabled = true;
    
    updateUI();
    
    // Ejecutar turno de la IA
    setTimeout(() => {
        executeAITurn();
        setMessage(`Turno ${gameState.turn} - Tu turno`);
        document.getElementById('end-turn-btn').disabled = false;
        updateUI();
        drawMap();
    }, 1500);
}

// ==================== CONDICIONES DE VICTORIA ====================
function checkVictoryConditions() {
    // Derrota por colapso económico
    if (gameState.resources.player.money <= 0 || gameState.resources.player.fuel <= 0) {
        endGame('defeat', 'Colapso económico - Sin recursos');
        return true;
    }
    
    if (gameState.resources.enemy.money <= 0 || gameState.resources.enemy.fuel <= 0) {
        endGame('victory', 'Victoria - El enemigo colapsó económicamente');
        return true;
    }
    
    // Victoria por control territorial
    const landZones = gameState.zones.filter(z => z.type !== 'naval');
    const playerControlled = landZones.filter(z => z.controller === gameState.playerFaction).length;
    const enemyControlled = landZones.filter(z => z.controller === gameState.enemyFaction).length;
    
    if (playerControlled === landZones.length) {
        endGame('victory', 'Victoria - Control total de las Malvinas');
        return true;
    }
    
    if (enemyControlled === landZones.length) {
        endGame('defeat', 'Derrota - El enemigo controla todas las islas');
        return true;
    }
    
    // Derrota por aniquilación
    if (gameState.units.player.naval.length === 0) {
        endGame('defeat', 'Derrota - Flota destruida');
        return true;
    }
    
    if (gameState.units.enemy.naval.length === 0) {
        endGame('victory', 'Victoria - Flota enemiga destruida');
        return true;
    }
    
    return false;
}

function endGame(result, message) {
    const modal = document.getElementById('end-game-modal');
    const title = document.getElementById('end-game-title');
    const msg = document.getElementById('end-game-message');
    const turns = document.getElementById('end-game-turns');
    
    if (result === 'victory') {
        title.textContent = '🏆 VICTORIA';
        title.className = 'victory';
    } else {
        title.textContent = '💀 DERROTA';
        title.className = 'defeat';
    }
    
    msg.textContent = message;
    turns.textContent = `Turnos jugados: ${gameState.turn}`;
    
    modal.classList.add('active');
}

function drawMenu() {
    // Este método ya no es necesario con la versión HTML
}

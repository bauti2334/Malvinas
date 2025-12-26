// ==================== ESTADO DEL JUEGO ====================
let gameState = {
    phase: 'loading', // loading, menu, playing, victory, defeat
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
    combatLog: [],
    territoryControl: {
        player: 0,
        enemy: 0,
        neutral: 0
    },
    
    losses: {
        player: 0,
        enemy: 0
    }
};

// ==================== CANVAS Y MAPA ====================
let canvas, ctx;
let mapOffsetX = 0;
let mapOffsetY = 0;
let mapScale = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// ==================== INICIALIZACIÓN ====================
window.onload = function() {
    // Simular carga
    simulateLoading();
};

function simulateLoading() {
    let progress = 0;
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');
    
    const messages = [
        'Cargando mapa del Atlántico Sur...',
        'Inicializando fuerzas armadas...',
        'Preparando sistemas de combate...',
        'Configurando IA enemiga...',
        '¡Listo para comenzar!'
    ];
    
    const loadingInterval = setInterval(() => {
        progress += 2;
        loadingBar.style.width = progress + '%';
        
        const messageIndex = Math.floor(progress / 20);
        if (messages[messageIndex]) {
            loadingText.textContent = messages[messageIndex];
        }
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('menu-screen').style.display = 'flex';
                gameState.phase = 'menu';
            }, 500);
        }
    }, 50);
}

function initCanvas() {
    canvas = document.getElementById('map-canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Centrar mapa en las islas
    centerMapOnIslands();
    
    // Event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('wheel', handleZoom, { passive: false });
    
    // Iniciar loop de renderizado
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const container = document.getElementById('map-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function centerMapOnIslands() {
    // Centrar en el centro aproximado de las Malvinas
    mapOffsetX = canvas.width / 2 - (CONFIG.map.width / 2) * mapScale;
    mapOffsetY = canvas.height / 2 - (CONFIG.map.height / 2) * mapScale;
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
    
    // Argentina empieza controlando las islas
    if (faction === 'argentina') {
        gameState.zones.forEach(zone => {
            if (zone.type !== 'naval') {
                zone.controller = 'argentina';
                // Desplegar tropas iniciales
                if (zone.id === 'puerto_argentino') {
                    zone.troops = 80;
                } else if (zone.id === 'goose_green' || zone.id === 'darwin') {
                    zone.troops = 40;
                } else if (zone.canDeploy) {
                    zone.troops = 25;
                }
            }
        });
    } else {
        // UK tiene que recuperar las islas
        gameState.zones.forEach(zone => {
            if (zone.type !== 'naval') {
                zone.controller = 'argentina';
                if (zone.id === 'puerto_argentino') {
                    zone.troops = 80;
                } else if (zone.canDeploy) {
                    zone.troops = 35;
                }
            }
        });
    }
    
    // Inicializar unidades navales
    const playerNaval = CONFIG.initialNavalUnits[faction].map((u, i) => {
        const ship = {
            ...JSON.parse(JSON.stringify(u)),
            x: 100 + (i * 90),
            y: faction === 'argentina' ? 850 : 150,
            owner: 'player',
            moved: false
        };
        
        // Inicializar portaviones con aviones
        if (ship.isCarrier) {
            ship.currentAircraft = [];
            const aircraftTypes = CONFIG.carrierAircraft[faction];
            
            if (aircraftTypes && aircraftTypes.length > 0) {
                const aircraftType = aircraftTypes[0];
                const initialCount = Math.floor(ship.aircraftCapacity * 0.5); // 50% capacidad inicial
                
                for (let j = 0; j < initialCount; j++) {
                    const aircraft = {
                        ...JSON.parse(JSON.stringify(aircraftType)),
                        id: `aircraft_${faction}_${i}_${j}`,
                        assignedCarrier: ship.id,
                        x: ship.x,
                        y: ship.y,
                        inFlight: false,
                        missions: 0
                    };
                    ship.currentAircraft.push(aircraft);
                }
            }
        }
        
        // Inicializar anfibios
        if (ship.type === 'amphibious') {
            ship.currentTroops = 0;
        }
        
        return ship;
    });
    
    const enemyNaval = CONFIG.initialNavalUnits[gameState.enemyFaction].map((u, i) => {
        const ship = {
            ...JSON.parse(JSON.stringify(u)),
            x: 100 + (i * 90),
            y: gameState.enemyFaction === 'argentina' ? 850 : 150,
            owner: 'enemy',
            moved: false
        };
        
        // Inicializar portaviones enemigos
        if (ship.isCarrier) {
            ship.currentAircraft = [];
            const aircraftTypes = CONFIG.carrierAircraft[gameState.enemyFaction];
            
            if (aircraftTypes && aircraftTypes.length > 0) {
                const aircraftType = aircraftTypes[0];
                const initialCount = Math.floor(ship.aircraftCapacity * 0.5);
                
                for (let j = 0; j < initialCount; j++) {
                    const aircraft = {
                        ...JSON.parse(JSON.stringify(aircraftType)),
                        id: `aircraft_${gameState.enemyFaction}_${i}_${j}`,
                        assignedCarrier: ship.id,
                        x: ship.x,
                        y: ship.y,
                        inFlight: false,
                        missions: 0
                    };
                    ship.currentAircraft.push(aircraft);
                }
            }
        }
        
        if (ship.type === 'amphibious') {
            ship.currentTroops = 0;
        }
        
        return ship;
    });
    
    gameState.units.player.naval = playerNaval;
    gameState.units.enemy.naval = enemyNaval;
    
    // Inicializar unidades aéreas y terrestres (0 al inicio, se compran)
    gameState.units.player.air = CONFIG.airUnits[faction].map(u => ({ ...JSON.parse(JSON.stringify(u)), qty: 0 }));
    gameState.units.player.ground = CONFIG.groundUnits[faction].map(u => ({ ...JSON.parse(JSON.stringify(u)), qty: 0, units: [] }));
    gameState.units.enemy.air = CONFIG.airUnits[gameState.enemyFaction].map(u => ({ ...JSON.parse(JSON.stringify(u)), qty: 0 }));
    gameState.units.enemy.ground = CONFIG.groundUnits[gameState.enemyFaction].map(u => ({ ...JSON.parse(JSON.stringify(u)), qty: 0, units: [] }));
    
    // Ocultar menú, mostrar juego
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    
    // Inicializar canvas
    initCanvas();
    
    // Actualizar UI
    updateUI();
    updateTerritoryControl();
    
    // Mostrar indicador de facción
    const indicator = document.getElementById('faction-indicator');
    indicator.textContent = faction === 'argentina' ? '🇦🇷' : '🇬🇧';
    
    addLog(`🎮 Turno 1 - ${faction === 'argentina' ? '🇦🇷 Argentina' : '🇬🇧 Reino Unido'} comienza`);
    setMessage(`Turno 1 - ${faction === 'argentina' ? 'Argentina defiende las Malvinas' : 'Reino Unido debe recuperar las islas'}`);
}

// ==================== GAME LOOP ====================
function gameLoop() {
    if (gameState.phase === 'playing') {
        drawMap();
    }
    requestAnimationFrame(gameLoop);
}

// ==================== DIBUJAR MAPA ====================
function drawMap() {
    // Limpiar canvas
    ctx.fillStyle = '#0f1620';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(mapOffsetX, mapOffsetY);
    ctx.scale(mapScale, mapScale);
    
    // Dibujar islas
    CONFIG.map.islands.forEach(island => {
        ctx.fillStyle = island.color;
        ctx.strokeStyle = island.borderColor;
        ctx.lineWidth = 3 / mapScale;
        
        ctx.beginPath();
        island.points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
    
    // Dibujar lagos
    if (CONFIG.map.lakes) {
        CONFIG.map.lakes.forEach(lake => {
            ctx.fillStyle = lake.color;
            ctx.beginPath();
            ctx.arc(lake.x, lake.y, lake.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Dibujar zonas estratégicas
    gameState.zones.forEach(zone => {
        drawZone(zone);
    });
    
    // Dibujar unidades navales
    [...gameState.units.player.naval, ...gameState.units.enemy.naval].forEach(ship => {
        drawNavalUnit(ship);
    });
    
    // Dibujar unidades terrestres
    gameState.units.player.ground.forEach(unitType => {
        unitType.units.forEach(unit => {
            drawGroundUnit(unit, 'player');
        });
    });
    
    gameState.units.enemy.ground.forEach(unitType => {
        unitType.units.forEach(unit => {
            drawGroundUnit(unit, 'enemy');
        });
    });
    
    // Dibujar aviones en portaviones (pequeños indicadores)
    [...gameState.units.player.naval, ...gameState.units.enemy.naval].forEach(ship => {
        if (ship.isCarrier && ship.currentAircraft && ship.currentAircraft.length > 0) {
            ctx.fillStyle = ship.owner === 'player' ? '#00aaff' : '#ff8800';
            ctx.font = `bold ${10 / mapScale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`✈${ship.currentAircraft.length}`, ship.x, ship.y - 35 / mapScale);
        }
    });
    
    ctx.restore();
}

function drawZone(zone) {
    // Color según controlador
    let fillColor = 'rgba(128, 128, 128, 0.3)';
    let strokeColor = '#888';
    
    if (zone.controller === gameState.playerFaction) {
        fillColor = gameState.playerFaction === 'argentina' ? 'rgba(116, 172, 223, 0.4)' : 'rgba(207, 20, 43, 0.4)';
        strokeColor = gameState.playerFaction === 'argentina' ? '#74acdf' : '#cf142b';
    } else if (zone.controller === gameState.enemyFaction) {
        fillColor = gameState.enemyFaction === 'argentina' ? 'rgba(116, 172, 223, 0.4)' : 'rgba(207, 20, 43, 0.4)';
        strokeColor = gameState.enemyFaction === 'argentina' ? '#74acdf' : '#cf142b';
    }
    
    // Dibujar círculo de zona
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3 / mapScale;
    
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Resaltar si está seleccionada
    if (gameState.selectedZone && gameState.selectedZone.id === zone.id) {
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 5 / mapScale;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Nombre de la zona
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${14 / mapScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(zone.name, zone.x, zone.y - zone.radius - 10);
    
    // Mostrar tropas si tiene
    if (zone.troops > 0) {
        ctx.fillStyle = '#ffa500';
        ctx.font = `bold ${12 / mapScale}px Arial`;
        ctx.fillText(`👥 ${zone.troops}`, zone.x, zone.y + zone.radius + 20);
    }
}

function drawNavalUnit(ship) {
    const symbol = CONFIG.getUnitImage('naval', ship.type, ship.id);
    
    // Dibujar símbolo
    ctx.font = `${32 / mapScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Opacidad para enemigos
    if (ship.owner === 'enemy') {
        ctx.globalAlpha = 0.8;
    }
    
    ctx.fillText(symbol, ship.x, ship.y);
    ctx.globalAlpha = 1;
    
    // Barra de HP
    const hpPercent = ship.hp / ship.maxHp;
    const barWidth = 40 / mapScale;
    const barHeight = 5 / mapScale;
    const barX = ship.x - barWidth / 2;
    const barY = ship.y + 25 / mapScale;
    
    ctx.fillStyle = hpPercent > 0.7 ? '#00ff00' : hpPercent > 0.3 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1 / mapScale;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Resaltar si está seleccionada
    if (gameState.selectedUnit && gameState.selectedUnit.unit.id === ship.id && gameState.selectedUnit.owner === ship.owner) {
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 4 / mapScale;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, 35 / mapScale, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawGroundUnit(unit, owner) {
    // Dibujar símbolo militar
    ctx.font = `bold ${24 / mapScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = owner === 'player' ? 
        (gameState.playerFaction === 'argentina' ? '#74acdf' : '#cf142b') :
        (gameState.enemyFaction === 'argentina' ? '#74acdf' : '#cf142b');
    
    ctx.fillText(unit.symbol, unit.x, unit.y);
    
    // Resaltar si está seleccionada
    if (gameState.selectedUnit && gameState.selectedUnit.unit === unit) {
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 3 / mapScale;
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, 20 / mapScale, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ==================== INTERACCIÓN CON EL MAPA ====================
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    isDragging = true;
    dragStartX = mouseX - mapOffsetX;
    dragStartY = mouseY - mapOffsetY;
}

function handleMouseMove(e) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        mapOffsetX = mouseX - dragStartX;
        mapOffsetY = mouseY - dragStartY;
    }
}

function handleMouseUp() {
    isDragging = false;
}

function handleCanvasClick(e) {
    if (isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - mapOffsetX) / mapScale;
    const mouseY = (e.clientY - rect.top - mapOffsetY) / mapScale;
    
    // Si hay un avión seleccionado para misión, atacar
    if (selectedAircraftForMission) {
        // Verificar click en barco enemigo
        for (let ship of gameState.units.enemy.naval) {
            const dist = Math.hypot(mouseX - ship.x, mouseY - ship.y);
            if (dist < 35) {
                launchAirStrike(selectedAircraftForMission, ship.id, 'naval');
                selectedAircraftForMission = null;
                setMessage('');
                return;
            }
        }
        
        // Verificar click en zona terrestre
        for (let zone of gameState.zones) {
            if (zone.type !== 'naval') {
                const dist = Math.hypot(mouseX - zone.x, mouseY - zone.y);
                if (dist < zone.radius) {
                    launchAirStrike(selectedAircraftForMission, zone.id, 'ground');
                    selectedAircraftForMission = null;
                    setMessage('');
                    return;
                }
            }
        }
        
        addLog('❌ Click en un objetivo válido (barco o zona terrestre)');
        return;
    }
    
    // Si hay una unidad seleccionada y es movible, intentar moverla
    if (gameState.selectedUnit && gameState.selectedUnit.movable && !gameState.selectedUnit.unit.moved) {
        moveSelectedUnit(mouseX, mouseY);
        return;
    }
    
    // Verificar click en unidades navales del jugador
    for (let ship of gameState.units.player.naval) {
        const dist = Math.hypot(mouseX - ship.x, mouseY - ship.y);
        if (dist < 35) {
            selectUnit(ship, 'player', 'naval');
            return;
        }
    }
    
    // Verificar click en unidades terrestres del jugador
    for (let unitType of gameState.units.player.ground) {
        for (let unit of unitType.units) {
            const dist = Math.hypot(mouseX - unit.x, mouseY - unit.y);
            if (dist < 20) {
                selectUnit(unit, 'player', 'ground');
                return;
            }
        }
    }
    
    // Verificar click en zonas
    for (let zone of gameState.zones) {
        const dist = Math.hypot(mouseX - zone.x, mouseY - zone.y);
        if (dist < zone.radius) {
            selectZone(zone);
            return;
        }
    }
    
    // Deseleccionar
    deselectAll();
    selectedAircraftForMission = null;
}

function handleZoom(e) {
    e.preventDefault();
    
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    const newScale = Math.max(0.5, Math.min(2, mapScale + delta));
    
    // Zoom hacia el cursor
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - mapOffsetX) / mapScale;
    const worldY = (mouseY - mapOffsetY) / mapScale;
    
    mapScale = newScale;
    
    mapOffsetX = mouseX - worldX * mapScale;
    mapOffsetY = mouseY - worldY * mapScale;
}

function resetMapView() {
    mapScale = 1;
    centerMapOnIslands();
}

function zoomIn() {
    mapScale = Math.min(2, mapScale + 0.2);
}

function zoomOut() {
    mapScale = Math.max(0.5, mapScale - 0.2);
}

// ==================== SELECCIÓN ====================
function selectUnit(unit, owner, type) {
    gameState.selectedUnit = { unit, owner, type, movable: unit.movable };
    gameState.selectedZone = null;
    
    showUnitPanel(unit, owner, type);
    document.getElementById('zone-panel').style.display = 'none';
}

function selectZone(zone) {
    gameState.selectedZone = zone;
    gameState.selectedUnit = null;
    
    showZonePanel(zone);
    document.getElementById('unit-panel').style.display = 'none';
}

function deselectAll() {
    gameState.selectedUnit = null;
    gameState.selectedZone = null;
    document.getElementById('unit-panel').style.display = 'none';
    document.getElementById('zone-panel').style.display = 'none';
}

function showUnitPanel(unit, owner, type) {
    const panel = document.getElementById('unit-panel');
    const details = document.getElementById('unit-details');
    const actions = document.getElementById('unit-actions');
    
    panel.style.display = 'block';
    
    let detailsHTML = `
        <p><strong>${owner === 'player' ? '👤 Tu unidad' : '🤖 Unidad enemiga'}</strong></p>
        <p class="unit-name">${unit.name}</p>
        ${type === 'naval' ? `<p>HP: ${unit.hp}/${unit.maxHp}</p>` : ''}
        <p>Ataque: ${unit.attack}</p>
        <p>Defensa: ${unit.defense}</p>
        <p>Combustible/turno: ${unit.fuel || 'N/A'}</p>
        ${unit.moved ? '<p style="color: #ffaa00;">⚠️ Ya movido este turno</p>' : ''}
    `;
    
    // Info adicional para portaviones
    if (unit.isCarrier) {
        detailsHTML += `
            <hr style="margin: 10px 0; border-color: #444;">
            <p><strong>✈️ PORTAVIONES</strong></p>
            <p>Aviones: ${unit.currentAircraft ? unit.currentAircraft.length : 0}/${unit.aircraftCapacity}</p>
        `;
    }
    
    // Info adicional para anfibios
    if (unit.type === 'amphibious') {
        detailsHTML += `
            <hr style="margin: 10px 0; border-color: #444;">
            <p><strong>🚢 TRANSPORTE ANFIBIO</strong></p>
            <p>Tropas: ${unit.currentTroops || 0}/${unit.troopCapacity}</p>
        `;
    }
    
    details.innerHTML = detailsHTML;
    
    actions.innerHTML = '';
    
    if (owner === 'player') {
        let actionsHTML = '';
        
        // Movimiento
        if (unit.movable && !unit.moved) {
            actionsHTML += `
                <p style="color: #ffa500; margin-top: 10px;">
                    ℹ️ Haz click en el mapa para mover esta unidad
                </p>
            `;
        }
        
        // Portaviones
        if (unit.isCarrier) {
            actionsHTML += `
                <button onclick="spawnAircraftOnCarrier('${unit.id}')" style="width: 100%; margin-top: 10px;">
                    ✈️ Desplegar Avión ($500)
                </button>
            `;
            
            if (unit.currentAircraft && unit.currentAircraft.length > 0) {
                actionsHTML += `<div style="margin-top: 10px;"><strong>Aviones embarcados:</strong></div>`;
                unit.currentAircraft.forEach(aircraft => {
                    actionsHTML += `
                        <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>${aircraft.name}</span>
                                <span style="color: #00aaff;">Misiones: ${aircraft.missions}/${aircraft.maxMissions}</span>
                            </div>
                            ${aircraft.missions < aircraft.maxMissions ? `
                                <button onclick="selectAircraftForMission('${aircraft.id}')" style="width: 100%; margin-top: 5px; padding: 5px; font-size: 0.85rem;">
                                    🎯 Lanzar Misión
                                </button>
                            ` : '<p style="color: #888; font-size: 0.8rem;">Sin misiones disponibles</p>'}
                        </div>
                    `;
                });
            }
        }
        
        // Anfibios
        if (unit.type === 'amphibious') {
            if (unit.currentTroops < unit.troopCapacity) {
                actionsHTML += `
                    <button onclick="loadTroopsOnShip('${unit.id}')" style="width: 100%; margin-top: 10px;">
                        📦 Cargar Tropas
                    </button>
                `;
            }
            
            if (unit.currentTroops > 0) {
                actionsHTML += `
                    <button onclick="executeAmphibiousLanding('${unit.id}')" style="width: 100%; margin-top: 10px; background: linear-gradient(145deg, #dc2626, #991b1b);">
                        🏖️ DESEMBARCO ANFIBIO
                    </button>
                `;
            }
        }
        
        actions.innerHTML = actionsHTML;
    }
}

function showZonePanel(zone) {
    const panel = document.getElementById('zone-panel');
    const details = document.getElementById('zone-details');
    const actions = document.getElementById('zone-actions');
    
    panel.style.display = 'block';
    
    let controller = 'Neutral';
    if (zone.controller === gameState.playerFaction) controller = '👤 Tu control';
    else if (zone.controller === gameState.enemyFaction) controller = '🤖 Control enemigo';
    
    details.innerHTML = `
        <p><strong>${zone.name}</strong></p>
        <p>Tipo: ${zone.type}</p>
        <p>Control: ${controller}</p>
        ${zone.troops > 0 ? `<p>Tropas: ${zone.troops} 👥</p>` : ''}
    `;
    
    actions.innerHTML = '';
    
    // Si está bajo tu control y puedes desplegar tropas
    if (zone.controller === gameState.playerFaction && zone.canDeploy) {
        actions.innerHTML = `
            <button onclick="deployTroops('${zone.id}')" style="width: 100%; margin-top: 10px;">
                📦 Desplegar Tropas Aquí
            </button>
        `;
    }
}

// ==================== MOVER UNIDADES ====================
function moveSelectedUnit(targetX, targetY) {
    const { unit, owner, type } = gameState.selectedUnit;
    
    if (owner !== 'player') {
        addLog('❌ No puedes mover unidades enemigas');
        return;
    }
    
    // Verificar si ya se movió este turno
    if (unit.moved) {
        addLog('❌ Esta unidad ya se movió este turno');
        return;
    }
    
    // Validar posición según tipo
    if (type === 'naval') {
        if (CONFIG.isLandPosition(targetX, targetY)) {
            addLog('❌ Los barcos no pueden navegar sobre tierra');
            return;
        }
    } else if (type === 'ground') {
        if (!CONFIG.isLandPosition(targetX, targetY)) {
            addLog('❌ Las tropas necesitan estar en tierra firme');
            return;
        }
    }
    
    // Aplicar desgaste por movimiento
    if (type === 'naval' && CONFIG.gameplay.attrition.naval > 0) {
        unit.hp = Math.max(1, unit.hp - CONFIG.gameplay.attrition.naval);
        addLog(`⚠️ Desgaste: ${unit.name} perdió ${CONFIG.gameplay.attrition.naval} HP`);
    }
    
    // Mover unidad
    unit.x = targetX;
    unit.y = targetY;
    unit.moved = true;
    
    addLog(`✅ ${unit.name} movido a nueva posición`);
    deselectAll();
}

// ==================== DESPLEGAR TROPAS ====================
function deployTroops(zoneId) {
    const zone = gameState.zones.find(z => z.id === zoneId);
    if (!zone) return;
    
    let totalAvailable = 0;
    gameState.units.player.ground.forEach(unitType => {
        totalAvailable += unitType.qty;
    });
    
    if (totalAvailable === 0) {
        addLog('❌ No tienes tropas disponibles. Compra en la tienda primero.');
        return;
    }
    
    for (let unitType of gameState.units.player.ground) {
        if (unitType.qty > 0) {
            const newUnit = {
                ...JSON.parse(JSON.stringify(unitType)),
                x: zone.x + (Math.random() - 0.5) * 30,
                y: zone.y + (Math.random() - 0.5) * 30,
                symbol: unitType.symbol,
                movable: true,
                moved: false
            };
            
            unitType.units.push(newUnit);
            unitType.qty--;
            zone.troops += unitType.manpower || 10;
            
            // RESTAR MANPOWER
            gameState.resources.player.manpower -= unitType.manpower || 10;
            
            addLog(`✅ ${unitType.name} desplegado en ${zone.name}`);
            updateUI();
            return;
        }
    }
}

// ==================== OPERACIÓN ANFIBIA ====================
function executeAmphibiousLanding(shipId) {
    const ship = gameState.units.player.naval.find(s => s.id === shipId);
    
    if (!ship || ship.type !== 'amphibious') {
        addLog('❌ Necesitas un transporte anfibio');
        return;
    }
    
    if (ship.currentTroops === 0) {
        addLog('❌ El transporte está vacío. Carga tropas primero.');
        return;
    }
    
    // Encontrar zona de desembarco más cercana
    let nearestZone = null;
    let minDistance = Infinity;
    
    gameState.zones.forEach(zone => {
        if (zone.isLandingZone || zone.type === 'bay') {
            const dist = Math.hypot(ship.x - zone.x, ship.y - zone.y);
            if (dist < minDistance) {
                minDistance = dist;
                nearestZone = zone;
            }
        }
    });
    
    if (!nearestZone || minDistance > 100) {
        addLog('❌ Demasiado lejos de una zona de desembarco');
        return;
    }
    
    // Ejecutar desembarco
    const navalSupport = gameState.units.player.naval.filter(s => 
        Math.hypot(s.x - nearestZone.x, s.y - nearestZone.y) < 200
    );
    
    const defenders = gameState.zones.filter(z => 
        z.controller === gameState.enemyFaction && 
        Math.hypot(z.x - nearestZone.x, z.y - nearestZone.y) < 150
    );
    
    const result = executeAmphibiousLanding(
        { troops: ship.currentTroops },
        navalSupport,
        nearestZone,
        defenders
    );
    
    // Registrar bajas
    const casualties = result.casualties;
    gameState.losses.player += casualties;
    
    if (result.success) {
        nearestZone.troops = result.troopsLanded;
        nearestZone.controller = gameState.playerFaction;
        ship.currentTroops = 0;
        
        addLog(`✅ Desembarco exitoso en ${nearestZone.name}`);
        addLog(`💀 Bajas: ${casualties} soldados`);
        addLog(`✓ Tropas desembarcadas: ${result.troopsLanded}`);
        
        if (result.navalLosses > 0) {
            addLog(`⚠️ Perdiste ${result.navalLosses} barco(s) de apoyo`);
            for (let i = 0; i < result.navalLosses && gameState.units.player.naval.length > 0; i++) {
                gameState.units.player.naval.pop();
            }
        }
    } else {
        ship.currentTroops = Math.max(0, ship.currentTroops - casualties);
        addLog(`❌ Desembarco fallido en ${nearestZone.name}`);
        addLog(`💀 Bajas severas: ${casualties} soldados`);
        
        if (result.navalLosses > 0) {
            addLog(`💥 Perdiste ${result.navalLosses} barco(s)`);
        }
    }
    
    updateTerritoryControl();
    updateUI();
}

// ==================== CARGAR TROPAS EN TRANSPORTE ====================
function loadTroopsOnShip(shipId) {
    const ship = gameState.units.player.naval.find(s => s.id === shipId);
    
    if (!ship || ship.type !== 'amphibious') {
        addLog('❌ Este barco no es un transporte anfibio');
        return;
    }
    
    // Buscar tropas anfibias disponibles
    let troopsLoaded = 0;
    
    for (let unitType of gameState.units.player.ground) {
        if (unitType.canAmphibious && unitType.qty > 0 && ship.currentTroops < ship.troopCapacity) {
            const toLoad = Math.min(
                unitType.qty * (unitType.manpower || 10),
                ship.troopCapacity - ship.currentTroops
            );
            
            ship.currentTroops += toLoad;
            troopsLoaded += toLoad;
            
            const unitsUsed = Math.ceil(toLoad / (unitType.manpower || 10));
            unitType.qty -= unitsUsed;
            
            // RESTAR MANPOWER
            gameState.resources.player.manpower -= toLoad;
            
            if (ship.currentTroops >= ship.troopCapacity) break;
        }
    }
    
    if (troopsLoaded > 0) {
        addLog(`✅ Cargadas ${troopsLoaded} tropas en ${ship.name}`);
        updateUI();
    } else {
        addLog('❌ No tienes tropas anfibias disponibles');
    }
}

// ==================== GESTIÓN DE PORTAVIONES ====================
function spawnAircraftOnCarrier(carrierId) {
    const carrier = gameState.units.player.naval.find(s => s.id === carrierId);
    
    if (!carrier || !carrier.isCarrier) {
        addLog('❌ Este barco no es un portaviones');
        return;
    }
    
    if (carrier.currentAircraft.length >= carrier.aircraftCapacity) {
        addLog('❌ El portaviones está a capacidad máxima');
        return;
    }
    
    // Spawnear aviones del tipo correspondiente
    const aircraftTypes = CONFIG.carrierAircraft[gameState.playerFaction];
    
    if (!aircraftTypes || aircraftTypes.length === 0) {
        addLog('❌ No hay aviones disponibles para este portaviones');
        return;
    }
    
    const aircraftType = aircraftTypes[0]; // Tomar el primer tipo
    const cost = 500; // Costo de avión embarcado
    
    if (gameState.resources.player.money < cost) {
        addLog('❌ Fondos insuficientes para desplegar avión');
        return;
    }
    
    const newAircraft = {
        ...JSON.parse(JSON.stringify(aircraftType)),
        id: `aircraft_${Date.now()}`,
        assignedCarrier: carrierId,
        x: carrier.x,
        y: carrier.y,
        inFlight: false
    };
    
    carrier.currentAircraft.push(newAircraft);
    gameState.resources.player.money -= cost;
    
    addLog(`✅ ${newAircraft.name} desplegado en ${carrier.name}`);
    updateUI();
}

// ==================== MISIÓN AÉREA ====================
function launchAirStrike(aircraftId, targetId, targetType) {
    const carrier = gameState.units.player.naval.find(s => 
        s.isCarrier && s.currentAircraft.some(a => a.id === aircraftId)
    );
    
    if (!carrier) {
        addLog('❌ Avión no encontrado en portaviones');
        return;
    }
    
    const aircraft = carrier.currentAircraft.find(a => a.id === aircraftId);
    
    if (!aircraft) return;
    
    if (aircraft.missions >= aircraft.maxMissions) {
        addLog('❌ Este avión alcanzó su límite de misiones');
        return;
    }
    
    // Encontrar objetivo
    let target = null;
    
    if (targetType === 'naval') {
        target = gameState.units.enemy.naval.find(s => s.id === targetId);
    } else if (targetType === 'ground') {
        target = gameState.zones.find(z => z.id === targetId);
    }
    
    if (!target) {
        addLog('❌ Objetivo no encontrado');
        return;
    }
    
    // Ejecutar ataque aéreo
    const result = executeAirStrike(aircraft, target, targetType);
    
    aircraft.missions++;
    
    // Registrar bajas si es ataque terrestre
    if (targetType === 'ground' && result.hit) {
        const casualtiesTroops = Math.floor(result.damage * 0.5);
        target.troops = Math.max(0, target.troops - casualtiesTroops);
        
        if (target.controller === gameState.enemyFaction) {
            gameState.losses.enemy += casualtiesTroops;
        }
        
        addLog(`💀 Ataque causó ${casualtiesTroops} bajas en tierra`);
    }
    
    if (result.hit) {
        if (result.criticalHit) {
            addLog(`💥 ¡IMPACTO CRÍTICO! ${aircraft.name} causó ${result.damage} de daño`);
        } else {
            addLog(`✅ ${aircraft.name} impactó causando ${result.damage} de daño`);
        }
    } else {
        addLog(`❌ ${aircraft.name} falló el ataque`);
    }
    
    if (result.aircraftLost) {
        const index = carrier.currentAircraft.indexOf(aircraft);
        carrier.currentAircraft.splice(index, 1);
        gameState.losses.player++;
        addLog(`💥 ${aircraft.name} fue derribado`);
    } else {
        addLog(`✓ ${aircraft.name} regresó al portaviones`);
    }
    
    updateUI();
}

// ==================== ACTUALIZAR UI ====================
function updateUI() {
    // Recursos
    document.getElementById('res-money').textContent = gameState.resources.player.money.toLocaleString();
    document.getElementById('res-manpower').textContent = gameState.resources.player.manpower.toLocaleString();
    document.getElementById('res-fuel').textContent = gameState.resources.player.fuel.toLocaleString();
    document.getElementById('res-logistics').textContent = gameState.resources.player.logistics + '%';
    document.getElementById('res-political').textContent = gameState.resources.player.political + '%';
    document.getElementById('res-international').textContent = gameState.resources.player.international + '%';
    
    // Turno
    document.getElementById('turn-number').textContent = gameState.turn;
    
    // Fuerzas
    updateForcesList();
}

function updateForcesList() {
    // Naval
    const navalList = document.getElementById('naval-list');
    navalList.innerHTML = '';
    gameState.units.player.naval.forEach(ship => {
        navalList.innerHTML += `
            <div class="force-item">
                <span>${CONFIG.getUnitImage('naval', ship.type, ship.id)} ${ship.name}</span>
                <span style="color: ${ship.hp > 70 ? '#00ff00' : ship.hp > 30 ? '#ffaa00' : '#ff4444'}">${ship.hp}HP</span>
            </div>
        `;
    });
    
    // Aérea
    const airList = document.getElementById('air-list');
    airList.innerHTML = '';
    gameState.units.player.air.forEach(aircraft => {
        if (aircraft.qty > 0) {
            airList.innerHTML += `
                <div class="force-item">
                    <span>✈️ ${aircraft.name}</span>
                    <span style="color: #00aaff">x${aircraft.qty}</span>
                </div>
            `;
        }
    });
    
    if (gameState.units.player.air.every(a => a.qty === 0)) {
        airList.innerHTML = '<p style="color: #666; text-align: center;">Sin unidades aéreas</p>';
    }
    
    // Terrestre
    const groundList = document.getElementById('ground-list');
    groundList.innerHTML = '';
    gameState.units.player.ground.forEach(unitType => {
        const deployed = unitType.units.length;
        const available = unitType.qty;
        const total = deployed + available;
        
        if (total > 0) {
            groundList.innerHTML += `
                <div class="force-item">
                    <span>${unitType.symbol} ${unitType.name}</span>
                    <span style="color: #00ff00">${deployed}/${total}</span>
                </div>
            `;
        }
    });
    
    if (gameState.units.player.ground.every(g => g.qty === 0 && g.units.length === 0)) {
        groundList.innerHTML = '<p style="color: #666; text-align: center;">Sin tropas terrestres</p>';
    }
}

function updateTerritoryControl() {
    let playerZones = 0;
    let enemyZones = 0;
    let neutralZones = 0;
    
    gameState.zones.forEach(zone => {
        if (zone.type !== 'naval') {
            if (zone.controller === gameState.playerFaction) playerZones++;
            else if (zone.controller === gameState.enemyFaction) enemyZones++;
            else neutralZones++;
        }
    });
    
    gameState.territoryControl.player = playerZones;
    gameState.territoryControl.enemy = enemyZones;
    gameState.territoryControl.neutral = neutralZones;
    
    document.getElementById('player-zones').textContent = playerZones;
    document.getElementById('enemy-zones').textContent = enemyZones;
    document.getElementById('neutral-zones').textContent = neutralZones;
}

function setMessage(msg) {
    document.getElementById('status-message').textContent = msg;
}

function addLog(msg) {
    gameState.combatLog.push(msg);
    const logContent = document.getElementById('combat-log');
    const p = document.createElement('p');
    p.textContent = `[T${gameState.turn}] ${msg}`;
    logContent.insertBefore(p, logContent.firstChild);
    
    while (logContent.children.length > 30) {
        logContent.removeChild(logContent.lastChild);
    }
}

// ==================== TIENDA ====================
let currentShopTab = 'ground';

function toggleShop() {
    const modal = document.getElementById('shop-modal');
    modal.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
        populateShop();
    }
}

function switchShopTab(tab) {
    currentShopTab = tab;
    
    // Actualizar tabs
    document.querySelectorAll('.shop-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Actualizar categorías
    document.querySelectorAll('.shop-category').forEach(cat => cat.classList.remove('active'));
    document.getElementById('shop-' + tab).classList.add('active');
}

function populateShop() {
    populateGroundShop();
    populateAirShop();
    populateNavalShop();
}

function populateGroundShop() {
    const container = document.getElementById('shop-ground');
    container.innerHTML = '';
    
    CONFIG.groundUnits[gameState.playerFaction].forEach(unit => {
        const canAfford = gameState.resources.player.money >= unit.cost;
        container.innerHTML += createShopItem(unit, 'ground', canAfford);
    });
}

function populateAirShop() {
    const container = document.getElementById('shop-air');
    container.innerHTML = '';
    
    CONFIG.airUnits[gameState.playerFaction].forEach(unit => {
        const canAfford = gameState.resources.player.money >= unit.cost;
        container.innerHTML += createShopItem(unit, 'air', canAfford);
    });
}

function populateNavalShop() {
    const container = document.getElementById('shop-naval');
    container.innerHTML = '';
    
    CONFIG.purchasableNavalUnits[gameState.playerFaction].forEach(unit => {
        const canAfford = gameState.resources.player.money >= unit.cost;
        container.innerHTML += createShopItem(unit, 'naval', canAfford);
    });
}

function createShopItem(unit, type, canAfford) {
    return `
        <div class="shop-item">
            <div class="shop-item-header">
                <div class="shop-item-name">${type === 'ground' ? unit.symbol + ' ' : ''}${unit.name}</div>
                <div class="shop-item-price">${unit.cost.toLocaleString()}</div>
            </div>
            <div class="shop-item-stats">
                Ataque: ${unit.attack} | Defensa: ${unit.defense}
                ${unit.manpower ? ` | Manpower: ${unit.manpower}` : ''}
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
    
    // Verificar manpower para tropas terrestres
    if (type === 'ground' && unit.manpower) {
        if (gameState.resources.player.manpower < unit.manpower) {
            addLog('❌ Manpower insuficiente');
            return;
        }
    }
    
    gameState.resources.player.money -= unit.cost;
    
    if (type === 'ground') {
        const playerUnit = gameState.units.player.ground.find(u => u.id === unitId);
        playerUnit.qty++;
        // NO restamos manpower aquí, se resta al desplegar
    } else if (type === 'air') {
        const playerUnit = gameState.units.player.air.find(u => u.id === unitId);
        playerUnit.qty++;
    } else if (type === 'naval') {
        const newShip = {
            ...JSON.parse(JSON.stringify(unit)),
            x: 150 + gameState.units.player.naval.length * 80,
            y: gameState.playerFaction === 'argentina' ? 850 : 150,
            owner: 'player',
            id: unit.id + '_' + Date.now(),
            moved: false
        };
        
        // Inicializar anfibios
        if (newShip.type === 'amphibious') {
            newShip.currentTroops = 0;
        }
        
        gameState.units.player.naval.push(newShip);
    }
    
    addLog(`✅ Comprado: ${unit.name}`);
    updateUI();
    populateShop();
}

// ==================== SELECCIONAR AVIÓN PARA MISIÓN ====================
let selectedAircraftForMission = null;

function selectAircraftForMission(aircraftId) {
    selectedAircraftForMission = aircraftId;
    addLog('🎯 Selecciona un objetivo en el mapa (barco enemigo o zona terrestre)');
    setMessage('🎯 Click en un objetivo para lanzar ataque aéreo');
}

// ==================== FIN DE TURNO ====================
function endTurn() {
    // Consumir recursos
    const costs = CONFIG.turnCosts[gameState.playerFaction];
    gameState.resources.player.money -= costs.money;
    gameState.resources.player.fuel -= costs.fuel;
    gameState.resources.player.logistics -= costs.logistics;
    
    // Resetear flags de movimiento de todas las unidades del jugador
    gameState.units.player.naval.forEach(ship => {
        ship.moved = false;
    });
    
    gameState.units.player.ground.forEach(unitType => {
        unitType.units.forEach(unit => {
            unit.moved = false;
        });
    });
    
    // Resetear misiones de aviones
    gameState.units.player.naval.forEach(carrier => {
        if (carrier.isCarrier && carrier.currentAircraft) {
            carrier.currentAircraft.forEach(aircraft => {
                aircraft.missions = 0;
            });
        }
    });
    
    // Actualizar turno
    gameState.turn++;
    
    setMessage(`Turno ${gameState.turn} - IA pensando...`);
    document.getElementById('end-turn-btn').disabled = true;
    
    updateUI();
    
    // Verificar condiciones ANTES del turno de la IA
    if (checkVictoryConditions()) {
        return;
    }
    
    // Ejecutar turno de la IA
    setTimeout(() => {
        executeAITurn();
        
        // Verificar condiciones DESPUÉS del turno de la IA
        if (!checkVictoryConditions()) {
            setMessage(`Turno ${gameState.turn} - Tu turno`);
            document.getElementById('end-turn-btn').disabled = false;
        }
        
        updateUI();
        updateTerritoryControl();
    }, 1500);
}

// ==================== CONDICIONES DE VICTORIA ====================
function checkVictoryConditions() {
    // Derrota por colapso económico
    if (gameState.resources.player.money <= 0 && gameState.resources.player.fuel <= 0) {
        endGame('defeat', 'Colapso económico - Sin recursos');
        return true;
    }
    
    if (gameState.resources.enemy.money <= 0 && gameState.resources.enemy.fuel <= 0) {
        endGame('victory', 'Victoria - El enemigo colapsó económicamente');
        return true;
    }
    
    // Victoria/derrota por control territorial
    const landZones = gameState.zones.filter(z => z.type !== 'naval');
    const totalLandZones = landZones.length;
    const playerControlled = landZones.filter(z => z.controller === gameState.playerFaction).length;
    const enemyControlled = landZones.filter(z => z.controller === gameState.enemyFaction).length;
    
    if (playerControlled >= totalLandZones * 0.8) {
        endGame('victory', 'Victoria - Control territorial superior al 80%');
        return true;
    }
    
    if (enemyControlled >= totalLandZones * 0.8) {
        endGame('defeat', 'Derrota - El enemigo controla más del 80% del territorio');
        return true;
    }
    
    // Victoria/derrota por aniquilación naval
    if (gameState.units.player.naval.length === 0) {
        endGame('defeat', 'Derrota - Flota completamente destruida');
        return true;
    }
    
    if (gameState.units.enemy.naval.length === 0) {
        endGame('victory', 'Victoria - Flota enemiga completamente destruida');
        return true;
    }
    
    // Límite de turnos
    if (gameState.turn > CONFIG.victoryConditions.turnLimit) {
        if (playerControlled > enemyControlled) {
            endGame('victory', `Victoria por puntos (Turno ${CONFIG.victoryConditions.turnLimit})`);
        } else {
            endGame('defeat', `Derrota por puntos (Turno ${CONFIG.victoryConditions.turnLimit})`);
        }
        return true;
    }
    
    return false;
}

function endGame(result, message) {
    const modal = document.getElementById('endgame-modal');
    const title = document.getElementById('endgame-title');
    const msg = document.getElementById('endgame-message');
    const turns = document.getElementById('endgame-turns');
    const territories = document.getElementById('endgame-territories');
    const losses = document.getElementById('endgame-losses');
    
    if (result === 'victory') {
        title.textContent = '🏆 VICTORIA';
        title.className = 'victory';
    } else {
        title.textContent = '💀 DERROTA';
        title.className = 'defeat';
    }
    
    msg.textContent = message;
    turns.textContent = gameState.turn;
    territories.textContent = `${gameState.territoryControl.player}/${gameState.zones.filter(z => z.type !== 'naval').length}`;
    losses.textContent = gameState.losses.player;
    
    modal.classList.add('active');
}

let gameState = {
    turn: 1,
    money: 5000,
    fuel: 1000,
    units: [],
    selectedUnit: null,
    moveMode: false,
    phase: 'loading'
};

window.onload = () => {
    initLoading();
};

function initLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        document.getElementById('progress-fill').style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            document.getElementById('loading-screen').classList.add('hidden');
        }
    }, 50);
}

function startGame(faction) {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    initMap();
    spawnInitialUnits(faction);
}

// SISTEMA DE MOVIMIENTO: Click y Click
function handleMapClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const unitAtClick = findUnitAt(x, y);

    if (unitAtClick && unitAtClick.owner === 'player') {
        selectUnit(unitAtClick);
    } else if (gameState.selectedUnit && gameState.moveMode) {
        // Ejecutar movimiento a la posición clickeada
        executeMove(gameState.selectedUnit, x, y);
    }
}

function executeMove(unit, targetX, targetY) {
    if (unit.fuel < CONFIG.mechanics.moveFuelCost || unit.fatigue >= 80) {
        log("Unidad demasiado cansada o sin combustible");
        return;
    }

    unit.x = targetX;
    unit.y = targetY;
    unit.fuel -= CONFIG.mechanics.moveFuelCost;
    unit.fatigue += CONFIG.mechanics.moveFatigue;
    unit.hasMovedThisTurn = true;
    
    gameState.moveMode = false;
    updateUI();
    draw();
    log(`${unit.name} se movilizó a nuevas coordenadas.`);
}

// SISTEMA DE TURNOS (Recuperación y Victoria)
function nextTurn() {
    gameState.turn++;
    
    // Lógica de recuperación por estar quieto
    gameState.units.forEach(u => {
        if (!u.hasMovedThisTurn) {
            u.fatigue = Math.max(0, u.fatigue - CONFIG.mechanics.recoveryRate);
            u.fuel = Math.min(100, u.fuel + 10); // Repostaje ligero
        }
        u.hasMovedThisTurn = false;
    });

    // IA realiza su movimiento
    executeAITurn();
    
    // Verificación de victoria mejorada (No instantánea)
    checkWinCondition();
    updateUI();
}

function checkWinCondition() {
    // Solo verificar después del turno 5 para permitir desarrollo
    if (gameState.turn < 2) return;

    const playerUnits = gameState.units.filter(u => u.owner === 'player').length;
    const aiUnits = gameState.units.filter(u => u.owner === 'ai').length;

    if (playerUnits === 0) showEndGame("DERROTA: El enemigo ha recuperado el control.");
    if (aiUnits === 0) showEndGame("VICTORIA: Las islas están bajo soberanía argentina.");
}

function log(msg) {
    const logDiv = document.getElementById('combat-log');
    logDiv.innerHTML = `> ${msg}<br>` + logDiv.innerHTML;
}

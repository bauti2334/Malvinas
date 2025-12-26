// ==================== IA ENEMIGA ====================

function executeAITurn() {
    addLog(`🤖 IA: Turno ${gameState.turn}`);
    
    // Consumir recursos de la IA
    gameState.resources.enemy.money -= CONFIG.turnCosts.money;
    gameState.resources.enemy.fuel -= CONFIG.turnCosts.fuel;
    gameState.resources.enemy.logistics -= CONFIG.turnCosts.logistics;
    
    // La IA toma decisiones basadas en su situación
    const decision = makeAIDecision();
    
    switch(decision.action) {
        case 'buy_units':
            aiBuyUnits();
            break;
        case 'move_fleet':
            aiMoveFleet();
            break;
        case 'attack':
            aiAttack();
            break;
        case 'defend':
            aiDefend();
            break;
        default:
            aiMoveFleet();
    }
    
    // Verificar victoria después del turno de la IA
    checkVictoryConditions();
}

// ==================== DECISIÓN DE LA IA ====================
function makeAIDecision() {
    const playerNavalStrength = calculateNavalStrength('player');
    const enemyNavalStrength = calculateNavalStrength('enemy');
    const moneyRatio = gameState.resources.enemy.money / gameState.resources.player.money;
    const fuelRatio = gameState.resources.enemy.fuel / gameState.resources.player.fuel;
    
    // Estrategia básica
    if (gameState.resources.enemy.money > 2000 && gameState.units.enemy.naval.length < 6) {
        return { action: 'buy_units', priority: 'naval' };
    }
    
    if (enemyNavalStrength > playerNavalStrength * 1.5) {
        return { action: 'attack', type: 'aggressive' };
    }
    
    if (enemyNavalStrength < playerNavalStrength * 0.7) {
        return { action: 'defend', type: 'retreat' };
    }
    
    if (gameState.turn % 3 === 0) {
        return { action: 'move_fleet', pattern: 'patrol' };
    }
    
    return { action: 'move_fleet', pattern: 'defensive' };
}

function calculateNavalStrength(owner) {
    const units = owner === 'player' ? gameState.units.player.naval : gameState.units.enemy.naval;
    return units.reduce((total, ship) => total + ship.attack + ship.defense, 0);
}

// ==================== IA: COMPRAR UNIDADES ====================
function aiBuyUnits() {
    const money = gameState.resources.enemy.money;
    
    // Prioridad: comprar barcos si tiene fondos
    if (money >= 2000) {
        const availableShips = CONFIG.purchasableNavalUnits[gameState.enemyFaction];
        const affordableShips = availableShips.filter(s => s.cost <= money);
        
        if (affordableShips.length > 0) {
            const ship = affordableShips[Math.floor(Math.random() * affordableShips.length)];
            const newShip = {
                ...ship,
                x: 500 + gameState.units.enemy.naval.length * 60,
                y: gameState.enemyFaction === 'argentina' ? 700 : 100,
                owner: 'enemy'
            };
            
            gameState.units.enemy.naval.push(newShip);
            gameState.resources.enemy.money -= ship.cost;
            addLog(`🤖 IA compró: ${ship.name}`);
            return;
        }
    }
    
    // Comprar unidades aéreas si tiene fondos
    if (money >= 800) {
        const availableAir = CONFIG.airUnits[gameState.enemyFaction];
        const affordableAir = availableAir.filter(a => a.cost <= money);
        
        if (affordableAir.length > 0) {
            const aircraft = affordableAir[Math.floor(Math.random() * affordableAir.length)];
            const enemyUnit = gameState.units.enemy.air.find(u => u.id === aircraft.id);
            if (enemyUnit) {
                enemyUnit.qty++;
                gameState.resources.enemy.money -= aircraft.cost;
                addLog(`🤖 IA compró: ${aircraft.name}`);
                return;
            }
        }
    }
    
    // Comprar tropas terrestres
    if (money >= 200) {
        const availableGround = CONFIG.groundUnits[gameState.enemyFaction];
        const affordableGround = availableGround.filter(g => g.cost <= money);
        
        if (affordableGround.length > 0) {
            const ground = affordableGround[Math.floor(Math.random() * affordableGround.length)];
            const enemyUnit = gameState.units.enemy.ground.find(u => u.id === ground.id);
            if (enemyUnit) {
                enemyUnit.qty++;
                gameState.resources.enemy.money -= ground.cost;
                addLog(`🤖 IA compró: ${ground.name}`);
            }
        }
    }
}

// ==================== IA: MOVER FLOTA ====================
function aiMoveFleet() {
    const targetY = gameState.enemyFaction === 'argentina' ? 500 : 400;
    
    gameState.units.enemy.naval.forEach((ship, index) => {
        // Mover hacia el centro del mapa (zona de combate)
        const targetX = 400 + (index * 100);
        
        // Movimiento gradual
        const dx = targetX - ship.x;
        const dy = targetY - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 50) {
            ship.x += (dx / distance) * 30;
            ship.y += (dy / distance) * 30;
        } else {
            // Patrullar alrededor de la posición
            ship.x += (Math.random() - 0.5) * 40;
            ship.y += (Math.random() - 0.5) * 40;
        }
        
        // Mantener dentro de los límites
        ship.x = Math.max(50, Math.min(950, ship.x));
        ship.y = Math.max(50, Math.min(750, ship.y));
    });
    
    addLog('🤖 IA reposicionó su flota');
}

// ==================== IA: ATACAR ====================
function aiAttack() {
    // La IA intenta atacar barcos del jugador
    if (gameState.units.enemy.naval.length === 0 || gameState.units.player.naval.length === 0) {
        return;
    }
    
    // Seleccionar barco enemigo más cercano
    const attacker = gameState.units.enemy.naval[0];
    let nearestTarget = null;
    let nearestDistance = Infinity;
    
    gameState.units.player.naval.forEach(playerShip => {
        const dist = Math.sqrt(
            Math.pow(playerShip.x - attacker.x, 2) + 
            Math.pow(playerShip.y - attacker.y, 2)
        );
        if (dist < nearestDistance) {
            nearestDistance = dist;
            nearestTarget = playerShip;
        }
    });
    
    // Si hay un objetivo cercano (menos de 200 unidades), atacar
    if (nearestTarget && nearestDistance < 300) {
        const result = executeCombat(attacker, nearestTarget, 'naval');
        
        if (result.defenderDestroyed) {
            addLog(`💥 🤖 IA hundió tu ${nearestTarget.name}!`);
            const index = gameState.units.player.naval.indexOf(nearestTarget);
            if (index > -1) {
                gameState.units.player.naval.splice(index, 1);
            }
        } else {
            addLog(`⚔️ 🤖 IA atacó tu ${nearestTarget.name} (${result.damage} daño)`);
        }
        
        if (result.attackerDamaged > 0) {
            addLog(`🛡️ Tu ${nearestTarget.name} contraatacó (${result.attackerDamaged} daño)`);
        }
        
        if (result.attackerDestroyed) {
            const index = gameState.units.enemy.naval.indexOf(attacker);
            if (index > -1) {
                gameState.units.enemy.naval.splice(index, 1);
            }
        }
    } else {
        // Si no hay objetivos cerca, mover hacia ellos
        aiMoveFleet();
    }
}

// ==================== IA: DEFENDER ====================
function aiDefend() {
    // La IA retrocede sus barcos
    const retreatY = gameState.enemyFaction === 'argentina' ? 650 : 150;
    
    gameState.units.enemy.naval.forEach(ship => {
        // Retroceder hacia zona segura
        if (gameState.enemyFaction === 'argentina') {
            ship.y = Math.min(ship.y + 40, retreatY);
        } else {
            ship.y = Math.max(ship.y - 40, retreatY);
        }
        
        // Dispersar horizontalmente
        ship.x += (Math.random() - 0.5) * 60;
        ship.x = Math.max(100, Math.min(900, ship.x));
    });
    
    addLog('🤖 IA adoptó posición defensiva');
}

// ==================== IA: GESTIÓN DE TROPAS ====================
function aiManageTroops() {
    // La IA intenta desplegar tropas en zonas estratégicas si tiene el control naval
    const enemyNavalStrength = calculateNavalStrength('enemy');
    const playerNavalStrength = calculateNavalStrength('player');
    
    if (enemyNavalStrength > playerNavalStrength * 1.2) {
        // La IA tiene superioridad naval, intenta desembarcar
        const controlledZones = gameState.zones.filter(z => 
            z.controller === gameState.enemyFaction && z.type !== 'naval'
        );
        
        if (controlledZones.length > 0) {
            const zone = controlledZones[Math.floor(Math.random() * controlledZones.length)];
            
            // Reforzar zona
            const availableTroops = gameState.units.enemy.ground.reduce((sum, u) => sum + u.qty, 0);
            if (availableTroops > 0) {
                const reinforcement = Math.min(20, availableTroops);
                zone.troops += reinforcement;
                addLog(`🤖 IA reforzó ${zone.name} (+${reinforcement} tropas)`);
            }
        }
    }
}

// ==================== IA: DECISIONES ESTRATÉGICAS ====================
function aiStrategicDecisions() {
    // Decisiones a largo plazo basadas en el estado del juego
    const turnPhase = gameState.turn <= 5 ? 'early' : gameState.turn <= 15 ? 'mid' : 'late';
    
    switch(turnPhase) {
        case 'early':
            // Enfocarse en acumular recursos y unidades
            if (Math.random() > 0.7) {
                aiBuyUnits();
            }
            break;
        case 'mid':
            // Balance entre ataque y defensa
            if (Math.random() > 0.5) {
                aiAttack();
            } else {
                aiMoveFleet();
            }
            break;
        case 'late':
            // Agresividad máxima o desesperación
            const playerControlled = gameState.zones.filter(z => 
                z.controller === gameState.playerFaction && z.type !== 'naval'
            ).length;
            const enemyControlled = gameState.zones.filter(z => 
                z.controller === gameState.enemyFaction && z.type !== 'naval'
            ).length;
            
            if (enemyControlled < playerControlled) {
                // Desesperación: ataque total
                aiAttack();
            } else {
                // Consolidar posición
                aiDefend();
            }
            break;
    }
}

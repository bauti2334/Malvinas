// ==================== IA ENEMIGA ====================

function executeAITurn() {
    addLog(`🤖 IA: Comienza turno ${gameState.turn}`);
    
    // Consumir recursos de la IA
    const costs = CONFIG.turnCosts[gameState.enemyFaction];
    gameState.resources.enemy.money -= costs.money;
    gameState.resources.enemy.fuel -= costs.fuel;
    gameState.resources.enemy.logistics -= costs.logistics;
    
    // La IA toma decisiones basadas en su situación actual
    analyzeAndAct();
}

function analyzeAndAct() {
    const situation = analyzeSituation();
    
    // Decidir acciones basadas en la situación
    if (situation.needsUnits && gameState.resources.enemy.money > 1500) {
        aiBuyUnits(situation);
    }
    
    if (situation.canAttackNaval) {
        aiNavalCombat();
    } else {
        aiMoveFleet(situation);
    }
    
    // Gestionar tropas terrestres
    if (situation.needsGroundReinforcement) {
        aiDeployGroundForces();
    }
    
    // Intentar capturar territorios
    if (situation.canCaptureTerritory) {
        aiCaptureTerritory();
    }
}

function analyzeSituation() {
    const playerNavalStrength = calculateFleetStrength('player');
    const enemyNavalStrength = calculateFleetStrength('enemy');
    
    const playerTerritories = gameState.zones.filter(z => 
        z.type !== 'naval' && z.controller === gameState.playerFaction
    ).length;
    
    const enemyTerritories = gameState.zones.filter(z => 
        z.type !== 'naval' && z.controller === gameState.enemyFaction
    ).length;
    
    return {
        navalAdvantage: enemyNavalStrength > playerNavalStrength * 1.2,
        navalDisadvantage: enemyNavalStrength < playerNavalStrength * 0.7,
        canAttackNaval: enemyNavalStrength > playerNavalStrength * 0.8 && gameState.units.enemy.naval.length > 0,
        needsUnits: gameState.units.enemy.naval.length < 4 || gameState.units.enemy.ground.reduce((sum, u) => sum + u.qty, 0) < 3,
        territoryAdvantage: enemyTerritories > playerTerritories,
        needsGroundReinforcement: enemyTerritories > 0 && gameState.units.enemy.ground.reduce((sum, u) => sum + u.qty, 0) > 0,
        canCaptureTerritory: enemyNavalStrength > playerNavalStrength && gameState.units.enemy.ground.reduce((sum, u) => sum + u.qty, 0) > 0,
        isEarlyGame: gameState.turn <= 10,
        isMidGame: gameState.turn > 10 && gameState.turn <= 25,
        isLateGame: gameState.turn > 25
    };
}

function calculateFleetStrength(owner) {
    const fleet = owner === 'player' ? gameState.units.player.naval : gameState.units.enemy.naval;
    return fleet.reduce((total, ship) => total + ship.attack + ship.defense + (ship.hp / 2), 0);
}

// ==================== COMPRAR UNIDADES ====================
function aiBuyUnits(situation) {
    const money = gameState.resources.enemy.money;
    const priorityBuy = decidePurchasePriority(situation);
    
    if (priorityBuy === 'naval' && money >= 1500) {
        const availableShips = CONFIG.purchasableNavalUnits[gameState.enemyFaction];
        const affordableShips = availableShips.filter(s => s.cost <= money);
        
        if (affordableShips.length > 0) {
            const ship = affordableShips[Math.floor(Math.random() * affordableShips.length)];
            
            const newShip = {
                ...JSON.parse(JSON.stringify(ship)),
                x: 150 + gameState.units.enemy.naval.length * 80,
                y: gameState.enemyFaction === 'argentina' ? 850 : 150,
                owner: 'enemy',
                id: ship.id + '_enemy_' + Date.now()
            };
            
            gameState.units.enemy.naval.push(newShip);
            gameState.resources.enemy.money -= ship.cost;
            addLog(`🤖 IA compró: ${ship.name}`);
            return;
        }
    }
    
    if (priorityBuy === 'air' && money >= 1000) {
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
    
    if (priorityBuy === 'ground' && money >= 200) {
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

function decidePurchasePriority(situation) {
    if (situation.navalDisadvantage) return 'naval';
    if (situation.isEarlyGame) return Math.random() > 0.6 ? 'naval' : 'ground';
    if (situation.isMidGame) return Math.random() > 0.5 ? 'ground' : 'air';
    if (situation.isLateGame) return 'ground';
    return 'naval';
}

// ==================== MOVIMIENTO DE FLOTA ====================
function aiMoveFleet(situation) {
    if (gameState.units.enemy.naval.length === 0) return;
    
    // Calcular zona objetivo
    let targetY, targetX;
    
    if (situation.navalAdvantage) {
        // Avanzar agresivamente hacia el centro
        targetY = 500;
        targetX = 550;
    } else if (situation.navalDisadvantage) {
        // Retroceder a posición defensiva
        targetY = gameState.enemyFaction === 'argentina' ? 750 : 250;
        targetX = 400;
    } else {
        // Patrullar zona intermedia
        targetY = gameState.enemyFaction === 'argentina' ? 650 : 350;
        targetX = 550;
    }
    
    gameState.units.enemy.naval.forEach((ship, index) => {
        const offsetX = (index % 3 - 1) * 100;
        const offsetY = Math.floor(index / 3) * 80;
        
        const finalTargetX = targetX + offsetX;
        const finalTargetY = targetY + offsetY;
        
        // Movimiento gradual hacia el objetivo
        const dx = finalTargetX - ship.x;
        const dy = finalTargetY - ship.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 50) {
            const speed = CONFIG.gameplay.movementSpeed.naval;
            ship.x += (dx / distance) * speed;
            ship.y += (dy / distance) * speed;
        } else {
            // Pequeñas correcciones aleatorias
            ship.x += (Math.random() - 0.5) * 20;
            ship.y += (Math.random() - 0.5) * 20;
        }
        
        // Mantener dentro del mapa y fuera de tierra
        ship.x = Math.max(50, Math.min(CONFIG.map.width - 50, ship.x));
        ship.y = Math.max(50, Math.min(CONFIG.map.height - 50, ship.y));
        
        // Si está sobre tierra, mover a zona segura
        if (CONFIG.isLandPosition(ship.x, ship.y)) {
            ship.x = targetX;
            ship.y = targetY;
        }
    });
    
    addLog('🤖 IA reposicionó su flota');
}

// ==================== COMBATE NAVAL ====================
function aiNavalCombat() {
    if (gameState.units.enemy.naval.length === 0 || gameState.units.player.naval.length === 0) {
        return;
    }
    
    // Encontrar el barco enemigo más cercano a cualquier barco de la IA
    let closestPair = null;
    let minDistance = Infinity;
    
    gameState.units.enemy.naval.forEach(aiShip => {
        gameState.units.player.naval.forEach(playerShip => {
            const dist = Math.hypot(aiShip.x - playerShip.x, aiShip.y - playerShip.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestPair = { attacker: aiShip, target: playerShip };
            }
        });
    });
    
    // Si hay un barco a rango de ataque, atacar
    if (closestPair && minDistance < CONFIG.gameplay.attackRange.naval) {
        const result = executeCombat(closestPair.attacker, closestPair.target, 'naval');
        
        addLog(`⚔️ 🤖 ${closestPair.attacker.name} atacó tu ${closestPair.target.name}`);
        
        if (result.defenderDestroyed) {
            addLog(`💥 Tu ${closestPair.target.name} fue hundido!`);
            const index = gameState.units.player.naval.indexOf(closestPair.target);
            if (index > -1) {
                gameState.units.player.naval.splice(index, 1);
                gameState.losses.player++;
            }
        } else {
            addLog(`🛡️ Tu ${closestPair.target.name} recibió ${result.damage} de daño (${closestPair.target.hp}HP)`);
        }
        
        if (result.attackerDamaged > 0) {
            addLog(`↩️ Contraataque causó ${result.attackerDamaged} de daño al ${closestPair.attacker.name}`);
        }
        
        if (result.attackerDestroyed) {
            addLog(`💥 ${closestPair.attacker.name} enemigo fue hundido en el contraataque!`);
            const index = gameState.units.enemy.naval.indexOf(closestPair.attacker);
            if (index > -1) {
                gameState.units.enemy.naval.splice(index, 1);
                gameState.losses.enemy++;
            }
        }
    } else {
        // Si no hay objetivos en rango, avanzar hacia ellos
        if (closestPair) {
            const dx = closestPair.target.x - closestPair.attacker.x;
            const dy = closestPair.target.y - closestPair.attacker.y;
            const distance = Math.hypot(dx, dy);
            
            closestPair.attacker.x += (dx / distance) * 60;
            closestPair.attacker.y += (dy / distance) * 60;
            
            addLog('🤖 IA avanzó hacia tu flota');
        }
    }
}

// ==================== DESPLEGAR TROPAS TERRESTRES ====================
function aiDeployGroundForces() {
    // Encontrar zonas controladas por la IA
    const controlledZones = gameState.zones.filter(z => 
        z.controller === gameState.enemyFaction && z.canDeploy
    );
    
    if (controlledZones.length === 0) return;
    
    // Desplegar tropas en zonas controladas
    for (let unitType of gameState.units.enemy.ground) {
        if (unitType.qty > 0) {
            const zone = controlledZones[Math.floor(Math.random() * controlledZones.length)];
            
            const newUnit = {
                ...JSON.parse(JSON.stringify(unitType)),
                x: zone.x + (Math.random() - 0.5) * 40,
                y: zone.y + (Math.random() - 0.5) * 40,
                symbol: unitType.symbol,
                movable: true,
                owner: 'enemy'
            };
            
            unitType.units.push(newUnit);
            unitType.qty--;
            zone.troops += unitType.manpower || 10;
            
            addLog(`🤖 IA desplegó ${unitType.name} en ${zone.name}`);
            return;
        }
    }
}

// ==================== CAPTURAR TERRITORIO ====================
function aiCaptureTerritory() {
    // Encontrar zonas enemigas adyacentes a zonas controladas
    const enemyZones = gameState.zones.filter(z => 
        z.type !== 'naval' && z.controller === gameState.playerFaction
    );
    
    const controlledZones = gameState.zones.filter(z => 
        z.type !== 'naval' && z.controller === gameState.enemyFaction && z.troops > 30
    );
    
    if (enemyZones.length === 0 || controlledZones.length === 0) return;
    
    // Intentar capturar una zona enemiga
    const targetZone = enemyZones[Math.floor(Math.random() * enemyZones.length)];
    const sourceZone = controlledZones[0];
    
    // Simular ataque
    const attackStrength = sourceZone.troops * 0.6;
    const defenseStrength = targetZone.troops * 0.8;
    
    if (attackStrength > defenseStrength) {
        // La IA captura la zona
        targetZone.controller = gameState.enemyFaction;
        targetZone.troops = Math.floor(attackStrength - defenseStrength);
        sourceZone.troops = Math.floor(sourceZone.troops * 0.4);
        
        addLog(`🤖 IA capturó ${targetZone.name}!`);
    } else {
        // Ataque fallido
        sourceZone.troops = Math.floor(sourceZone.troops * 0.7);
        targetZone.troops = Math.floor(targetZone.troops * 0.85);
        
        addLog(`🤖 IA atacó ${targetZone.name} pero fue repelido`);
    }
}

// ==================== DECISIONES ESTRATÉGICAS ====================
function aiStrategicDecision() {
    const situation = analyzeSituation();
    
    // Ajustar estrategia según fase del juego
    if (situation.isEarlyGame) {
        // Fase temprana: acumular fuerzas
        if (Math.random() > 0.7) {
            aiBuyUnits(situation);
        }
    } else if (situation.isMidGame) {
        // Fase media: equilibrio entre ataque y desarrollo
        if (situation.territoryAdvantage) {
            aiCaptureTerritory();
        } else {
            aiDeployGroundForces();
        }
    } else if (situation.isLateGame) {
        // Fase tardía: agresividad máxima
        if (situation.navalAdvantage) {
            aiNavalCombat();
        }
        aiCaptureTerritory();
    }
}

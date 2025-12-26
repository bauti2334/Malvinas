// ==================== SISTEMA DE COMBATE ====================

/**
 * Ejecuta un combate entre dos unidades
 * @param {Object} attacker - Unidad atacante
 * @param {Object} defender - Unidad defensora
 * @param {string} combatType - Tipo de combate: 'naval', 'air', 'ground'
 * @returns {Object} Resultado del combate
 */
function executeCombat(attacker, defender, combatType) {
    const result = {
        damage: 0,
        attackerDamaged: 0,
        defenderDestroyed: false,
        attackerDestroyed: false,
        critical: false
    };
    
    // Calcular daño base
    let baseDamage = attacker.attack;
    let baseDefense = defender.defense;
    
    // Modificadores aleatorios (simulan precisión, clima, moral, etc.)
    const attackRoll = Math.random() * 0.4 + 0.8; // 0.8 a 1.2
    const defenseRoll = Math.random() * 0.3 + 0.85; // 0.85 a 1.15
    
    // Crítico (10% de probabilidad)
    if (Math.random() < 0.1) {
        result.critical = true;
        baseDamage *= 1.5;
    }
    
    // Calcular daño final
    const finalDamage = Math.max(5, Math.floor((baseDamage * attackRoll) - (baseDefense * defenseRoll * 0.5)));
    result.damage = finalDamage;
    
    // Aplicar daño al defensor
    defender.hp = Math.max(0, defender.hp - finalDamage);
    
    // Verificar si el defensor fue destruido
    if (defender.hp <= 0) {
        result.defenderDestroyed = true;
    }
    
    // Contraataque (si el defensor sobrevive)
    if (!result.defenderDestroyed && Math.random() > 0.3) {
        const counterDamage = Math.floor(defender.attack * 0.4 * (Math.random() * 0.5 + 0.5));
        result.attackerDamaged = counterDamage;
        attacker.hp = Math.max(0, attacker.hp - counterDamage);
        
        if (attacker.hp <= 0) {
            result.attackerDestroyed = true;
        }
    }
    
    return result;
}

/**
 * Combate naval entre dos flotas
 * @param {Array} fleet1 - Flota 1
 * @param {Array} fleet2 - Flota 2
 * @returns {Object} Resultado del combate naval
 */
function executeNavalBattle(fleet1, fleet2) {
    const result = {
        fleet1Losses: [],
        fleet2Losses: [],
        winner: null
    };
    
    // Simular combate por turnos
    let rounds = 0;
    const maxRounds = 5;
    
    while (fleet1.length > 0 && fleet2.length > 0 && rounds < maxRounds) {
        // Fleet 1 ataca
        if (fleet1.length > 0 && fleet2.length > 0) {
            const attacker = fleet1[Math.floor(Math.random() * fleet1.length)];
            const target = fleet2[Math.floor(Math.random() * fleet2.length)];
            
            const combatResult = executeCombat(attacker, target, 'naval');
            
            if (combatResult.defenderDestroyed) {
                const index = fleet2.indexOf(target);
                fleet2.splice(index, 1);
                result.fleet2Losses.push(target);
            }
            
            if (combatResult.attackerDestroyed) {
                const index = fleet1.indexOf(attacker);
                fleet1.splice(index, 1);
                result.fleet1Losses.push(attacker);
            }
        }
        
        // Fleet 2 ataca
        if (fleet1.length > 0 && fleet2.length > 0) {
            const attacker = fleet2[Math.floor(Math.random() * fleet2.length)];
            const target = fleet1[Math.floor(Math.random() * fleet1.length)];
            
            const combatResult = executeCombat(attacker, target, 'naval');
            
            if (combatResult.defenderDestroyed) {
                const index = fleet1.indexOf(target);
                fleet1.splice(index, 1);
                result.fleet1Losses.push(target);
            }
            
            if (combatResult.attackerDestroyed) {
                const index = fleet2.indexOf(attacker);
                fleet2.splice(index, 1);
                result.fleet2Losses.push(attacker);
            }
        }
        
        rounds++;
    }
    
    // Determinar ganador
    if (fleet1.length > fleet2.length) {
        result.winner = 'fleet1';
    } else if (fleet2.length > fleet1.length) {
        result.winner = 'fleet2';
    } else {
        result.winner = 'draw';
    }
    
    return result;
}

/**
 * Combate aéreo
 * @param {Object} aircraft - Avión atacante
 * @param {Object} target - Objetivo (puede ser barco, avión o zona terrestre)
 * @param {string} targetType - Tipo de objetivo
 * @returns {Object} Resultado del ataque aéreo
 */
function executeAirStrike(aircraft, target, targetType) {
    const result = {
        hit: false,
        damage: 0,
        aircraftLost: false
    };
    
    // Probabilidad de impacto según tipo de objetivo
    let hitChance = 0.6;
    
    if (targetType === 'naval') {
        hitChance = 0.5; // Más difícil atacar barcos
    } else if (targetType === 'air') {
        hitChance = 0.4; // Combate aéreo es incierto
    } else if (targetType === 'ground') {
        hitChance = 0.7; // Objetivos terrestres más fáciles
    }
    
    // Modificador de defensa del objetivo
    if (target.defense) {
        hitChance -= (target.defense / 200);
    }
    
    // Ejecutar ataque
    if (Math.random() < hitChance) {
        result.hit = true;
        result.damage = Math.floor(aircraft.attack * (Math.random() * 0.5 + 0.7));
        target.hp = Math.max(0, target.hp - result.damage);
    }
    
    // Probabilidad de perder el avión (fuego antiaéreo, cazas enemigos)
    const lossChance = targetType === 'naval' ? 0.2 : targetType === 'air' ? 0.3 : 0.15;
    
    if (Math.random() < lossChance) {
        result.aircraftLost = true;
    }
    
    return result;
}

/**
 * Combate terrestre
 * @param {Object} attackerUnits - Unidades atacantes
 * @param {Object} defenderUnits - Unidades defensoras
 * @param {Object} zone - Zona donde ocurre el combate
 * @returns {Object} Resultado del combate terrestre
 */
function executeGroundCombat(attackerUnits, defenderUnits, zone) {
    const result = {
        attackerCasualties: 0,
        defenderCasualties: 0,
        zoneControl: null
    };
    
    // Calcular fuerzas
    let attackerStrength = 0;
    attackerUnits.forEach(unit => {
        attackerStrength += unit.attack * unit.qty;
    });
    
    let defenderStrength = 0;
    defenderUnits.forEach(unit => {
        defenderStrength += unit.defense * unit.qty;
    });
    
    // Modificadores del terreno
    if (zone.type === 'mountain') {
        defenderStrength *= 1.5; // Ventaja defensiva en montañas
    } else if (zone.type === 'town') {
        defenderStrength *= 1.2; // Ventaja defensiva en pueblos
    }
    
    // Calcular bajas
    const totalStrength = attackerStrength + defenderStrength;
    const attackerRatio = attackerStrength / totalStrength;
    const defenderRatio = defenderStrength / totalStrength;
    
    // Simular bajas (proporcionales a la fuerza relativa)
    result.attackerCasualties = Math.floor(attackerStrength * 0.3 * defenderRatio * (Math.random() * 0.5 + 0.5));
    result.defenderCasualties = Math.floor(defenderStrength * 0.3 * attackerRatio * (Math.random() * 0.5 + 0.5));
    
    // Determinar control de la zona
    const attackerFinalStrength = attackerStrength - result.attackerCasualties;
    const defenderFinalStrength = defenderStrength - result.defenderCasualties;
    
    if (attackerFinalStrength > defenderFinalStrength * 1.5) {
        result.zoneControl = 'attacker';
    } else if (defenderFinalStrength > attackerFinalStrength * 1.5) {
        result.zoneControl = 'defender';
    } else {
        result.zoneControl = 'contested';
    }
    
    return result;
}

/**
 * Desembarco anfibio
 * @param {Object} landingForce - Fuerza de desembarco
 * @param {Object} navalSupport - Apoyo naval
 * @param {Object} zone - Zona de desembarco
 * @returns {Object} Resultado del desembarco
 */
function executeAmphibiousLanding(landingForce, navalSupport, zone) {
    const result = {
        success: false,
        casualties: 0,
        troopsLanded: 0
    };
    
    // Probabilidad base de éxito
    let successChance = 0.5;
    
    // Modificador de apoyo naval
    const navalStrength = navalSupport.reduce((sum, ship) => sum + ship.attack, 0);
    successChance += Math.min(0.3, navalStrength / 1000);
    
    // Modificador del tipo de zona
    if (zone.type === 'bay') {
        successChance += 0.2; // Bahías son mejores para desembarcos
    } else if (zone.type === 'mountain') {
        successChance -= 0.2; // Costas montañosas son difíciles
    }
    
    // Resistencia defensiva
    if (zone.troops > 0) {
        successChance -= Math.min(0.3, zone.troops / 100);
    }
    
    // Ejecutar desembarco
    if (Math.random() < successChance) {
        result.success = true;
        result.troopsLanded = landingForce.troops;
        result.casualties = Math.floor(landingForce.troops * 0.2 * Math.random());
    } else {
        result.success = false;
        result.casualties = Math.floor(landingForce.troops * 0.5 * Math.random());
    }
    
    return result;
}

/**
 * Calcula modificadores de combate basados en factores externos
 * @param {Object} conditions - Condiciones del combate (clima, moral, logística)
 * @returns {Object} Modificadores aplicables
 */
function calculateCombatModifiers(conditions) {
    const modifiers = {
        attack: 1.0,
        defense: 1.0,
        accuracy: 1.0
    };
    
    // Clima
    if (conditions.weather === 'storm') {
        modifiers.accuracy *= 0.7;
    } else if (conditions.weather === 'fog') {
        modifiers.accuracy *= 0.8;
    }
    
    // Moral
    if (conditions.morale) {
        if (conditions.morale > 75) {
            modifiers.attack *= 1.2;
        } else if (conditions.morale < 30) {
            modifiers.attack *= 0.8;
            modifiers.defense *= 0.9;
        }
    }
    
    // Logística
    if (conditions.logistics) {
        if (conditions.logistics < 50) {
            modifiers.attack *= 0.9;
            modifiers.defense *= 0.9;
        }
    }
    
    return modifiers;
}

/**
 * Simula el efecto de la superioridad aérea
 * @param {number} friendlyAircraft - Número de aviones amigos
 * @param {number} enemyAircraft - Número de aviones enemigos
 * @returns {Object} Resultado de la superioridad aérea
 */
function calculateAirSuperiority(friendlyAircraft, enemyAircraft) {
    const result = {
        superiority: 'contested',
        bonus: 0
    };
    
    const ratio = friendlyAircraft / (enemyAircraft + 1);
    
    if (ratio > 2) {
        result.superiority = 'total';
        result.bonus = 0.3;
    } else if (ratio > 1.5) {
        result.superiority = 'major';
        result.bonus = 0.2;
    } else if (ratio > 1) {
        result.superiority = 'minor';
        result.bonus = 0.1;
    } else if (ratio < 0.5) {
        result.superiority = 'enemy_total';
        result.bonus = -0.3;
    } else if (ratio < 0.75) {
        result.superiority = 'enemy_major';
        result.bonus = -0.2;
    }
    
    return result;
}

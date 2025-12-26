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
    
    // Calcular daño base con variación
    let attackPower = attacker.attack * (0.8 + Math.random() * 0.4); // 80% - 120%
    let defensePower = defender.defense * (0.85 + Math.random() * 0.3); // 85% - 115%
    
    // Crítico (15% de probabilidad)
    if (Math.random() < 0.15) {
        result.critical = true;
        attackPower *= 1.8;
    }
    
    // Calcular daño penetrante
    const penetration = Math.max(0, attackPower - (defensePower * 0.5));
    const finalDamage = Math.max(8, Math.floor(penetration * (0.9 + Math.random() * 0.2)));
    result.damage = finalDamage;
    
    // Aplicar daño al defensor
    defender.hp = Math.max(0, defender.hp - finalDamage);
    
    // Verificar si el defensor fue destruido
    if (defender.hp <= 0) {
        result.defenderDestroyed = true;
        return result;
    }
    
    // Contraataque (70% de probabilidad si el defensor sobrevive)
    if (Math.random() < 0.7) {
        const counterPower = defender.attack * 0.5 * (0.7 + Math.random() * 0.6);
        const counterDamage = Math.floor(counterPower);
        result.attackerDamaged = Math.max(5, counterDamage);
        
        attacker.hp = Math.max(0, attacker.hp - result.attackerDamaged);
        
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
        winner: null,
        rounds: 0
    };
    
    const maxRounds = 5;
    
    while (fleet1.length > 0 && fleet2.length > 0 && result.rounds < maxRounds) {
        // Turno de Fleet 1
        if (fleet1.length > 0 && fleet2.length > 0) {
            const attacker = fleet1[Math.floor(Math.random() * fleet1.length)];
            const target = fleet2[Math.floor(Math.random() * fleet2.length)];
            
            const combatResult = executeCombat(attacker, target, 'naval');
            
            if (combatResult.defenderDestroyed) {
                const index = fleet2.indexOf(target);
                fleet2.splice(index, 1);
                result.fleet2Losses.push(target.name);
            }
            
            if (combatResult.attackerDestroyed) {
                const index = fleet1.indexOf(attacker);
                fleet1.splice(index, 1);
                result.fleet1Losses.push(attacker.name);
            }
        }
        
        // Turno de Fleet 2
        if (fleet1.length > 0 && fleet2.length > 0) {
            const attacker = fleet2[Math.floor(Math.random() * fleet2.length)];
            const target = fleet1[Math.floor(Math.random() * fleet1.length)];
            
            const combatResult = executeCombat(attacker, target, 'naval');
            
            if (combatResult.defenderDestroyed) {
                const index = fleet1.indexOf(target);
                fleet1.splice(index, 1);
                result.fleet1Losses.push(target.name);
            }
            
            if (combatResult.attackerDestroyed) {
                const index = fleet2.indexOf(attacker);
                fleet2.splice(index, 1);
                result.fleet2Losses.push(attacker.name);
            }
        }
        
        result.rounds++;
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
 * Ataque aéreo
 * @param {Object} aircraft - Avión atacante
 * @param {Object} target - Objetivo
 * @param {string} targetType - Tipo de objetivo: 'naval', 'ground', 'air'
 * @returns {Object} Resultado del ataque aéreo
 */
function executeAirStrike(aircraft, target, targetType) {
    const result = {
        hit: false,
        damage: 0,
        aircraftLost: false,
        criticalHit: false
    };
    
    // Probabilidad de impacto según tipo de objetivo
    let baseAccuracy = 0.65;
    
    switch(targetType) {
        case 'naval':
            baseAccuracy = 0.55; // Barcos son objetivos difíciles
            break;
        case 'ground':
            baseAccuracy = 0.75; // Objetivos terrestres más fáciles
            break;
        case 'air':
            baseAccuracy = 0.45; // Combate aéreo es el más difícil
            break;
    }
    
    // Modificador por defensa del objetivo
    const defenseModifier = target.defense ? (target.defense / 200) : 0;
    const finalAccuracy = Math.max(0.2, baseAccuracy - defenseModifier);
    
    // Determinar si impacta
    if (Math.random() < finalAccuracy) {
        result.hit = true;
        
        // Crítico (10% de probabilidad)
        if (Math.random() < 0.1) {
            result.criticalHit = true;
            result.damage = Math.floor(aircraft.attack * 1.5 * (0.9 + Math.random() * 0.3));
        } else {
            result.damage = Math.floor(aircraft.attack * (0.7 + Math.random() * 0.6));
        }
        
        target.hp = Math.max(0, target.hp - result.damage);
    }
    
    // Probabilidad de perder el avión (fuego antiaéreo, interceptores)
    let lossChance = 0.15;
    
    if (targetType === 'naval') lossChance = 0.25; // Barcos tienen AA
    if (targetType === 'air') lossChance = 0.35; // Combate aéreo es peligroso
    if (target.antiAir) lossChance += (target.antiAir / 200); // Bonus de AA
    
    if (Math.random() < lossChance) {
        result.aircraftLost = true;
    }
    
    return result;
}

/**
 * Combate terrestre
 * @param {Array} attackerUnits - Unidades atacantes
 * @param {Array} defenderUnits - Unidades defensoras
 * @param {Object} zone - Zona donde ocurre el combate
 * @returns {Object} Resultado del combate terrestre
 */
function executeGroundCombat(attackerUnits, defenderUnits, zone) {
    const result = {
        attackerCasualties: 0,
        defenderCasualties: 0,
        attackerWins: false,
        defenderWins: false,
        stalemate: false
    };
    
    // Calcular fuerzas totales
    let attackerStrength = 0;
    attackerUnits.forEach(unit => {
        attackerStrength += unit.attack * (unit.qty || 1);
    });
    
    let defenderStrength = 0;
    defenderUnits.forEach(unit => {
        defenderStrength += unit.defense * (unit.qty || 1);
    });
    
    // Modificadores de terreno
    const terrainModifiers = {
        mountain: 1.6,    // Gran ventaja defensiva
        town: 1.3,        // Ventaja defensiva moderada
        capital: 1.5,     // Fortaleza bien defendida
        plains: 1.0,      // Sin modificador
        bay: 0.9          // Ligeramente más difícil de defender
    };
    
    const terrainMod = terrainModifiers[zone.type] || 1.0;
    defenderStrength *= terrainMod;
    
    // Calcular resultado
    const totalStrength = attackerStrength + defenderStrength;
    const attackerRatio = attackerStrength / totalStrength;
    const defenderRatio = defenderStrength / totalStrength;
    
    // Calcular bajas
    const baseAttackerLoss = attackerStrength * 0.25;
    const baseDefenderLoss = defenderStrength * 0.25;
    
    result.attackerCasualties = Math.floor(baseAttackerLoss * defenderRatio * (0.8 + Math.random() * 0.4));
    result.defenderCasualties = Math.floor(baseDefenderLoss * attackerRatio * (0.8 + Math.random() * 0.4));
    
    // Determinar ganador
    const attackerFinal = attackerStrength - result.attackerCasualties;
    const defenderFinal = defenderStrength - result.defenderCasualties;
    
    if (attackerFinal > defenderFinal * 1.5) {
        result.attackerWins = true;
    } else if (defenderFinal > attackerFinal * 1.5) {
        result.defenderWins = true;
    } else {
        result.stalemate = true;
    }
    
    return result;
}

/**
 * Desembarco anfibio
 * @param {Object} landingForce - Fuerza de desembarco
 * @param {Array} navalSupport - Apoyo naval
 * @param {Object} zone - Zona de desembarco
 * @param {Array} defenders - Defensores de la zona
 * @returns {Object} Resultado del desembarco
 */
function executeAmphibiousLanding(landingForce, navalSupport, zone, defenders) {
    const result = {
        success: false,
        casualties: 0,
        troopsLanded: 0,
        navalLosses: 0
    };
    
    // Probabilidad base de éxito
    let successChance = 0.5;
    
    // Modificador de apoyo naval
    const navalPower = navalSupport.reduce((sum, ship) => sum + ship.attack, 0);
    const navalBonus = Math.min(0.35, navalPower / 800);
    successChance += navalBonus;
    
    // Modificador del tipo de zona
    const zoneModifiers = {
        bay: 0.25,      // Bahías son ideales
        plains: 0.1,    // Planicies aceptables
        town: -0.1,     // Pueblos difíciles
        mountain: -0.25, // Costas montañosas muy difíciles
        capital: -0.3   // Capitales fuertemente defendidas
    };
    
    successChance += (zoneModifiers[zone.type] || 0);
    
    // Resistencia de los defensores
    const defenseStrength = defenders.reduce((sum, d) => sum + d.defense, 0);
    const defenseReduction = Math.min(0.4, defenseStrength / 500);
    successChance -= defenseReduction;
    
    // Límites finales
    successChance = Math.max(0.15, Math.min(0.85, successChance));
    
    // Ejecutar desembarco
    if (Math.random() < successChance) {
        result.success = true;
        result.troopsLanded = landingForce.troops;
        
        // Bajas durante el desembarco (15-35%)
        result.casualties = Math.floor(landingForce.troops * (0.15 + Math.random() * 0.2));
        result.troopsLanded -= result.casualties;
        
        // Pérdida naval mínima en desembarcos exitosos
        if (Math.random() < 0.2 && navalSupport.length > 0) {
            result.navalLosses = 1;
        }
    } else {
        result.success = false;
        
        // Bajas severas en desembarcos fallidos (40-70%)
        result.casualties = Math.floor(landingForce.troops * (0.4 + Math.random() * 0.3));
        
        // Mayor riesgo de pérdidas navales
        if (Math.random() < 0.4 && navalSupport.length > 0) {
            result.navalLosses = Math.floor(1 + Math.random() * 2);
        }
    }
    
    return result;
}

/**
 * Calcular modificadores de combate basados en condiciones
 * @param {Object} conditions - Condiciones del combate
 * @returns {Object} Modificadores aplicables
 */
function calculateCombatModifiers(conditions) {
    const modifiers = {
        attackBonus: 1.0,
        defenseBonus: 1.0,
        accuracyBonus: 1.0
    };
    
    // Clima
    if (conditions.weather) {
        switch(conditions.weather) {
            case 'storm':
                modifiers.accuracyBonus *= 0.65;
                modifiers.defenseBonus *= 1.1;
                break;
            case 'fog':
                modifiers.accuracyBonus *= 0.75;
                break;
            case 'clear':
                modifiers.accuracyBonus *= 1.1;
                break;
        }
    }
    
    // Moral
    if (conditions.morale) {
        if (conditions.morale > 80) {
            modifiers.attackBonus *= 1.25;
            modifiers.defenseBonus *= 1.15;
        } else if (conditions.morale > 60) {
            modifiers.attackBonus *= 1.1;
        } else if (conditions.morale < 30) {
            modifiers.attackBonus *= 0.75;
            modifiers.defenseBonus *= 0.85;
        } else if (conditions.morale < 50) {
            modifiers.attackBonus *= 0.9;
        }
    }
    
    // Logística
    if (conditions.logistics) {
        if (conditions.logistics < 40) {
            modifiers.attackBonus *= 0.8;
            modifiers.defenseBonus *= 0.85;
        } else if (conditions.logistics < 60) {
            modifiers.attackBonus *= 0.9;
        }
    }
    
    // Apoyo aéreo
    if (conditions.airSupport) {
        const airBonus = Math.min(0.3, conditions.airSupport / 100);
        modifiers.attackBonus *= (1 + airBonus);
    }
    
    return modifiers;
}

/**
 * Simular superioridad aérea
 * @param {number} friendlyAircraft - Número de aviones amigos
 * @param {number} enemyAircraft - Número de aviones enemigos
 * @returns {Object} Estado de superioridad aérea
 */
function calculateAirSuperiority(friendlyAircraft, enemyAircraft) {
    const result = {
        superiority: 'contested',
        bonus: 0,
        description: ''
    };
    
    if (enemyAircraft === 0 && friendlyAircraft > 0) {
        result.superiority = 'absolute';
        result.bonus = 0.4;
        result.description = 'Superioridad aérea absoluta';
    } else if (enemyAircraft === 0) {
        result.superiority = 'neutral';
        result.bonus = 0;
        result.description = 'Sin aviación en la zona';
    } else {
        const ratio = friendlyAircraft / enemyAircraft;
        
        if (ratio >= 3) {
            result.superiority = 'overwhelming';
            result.bonus = 0.35;
            result.description = 'Superioridad aérea abrumadora';
        } else if (ratio >= 2) {
            result.superiority = 'major';
            result.bonus = 0.25;
            result.description = 'Superioridad aérea mayor';
        } else if (ratio >= 1.5) {
            result.superiority = 'moderate';
            result.bonus = 0.15;
            result.description = 'Superioridad aérea moderada';
        } else if (ratio > 1) {
            result.superiority = 'slight';
            result.bonus = 0.08;
            result.description = 'Leve superioridad aérea';
        } else if (ratio > 0.66) {
            result.superiority = 'contested';
            result.bonus = 0;
            result.description = 'Espacio aéreo disputado';
        } else if (ratio > 0.5) {
            result.superiority = 'slight_enemy';
            result.bonus = -0.08;
            result.description = 'Leve superioridad aérea enemiga';
        } else if (ratio > 0.33) {
            result.superiority = 'enemy_moderate';
            result.bonus = -0.15;
            result.description = 'Superioridad aérea enemiga moderada';
        } else {
            result.superiority = 'enemy_major';
            result.bonus = -0.25;
            result.description = 'Superioridad aérea enemiga mayor';
        }
    }
    
    return result;
}

/**
 * Calcular daño de artillería
 * @param {Object} artillery - Unidad de artillería
 * @param {Object} target - Objetivo
 * @param {number} distance - Distancia al objetivo
 * @returns {Object} Resultado del bombardeo
 */
function executeArtilleryStrike(artillery, target, distance) {
    const result = {
        hit: false,
        damage: 0,
        suppression: 0
    };
    
    // Verificar alcance
    const maxRange = CONFIG.gameplay.attackRange.artillery || 150;
    if (distance > maxRange) {
        return result; // Fuera de alcance
    }
    
    // Precisión disminuye con la distancia
    const baseAccuracy = 0.7;
    const rangeModifier = 1 - (distance / maxRange) * 0.4;
    const finalAccuracy = baseAccuracy * rangeModifier;
    
    if (Math.random() < finalAccuracy) {
        result.hit = true;
        result.damage = Math.floor(artillery.attack * 0.8 * (0.8 + Math.random() * 0.4));
        
        // La artillería también suprime (reduce efectividad temporalmente)
        result.suppression = Math.floor(result.damage * 0.5);
        
        target.hp = Math.max(0, target.hp - result.damage);
    }
    
    return result;
}

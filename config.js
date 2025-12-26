const CONFIG = {
    canvasWidth: 1000,
    canvasHeight: 800,
    
    // Mapa basado en silueta real
    islands: [
        {
            name: "Gran Malvina",
            points: [{x:220, y:300}, {x:320, y:280}, {x:380, y:350}, {x:350, y:550}, {x:250, y:600}, {x:180, y:500}, {x:200, y:350}],
            color: '#344e31'
        },
        {
            name: "Isla Soledad",
            points: [{x:480, y:320}, {x:600, y:300}, {x:750, y:380}, {x:730, y:580}, {x:620, y:650}, {x:480, y:600}, {x:450, y:450}],
            color: '#344e31'
        }
    ],

    mechanics: {
        moveFuelCost: 10,
        moveFatigue: 25,     // Aumento por cada movimiento
        recoveryRate: 20,    // Recuperación si NO se mueve en el turno
        maxFatigue: 100,
        minFuelToMove: 10
    }
};

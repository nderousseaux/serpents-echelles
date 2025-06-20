// /api/stats.js - API Vercel Function pour gérer les statistiques globales
const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Fonction pour initialiser la table des statistiques
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_stats (
        id SERIAL PRIMARY KEY,
        total_games INTEGER DEFAULT 0,
        total_turns INTEGER DEFAULT 0,
        total_rolls INTEGER DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        total_snakes INTEGER DEFAULT 0,
        total_ladders INTEGER DEFAULT 0,
        total_bounces INTEGER DEFAULT 0,
        shortest_game INTEGER,
        longest_game INTEGER,
        shortest_game_turns INTEGER,
        longest_game_turns INTEGER,
        max_snakes_per_game INTEGER DEFAULT 0,
        max_ladders_per_game INTEGER DEFAULT 0,
        max_bounces_per_game INTEGER DEFAULT 0,
        all_dice_rolls TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insérer une ligne initiale si elle n'existe pas
    const result = await client.query('SELECT COUNT(*) FROM global_stats');
    if (parseInt(result.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO global_stats (total_games) VALUES (0);
      `);
    }
    
    // Ajouter les nouvelles colonnes si elles n'existent pas (migration)
    try {
      await client.query(`
        ALTER TABLE global_stats 
        ADD COLUMN IF NOT EXISTS shortest_game_turns INTEGER,
        ADD COLUMN IF NOT EXISTS longest_game_turns INTEGER;
      `);
    } catch (err) {
      // Ignorer les erreurs si les colonnes existent déjà
      console.log('Migration des colonnes ignorée (déjà existantes)');
    }
  } finally {
    client.release();
  }
}

module.exports = async function handler(req, res) {
  // Configurer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Désactiver le cache pour avoir des données toujours fraîches
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();
    
    if (req.method === 'GET') {
      // Récupérer les statistiques globales
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM global_stats ORDER BY id DESC LIMIT 1');
        const stats = result.rows[0];
        
        if (!stats) {
          return res.status(404).json({ error: 'Aucune statistique trouvée' });
        }
        
        // Calculer les moyennes
        const diceRolls = JSON.parse(stats.all_dice_rolls || '[]');
        const averageDice = diceRolls.length > 0 
          ? (diceRolls.reduce((a, b) => a + b, 0) / diceRolls.length).toFixed(2) 
          : 0;
        
        const averageGameDuration = stats.total_games > 0 
          ? Math.round(stats.total_duration / stats.total_games) 
          : 0;
        
        const averageTurnsPerGame = stats.total_games > 0 
          ? Math.round(stats.total_turns / stats.total_games) 
          : 0;
        
        const formattedStats = {
          totalGames: stats.total_games,
          shortestGame: stats.shortest_game,
          longestGame: stats.longest_game,
          shortestGameTurns: stats.shortest_game_turns,
          longestGameTurns: stats.longest_game_turns,
          averageGameDuration,
          averageTurnsPerGame,
          totalRolls: stats.total_rolls,
          averageDice: parseFloat(averageDice),
          maxSnakesPerGame: stats.max_snakes_per_game,
          maxLaddersPerGame: stats.max_ladders_per_game,
          maxBouncesPerGame: stats.max_bounces_per_game
        };
        
        return res.status(200).json(formattedStats);
      } finally {
        client.release();
      }
    }
    
    if (req.method === 'POST') {
      // Ajouter une nouvelle partie aux statistiques
      const {
        duration,
        turns,
        rolls,
        snakes,
        ladders,
        bounces,
        diceRolls
      } = req.body;
      
      if (!duration || !turns || !rolls) {
        return res.status(400).json({ error: 'Données manquantes' });
      }
      
      const client = await pool.connect();
      try {
        // Récupérer les stats actuelles
        const currentResult = await client.query('SELECT * FROM global_stats ORDER BY id DESC LIMIT 1');
        const current = currentResult.rows[0];
        
        // Calculer les nouvelles valeurs
        const newTotalGames = current.total_games + 1;
        const newTotalTurns = current.total_turns + turns;
        const newTotalRolls = current.total_rolls + rolls;
        const newTotalDuration = current.total_duration + duration;
        const newTotalSnakes = current.total_snakes + snakes;
        const newTotalLadders = current.total_ladders + ladders;
        const newTotalBounces = current.total_bounces + bounces;
        
        const newShortestGame = current.shortest_game 
          ? Math.min(current.shortest_game, duration) 
          : duration;
        const newLongestGame = current.longest_game 
          ? Math.max(current.longest_game, duration) 
          : duration;
        
        const newShortestGameTurns = current.shortest_game_turns 
          ? Math.min(current.shortest_game_turns, turns) 
          : turns;
        const newLongestGameTurns = current.longest_game_turns 
          ? Math.max(current.longest_game_turns, turns) 
          : turns;
        
        const newMaxSnakes = Math.max(current.max_snakes_per_game, snakes);
        const newMaxLadders = Math.max(current.max_ladders_per_game, ladders);
        const newMaxBounces = Math.max(current.max_bounces_per_game, bounces);
        
        // Mettre à jour les lancers de dés
        const currentDiceRolls = JSON.parse(current.all_dice_rolls || '[]');
        const updatedDiceRolls = [...currentDiceRolls, ...diceRolls];
        
        // Mettre à jour en base
        await client.query(`
          UPDATE global_stats 
          SET 
            total_games = $1,
            total_turns = $2,
            total_rolls = $3,
            total_duration = $4,
            total_snakes = $5,
            total_ladders = $6,
            total_bounces = $7,
            shortest_game = $8,
            longest_game = $9,
            shortest_game_turns = $10,
            longest_game_turns = $11,
            max_snakes_per_game = $12,
            max_ladders_per_game = $13,
            max_bounces_per_game = $14,
            all_dice_rolls = $15,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $16
        `, [
          newTotalGames, newTotalTurns, newTotalRolls, newTotalDuration,
          newTotalSnakes, newTotalLadders, newTotalBounces,
          newShortestGame, newLongestGame,
          newShortestGameTurns, newLongestGameTurns,
          newMaxSnakes, newMaxLadders, newMaxBounces,
          JSON.stringify(updatedDiceRolls),
          current.id
        ]);
        
        return res.status(200).json({ success: true, message: 'Statistiques mises à jour' });
      } finally {
        client.release();
      }
    }
    
    if (req.method === 'DELETE') {
      // Réinitialiser les statistiques globales
      const client = await pool.connect();
      try {
        await client.query(`
          UPDATE global_stats 
          SET 
            total_games = 0,
            total_turns = 0,
            total_rolls = 0,
            total_duration = 0,
            total_snakes = 0,
            total_ladders = 0,
            total_bounces = 0,
            shortest_game = NULL,
            longest_game = NULL,
            shortest_game_turns = NULL,
            longest_game_turns = NULL,
            max_snakes_per_game = 0,
            max_ladders_per_game = 0,
            max_bounces_per_game = 0,
            all_dice_rolls = '[]',
            updated_at = CURRENT_TIMESTAMP
        `);
        
        return res.status(200).json({ success: true, message: 'Statistiques réinitialisées' });
      } finally {
        client.release();
      }
    }
    
    return res.status(405).json({ error: 'Méthode non autorisée' });
    
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

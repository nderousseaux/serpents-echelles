class SnakesAndLadders {
    constructor() {
        this.players = [];
        this.currentPlayer = 0;
        this.gameWon = false;
        this.isRolling = false;
        this.gameStarted = false;
        this.selectedPlayerCount = 0;
        this.autoMode = false;
        this.autoInterval = null;
        
        // Statistiques de la partie
        this.stats = {
            gameStartTime: null,
            totalRolls: 0,
            totalTurns: 0,
            diceRolls: [],
            snakeHits: 0,
            ladderHits: 0,
            bounces: 0,
            playerStats: {}
        };
        
        // Icônes et couleurs pour les joueurs
        this.playerData = [
            { icon: '🔴', color: '#e74c3c', name: 'Rouge' },
            { icon: '🔵', color: '#3498db', name: 'Bleu' },
            { icon: '🟢', color: '#27ae60', name: 'Vert' },
            { icon: '🟡', color: '#f1c40f', name: 'Jaune' },
            { icon: '🟣', color: '#9b59b6', name: 'Violet' },
            { icon: '🟠', color: '#e67e22', name: 'Orange' }
        ];
        
        // Configuration des serpents et échelles
        this.snakes = {
            96: 80,
            94: 11,
            89: 70,
            82: 59,
            67: 37,
            44: 15,
            41: 21,
            23: 5,
        };
        
        this.ladders = {
            3: 25,
            9: 47,
            43: 76,
            46: 56,
            50: 86,
            60: 62,
            90: 92
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.showPlayerSetup();
    }
    
    createBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        
        // Créer les cases de 100 à 1 (de haut en bas, en serpentant)
        // Case 1 en bas à gauche, case 100 en haut à droite
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                let cellNumber;
                
                // Calculer le numéro de case en serpentant (en partant du bas)
                const actualRow = 9 - row; // Inverser les lignes pour que la case 1 soit en bas
                if (actualRow % 2 === 0) {
                    // Lignes paires (en partant du bas) : de gauche à droite
                    cellNumber = actualRow * 10 + col + 1;
                } else {
                    // Lignes impaires (en partant du bas) : de droite à gauche
                    cellNumber = actualRow * 10 + (9 - col) + 1;
                }
                
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${cellNumber}`;
                
                const cellNumberDiv = document.createElement('div');
                cellNumberDiv.className = 'cell-number';
                cellNumberDiv.textContent = cellNumber;
                
                const cellContentDiv = document.createElement('div');
                cellContentDiv.className = 'cell-content';
                
                const playersContainer = document.createElement('div');
                playersContainer.className = 'players-container';
                
                // Ajouter les icônes et connexions pour les serpents et échelles
                if (this.snakes[cellNumber]) {
                    // Tête de serpent : afficher la destination
                    cell.classList.add('snake-head');
                    cellContentDiv.innerHTML = `🐍<br><small>→${this.snakes[cellNumber]}</small>`;
                } else if (Object.values(this.snakes).includes(cellNumber)) {
                    // Queue de serpent : emoji + numéro de départ en petit sur même ligne
                    const head = Object.keys(this.snakes).find(key => this.snakes[key] == cellNumber);
                    cellContentDiv.classList.add('arrival');
                    cellContentDiv.innerHTML = `<small>(🐍 ${head})</small>`;
                } else if (this.ladders[cellNumber]) {
                    // Pied d'échelle : afficher la destination
                    cell.classList.add('ladder-bottom');
                    cellContentDiv.innerHTML = `🪜<br><small>→${this.ladders[cellNumber]}</small>`;
                } else if (Object.values(this.ladders).includes(cellNumber)) {
                    // Sommet d'échelle : emoji + numéro de départ en petit sur même ligne
                    const bottom = Object.keys(this.ladders).find(key => this.ladders[key] == cellNumber);
                    cellContentDiv.classList.add('arrival');
                    cellContentDiv.innerHTML = `<small>(🪜 ${bottom})</small>`;
                }
                
                cell.appendChild(cellNumberDiv);
                cell.appendChild(cellContentDiv);
                cell.appendChild(playersContainer);
                
                board.appendChild(cell);
            }
        }
        
        // Placer les joueurs sur la case de départ (case 0 = avant la case 1)
        this.updatePlayerPositions();
    }
    
    setupEventListeners() {
        const rollDiceBtn = document.getElementById('rollDice');
        const newGameBtn = document.getElementById('newGame');
        const rulesBtn = document.getElementById('rules');
        const statsBtn = document.getElementById('stats');
        const autoModeBtn = document.getElementById('autoMode');
        const rulesModal = document.getElementById('rulesModal');
        const winModal = document.getElementById('winModal');
        const statsModal = document.getElementById('statsModal');
        const autoModeModal = document.getElementById('autoModeModal');
        const closeBtn = document.querySelector('.close');
        const playAgainBtn = document.getElementById('playAgain');
        const closeStatsBtn = document.getElementById('closeStats');
        const confirmAutoModeBtn = document.getElementById('confirmAutoMode');
        const cancelAutoModeBtn = document.getElementById('cancelAutoMode');
        
        // Debug: vérifier que les éléments existent
        
        rollDiceBtn.addEventListener('click', () => this.rollDice());
        newGameBtn.addEventListener('click', () => this.newGame());
        rulesBtn.addEventListener('click', () => this.showRules());
        
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                this.showStats();
            });
        } else {
            console.error('Stats button not found!');
        }
        
        autoModeBtn.addEventListener('click', () => this.showAutoModeModal());
        confirmAutoModeBtn.addEventListener('click', () => this.startAutoMode());
        cancelAutoModeBtn.addEventListener('click', () => this.hideAutoModeModal());
        closeBtn.addEventListener('click', () => this.hideRules());
        playAgainBtn.addEventListener('click', () => this.newGame());
        closeStatsBtn.addEventListener('click', () => this.hideStats());
        
        // Event listeners pour les onglets de statistiques
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchStatsTab(e.target.dataset.tab));
        });

        // Fermer les modales en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target === rulesModal) {
                this.hideRules();
            }
            if (e.target === winModal) {
                this.hideWinModal();
            }
            if (e.target === statsModal) {
                this.hideStats();
            }
            if (e.target === autoModeModal) {
                this.hideAutoModeModal();
            }
        });
        
        // Raccourci clavier pour lancer le dé (espace)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isRolling && !this.gameWon && !this.autoMode) {
                e.preventDefault();
                this.rollDice();
            }
        });
    }
    
    rollDice() {
        if (this.isRolling || this.gameWon || !this.gameStarted) return;
        
        // En mode automatique, on ne peut pas interagir manuellement
        if (this.autoMode && event && event.type === 'click') {
            return;
        }
        
        this.isRolling = true;
        const diceElement = document.getElementById('dice');
        const rollBtn = document.getElementById('rollDice');
        const diceResult = document.getElementById('diceResult');
        
        // Animation du dé
        diceElement.classList.add('rolling');
        rollBtn.disabled = true;
        diceResult.textContent = '';
        
        // Simuler le roulement du dé
        const diceSymbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            diceElement.textContent = diceSymbols[Math.floor(Math.random() * 6)];
            rollCount++;
            
            if (rollCount >= 10) {
                clearInterval(rollInterval);
                
                // Résultat final
                const result = Math.floor(Math.random() * 6) + 1;
                diceElement.textContent = diceSymbols[result - 1];
                diceElement.classList.remove('rolling');
                diceResult.textContent = `Résultat: ${result}`;
                
                // Déplacer le joueur
                setTimeout(() => {
                    this.movePlayer(result);
                }, 500);
            }
        }, 100);
    }
    
    movePlayer(steps) {
        const player = this.players[this.currentPlayer];
        const oldPosition = player.position;
        let newPosition = player.position + steps;
        let eventType = null;
        
        // Règle du rebond : si on dépasse 100, on recule d'autant
        if (newPosition > 100) {
            newPosition = 100 - (newPosition - 100);
            this.showMessage(`Dépassement ! Rebond vers la case ${newPosition}`, 'warning');
            eventType = 'bounce';
        }
        
        // Mettre à jour les statistiques pour le mouvement de base
        this.updateStats(player.id, steps, oldPosition, newPosition, eventType);
        
        this.animatePlayerMovement(player, newPosition).then(() => {
            player.position = newPosition;
            
            // Vérifier la victoire EXACTE à 100
            if (newPosition === 100) {
                this.gameWon = true;
                this.showWinModal();
                return;
            }
            
            // Vérifier les serpents et échelles
            if (this.snakes[newPosition]) {
                setTimeout(() => {
                    const snakeEnd = this.snakes[newPosition];
                    // Mettre à jour les stats pour le serpent
                    this.updateStats(player.id, 0, newPosition, snakeEnd, 'snake');
                    // Animation directe pour le serpent
                    this.animateDirectMovement(player, snakeEnd).then(() => {
                        player.position = snakeEnd;
                        this.updateUI();
                        this.showMessage(`Oops! Serpent! Descente à la case ${snakeEnd}`, 'warning');
                        this.endTurn();
                    });
                }, 1000);
                return;
            } else if (this.ladders[newPosition]) {
                setTimeout(() => {
                    const ladderEnd = this.ladders[newPosition];
                    // Mettre à jour les stats pour l'échelle
                    this.updateStats(player.id, 0, newPosition, ladderEnd, 'ladder');
                    // Animation directe pour l'échelle
                    this.animateDirectMovement(player, ladderEnd).then(() => {
                        player.position = ladderEnd;
                        this.updateUI();
                        this.showMessage(`Super! Échelle! Montée à la case ${ladderEnd}`, 'success');
                        this.endTurn();
                    });
                }, 1000);
                return;
            }
            
            this.updateUI();
            this.endTurn();
        });
    }
    
    animatePlayerMovement(player, targetPosition) {
        return new Promise((resolve) => {
            const startPosition = player.position;
            let currentPos = startPosition;
            
            const moveStep = () => {
                if (currentPos < targetPosition) {
                    currentPos++;
                    this.updatePlayerPosition(player, currentPos);
                    setTimeout(moveStep, 200);
                } else if (currentPos > targetPosition) {
                    currentPos--;
                    this.updatePlayerPosition(player, currentPos);
                    setTimeout(moveStep, 200);
                } else {
                    resolve();
                }
            };
            
            if (startPosition !== targetPosition) {
                moveStep();
            } else {
                // Même position, juste mettre à jour l'affichage
                this.updatePlayerPosition(player, targetPosition);
                resolve();
            }
        });
    }
    
    animateDirectMovement(player, targetPosition) {
        return new Promise((resolve) => {
            // Téléportation instantanée : retirer de la position actuelle
            document.querySelectorAll(`.player-token.player${player.id}`).forEach(token => {
                token.remove();
            });
            
            // Ajouter directement à la nouvelle position
            this.updatePlayerPosition(player, targetPosition);
            
            // Effet visuel rapide pour indiquer la téléportation
            const targetCell = document.getElementById(`cell-${targetPosition}`);
            if (targetCell) {
                targetCell.style.animation = 'teleportFlash 0.5s ease-in-out';
                setTimeout(() => {
                    targetCell.style.animation = '';
                    resolve();
                }, 500);
            } else {
                resolve();
            }
        });
    }
    
    updatePlayerPosition(player, position) {
        // Retirer le joueur de sa position actuelle
        document.querySelectorAll(`.player-token.player${player.id}`).forEach(token => {
            token.remove();
        });
        
        // Ajouter le joueur à sa nouvelle position
        if (position > 0) {
            const targetCell = document.getElementById(`cell-${position}`);
            if (targetCell) {
                const playersContainer = targetCell.querySelector('.players-container');
                const playerToken = document.createElement('div');
                playerToken.className = `player-token player${player.id}`;
                playerToken.style.backgroundColor = player.data.color;
                playersContainer.appendChild(playerToken);
            }
        }
    }
    
    updatePlayerPositions() {
        this.players.forEach(player => {
            this.updatePlayerPosition(player, player.position);
        });
    }
    
    endTurn() {
        this.isRolling = false;
        document.getElementById('rollDice').disabled = false;
        
        if (!this.gameWon) {
            // Incrémenter le nombre de tours
            this.stats.totalTurns++;
            // Changer de joueur
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            this.updateUI();
        }
    }
    
    updateUI() {
        if (!this.gameStarted) return;
        
        // Mettre à jour les informations des joueurs
        this.players.forEach((player, index) => {
            const playerElement = document.querySelector(`.player${player.id}`);
            if (playerElement) {
                const positionElement = playerElement.querySelector('.position');
                
                playerElement.classList.toggle('active', index === this.currentPlayer && !this.gameWon);
                positionElement.textContent = `Case: ${player.position}`;
            }
        });
        
        // Mettre à jour le bouton de dé
        const rollBtn = document.getElementById('rollDice');
        if (this.autoMode) {
            rollBtn.textContent = '🤖 Mode Automatique - Tous les joueurs';
            rollBtn.disabled = true;
        } else if (this.players.length > 0) {
            const currentPlayerData = this.players[this.currentPlayer].data;
            rollBtn.textContent = `${currentPlayerData.icon} Joueur ${this.currentPlayer + 1} - Lancer le dé`;
            rollBtn.disabled = this.isRolling || this.gameWon || !this.gameStarted;
        }
    }
    
    showMessage(message, type = 'info') {
        const diceResult = document.getElementById('diceResult');
        diceResult.textContent = message;
        diceResult.style.color = type === 'success' ? '#27ae60' : 
                                type === 'warning' ? '#f39c12' : 
                                type === 'error' ? '#e74c3c' : '#2c3e50';
    }
    
    showWinModal() {
        const modal = document.getElementById('winModal');
        const message = document.getElementById('winMessage');
        const winnerPlayer = this.players[this.currentPlayer];
        const playerData = this.playerData[this.currentPlayer];
        message.innerHTML = `<strong style="color: ${playerData.color};">${playerData.icon} Joueur ${winnerPlayer.id} (${playerData.name})</strong> a gagné !`;
        modal.style.display = 'block';
        
        // Sauvegarder les statistiques de la partie
        this.saveCurrentGameStats();
    }
    
    hideWinModal() {
        document.getElementById('winModal').style.display = 'none';
    }
    
    showRules() {
        document.getElementById('rulesModal').style.display = 'block';
    }
    
    hideRules() {
        document.getElementById('rulesModal').style.display = 'none';
    }
    
    showPlayerSetup() {
        const modal = document.getElementById('playerSetupModal');
        const playerCountBtns = document.querySelectorAll('.player-count-btn');
        const startGameBtn = document.getElementById('startGame');
        
        // Afficher la modal
        modal.style.display = 'block';
        
        // Gérer la sélection du nombre de joueurs
        playerCountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Retirer la sélection précédente
                playerCountBtns.forEach(b => b.classList.remove('selected'));
                
                // Sélectionner le bouton cliqué
                btn.classList.add('selected');
                this.selectedPlayerCount = parseInt(btn.dataset.count);
                
                // Activer le bouton de démarrage
                startGameBtn.disabled = false;
            });
        });
        
        // Gérer le démarrage de la partie
        startGameBtn.addEventListener('click', () => {
            this.initializePlayers(this.selectedPlayerCount);
            modal.style.display = 'none';
            this.gameStarted = true;
            this.updateUI();
        });
    }
    
    initializePlayers(count) {
        this.players = [];
        
        // Réinitialiser les statistiques
        this.stats = {
            gameStartTime: Date.now(),
            totalRolls: 0,
            totalTurns: 0,
            diceRolls: [],
            snakeHits: 0,
            ladderHits: 0,
            bounces: 0,
            playerStats: {}
        };
        
        // Créer les joueurs
        for (let i = 0; i < count; i++) {
            this.players.push({
                id: i + 1,
                position: 0,
                data: this.playerData[i]
            });
            // Initialiser les stats pour chaque joueur
            this.initializePlayerStats(i + 1);
        }
        
   
        // Créer l'interface des joueurs
        this.createPlayerInterface();
        this.updatePlayerPositions();
    }
    
    createPlayerInterface() {
        const playerInfo = document.getElementById('playerInfo');
        playerInfo.innerHTML = '';
        
        this.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `player player${player.id}`;
            if (index === 0) playerDiv.classList.add('active');
            
            playerDiv.innerHTML = `
                <span class="player-icon">${player.data.icon}</span>
                <span>Joueur ${player.id}</span>
                <span class="position">Case: 0</span>
            `;
            
            playerInfo.appendChild(playerDiv);
        });
    }

    newGame() {
        // Arrêter le mode automatique s'il est actif
        if (this.autoMode) {
            this.stopAutoMode();
        }
        
        // Réinitialiser l'état du jeu
        this.currentPlayer = 0;
        this.gameWon = false;
        this.isRolling = false;
        this.gameStarted = false;
        this.selectedPlayerCount = 0;
        
        // Réinitialiser les positions des joueurs s'ils existent
        this.players.forEach(player => {
            player.position = 0;
        });
        
        document.getElementById('diceResult').textContent = '';
        document.getElementById('dice').textContent = '🎲';
        
        this.hideWinModal();
        this.hideRules();
        
        // Nettoyer l'interface des joueurs
        document.getElementById('playerInfo').innerHTML = '';
        
        // Nettoyer le plateau
        document.querySelectorAll('.player-token').forEach(token => {
            token.remove();
        });
        
        // Afficher la sélection des joueurs
        this.showPlayerSetup();
        
        this.showMessage('Choisissez le nombre de joueurs pour commencer !', 'info');
    }
    
    showAutoModeModal() {
        if (!this.gameStarted) {
            this.showMessage('Démarrez une partie avant d\'activer le mode automatique !', 'warning');
            return;
        }
        document.getElementById('autoModeModal').style.display = 'block';
    }
    
    hideAutoModeModal() {
        document.getElementById('autoModeModal').style.display = 'none';
    }
    
    startAutoMode() {
        this.autoMode = true;
        this.hideAutoModeModal();
        
        // Modifier l'interface pour indiquer le mode automatique
        const autoModeBtn = document.getElementById('autoMode');
        autoModeBtn.textContent = 'Arrêter Auto Mode';
        autoModeBtn.classList.remove('btn-warning');
        autoModeBtn.classList.add('btn-danger');
        
        // Mettre à jour l'interface
        this.updateUI();
        
        this.showMessage('Mode automatique activé ! Tous les joueurs jouent automatiquement...', 'info');
        
        // Démarrer l'auto-play pour tous les joueurs
        this.startAutoPlay();
        
        // Remplacer complètement le gestionnaire d'événement
        const newAutoModeBtn = autoModeBtn.cloneNode(true);
        autoModeBtn.parentNode.replaceChild(newAutoModeBtn, autoModeBtn);
        newAutoModeBtn.addEventListener('click', () => this.stopAutoMode());
    }
    
    stopAutoMode() {
        this.autoMode = false;
        
        // Arrêter l'intervalle
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
        
        // Restaurer l'interface
        const autoModeBtn = document.getElementById('autoMode');
        autoModeBtn.textContent = 'Mode Automatique';
        autoModeBtn.classList.remove('btn-danger');
        autoModeBtn.classList.add('btn-warning');
        
        // Mettre à jour l'interface
        this.updateUI();
        
        this.showMessage('Mode automatique désactivé', 'info');
        
        // Remplacer complètement le gestionnaire d'événement pour éviter les conflits
        const newAutoModeBtn = autoModeBtn.cloneNode(true);
        autoModeBtn.parentNode.replaceChild(newAutoModeBtn, autoModeBtn);
        newAutoModeBtn.addEventListener('click', () => this.showAutoModeModal());
    }
    
    startAutoPlay() {
        if (!this.autoMode || this.gameWon) return;
        
        // Jouer automatiquement pour tous les joueurs en continu
        this.autoInterval = setInterval(() => {
            if (!this.autoMode || this.gameWon || this.isRolling) {
                if (this.gameWon || !this.autoMode) {
                    this.stopAutoMode();
                }
                return;
            }
            
            // Lancer automatiquement pour le joueur actuel
            this.rollDice();
        }, 1500); // Réduit à 1.5 secondes pour une action plus fluide
    }

    // Méthodes pour les statistiques
    initializePlayerStats(playerId) {
        if (!this.stats.playerStats[playerId]) {
            this.stats.playerStats[playerId] = {
                position: 1,
                rolls: 0,
                snakeHits: 0,
                ladderHits: 0,
                bounces: 0,
                maxPosition: 1
            };
        }
    }
    
    updateStats(playerId, diceValue, oldPosition, newPosition, eventType = null) {
        this.initializePlayerStats(playerId);
        
        const playerStats = this.stats.playerStats[playerId];
        playerStats.rolls++;
        playerStats.position = newPosition;
        playerStats.maxPosition = Math.max(playerStats.maxPosition, newPosition);
        
        this.stats.totalRolls++;
        this.stats.diceRolls.push(diceValue);
        
        if (eventType === 'snake') {
            this.stats.snakeHits++;
            playerStats.snakeHits++;
        } else if (eventType === 'ladder') {
            this.stats.ladderHits++;
            playerStats.ladderHits++;
        } else if (eventType === 'bounce') {
            this.stats.bounces++;
            playerStats.bounces++;
        }
    }
    
    showStats() {
        this.updateStatsDisplay();
        const statsModal = document.getElementById('statsModal');
        if (statsModal) {
            statsModal.style.display = 'block';
            
            // Vérifier si l'onglet global est actif et recharger les données
            const activeTab = document.querySelector('.stats-tab.active');
            if (activeTab && activeTab.dataset.tab === 'global') {
                this.showGlobalStatsLoading(true);
                this.loadGlobalStats();
            }
        } else {
            console.error('Stats modal not found in showStats!');
        }
    }
    
    hideStats() {
        document.getElementById('statsModal').style.display = 'none';
    }
    
    updateStatsDisplay() {
        const now = Date.now();
        const duration = this.stats.gameStartTime ? now - this.stats.gameStartTime : 0;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        const diceAverage = this.stats.diceRolls.length > 0 
            ? (this.stats.diceRolls.reduce((a, b) => a + b, 0) / this.stats.diceRolls.length).toFixed(2)
            : 0;
        
        const highestRoll = this.stats.diceRolls.length > 0 
            ? Math.max(...this.stats.diceRolls)
            : 0;
        
        // Mise à jour des statistiques générales
        document.getElementById('statPlayerCount').textContent = this.players.length;
        document.getElementById('statTotalTurns').textContent = this.stats.totalTurns;
        document.getElementById('statGameDuration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('statTotalRolls').textContent = this.stats.totalRolls;
        document.getElementById('statDiceAverage').textContent = diceAverage;
        document.getElementById('statHighestRoll').textContent = highestRoll;
        document.getElementById('statSnakeHits').textContent = this.stats.snakeHits;
        document.getElementById('statLadderHits').textContent = this.stats.ladderHits;
        document.getElementById('statBounces').textContent = this.stats.bounces;
        
        // Mise à jour du classement des joueurs
        this.updatePlayerRanking();
    }
    
    updatePlayerRanking() {
        const rankingContainer = document.getElementById('playerRanking');
        rankingContainer.innerHTML = '';
        
        // Trier les joueurs par position (du plus éloigné au plus proche de 100)
        const sortedPlayers = [...this.players].sort((a, b) => b.position - a.position);
        
        sortedPlayers.forEach((player, index) => {
            const playerStats = this.stats.playerStats[player.id] || {};
            const playerData = this.playerData[player.id - 1];
            const isWinner = player.position === 100;
            
            const rankItem = document.createElement('div');
            rankItem.className = `player-rank-item ${isWinner ? 'winner' : ''}`;
            
            rankItem.innerHTML = `
                <div class="player-rank-info">
                    <span class="player-rank-position">#${index + 1}</span>
                    <span style="color: ${playerData.color}; font-size: 1.2em;">${playerData.icon}</span>
                    <span class="player-rank-name">Joueur ${player.id} (${playerData.name})</span>
                </div>
                <div class="player-rank-stats">
                    <div>Position: <strong>${player.position}</strong></div>
                    <div>Lancers: <strong>${playerStats.rolls || 0}</strong></div>
                    <div>🐍 ${playerStats.snakeHits || 0} | 🪜 ${playerStats.ladderHits || 0}</div>
                </div>
            `;
            
            rankingContainer.appendChild(rankItem);
        });
    }
    
    // Méthodes pour les onglets de statistiques
    switchStatsTab(tabName) {
        // Masquer tous les contenus d'onglets
        document.querySelectorAll('.stats-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Désactiver tous les onglets
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Activer l'onglet et le contenu sélectionnés
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}StatsContent`).classList.add('active');
        
        // Toujours recharger les données globales quand on clique sur l'onglet global
        if (tabName === 'global') {
            this.showGlobalStatsLoading(true);
            this.loadGlobalStats();
        }
    }
    
    // Charger et afficher les statistiques globales
    async loadGlobalStats() {
        // Afficher l'indicateur de chargement
        this.showGlobalStatsLoading(true);
        
        try {
            const stats = await apiClient.getGlobalStats();
            this.displayGlobalStats(stats);
        } catch (error) {
            console.error('Erreur lors du chargement des stats globales:', error);
            this.showMessage('Erreur lors du chargement des statistiques globales', 'warning');
            
            // Afficher des valeurs par défaut en cas d'erreur
            this.displayGlobalStats({
                totalGames: 0,
                shortestGameTurns: null,
                longestGameTurns: null,
                averageGameDuration: 0,
                averageTurnsPerGame: 0,
                totalRolls: 0,
                averageDice: 0,
                maxSnakesPerGame: 0,
                maxLaddersPerGame: 0,
                maxBouncesPerGame: 0
            });
        } finally {
            // Masquer l'indicateur de chargement
            this.showGlobalStatsLoading(false);
        }
    }
    
    // Afficher les statistiques globales
    displayGlobalStats(stats) {
        document.getElementById('globalTotalGames').textContent = stats.totalGames;
        document.getElementById('globalShortestGame').textContent = 
            stats.shortestGameTurns ? `${stats.shortestGameTurns} tours` : '-';
        document.getElementById('globalLongestGame').textContent = 
            stats.longestGameTurns ? `${stats.longestGameTurns} tours` : '-';
        document.getElementById('globalAverageGame').textContent = 
            this.formatDuration(stats.averageGameDuration);
        document.getElementById('globalAverageTurns').textContent = stats.averageTurnsPerGame;
        document.getElementById('globalTotalRolls').textContent = stats.totalRolls;
        document.getElementById('globalDiceAverage').textContent = stats.averageDice;
        document.getElementById('globalMaxSnakes').textContent = stats.maxSnakesPerGame;
        document.getElementById('globalMaxLadders').textContent = stats.maxLaddersPerGame;
        document.getElementById('globalMaxBounces').textContent = stats.maxBouncesPerGame;
    }
    
    // Formater la durée en mm:ss
    formatDuration(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Sauvegarder les statistiques de la partie en cours
    async saveCurrentGameStats() {
        if (!this.gameWon || !this.stats.gameStartTime) {
            return;
        }
        
        const gameDuration = Date.now() - this.stats.gameStartTime;
        const gameStats = {
            duration: gameDuration,
            turns: this.stats.totalTurns,
            rolls: this.stats.totalRolls,
            snakes: this.stats.snakeHits,
            ladders: this.stats.ladderHits,
            bounces: this.stats.bounces,
            diceRolls: this.stats.diceRolls
        };
        
        try {
            await apiClient.saveGameStats(gameStats);
            console.log('Statistiques de la partie sauvegardées');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des stats:', error);
        }
    }

    // Contrôler l'affichage de l'indicateur de chargement pour les stats globales
    showGlobalStatsLoading(show) {
        const loadingElement = document.getElementById('globalStatsLoading');
        const dataElement = document.getElementById('globalStatsData');
        
        if (show) {
            loadingElement.style.display = 'flex';
            dataElement.style.display = 'none';
        } else {
            loadingElement.style.display = 'none';
            dataElement.style.display = 'block';
            dataElement.classList.add('stats-fade-in');
        }
    }
}

// Initialiser le jeu quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    new SnakesAndLadders();
});

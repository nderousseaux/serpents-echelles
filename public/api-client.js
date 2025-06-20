// api-client.js - Client pour communiquer avec l'API backend
class ApiClient {
    constructor() {
        // L'URL de base sera automatiquement celle de Vercel en production
        this.baseUrl = window.location.origin;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/api/${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }
    
    // Récupérer les statistiques globales
    async getGlobalStats() {
        // Ajouter un timestamp pour éviter le cache
        const timestamp = Date.now();
        return this.request(`stats?t=${timestamp}`);
    }
    
    // Envoyer les statistiques d'une partie terminée
    async saveGameStats(gameStats) {
        return this.request('stats', {
            method: 'POST',
            body: JSON.stringify(gameStats)
        });
    }
}

// Instance globale du client API
const apiClient = new ApiClient();

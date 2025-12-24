/* ============================================
   JS COMMUN - ESPACE MME MEYER
   ============================================ */

// ===== CONFIGURATION =====
const CONFIG = {
    SPREADSHEET_ID: '1imYDD3NPS9_ZqFewDrJcyqQV6fCq2kKL_YUC26hJJow',
    API_KEY: 'AIzaSyBfGkPxBdKHJPOB3GNqVInijYgs3qLvEIQ',
    
    // Noms des onglets
    SHEETS: {
        ACTUS: 'ACTUS',
        LECONS: 'LECONS',
        METHODO: 'METHODO',
        EXERCICES: 'EXERCICES',
        TC_SUJETS: 'TC_SUJETS',
        FAQ_REPONSES: '❓ FAQ_réponses',
        FAQ_QUESTIONS: '❓ FAQ_questions',
        FAQ_BUGS: '❓ FAQ_bugs',
        RECOS: 'RECOS',
        VIDEOS: 'VIDEOS'
    },
    
    // Liens
    LINKS: {
        DASHBOARD: 'index.html',
        MOODLE_DASHBOARD: 'https://0670062d.moodle.monbureaunumerique.fr/mod/page/view.php?id=16786',
        FORUM_MOODLE: 'https://0670062d.moodle.monbureaunumerique.fr/mod/forum/view.php?id=XXXXX' // À remplacer
    }
};

// ===== CHARGEMENT GOOGLE SHEETS =====
async function loadSheetData(sheetName) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${CONFIG.API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
            console.log(`Onglet ${sheetName}: pas de données`);
            return [];
        }
        
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    } catch (error) {
        console.error(`Erreur chargement ${sheetName}:`, error);
        return [];
    }
}

// ===== FONCTIONS UTILITAIRES =====

// Convertir lien YouTube/Loom en embed
function convertToEmbed(url) {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Loom
    if (url.includes('loom.com/share/')) {
        const videoId = url.split('loom.com/share/')[1]?.split('?')[0];
        if (videoId) return `https://www.loom.com/embed/${videoId}`;
    }
    if (url.includes('loom.com/embed/')) {
        return url;
    }
    
    return url;
}

// Formater une date
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// Échapper le HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== GESTION DES ONGLETS =====
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            
            // Désactiver tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Activer l'onglet cliqué
            tab.classList.add('active');
            document.getElementById(targetId)?.classList.add('active');
        });
    });
}

// ===== GESTION BOUTON VIDEO =====
function initVideoToggle() {
    const toggleBtn = document.getElementById('toggleVideoBtn');
    const videoContainer = document.getElementById('videoContainer');
    
    if (toggleBtn && videoContainer) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            videoContainer.classList.toggle('show');
            
            // Changer le texte du bouton
            if (videoContainer.classList.contains('show')) {
                toggleBtn.innerHTML = '🎥 Masquer la vidéo';
            } else {
                toggleBtn.innerHTML = '🎥 Aide vidéo';
            }
        });
    }
}

// ===== GESTION ACCORDÉONS =====
function initAccordions() {
    const headers = document.querySelectorAll('.accordion-header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const arrow = header.querySelector('.accordion-arrow');
            
            content.classList.toggle('open');
            arrow?.classList.toggle('open');
        });
    });
}

// ===== ENVOI FORMULAIRE GOOGLE SHEETS =====
async function submitToGoogleSheet(data, type = 'question') {
    const SCRIPT_URL = 'https://script.google.com/macros/s/VOTRE_SCRIPT_ID/exec'; // À remplacer
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                type: type
            })
        });
        
        return { success: true };
    } catch (error) {
        console.error('Erreur envoi:', error);
        return { success: false, error: error.message };
    }
}

// ===== GÉNÉRATION FIL D'ARIANE =====
function generateBreadcrumb(currentPage, currentEmoji = '📄') {
    return `
        <div class="breadcrumb">
            <a href="${CONFIG.LINKS.DASHBOARD}">🏠 Page d'accueil</a>
            <span class="separator">/</span>
            <span class="current">${currentEmoji} ${currentPage}</span>
        </div>
    `;
}

// ===== INITIALISATION GLOBALE =====
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initVideoToggle();
    initAccordions();
});

// ===== EXPORT POUR UTILISATION =====
window.SiteUtils = {
    loadSheetData,
    convertToEmbed,
    formatDate,
    escapeHtml,
    submitToGoogleSheet,
    generateBreadcrumb,
    CONFIG
};

/* ============================================
   SIDEBAR.JS - Charge le menu partagé
   ============================================ */

// Configuration du chemin de base
const BASE_PATH = '/Activit-s-interactives_2nd-bac-pro';

// Charge le sidebar depuis le fichier externe
async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar');
    if (!sidebarContainer) {
        console.warn('Élément #sidebar non trouvé');
        return;
    }

    try {
        const response = await fetch(`${BASE_PATH}/components/sidebar.html`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const html = await response.text();
        sidebarContainer.innerHTML = html;

        // Marquer la page active
        highlightActivePage();

        // Désactiver les liens "#"
        disableEmptyLinks();

        // Initialiser le toggle du sidebar
        initSidebarToggle();

    } catch (error) {
        console.error('Erreur chargement sidebar:', error);
        sidebarContainer.innerHTML = '<p style="padding: 20px; color: #666;">Menu non disponible</p>';
    }
}

// Marque la page actuelle comme active dans le menu
function highlightActivePage() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href !== '#' && currentPath.includes(href.split('/').pop().replace('.html', ''))) {
            item.classList.add('active');
        }
    });
}

// Désactive les liens vides (#)
function disableEmptyLinks() {
    const disabledLinks = document.querySelectorAll('.nav-item.disabled, .nav-item[href="#"]');
    disabledLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
}

// Initialise le toggle du sidebar (ouvrir/fermer)
function initSidebarToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        menuToggle.classList.toggle('active');
        if (overlay) {
            overlay.classList.toggle('visible');
        }
    });

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            menuToggle.classList.remove('active');
            overlay.classList.remove('visible');
        });
    }
}

// Charge le sidebar au chargement de la page
document.addEventListener('DOMContentLoaded', loadSidebar);

// Export pour utilisation externe si nécessaire
window.SidebarUtils = {
    loadSidebar,
    highlightActivePage,
    BASE_PATH
};

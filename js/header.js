/* ============================================
   HEADER.JS - Gère le menu utilisateur partagé
   ============================================ */

// Configuration du chemin de base
const HEADER_BASE_PATH = '/Activit-s-interactives_2nd-bac-pro';

// Initialise le header (date + user menu)
function initHeader() {
    updateCurrentDate();
    updateUserMenu();
}

// Met à jour la date dans le header
function updateCurrentDate() {
    const dateContainer = document.getElementById('currentDate');
    if (!dateContainer) return;

    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    dateContainer.textContent = `Sem. ${weekNumber} • ${month} ${year}`;
}

// Calcule le numéro de semaine
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Met à jour le menu utilisateur
function updateUserMenu() {
    const userMenuContainer = document.getElementById('userMenu');
    if (!userMenuContainer) return;

    // Vérifier si Auth est disponible
    if (typeof Auth === 'undefined') {
        console.warn('Auth non disponible');
        return;
    }

    const session = Auth.getSession();
    if (!session || !session.user) {
        userMenuContainer.style.display = 'none';
        return;
    }

    const user = session.user;
    userMenuContainer.style.display = 'flex';

    // Construire le menu
    let menuHTML = `
        <div class="user-info">
            <span class="user-avatar">${user.prenom ? user.prenom[0].toUpperCase() : '?'}</span>
            <span class="user-name">${user.prenom || ''} ${user.nom || ''}</span>
        </div>
    `;

    // Si c'est un prof, ajouter le sélecteur de mode
    if (user.role === 'prof') {
        const eleves = Auth.getEleves ? Auth.getEleves() : [];
        const currentMode = session.viewMode || 'admin';
        const currentStudent = session.viewAsStudent;

        let studentName = '';
        if (currentStudent && eleves.length > 0) {
            const student = eleves.find(e => e.id === currentStudent);
            if (student) studentName = `${student.prenom} ${student.nom}`;
        }

        const isViewingStudent = currentMode === 'eleve' && currentStudent;

        menuHTML += `
            <div class="mode-selector">
                <button class="mode-toggle ${isViewingStudent ? 'viewing-student' : ''}" onclick="toggleModeMenu()">
                    <span>${isViewingStudent ? '👁️' : '👑'}</span>
                    <span class="mode-text">${isViewingStudent ? 'Vue: ' + studentName : 'Mode Admin'}</span>
                    <span>▼</span>
                </button>
                <div class="mode-menu" id="modeMenu">
                    <div class="mode-option ${!isViewingStudent ? 'active' : ''}" onclick="switchMode('admin')">
                        <span>👑</span> Mode Admin
                    </div>
                    ${eleves.length > 0 ? `
                        <div class="mode-divider"></div>
                        <div class="mode-section-title">Voir comme élève</div>
                        ${eleves.map(e => `
                            <div class="mode-option ${currentStudent === e.id ? 'active' : ''}" onclick="switchMode('eleve', '${e.id}')">
                                <span>👤</span> ${e.prenom} ${e.nom}
                            </div>
                        `).join('')}
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Bouton déconnexion (Option B : 🔓 Déconnexion)
    menuHTML += `
        <button class="logout-btn" onclick="Auth.logout()" title="Se déconnecter">
            <span>🔓</span>
            <span>Déconnexion</span>
        </button>
    `;

    userMenuContainer.innerHTML = menuHTML;
}

// Toggle le menu de mode
function toggleModeMenu() {
    const menu = document.getElementById('modeMenu');
    if (menu) menu.classList.toggle('show');
}

// Change de mode (admin ou vue élève)
function switchMode(mode, studentId = null) {
    if (typeof Auth === 'undefined') return;

    if (mode === 'admin') {
        if (Auth.switchToAdminMode) Auth.switchToAdminMode();
        window.location.href = HEADER_BASE_PATH + '/admin/index.html';
    } else {
        if (Auth.viewAsStudent) Auth.viewAsStudent(studentId);
        location.reload();
    }
}

// Fermer le menu au clic extérieur
document.addEventListener('click', function(e) {
    const menu = document.getElementById('modeMenu');
    const toggle = e.target.closest('.mode-toggle');
    if (menu && !toggle && !e.target.closest('.mode-menu')) {
        menu.classList.remove('show');
    }
});

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', initHeader);

// Export pour utilisation externe
window.HeaderUtils = {
    initHeader,
    updateUserMenu,
    updateCurrentDate,
    HEADER_BASE_PATH
};

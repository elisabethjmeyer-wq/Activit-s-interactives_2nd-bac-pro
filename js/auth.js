/**
 * ============================================
 * AUTH.JS - Gestion de l'authentification
 * Espace Cours - Mme Meyer
 * ============================================
 * 
 * Ce module gère :
 * - Vérification de session sur chaque page
 * - Déconnexion
 * - Mode "voir comme élève" pour le prof
 * - Récupération des infos utilisateur
 */

const Auth = (function() {
    
    // ===== CONFIG =====
    const SESSION_KEY = 'espace_cours_session';
    const ELEVES_KEY = 'espace_cours_eleves';
    const BASE_PATH = '/Activit-s-interactives_2nd-bac-pro';
    
    // ===== GETTERS =====
    
    /**
     * Récupère la session courante
     * @returns {Object|null} Session ou null si non connecté
     */
    function getSession() {
        try {
            const data = localStorage.getItem(SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Récupère l'utilisateur courant
     * @returns {Object|null} User ou null
     */
    function getUser() {
        const session = getSession();
        return session ? session.user : null;
    }
    
    /**
     * Récupère l'ID de l'utilisateur effectif (pour les données)
     * Si prof en mode "voir comme élève", retourne l'ID de l'élève
     * @returns {string|null}
     */
    function getEffectiveUserId() {
        const session = getSession();
        if (!session) return null;
        
        // Si prof en mode élève avec un élève sélectionné
        if (session.user.role === 'prof' && session.viewMode === 'eleve' && session.viewAsStudent) {
            return session.viewAsStudent;
        }
        
        return session.user.id;
    }
    
    /**
     * Récupère les infos de l'utilisateur effectif
     * @returns {Object|null}
     */
    function getEffectiveUser() {
        const session = getSession();
        if (!session) return null;
        
        // Si prof en mode élève
        if (session.user.role === 'prof' && session.viewMode === 'eleve' && session.viewAsStudent) {
            const eleves = getEleves();
            return eleves.find(e => e.id === session.viewAsStudent) || session.user;
        }
        
        return session.user;
    }
    
    /**
     * Vérifie si l'utilisateur est un prof
     * @returns {boolean}
     */
    function isProf() {
        const user = getUser();
        return user && user.role === 'prof';
    }
    
    /**
     * Vérifie si on est en mode admin
     * @returns {boolean}
     */
    function isAdminMode() {
        const session = getSession();
        return session && session.user.role === 'prof' && session.viewMode === 'admin';
    }
    
    /**
     * Vérifie si on est en mode "voir comme élève"
     * @returns {boolean}
     */
    function isViewingAsStudent() {
        const session = getSession();
        return session && session.user.role === 'prof' && session.viewMode === 'eleve';
    }
    
    /**
     * Récupère la liste des élèves (pour le prof)
     * @returns {Array}
     */
    function getEleves() {
        try {
            const data = localStorage.getItem(ELEVES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    // ===== ACTIONS =====
    
    /**
     * Vérifie si l'utilisateur est connecté, sinon redirige vers login
     * @param {Object} options - Options de vérification
     * @param {boolean} options.requireProf - Nécessite d'être prof
     * @param {boolean} options.requireAdmin - Nécessite d'être en mode admin
     * @returns {boolean}
     */
    function requireAuth(options = {}) {
        const session = getSession();
        
        if (!session || !session.user) {
            redirectToLogin();
            return false;
        }
        
        if (options.requireProf && session.user.role !== 'prof') {
            redirectToHome();
            return false;
        }
        
        if (options.requireAdmin && (session.user.role !== 'prof' || session.viewMode !== 'admin')) {
            redirectToHome();
            return false;
        }
        
        return true;
    }
    
    /**
     * Déconnexion
     */
    function logout() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(ELEVES_KEY);
        redirectToLogin();
    }
    
    /**
     * Passer en mode admin (prof uniquement)
     */
    function switchToAdminMode() {
        const session = getSession();
        if (!session || session.user.role !== 'prof') return;
        
        session.viewMode = 'admin';
        session.viewAsStudent = null;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    
    /**
     * Passer en mode élève (prof uniquement)
     * @param {string} studentId - ID de l'élève à simuler (optionnel)
     */
    function switchToStudentMode(studentId = null) {
        const session = getSession();
        if (!session || session.user.role !== 'prof') return;
        
        session.viewMode = 'eleve';
        session.viewAsStudent = studentId;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    
    /**
     * Changer l'élève simulé (prof en mode élève)
     * @param {string} studentId
     */
    function viewAsStudent(studentId) {
        const session = getSession();
        if (!session || session.user.role !== 'prof') return;
        
        session.viewMode = 'eleve';
        session.viewAsStudent = studentId;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    
    // ===== REDIRECTIONS =====
    
    function redirectToLogin() {
        window.location.href = `${BASE_PATH}/login.html`;
    }
    
    function redirectToHome() {
        window.location.href = `${BASE_PATH}/index.html`;
    }
    
    function redirectToAdmin() {
        window.location.href = `${BASE_PATH}/admin/index.html`;
    }
    
    // ===== UI HELPERS =====
    
    /**
     * Génère le HTML du sélecteur de mode (pour le header)
     * @returns {string}
     */
    function renderModeSelector() {
        const session = getSession();
        if (!session || session.user.role !== 'prof') return '';
        
        const eleves = getEleves();
        const currentMode = session.viewMode;
        const currentStudent = session.viewAsStudent;
        
        let studentName = '';
        if (currentStudent) {
            const student = eleves.find(e => e.id === currentStudent);
            if (student) {
                studentName = `${student.prenom} ${student.nom}`;
            }
        }
        
        return `
            <div class="mode-selector">
                <button class="mode-toggle" onclick="Auth.toggleModeMenu()">
                    <span class="mode-icon">${currentMode === 'admin' ? '👑' : '👤'}</span>
                    <span class="mode-label">
                        ${currentMode === 'admin' ? 'Mode Admin' : `Vue: ${studentName || 'Élève'}`}
                    </span>
                    <span class="mode-arrow">▼</span>
                </button>
                <div class="mode-menu" id="modeMenu">
                    <div class="mode-option ${currentMode === 'admin' ? 'active' : ''}" onclick="Auth.switchToAdminMode(); location.reload();">
                        <span>👑</span> Mode Admin
                    </div>
                    <div class="mode-divider"></div>
                    <div class="mode-section-title">Voir comme élève :</div>
                    ${eleves.map(e => `
                        <div class="mode-option ${currentStudent === e.id ? 'active' : ''}" 
                             onclick="Auth.viewAsStudent('${e.id}'); location.reload();">
                            <span>👤</span> ${e.prenom} ${e.nom}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Toggle le menu de mode
     */
    function toggleModeMenu() {
        const menu = document.getElementById('modeMenu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }
    
    /**
     * Génère le HTML du bouton de déconnexion
     * @returns {string}
     */
    function renderLogoutButton() {
        const user = getUser();
        if (!user) return '';
        
        return `
            <button class="logout-btn" onclick="Auth.logout()" title="Déconnexion">
                <span>🚪</span>
                <span class="logout-text">Déconnexion</span>
            </button>
        `;
    }
    
    /**
     * Génère le HTML complet du user menu (pour le header)
     * @returns {string}
     */
    function renderUserMenu() {
        const user = getUser();
        if (!user) return '';
        
        return `
            <div class="user-menu">
                <div class="user-info">
                    <span class="user-avatar">${user.prenom ? user.prenom[0] : '?'}</span>
                    <span class="user-name">${user.prenom} ${user.nom}</span>
                </div>
                ${isProf() ? renderModeSelector() : ''}
                ${renderLogoutButton()}
            </div>
        `;
    }
    
    // ===== CSS pour le user menu =====
    function injectStyles() {
        if (document.getElementById('auth-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'auth-styles';
        styles.textContent = `
            .user-menu {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-left: auto;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                background: var(--gray-100, #f3f4f6);
                border-radius: 20px;
            }
            
            .user-avatar {
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, var(--primary, #6366f1), var(--primary-dark, #4f46e5));
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
            }
            
            .user-name {
                font-size: 13px;
                font-weight: 500;
                color: var(--gray-700, #374151);
            }
            
            .mode-selector {
                position: relative;
            }
            
            .mode-toggle {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: var(--primary-bg, #eef2ff);
                border: 2px solid var(--primary, #6366f1);
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                color: var(--primary, #6366f1);
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
            }
            
            .mode-toggle:hover {
                background: var(--primary, #6366f1);
                color: white;
            }
            
            .mode-menu {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                min-width: 200px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                border: 1px solid var(--gray-200, #e5e7eb);
                padding: 8px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s;
                z-index: 1000;
            }
            
            .mode-menu.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .mode-option {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 12px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                color: var(--gray-700, #374151);
                transition: all 0.15s;
            }
            
            .mode-option:hover {
                background: var(--gray-100, #f3f4f6);
            }
            
            .mode-option.active {
                background: var(--primary-bg, #eef2ff);
                color: var(--primary, #6366f1);
                font-weight: 500;
            }
            
            .mode-divider {
                height: 1px;
                background: var(--gray-200, #e5e7eb);
                margin: 8px 0;
            }
            
            .mode-section-title {
                font-size: 11px;
                font-weight: 600;
                color: var(--gray-400, #9ca3af);
                text-transform: uppercase;
                padding: 8px 12px 4px;
            }
            
            .logout-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: var(--gray-100, #f3f4f6);
                border: none;
                border-radius: 8px;
                font-size: 13px;
                color: var(--gray-600, #4b5563);
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
            }
            
            .logout-btn:hover {
                background: var(--accent-red-light, #fee2e2);
                color: var(--accent-red, #ef4444);
            }
            
            @media (max-width: 768px) {
                .user-name, .logout-text, .mode-label {
                    display: none;
                }
                .user-menu {
                    gap: 8px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // ===== INIT =====
    function init() {
        injectStyles();
        
        // Fermer le menu mode au clic extérieur
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('modeMenu');
            const toggle = e.target.closest('.mode-toggle');
            if (menu && !toggle && !e.target.closest('.mode-menu')) {
                menu.classList.remove('show');
            }
        });
    }
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ===== API PUBLIQUE =====
    return {
        // Getters
        getSession,
        getUser,
        getEffectiveUserId,
        getEffectiveUser,
        isProf,
        isAdminMode,
        isViewingAsStudent,
        getEleves,
        
        // Actions
        requireAuth,
        logout,
        switchToAdminMode,
        switchToStudentMode,
        viewAsStudent,
        
        // Redirections
        redirectToLogin,
        redirectToHome,
        redirectToAdmin,
        
        // UI
        renderModeSelector,
        renderLogoutButton,
        renderUserMenu,
        toggleModeMenu
    };
    
})();

// Export global
window.Auth = Auth;

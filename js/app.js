// ==========================================
// APP CONTROLLER
// ==========================================

const App = {
    currentPage: 'dashboard',

    init() {
        this.setupLogin();
        this.setupNavigation();
        this.setupSidebar();
        this.checkAuth();
    },

    // Auth
    checkAuth() {
        const loggedIn = localStorage.getItem('pf_loggedin');
        if (loggedIn) {
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    setupLogin() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            if (email === 'admin@designfox.com' && pass === 'admin123') {
                localStorage.setItem('pf_loggedin', 'true');
                this.showApp();
                this.showToast('Welcome back!', 'success');
            } else {
                this.showToast('Invalid credentials', 'error');
            }
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('pf_loggedin');
            this.showLogin();
        });
    },

    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    },

    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        this.navigate('dashboard');
    },

    // Navigation
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigate(page);
            });
        });
    },

    navigate(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
        
        const titles = {
            dashboard: 'Dashboard',
            customers: 'Customers',
            quotations: 'Quotations',
            invoices: 'Invoices',
            payments: 'Payments',
            projects: 'Projects',
            reports: 'Reports',
            backup: 'Backup & Restore'
        };
        document.getElementById('page-title').textContent = titles[page] || page;
        
        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');

        // Render page
        Pages[page] ? Pages[page]() : Pages.dashboard();
    },

    // Sidebar mobile
    setupSidebar() {
        document.getElementById('menu-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('open');
        });
        document.getElementById('sidebar-close').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
        });
    },

    // Toast notifications
    showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // Modal
    showModal(title, content, footer = '') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'active-modal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) App.closeModal();
        });
    },

    closeModal() {
        const modal = document.getElementById('active-modal');
        if (modal) modal.remove();
    },

    // Format currency
    money(amount) {
        return 'LKR ' + Number(amount || 0).toLocaleString();
    },

    // ============ BACKUP & RESTORE ============
    
    // Export all data as JSON file (download)
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            appVersion: '1.0',
            customers: JSON.parse(localStorage.getItem('pf_customers') || '[]'),
            quotations: JSON.parse(localStorage.getItem('pf_quotations') || '[]'),
            invoices: JSON.parse(localStorage.getItem('pf_invoices') || '[]'),
            payments: JSON.parse(localStorage.getItem('pf_payments') || '[]'),
            projects: JSON.parse(localStorage.getItem('pf_projects') || '[]')
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PayTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Backup downloaded!', 'success');
    },

    // Import data from JSON file
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (!data.customers || !data.quotations) {
                        this.showToast('Invalid backup file!', 'error');
                        return;
                    }

                    if (!confirm('This will replace ALL current data. Are you sure?')) return;

                    localStorage.setItem('pf_customers', JSON.stringify(data.customers));
                    localStorage.setItem('pf_quotations', JSON.stringify(data.quotations));
                    localStorage.setItem('pf_invoices', JSON.stringify(data.invoices || []));
                    localStorage.setItem('pf_payments', JSON.stringify(data.payments || []));
                    localStorage.setItem('pf_projects', JSON.stringify(data.projects || []));

                    this.showToast('Data restored successfully!', 'success');
                    this.navigate('dashboard');
                } catch (err) {
                    this.showToast('Error reading file!', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());

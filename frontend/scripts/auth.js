class AuthManager {
    constructor() {
        this.checkAuthStatus();
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    getUserType() {
        return localStorage.getItem('user_type');
    }

    getUserId() {
        return localStorage.getItem('user_id');
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/pages/login.html';
            return false;
        }
        return true;
    }

    requireRole(role) {
        if (!this.requireAuth()) return false;
        
        if (this.getUserType() !== role) {
            this.showAlert('Access denied. Insufficient permissions.', 'error');
            return false;
        }
        return true;
    }

    checkAuthStatus() {
        const currentPage = window.location.pathname;
        const protectedPages = ['/pages/dashboard.html'];
        
        if (protectedPages.some(page => currentPage.includes(page))) {
            this.requireAuth();
        }

        // Update navigation based on auth status
        this.updateNavigation();
    }

    updateNavigation() {
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons) return;

        if (this.isAuthenticated()) {
            authButtons.innerHTML = `
                <a href="/pages/dashboard.html" class="btn btn-outline">Dashboard</a>
                <button onclick="auth.logout()" class="btn btn-danger">Logout</button>
            `;
        } else {
            authButtons.innerHTML = `
                <a href="/pages/login.html" class="btn btn-outline">Login</a>
                <a href="/pages/register.html" class="btn btn-primary">Sign Up</a>
            `;
        }
    }

    logout() {
        api.logout();
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;

        const container = document.querySelector('.main-content') || document.body;
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Create global auth instance
const auth = new AuthManager();

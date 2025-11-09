// Authentication Management
const Auth = {
    // Current user data
    currentUser: null,

    // Check if user is logged in
    isLoggedIn() {
        return !!API.getToken();
    },

    // Get current user from token
    getCurrentUser() {
        const token = API.getToken();
        if (!token) return null;

        try {
            // Decode JWT token (simple base64 decode of payload)
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    },

    // Initialize auth state
    async init() {
        if (this.isLoggedIn()) {
            this.currentUser = this.getCurrentUser();
            
            // Verify token is still valid
            try {
                await API.health();
                this.showDashboard();
            } catch (error) {
                console.error('Token expired or invalid');
                this.logout();
            }
        } else {
            this.showLogin();
        }
    },

    // Handle login
    async login(email, password) {
        try {
            const response = await API.auth.login(email, password);
            
            if (response.success && response.data.token) {
                API.setToken(response.data.token);
                this.currentUser = response.data.user;
                
                // Store user info
                localStorage.setItem('wifight_user', JSON.stringify(response.data.user));
                
                this.showDashboard();
                return { success: true };
            } else {
                return { success: false, message: response.message || 'Login failed' };
            }
        } catch (error) {
            return { success: false, message: error.message || 'Login failed' };
        }
    },

    // Handle logout
    async logout() {
        try {
            await API.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        API.removeToken();
        localStorage.removeItem('wifight_user');
        this.currentUser = null;
        this.showLogin();
    },

    // Show login page
    showLogin() {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    },

    // Show dashboard
    showDashboard() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Update user info display
        if (this.currentUser) {
            document.getElementById('userInfo').textContent = 
                `${this.currentUser.full_name || this.currentUser.email} (${this.currentUser.role})`;
        }
        
        // Load dashboard data
        if (typeof Dashboard !== 'undefined') {
            Dashboard.init();
        }
    },

    // Check user role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    },

    // Check if user has permission
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'admin': ['all'],
            'manager': ['view', 'create', 'update', 'delete_own'],
            'staff': ['view', 'create'],
            'customer': ['view_own']
        };
        
        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }
};

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Disable submit button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            
            const result = await Auth.login(email, password);
            
            if (result.success) {
                loginError.classList.add('hidden');
                loginForm.reset();
            } else {
                loginError.textContent = result.message;
                loginError.classList.remove('hidden');
            }
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        });
    }

    // Initialize auth state
    Auth.init();
});

// Global logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        Auth.logout();
    }
}
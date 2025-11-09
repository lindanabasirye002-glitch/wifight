// Dashboard Management
const Dashboard = {
    currentPage: 'overview',
    refreshInterval: null,

    // Initialize dashboard
    async init() {
        this.showPage('overview');
        this.startAutoRefresh();
    },

    // Start auto-refresh for real-time data
    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (this.currentPage === 'overview') {
                this.loadOverview();
            } else if (this.currentPage === 'sessions') {
                this.loadSessions();
            }
        }, 30000);
    },

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
};

// Show specific page
function showPage(page) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.closest('.nav-link')?.classList.add('active');

    // Hide all pages
    document.querySelectorAll('[id$="Page"]').forEach(p => {
        p.classList.add('hidden');
    });

    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.remove('hidden');
        Dashboard.currentPage = page;

        // Update page title
        const titles = {
            overview: 'Dashboard Overview',
            controllers: 'Controllers Management',
            plans: 'Internet Plans',
            vouchers: 'Voucher Management',
            sessions: 'Active Sessions',
            users: 'User Management'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        // Load page data
        switch(page) {
            case 'overview':
                loadOverview();
                break;
            case 'controllers':
                loadControllers();
                break;
            case 'plans':
                loadPlans();
                break;
            case 'vouchers':
                loadVouchers();
                break;
            case 'sessions':
                loadSessions();
                break;
            case 'users':
                loadUsers();
                break;
        }
    }
}

// Load Overview Data
async function loadOverview() {
    try {
        // Load statistics
        const [sessions, vouchers, controllers] = await Promise.all([
            API.sessions.active(),
            API.vouchers.stats(),
            API.controllers.list()
        ]);

        // Update stats cards
        document.getElementById('activeSessions').textContent = sessions.data?.length || 0;
        document.getElementById('totalVouchers').textContent = vouchers.data?.total || 0;
        document.getElementById('totalControllers').textContent = controllers.data?.length || 0;
        document.getElementById('totalRevenue').textContent = 
            '$' + (vouchers.data?.total_revenue || 0).toFixed(2);

        // Load recent sessions
        const recentSessionsHtml = sessions.data?.slice(0, 5).map(session => `
            <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <div>
                    <p class="font-medium">${session.mac_address}</p>
                    <p class="text-sm text-gray-500">${session.plan_name || 'N/A'}</p>
                </div>
                <span class="text-sm text-gray-500">${session.elapsed_minutes || 0} min</span>
            </div>
        `).join('') || '<p class="text-gray-500">No active sessions</p>';
        document.getElementById('recentSessions').innerHTML = recentSessionsHtml;

        // Load popular plans
        const plans = await API.plans.list();
        const popularPlansHtml = plans.data?.slice(0, 5).map(plan => `
            <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <div>
                    <p class="font-medium">${plan.name}</p>
                    <p class="text-sm text-gray-500">${plan.duration_hours || 'Unlimited'} hours</p>
                </div>
                <span class="text-sm font-bold text-indigo-600">$${plan.price}</span>
            </div>
        `).join('') || '<p class="text-gray-500">No plans available</p>';
        document.getElementById('popularPlans').innerHTML = popularPlansHtml;

    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Load Controllers
async function loadControllers() {
    try {
        const response = await API.controllers.list();
        const controllers = response.data || [];

        const tableHtml = controllers.map(controller => `
            <tr>
                <td class="px-6 py-4">${controller.name}</td>
                <td class="px-6 py-4">${controller.ip_address}:${controller.port}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full ${
                        controller.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${controller.status}
                    </span>
                </td>
                <td class="px-6 py-4">${controller.active_sessions || 0}</td>
                <td class="px-6 py-4">
                    <button onclick="editController(${controller.id})" class="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button onclick="deleteController(${controller.id})" class="text-red-600 hover:text-red-800">Delete</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('controllersTable').innerHTML = tableHtml || 
            '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No controllers found</td></tr>';
    } catch (error) {
        console.error('Error loading controllers:', error);
    }
}

// Load Plans
async function loadPlans() {
    try {
        const response = await API.plans.list();
        const plans = response.data || [];

        const plansHtml = plans.map(plan => `
            <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <h3 class="text-xl font-bold mb-2">${plan.name}</h3>
                <p class="text-gray-600 text-sm mb-4">${plan.description || ''}</p>
                <div class="mb-4">
                    <span class="text-3xl font-bold text-indigo-600">$${plan.price}</span>
                </div>
                <ul class="space-y-2 mb-4">
                    ${plan.duration_hours ? `<li class="text-sm">⏱️ ${plan.duration_hours} hours</li>` : ''}
                    ${plan.data_limit_mb ? `<li class="text-sm">📊 ${plan.data_limit_mb} MB</li>` : '<li class="text-sm">📊 Unlimited</li>'}
                    ${plan.bandwidth_down ? `<li class="text-sm">⬇️ ${plan.bandwidth_down} Kbps</li>` : ''}
                </ul>
                <div class="flex space-x-2">
                    <button onclick="editPlan(${plan.id})" class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Edit
                    </button>
                    <button onclick="deletePlan(${plan.id})" class="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        document.getElementById('plansGrid').innerHTML = plansHtml || 
            '<p class="text-gray-500">No plans found</p>';
    } catch (error) {
        console.error('Error loading plans:', error);
    }
}

// Load Vouchers
async function loadVouchers() {
    try {
        const response = await API.vouchers.list({ limit: 50 });
        const vouchers = response.data || [];

        const tableHtml = vouchers.map(voucher => `
            <tr>
                <td class="px-6 py-4 font-mono">${voucher.code}</td>
                <td class="px-6 py-4">${voucher.plan_name || 'N/A'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full ${
                        voucher.status === 'unused' ? 'bg-green-100 text-green-800' :
                        voucher.status === 'used' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${voucher.status}
                    </span>
                </td>
                <td class="px-6 py-4">${new Date(voucher.expires_at).toLocaleDateString()}</td>
                <td class="px-6 py-4">$${voucher.price}</td>
            </tr>
        `).join('');

        document.getElementById('vouchersTable').innerHTML = tableHtml || 
            '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No vouchers found</td></tr>';
    } catch (error) {
        console.error('Error loading vouchers:', error);
    }
}

// Load Sessions
async function loadSessions() {
    try {
        const response = await API.sessions.active();
        const sessions = response.data || [];

        const tableHtml = sessions.map(session => `
            <tr>
                <td class="px-6 py-4 font-mono">${session.mac_address}</td>
                <td class="px-6 py-4">${session.ip_address || 'N/A'}</td>
                <td class="px-6 py-4">${session.plan_name || 'N/A'}</td>
                <td class="px-6 py-4">${session.elapsed_minutes || 0} min</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        ${session.status}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <button onclick="terminateSession(${session.id})" class="text-red-600 hover:text-red-800">
                        Terminate
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('sessionsTable').innerHTML = tableHtml || 
            '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No active sessions</td></tr>';
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

// Terminate Session
async function terminateSession(sessionId) {
    if (!confirm('Are you sure you want to terminate this session?')) return;

    try {
        await API.sessions.terminate(sessionId);
        alert('Session terminated successfully');
        loadSessions();
    } catch (error) {
        alert('Error terminating session: ' + error.message);
    }
}

// Modal functions (placeholders)
function showAddControllerModal() {
    alert('Add Controller modal - Implementation needed');
}

function showAddPlanModal() {
    alert('Add Plan modal - Implementation needed');
}

function showGenerateVoucherModal() {
    alert('Generate Voucher modal - Implementation needed');
}

function editController(id) {
    alert('Edit Controller: ' + id);
}

function deleteController(id) {
    if (confirm('Are you sure you want to delete this controller?')) {
        API.controllers.delete(id)
            .then(() => {
                alert('Controller deleted successfully');
                loadControllers();
            })
            .catch(error => alert('Error: ' + error.message));
    }
}

function editPlan(id) {
    alert('Edit Plan: ' + id);
}

function deletePlan(id) {
    if (confirm('Are you sure you want to delete this plan?')) {
        API.plans.delete(id)
            .then(() => {
                alert('Plan deleted successfully');
                loadPlans();
            })
            .catch(error => alert('Error: ' + error.message));
    }
}
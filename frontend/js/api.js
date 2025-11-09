// API Configuration
// NOTE: Use a path that matches your hosting configuration.
// If your DocumentRoot is the repository root and you access the site via http://wifigt.localhost/
// then the backend path is '/backend/api'.
const API_BASE_URL = window.location.origin + '/backend/api';

// API Helper Functions
const API = {
    // Get auth token
    getToken() {
        return localStorage.getItem('wifight_token');
    },

    // Set auth token
    setToken(token) {
        localStorage.setItem('wifight_token', token);
    },

    // Remove auth token
    removeToken() {
        localStorage.removeItem('wifight_token');
    },

    // Make API request (safer: checks content-type before parsing JSON,
    // and handles empty JSON bodies gracefully)
    async request(endpoint, options = {}) {
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            const contentType = response.headers.get('content-type') || '';

            // If server claims JSON, read raw text and handle empty or invalid JSON safely
            if (contentType.includes('application/json')) {
                const text = await response.text();

                // If empty body, produce helpful error
                if (!text || text.trim() === '') {
                    console.error('API returned empty JSON body', {
                        url: `${API_BASE_URL}/${endpoint}`,
                        status: response.status,
                        headers: [...response.headers.entries()]
                    });
                    throw new Error(`Empty JSON response from server (status ${response.status}). Check server logs or DevTools Network response body.`);
                }

                // Try to parse JSON and give clear errors if parse fails
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse JSON response', {
                        url: `${API_BASE_URL}/${endpoint}`,
                        status: response.status,
                        rawBody: text,
                        parseError: e.message
                    });
                    throw new Error(`Server returned invalid JSON (status ${response.status}). Check server logs or DevTools Network response body.`);
                }

                if (!response.ok) {
                    throw new Error(data.message || `API request failed with status ${response.status}`);
                }
                return data;
            }

            // Not JSON -> show the raw text in console for debugging and throw a clear error
            const text = await response.text();
            console.error('API returned non-JSON response', {
                url: `${API_BASE_URL}/${endpoint}`,
                status: response.status,
                body: text
            });

            throw new Error(`Server returned non-JSON response (status ${response.status}). Check server logs or DevTools Network tab for response body.`);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        login(email, password) {
            return API.request('auth/login.php', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
        },

        register(userData) {
            return API.request('auth/register.php', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        logout() {
            return API.request('auth/logout.php', {
                method: 'POST'
            });
        },

        refresh() {
            return API.request('auth/refresh.php', {
                method: 'POST'
            });
        }
    },

    // Controllers endpoints
    controllers: {
        list(locationId = null) {
            const query = locationId ? `?location_id=${locationId}` : '';
            return API.request(`controllers/list.php${query}`);
        },

        create(controllerData) {
            return API.request('controllers/create.php', {
                method: 'POST',
                body: JSON.stringify(controllerData)
            });
        },

        update(id, controllerData) {
            return API.request('controllers/update.php', {
                method: 'POST',
                body: JSON.stringify({ id, ...controllerData })
            });
        },

        delete(id) {
            return API.request('controllers/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
        }
    },

    // Plans endpoints
    plans: {
        list(locationId = null, status = 'active') {
            const params = new URLSearchParams();
            if (locationId) params.append('location_id', locationId);
            if (status) params.append('status', status);
            const query = params.toString() ? `?${params}` : '';
            return API.request(`plans/list.php${query}`);
        },

        create(planData) {
            return API.request('plans/create.php', {
                method: 'POST',
                body: JSON.stringify(planData)
            });
        },

        update(id, planData) {
            return API.request('plans/update.php', {
                method: 'POST',
                body: JSON.stringify({ id, ...planData })
            });
        },

        delete(id) {
            return API.request('plans/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
        }
    },

    // Vouchers endpoints
    vouchers: {
        list(filters = {}) {
            const params = new URLSearchParams(filters);
            const query = params.toString() ? `?${params}` : '';
            return API.request(`vouchers/list.php${query}`);
        },

        generate(planId, quantity, batchName = null) {
            return API.request('vouchers/generate.php', {
                method: 'POST',
                body: JSON.stringify({ plan_id: planId, quantity, batch_name: batchName })
            });
        },

        validate(code) {
            return API.request('vouchers/validate.php', {
                method: 'POST',
                body: JSON.stringify({ code })
            });
        },

        redeem(code, macAddress = null) {
            return API.request('vouchers/redeem.php', {
                method: 'POST',
                body: JSON.stringify({ code, mac_address: macAddress })
            });
        },

        stats() {
            return API.request('vouchers/stats.php');
        }
    },

    // Sessions endpoints
    sessions: {
        active(controllerId = null) {
            const query = controllerId ? `?controller_id=${controllerId}` : '';
            return API.request(`sessions/active.php${query}`);
        },

        create(sessionData) {
            return API.request('sessions/create.php', {
                method: 'POST',
                body: JSON.stringify(sessionData)
            });
        },

        terminate(sessionId) {
            return API.request('sessions/terminate.php', {
                method: 'POST',
                body: JSON.stringify({ id: sessionId })
            });
        },

        history(filters = {}) {
            const params = new URLSearchParams(filters);
            const query = params.toString() ? `?${params}` : '';
            return API.request(`sessions/history.php${query}`);
        }
    },

    // Users endpoints
    users: {
        list(locationId = null, role = null) {
            const params = new URLSearchParams();
            if (locationId) params.append('location_id', locationId);
            if (role) params.append('role', role);
            const query = params.toString() ? `?${query}` : '';
            return API.request(`users/list.php${query}`);
        },

        create(userData) {
            return API.request('users/create.php', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        update(id, userData) {
            return API.request('users/update.php', {
                method: 'POST',
                body: JSON.stringify({ id, ...userData })
            });
        },

        delete(id) {
            return API.request('users/delete.php', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
        }
    },

    // Health check
    health() {
        return API.request('health.php');
    }
};
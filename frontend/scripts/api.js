class ApiClient {
    constructor() {
        this.baseURL = 'https://seedsmart-px0a.onrender.com';
        this.token = localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async login(username, password) {
        let  formData= JSON.stringify({
  "username":username,
  "password":password
});
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers:{
                "Content-Type": "application/json"
            },
            body: formData
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        this.token = data.access_token;
        localStorage.setItem('token', this.token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_type', data.user_type);

        return data;
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Product methods
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/products/?${params}`);
    }

    async createProduct(productData) {
        return this.request('/products/', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(productId, productData) {
        return this.request(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(productId) {
        return this.request(`/products/${productId}`, {
            method: 'DELETE'
        });
    }

    async getMyProducts() {
        return this.request('/products/my-products');
    }

    // Order methods
    async createOrder(orderData) {
        return this.request('/orders/', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getMyOrders() {
        return this.request('/orders/my-orders');
    }

    async getOrder(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    async updateOrderStatus(orderId, status) {
        return this.request(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        window.location.href = '/';
    }
}

// Create global API instance
const api = new ApiClient();

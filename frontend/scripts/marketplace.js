class Marketplace {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.isLoading = false;
        this.currentProduct = null;
        
        this.init();
    }

    async init() {
        this.updateCartUI();
        await this.loadProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', 
            this.debounce(() => this.searchProducts(), 300)
        );
        
        // Checkout form
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleCheckout(e));
        }
        
        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async loadProducts() {
        this.showLoading(true);
        try {
            this.products = await api.getProducts();
            this.filteredProducts = [...this.products];
            this.renderProducts();
            this.updateProductCount();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');
        
        if (show) {
            spinner.classList.remove('hidden');
            grid.classList.add('hidden');
        } else {
            spinner.classList.add('hidden');
            grid.classList.remove('hidden');
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');
        
        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '';
            noProducts.classList.remove('hidden');
            return;
        }
        
        noProducts.classList.add('hidden');
        
        const productsToShow = this.filteredProducts.slice(0, this.currentPage * this.productsPerPage);
        
        grid.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
        
        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (productsToShow.length < this.filteredProducts.length) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }

    createProductCard(product) {
        const stockStatus = this.getStockStatus(product.quantity);
        const isOutOfStock = product.quantity === 0;
        
        return `
            <div class="product-card" onclick="marketplace.showProductDetails('${product.id}')">
                <div class="product-image">
                    <span>${this.getProductIcon(product.category)}</span>
                    ${product.quantity < 10 && product.quantity > 0 ? 
                        '<div class="product-badge">Low Stock</div>' : ''}
                    ${product.quantity === 0 ? 
                        '<div class="product-badge" style="background: #dc2626;">Out of Stock</div>' : ''}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">₹${product.price}/${product.unit}</div>
                    <div class="product-meta">
                        <span class="farmer-name">👨‍🌾 ${product.farmer_name}</span>
                        <span class="stock-status ${stockStatus.class}">${stockStatus.text}</span>
                    </div>
                    <div class="product-actions" onclick="event.stopPropagation()">
                        <button class="quick-add-btn" 
                                onclick="marketplace.quickAddToCart('${product.id}')"
                                ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'Out of Stock' : 'Quick Add'}
                        </button>
                        <button class="view-details-btn" 
                                onclick="marketplace.showProductDetails('${product.id}')">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getProductIcon(category) {
        const icons = {
            'vegetables': '🥕',
            'fruits': '🍎',
            'grains': '🌾',
            'dairy': '🥛',
            'herbs': '🌿'
        };
        return icons[category] || '🌱';
    }

    getStockStatus(quantity) {
        if (quantity === 0) {
            return { class: 'out-of-stock', text: 'Out of Stock' };
        } else if (quantity < 10) {
            return { class: 'low-stock', text: `${quantity} left` };
        } else {
            return { class: 'in-stock', text: 'In Stock' };
        }
    }

    searchProducts() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        if (!searchTerm) {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.farmer_name.toLowerCase().includes(searchTerm)
            );
        }
        
        this.currentPage = 1;
        this.renderProducts();
        this.updateProductCount();
    }

    filterProducts() {
        const category = document.getElementById('categoryFilter').value;
        const priceRange = document.getElementById('priceFilter').value;
        const sortBy = document.getElementById('sortFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        let filtered = [...this.products];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.farmer_name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        if (category) {
            filtered = filtered.filter(product => product.category === category);
        }
        
        // Apply price filter
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            if (max) {
                filtered = filtered.filter(product => product.price >= min && product.price <= max);
            } else {
                filtered = filtered.filter(product => product.price >= min);
            }
        }
        
        // Apply sorting
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'name':
            default:
                filtered.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderProducts();
        this.updateProductCount();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('priceFilter').value = '';
        document.getElementById('sortFilter').value = 'name';
        
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.renderProducts();
        this.updateProductCount();
    }

    updateProductCount() {
        const count = this.filteredProducts.length;
        const total = this.products.length;
        document.getElementById('productCount').textContent = 
            `Showing ${count} of ${total} products`;
    }

    loadMoreProducts() {
        this.currentPage++;
        this.renderProducts();
    }

    showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        this.currentProduct = product;
        
        // Update modal content
        document.getElementById('modalProductName').textContent = product.name;
        document.getElementById('modalProductPrice').textContent = `₹${product.price}/${product.unit}`;
        document.getElementById('modalFarmerName').textContent = product.farmer_name;
        document.getElementById('modalProductCategory').textContent = product.category;
        document.getElementById('modalProductQuantity').textContent = `${product.quantity} ${product.unit}`;
        document.getElementById('modalProductDescription').textContent = product.description;
        document.getElementById('modalProductIcon').textContent = this.getProductIcon(product.category);
        document.getElementById('modalQuantity').value = 1;
        document.getElementById('modalQuantity').max = product.quantity;
        
        // Update add to cart button
        const addBtn = document.getElementById('addToCartBtn');
        if (product.quantity === 0) {
            addBtn.textContent = 'Out of Stock';
            addBtn.disabled = true;
        } else {
            addBtn.textContent = 'Add to Cart';
            addBtn.disabled = false;
        }
        
        document.getElementById('productModal').style.display = 'block';
    }

    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
        this.currentProduct = null;
    }

    increaseQuantity() {
        const input = document.getElementById('modalQuantity');
        const max = parseInt(input.max);
        const current = parseInt(input.value);
        
        if (current < max) {
            input.value = current + 1;
        }
    }

    decreaseQuantity() {
        const input = document.getElementById('modalQuantity');
        const current = parseInt(input.value);
        
        if (current > 1) {
            input.value = current - 1;
        }
    }

    quickAddToCart(productId) {
        this.addToCart(productId, 1);
    }

    addToCartFromModal() {
        if (!this.currentProduct) return;
        
        const quantity = parseInt(document.getElementById('modalQuantity').value);
        this.addToCart(this.currentProduct.id, quantity);
        this.closeProductModal();
    }

    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.quantity === 0) {
            this.showNotification('Product is out of stock', 'error');
            return;
        }
        
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.quantity) {
                this.showNotification('Not enough stock available', 'error');
                return;
            }
            existingItem.quantity = newQuantity;
        } else {
            if (quantity > product.quantity) {
                this.showNotification('Not enough stock available', 'error');
                return;
            }
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                farmer_name: product.farmer_name,
                quantity: quantity,
                category: product.category
            });
        }
        
        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${product.name} added to cart!`, 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    updateCartQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        const product = this.products.find(p => p.id === productId);
        
        if (!item || !product) return;
        
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }
        
        if (newQuantity > product.quantity) {
            this.showNotification('Not enough stock available', 'error');
            return;
        }
        
        item.quantity = newQuantity;
        this.saveCart();
        this.updateCartUI();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        this.updateCartCount();
        this.renderCartItems();
    }

    updateCartCount() {
        const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartCount').textContent = count;
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <p>Add some fresh produce to get started!</p>
                </div>
            `;
            cartTotal.textContent = '0';
            return;
        }
        
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${this.getProductIcon(item.category)}
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}/${item.unit}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="marketplace.updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" class="qty-input" value="${item.quantity}" 
                               onchange="marketplace.updateCartQuantity('${item.id}', parseInt(this.value))" min="1">
                        <button class="qty-btn" onclick="marketplace.updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        <button class="remove-item" onclick="marketplace.removeFromCart('${item.id}')" title="Remove">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        cartTotal.textContent = total.toFixed(2);
    }

    toggleCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.showNotification('Cart cleared', 'info');
        }
    }

    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }
        
        if (!auth.isAuthenticated()) {
            this.showNotification('Please login to continue', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        if (auth.getUserType() !== 'buyer') {
            this.showNotification('Only buyers can place orders', 'error');
            return;
        }
        
        this.showCheckoutModal();
    }

    showCheckoutModal() {
        this.updateCheckoutSummary();
        document.getElementById('checkoutModal').style.display = 'block';
    }

    closeCheckoutModal() {
        document.getElementById('checkoutModal').style.display = 'none';
    }

    updateCheckoutSummary() {
        const checkoutItems = document.getElementById('checkoutItems');
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 50;
        const total = subtotal + deliveryFee;
        
        checkoutItems.innerHTML = this.cart.map(item => `
            <div class="checkout-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
        
        document.getElementById('checkoutSubtotal').textContent = subtotal.toFixed(2);
        document.getElementById('checkoutTotal').textContent = total.toFixed(2);
    }

    async handleCheckout(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const address = formData.get('address');
        const phone = formData.get('phone');
        const paymentMethod = formData.get('payment');
        
        if (!address || !phone) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Placing Order...';
        submitBtn.disabled = true;
        
        try {
            const orderData = {
                items: this.cart.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                })),
                delivery_address: address,
                payment_method: paymentMethod
            };
            
            await api.createOrder(orderData);
            
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.closeCheckoutModal();
            this.toggleCart();
            
            this.showNotification('Order placed successfully!', 'success');
            
            // Redirect to dashboard after a delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('Failed to place order: ' + error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 2rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '2000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            'success': '#10b981',
            'error': '#dc2626',
            'info': '#2563eb',
            'warning': '#f59e0b'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        console.error(message);
        this.showNotification(message, 'error');
    }
}

// Initialize marketplace when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marketplace = new Marketplace();
});

// Global functions for inline event handlers
window.toggleCart = () => marketplace.toggleCart();
window.searchProducts = () => marketplace.searchProducts();
window.filterProducts = () => marketplace.filterProducts();
window.clearFilters = () => marketplace.clearFilters();
window.loadMoreProducts = () => marketplace.loadMoreProducts();
window.closeProductModal = () => marketplace.closeProductModal();
window.closeCheckoutModal = () => marketplace.closeCheckoutModal();
window.increaseQuantity = () => marketplace.increaseQuantity();
window.decreaseQuantity = () => marketplace.decreaseQuantity();
window.addToCartFromModal = () => marketplace.addToCartFromModal();
window.proceedToCheckout = () => marketplace.proceedToCheckout();
window.clearCart = () => marketplace.clearCart();

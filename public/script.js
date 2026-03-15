// Authentication state
let currentUser = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');

    // Check for existing auth
    checkAuth();

    // Add floating particles
    createFloatingParticles();

    // Navigation
    document.getElementById('searchNav').addEventListener('click', (e) => {
        e.preventDefault();
        showSearchPage();
    });

    document.getElementById('pricingNav').addEventListener('click', (e) => {
        e.preventDefault();
        showPricingPage();
    });

    document.getElementById('profileNav').addEventListener('click', (e) => {
        e.preventDefault();
        showProfilePage();
    });

    document.getElementById('loginNav').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginModal();
    });

    document.getElementById('logoutNav').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Modal handling
    setupModals();

    // Search functionality
    async function performSearch(query) {
        if (!query.trim()) return;

        if (!authToken) {
            showLoginModal();
            alert('Please login to search');
            return;
        }

        searchBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            searchBtn.style.transform = 'scale(1)';
        }, 150);

        loading.classList.remove('hidden');
        results.innerHTML = '';
        results.classList.add('searching');

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();

            loading.classList.add('hidden');
            results.classList.remove('searching');

            if (response.status === 401) {
                showLoginModal();
                alert('Please login to search');
                return;
            }

            if (response.status === 403 && data.upgrade) {
                alert(`Search limit reached! You've used ${data.searchesUsed}/${data.searchLimit} searches. Please upgrade your plan.`);
                showPricingPage();
                return;
            }

            if (data.results && data.results.length > 0) {
                displayResults(data.results, data.canDownload);
                updateSearchCount(data.searchesUsed, data.searchLimit);
            } else {
                results.innerHTML = `
                    <div class="no-results">
                        <div class="no-results-icon">⚠</div>
                        <h3>No Neural Matches Found</h3>
                        <p>The quantum database couldn't locate "${query}". Try different dialogue or check for typos.</p>
                    </div>
                `;
            }
        } catch (error) {
            loading.classList.add('hidden');
            results.classList.remove('searching');
            results.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚡</div>
                    <h3>System Error</h3>
                    <p>Neural network connection failed. Please retry your search.</p>
                </div>
            `;
            console.error('Search error:', error);
        }
    }

    function displayResults(searchResults, canDownload) {
        results.innerHTML = searchResults.map((result, index) => {
            let embedSrc;
            if (result.embedUrl) {
                embedSrc = result.embedUrl;
            } else {
                const videoId = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
                embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }
            
            const downloadBtn = canDownload && embedSrc ? 
                `<button class="download-btn" onclick="openVideoWindow('${embedSrc}')">📥 Open Video</button>` : '';
            
            return `
                <div class="result-card" style="animation-delay: ${index * 0.1}s">
                    <div class="video-container">
                        ${embedSrc ? 
                            `<iframe src="${embedSrc}" 
                                     allowfullscreen
                                     loading="lazy"></iframe>` :
                            `<div class="video-unavailable">
                                <div class="unavailable-icon">📺</div>
                                <span>Video Unavailable</span>
                             </div>`
                        }
                    </div>
                    <div class="result-content">
                        <div class="result-title">${result.title}</div>
                        <div class="dialogue">${result.dialogue}</div>
                        <div class="meta-info">
                            <div class="meta-left">
                                <span class="source-tag">${result.source}</span>
                                ${result.timestamp !== 'Unknown' ? `<span class="timestamp">@ ${result.timestamp}</span>` : ''}
                            </div>
                            <span class="confidence">${result.confidence}% MATCH</span>
                        </div>
                        ${downloadBtn}
                    </div>
                    <div class="card-glow"></div>
                </div>
            `;
        }).join('');

        addCardInteractions();
    }

    // Make openVideoWindow global
    window.openVideoWindow = function(embedUrl) {
        const videoId = embedUrl.match(/embed\/([^?]+)/)?.[1];
        if (videoId) {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'width=800,height=600');
        }
    };

    function updateSearchCount(used, limit) {
        const limitText = limit === -1 ? '∞' : limit;
        console.log(`Searches: ${used}/${limitText}`);
    }

    function addCardInteractions() {
        const cards = document.querySelectorAll('.result-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) rotateX(5deg)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) rotateX(0)';
            });

            card.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                this.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
        });
    }

    function createFloatingParticles() {
        const particleContainer = document.querySelector('.floating-particles');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: ${Math.random() > 0.5 ? 'var(--neon-cyan)' : 'var(--neon-magenta)'};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: particleFloat ${Math.random() * 20 + 10}s infinite linear;
                animation-delay: ${Math.random() * 10}s;
                box-shadow: 0 0 10px currentColor;
            `;
            particleContainer.appendChild(particle);
        }
    }

    // Event listeners
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });

    // Logo glitch effect
    const logo = document.querySelector('.logo-text');
    setInterval(() => {
        if (Math.random() < 0.1) {
            logo.style.textShadow = '2px 0 #ff00ff, -2px 0 #00ffff';
            setTimeout(() => {
                logo.style.textShadow = 'none';
            }, 100);
        }
    }, 3000);

    // Parallax effect
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        const grid = document.querySelector('.background-grid');
        if (grid) {
            grid.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
        }
        
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            const speed = (index % 3 + 1) * 0.5;
            particle.style.transform = `translate(${mouseX * speed * 10}px, ${mouseY * speed * 10}px)`;
        });
    });

    searchInput.focus();
});

// Authentication functions
async function checkAuth() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                updateUIForAuth();
            } else {
                localStorage.removeItem('authToken');
                authToken = null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
}

function updateUIForAuth() {
    if (currentUser) {
        document.getElementById('loginNav').style.display = 'none';
        document.getElementById('logoutNav').style.display = 'block';
        document.getElementById('profileNav').style.display = 'block';
    } else {
        document.getElementById('loginNav').style.display = 'block';
        document.getElementById('logoutNav').style.display = 'none';
        document.getElementById('profileNav').style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    updateUIForAuth();
    showSearchPage();
    alert('Logged out successfully');
}

// Modal functions
function setupModals() {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    // Close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Switch between modals
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'block';
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('authToken', authToken);
                updateUIForAuth();
                loginModal.style.display = 'none';
                alert('Login successful!');
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            alert('Login failed. Please try again.');
            console.error('Login error:', error);
        }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                authToken = data.token;
                currentUser = data.user;
                localStorage.setItem('authToken', authToken);
                updateUIForAuth();
                registerModal.style.display = 'none';
                alert('Registration successful!');
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            alert('Registration failed. Please try again.');
            console.error('Registration error:', error);
        }
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

// Page navigation
function showSearchPage() {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('pricingPage').style.display = 'none';
    document.getElementById('profilePage').style.display = 'none';
}

function showPricingPage() {
    document.querySelector('.container').style.display = 'none';
    document.getElementById('pricingPage').style.display = 'block';
    document.getElementById('profilePage').style.display = 'none';
    setupPricing();
}

function showProfilePage() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    document.querySelector('.container').style.display = 'none';
    document.getElementById('pricingPage').style.display = 'none';
    document.getElementById('profilePage').style.display = 'block';
    
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePlan').textContent = currentUser.plan.toUpperCase();
    const limitText = currentUser.searchLimit === -1 ? '∞' : currentUser.searchLimit;
    document.getElementById('profileSearches').textContent = `${currentUser.searchesUsed}/${limitText}`;
    
    // Add reset date info if available
    if (currentUser.nextResetDate) {
        const resetDate = new Date(currentUser.nextResetDate).toLocaleDateString();
        const resetInfo = document.createElement('p');
        resetInfo.innerHTML = `<strong>Next Reset:</strong> <span>${resetDate}</span>`;
        document.querySelector('.profile-info').appendChild(resetInfo);
    }
    
    document.getElementById('backToSearch').addEventListener('click', showSearchPage);
}

// Pricing and payment
function setupPricing() {
    document.querySelectorAll('.plan-btn').forEach(btn => {
        if (!btn.dataset.plan) return;
        
        btn.addEventListener('click', async function() {
            if (!currentUser) {
                showLoginModal();
                alert('Please login to upgrade');
                return;
            }

            const plan = this.dataset.plan;
            await initializePayment(plan);
        });
    });
}

async function initializePayment(plan) {
    try {
        const response = await fetch('/api/payment/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                plan
            })
        });

        const data = await response.json();

        if (response.ok && data.data) {
            // Redirect to Paystack payment page
            window.location.href = data.data.authorization_url;
        } else {
            alert('Payment initialization failed');
        }
    } catch (error) {
        alert('Payment failed. Please try again.');
        console.error('Payment error:', error);
    }
}

// Check for payment callback
const urlParams = new URLSearchParams(window.location.search);
const reference = urlParams.get('reference');
if (reference) {
    verifyPayment(reference);
}

async function verifyPayment(reference) {
    try {
        const response = await fetch(`/api/payment/verify/${reference}`);
        const data = await response.json();

        if (response.ok && data.success) {
            alert(`Payment successful! You're now on the ${data.plan.toUpperCase()} plan.`);
            // Refresh user data
            await checkAuth();
            window.history.replaceState({}, document.title, '/');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
    }
}

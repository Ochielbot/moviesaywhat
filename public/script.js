document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');

    // Add floating particles
    createFloatingParticles();
    
    // Add typing cursor effect
    addTypingCursor();

    // Search functionality
    async function performSearch(query) {
        if (!query.trim()) return;

        // Add search animation
        searchBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            searchBtn.style.transform = 'scale(1)';
        }, 150);

        loading.classList.remove('hidden');
        results.innerHTML = '';
        results.classList.add('searching');

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            loading.classList.add('hidden');
            results.classList.remove('searching');

            if (data.results && data.results.length > 0) {
                displayResults(data.results);
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

    function displayResults(searchResults) {
        results.innerHTML = searchResults.map((result, index) => {
            // Use embedUrl if available (includes timestamp), otherwise extract video ID
            let embedSrc;
            if (result.embedUrl) {
                embedSrc = result.embedUrl;
            } else {
                const videoId = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
                embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }
            
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
                    </div>
                    <div class="card-glow"></div>
                </div>
            `;
        }).join('');

        // Add hover effects to cards
        addCardInteractions();
    }

    function addCardInteractions() {
        const cards = document.querySelectorAll('.result-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) rotateX(5deg)';
                
                // Add ripple effect
                const ripple = document.createElement('div');
                ripple.className = 'card-ripple';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) rotateX(0)';
            });

            // Add tilt effect based on mouse position
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

    function addTypingCursor() {
        // Remove the cursor functionality that might be interfering
        // The search input should work normally now
        console.log('Search input ready');
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

    // Add glitch effect on logo
    const logo = document.querySelector('.logo-text');
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every interval
            logo.style.textShadow = '2px 0 #ff00ff, -2px 0 #00ffff';
            setTimeout(() => {
                logo.style.textShadow = 'none';
            }, 100);
        }
    }, 3000);

    // Parallax effect for background
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        const grid = document.querySelector('.background-grid');
        grid.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
        
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            const speed = (index % 3 + 1) * 0.5;
            particle.style.transform = `translate(${mouseX * speed * 10}px, ${mouseY * speed * 10}px)`;
        });
    });

    // Focus on search input
    searchInput.focus();
});
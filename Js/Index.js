window.addEventListener('DOMContentLoaded', () => {
    addHeroAnimations();
    addCardEffects();
    trackVisit();
});

function addHeroAnimations() {
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(30px)';
        setTimeout(() => {
            hero.style.transition = 'all 1s ease';
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }

    const heroImage = document.querySelector('.hero-image img');
    if (heroImage) {
        heroImage.style.animation = 'float 3s ease-in-out infinite';
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
}

function addCardEffects() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 400 + (i * 200));
    });
}

function trackVisit() {
    let visits = parseInt(localStorage.getItem('siteVisits')) || 0;
    visits++;
    localStorage.setItem('siteVisits', visits);

    if (visits === 1) {
        setTimeout(() => {
            showNotification('Welcome to PC Builder! Start building your dream PC today.', 'info');
        }, 1500);
    }
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.location.href = 'cart.html';
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        window.location.href = 'build.html';
    }
});

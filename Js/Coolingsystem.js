window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.cooling-card');
    addStarRatings('.cooling-card');
    enableImageZoom('.cooling-card');
    enableQuickView('.cooling-card');
    addWishlistButtons('.cooling-card');
    addCompareButtons('.cooling-card');
    addHoverEffects('.cooling-card');
    highlightSelected('.cooling-card', 'selectedCooling', '.buy-btn');
});

function setupSelectButtons() {
    document.querySelectorAll('.cooling-card').forEach(card => {
        const btn = card.querySelector('.buy-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.querySelector('img').src,
                category: 'Cooling'
            };
            if (addComponentToCart(item, 'Cooling')) {
                setTimeout(() => { window.location.href = 'build.html'; }, 1200);
            }
        });
    });
}

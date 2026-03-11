window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.memory-card');
    addStarRatings('.memory-card');
    enableImageZoom('.memory-card');
    enableQuickView('.memory-card');
    addWishlistButtons('.memory-card');
    addCompareButtons('.memory-card');
    addHoverEffects('.memory-card');
    highlightSelected('.memory-card', 'selectedRAM', '.buy-btn');
});

function setupSelectButtons() {
    document.querySelectorAll('.memory-card').forEach(card => {
        const btn = card.querySelector('.buy-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.querySelector('img').src,
                category: 'Memory'
            };
            if (addComponentToCart(item, 'RAM')) {
                setTimeout(() => { window.location.href = 'build.html'; }, 1200);
            }
        });
    });
}

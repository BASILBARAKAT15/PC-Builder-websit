window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.mb-card');
    addStarRatings('.mb-card');
    enableImageZoom('.mb-card');
    enableQuickView('.mb-card');
    addWishlistButtons('.mb-card');
    addCompareButtons('.mb-card');
    addHoverEffects('.mb-card');
    highlightSelected('.mb-card', 'selectedMotherboard', '.buy-btn');
});

function setupSelectButtons() {
    document.querySelectorAll('.mb-card').forEach(card => {
        card.querySelector('.buy-btn').addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.querySelector('img').src,
                category: 'Motherboard'
            };
            if (addComponentToCart(item, 'Motherboard')) {
                setTimeout(() => { window.location.href = 'build.html'; }, 1200);
            }
        });
    });
}

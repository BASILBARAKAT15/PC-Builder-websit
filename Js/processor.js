window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.comp-card');
    addStarRatings('.comp-card');
    enableImageZoom('.comp-card');
    enableQuickView('.comp-card');
    addWishlistButtons('.comp-card');
    addCompareButtons('.comp-card');
    addHoverEffects('.comp-card');
    highlightSelected('.comp-card', 'selectedProcessor', '.select-btn');
});

function setupSelectButtons() {
    document.querySelectorAll('.comp-card').forEach(card => {
        card.querySelector('.select-btn').addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.dataset.image || card.querySelector('img').src,
                category: 'Processor'
            };
            if (addComponentToCart(item, 'Processor')) {
                setTimeout(() => { window.location.href = 'build.html'; }, 1200);
            }
        });
    });
}

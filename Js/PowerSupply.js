window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.psu-card');
    addStarRatings('.psu-card');
    enableImageZoom('.psu-card');
    enableQuickView('.psu-card');
    addWishlistButtons('.psu-card');
    addCompareButtons('.psu-card');
    addHoverEffects('.psu-card');
    highlightSelected('.psu-card', 'selectedPSU', '.buy-btn');
});

function setupSelectButtons() {
    document.querySelectorAll('.psu-card').forEach(card => {
        card.querySelector('.buy-btn').addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.querySelector('img').src,
                category: 'Power Supply'
            };
            if (addComponentToCart(item, 'PSU')) {
                setTimeout(() => { window.location.href = 'build.html'; }, 1200);
            }
        });
    });
}

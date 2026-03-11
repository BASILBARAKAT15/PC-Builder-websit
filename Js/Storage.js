window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.storage-card');
    addStarRatings('.storage-card');
    enableImageZoom('.storage-card');
    enableQuickView('.storage-card');
    addWishlistButtons('.storage-card');
    addCompareButtons('.storage-card');
    addHoverEffects('.storage-card');
    highlightSelected('.storage-card', 'selectedStorage', '.buy-btn');
});

function setupSelectButtons() {
    document.querySelectorAll('.storage-card').forEach(card => {
        card.querySelector('.buy-btn').addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.querySelector('img').src,
                category: 'Storage'
            };
            if (addComponentToCart(item, 'Storage')) {
                setTimeout(() => { window.location.href = 'build.html'; }, 1200);
            }
        });
    });
}

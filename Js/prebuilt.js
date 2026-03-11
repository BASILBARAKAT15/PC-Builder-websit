window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.comp-card');
    addStarRatings('.comp-card');
    enableImageZoom('.comp-card');
    enableQuickView('.comp-card');
    addWishlistButtons('.comp-card');
    addCompareButtons('.comp-card');
    addHoverEffects('.comp-card');
});

function setupSelectButtons() {
    document.querySelectorAll('.comp-card').forEach(card => {
        card.querySelector('.select-btn').addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.querySelector('img').src,
                category: 'Pre-Built'
            };
            if (addToCart(item)) {
                const btn = card.querySelector('.select-btn');
                btn.textContent = '✓ Added';
                btn.classList.add('btn-selected');
                setTimeout(() => {
                    btn.textContent = 'Add to Cart';
                    btn.classList.remove('btn-selected');
                }, 2000);
            }
        });
    });
}

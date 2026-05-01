window.addEventListener('DOMContentLoaded', () => {
    setupBuyButtons();
    animateCards('.trend-card');
    addStarRatings('.trend-card');
    enableImageZoom('.trend-card');
    enableQuickView('.trend-card');
    addWishlistButtons('.trend-card');
    addCompareButtons('.trend-card');
    addHoverEffects('.trend-card');
});

function setupBuyButtons() {
    document.querySelectorAll('.trend-card').forEach(card => {
        card.querySelector('.buy-btn').addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.dataset.image,
                category: 'Trending'
            };
            if (addToCart(item)) {
                const btn = card.querySelector('.buy-btn');
                btn.textContent = '✓ Added';
                btn.classList.add('btn-selected');
                setTimeout(() => {
                    btn.textContent = 'Buy';
                    btn.classList.remove('btn-selected');
                }, 2000);
            }
        });
    });
}

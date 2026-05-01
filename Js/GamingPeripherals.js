window.addEventListener('DOMContentLoaded', () => {
    setupSelectButtons();
    animateCards('.peripheral-card');
    addStarRatings('.peripheral-card');
    enableImageZoom('.peripheral-card');
    enableQuickView('.peripheral-card');
    addWishlistButtons('.peripheral-card');
    addCompareButtons('.peripheral-card');
    addHoverEffects('.peripheral-card');
});

function setupSelectButtons() {
    document.querySelectorAll('.peripheral-card').forEach(card => {
        const btn = card.querySelector('.buy-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const item = {
                name: card.dataset.name,
                price: parseInt(card.dataset.price),
                image: card.querySelector('img').src,
                category: 'Peripherals'
            };
            if (addToCart(item)) {
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

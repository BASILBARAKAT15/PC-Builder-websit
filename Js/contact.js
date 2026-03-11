window.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = form.querySelectorAll('input, textarea');
            let valid = true;
            inputs.forEach(input => {
                if (!input.value.trim()) valid = false;
            });

            if (!valid) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
            form.reset();
        });
    }
});

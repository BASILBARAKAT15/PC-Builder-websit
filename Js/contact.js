document.addEventListener("DOMContentLoaded", function () {

    // Initialize EmailJS with your public key (v4)
    emailjs.init({
        publicKey: "moGGWiE22mPmK1wNi"
    });

    const contactForm = document.getElementById("contact-form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = contactForm.name.value.trim();
        const email = contactForm.email.value.trim();
        const message = contactForm.message.value.trim();
        const timeInput = document.getElementById("time");

        if (!name || !email || !message) {
            showNotification('Please fill in all fields!', 'warning');
            return;
        }

        if (timeInput) timeInput.value = new Date().toLocaleString();

        // Send EmailJS email with all variables
        emailjs.send("service_nfd8xfe", "template_8m8v6gj", {
            from_name: name,                 // must match {{from_name}} in template
            from_email: email,               // must match {{from_email}} in template
            to_name: "Support Team",         // optional {{to_name}}
            message: message,                // must match {{message}}
            login_time: timeInput.value,     // optional {{login_time}}
            device_info: navigator.userAgent // optional {{device_info}}
        })
        .then(() => {
            showNotification('Message sent successfully!', 'success');
            contactForm.reset();
        })
        .catch(error => {
            console.error("EmailJS Error:", error);
            showNotification('Failed to send message. Please try again.', 'error');
        });
    });

});
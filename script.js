// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Contact form handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const formData = new FormData(this);
        const formValues = Object.fromEntries(formData.entries());
        
        // Here you would typically send the form data to a server
        // For now, we'll just show an alert
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// Booking form handling
const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const formData = new FormData(this);
        const bookingDetails = Object.fromEntries(formData.entries());
        
        // Create XHR request
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/book', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                alert('Booking successful! Check your email for confirmation.');
                bookingForm.reset();
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    alert('Error: ' + (response.error || 'Unknown error occurred'));
                } catch (e) {
                    alert('Error submitting booking. Please try again later.');
                }
            }
        };
        
        xhr.onerror = function() {
            alert('Network error occurred. Please check your connection and try again.');
        };
        
        // Send the request
        try {
            xhr.send(JSON.stringify(bookingDetails));
        } catch (error) {
            alert('Error preparing booking data. Please try again.');
            console.error('Send error:', error);
        }
    });
}

// Add scroll-based navbar background
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = '#1a252f';
    } else {
        navbar.style.backgroundColor = '#2c3e50';
    }
});

// Add animation to sections when they come into view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.content-section').forEach((section) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'all 0.5s ease-out';
    observer.observe(section);
});

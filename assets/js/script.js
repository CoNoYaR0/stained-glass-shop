// Preloader js    
$(window).on('load', function () {
  $('.preloader').fadeOut(100);
});

(function ($) {
  'use strict';

  
  // product Slider
  $('.product-image-slider').slick({
    autoplay: false,
    infinite: true,
    arrows: false,
    dots: true,
    customPaging: function (slider, i) {
      var image = $(slider.$slides[i]).data('image');
      return '<img class="img-fluid" src="' + image + '" alt="products-image">';
    }
  });

  // Product slider
  $('.products-slider').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    dots: false,
    arrows: false,
    responsive: [{
        breakpoint: 1024,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  });

})(jQuery);

// Contact Form Submission
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status-messages');

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const messageInput = document.getElementById('contact-message');

      const name = nameInput ? nameInput.value : '';
      const email = emailInput ? emailInput.value : '';
      const message = messageInput ? messageInput.value : '';

      if (!name.trim() || !email.trim() || !message.trim()) {
        if (formStatus) formStatus.innerHTML = '<p class="text-danger">Please fill out all fields.</p>';
        return;
      }
      if (!validateEmail(email.trim())) {
        if (formStatus) formStatus.innerHTML = '<p class="text-danger">Please enter a valid email address.</p>';
        return;
      }

      if (formStatus) formStatus.innerHTML = '<p class="text-info">Sending...</p>';
      const submitButton = contactForm.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;

      fetch('/.netlify/functions/send-to-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      })
      .then(response => response.json().then(data => ({ status: response.status, body: data })))
      .then(({ status, body }) => {
        if (formStatus) {
          if (status === 200) {
            formStatus.innerHTML = '<p class="text-success">Message sent successfully!</p>';
            contactForm.reset();
          } else {
            formStatus.innerHTML = `<p class="text-danger">Error: ${body.body || 'Could not send message.'}</p>`;
          }
        }
      })
      .catch(error => {
        console.error('Error submitting contact form:', error);
        if (formStatus) formStatus.innerHTML = '<p class="text-danger">An unexpected error occurred. Please try again later.</p>';
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
      });
    });
  }
});

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
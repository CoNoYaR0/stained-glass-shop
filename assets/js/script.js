// Preloader js    
$(window).on('load', function () {
  $('.preloader').fadeOut(100);
});

(function ($) {
  'use strict';

  // escapeHTML function can remain if potentially used by other non-chat scripts,
  // or be removed if it was exclusively for chat. For now, let's keep it.
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
  }

  // Supabase client initialization and all chat-related global variables are removed.
  // let realtimeChannel = null; // Removed

  $(document).ready(function() {
    // product Slider
    if ($('.product-image-slider').length > 0) {
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
    }

    // Product slider
    if ($('.products-slider').length > 0) {
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
    }
  }); // End of $(document).ready()

  // Floating Contact Button Logic (REMOVED)
  // const contactUsButton = $('#contact-us-button');
  // const contactOptionsModal = $('#contact-options');
  // if (contactUsButton.length && contactOptionsModal.length) { ... }

  // All Live Chat Box Logic and Supabase integration code (REMOVED)
  // const liveChatOption = $('#live-chat-option');
  // ... many lines of code ...
  // if (supabaseClient) { supabaseClient.auth.onAuthStateChange(...); }

  // Initial check for session (REMOVED - was part of onAuthStateChange)

  // Event listener for a Facebook login button (REMOVED - was part of onAuthStateChange)
  // $(document).ready(function() { ... }); // This specific one, not the main one for sliders

})(jQuery);

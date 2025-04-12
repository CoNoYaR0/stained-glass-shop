// Preloader js    
$(window).on('load', function () {
  $('.preloader').fadeOut(100);
});

(function ($) {
  'use strict';

  
  // product-image-slider
if ($('.product-image-slider').length) {
  $('.product-image-slider').slick({
    autoplay: false,
    infinite: true,
    arrows: false,
    dots: true,
    customPaging: function (slider, i) {
      var image = $(slider.$slides[i]).data('image');
      return '<img class="img-fluid" src="' + image + '" alt="product-image">';
    }
  });
}

  // Product slider
if ($('.product-slider').length) {
  $('.product-slider').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    dots: false,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 }},
      { breakpoint: 600,  settings: { slidesToShow: 2 }},
      { breakpoint: 480,  settings: { slidesToShow: 1 }}
    ]
  });
}


})(jQuery);

document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll('.product-item');

  items.forEach(item => {
    item.addEventListener("touchstart", function (e) {
      // Supprime les "show-btn" des autres
      items.forEach(el => {
        if (el !== item) el.classList.remove("show-btn");
      });

      // Toggle pour cet item
      item.classList.toggle("show-btn");

      // Empêche le clic automatique
      e.stopPropagation();
    });
  });

  // Si on clique ailleurs que sur un produit
  document.body.addEventListener("touchstart", function () {
    items.forEach(el => el.classList.remove("show-btn"));
  }, { passive: true });
});

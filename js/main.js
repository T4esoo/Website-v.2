(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    // Initiate the wowjs
    new WOW().init();

    //Konami
    function onKonamiCode(cb) {
        var input = '';
        var key = '38384040373937396665';
        document.addEventListener('keydown', function (e) {
          input += ("" + e.keyCode);
          if (input === key) {
            return cb();
          }
          if (!key.indexOf(input)) return;
          input = ("" + e.keyCode);
        });
      }
      
      onKonamiCode(function () {alert('\o/')})

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').addClass('shadow-sm').css('top', '0px');
        } else {
            $('.sticky-top').removeClass('shadow-sm').css('top', '-100px');
        }
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });



    // Portfolio isotope and filter
    var portfolioIsotope = $('.portfolio-container').isotope({
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
    });
    $('#portfolio-flters li').on('click', function () {
        $("#portfolio-flters li").removeClass('active');
        $(this).addClass('active');

        portfolioIsotope.isotope({filter: $(this).data('filter')});
    });

    $(document).ready(function() {
        var $container = $('.portfolio-container');
        var $filters = $('#portfolio-flters li');
      
        // Wait for images to load before Isotope layout
        $container.imagesLoaded( function() {
          // Initialize Isotope with fitRows
          $container.isotope({
            itemSelector: '.portfolio-item',
            layoutMode: 'fitRows'
          });
        });
      
        // Set up filter buttons
        $filters.on('click', function() {
          $filters.removeClass('active');
          $(this).addClass('active');
          var filterValue = $(this).data('filter');
          $container.isotope({ filter: filterValue });
        });
      });
      


})(jQuery);
var myModal = document.getElementById('myModal')
var myInput = document.getElementById('myInput')
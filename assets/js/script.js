// Preloader js    
$(window).on('load', function () {
  $('.preloader').fadeOut(100);
});

(function ($) {
  'use strict';

  // THESE VALUES SHOULD BE POPULATED BY HUGO TEMPLATE / NETLIFY ENV VARS
  const SUPABASE_URL = window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.APP_CONFIG && window.APP_CONFIG.SUPABASE_ANON_KEY;
  let supabaseClient = null;
  let realtimeChannel = null;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.error("Error initializing Supabase client:", e);
      supabaseClient = null; // Ensure it's null if init fails
    }
  } else {
    console.warn('Supabase URL or Anon Key is not available. Realtime chat from Discord will not work.');
  }
  
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

  // Floating Contact Button Logic
  const contactUsButton = $('#contact-us-button');
  const contactOptionsModal = $('#contact-options');

  if (contactUsButton.length && contactOptionsModal.length) {
    contactUsButton.on('click', function() {
      contactOptionsModal.toggle();
    });

    // Optional: Close modal if clicked outside
    $(document).on('click', function(event) {
      if (!$(event.target).closest('.floating-contact').length) {
        if (contactOptionsModal.is(':visible')) {
          contactOptionsModal.hide();
        }
      }
    });
  }

  // Live Chat Box Logic
  const liveChatOption = $('#live-chat-option');
  const liveChatBox = $('#live-chat-box');
  const closeChatBoxButton = $('#close-chat-box');
  const liveChatMessages = $('#live-chat-messages');
  const liveChatInputField = $('#live-chat-input-field');
  const liveChatSendButton = $('#live-chat-send-button');
  // Also need the contact options modal to close it
  const contactOptionsModalForChat = $('#contact-options');


  if (liveChatOption.length && liveChatBox.length && closeChatBoxButton.length && liveChatMessages.length && liveChatInputField.length && liveChatSendButton.length && contactOptionsModalForChat.length) {
    liveChatOption.on('click', function(e) {
      e.preventDefault();
      liveChatBox.show();
      contactOptionsModalForChat.hide(); // Hide the general contact options modal

      if (supabaseClient && window.liveChatUserId) {
        const channelName = 'chat-' + window.liveChatUserId;
        realtimeChannel = supabaseClient.channel(channelName, {
          config: {
            broadcast: {
              self: false // Don't receive our own broadcasts
            }
          }
        });

        realtimeChannel
          .on('broadcast', { event: 'new_message' }, (payload) => {
            console.log('Received new_message broadcast:', payload);
            const message = payload.payload; // The actual message object
            if (message && message.text) {
              const messageSender = message.sender || 'Staff';
              // Display received message (style differently from user's sent messages)
              const messageElement = $('<div class="message received"><small class="sender-name"></small><p></p></div>');
              messageElement.find('small.sender-name').text(messageSender + ':');
              messageElement.find('p').text(message.text);
              liveChatMessages.append(messageElement);
              liveChatMessages.scrollTop(liveChatMessages[0].scrollHeight); // Scroll to bottom
            }
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('Subscribed to Supabase channel:', channelName);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Supabase channel error:', err);
            } else if (status === 'TIMED_OUT') {
              console.error('Supabase subscription timed out.');
            }
          });
      }
    });

    closeChatBoxButton.on('click', function() {
      if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel)
          .then(() => {
            console.log('Unsubscribed from Supabase channel.');
            realtimeChannel = null;
          })
          .catch(err => {
            console.error('Error unsubscribing from Supabase channel:', err);
          });
      }
      liveChatBox.hide();
    });

    liveChatSendButton.on('click', function() {
      const messageText = liveChatInputField.val().trim();
      if (messageText) {
        // Display sent message
        const messageElement = $('<div class="message sent"><p></p></div>');
        messageElement.find('p').text(messageText);
        liveChatMessages.append(messageElement);
        liveChatMessages.scrollTop(liveChatMessages[0].scrollHeight); // Scroll to bottom

        // Clear input field
        liveChatInputField.val('');

        // Generate a simple userId if not already present (for session)
        if (!window.liveChatUserId) {
          window.liveChatUserId = 'user-' + Math.random().toString(36).substr(2, 9);
        }

        $.ajax({
          url: '/.netlify/functions/live-chat', // Endpoint for the new Netlify function
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            message: messageText,
            userId: window.liveChatUserId
          }),
          success: function(response) {
            console.log('Message sent to backend:', response);
            // Optionally, display a success indicator or handle backend response
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.error('Error sending message:', textStatus, errorThrown);
            // Display an error message in the chat or UI
            const errorElement = $('<div class="message received"><p style="color: red;">Error: Could not send message.</p></div>');
            liveChatMessages.append(errorElement);
            liveChatMessages.scrollTop(liveChatMessages[0].scrollHeight);
          }
        });
      }
    });

    // Optional: Allow sending with Enter key
    liveChatInputField.on('keypress', function(e) {
      if (e.which === 13 && !e.shiftKey) { // Enter key pressed without Shift
        e.preventDefault();
        liveChatSendButton.click();
      }
    });
  }
})(jQuery);
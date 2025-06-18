// Preloader js    
$(window).on('load', function () {
  $('.preloader').fadeOut(100);
});

(function ($) {
  'use strict';

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
              messageElement.find('p').text(escapeHTML(message.text)); // Use escapeHTML here
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
        messageElement.find('p').text(escapeHTML(messageText)); // Use escapeHTML here
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

  // --- Supabase Auth ---

  function updateChatAvailability(isLoggedIn) {
    const liveChatOption = $('#live-chat-option'); // Ensure this selector is correct
    const liveChatBox = $('#live-chat-box');
    const liveChatMessages = $('#live-chat-messages');

    if (isLoggedIn) {
      if (liveChatOption.length) {
        liveChatOption.show().css('opacity', 1).prop('disabled', false);
        // Consider adding a visual cue or re-enabling a previously disabled state
        // For example, if it was greyed out, remove that style.
        // If a message was shown about needing to log in, clear it.
      }
      console.log("Chat is available.");
    } else {
      if (liveChatOption.length) {
        liveChatOption.hide().css('opacity', 0.5).prop('disabled', true); // Hide or disable
        console.log("Chat is unavailable. User needs to log in.");
      }
      if (liveChatBox.length && liveChatBox.is(':visible')) {
        // If chat box is open, close it or display a message
        if (realtimeChannel) {
          supabaseClient.removeChannel(realtimeChannel).catch(console.error);
          realtimeChannel = null;
        }
        liveChatBox.hide();
        // Optionally, show a message in a different part of the UI
        // or within the chat button's parent.
        alert("Please log in to use the Live Chat feature.");
      }
       if (liveChatMessages.length && liveChatBox.is(':visible')) {
        liveChatMessages.html('<p>Please log in to continue chatting.</p>');
      }
    }
  }

  function updateUIAfterLogin(user) {
    const facebookLoginButton = $('#facebook-login-button');
    const logoutButton = $('#logout-button');
    const userInfoDisplay = $('#user-info');

    if (user) {
      // User is logged in
      if (facebookLoginButton.length) facebookLoginButton.hide();
      if (logoutButton.length) {
        logoutButton.show();
        logoutButton.off('click').on('click', async () => {
          if (supabaseClient) {
            try {
              const { error } = await supabaseClient.auth.signOut();
              if (error) {
                console.error("Error during sign out:", error.message);
                alert("Error signing out: " + error.message);
              } else {
                console.log("User signed out successfully.");
                // onAuthStateChange will handle UI updates
              }
            } catch (e) {
              console.error("Exception during sign out:", e);
              alert("An unexpected error occurred during sign out.");
            }
          }
        });
      }
      if (userInfoDisplay.length) {
        // Display user's name or email. Prefer name from metadata if available.
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
        userInfoDisplay.text(`Logged in as: ${escapeHTML(displayName)}`).show();
      }
    } else {
      // User is logged out
      if (facebookLoginButton.length) facebookLoginButton.show();
      if (logoutButton.length) logoutButton.hide();
      if (userInfoDisplay.length) userInfoDisplay.empty().hide();
    }
  }

  // Handle Facebook Login
  async function handleFacebookLogin() {
    if (!supabaseClient) {
      console.error("Supabase client is not initialized. Cannot log in.");
      return;
    }
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'facebook'
      });
      if (error) {
        console.error("Error during Facebook login:", error.message);
        alert("Error during Facebook login: " + error.message); // Or display error in a more user-friendly way
      } else {
        // The user will be redirected to Facebook and then back to the app.
        // onAuthStateChange will handle the session.
        console.log("Redirecting to Facebook for login...", data);
      }
    } catch (e) {
      console.error("Exception during Facebook login:", e);
      alert("An unexpected error occurred during Facebook login.");
    }
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, session);
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user);
        // Prefer Facebook's username if available
        window.liveChatUserId = session.user.user_metadata?.user_name || session.user.id;
        console.log('liveChatUserId set to:', window.liveChatUserId);
        updateUIAfterLogin(session.user);
        updateChatAvailability(true);

        // Re-initialize or update chat channel if user logs in after page load
        if (liveChatOption.length && liveChatBox.is(':visible')) {
            // If chat box is already open, re-initiate channel connection
            if (realtimeChannel) {
                supabaseClient.removeChannel(realtimeChannel).catch(console.error);
                realtimeChannel = null;
            }
            liveChatOption.trigger('click'); // Simulate click to re-open and subscribe
        }

      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out.');
        window.liveChatUserId = null;
        updateUIAfterLogin(null);
        updateChatAvailability(false);
        // Clean up chat channel on logout
        if (realtimeChannel) {
          supabaseClient.removeChannel(realtimeChannel)
            .then(() => {
              console.log('Unsubscribed from Supabase channel on logout.');
              realtimeChannel = null;
            })
            .catch(err => {
              console.error('Error unsubscribing from Supabase channel on logout:', err);
            });
        }
        // Clear messages and show login prompt if chatbox is open
        if (liveChatBox.is(':visible')) {
            liveChatMessages.html('<p>Please log in to use the chat.</p>');
        }
      }
    });
  } else {
    // If Supabase is not available, ensure chat is not available
    updateChatAvailability(false);
  }

  // Event listener for a Facebook login button
  $(document).ready(function() {
    const facebookLoginButton = $('#facebook-login-button');
    if (facebookLoginButton.length) {
      facebookLoginButton.on('click', function(e) {
        e.preventDefault();
        handleFacebookLogin();
      });
    }

    // Initialize chat availability based on initial auth state (e.g. if user is already logged in)
    if (supabaseClient && supabaseClient.auth.getSession()) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log('User already signed in on page load:', session.user);
                window.liveChatUserId = session.user.user_metadata?.user_name || session.user.id;
                console.log('liveChatUserId set from existing session:', window.liveChatUserId);
                updateUIAfterLogin(session.user);
                updateChatAvailability(true);
            } else {
                updateChatAvailability(false);
            }
        }).catch(error => {
            console.error("Error getting session on page load:", error);
            updateChatAvailability(false);
        });
    } else {
        updateChatAvailability(false);
    }
  });

})(jQuery);
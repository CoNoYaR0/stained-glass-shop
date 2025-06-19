// Preloader js    
$(window).on('load', function () {
  $('.preloader').fadeOut(100);
});

(function ($) {
  'use strict';

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  let currentUser = null;
  let currentUserId = null;
  let selectedChatCategory = null;
  let currentConversationId = null;
  // window.liveChatUserId will be removed by removing its assignments.

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

  // New UI elements for chat stages
  const chatLoginPrompt = $('#chat-login-prompt');
  const chatFacebookLoginButton = $('#chat-facebook-login-button');
  const chatTopicSelection = $('#chat-topic-selection');
  const chatTopicDropdown = $('#chat-topic-dropdown');
  const startChatButton = $('#start-chat-button');
  const liveChatMessages = $('#live-chat-messages'); // Existing, but usage changes
  const liveChatInputArea = $('#live-chat-input-area'); // Existing, but usage changes
  const liveChatInputField = $('#live-chat-input-field');
  const liveChatSendButton = $('#live-chat-send-button');
  const contactOptionsModalForChat = $('#contact-options');


  // Main click handler for "Live Chat" option from contact bubble
  if (liveChatOption.length) {
    liveChatOption.on('click', async function(e) {
      e.preventDefault();
      liveChatBox.show();
      contactOptionsModalForChat.hide();
      liveChatMessages.empty(); // Clear previous messages
      $('#chat-topic-dropdown').val(''); // Reset topic dropdown

      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        currentUser = null;
        currentUserId = null;
        selectedChatCategory = null;
        currentConversationId = null;
        chatLoginPrompt.show();
        chatTopicSelection.hide();
        liveChatMessages.hide();
        liveChatInputArea.hide();
      } else {
        currentUser = session.user;
        currentUserId = session.user.id;
        // Don't reset selectedChatCategory or currentConversationId here,
        // user might be reopening the chat.
        // History loading will need to be re-evaluated based on these.
        chatLoginPrompt.hide();
        chatTopicSelection.show();
        liveChatMessages.hide(); // Hide until topic is selected and chat started
        liveChatInputArea.hide();
      }
    });
  }

  // Facebook login button inside chat widget
  if (chatFacebookLoginButton.length) {
    chatFacebookLoginButton.on('click', function() {
      handleFacebookLogin(); // Assumes handleFacebookLogin is defined elsewhere and works
    });
  }

  async function loadChatHistory(userId, category, conversationId) {
    if (!liveChatMessages.length) return;
    liveChatMessages.html('<p class="text-muted">Loading history...</p>');

    if (!userId || !category || !conversationId) {
        liveChatMessages.html('<p class="text-danger">Could not load history: Missing user, category or conversation ID.</p>');
        return;
    }

    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
      console.error('Error getting Supabase session for history:', sessionError);
      liveChatMessages.html('<p class="text-danger">Authentication error. Could not load history.</p>');
      return;
    }
    const token = session.access_token;

    try {
      const queryParams = new URLSearchParams({ userId, category, conversationId });
      const response = await fetch(`/.netlify/functions/get-support-messages?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const history = await response.json();
        liveChatMessages.empty();
        if (history && history.length > 0) {
          history.forEach(msg => {
            let messageElement;
            // Ensure msg.message_content and msg.sender_type are the correct fields from your DB
            if (msg.sender_type === 'user') {
              messageElement = $(`<div class="message sent"><p>${escapeHTML(msg.message_content)}</p></div>`);
            } else if (msg.sender_type === 'admin' || msg.sender_type === 'staff') {
              messageElement = $(`<div class="message received"><small class="sender-name">${escapeHTML(msg.staff_name || 'Support')}:</small><p>${escapeHTML(msg.message_content)}</p></div>`);
            } else {
              console.warn("Unknown sender_type in history message:", msg.sender_type);
              messageElement = $(`<div><p>${escapeHTML(msg.message_content || 'Message content missing')}</p></div>`);
            }
            liveChatMessages.append(messageElement);
          });
        } else {
          liveChatMessages.html('<p class="text-muted">No previous messages for this topic.</p>');
        }
      } else {
        console.error('Error fetching chat history:', response.status, await response.text());
        liveChatMessages.html('<p class="text-danger">Could not load chat history.</p>');
      }
    } catch (err) {
      console.error('Exception fetching chat history:', err);
      liveChatMessages.html('<p class="text-danger">Error loading history.</p>');
    }
    liveChatMessages.scrollTop(liveChatMessages[0]?.scrollHeight || 0);
  }

  // Start Chat button after selecting topic
  if (startChatButton.length) {
    startChatButton.on('click', async function() {
      selectedChatCategory = chatTopicDropdown.val();
      if (!selectedChatCategory) {
        alert('Please select a topic to start the chat.');
        return;
      }
      currentConversationId = uuidv4(); // Generate a new conversation ID

      chatTopicSelection.hide();
      liveChatMessages.empty().show(); // Clear and show messages area
      liveChatInputArea.show();

      await loadChatHistory(currentUserId, selectedChatCategory, currentConversationId);

      // Setup Realtime Subscription
      if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel)
          .then(() => console.log('Unsubscribed from old realtime channel:', realtimeChannel.topic))
          .catch(err => console.error('Error unsubscribing from old realtime channel:', err));
        realtimeChannel = null;
      }

      const channelName = `conversation-${currentConversationId}`;
      realtimeChannel = supabaseClient.channel(channelName);

      realtimeChannel.on('broadcast', { event: 'new_support_message' }, (response) => {
        console.log('Received new_support_message broadcast:', response);
        const msg = response.payload;
        if (msg && msg.message && msg.sender_type) {
            let messageElement;
            // Note: message field from 'new_support_message' is assumed to be msg.message
            if (msg.sender_type === 'user') {
                messageElement = $(`<div class="message sent"><p>${escapeHTML(msg.message)}</p></div>`);
            } else if (msg.sender_type === 'admin' || msg.sender_type === 'staff') {
                const displayName = msg.staff_name || 'Support';
                messageElement = $(`<div class="message received"><small class="sender-name">${escapeHTML(displayName)}:</small><p>${escapeHTML(msg.message)}</p></div>`);
            } else {
                console.warn('Unknown sender_type in broadcast message:', msg.sender_type);
                messageElement = $(`<div><p>${escapeHTML(msg.message)}</p></div>`);
            }
            liveChatMessages.append(messageElement);
            liveChatMessages.scrollTop(liveChatMessages[0]?.scrollHeight || 0);
        } else {
            console.warn('Received broadcast message without text or sender_type:', msg);
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to Supabase Realtime channel:', channelName);
        } else if (err) {
          console.error(`Supabase Realtime channel (${channelName}) subscription error:`, err);
        } else {
          console.log('Supabase Realtime channel status:', status);
        }
      });

      console.log(`Chat started & subscribed: UserID: ${currentUserId}, Category: ${selectedChatCategory}, ConvID: ${currentConversationId}, Channel: ${channelName}`);
    });
  }

  // Close chat button
  if (closeChatBoxButton.length) {
    closeChatBoxButton.on('click', function() {
      liveChatBox.hide();
      // Consider unsubscribing from realtime channel if a conversation was active
      if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel)
          .then(() => console.log('Unsubscribed from chat channel on close:', realtimeChannel.topic))
          .catch(err => console.error('Error unsubscribing from chat channel on close:', err));
        realtimeChannel = null;
      }
      // Reset state variables if needed, or leave them for reopening
      // selectedChatCategory = null; // Optional: reset topic
      // currentConversationId = null; // Optional: reset conversation
    });
  }

  // Send button click
  if (liveChatSendButton.length) {
    liveChatSendButton.on('click', async function() { // Made async
      const messageText = liveChatInputField.val().trim();
      if (messageText && currentConversationId && currentUserId && selectedChatCategory) {
        liveChatInputField.val(''); // Clear input field

        // Optimistic rendering removed, server will broadcast back.

        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) {
            console.error('Error getting session for sending message:', sessionError);
            alert('Authentication error. Please try logging out and back in.');
            liveChatMessages.append($('<div class="message received"><p style="color: red;">Error: Authentication issue. Cannot send message.</p></div>'));
            liveChatMessages.scrollTop(liveChatMessages[0]?.scrollHeight || 0);
            liveChatInputField.val(messageText); // Re-add text to input
            return;
        }
        const token = session.access_token;

        $.ajax({
          url: '/.netlify/functions/send-support-message', // NEW ENDPOINT
          type: 'POST',
          contentType: 'application/json',
          beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          },
          data: JSON.stringify({
            // userId is derived from token on backend, but can be sent for logging/consistency if desired.
            // For now, relying on backend to use authenticated user from token.
            category: selectedChatCategory,
            message_content: messageText, // Corrected field name
            conversationId: currentConversationId
          }),
          success: function(response) {
            console.log('Message sent to new backend:', response);
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.error('Error sending message to new backend:', textStatus, errorThrown, jqXHR.responseText);
            // Re-add message to input or show error. For now, just log.
            liveChatInputField.val(messageText); // Optional: re-add if send fails
            const errorElement = $('<div class="message received"><p style="color: red;">Error: Could not send message. Server said: ' + (jqXHR.responseJSON?.message || jqXHR.responseText || 'Unknown error') + '</p></div>');
            liveChatMessages.append(errorElement);
            liveChatMessages.scrollTop(liveChatMessages[0]?.scrollHeight || 0);
          }
        });
      } else if (!currentConversationId) {
          alert("Please start a new chat session by selecting a topic.");
      } else if (!messageText) {
          // User tried to send empty message, do nothing or give subtle feedback
      }
    });
  }

  // Optional: Allow sending with Enter key (ensure it only works when chat is active)
  if (liveChatInputField.length) {
    liveChatInputField.on('keypress', function(e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        if (currentConversationId && currentUserId && selectedChatCategory) { // Check if chat is active
            liveChatSendButton.click();
        }
      }
    });
  }


  // --- Supabase Auth ---

  // Handle Facebook Login (assuming this function exists and works)
  async function handleFacebookLogin() {
    if (!supabaseClient) {
      console.error("Supabase client is not initialized. Cannot log in.");
      return;
    }
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'facebook' // This should match your Supabase provider key
      });
      if (error) {
        console.error("Error during Facebook login:", error.message);
        alert("Error during Facebook login: " + error.message);
      } else {
        console.log("Redirecting to Facebook for login...", data);
      }
    } catch (e) {
      console.error("Exception during Facebook login:", e);
      alert("An unexpected error occurred during Facebook login.");
    }
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session);
      const chatBoxIsVisible = liveChatBox && liveChatBox.is(':visible');

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        currentUser = session ? session.user : null;
        currentUserId = session ? session.user.id : null;

        if (chatBoxIsVisible) {
          if (currentUser) {
            chatLoginPrompt.hide();
            chatTopicSelection.show();
            // Reset other elements as user might be re-logging or session refreshed
            liveChatMessages.empty().hide();
            liveChatInputArea.hide();
            chatTopicDropdown.val(''); // Reset topic dropdown
            selectedChatCategory = null;
            currentConversationId = null;
            if (realtimeChannel) { // Unsubscribe from any old channel
                supabaseClient.removeChannel(realtimeChannel).catch(console.error);
                realtimeChannel = null;
            }
          } else { // Should not happen if event is SIGNED_IN but good practice
            chatLoginPrompt.show();
            chatTopicSelection.hide();
            liveChatMessages.hide();
            liveChatInputArea.hide();
          }
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentUserId = null;
        selectedChatCategory = null;
        currentConversationId = null;

        if (chatBoxIsVisible) {
          chatLoginPrompt.show();
          chatTopicSelection.hide();
          liveChatMessages.hide().empty();
          liveChatInputArea.hide();
          chatTopicDropdown.val('');
        }
        if (realtimeChannel) {
          supabaseClient.removeChannel(realtimeChannel)
            .then(() => console.log('Unsubscribed from channel on logout:', realtimeChannel.topic))
            .catch(err => console.error('Error unsubscribing from channel on logout:', err));
          realtimeChannel = null;
        }
      }
      // Update general UI (like main login/logout buttons outside chat)
      const mainFacebookLoginButton = $('#facebook-login-button'); // Assuming this is the ID of the main page login
      const mainLogoutButton = $('#logout-button'); // Assuming this is the ID of the main page logout
      const userInfoDisplay = $('#user-info'); // Assuming this is the ID for user info display

      if (currentUser) {
        if (mainFacebookLoginButton.length) mainFacebookLoginButton.hide();
        if (mainLogoutButton.length) {
          mainLogoutButton.show();
          mainLogoutButton.off('click').on('click', async () => { // Ensure event handler is not duplicated
            if (supabaseClient) await supabaseClient.auth.signOut();
          });
        }
        if (userInfoDisplay.length) {
          const displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email;
          userInfoDisplay.text(`Logged in as: ${escapeHTML(displayName)}`).show();
        }
      } else {
        if (mainFacebookLoginButton.length) mainFacebookLoginButton.show();
        if (mainLogoutButton.length) mainLogoutButton.hide();
        if (userInfoDisplay.length) userInfoDisplay.empty().hide();
      }
    });
  }

  // Initial check for session to set general UI state (main login/logout buttons)
  // This is implicitly handled by onAuthStateChange's INITIAL_SESSION event.
  // However, if there are UI elements outside the chatbox that depend on auth state
  // and need immediate update on page load, an explicit getSession() might be needed here.
  // For now, we rely on onAuthStateChange.

  // Ensure #live-chat-option is available for users not logged in initially
  // The old updateChatAvailability logic is now integrated into onAuthStateChange
  // and the liveChatOption click handler.
  // The chat option itself (#live-chat-option) should always be visible.
  // Its behavior (what it shows inside the chatbox) is controlled by auth state.

})(jQuery);

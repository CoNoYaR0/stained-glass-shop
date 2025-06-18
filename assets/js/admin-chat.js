document.addEventListener('DOMContentLoaded', () => {
    const userIdInput = document.getElementById('userIdInput');
    const loadConversationBtn = document.getElementById('loadConversationBtn');
    const chatMessagesDiv = document.getElementById('chatMessages');
    const currentChatUserIdSpan = document.getElementById('currentChatUserId_elem');
    const replySection = document.getElementById('replySection');
    const replyMessageInput = document.getElementById('replyMessageInput');
    const sendReplyBtn = document.getElementById('sendReplyBtn');
    const replyStatusDiv = document.getElementById('replyStatus');

    // Auth UI Elements
    const loginSection = document.getElementById('admin-login-section');
    const loginForm = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email-input');
    const passwordInput = document.getElementById('admin-password-input');
    // const loginButton = document.getElementById('admin-login-button'); // Covered by form submit
    const logoutButton = document.getElementById('admin-logout-button');
    const loginErrorDiv = document.getElementById('admin-login-error');
    const chatInterface = document.getElementById('admin-chat-interface');
    const adminSectionDivider = document.getElementById('admin-section-divider');

    console.log('Admin Chat DOM Elements Check:', { userIdInput, loadConversationBtn, chatMessagesDiv, currentChatUserIdSpan, replySection, replyMessageInput, sendReplyBtn, replyStatusDiv, loginSection, loginForm, logoutButton, chatInterface });

    if (!window.supabaseClient) {
        console.error("Supabase client (window.supabaseClient) is not available. Admin chat functionality will be impaired.");
        if (loginSection) loginSection.innerHTML = '<p class="text-danger">Critical Error: Supabase client script not loaded. Admin area cannot function.</p>';
        if (chatInterface) chatInterface.style.display = 'none';
        // Disable other UI elements if necessary, though the login form itself depends on Supabase client too.
        return; // Stop further execution
    }

    const supabase = window.supabaseClient; // Shortcut
    let currentLoadedUserId = null;

    // Function to update UI based on auth state
    function updateAdminUI(isLoggedIn, user = null) {
        if (isLoggedIn) {
            if (loginSection) loginSection.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'block';
            if (chatInterface) chatInterface.style.display = 'block';
            if (adminSectionDivider) adminSectionDivider.style.display = 'block';
            console.log("Staff logged in:", user ? user.email : 'Unknown user');
            // Enable chat controls that might have been disabled
            if (loadConversationBtn) loadConversationBtn.disabled = false;
            if (sendReplyBtn) sendReplyBtn.disabled = false;
            if (userIdInput) userIdInput.disabled = false;
            if (replyMessageInput) replyMessageInput.disabled = false;

        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'none';
            if (chatInterface) chatInterface.style.display = 'none';
            if (adminSectionDivider) adminSectionDivider.style.display = 'none';
            if (loginErrorDiv) loginErrorDiv.textContent = ''; // Clear any previous errors
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
            console.log("Staff logged out or no session.");
            // Disable chat controls as user is not logged in
            if (loadConversationBtn) loadConversationBtn.disabled = true;
            if (sendReplyBtn) sendReplyBtn.disabled = true;
            if (userIdInput) userIdInput.disabled = true;
            if (replyMessageInput) replyMessageInput.disabled = true;
            if (currentChatUserIdSpan) currentChatUserIdSpan.textContent = '-';
            if (chatMessagesDiv) chatMessagesDiv.innerHTML = '<p class="text-muted">Please log in to manage chats.</p>';
            if (replySection) replySection.style.display = 'none';
            currentLoadedUserId = null;
        }
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!emailInput || !passwordInput || !loginErrorDiv) return;
            const email = emailInput.value;
            const password = passwordInput.value;
            loginErrorDiv.textContent = ''; // Clear previous errors

            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    console.error('Login error:', error.message);
                    loginErrorDiv.textContent = `Login failed: ${error.message}`;
                } else {
                    // onAuthStateChange will handle UI update
                    console.log('Login submitted, waiting for auth state change...');
                }
            } catch (err) {
                console.error('Login exception:', err);
                loginErrorDiv.textContent = 'An unexpected error occurred during login.';
            }
        });
    }

    // Handle Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Logout error:', error.message);
                    if (loginErrorDiv) loginErrorDiv.textContent = `Logout failed: ${error.message}`;
                    else alert(`Logout failed: ${error.message}`);
                } else {
                    // onAuthStateChange will handle UI update
                    console.log('Logout successful.');
                }
            } catch (err) {
                console.error('Logout exception:', err);
                if (loginErrorDiv) loginErrorDiv.textContent = 'An unexpected error occurred during logout.';
                else alert('An unexpected error occurred during logout.');
            }
        });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Admin auth state changed:', event, session);
        if (event === 'SIGNED_IN' && session) {
            updateAdminUI(true, session.user);
        } else if (event === 'SIGNED_OUT') {
            updateAdminUI(false, null);
        }
        // Other events like PASSWORD_RECOVERY, USER_UPDATED, TOKEN_REFRESHED can be handled if needed
    });

    // Initial check for session on page load
    // Wrap in a function to call after DOM is ready and supabase client is confirmed
    async function checkInitialSession() {
        if (!supabase) { // Should be caught by earlier check, but good for safety
            updateAdminUI(false);
            return;
        }
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting initial session:", error);
                updateAdminUI(false);
            } else if (session) {
                console.log("Found active session on page load:", session);
                updateAdminUI(true, session.user);
            } else {
                updateAdminUI(false);
            }
        } catch (e) {
            console.error("Exception during initial session check:", e);
            updateAdminUI(false);
        }
    }
    checkInitialSession(); // Call it to set initial UI state

    // Function to display messages in the chat area
    function displayMessages(messages) {
        if (!chatMessagesDiv) {
            console.error("chatMessagesDiv is null. Cannot display messages.");
            return;
        }
        chatMessagesDiv.innerHTML = ''; // Clear previous messages
        if (!messages || messages.length === 0) {
            chatMessagesDiv.innerHTML = '<p class="text-muted">No messages found for this user or conversation not loaded.</p>';
            return;
        }

        messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.classList.add('mb-2', 'p-2', 'rounded');

            const senderPrefix = msg.sender_type === 'user' ? `User (${msg.user_id.substring(0, 8)}...)` : (msg.staff_name || 'Staff');

            messageEl.innerHTML = `
                <small class="text-muted">${new Date(msg.timestamp).toLocaleString()}</small><br>
                <strong>${senderPrefix}:</strong> ${escapeHTML(msg.message_content)}
            `;

            if (msg.sender_type === 'user') {
                messageEl.classList.add('bg-light', 'text-dark'); // User messages
                messageEl.style.textAlign = 'left';
                messageEl.style.marginLeft = '0';
                messageEl.style.marginRight = 'auto';
            } else { // staff
                messageEl.classList.add('bg-primary', 'text-white'); // Staff messages
                messageEl.style.textAlign = 'right';
                messageEl.style.marginLeft = 'auto';
                messageEl.style.marginRight = '0';
            }
            messageEl.style.maxWidth = '80%';
            messageEl.style.display = 'block';


            chatMessagesDiv.appendChild(messageEl);
        });
        if (chatMessagesDiv) { // Check before using scrollHeight
            chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll to bottom
        }
    }

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


    // Load conversation history
    loadConversationBtn.addEventListener('click', async () => {
        const userIdToLoad = userIdInput.value.trim();
        if (!userIdToLoad) {
            alert('Please enter a User ID.');
            return;
        }

        if (currentChatUserIdSpan) {
            currentChatUserIdSpan.textContent = userIdToLoad.substring(0,15) + "...";
        } else {
            console.error('currentChatUserIdSpan is null, cannot set User ID text.');
        }

        if (chatMessagesDiv) {
            chatMessagesDiv.innerHTML = '<p class="text-muted">Loading messages...</p>';
        } else {
            console.error('chatMessagesDiv is null. Cannot show "Loading messages..."');
        }

        if (replyStatusDiv) {
            replyStatusDiv.textContent = '';
        }

        if(replySection) { // Also check replySection before modifying its style
            replySection.style.display = 'none';
        }

        try {
            const currentUser = window.netlifyIdentity && window.netlifyIdentity.currentUser();
            let headers = { 'Content-Type': 'application/json' }; // Though GET usually doesn't need Content-Type for body
            if (currentUser && currentUser.token && currentUser.token.access_token) {
                headers['Authorization'] = `Bearer ${currentUser.token.access_token}`;
            } else {
                console.warn('User not logged in or token not available for get-chat-history call.');
                // Optionally, redirect to login or show a more explicit login message
                // For now, the function call will likely fail with 401 if token is missing and function expects it.
            }

            const response = await fetch(`/.netlify/functions/get-chat-history?userId=${encodeURIComponent(userIdToLoad)}`, {
                method: 'GET', // Explicitly GET
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to load messages. Please ensure you are logged in as an admin and the User ID is correct.' }));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const messages = await response.json();
            displayMessages(messages);
            currentLoadedUserId = userIdToLoad;
            if(replySection) { // Check replySection
                replySection.style.display = 'block'; // Show reply section
            }
            if(replyMessageInput) { // Check replyMessageInput
                replyMessageInput.value = ''; // Clear previous reply
            }

        } catch (error) {
            console.error('Error loading conversation:', error);
            if (chatMessagesDiv) {
                chatMessagesDiv.innerHTML = `<p class="text-danger">Error: ${escapeHTML(error.message)}</p>`;
            } else {
                console.error('chatMessagesDiv is null. Cannot display error message in chat area.');
            }
            if (currentChatUserIdSpan) {
                currentChatUserIdSpan.textContent = '-';
            } else {
                console.error('currentChatUserIdSpan is null, cannot reset User ID text in error handler.');
            }
            currentLoadedUserId = null;
        }
    });

    // Send reply
    sendReplyBtn.addEventListener('click', async () => {
        const replyText = replyMessageInput.value.trim();

        if (!window.supabaseClient) {
            console.error("Supabase client is not available. Cannot send reply.");
            if (replyStatusDiv) {
                replyStatusDiv.textContent = 'Error: Supabase client not loaded. Please refresh.';
                replyStatusDiv.className = 'mt-2 text-danger';
            } else {
                alert('Error: Supabase client not loaded. Please refresh.');
            }
            return;
        }

        if (!currentLoadedUserId) {
            if (replyStatusDiv) {
                replyStatusDiv.textContent = 'Error: No user conversation loaded.';
                replyStatusDiv.className = 'mt-2 text-danger';
            } else {
                console.error('replyStatusDiv is null when trying to report no user loaded.');
            }
            return;
        }
        if (!replyText) {
            if (replyStatusDiv) {
                replyStatusDiv.textContent = 'Error: Reply message cannot be empty.';
                replyStatusDiv.className = 'mt-2 text-danger';
            } else {
                console.error('replyStatusDiv is null when trying to report reply empty.');
                alert('Error: Reply message cannot be empty. (UI status element not found)');
            }
            return;
        }

        if (replyStatusDiv) {
            replyStatusDiv.textContent = 'Sending reply...';
            replyStatusDiv.className = 'mt-2 text-info';
        }
        sendReplyBtn.disabled = true;

        try {
            const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

            if (sessionError || !session) {
                console.error('Error getting Supabase session or no session found:', sessionError);
                if (replyStatusDiv) {
                    replyStatusDiv.textContent = 'Error: You are not logged in or session expired. Please log in again.';
                    replyStatusDiv.className = 'mt-2 text-danger';
                } else {
                    alert('Error: You are not logged in or session expired. Please log in again.');
                }
                // Potentially redirect to login page or show a login modal
                sendReplyBtn.disabled = false;
                return;
            }
            const token = session.access_token;

            const response = await fetch('/.netlify/functions/send-staff-reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: currentLoadedUserId, // This is the client's user ID
                    message_content: replyText
                    // senderName is removed, backend will use authenticated staff's name
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to send reply. Check server logs.' }));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            if (replyStatusDiv) {
                replyStatusDiv.textContent = `Reply sent successfully!`;
                if (responseData.data && responseData.data.id) {
                     replyStatusDiv.textContent += ` (Msg ID: ${responseData.data.id})`;
                }
                replyStatusDiv.className = 'mt-2 text-success';
            }
            if (replyMessageInput) {
                replyMessageInput.value = ''; // Clear reply input
            }

            // Optimistically add sent message to UI
            // The actual staff_name will be set by the backend; "Staff (You)" is a placeholder.
            const staffNameToDisplay = responseData.data?.staff_name || "Staff (You)";
            const newMessage = {
                user_id: currentLoadedUserId, // This is the client's user_id
                message_content: replyText,
                sender_type: 'staff',
                staff_name: staffNameToDisplay,
                timestamp: responseData.data?.created_at || new Date().toISOString()
            };

            const messageEl = document.createElement('div');
            messageEl.classList.add('mb-2', 'p-2', 'rounded', 'bg-primary', 'text-white');
            messageEl.style.textAlign = 'right';
            messageEl.style.marginLeft = 'auto';
            messageEl.style.marginRight = '0';
            messageEl.style.maxWidth = '80%';
            messageEl.style.display = 'block';
            messageEl.innerHTML = `
               <small class="text-muted">${new Date(newMessage.timestamp).toLocaleString()}</small><br>
               <strong>${escapeHTML(newMessage.staff_name)}:</strong> ${escapeHTML(newMessage.message_content)}
           `;
            if (chatMessagesDiv) {
                chatMessagesDiv.appendChild(messageEl);
                chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
            } else {
                console.error("chatMessagesDiv is null, cannot append sent message optimistically.");
            }

        } catch (error) {
            console.error('Error sending reply:', error);
            if (replyStatusDiv) {
                replyStatusDiv.textContent = `Error: ${escapeHTML(error.message)}`;
                replyStatusDiv.className = 'mt-2 text-danger';
            } else {
                alert(`Error sending reply: ${escapeHTML(error.message)} (UI status element not found)`);
            }
        } finally {
            sendReplyBtn.disabled = false;
        }
    });
});

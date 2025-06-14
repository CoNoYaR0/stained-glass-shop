document.addEventListener('DOMContentLoaded', () => {
    const userIdInput = document.getElementById('userIdInput');
    const loadConversationBtn = document.getElementById('loadConversationBtn');
    const chatMessagesDiv = document.getElementById('chatMessages');
    const currentChatUserIdSpan = document.getElementById('currentChatUserId_elem');
    const replySection = document.getElementById('replySection');
    const replyMessageInput = document.getElementById('replyMessageInput');
    const sendReplyBtn = document.getElementById('sendReplyBtn');
    const replyStatusDiv = document.getElementById('replyStatus');

    // The variable name currentChatUserIdSpan is kept, but it now points to getElementById('currentChatUserId_elem')
    // The log object below will correctly show the variable currentChatUserIdSpan and its resolved value.
    console.log('Admin Chat DOM Elements Check:', { userIdInput, loadConversationBtn, chatMessagesDiv, currentChatUserIdSpan, replySection, replyMessageInput, sendReplyBtn, replyStatusDiv });

    let currentLoadedUserId = null;

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
            // Netlify Identity token is automatically sent by the browser if user is logged in.
            // The get-chat-history function will verify it.
            const response = await fetch(`/.netlify/functions/get-chat-history?userId=${encodeURIComponent(userIdToLoad)}`);

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
        if (!currentLoadedUserId) {
            if (replyStatusDiv) {
                replyStatusDiv.textContent = 'Error: No user conversation loaded.';
                replyStatusDiv.className = 'mt-2 text-danger';
            } else {
                console.error('replyStatusDiv is null when trying to report no user loaded.');
                // Optionally, alert('Error: No user conversation loaded. Status display element missing.');
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
        } else {
            console.error('replyStatusDiv is null. Cannot show "Sending reply..." status.');
        }
        sendReplyBtn.disabled = true;

        try {
            // Again, Netlify Identity token is auto-sent.
            // The discord-bot-relay function doesn't strictly need to verify it if we assume
            // only admins can access this page, but it could be an added layer.
            // For now, discord-bot-relay primarily cares about userId and message.
            const response = await fetch('/.netlify/functions/discord-bot-relay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentLoadedUserId,
                    message: replyText,
                    senderName: 'Staff Admin' // Or get logged-in admin name if available via Netlify Identity JS API
                }),
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: 'Failed to send reply.' }));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            if (replyStatusDiv) {
                replyStatusDiv.textContent = `Reply sent successfully! (${responseData.message})`;
                replyStatusDiv.className = 'mt-2 text-success';
            }
            if(replyMessageInput) { // Check replyMessageInput
                replyMessageInput.value = ''; // Clear reply input
            }

            // Optimistically add sent message to UI - this part doesn't fetch new history
            // A more robust solution would re-fetch or wait for Supabase RT update if admin panel also listens
             const newMessage = {
                user_id: currentLoadedUserId,
                message_content: replyText,
                sender_type: 'staff',
                staff_name: 'Staff Admin', // Consistent with what was sent
                timestamp: new Date().toISOString()
            };
            // This is a simplified way to update the UI. Ideally, you'd have a shared message array.
            const messagesContainer = document.getElementById('chatMessages');
            const currentMessagesHTML = messagesContainer.innerHTML; // Get current messages
            messagesContainer.innerHTML = ''; // Clear
            displayMessages([{...newMessage}]); // Display the new message
            // Re-append old messages if needed or re-fetch. For simplicity, this just shows the last one.
            // A better approach: fetch a single new message and append, or re-fetch all.
            // For now, let's just add it to the current view without fetching all again:
             const tempMsgArray = []; // Create a dummy array
             const messageEl = document.createElement('div');
             messageEl.classList.add('mb-2', 'p-2', 'rounded', 'bg-primary', 'text-white');
             messageEl.style.textAlign = 'right';
             messageEl.style.marginLeft = 'auto';
             messageEl.style.marginRight = '0';
             messageEl.style.maxWidth = '80%';
             messageEl.style.display = 'block';
             messageEl.innerHTML = `
                <small class="text-muted">${new Date(newMessage.timestamp).toLocaleString()}</small><br>
                <strong>${newMessage.staff_name}:</strong> ${escapeHTML(newMessage.message_content)}
            `;
            if (chatMessagesDiv) { // Check chatMessagesDiv too
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

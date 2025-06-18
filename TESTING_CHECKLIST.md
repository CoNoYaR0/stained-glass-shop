# Live Chat System Testing Checklist

## 1. User-Side Testing Scenarios

### Facebook Login/Logout
- [ ] **Login Initiation:** User can click the 'Login with Facebook' button.
- [ ] **Facebook Redirection:** User is redirected to Facebook for authentication.
- [ ] **Return to Site:** After successful Facebook authentication, user is redirected back to the original site.
- [ ] **`liveChatUserId` Set:** `window.liveChatUserId` is correctly set in the browser console (should be Facebook username if available, otherwise Supabase User ID).
- [ ] **UI Update (Logged In):**
    - [ ] 'Logout' button is visible.
    - [ ] User information (if displayed, e.g., name/email) is correct.
    - [ ] 'Login with Facebook' button is hidden.
- [ ] **Chat Availability (Logged In):** Live chat option/button becomes enabled and visible.
- [ ] **Logout Functionality:** User can click the 'Logout' button.
    - [ ] UI reverts to the logged-out state (e.g., 'Login with Facebook' button visible, 'Logout' button hidden).
    - [ ] `window.liveChatUserId` is cleared/nulled (verify via console).
    - [ ] Live chat option becomes disabled or hidden.

### Sending Chat Messages (as User)
- [ ] **Open Chat Widget:** Logged-in user can successfully open or access the chat widget/interface.
- [ ] **Input Activation:** Chat input field and send button are active and usable.
- [ ] **Send Message:** User types a message and clicks 'Send'.
- [ ] **Optimistic UI Update:** Sent message appears in the user's chat window immediately.
- [ ] **Supabase Record:**
    - [ ] Message is recorded in the `live_chat_messages` table in Supabase.
    - [ ] Record contains the correct `user_id` (matching `window.liveChatUserId`).
    - [ ] Record contains the correct `message_content`.
    - [ ] Record has `sender_type = 'user'`.
- [ ] **Discord Forwarding:** Message is forwarded to the configured Discord channel, and the notification includes the user's `user_id`.

### Receiving Staff Replies (as User)
- [ ] **Real-time Reception:** When a staff member sends a reply to this user (see Staff-Side Scenarios), the message appears in the user's active chat window in real-time without needing a page refresh.
- [ ] **Message Attribution:** The received message is clearly attributed to 'Staff' or the specific staff member's name (if implemented).

## 2. Staff-Side Testing Scenarios (Admin Area: `/admin/live-chat/`)

### Admin Login/Logout
- [ ] **Initial State (Logged Out):**
    - [ ] Navigate to the admin chat page (e.g., `/admin/live-chat/`).
    - [ ] The staff login form (email/password) is displayed.
    - [ ] The main admin chat interface (conversation view, reply box) is hidden or disabled.
    - [ ] Logout button is hidden.
- [ ] **Valid Login:**
    - [ ] Staff enters valid pre-configured staff credentials (email/password).
    - [ ] Staff clicks the 'Login' button.
    - [ ] Login form is hidden.
    - [ ] Main admin chat interface becomes visible and enabled.
    - [ ] 'Logout' button becomes visible.
- [ ] **Logout Functionality:**
    - [ ] Staff clicks the 'Logout' button.
    - [ ] UI reverts to the logged-out state (login form visible, chat interface hidden).

### Access Control
- [ ] **Unauthorized Access Attempt:** Attempt to interact with admin chat features (e.g., loading conversations, sending replies) without being logged in. These actions should be blocked, or the UI elements should be non-functional. (Verify that API calls are not made or are rejected if attempted).

### Loading Chat History
- [ ] **Enter Client User ID:** Staff member enters a known client `user_id` (obtained from a user-side test, e.g., `window.liveChatUserId` value for a test user) into the designated input field.
- [ ] **Load Conversation:** Staff clicks the 'Load Conversation' button.
- [ ] **Display Messages:**
    - [ ] Messages for the specified client `user_id` are displayed in the chat history area.
    - [ ] Messages show correct content.
    - [ ] Messages correctly attribute sender (user vs. staff).
    - [ ] Messages are displayed in chronological order.

### Sending Replies (as Staff)
- [ ] **Activate Reply Interface:** After successfully loading a client's conversation, the reply input field and send button are active.
- [ ] **Send Reply:** Staff types a reply message and clicks 'Send Reply'.
- [ ] **Optimistic UI Update (Admin):** The sent reply appears in the admin chat window immediately.
- [ ] **Supabase Record (Staff Reply):**
    - [ ] Reply is recorded in the `live_chat_messages` table in Supabase.
    - [ ] Record contains the correct `user_id` (matching the currently loaded client's `user_id`).
    - [ ] Record contains the correct `message_content` (the staff's reply).
    * [ ] Record has `sender_type = 'staff'`.
    * [ ] Record has `staff_name` correctly populated (derived from the authenticated staff member's Supabase user details).
- [ ] **Client Receives Message:** (Covered by User-Side Scenario "Receiving Staff Replies") Verify the client user receives this message in real-time.

## 3. Cross-Cutting Concerns

### User Identification Consistency
- [ ] **End-to-End Check:** Throughout all user and staff testing, periodically verify that the `user_id` (Facebook username or Supabase User ID for clients) is consistent across:
    - `window.liveChatUserId` in the client's browser.
    - `user_id` field in the `live_chat_messages` table in Supabase for both user and staff messages related to that user's conversation.
    - `user_id` mentioned in Discord notifications for user messages.
    - `user_id` used by admin panel to load and send messages.

### Error Handling
- [ ] **Invalid Facebook Login:**
    - [ ] User cancels Facebook login process.
    - [ ] User provides invalid credentials to Facebook (if possible to simulate).
    - [ ] Site handles redirection gracefully, user remains in logged-out state.
- [ ] **Invalid Staff Login:**
    - [ ] Staff enters incorrect email or password.
    - [ ] An appropriate error message is displayed on the admin login form.
    - [ ] Staff remains in logged-out state.
- [ ] **Network Issues (Simulated):**
    - [ ] (If possible to simulate, e.g., using browser dev tools) Attempt to send a message (user or staff) when network connectivity is temporarily lost.
    - [ ] Observe client-side error handling (e.g., message indicating failure, send button disabled temporarily).
    - [ ] Verify behavior when network connectivity is restored.

### Real-time Connection Stability
- [ ] **Message Delivery:** Ensure messages (both user-to-staff and staff-to-user) are delivered promptly without significant delays.
- [ ] **Missed Messages:** During extended testing, if any messages appear to be missed, note the circumstances and investigate potential issues with Supabase Realtime channel subscriptions or message broadcasting.

## 4. Environment Configuration Check (Pre-Testing Reminder)

- [ ] **Frontend Configuration (`window.APP_CONFIG`):**
    - [ ] Verify that `window.APP_CONFIG.SUPABASE_URL` is correctly populated in the site's HTML source for regular user pages.
    - [ ] Verify that `window.APP_CONFIG.SUPABASE_ANON_KEY` is correctly populated in the site's HTML source for regular user pages.
    - [ ] Verify that `window.APP_CONFIG.SUPABASE_URL` is correctly populated in the admin area's HTML source (e.g., `/admin/live-chat/`).
    - [ ] Verify that `window.APP_CONFIG.SUPABASE_ANON_KEY` is correctly populated in the admin area's HTML source.
- [ ] **Netlify Function Environment Variables:**
    - [ ] In Netlify deployment settings, confirm `SUPABASE_URL` is correctly set.
    - [ ] In Netlify deployment settings, confirm `SUPABASE_SERVICE_KEY` is correctly set (this is sensitive and should be the service_role key).
    - [ ] In Netlify deployment settings, confirm `DISCORD_WEBHOOK_URL` (for `live-chat` function) is correctly set.
    - [ ] (If applicable for other functions like `get-chat-history` if it had direct auth beyond Identity role check) Confirm any other necessary Supabase keys are set.

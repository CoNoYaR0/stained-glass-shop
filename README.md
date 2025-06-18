# Live Chat System Guide - StainedGlass.tn

Welcome to the live chat system for StainedGlass.tn! This guide explains how to use the chat features, whether you're a customer looking for help or a staff member managing conversations.

## For Our Valued Customers

Our live chat is designed to help you connect with us easily. Here’s how it works:

### 1. Logging In with Facebook
*   To start a chat, you'll need to log in using your Facebook account. Look for the **"Login with Facebook"** button, usually found in the website's header or menu.
*   Clicking this button will take you to Facebook to confirm your identity.
*   Once logged in, you'll be returned to our website. Your Facebook name might be displayed to show you're logged in.

### 2. Using the Live Chat Widget
*   After logging in, the **"Live Chat"** option (often found within a "Contact Us" floating button) will become active.
*   Click it to open the chat box.
*   Type your message in the input field and hit "Send" (or press Enter).
*   Your messages and replies from our staff will appear in this chat box in real-time.

### 3. How Your Information Is Used
*   We use your Facebook login to know who we're chatting with (e.g., your Facebook name helps us address you personally).
*   This makes it easier to track your conversation if you contact us again.
*   We only use the information needed for the chat (like your name) and don't store other sensitive Facebook data.

## For Staff & Administrators

The Admin Chat Panel allows you to communicate directly with customers.

### 1. Accessing the Admin Chat Panel
*   The panel is located at: `[Your Website URL]/admin/live-chat/`
    *   (Example: `https://stainedglass.tn/admin/live-chat/`)

### 2. Logging In (Staff)
*   You'll see a login form asking for your **Email** and **Password**.
*   These are your specific staff credentials managed in our Supabase system.
*   Enter your details and click "Login".

### 3. Managing Conversations
*   **Loading a User's Conversation:**
    *   When a user starts a chat, you might get a notification (e.g., on Discord) that includes their **User ID**. This User ID is typically their Facebook name or a unique identifier from their Facebook login.
    *   In the admin panel, there's a field to "Enter User ID". Type or paste the user's ID here.
    *   Click **"Load Conversation"**. The chat history with that user will appear.
*   **Sending Replies:**
    *   Once a conversation is loaded, a reply box will appear below the chat history.
    *   Type your message and click **"Send Reply"**.
    *   The user will receive your message in their chat widget on the website in real-time.
*   **Viewing Messages:**
    *   User messages are typically shown on one side, and your (staff) replies on the other, with timestamps.

### 4. Logging Out (Staff)
*   When you're done, click the **"Logout"** button to securely end your admin session.

## Key System Features

*   **Real-Time Messaging:** Conversations happen live. Both users and staff see messages as they are sent.
*   **User Identification via Facebook:** Customers are identified by their Facebook profile information, making interactions personal and traceable.
*   **Staff Accounts:** Staff use dedicated email/password accounts (managed via Supabase) to access the admin chat panel.

## Basic Troubleshooting & Verification

*   **Customer Can't See Chat Option?**
    *   Ensure they have logged in with Facebook. The chat option usually only appears after login.
*   **Staff Can't Log In to Admin Panel?**
    *   Double-check your email and password.
    *   Ensure you are using your correct staff credentials.
*   **Messages Not Sending/Receiving?**
    *   For customers: Check your internet connection. Try sending the message again.
    *   For staff: Ensure you've loaded a conversation and have an active internet connection.
    *   If issues persist, a site administrator might need to check system configurations (see below).

---

*A Note for Technical Administrators:*
*If the chat system isn't behaving as expected (e.g., Supabase client errors, functions not triggering), please ensure that the necessary environment variables are correctly configured:*
    *   *Frontend (`window.APP_CONFIG` in HTML layouts): `SUPABASE_URL`, `SUPABASE_ANON_KEY`.*
    *   *Netlify Backend Functions: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DISCORD_WEBHOOK_URL`.*
*These are typically set in Netlify's site settings (for backend) and might be injected into Hugo's build process for the frontend.*

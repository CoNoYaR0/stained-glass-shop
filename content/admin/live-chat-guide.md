---
title: "Admin Live Chat Guide"
layout: "single" # Using a generic single page layout, can be customized later
menu: "admin" # Optional: if you have an admin menu
weight: 10
---

## Using the Admin Live Chat Panel

**Last Updated:** June 14, 2024 <!-- Update manually as needed -->

### 1. Overview

This guide explains how to view live chat history and reply to website visitors using the Admin Live Chat panel, typically found at `/admin/live-chat` on our website.

Replies sent from this panel will appear in the user's chat widget on the website and will also be saved in our chat history database. User messages will still generate notifications in the designated Discord channel (e.g., `#contact-live`).

### 2. Accessing the Admin Live Chat Panel

1.  Navigate to your website's admin live chat page (e.g., `https://your-website.com/admin/live-chat`).
2.  **Log In:** You will be prompted to log in. Use your company credentials managed via Netlify Identity. *(Specific login instructions depend on how Netlify Identity is configured - e.g., email/password, Google SSO, etc.)*

### 3. Handling a New Live Chat

1.  **Notification in Discord:** New live chat messages from website visitors will appear as notifications in the designated Discord channel (e.g., `#contact-live`).
2.  **Identify the `User ID`:** Each notification in Discord will include a unique `User ID` for the visitor. It will look something like this:
    `Live Chat (User ID: user-a1b2c3d4e): Hello, I need help!`
    **You must copy this `User ID` accurately.**

### 4. Viewing Conversation History and Replying

Once logged into the `/admin/live-chat` panel:

1.  **Enter User ID:** In the "Enter User ID" field on the admin panel, paste the `User ID` you copied from the Discord notification.
2.  **Load Conversation:** Click the "Load Conversation" button.
3.  **View History:** The conversation history with that user will appear in the main chat area.
    *   Messages from the user will typically be aligned to one side (e.g., left).
    *   Messages from staff (replies) will be aligned to the other side (e.g., right).
    *   Timestamps and sender information will be visible.
4.  **Type Your Reply:** In the "Send Reply" section (usually below the chat history), type your message in the provided textarea.
5.  **Send:** Click the "Send Reply" button.

### 5. After Sending a Reply

*   **Confirmation:** A status message should appear on the admin panel, like "Reply sent successfully!". Your sent reply will also optimistically appear in the chat history view.
*   **User Receives Reply:** The website visitor will receive your reply in their chat widget on the website in real-time.
*   **Database Record:** Your reply is also saved to the central chat history database.

### 6. Important Notes & Troubleshooting

*   **Accuracy of User ID:** Double-check the `User ID` when pasting. Replying to an incorrect or incomplete ID will result in your message not reaching the intended user.
*   **No Live Updates in Admin Panel (Currently):** If the user sends *another* message while you have their conversation open in the admin panel, it will *not* automatically appear in the currently viewed history. You would need to click "Load Conversation" again for that `User ID` to refresh the history. *(This is a known limitation of the current version and may be enhanced in the future).*
*   **Error Messages:** If you see an error message (e.g., "Failed to load messages," "Failed to send reply"), double-check the User ID and your internet connection. If issues persist, please report them.
*   **Logging Out:** Remember to log out of the admin panel when you are finished, if applicable (usually via the Netlify Identity widget or by closing your browser session).

---

*This guide should be kept up-to-date with any changes to the admin panel's functionality.*

# Developer README

This document provides instructions and guidelines for developers working on this project.

## Table of Contents
1. Introduction
2. Project Setup
3. Key Modules
4. Recent Refactors & Important Notes
   4.1. ...
   4.5. Authentication Unification & Netlify Identity Removal
5. Running the Project
6. Deployment
7. Style Guide
8. AI Tooling and Sandbox Limitations Encountered
!! IMPORTANT: Uncommitted Changes & Next Steps !!

---

## 4. Recent Refactors & Important Notes

### 4.5. Authentication Unification & Netlify Identity Removal:
*   Netlify Identity was previously used for admin role checking in `get-chat-history.js`.
*   This has now been fully refactored to use Supabase JWTs for staff authentication throughout the admin panel, simplifying the auth model.
    *   `assets/js/admin-chat.js` was updated to retrieve the Supabase session token and send it in the `Authorization` header when calling both `get-chat-history.js` and `send-staff-reply.js`.
    *   `netlify/functions/get-chat-history.js` was updated to validate these Supabase JWTs instead of relying on Netlify Identity context for authorization.
    *   The Netlify Identity widget script was removed from `layouts/partials/head.html`.

---

## 8. AI Tooling and Sandbox Limitations Encountered

Working with the AI agent and the provided sandbox environment has presented unique challenges and learning opportunities. This section documents some of them for future reference.

*   **Sequential File Operations:** The AI can only operate on one file at a time for modifications if not using complex diffs.
*   **No Direct Git Access:** The AI cannot directly run `git commit` or `git push`. Changes made by the AI are applied to the workspace but need to be manually reviewed and committed by a human.
*   **Dependency Installation:** While the AI can run `npm install` or `pip install`, it's important to verify that all necessary dependencies are correctly installed and versioned, especially if the AI has to restart or reset its environment.
*   **Understanding Existing Code:** The AI's understanding is based on the files it reads. For complex projects, it might require multiple steps to build a complete picture.
*   **Idempotency of Operations:** Ensure that operations, if retried, do not lead to unintended side effects (e.g., appending duplicate content). The use of `overwrite_file_with_block` is generally safer than multiple `replace_with_git_merge_diff` for whole-file content changes if care is taken.

This list is not exhaustive but highlights common areas to be mindful of when guiding the AI. The fixes applied in previous steps (related to Supabase auth and Netlify Identity removal) were successful despite these limitations, but careful review of AI-generated changes is always recommended.

---

## !! IMPORTANT: Uncommitted Changes & Next Steps !!

**The changes applied by the AI agent in the preceding steps have been written to the file system but ARE NOT YET COMMITTED to the Git repository.**

**Next Steps for Human Reviewer:**

1.  **Review All Changes:** Carefully diff the modified files (`netlify/functions/get-chat-history.js`, `assets/js/admin-chat.js`, `layouts/partials/head.html`, and this `DEV_README.md`) against the previous versions.
2.  **Test Thoroughly:**
    *   Verify admin login functionality using Supabase credentials.
    *   Confirm that chat history loads correctly for admins.
    *   Confirm that admins can send replies.
    *   Ensure no errors related to Netlify Identity appear in the console or affect site functionality.
3.  **Commit Changes:** Once satisfied, commit the changes with a clear and descriptive message. For example:

    ```bash
    git add netlify/functions/get-chat-history.js assets/js/admin-chat.js layouts/partials/head.html DEV_README.md
    git commit -m "Refactor: Unify admin auth to Supabase JWT, remove Netlify Identity"
    ```
4.  **Push and Deploy:** Follow your standard procedures to push the changes and deploy the updated site.

**Failure to review and commit these changes will result in the work being lost or not applied to your environments.** The general caution about committing AI-generated changes still applies; these specific fixes have been applied by the AI, but the responsibility for verification and committing lies with the human developer.

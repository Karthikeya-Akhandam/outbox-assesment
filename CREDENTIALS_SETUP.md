# Credentials Setup Guide

This guide explains how to obtain the necessary credentials to run the ReachInbox Email Job Scheduler.

## 1. Google OAuth 2.0 Client ID

To allow users to log in with Google, you need an OAuth 2.0 Client ID.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services** > **OAuth consent screen** and configure it (you can choose "External" for testing).
4. Go to **APIs & Services** > **Credentials**.
5. Click **Create Credentials** > **OAuth client ID**.
6. Select **Web application** as the application type.
7. Add the following to **Authorized redirect URIs**:
   - `http://localhost:3001/api/auth/google/callback` (adjust if your backend runs on a different port)
8. Click **Create**.
9. Copy the **Client ID** and **Client Secret** into your `backend/.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

## 2. Slack App & OAuth

To send rate-limit notifications to a user's Slack, you need a Slack App with incoming webhook permissions.

1. Go to [Slack API: Applications](https://api.slack.com/apps) and click **Create New App**.
2. Choose **From scratch**, name it (e.g., "ReachInbox Notifier"), and select your workspace.
3. Under **Features** in the sidebar, go to **OAuth & Permissions**.
4. In the **Redirect URLs** section, click **Add New Redirect URL** and enter:
   - `http://localhost:3001/api/slack/callback`
   - Click **Save URLs**.
5. Scroll down to **Scopes** > **User Token Scopes** (or Bot Token Scopes, depending on your implementation preference) and add the following scope:
   - `incoming-webhook` (This is required to post messages to the user's chosen channel).
6. Go back to the **Basic Information** page for your app (under Settings in the sidebar).
7. Scroll down to **App Credentials** and copy your **Client ID** and **Client Secret**.
8. Paste these into your `backend/.env` file:
   ```env
   SLACK_CLIENT_ID=your_slack_client_id_here
   SLACK_CLIENT_SECRET=your_slack_client_secret_here
   SLACK_REDIRECT_URI=http://localhost:3001/api/slack/callback
   ```

## 3. Ethereal Email (Fake SMTP)

1. Go to [Ethereal Email](https://ethereal.email/).
2. Click **Create Ethereal Account**.
3. Copy the generated Username and Password into your `backend/.env` file:
   ```env
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=your_ethereal_username
   SMTP_PASS=your_ethereal_password
   ```

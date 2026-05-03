<!-- prev: ../02-technical/criteria/containerization-deployment.md | next: features.md -->

# 3. User Guide

This section explains how an end user works with PlusDateApp. The application is intended primarily for Telegram Mini App usage on mobile devices.

## Contents

- [Features Walkthrough](features.md)
- [FAQ & Troubleshooting](faq.md)

## Getting Started

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Browser** | Current Telegram mobile webview or modern Chrome/Safari | Latest Telegram app and latest mobile OS browser engine |
| **Screen Resolution** | Mobile viewport supported by Telegram webview | Modern smartphone screen |
| **Internet** | Required | Stable mobile or Wi-Fi connection |
| **Device** | Mobile-first; desktop browser can be used for development | Telegram mobile app |

### Accessing the Application

1. Open the PlusDate Telegram bot or Mini App link.
2. Launch the Mini App from Telegram.
3. Allow Telegram to pass the Mini App initialization data.
4. Wait for the application to authenticate and load the current user.

For local development, start the backend and frontend from the commands in [Deployment & DevOps](../02-technical/deployment.md), then open the Vite URL in a browser or Telegram-compatible test environment.

### First Launch

#### Step 1: Telegram Login

1. The user opens the Mini App inside Telegram.
2. The frontend initializes Telegram webview behavior.
3. The frontend sends Telegram login data to the backend.
4. The backend returns the authenticated user state.

#### Step 2: Onboarding

1. Fill in basic profile data.
2. Select age and city.
3. Add interests and activity information.
4. Upload profile media.
5. Complete verification media if required.
6. Submit the profile for moderation.

#### Step 3: Moderation

After onboarding, the system checks media and profile state. If there is an unresolved moderation issue, the user is redirected to the moderation screen and cannot use the normal feed until the issue is resolved.

#### Step 4: Main Feed

After onboarding and moderation requirements are satisfied, the user is redirected to the feed. The footer navigation gives access to feed, likes, chats, and profile.

## Quick Start Guide

| Task | How To |
|------|--------|
| Create a profile | Open the Mini App, follow onboarding, add required fields and media. |
| Change search preferences | Open profile/preferences screens and update city, activity, interests, eye color, or other filters. |
| Browse profiles | Open Feed and swipe through profile cards. |
| Like someone | Use the like action on a feed card. |
| Respond to a like | Open Likes and accept or reject the incoming like. |
| Chat with a match | Open Chats, select a conversation, and send a message. |
| Buy premium | Open Premium and choose the available subscription/payment flow. |
| Delete account | Open Profile Settings and follow the delete account flow. |

## User Roles

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **Guest Telegram user** | Can open the Mini App and authenticate. | Limited until onboarding is complete |
| **Onboarded user** | Can edit profile, use feed, likes, matches, chat, and settings. | Standard |
| **Premium user** | Can use premium-facing functions and subscription benefits. | Extended |
| **Admin/moderator** | Can use admin endpoints such as bot profile creation and user deletion. | Operational |

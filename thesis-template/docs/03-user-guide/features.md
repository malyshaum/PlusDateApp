<!-- prev: index.md | next: faq.md -->

# Feature Walkthrough

## Feature 1: Onboarding and Profile Creation

### Overview

Onboarding collects the minimum data needed before a user appears in discovery: basic details, age, city, interests, media, and verification. The RouterGuard prevents users from skipping required steps.

### How to Use

**Step 1:** Open the Mini App from Telegram.

**Step 2:** Complete the basic profile screen.

**Step 3:** Select age and city.

**Step 4:** Choose interests and activity.

**Step 5:** Upload photos, video if available, and verification media.

**Expected Result:** The user profile is stored, onboarding status is updated, and the user moves to moderation or feed depending on profile state.

### Tips

- Use clear profile photos to reduce moderation issues.
- Complete search preferences early because the feed depends on them.

---

## Feature 2: Feed and Swiping

### Overview

The feed shows profile cards that match the user's preferences and excludes profiles that have already been swiped. Users can like, dislike, and revert selected actions when allowed.

### How to Use

**Step 1:** Open the Feed tab.

**Step 2:** Review the current profile card, photos, and profile details.

**Step 3:** Use the swipe actions to like or dislike.

**Step 4:** If a mutual like happens, the match flow appears and the chat can be opened.

**Expected Result:** The decision is stored by the backend and the next profile appears. If a match is created, the user receives match feedback.

---

## Feature 3: Likes and Matches

### Overview

The Likes page lets users review people who liked them and decide whether to respond. This connects discovery to chat creation.

### How to Use

**Step 1:** Open the Likes tab from the footer.

**Step 2:** Review the incoming like card.

**Step 3:** Accept the like to create a match or reject it to remove the candidate.

**Expected Result:** The backend stores the response and creates a match when both users like each other.

---

## Feature 4: Chat

### Overview

Chat is available for matched users. It includes chat list, message history, message sending, unread counts, and read state updates.

### How to Use

**Step 1:** Open the Chats tab.

**Step 2:** Select a conversation.

**Step 3:** Type a message and send it.

**Step 4:** Read incoming messages; read state updates are sent back to the backend.

**Expected Result:** Messages are stored in the database and real-time events update the other user's interface.

---

## Feature 5: Profile Editing and Preferences

### Overview

Users can update their public profile and search settings after onboarding. The frontend provides separate screens for editing city, age, height, eye color, interests, activity, and search preferences.

### How to Use

**Step 1:** Open the Profile tab.

**Step 2:** Choose the profile field or settings area to edit.

**Step 3:** Save the updated value.

**Expected Result:** The backend validates and stores the updated profile or preference data. The feed uses the new preferences on future requests.

---

## Feature 6: Premium and Payments

### Overview

Premium screens present paid features and connect to subscription endpoints. The backend supports current subscription, subscribe, cancel, Stripe Cashier, and Telegram invoice flows.

### How to Use

**Step 1:** Open the Premium page from the profile or action limit modal.

**Step 2:** Review premium benefits.

**Step 3:** Start the subscription or Telegram invoice flow.

**Expected Result:** The backend creates or updates subscription state and the frontend shows payment success or error feedback.

## Feature Comparison

| Feature | Standard User | Premium User |
|---------|---------------|--------------|
| Onboarding and profile editing | Available | Available |
| Feed and basic swipes | Available with limits | Extended or less restricted |
| Likes/matches | Available | Enhanced visibility depending on premium rules |
| Revert dislike | Limited or gated | Available where allowed |
| Advanced filters | Limited | Available where allowed |
| Chat after match | Available | Available |

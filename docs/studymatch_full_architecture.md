# Comprehensive PRD & Technical Architecture: StudyMatch (Working Title)

This document contains the complete Product Requirements Document (PRD) and Technical Architecture for a mobile application designed to connect university students for highly focused, in-person study sessions. It serves as a master prompt for AI assistants (like Claude) to initiate the development phase.

---

## 1. Product Overview & Core Philosophy
* **Concept:** An academic-first matchmaking app ("Study Tinder") focused on finding study partners for libraries or cafes during midterms, finals, or regular study sessions.
* **Core Hooks:**
  1. **Single-Tasking (Bottleneck):** Users can only chat with one person at a time to eliminate "ghosting" and force genuine interaction.
  2. **Progressive Disclosure:** Physical appearance (photos) is hidden initially. Matching is strictly based on academic profiles and current study goals.
  3. **Action-Oriented:** The end goal of a match is to set up a physical "Study Date" using a built-in interactive form.

---

## 2. Technology Stack
The stack is optimized for rapid Minimum Viable Product (MVP) development, seamless cross-platform deployment (especially for iOS without requiring a physical Mac initially), and unified type safety.

* **Frontend Framework:** React Native
* **Toolchain / Build System:** Expo (enables iOS testing via Expo Go and cloud builds via EAS)
* **Programming Language:** TypeScript (used across the entire stack for type safety)
* **Backend as a Service (BaaS):** Supabase
  * **Database:** PostgreSQL (Handles relational data: Users, Matches, Messages, Dates, Trust Scores)
  * **Authentication:** Supabase Auth (Magic Links / OTP)
  * **Realtime:** Supabase Realtime (WebSocket-based instant chat and screen-locking mechanism)
  * **Storage:** Supabase Storage (Secure bucket for profile pictures with blur/reveal logic)

---

## 3. User Registration & Authentication (Supabase Auth)
* **Exclusive Access:** Registration is strictly restricted to university email addresses (e.g., `*.edu.tr`). This is enforced via Supabase Auth triggers.
* **Passwordless Entry:** Uses OTP (One-Time Password) or Magic Links sent to the `.edu` email to reduce friction and eliminate password reset overhead.
* **Profile Setup:**
  * *Static Data:* Name, University, Department/Major, Grade/Year.
  * *Dynamic Status ("Today's Goal"):* A temporary text and tag combination indicating the current study objective (e.g., `#SilentStudy`, `#MidtermPrep`, `#CodingPractice`).

---

## 4. Discovery & Academic Matchmaking
* **The Academic Card:** The swipe interface does **not** show user photos. It displays:
  * University / Department / Year
  * Current Goal: *"Studying for Data Structures Midterm"*
  * Tags: `[#CodingPractice]`
  * Earned Badges: (e.g., Punctual, Silent & Focused)
* **Double Opt-in:** A match is formed only when both users swipe right on each other's academic profile.

---

## 5. Communication & The Lock System (Supabase Realtime)
This is the most critical feature to solve the "ghosting" problem prevalent in modern matching apps.

* **Single Active Chat:** Once a match occurs, the `matches` table is updated. Supabase Realtime instantly listens to this change and **locks the Discovery (Swipe) screen** for both users. They cannot view other profiles until the current loop is closed.
* **Progressive Disclosure (Photos):** * Initially, profile photos (fetched from Supabase Storage) are heavily blurred on the frontend.
  * The chat UI includes a "Reveal Profile" button. Only when *both* users press it, the blur effect is removed, revealing photos and detailed bios.
* **Anti-Ghosting / Unlocking Mechanisms:**
  * **Timeout:** If no message is exchanged within 12 hours, or 24 hours pass since the last message, an edge function or database cron job automatically drops the match status to `expired`, unlocking both users.
  * **Manual Termination:** A one-tap "End Match" button allows a user to politely exit the conversation (e.g., *"Your study partner has changed their focus. Good luck!"*), instantly unlocking the discovery screen.

---

## 6. Interactive Planning Module (The Study Date)
* **Joint Form:** Triggered inside the chat screen to plan the physical meetup.
  * *Location:* e.g., Central Library, Engineering Cafe.
  * *Time:* e.g., 14:00 - 17:00.
  * *Focus Subject:* e.g., Calculus II.
* **Approval Flow:** One user proposes, the other accepts or edits. Once both accept, the status changes to `scheduled`.
* **Homepage Widget:** The scheduled Study Date appears as a pinned widget on the app's home screen. Push notifications remind users as the time approaches.

---

## 7. Post-Date: Trust Score & Gamification
Instead of a manipulative 5-star system, the app uses a hidden Trust Score and public Badges, managed via PostgreSQL functions.

* **Hidden Trust Score (Starts at 100):**
  * Successful meeting: `+2 Points`
  * Last-minute cancel: `-10 Points`
  * No-show (Ghosting): `-25 Points`
* **Post-Date Survey (3 Quick Questions):**
  1. *Did the meeting happen?* (Yes/No - flags ghosting)
  2. *Was the environment productive?* (Highly Focused / Casual / Off-topic)
  3. *Award a Badge:* `[⏱️ Punctual]` `[🤫 Silent & Focused]` `[💡 Great Explainer]` `[☕ Good Break Buddy]`
* **Profile Display:** Only positive badges and their frequencies are shown publicly to encourage good behavior.

---

## 8. Moderation & Sanctions Algorithm
* **Reporting:** Users can report others for: Flirting/Off-topic, Harassment, Fake Profile, or No-Show.
* **Instant Action:** Reporting instantly terminates the match and blocks further communication.
* **Sanction Levels:**
  * *Soft Strike:* Warning notification for minor offenses or first-time no-shows.
  * *Shadowban:* If Trust Score drops below 60 or multiple "off-topic" reports occur, the user remains in the app but the algorithm hides their profile from the discovery pool.
  * *Hard Ban:* For severe harassment, the `.edu` email and device ID are permanently banned.

---

## 9. Database Schema Outline (Supabase PostgreSQL / TypeScript)

```typescript
// Users Table
interface User {
  id: string; // UUID from Supabase Auth
  email: string; // *.edu domain
  name: string;
  university: string;
  department: string;
  grade: number;
  trust_score: number; // Default: 100
  badges: Record<string, number>; // e.g., { "Punctual": 5 }
  current_goal_text: string;
  current_tags: string[];
  active_match_id: string | null; // Used for locking the swipe screen
  created_at: string;
}

// Matches Table (Handles the Bottleneck & Realtime Chat)
interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'active' | 'completed' | 'terminated' | 'expired';
  user1_revealed: boolean; // For progressive disclosure
  user2_revealed: boolean;
  created_at: string;
  updated_at: string; // Used for timeout logic
}

// Messages Table
interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// Study Dates Table
interface StudyDate {
  id: string;
  match_id: string;
  proposed_by: string;
  location: string;
  scheduled_time: string;
  focus_subject: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
}
```

---
*End of Document. The project is ready for UI/UX scaffolding in React Native/Expo and Database instantiation in Supabase.*
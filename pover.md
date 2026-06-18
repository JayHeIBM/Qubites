# Product Requirement Document (PRD): Cubits

## 1. Executive Summary & Objective
**Cubits** is an internal sustainability application designed to minimize corporate food waste. After lunch service, kitchen chefs log leftover food into a database. The system automatically runs a raffle to distribute the food for free to interested employees based on their stated preferences, notifying the winners via a Slack bot.

---

## 2. Target Audience & Personas
* **The Chefs / Kitchen Staff:** Need a quick, frictionless way to log leftover food quantities and types before it spoils.
* **The Employees:** Want a seamless way to opt into free lunch leftovers, select dietary preferences, and get instantly notified if they win.

---

## 3. Core Features & User Flow

### Phase 1 Scope (MVP)

#### 1. Inventory Logging (Chef Interface)
* A simple interface (web form or quick Slack command) for chefs to input surplus food items, estimated portions, and dietary tags (e.g., Vegetarian, Vegan, Gluten-Free).

#### 2. Employee Preferences & Opt-In
* Employees can set global preferences (e.g., "Notify me for vegetarian meals only").
* Employees enter a daily raffle pool to indicate they are available to pick up food *today*.

#### 3. The Raffle Engine
* An automated matching algorithm that triggers after the chef logs the food.
* Randomly selects winners from the active opt-in pool, matching employee preferences to the available food tags.

#### 4. Slack Bot Integration
* Pings raffle winners with a direct message (e.g., *"Congrats! You won a portion of [Food Item]. Please pick it up at the cafeteria by [Time]!"*).
* (Optional for MVP) Sends a general broadcast if there is remaining food after the raffle.

---

## 4. Tech Stack (Proposed)
* **Backend:** Node.js / Python (FastAPI or Flask) to handle raffle logic and API endpoints.
* **Database:** PostgreSQL or MongoDB to store user preferences, daily raffle entries, and food logs.
* **Communications:** Slack API (Webhooks / Bolt framework) for notifications and potential user commands.

---

## 5. Future Considerations / Backlog
* **Guilt-Free Analytics:** Dashboard showing how many pounds of food the company saved from the landfill.
* **Karma/Fairness System:** Adjust raffle odds so users who haven't won recently get higher priority over frequent winners.

---

### 🤖 Hand-off Note for Next Agent
> **Instructions for the AI:** You are collaborating on **Cubits**. Maintain this document as the single source of truth. When the user provides new feature requests, architectural choices, or feedback, update the relevant sections of this PRD and output the revised version. Always prioritize simplicity and a frictionless Slack-first user experience.
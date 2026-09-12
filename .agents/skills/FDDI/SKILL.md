---
name: feature-based-structure
description: Helps users set up, enforce, and maintain a feature-based, one-way data flow folder structure in their applications. Use this skill when a user asks how to organize their codebase, where to place a specific file, or how to refactor a large application.
---

# Feature-Based Structure

This skill helps you implement and manage a scalable, feature-driven folder architecture that relies on strict one-way data flow to prevent complex dependency webs and "spaghetti code."

## When to Use This Skill

Use this skill when the user:

- Asks "how should I structure my Next.js / React / web project?"
- Is struggling with a messy codebase and wants to refactor for better maintainability.
- Asks "where should I put this component / hook / database query?"
- Wants to enforce architectural boundaries using ESLint.
- Needs to add a new domain feature (like `users`, `products`, or `billing`) to their app.

## The Core Architecture

The Feature-Based Structure divides the codebase into three distinct layers, enforcing a strict **one-way data flow**. 



### 1. Shared (The Global Layer)
Contains low-level building blocks shared across the entire application.
- **Examples:** Generic UI components (Button, Modal), database connections, global utility formatters.
- **Rule:** Can only import from other `shared` files. Cannot import from `features` or `app`.

### 2. Features (The Domain Layer)
Contains isolated, domain-specific logic. Each feature gets its own folder (e.g., `features/products`) that acts as a mini-application.
- **Examples:** `products`, `users`, `analytics`, `auth`.
- **Internal Structure:** `components/`, `server/`, `hooks/`, `schemas/`.
- **Rule:** Can import from `shared` and from within its own feature folder. **Cannot** import from other features or `app`.

### 3. App (The Glue Layer)
Contains routing and page definitions. It glues features together to build the actual UI.
- **Examples:** Next.js `app/` router pages, desktop application window panes.
- **Rule:** Can import from `features` and `shared`.

## How to Help Users with This Structure

### Step 1: File Placement Guidance
When a user asks where to put a file, ask them: *"Is this specific to a single domain (like a Product Grid), or is it used everywhere (like a generic Submit Button)?"*
- If domain-specific -> Put it in `features/[domain-name]/...`
- If global -> Put it in `shared/...`

### Step 2: Enforcing Boundaries (ESLint)
If the user wants to guarantee this structure stays clean, guide them to set up `eslint-plugin-boundaries`. 

Provide them with the basic concept of the config:
1. Categorize code into `shared`, `feature`, and `app`.
2. Allow `shared` to import `shared`.
3. Allow `feature` to import `shared` and its own internal files.
4. Allow `app` to import `shared` and `features`.

### Step 3: Refactoring Assistance
If a user mentions a file that depends on multiple features (e.g., a permissions file that imports from `users`, `products`, and `sales`), advise them to:
1. **Decouple:** Pass the necessary data into the function as arguments instead of fetching it inside the function.
2. **Promote:** If the logic truly belongs everywhere, move it down to the `shared` folder.

## Example File Tree

```text
src/
├── app/                # The Glue (Pages & Routes)
│   ├── dashboard/
│   │   └── page.tsx    # Imports from features/products and features/users
├── features/           # The Brains (Domain Logic)
│   ├── products/
│   │   ├── components/ 
│   │   └── server/     
│   └── users/
│       ├── components/ 
│       └── server/     
├── components/         # Shared UI (Buttons, Inputs)
├── lib/                # Shared Config (DB Client)
└── utils/              # Shared Helpers (Formatters)
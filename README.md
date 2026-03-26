# Crowd-Free Canteen

## Live (GitHub Pages)

After the `deploy` workflow runs, the site is available at:

- https://nayan224758.github.io/PreOrderCanteen/

## Local development

...
# 🍽️ Crowd-Free Canteen System

A full-stack web application that allows college students to pre-book food orders from the canteen to reduce crowding. Built with **React (Vite)**, **Tailwind CSS**, and **Supabase** (PostgreSQL + Auth).

---

## Features

| Role | Capabilities |
|---------|-------------------------------------------|
| **Student / Staff** | Browse menu, add to cart, select counter, place order, view order history |
| **Admin** | All of the above **plus** view all orders, update order status, view revenue, add menu items, monitor counter occupancy |

- Supabase Auth (email + password)
- Row Level Security — users see only their own orders; admins see all
- Database trigger prevents overbooking (capacity limit per counter)
- Responsive, modern UI with Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|-------|-------------------------|
| Frontend | React 19 (Vite), JavaScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| State | Context API (Auth + Cart) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |

---

## Folder Structure

```
crowd-free-canteen/
├── index.html
├── vite.config.js
├── package.json
├── .env                         # Supabase credentials (not committed)
├── supabase/
│   └── schema.sql               # Full DB schema, triggers, RLS, seed data
└── src/
    ├── main.jsx                 # Entry point
    ├── App.jsx                  # Router + providers
    ├── index.css                # Tailwind import
    ├── supabaseClient.js        # Supabase client init
    ├── context/
    │   ├── AuthContext.jsx       # Auth state + helpers
    │   └── CartContext.jsx       # Cart state + helpers
    ├── components/
    │   ├── Alert.jsx             # Auto-dismissing alert banner
    │   ├── Button.jsx            # Reusable button with variants
    │   ├── Navbar.jsx            # Top navigation bar
    │   └── ProtectedRoute.jsx    # Auth guard + role check
    └── pages/
        ├── LoginPage.jsx
        ├── SignupPage.jsx
        ├── MenuPage.jsx
        ├── CartPage.jsx
        ├── OrdersPage.jsx
        └── AdminDashboard.jsx
```

---

## Installation

### Prerequisites

- **Node.js** ≥ 18
- A **Supabase** project (free tier works) — https://supabase.com

### 1. Clone / copy the project

```bash
cd crowd-free-canteen
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Edit the `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Optional (local demo without Supabase):

```env
VITE_DEMO_MODE=true
```

In demo mode, users must **sign up first** and then sign in with the password they set (there are no built-in “any password” demo logins).

Restrict admin access to selected people (optional):

```env
VITE_ADMIN_EMAIL_ALLOWLIST=admin@college.edu,other.admin@college.edu
```

If set, this can be used for extra app-side restrictions (e.g. promotion rules), but admin account creation is primarily gated by the admin signup code.

Require separate signup codes for Students and Staff (optional):

```env
VITE_STUDENT_SIGNUP_CODE=<student-code>
VITE_STAFF_SIGNUP_CODE=<staff-code>
```

If set, users must enter the correct code during **signup** when selecting the corresponding role.

You can find these in your Supabase dashboard under **Settings → API**.

### 4. Set up the database

1. Open the **SQL Editor** in your Supabase dashboard.
2. Paste the entire contents of `supabase/schema.sql` and run it.

This creates all tables, triggers, RLS policies, and seed data.

### 5. Run the development server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 6. Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User profile linked to `auth.users` |
| `service_counter` | Physical counter locations with capacity |
| `menu_item` | Food items available for ordering |
| `orders` | Customer orders with status tracking |
| `order_item` | Many-to-many bridge: items per order |
| `payment` | Payment records per order |

### Trigger: Capacity Control

A `BEFORE INSERT` trigger on `orders` checks:
- If `current_orders >= max_capacity` for the selected counter → **raises exception** (order blocked)
- Otherwise increments `current_orders` by 1

An `AFTER UPDATE` trigger decrements `current_orders` when an order moves to `Completed` or `Cancelled`.

### Row Level Security (RLS)

| Table | Policy |
|-------|--------|
| `users` | Users read own row; admins read all |
| `orders` | Users see own orders; admins see all |
| `order_item` | Follows order visibility |
| `payment` | Follows order visibility |
| `menu_item` | Everyone reads; admins insert/update |
| `service_counter` | Everyone reads; admins modify |

---

## Usage Guide

1. **Sign up** with email, password, name, and role.
2. **Log in** → you're redirected to the Menu page.
3. **Browse menu** — filter by category, add items to cart.
4. **Open Cart** — adjust quantities, select a service counter, choose payment method, and **Place Order**.
5. **View Orders** — see your order history with status and payment info.
6. **Admin Dashboard** (admin role only) — manage orders, add menu items, and monitor counters.

---

## License

MIT

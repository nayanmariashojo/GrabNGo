-- ============================================================
-- Crowd-Free Canteen System — Full Database Setup
-- Run this in the Supabase SQL Editor (or via psql).
-- ============================================================

-- 1. USERS TABLE (linked to Supabase Auth)
-- Stores app-specific profile fields (role, phone, active flag).
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile row when a new auth user signs up.
-- The app should send `options.data` metadata on signUp (name/phone/role).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role TEXT;
BEGIN
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF meta_role NOT IN ('student', 'staff', 'admin') THEN
    meta_role := 'student';
  END IF;

  INSERT INTO public.users (id, name, email, phone, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    meta_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name  = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    role  = public.users.role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. SERVICE COUNTERS
CREATE TABLE IF NOT EXISTS public.service_counter (
  counter_id     SERIAL PRIMARY KEY,
  counter_name   TEXT NOT NULL,
  location       TEXT,
  max_capacity   INT NOT NULL DEFAULT 10,
  current_orders INT NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed'))
);

-- 3. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_item (
  item_id      SERIAL PRIMARY KEY,
  item_name    TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  category     TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  description  TEXT NOT NULL DEFAULT '',
  image_src    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TIME SLOTS (pickup windows)
CREATE TABLE IF NOT EXISTS public.time_slot (
  slot_id      SERIAL PRIMARY KEY,
  slot_time    TEXT NOT NULL,
  date         DATE NOT NULL,
  max_capacity INT NOT NULL DEFAULT 20,
  booked_count INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  order_id     SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  counter_id   INT  NOT NULL REFERENCES public.service_counter (counter_id),
  slot_id      INT  NOT NULL REFERENCES public.time_slot (slot_id),
  order_time   TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Preparing','Ready','Completed','Cancelled'))
);

-- 6. ORDER ITEMS (bridge table)
CREATE TABLE IF NOT EXISTS public.order_item (
  order_id INT NOT NULL REFERENCES public.orders (order_id) ON DELETE CASCADE,
  item_id  INT NOT NULL REFERENCES public.menu_item (item_id),
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (order_id, item_id)
);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payment (
  payment_id     SERIAL PRIMARY KEY,
  order_id       INT NOT NULL REFERENCES public.orders (order_id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending','Paid','Failed')),
  payment_time   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS: Capacity control (counter + time slot)
-- ============================================================

-- Function that runs BEFORE an order is inserted
CREATE OR REPLACE FUNCTION public.check_capacity_and_increment()
RETURNS TRIGGER AS $$
DECLARE
  counter_cap   INT;
  counter_curr  INT;
  counter_stat  TEXT;
  slot_cap      INT;
  slot_booked   INT;
  slot_active   BOOLEAN;
BEGIN
  -- Counter row lock to avoid races
  SELECT max_capacity, current_orders, status
    INTO counter_cap, counter_curr, counter_stat
    FROM public.service_counter
   WHERE counter_id = NEW.counter_id
   FOR UPDATE;

  IF counter_stat = 'Closed' THEN
    RAISE EXCEPTION 'This counter is currently closed.';
  END IF;
  IF counter_curr >= counter_cap THEN
    RAISE EXCEPTION 'Counter is at full capacity. Please choose another counter.';
  END IF;

  -- Time slot row lock to avoid races
  SELECT max_capacity, booked_count, is_active
    INTO slot_cap, slot_booked, slot_active
    FROM public.time_slot
   WHERE slot_id = NEW.slot_id
   FOR UPDATE;

  IF slot_active IS NOT TRUE THEN
    RAISE EXCEPTION 'This time slot is not active.';
  END IF;
  IF slot_booked >= slot_cap THEN
    RAISE EXCEPTION 'This time slot is fully booked. Please choose another slot.';
  END IF;

  -- Increment counts
  UPDATE public.service_counter
     SET current_orders = current_orders + 1
   WHERE counter_id = NEW.counter_id;

  UPDATE public.time_slot
     SET booked_count = booked_count + 1
   WHERE slot_id = NEW.slot_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_capacity ON public.orders;
CREATE TRIGGER trg_check_capacity
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_capacity_and_increment();

-- Decrement counts when an order is cancelled or completed
CREATE OR REPLACE FUNCTION public.decrement_capacity_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('Completed', 'Cancelled') AND OLD.status NOT IN ('Completed', 'Cancelled') THEN
    UPDATE public.service_counter
       SET current_orders = GREATEST(current_orders - 1, 0)
     WHERE counter_id = NEW.counter_id;

    UPDATE public.time_slot
       SET booked_count = GREATEST(booked_count - 1, 0)
     WHERE slot_id = NEW.slot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_decrement_capacity ON public.orders;
CREATE TRIGGER trg_decrement_capacity
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_capacity_on_complete();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slot       ENABLE ROW LEVEL SECURITY;

-- USERS: users can read their own row; admins can read all
CREATE POLICY users_select_own   ON public.users FOR SELECT USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);
CREATE POLICY users_insert_own   ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update      ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Extra safety: prevent privilege escalation / self re-enabling.
-- Normal users may update their own profile fields, but only admins may change `role`
-- or `is_active`, and only admins may update other users.
CREATE OR REPLACE FUNCTION public.enforce_user_admin_controls()
RETURNS TRIGGER AS $$
DECLARE
  acting_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ) INTO acting_is_admin;

  -- Updating someone else's row
  IF auth.uid() IS NULL OR auth.uid() <> OLD.id THEN
    IF acting_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Only admins can update other users.';
    END IF;
    RETURN NEW;
  END IF;

  -- Self-update: block role / active changes unless admin
  IF acting_is_admin IS NOT TRUE THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only admins can change roles.';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Only admins can enable/disable accounts.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_user_admin_controls ON public.users;
CREATE TRIGGER trg_enforce_user_admin_controls
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_admin_controls();

-- ORDERS: users see their own; admins and staff see all
CREATE POLICY orders_select ON public.orders FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','staff'))
);
CREATE POLICY orders_insert ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_update ON public.orders FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','staff'))
);

-- ORDER_ITEM: follow order visibility
CREATE POLICY order_item_select ON public.order_item FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
     WHERE o.order_id = order_item.order_id
       AND (o.user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','staff')))
  )
);
CREATE POLICY order_item_insert ON public.order_item FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o WHERE o.order_id = order_item.order_id AND o.user_id = auth.uid()
  )
);

-- PAYMENT: follow order visibility
CREATE POLICY payment_select ON public.payment FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
     WHERE o.order_id = payment.order_id
       AND (o.user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','staff')))
  )
);
CREATE POLICY payment_insert ON public.payment FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o WHERE o.order_id = payment.order_id AND o.user_id = auth.uid()
  )
);
CREATE POLICY payment_update ON public.payment
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.order_id = payment.order_id
         AND (
           o.user_id = auth.uid()
           OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
         )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.order_id = payment.order_id
         AND (
           o.user_id = auth.uid()
           OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
         )
    )
  );

-- MENU_ITEM: everyone can read; admins can insert/update
CREATE POLICY menu_item_select ON public.menu_item FOR SELECT USING (true);
CREATE POLICY menu_item_insert ON public.menu_item FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);
CREATE POLICY menu_item_update ON public.menu_item FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- SERVICE_COUNTER: everyone can read; admins can modify
CREATE POLICY counter_select ON public.service_counter FOR SELECT USING (true);
CREATE POLICY counter_insert ON public.service_counter FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);
CREATE POLICY counter_update ON public.service_counter FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- TIME_SLOT: everyone can read; admins can modify
CREATE POLICY time_slot_select ON public.time_slot FOR SELECT USING (true);
CREATE POLICY time_slot_insert ON public.time_slot FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);
CREATE POLICY time_slot_update ON public.time_slot FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- ============================================================
-- SEED DATA — sample counters & menu items
-- ============================================================

INSERT INTO public.service_counter (counter_name, location, max_capacity) VALUES
  ('Counter A', 'Ground Floor - Left',  15),
  ('Counter B', 'Ground Floor - Right', 10),
  ('Counter C', 'First Floor',          12)
ON CONFLICT DO NOTHING;

INSERT INTO public.time_slot (slot_time, date, max_capacity, booked_count, is_active) VALUES
  ('11:00 AM - 11:30 AM', '2026-03-03', 20, 12, true),
  ('11:30 AM - 12:00 PM', '2026-03-03', 20, 18, true),
  ('12:00 PM - 12:30 PM', '2026-03-03', 25, 25, true),
  ('12:30 PM - 1:00 PM',  '2026-03-03', 25, 10, true),
  ('1:00 PM - 1:30 PM',   '2026-03-03', 20, 5,  true),
  ('1:30 PM - 2:00 PM',   '2026-03-03', 20, 0,  false)
ON CONFLICT DO NOTHING;

INSERT INTO public.menu_item (item_name, price, category) VALUES
  ('Masala Dosa',      40.00, 'Breakfast'),
  ('Idli Sambar',      30.00, 'Breakfast'),
  ('Veg Biryani',      80.00, 'Lunch'),
  ('Chicken Biryani', 120.00, 'Lunch'),
  ('Paneer Butter Masala', 100.00, 'Lunch'),
  ('Coffee',           20.00, 'Beverages'),
  ('Tea',              15.00, 'Beverages'),
  ('Cold Coffee',      50.00, 'Beverages'),
  ('Samosa',           15.00, 'Snacks'),
  ('Vada Pav',         20.00, 'Snacks')
ON CONFLICT DO NOTHING;

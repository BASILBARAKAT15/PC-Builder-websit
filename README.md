# PC Builder — Complete PHP Backend (final, 100%)

Full PHP backend + DB + frontend integration for the PC Builder project.
Drop everything into your XAMPP project folder and follow setup steps below.

## Setup (XAMPP)

1. **Copy this whole folder over your project**:
   `C:\xampp\htdocs\PC-Builder-websit-akram\` — allow overwrites.

2. **Start Apache + MySQL** from XAMPP Control Panel.

3. **Create the database** — phpMyAdmin → SQL tab → paste `api/schema.sql` → Go.

4. **Add wishlist table** — same place → paste `api/wishlist_schema.sql` → Go.

5. **Seed products** — same place → paste `api/seed_products.sql` → Go (39 products).

6. **Create admin** — open `http://localhost/PC-Builder-websit-akram/api/seed_admin.php`
   (creates `admin@pcbuilder.local` / `Admin@123`). Delete the file after.

7. **Open the site**: `http://localhost/PC-Builder-websit-akram/HTMLPage/index.html`

## Default admin

```
email:    admin@pcbuilder.local
password: Admin@123
```

## What's inside

```
api/
├── schema.sql, wishlist_schema.sql, seed_products.sql, seed_admin.php
├── config.php, helpers.php
├── auth/      signup login logout me
├── users/     update_profile change_password list delete
├── products/  list add delete
├── coupons/   validate list add toggle delete
├── orders/    place my_orders get all update_status
└── wishlist/  list add remove clear

Js/
├── api.js              ← API client
├── login.js, signup.js, Cart.js, checkout.js, profile.js
├── utils.js            ← navbar, logout, viewOrders, wishlist all sync with API
└── products-sync.js    ← reconciles category pages with DB on load

HTMLPage/  (16 files — 6 backend pages + 10 category pages)
admin/     (admin.js + 5 admin HTML pages)
```

## Test checklist

- [ ] Sign up → user appears in `users` table
- [ ] Log in → navbar updates
- [ ] Add items to cart from any category page
- [ ] Apply coupon `WELCOME10` → discount applied
- [ ] Checkout with shipping address → order saved with correct total
- [ ] Order tracking page shows timeline
- [ ] Profile shows the order; edit username works; password change requires current password
- [ ] Heart a product → log in from another browser → wishlist still there
- [ ] Log in as admin → dashboard numbers formatted as $X,XXX.XX
- [ ] Admin: add a new product → it appears on the matching category page
- [ ] Admin: delete a product → it disappears from the category page
- [ ] Admin: change order status → reflected in user's order tracking

## Security

- Bcrypt password hashing
- PHP sessions, HttpOnly, regenerated on login
- All admin endpoints verify session role server-side
- Order totals computed server-side (cannot fake price)
- All SQL via PDO prepared statements
- XSS-safe rendering in Cart, admin, and dynamic product cards

## Known limitations

- Cart, theme, and build selections still in localStorage by design
- Guest wishlist is per-browser; logged-in wishlist syncs across devices
- Category pages keep their original HTML cards as a base; the DB
  decides which are visible and adds new admin-created products on top

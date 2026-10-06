Jasmine Crackers website
Open index.html in a browser. Needs internet for Google Fonts and Lucide icons.
Edit products: js/script.js (CATEGORIES, PRODUCTS, GALLERY near the top).
Phone/WhatsApp number: PHONE in js/script.js, and tel: links in index.html.
Images: images/ folder (logo.jpg, shop-interior.jpg, storefront.jpg).

Cart and checkout (js/cart.js, css/cart.css):
- Prices: set price (number, rupees) on each PRODUCT. price:null shows "Price on request". CLIENT MUST SUPPLY REAL PRICES.
- Delivery/taxes: SHOP.deliveryEnabled and SHOP.charges at the top of js/cart.js. Pickup is the default.
- Orders: no backend is connected. Set SHOP.orderApi to a real endpoint; the server must recompute prices and totals itself.
  Until then orders are NOT stored anywhere; customers use "Confirm via WhatsApp" to send them to the shop.

ADMIN + DATABASE (Supabase)  see supabase/schema.sql
1. Create a free project at supabase.com. Authentication > Providers > Email: turn OFF "Allow new users to sign up".
2. SQL Editor: paste and run supabase/schema.sql.
3. Authentication > Users > Add user (the owner's email + password). Then run in SQL Editor:
   insert into admins(user_id) select id from auth.users where email='OWNER_EMAIL';
4. Vercel > Settings > Environment Variables: SUPABASE_URL and SUPABASE_ANON_KEY (Project Settings > API; use the anon/public key ONLY, never service_role). Redeploy.
5. Open /admin/login. Add products there; they appear on the website. Prices are recalculated by the database when an order is placed.
Local testing: run `SUPABASE_URL=... SUPABASE_ANON_KEY=... node build.js` then `npx serve .` (admin pages need a web server, not file://).

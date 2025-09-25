# 🛒 Next-Step-E-Commerce – Backend (Express + MongoDB)

This is the backend API for the **Next-Step-E-Commerce App**.
It provides endpoints for managing products, filtering, searching, orders, cart, wishlist, and addresses.

---

## 📦 Project Structure

```
backend/
├── db/
│   └── db.connect.js        # MongoDB connection
├── models/
│   ├── allShoes.model.js    # Shoes schema
│   ├── address.model.js     # Address schema
│   ├── cart.model.js        # Cart schema
│   ├── orders.model.js      # Orders schema
│   └── wishlist.model.js    # Wishlist schema
├── index.js                # Express app & routes
├── .env.example             # Template for environment variables
└── README.md                # This file
```

---

## ⚙️ Setup Instructions

1. Navigate to backend folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file from example:

   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your MongoDB URI:

   ```env
   MONGODB=mongodb://localhost:27017/shoe-store
   PORT=3000
   ```

   > If using MongoDB Atlas, paste your Atlas connection string.

5. Run the server:

   ```bash
   node server.js
   ```

   or with auto-reload:

   ```bash
   npx nodemon server.js
   ```

6. API runs at: **[http://localhost:3000](http://localhost:3000)**

---

## 🗄️ Seeding Data

To insert sample shoes from `allShoes.json`:

1. In `server.js`, uncomment:

   ```js
   // seedData();
   ```
2. Run the server once.
3. Comment it again to prevent duplicates.

---

## 🌐 API Endpoints

### 👟 Shoes

* **Get all shoes**
  `GET /shoes`

* **Get shoe by ID**
  `GET /shoe/id/:shoeId`

* **Get by category**
  `GET /shoes/category/:category`

* **Homepage (hot deals + trending)**
  `GET /homepage?hotLimit=4&trendingLimit=4`

* **Similar products (category + gender)**
  `GET /products/similar/:productId?limit=4`

* **Filter & sort**
  `GET /products/filter?rating=4&gender=Men&color=White,Black&discount=20&sort=low`

* **Search by name or category**
  `GET /products/search?q=running`

---

### 🏠 Addresses

* Get all → `GET /addresses`
* Add → `POST /addresses`
* Update → `POST /addresses/:id`
* Delete → `DELETE /addresses/:id`

---

### 📦 Orders

* Place new order → `POST /products/orders`
* Get all orders → `GET /products/orders`
* Delete order → `DELETE /products/orders/:id`

---

### 🛒 Cart

* Add to cart → `POST /products/cart`
* Get cart items → `GET /products/cart`
* Increase qty → `POST /products/cart/increase/:id`
* Decrease qty → `POST /products/cart/decrease/:id`
* Remove item → `DELETE /products/cart/:id`
* Check if product is in cart → `GET /products/cart/status/:productId`

---

### 💖 Wishlist

* Add/Remove (toggle) → `POST /products/wishlist`
* Get all wishlist items → `GET /products/wishlist`
* Delete wishlist item → `DELETE /products/wishlist/:id`
* Check if product is in wishlist → `GET /products/wishlist/status/:productId`

---

## 🔑 Environment Variables

Your `.env` should include:

```env
MONGODB=your-mongodb-uri-here
PORT=3000
```

---

## 🛠 Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)

---



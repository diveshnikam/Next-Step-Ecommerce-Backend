// Import models (MongoDB schema)
const AllShoes = require("./models/allShoes.model");
const Address = require("./models/address.model")
const Order = require("./models/orders.model")
const Cart = require("./models/cart.model");
const Wishlist = require("./models/wishlist.model")

// Import DB connection helper
const { initDatabse } = require("./db/db.connect");
initDatabse();

// Import required packages

const express = require("express");
const app = express();
const cors = require("cors");

//Setup CORS (Cross-Origin Resource Sharing) so your frontend can call your backend API

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Allow server to parse JSON request bodies

app.use(express.json());

// Read mock data from a JSON file (used for seeding database)

//const fs = require("fs");

//const jsonData = fs.readFileSync("allShoes.json", "utf-8");

//const shoesData = JSON.parse(jsonData);

// Seed sample event data into MongoDB (optional — run once to populate DB)

/*const seedData = async () => {
  try {
    for (const shoeData of shoesData) {
      const newShoe = new AllShoes({
        name: shoeData.name,
        category: shoeData.category,
        gender: shoeData.gender,
        price: shoeData.price,
        mrp: shoeData.mrp,
        discountPercent: shoeData.discountPercent,
        thumbnail: shoeData.thumbnail,
        colors: shoeData.colors,
        sizes: shoeData.sizes,
        rating: shoeData.rating,
        ratingCount: shoeData.ratingCount,
        description: shoeData.description,
        features: shoeData.features,
        codAvailable: shoeData.codAvailable,
      });

      await newShoe.save();
    }
  } catch (error) {
    console.log("Error Seeding Data", error);
  }
};

seedData()*/

//Fetch all shoes from db

const getAllShoes = async () => {

    try{

        const allData = await AllShoes.find()

        return allData

    }catch(error){
        throw error
    }
}

app.get("/shoes", async (req, res) => {
  try {
    const data = await getAllShoes();

    if (data.length !== 0) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: "Shoes not found." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch Shoes.", errorMessage: error.message });
  }
});

// fetch shoe by shoeId

const getShoeById = async (shoeId) => {
    try {
    const data = await AllShoes.findById(shoeId);
    return data;
  } catch (error) {
    throw error;
  }
}

app.get("/shoe/id/:shoeId", async (req, res) => {
  try {
    const data = await getShoeById(req.params.shoeId);

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: "Shoe not found." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch Shoe.", errorMessage: error.message });
  }
});


//fetch data by category

const getShoesByCategory = async (categoryName) => {
  try {
    const data = await AllShoes.find({category: categoryName });
    return data;
  } catch (error) {
    throw error;
  }
};

app.get("/shoes/category/:category", async (req, res) => {
  try {
    const data = await getShoesByCategory(req.params.category);
    if (data.length > 0) {
      res.json(data);
    } else {
      res.status(404).json({ error: "shoes not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shoes" });
  }
});

app.get("/homepage", async (req, res) => {
  try {
    const hotLimit = parseInt(req.query.hotLimit) || 4;
    const trendingLimit = parseInt(req.query.trendingLimit) || 4;

    // get hot deals
    const hotDeals = await AllShoes.find()
      .sort({ discountPercent: -1 })
      .limit(hotLimit);

    const hotDealIds = hotDeals.map(p => p._id);

    // get trending but exclude hot deals
    const trending = await AllShoes.find({ _id: { $nin: hotDealIds } })
      .sort({ rating: -1 })
      .limit(trendingLimit);

       if (hotDeals.length === 0 && trending.length === 0) {
      return res.status(404).json({ message: "No products found" });
    } else if (hotDeals.length === 0) {
      return res.status(404).json({ message: "No hot deals found" });
    } else if (trending.length === 0) {
      return res.status(404).json({ message: "No trending products found" });
    }

    res.json({
      data: {
        hotDeals,
        trending
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch homepage products" });
  }
});

// Get similar products by category + gender in random order

app.get("/products/similar/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // 1. Find the current product
    const currentProduct = await AllShoes.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Find similar products (same category + gender, exclude current product)
    const similarProducts = await AllShoes.aggregate([
      { 
        $match: { 
          category: currentProduct.category,
          gender: currentProduct.gender,
          _id: { $ne: currentProduct._id } 
        } 
      },
      { $sample: { size: limit } } 
    ]);

    if(similarProducts.length === 0){
        res.status(404).json({ message: "No products found" });
    }

    res.json({ data: similarProducts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch similar products" });
  }
});


//dynamic filtering adn sorting - colors, rating, price, gender

const getFilteredProducts = async (query) => {
  try {
    const filter = {};
    let sortOption = {};

    //  query params to array
    const toArray = (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : String(val).split(",").map(v => v.trim());
    };

    // Rating
    if (query.rating) {
      filter.rating = { $gte: Number(query.rating) };
    }

    // Gender
    const genders = toArray(query.gender);
    if (genders.length) {
      filter.gender = { $in: genders };
    }

    // Category
    const categories = toArray(query.category);
    if (categories.length) {
      filter.category = { $in: categories };
    }

    // Colors
    const colors = toArray(query.color);
    if (colors.length) {
      filter.$or = colors.map(c => ({ [`colors.${c}`]: { $exists: true } }));
    }

    //discount
    if (query.discount) {
      const discountValue = Number(query.discount);
      filter.discountPercent = { $gte: discountValue };
    }

    // Sorting
    if (query.sort === "low")  sortOption = { price: 1 };
    if (query.sort === "high") sortOption = { price: -1 };

   
    return await AllShoes.find(filter).sort(sortOption);
  } catch (error) {
    throw error;
  }
};

app.get("/products/filter", async (req, res) => {
  try {
    const products = await getFilteredProducts(req.query);
    if (products.length > 0) {
      res.json(products);
    } else {
      res.status(404).json({ error: "No products found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});



//search 
const searchProductsByNameOrCategory = async (searchWord) => {
  try {
    const regex = new RegExp(searchWord, "i");

    const products = await AllShoes.find({
      $or: [{ name : regex }, { category: regex }],
    });

    return products;
  } catch (error) {
    throw error;
  }
};

app.get("/products/search", async (req, res) => {
  try {
    const {q} = req.query
    const products = await searchProductsByNameOrCategory(q)

    if(products.length > 0){
      res.status(200).json(products)
    }else {
      res.status(404).json({ error: "No Products found" });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch products",
      errorMessage: error.message,
    });
  }
});

//address

// Get all addresses
const getAllAddresses = async () => {
  try {
    const allData = await Address.find();
    return allData;
  } catch (error) {
    throw error;
  }
};

app.get("/addresses", async (req, res) => {
  try {
    const data = await getAllAddresses();
    if (data.length !== 0) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: "No addresses found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch addresses.", errorMessage: error.message });
  }
});

// Add new address
const addAddress = async (addressData) => {
  try {
    const newAddress = new Address(addressData);
    return await newAddress.save();
  } catch (error) {
    throw error;
  }
};

// Add new address
app.post("/addresses", async (req, res) => {
  try {
    const data = await addAddress(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to add address.", errorMessage: error.message });
  }
});

// Edit (Update) address
const editAddress = async (id, addressData) => {
  try {
    const updatedAddress = await Address.findByIdAndUpdate(id, addressData, { new: true });
    return updatedAddress;
  } catch (error) {
    throw error;
  }
};

app.post("/addresses/:id", async (req, res) => {
  try {
    const data = await editAddress(req.params.id, req.body);
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: "Address not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update address.", errorMessage: error.message });
  }
});

// Delete address
const deleteAddress = async (id) => {
  try {
    const deletedAddress = await Address.findByIdAndDelete(id);
    return deletedAddress;
  } catch (error) {
    throw error;
  }
};

app.delete("/addresses/:id", async (req, res) => {
  try {
    const data = await deleteAddress(req.params.id);
    if (data) {
      res.status(200).json({ message: "Address deleted successfully." });
    } else {
      res.status(404).json({ error: "Address not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete address.", errorMessage: error.message });
  }
});


// Place a new order
const placeOrder = async (orderData) => {
  const newOrder = new Order(orderData);
  return await newOrder.save();
};

app.post("/products/orders", async (req, res) => {
  try {
    const savedOrder = await placeOrder(req.body);
    res.status(201).json({ message: "Order placed successfully", data: savedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders

const getAllOrders = async () => {
  try {
    const orders = await Order.find()
      .populate("productId", "name price thumbnail"); 
    return orders; 
  } catch (error) {
    throw error;
  }
};

app.get("/products/orders", async (req, res) => {
  try {
    const orders = await getAllOrders();

    if (orders.length > 0) {
      res.status(200).json(orders);
    } else {
      res.status(404).json({ message: "No orders found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// delete order
const deleteOrder = async (id) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(id);
    return deletedOrder; 
  } catch (error) {
    throw error;
  }
};

app.delete("/products/orders/:id", async (req, res) => {
  try {
    const deletedOrder = await deleteOrder(req.params.id);
     if (deletedOrder) {
      res.status(200).json({ message: "Order deleted successfully." });
    } else {
      res.status(404).json({ error: "Order not found." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// add to cart

const addToCart = async (cartData) => {
  // If product is in Wishlist, remove it
  await Wishlist.findOneAndDelete({ productId: cartData.productId });

  const existingItem = await Cart.findOne({ productId: cartData.productId });
  if (existingItem) {
    existingItem.quantity += cartData.quantity || 1;
    return await existingItem.save();
  } else {
    const newCartItem = new Cart(cartData);
    return await newCartItem.save();
  }
};


app.post("/products/cart", async (req, res) => {
  try {
    const savedCartItem = await addToCart(req.body);
    res.status(201).json({ message: "Item added to cart", data: savedCartItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all cart items
const getAllCartItems = async () => {
  return await Cart.find().populate("productId", "name price thumbnail");
};

app.get("/products/cart", async (req, res) => {
  try {
    const items = await getAllCartItems();
    if (items.length > 0) {
      res.status(200).json(items);
    } else {
      res.status(404).json({ message: "Cart is empty" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Increase quantity
const increaseQuantity = async (id) => {
  return await Cart.findByIdAndUpdate(id, { $inc: { quantity: 1 } }, { new: true });
};

app.post("/products/cart/increase/:id", async (req, res) => {
  try {
   
    const updatedItem = await increaseQuantity(req.params.id);
    if (updatedItem) {
      res.status(200).json(updatedItem);
    } else {
      res.status(404).json({ message: "Cart item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Decrease quantity (not below 1)
const decreaseQuantity = async (id) => {
  const item = await Cart.findById(id);
  if (item && item.quantity > 1) {
    item.quantity -= 1;
    return await item.save();
  }
  return item; // stays the same if 1
};

app.post("/products/cart/decrease/:id", async (req, res) => {
  try {
    const updatedItem = await decreaseQuantity(req.params.id);
    if (updatedItem) {
      res.status(200).json(updatedItem);
    } else {
      res.status(404).json({ message: "Cart item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Remove a cart item
const removeCartItem = async (id) => {
  return await Cart.findByIdAndDelete(id);
};

app.delete("/products/cart/:id", async (req, res) => {
  try {
    const deletedItem = await removeCartItem(req.params.id);
    if (deletedItem) {
      res.status(200).json({ message: "Cart item removed" });
    } else {
      res.status(404).json({ message: "Cart item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// add to wishlist

const addToWishlist = async (wishlistData) => {
  // If product is in Cart, remove it first
  await Cart.findOneAndDelete({ productId: wishlistData.productId });

  const existingItem = await Wishlist.findOne({ productId: wishlistData.productId });
  if (existingItem) {
    // If already exists, remove it (toggle)
    await Wishlist.findByIdAndDelete(existingItem._id);
    return { message: "Removed from wishlist" };
  } else {
    // Else add to wishlist
    const newItem = new Wishlist(wishlistData);
    return await newItem.save();
  }
};

app.post("/products/wishlist", async (req, res) => {
  try {
    const result = await addToWishlist(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//get all products from wishlist

const getAllWishlistItems = async () => {
  return await Wishlist.find().populate("productId", "name price thumbnail");
};

app.get("/products/wishlist", async (req, res) => {
  try {
    const items = await getAllWishlistItems();
    if (items.length > 0) {
      res.status(200).json(items);
    } else {
      res.status(404).json({ message: "Wishlist is empty" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//delet wishlist product

const removeWishlistItem = async (id) => {
  return await Wishlist.findByIdAndDelete(id);
};

app.delete("/products/wishlist/:id", async (req, res) => {
  try {
    const deletedItem = await removeWishlistItem(req.params.id);
    if (deletedItem) {
      res.status(200).json({ message: "Item removed from wishlist" });
    } else {
      res.status(404).json({ message: "Item not found in wishlist" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//check product is in wishlish or not 


const isInWishlist = async (productId) => {
  const item = await Wishlist.findOne({ productId });
  if (item) return true;
  else return false;
};


app.get("/products/wishlist/status/:productId", async (req, res) => {
  const productId = req.params.productId;
  try {
    const inWishlist = await isInWishlist(productId);
    res.status(200).json({ inWishlist: inWishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//check product is in cart or not 


const isInCart = async (productId) => {
  const item = await Cart.findOne({ productId });
  if (item) return true;
  else return false;
};


app.get("/products/cart/status/:productId", async (req, res) => {
  const productId = req.params.productId;
  try {
    const inCart = await isInCart(productId);
    res.status(200).json({ inCart: inCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});










// Get the port number from environment variables
const PORT = process.env.PORT;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

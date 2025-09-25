const mongoose = require("mongoose");

const shoeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Men", "Women"], 
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    mrp: {
      type: Number,
      required: true,
    },

    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    colors: {
      type: Map,
      of: [String],
      required: true,
      validate: {
        validator: (m) => m && m.size > 0,
        message: "colors must have at least one color key",
      },
    },

    sizes: {
      type: [Number],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "sizes must have at least one value",
      },
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    ratingCount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
    },

    features: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "features must have at least one item",
      },
    },

    codAvailable: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AllShoes = mongoose.model("AllShoes", shoeSchema);

module.exports = AllShoes;

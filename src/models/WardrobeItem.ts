import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWardrobeItem extends Document {
  user: Types.ObjectId;
  name: string;
  category: string;           // ex: top, bottom, shoes, accessory, bag, outerwear
  subCategory?: string;       // ex: "t-shirt", "jeans", "sneakers", "scarf"
  color?: string;
  pattern?: string;           // ex: "solid", "striped", "floral"
  material?: string;          // ex: "cotton", "denim", "leather"
  brand?: string;
  fit?: string;               // ex: "slim", "regular", "oversized"
  imageUrl: string;
  styleTags?: string[];       // ex: ["streetwear", "casual", "minimal"]
  gender?: "male" | "female" | "unisex";
  season?: "summer" | "winter" | "spring" | "autumn" | "all";
  occasion?: string[];        // ex: ["work", "party", "sport", "travel"]
  temperatureRange?: {        // pour IA météo
    min: number;
    max: number;
  };
  weatherSuitability?: string[]; // ex: ["rainy", "sunny", "cold"]
  locationTags?: string[];    // ex: ["urban", "beach", "mountain"]
  isFavorite?: boolean;
  usageCount?: number;        // combien de fois porté
  lastWornDate?: Date;
  createdAt: Date;
}

const WardrobeItemSchema: Schema = new Schema<IWardrobeItem>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },

  category: {
    type: String,
    enum: ["top", "bottom", "shoes", "accessory", "bag", "outerwear"],
    required: true
  },

  subCategory: {
    type: String,
    enum: [
      // Hauts
      "t-shirt", "shirt", "blouse", "sweater", "hoodie", "tank", "polo",
      // Bas
      "jeans", "trousers", "shorts", "skirt", "leggings",
      // Chaussures
      "sneakers", "boots", "sandals", "heels", "loafers",
      // Accessoires
      "watch", "belt", "scarf", "hat", "earrings", "necklace",
      // Sacs & manteaux
      "backpack", "handbag", "coat", "jacket", "blazer"
    ],
    required: false
  },

  color: { type: String },
  pattern: { type: String },
  material: { type: String },
  brand: { type: String },
  fit: { type: String },

  imageUrl: { type: String, required: true },
  styleTags: { type: [String], default: [] },

  gender: { type: String, enum: ["male", "female", "unisex"], default: "unisex" },
  season: { type: String, enum: ["summer", "winter", "spring", "autumn", "all"], default: "all" },
  occasion: { type: [String], default: [] },

  temperatureRange: {
    min: { type: Number, default: null },
    max: { type: Number, default: null }
  },

  weatherSuitability: { type: [String], default: [] },
  locationTags: { type: [String], default: [] },

  isFavorite: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
  lastWornDate: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWardrobeItem>("WardrobeItem", WardrobeItemSchema);

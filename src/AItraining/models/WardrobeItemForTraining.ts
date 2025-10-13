import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWardrobeItemForTraining extends Document {
  user?: Types.ObjectId;
  name: string;
  category?: string;
  subCategory?: string;
  color?: string;
  pattern?: string;
  material?: string;
  brand?: string;
  fit?: string;
  gender?: "male" | "female" | "unisex";
  imageUrl: string;
  styleTags?: string[];
  season?: "summer" | "winter" | "spring" | "autumn" | "all";
  occasion?: string[];
  temperatureRange?: { min?: number; max?: number };
  weatherSuitability?: string[];
  locationTags?: string[];
  source?: string;
  isFavorite?: boolean;
  usageCount?: number;
  lastWornDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const WardrobeItemForTrainingSchema = new Schema<IWardrobeItemForTraining>(
  {
    user: { type: Schema.Types.ObjectId, ref: "UserForTraining", required: false },

    name: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: ["top", "bottom", "shoes", "accessory", "bag", "outerwear"],
      required: false,
      trim: true,
    },

    subCategory: {
      type: String,
      enum: [
        "t-shirt", "shirt", "blouse", "sweater", "hoodie", "tank", "polo",
        "jeans", "trousers", "shorts", "skirt", "leggings",
        "sneakers", "boots", "sandals", "heels", "loafers",
        "watch", "belt", "scarf", "hat", "earrings", "necklace",
        "backpack", "handbag", "coat", "jacket", "blazer",
      ],
      required: false,
      trim: true,
    },

    color: { type: String, trim: true },
    pattern: { type: String, trim: true },
    material: { type: String, trim: true },
    brand: { type: String, trim: true },
    fit: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "unisex"], default: "unisex" },

    imageUrl: { type: String, required: true, trim: true },
    styleTags: { type: [String], default: [] },

    season: {
      type: String,
      enum: ["summer", "winter", "spring", "autumn", "all"],
      default: "all",
      trim: true,
    },

    occasion: { type: [String], default: [] },

    temperatureRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },

    weatherSuitability: { type: [String], default: [] },
    locationTags: { type: [String], default: [] },

    source: { type: String, trim: true },
    isFavorite: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    lastWornDate: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 👇 Force le nom exact de la collection pour MongoDB
export default mongoose.model<IWardrobeItemForTraining>(
  "WardrobeItemForTraining",
  WardrobeItemForTrainingSchema,
  "wardrobeitemfortrainings"
);

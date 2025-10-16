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
  formalityLevel?: "very_casual" | "casual" | "smart_casual" | "semi_formal" | "formal" | "black_tie";
  occasionTypes?: ("business" | "casual" | "sport" | "evening" |"daily"| "beach" | "travel" | "date" | "wedding")[];
  brandCategory?: "luxury" | "premium" | "mass_market" | "sport" | "fast_fashion" | "designer";
  qualityTier?: "basic" | "standard" | "premium" | "luxury";
  styleArchetype?: "minimalist" | "classic" | "bohemian" | "streetwear" | "athleisure" | "business" | "avant_garde";
  dataQuality?: {
    isManuallyReviewed?: boolean;
    confidenceScore?: number;
    needsReview?: boolean;
    lastReviewDate?: Date;
  };
  usageMetrics?: {
    timesRecommended?: number;
    timesAccepted?: number;
    successRate?: number;
  };
  temperatureRange?: { min?: number; max?: number };
  weatherSuitability?: string[];
  locationTags?: string[];
  source?: string;
  isFavorite?: boolean;
  usageCount?: number;
  lastWornDate?: Date;
  embedding?: number[];
  descriptionAI?: string;
  tagsAI?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const WardrobeItemForTrainingSchema = new Schema<IWardrobeItemForTraining>(
  {
    user: { type: Schema.Types.ObjectId, ref: "UserForTraining", required: false },

    name: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: ["top", "bottom", "shoes","dress", "accessory", "bag", "outerwear"],
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
        "backpack", "handbag", "coat", "jacket", "blazer","dress"
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

    formalityLevel: {
        type: String,
        enum: ["very_casual", "casual", "smart_casual", "semi_formal", "formal", "black_tie"],
        default: "casual"
    },
    
    occasionTypes: {
        type: [String],
        enum: ["business", "casual", "sport","daily", "evening", "beach", "travel", "date", "wedding"],
        default: ["casual"]
    },
    
    brandCategory: {
        type: String,
        enum: ["luxury", "premium", "mass_market", "sport", "fast_fashion", "designer"],
        default: "mass_market"
    },
    
    qualityTier: {
        type: String,
        enum: ["basic", "standard", "premium", "luxury"],
        default: "standard"
    },
    
    styleArchetype: {
        type: String,
        enum: ["minimalist", "classic", "bohemian", "streetwear", "athleisure", "business", "avant_garde"],
        default: "classic"
    },
    
    // Flags de qualité
    dataQuality: {
        isManuallyReviewed: { type: Boolean, default: false },
        confidenceScore: { type: Number, default: 0.5 }, // 0-1
        needsReview: { type: Boolean, default: false },
        lastReviewDate: Date
    },
    
    // Métriques d'usage
    usageMetrics: {
        timesRecommended: { type: Number, default: 0 },
        timesAccepted: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
    },

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
    embedding: { type: [Number], default: undefined }, // <= vecteur CLIP (ex: 512)
    descriptionAI: { type: String, trim: true },
    tagsAI: { type: [String], default: [] },


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

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWardrobeItem extends Document {
  user: Types.ObjectId;
  name: string;
  category: string;      
  color?: string;
  imageUrl: string;   
  styleTags?: string[];
  season?: "summer" | "winter" | "spring" | "autumn";
  material?: string;
  occasion?: string[]; // travail, sport, soirée...
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
  color: { type: String },
  imageUrl: { type: String, required: true },
  styleTags: { type: [String], default: [] },
  season : {type: String, enum: ["summer" , "winter" , "spring" , "autumn"]},
  material:{type:String},
  occasion:{type: [String]},
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWardrobeItem>("WardrobeItem", WardrobeItemSchema);

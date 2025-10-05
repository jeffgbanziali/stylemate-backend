import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWardrobeItem extends Document {
  user: Types.ObjectId;
  name: string;
  type: string;      
  color?: string;
  imageUrl: string;   
  styleTags?: string[];
  createdAt: Date;
}

const WardrobeItemSchema: Schema = new Schema<IWardrobeItem>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  color: { type: String },
  imageUrl: { type: String, required: true },
  styleTags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWardrobeItem>("WardrobeItem", WardrobeItemSchema);

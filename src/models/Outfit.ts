import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOutfitItem {
  wardrobeId: Types.ObjectId;
  slot: string; // torso, legs, feet...
  textureUrl: string;
}

export interface IOutfit extends Document {
  user: Types.ObjectId;
  mannequin: Types.ObjectId;
  items: IOutfitItem[];
  meta: {
    occasion?: string;
    weather?: string;
    confidence?: number;
  };
  previewGlb?: string;
  createdAt: Date;
}

const OutfitItemSchema: Schema = new Schema<IOutfitItem>({
  wardrobeId: { type: Schema.Types.ObjectId, ref: "WardrobeItem", required: true },
  slot: { type: String, required: true },
  textureUrl: { type: String, required: true }
}, { _id: false });

const OutfitSchema: Schema = new Schema<IOutfit>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mannequin: { type: Schema.Types.ObjectId, ref: "Mannequin", required: true },
  items: { type: [OutfitItemSchema], default: [] },
  meta: {
    occasion: { type: String },
    weather: { type: String },
    confidence: { type: Number }
  },
  previewGlb: { type: String },
  createdAt: { timestamps: true }

});

export default mongoose.model<IOutfit>("Outfit", OutfitSchema);

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMannequin extends Document {
  user: Types.ObjectId;
  height: number;
  chest: number;
  waist: number;
  hips: number;
  limbRatios?: {
    armLength?: number;
    legLength?: number;
  };
  glbUrl?: string; // fichier 3D (glTF/glb)
  createdAt: Date;
}

const MannequinSchema: Schema = new Schema<IMannequin>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  height: { type: Number, required: true },
  chest: { type: Number, required: true },
  waist: { type: Number, required: true },
  hips: { type: Number, required: true },
  limbRatios: {
    armLength: Number,
    legLength: Number
  },
  glbUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMannequin>("Mannequin", MannequinSchema);

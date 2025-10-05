import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email?: string;
  phone?: string;
  password?: string;
  name?: string;
  provider: "email" | "google" | "apple" | "phone";
  providerId?: string; // pour Google / Apple
  preferences: {
    style: string;
  };
  measurements?: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String },
    name: { type: String },
    provider: {
      type: String,
      enum: ["email", "google", "apple", "phone"],
      required: true
    },
    providerId: { type: String }, // id pour OAuth
    preferences: {
      style: { type: String, default: "casual" }
    },
    measurements: {
      height: Number,
      weight: Number,
      chest: Number,
      waist: Number,
      hips: Number
    }
  },
  { timestamps: true } // createdAt + updatedAt automatiques
);

export default mongoose.model<IUser>("User", UserSchema);

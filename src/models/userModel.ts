import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email?: string;
  phone?: string;
  password?: string;
  username?: string;
  dateOfBirth?: string;
  provider: "email" | "google" | "apple" | "phone";
  providerId?: string; 
  preferences: {
    style: string[];
    color:string[];
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
    username: { type: String },
    dateOfBirth: { type: String, required: true },
    provider: {
      type: String,
      enum: ["email", "google", "apple", "phone"],
      required: true
    },
    providerId: { type: String }, 
    preferences: {
      style: { type: [String], default: []},
      color :{ type: [String], default: [] },
    },
    measurements: {
      height: Number,
      weight: Number,
      chest: Number,
      waist: Number,
      hips: Number
    }
  },
  { timestamps: true } 
);

export default mongoose.model<IUser>("User", UserSchema);

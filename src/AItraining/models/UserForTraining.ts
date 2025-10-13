import mongoose, { Schema, Document } from "mongoose";

export interface IUserForTraining extends Document {
  email: string;
  username: string;
  dateOfBirth?: string;
  provider: "email" | "google" | "apple" | "phone" | "training";
  providerId?: string;
  preferences?: { // ← peut être absent selon dataset
    style?: string[];
    color?: string[];
  };
  measurements?: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}


const UserForTrainingSchema = new Schema<IUserForTraining>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    dateOfBirth: { type: String },
    provider: {
      type: String,
      enum: ["email", "google", "apple", "phone", "training"], // ➕ ajout “training”
      default: "training",
    },
    providerId: { type: String },
    preferences: {
      style: { type: [String], default: [] },
      color: { type: [String], default: [] },
    },
    measurements: {
      height: Number,
      weight: Number,
      chest: Number,
      waist: Number,
      hips: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserForTraining>(
  "UserForTraining",
  UserForTrainingSchema
);

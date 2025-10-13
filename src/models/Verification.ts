import mongoose, { Document, Schema } from "mongoose";

export interface IVerification extends Document {
  email: string;
  username?: string;
  password?: string;
  dateOfBirth?: string;
  verificationCode: string;
  createdAt: Date;
}

const VerificationSchema: Schema<IVerification> = new Schema(
  {
    email: { type: String, required: true },
    username: { type: String },
    password: { type: String },
    dateOfBirth: { type: String },
    verificationCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // expire après 10 min
  },
  { versionKey: false }
);

const Verification = mongoose.model<IVerification>("Verification", VerificationSchema);

export default Verification;

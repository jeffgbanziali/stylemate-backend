// src/models/Payment.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  user: Types.ObjectId;
  subscription: Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  provider: string; // Stripe, PayPal, etc.
  transactionId?: string; // ID de transaction externe
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema<IPayment>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subscription: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "EUR" },
  status: { type: String, enum: ["pending","completed","failed"], default: "pending" },
  provider: { type: String, required: true },
  transactionId: { type: String }
}, { timestamps: true });

export default mongoose.model<IPayment>("Payment", PaymentSchema);

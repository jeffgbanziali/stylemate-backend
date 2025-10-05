// src/models/Subscription.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubscription extends Document {
  user: Types.ObjectId;
  plan: "free" | "premium";
  status: "active" | "canceled" | "expired";
  startDate: Date;
  endDate?: Date;
  stripeSessionId?: string; // pour relier à Stripe ou autre
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema<ISubscription>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["free","premium"], default: "free" },
  status: { type: String, enum: ["active","canceled","expired"], default: "active" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  stripeSessionId: { type: String }
}, { timestamps: true });

export default mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

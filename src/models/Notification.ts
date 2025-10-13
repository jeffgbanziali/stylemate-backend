// src/models/Notification.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: string; // daily_outfit, promo, etc.
  content: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>("Notification", NotificationSchema);

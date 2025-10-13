// src/models/Calendar.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICalendarEntry extends Document {
  user: Types.ObjectId;
  outfit: Types.ObjectId;
  date: Date; // jour où la tenue doit être portée
  createdAt: Date;
}

const CalendarSchema: Schema = new Schema<ICalendarEntry>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  outfit: { type: Schema.Types.ObjectId, ref: "Outfit", required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICalendarEntry>("CalendarEntry", CalendarSchema);

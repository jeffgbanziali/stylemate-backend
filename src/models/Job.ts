// src/models/Job.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  type: string; // segmentation, outfit_generation
  user: mongoose.Types.ObjectId;
  status: "pending" | "completed" | "failed";
  payload: any;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema<IJob>({
  type: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending","completed","failed"], default: "pending" },
  payload: { type: Schema.Types.Mixed },
  result: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model<IJob>("Job", JobSchema);

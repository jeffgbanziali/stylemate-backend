import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserMemory extends Document {
  user: Types.ObjectId; // ref UserForTraining
  history: Array<{
    date: Date;
    context: {
      season?: "summer" | "autumn" | "winter" | "spring" | "all";
      occasion?: string;
      weather?: { temperature?: number; condition?: string; humidity?: number; windSpeed?: number };
      time?: { dayOfWeek?: string; hour?: number };
      location?: { city?: string; climateZone?: string; region?: string };
      event?: { type?: string; formality?: string };
    };
    outfitIds: Types.ObjectId[]; // WardrobeItemForTraining[]
    feedback?: { liked?: boolean; comfort?: number; notes?: string };
    scoreSnapshot?: number; // score global au moment de la reco (optionnel)
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserMemorySchema = new Schema<IUserMemory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "UserForTraining", required: true, index: true },
    history: [
      {
        date: { type: Date, default: Date.now },
        context: {
          season: { type: String, enum: ["summer", "autumn", "winter", "spring", "all"] },
          occasion: { type: String },
          weather: {
            temperature: Number,
            condition: String,
            humidity: Number,
            windSpeed: Number,
          },
          time: { dayOfWeek: String, hour: Number },
          location: { city: String, climateZone: String, region: String },
          event: { type: String, formality: String },
        },
        outfitIds: [{ type: Schema.Types.ObjectId, ref: "WardrobeItemForTraining" }],
        feedback: {
          liked: { type: Boolean },
          comfort: { type: Number, min: 0, max: 5 },
          notes: { type: String },
        },
        scoreSnapshot: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IUserMemory>("UserMemory", UserMemorySchema, "usermemories");

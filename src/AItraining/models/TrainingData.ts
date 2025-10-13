import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITrainingData extends Document {
  user: Types.ObjectId;
  input: {
    styles: string[];
    colors: string[];
    measurements?: {
      height?: number;
      weight?: number;
      chest?: number;
      waist?: number;
      hips?: number;
    };
    season: string;
    occasion: string;
    weather?: {
      temperature?: number;
      condition?: string;  // sunny, rainy, cloudy, snowy...
      humidity?: number;
      windSpeed?: number;
    };
    time?: {
      dayOfWeek?: string;  // monday, saturday...
      hour?: number;       // 0–23
    };
    location?: {
      city?: string;
      climateZone?: string; // temperate, tropical, arid...
      region?: string;
    };
    event?: {
      type?: string;        // wedding, date, business_meeting...
      formality?: string;   // casual, semi-formal, formal
    };
  };
  output: Types.ObjectId[]; // liste d’items WardrobeItemForTraining recommandés
  labels: {
    style?: string;
    season?: string;
    occasion?: string;
    colorPalette?: string[];
    liked?: boolean;
    comfortScore?: number;   // note subjective (1–5)
    weatherMatchScore?: number; // adéquation météo
  };
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingDataSchema = new Schema<ITrainingData>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "UserForTraining",
      required: true,
    },

    input: {
      styles: { type: [String], default: [] },
      colors: { type: [String], default: [] },
      measurements: {
        height: Number,
        weight: Number,
        chest: Number,
        waist: Number,
        hips: Number,
      },
      season: {
        type: String,
        enum: ["summer", "autumn", "winter", "spring", "all"],
        required: true,
      },
      occasion: { type: String, required: true },

      // 🌦️ contexte météo
      weather: {
        temperature: { type: Number },
        condition: { type: String },
        humidity: { type: Number },
        windSpeed: { type: Number },
      },

      // ⏰ contexte temporel
      time: {
        dayOfWeek: { type: String },
        hour: { type: Number },
      },

      // 📍 localisation
      location: {
        city: { type: String },
        climateZone: { type: String },
        region: { type: String },
      },

      // 🎉 événement
      event: {
        type: { type: String },
        formality: { type: String },
      },
    },

    output: [
      {
        type: Schema.Types.ObjectId,
        ref: "WardrobeItemForTraining",
        required: true,
      },
    ],

    labels: {
      style: { type: String },
      season: { type: String },
      occasion: { type: String },
      colorPalette: { type: [String] },
      liked: { type: Boolean, default: false },
      comfortScore: { type: Number, min: 0, max: 5 },
      weatherMatchScore: { type: Number, min: 0, max: 1 },
    },

    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ITrainingData>(
  "TrainingData",
  TrainingDataSchema,
  "trainingdatas"
);

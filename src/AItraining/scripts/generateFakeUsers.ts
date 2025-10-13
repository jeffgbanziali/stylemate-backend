import "dotenv/config";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import UserForTraining, { IUserForTraining } from "../models/UserForTraining";

const MONGO_URI =
  process.env.MONGO_URI_TRAINING ||
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";


// ----- config -----
const DEFAULT_COUNT = 6000; // crée 1000 users
const COUNT =
  Number(process.env.SEED_USERS || process.argv[2]) || DEFAULT_COUNT;
const RESET = process.argv.includes("--reset"); // purger avant insertion ? (optionnel)

const STYLES = [
  // 👕 Classiques et quotidiens
  "casual",
  "smart casual",
  "business casual",
  "classique",
  "minimalist",
  "urban",
  "streetwear",
  "sportwear",
  "athleisure",
  "preppy",
  "trendy",
  "retro",
  "vintage",
  "modern",
  "basic",
  "comfortable",

  // 🧳 Élégants et professionnels
  "formal",
  "business",
  "executive",
  "evening",
  "elegant",
  "chic",
  "luxury",
  "dapper",
  "sophisticated",

  // 🖤 Alternatifs / identitaires
  "punk",
  "gothic",
  "emo",
  "grunge",
  "rock",
  "indie",
  "bohemian",
  "hippie",
  "artsy",
  "avant-garde",
  "futuristic",
  "cyberpunk",
  "techwear",

  // 🏖️ Saisonniers et contextuels
  "beachwear",
  "summerwear",
  "winterwear",
  "mountainwear",
  "rainwear",
  "travelwear",

  // 💃 Culturels / régionaux
  "afro-urban",
  "asian-street",
  "k-fashion",
  "j-fashion",
  "european-classic",
  "american-preppy",
  "mediterranean",
  "tropical",

  // 👗 Thématiques
  "romantic",
  "art-deco",
  "vintage-50s",
  "vintage-80s",
  "military",
  "cowboy",
  "school-style",
  "y2k",
  "grannycore",
  "barbiecore",
  "dark-academia",
  "light-academia",
  "clean-girl",
  "old-money",
  "new-money",
  "coastal-grandma",
  "quiet-luxury"
] as const;

const COLORS = [
  // 🎨 Neutres
  "black",
  "white",
  "grey",
  "beige",
  "ivory",
  "cream",
  "taupe",
  "brown",
  "camel",
  "navy",

  // 🌈 Couleurs primaires
  "red",
  "blue",
  "yellow",

  // 🌷 Couleurs secondaires
  "green",
  "orange",
  "purple",

  // 🩵 Tons pastel
  "pastel-pink",
  "baby-blue",
  "mint-green",
  "lavender",
  "peach",
  "soft-yellow",

  // 🧊 Tons froids
  "dark-blue",
  "teal",
  "cyan",
  "forest-green",
  "indigo",
  "slate",

  // 🔥 Tons chauds
  "burgundy",
  "rust",
  "terracotta",
  "mustard",
  "gold",
  "copper",

  // ⚫ Métalliques / spéciaux
  "silver",
  "gold",
  "bronze",
  "metallic",
  "denim",
  "off-white",
  "charcoal"
] as const;const MOODS = [
  "relaxed",
  "confident",
  "romantic",
  "bold",
  "mysterious",
  "adventurous",
  "professional",
  "creative",
  "lazy-day",
  "energetic"
];



function pickMany<T>(arr: readonly T[], min: number, max: number): T[] {
  const n = faker.number.int({ min, max });
  return faker.helpers.arrayElements(arr as T[], n);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected:", MONGO_URI);

  if (RESET) {
    await UserForTraining.deleteMany({});
    console.log("🧹 Cleared collection: userfortrainings");
  }

  const batchSize = 200;
  let created = 0;

  for (let start = 0; start < COUNT; start += batchSize) {
    const end = Math.min(start + batchSize, COUNT);
    const batch: Partial<IUserForTraining>[] = [];

    for (let i = start; i < end; i++) {
      // emails déterministes pour éviter les doublons
      const email = `user_${Date.now()}_${i}@training.local`;
      const username = faker.internet.userName();

      batch.push({
        email,
        username,
        dateOfBirth: faker.date.birthdate({ min: 1960, max: 2005, mode: 'year' }).toISOString().split('T')[0],
        preferences: {
            style: pickMany(STYLES, 1, 3),
            color: pickMany(COLORS, 2, 5),
        },
        measurements: {
            height: faker.number.int({ min: 155, max: 195 }),
            weight: faker.number.int({ min: 50, max: 100 }),
            chest: faker.number.int({ min: 85, max: 115 }),
            waist: faker.number.int({ min: 70, max: 100 }),
            hips: faker.number.int({ min: 85, max: 110 }),
        },
  provider: "training",
        });

    }

    await UserForTraining.insertMany(batch);
    created += batch.length;
    console.log(`👤 Inserted users: ${created}/${COUNT}`);
  }

  const total = await UserForTraining.countDocuments();
  console.log(`🎉 Done. userfortrainings count = ${total}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});

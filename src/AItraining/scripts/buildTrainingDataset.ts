/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
import fs from "fs";
import path from "path";
import UserForTraining, { IUserForTraining } from "../models/UserForTraining";
import WardrobeItemForTraining, { IWardrobeItemForTraining } from "../models/WardrobeItemForTraining";
import TrainingData, { ITrainingData } from "../models/TrainingData";

// --------------------------- CONFIG ---------------------------

const MONGO_URI = "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";
const TARGET_COUNT = 200000; 
const VARIATIONS_PER_CONTEXT = 50;

const OUTPUT_DIR = path.join(__dirname, "../../datasets/processed");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// --------------------------- TYPES ---------------------------

type SeasonType = "summer" | "autumn" | "winter" | "spring" | "all";
type OccasionType = "casual" | "work" | "evening" | "sport" | "party" | "travel";

// --------------------------- UTILS ---------------------------

function randomPick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWeather(season: string) {
  switch (season) {
    case "winter":
      return { temperature: Math.floor(Math.random() * 5), condition: "snowy", humidity: 70, windSpeed: 15 };
    case "summer":
      return { temperature: 25 + Math.floor(Math.random() * 10), condition: "sunny", humidity: 40, windSpeed: 5 };
    case "spring":
      return { temperature: 15 + Math.floor(Math.random() * 10), condition: "mild", humidity: 55, windSpeed: 8 };
    case "autumn":
      return { temperature: 10 + Math.floor(Math.random() * 10), condition: "cloudy", humidity: 60, windSpeed: 10 };
    default:
      return { temperature: 20, condition: "variable", humidity: 50, windSpeed: 5 };
  }
}

function generateTimeContext() {
  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const hour = Math.floor(Math.random() * 24);
  return { dayOfWeek: randomChoice(days), hour };
}

function generateLocation() {
  const cities = [
    { city: "Paris", climateZone: "temperate", region: "Europe" },
    { city: "Dakar", climateZone: "tropical", region: "Africa" },
    { city: "Montreal", climateZone: "cold", region: "America" },
    { city: "Tokyo", climateZone: "humid", region: "Asia" },
  ];
  return randomChoice(cities);
}

function generateEvent(occasion: string) {
  const mapping: Record<string, any> = {
    casual: { type: "outing", formality: "casual" },
    work: { type: "meeting", formality: "semi-formal" },
    party: { type: "party", formality: "semi-formal" },
    evening: { type: "dinner", formality: "formal" },
    sport: { type: "training", formality: "casual" },
    travel: { type: "trip", formality: "casual" },
  };
  return mapping[occasion] || { type: "daily", formality: "casual" };
}

// Génère un score de confort météo-vêtement
function computeComfortScore(outfit: IWardrobeItemForTraining[], season: string): number {
  const tooHot = season === "summer" && outfit.some(i => i.material?.includes("wool"));
  const tooCold = season === "winter" && outfit.some(i => i.material?.includes("linen"));
  if (tooHot || tooCold) return Math.random() * 2 + 1;
  return Math.random() * 2 + 3; // entre 1 et 5
}

// --------------------------- COMBO LOGIC ---------------------------

function selectOutfitBySeason(
  items: IWardrobeItemForTraining[],
  season: SeasonType
): IWardrobeItemForTraining[] {
  const tops = items.filter((item) => item.category === "top");
  const bottoms = items.filter((item) => item.category === "bottom");
  const shoes = items.filter((item) => item.category === "shoes");
  const outerwears = items.filter((item) => item.category === "outerwear");
  const accessories = items.filter((item) => item.category === "accessory");

  let outfit: IWardrobeItemForTraining[] = [];

  switch (season) {
    case "winter":
      outfit = [
        ...randomPick(outerwears, 1),
        ...randomPick(tops, 1),
        ...randomPick(bottoms, 1),
        ...randomPick(shoes, 1),
        ...randomPick(accessories, 1),
      ];
      break;
    case "autumn":
      outfit = [
        ...randomPick(outerwears, 1),
        ...randomPick(tops, 1),
        ...randomPick(bottoms, 1),
        ...randomPick(shoes, 1),
      ];
      break;
    case "spring":
    case "summer":
    default:
      outfit = [
        ...randomPick(tops, 1),
        ...randomPick(bottoms, 1),
        ...randomPick(shoes, 1),
        ...randomPick(accessories, 1),
      ];
  }

  return outfit.filter(Boolean);
}

// --------------------------- MAIN ---------------------------

async function buildTrainingDataset(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  const users = (await UserForTraining.find({})) as IUserForTraining[];
  const allItems = (await WardrobeItemForTraining.find({})) as IWardrobeItemForTraining[];
  const trainingData: Array<Partial<ITrainingData>> = [];

  console.log(`👥 ${users.length} utilisateurs, ${allItems.length} vêtements disponibles.`);

  const seasons: SeasonType[] = ["summer", "autumn", "winter", "spring"];
  const occasions: OccasionType[] = ["casual", "work", "evening", "sport", "party", "travel"];
  const mixedSeasons: [SeasonType, SeasonType][] = [["autumn", "winter"], ["spring", "summer"]];

  for (const user of users) {
    const wardrobe = allItems.filter(
      (item) => item.user?.toString() === (user._id as Types.ObjectId).toString()
    );
    if (wardrobe.length < 5) continue;

    const styles = user.preferences?.style ?? [];
    const colors = user.preferences?.color ?? [];

    for (const season of seasons) {
      for (const occasion of occasions) {
        const contextItems = wardrobe.filter(
          (item) =>
            (item.season === season || item.season === "all") &&
            (item.occasion?.includes(occasion) || item.occasion?.includes("casual"))
        );
        if (contextItems.length < 3) continue;

        for (let i = 0; i < VARIATIONS_PER_CONTEXT; i++) {
          const outfit = selectOutfitBySeason(contextItems, season);
          if (outfit.length < 3) continue;

          const weather = generateWeather(season);
          const time = generateTimeContext();
          const location = generateLocation();
          const event = generateEvent(occasion);
          const comfortScore = computeComfortScore(outfit, season);

          const colorPalette = outfit.map((item) => item.color).filter((c): c is string => !!c);
          const liked = Math.random() < 0.8;
          const score = liked ? Math.random() * 0.2 + 0.8 : Math.random() * 0.4 + 0.3;

          trainingData.push({
            user: user._id as Types.ObjectId,
            input: {
              styles,
              colors,
              measurements: user.measurements,
              season,
              occasion,
              weather,
              time,
              location,
              event,
            },
            output: outfit.map((item) => item._id as Types.ObjectId),
            labels: {
              style: styles[0] || "casual",
              season,
              occasion,
              colorPalette,
              liked,
              comfortScore,
              weatherMatchScore: Math.random() * 0.3 + 0.7,
            },
            score,
          });

          if (trainingData.length >= TARGET_COUNT) break;
        }
        if (trainingData.length >= TARGET_COUNT) break;
      }
      if (trainingData.length >= TARGET_COUNT) break;
    }

    if (trainingData.length >= TARGET_COUNT) break;
  }

  console.log(`🧩 ${trainingData.length} ensembles générés.`);

  await TrainingData.insertMany(trainingData, { ordered: false });
  console.log(`✅ ${trainingData.length} TrainingData enregistrés dans MongoDB.`);

  // --------------------------- EXPORT ---------------------------

  const jsonPath = path.join(OUTPUT_DIR, "training_data_v3.5.json");
  const csvPath = path.join(OUTPUT_DIR, "training_data_v3.5.csv");

  fs.writeFileSync(jsonPath, JSON.stringify(trainingData, null, 2));

  const csvHeader = "user,style,season,occasion,liked,score,comfortScore,weather,day,hour,output\n";
  const csvRows = trainingData.map((data) => {
    const w = data.input?.weather;
    const t = data.input?.time;
    return [
      data.user,
      data.labels?.style,
      data.labels?.season,
      data.labels?.occasion,
      data.labels?.liked,
      data.score?.toFixed(2),
      data.labels?.comfortScore?.toFixed(1),
      `${w?.temperature ?? ""}°${w?.condition ?? ""}`,
      t?.dayOfWeek ?? "",
      t?.hour ?? "",
      (Array.isArray(data.output) ? data.output : []).join("|"),
    ].join(",");
  });
  fs.writeFileSync(csvPath, csvHeader + csvRows.join("\n"));

  console.log(`💾 Export JSON: ${jsonPath}`);
  console.log(`💾 Export CSV: ${csvPath}`);

  await mongoose.disconnect();
  console.log("🏁 Dataset IA v3.5 construit et sauvegardé !");
}

// --------------------------- EXECUTION ---------------------------

buildTrainingDataset().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});

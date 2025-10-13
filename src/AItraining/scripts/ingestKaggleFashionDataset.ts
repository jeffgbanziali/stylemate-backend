import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

// === Mapping entre les catégories Kaggle et ton modèle enrichi ===
const CATEGORY_MAP: Record<string, string> = {
  apparel: "top",
  topwear: "top",
  bottomwear: "bottom",
  footwear: "shoes",
  accessories: "accessory",
  bag: "bag",
  outerwear: "outerwear",
};

// === Correspondance saison Kaggle → StyleMate ===
const SEASON_MAP: Record<string, string> = {
  fall: "autumn",
  winter: "winter",
  summer: "summer",
  spring: "spring",
  all: "all",
};

// === Dossier public d’images Kaggle ===
const BASE_IMAGE_URL =
  "https://storage.googleapis.com/fashion-dataset/images/";

// === Déduire sous-catégorie à partir du CSV ===
function inferSubCategory(articleType: string): string | undefined {
  if (!articleType) return undefined;
  const type = articleType.toLowerCase();

  if (type.includes("t-shirt") || type.includes("tee")) return "t-shirt";
  if (type.includes("shirt")) return "shirt";
  if (type.includes("jean")) return "jeans";
  if (type.includes("trouser") || type.includes("pant")) return "trousers";
  if (type.includes("short")) return "shorts";
  if (type.includes("skirt")) return "skirt";
  if (type.includes("shoe") || type.includes("sneaker")) return "sneakers";
  if (type.includes("boot")) return "boots";
  if (type.includes("jacket")) return "jacket";
  if (type.includes("coat")) return "coat";
  if (type.includes("sweater") || type.includes("pullover")) return "sweater";
  if (type.includes("scarf")) return "scarf";
  if (type.includes("belt")) return "belt";
  if (type.includes("bag") || type.includes("handbag")) return "handbag";
  if (type.includes("watch")) return "watch";
  if (type.includes("hat") || type.includes("cap")) return "hat";
  if (type.includes("hoodie")) return "hoodie";
  return undefined;
}

// === Déduire le genre depuis la catégorie produit ===
function inferGender(genderField: string): "male" | "female" | "unisex" {
  if (!genderField) return "unisex";
  const g = genderField.toLowerCase();
  if (g.includes("women")) return "female";
  if (g.includes("men")) return "male";
  return "unisex";
}

// === Approximation du range de température selon la saison ===
function inferTemperatureRange(season: string) {
  switch (season) {
    case "summer":
      return { min: 20, max: 40 };
    case "winter":
      return { min: -5, max: 15 };
    case "spring":
      return { min: 10, max: 25 };
    case "autumn":
      return { min: 8, max: 22 };
    default:
      return { min: 0, max: 35 };
  }
}

// === Déduction du motif / pattern depuis le nom du produit ===
function inferPattern(name: string): string | undefined {
  const n = name.toLowerCase();
  if (n.includes("stripe")) return "striped";
  if (n.includes("check") || n.includes("plaid")) return "checked";
  if (n.includes("print")) return "printed";
  if (n.includes("solid")) return "solid";
  if (n.includes("floral")) return "floral";
  if (n.includes("graphic")) return "graphic";
  return undefined;
}

// === Déduction du niveau de formalité (occasion) ===
function inferOccasion(usage: string): string[] {
  const u = usage?.toLowerCase() || "";
  if (u.includes("casual")) return ["casual"];
  if (u.includes("formal") || u.includes("office")) return ["formal"];
  if (u.includes("party")) return ["party"];
  if (u.includes("sports")) return ["sports"];
  if (u.includes("travel")) return ["travel"];
  return ["daily"];
}

async function ingestKaggleData() {
  await mongoose.connect(MONGO_URI);
  const results: any[] = [];

  console.log("📥 Lecture du dataset Kaggle enrichi...");

  fs.createReadStream("src/AItraining/datasets/raw/fashion.csv")
    .pipe(csv())
    .on("data", (data) => {
      const id = data.id?.trim();
      if (!id) return;

      const imageUrl = `${BASE_IMAGE_URL}${id}.jpg`;
      const category =
        CATEGORY_MAP[data.masterCategory?.toLowerCase()] || "top";
      const season = SEASON_MAP[data.season?.toLowerCase()] || "all";

      const subCategory = inferSubCategory(data.articleType);
      const gender = inferGender(data.gender);
      const pattern = inferPattern(data.productDisplayName || "");
      const temperatureRange = inferTemperatureRange(season);
      const occasion = inferOccasion(data.usage);

      results.push({
        user: null,
        name: data.productDisplayName?.trim() || "Unknown Item",
        category,
        subCategory,
        color: data.baseColour?.toLowerCase() || "unspecified",
        pattern,
        material: data.articleType?.toLowerCase() || "unknown",
        brand: data.brand?.trim() || undefined,
        fit: data.gender?.toLowerCase().includes("slim") ? "slim" : undefined,
        gender,
        imageUrl,
        styleTags: [data.subCategory?.toLowerCase()].filter(Boolean),
        season,
        occasion,
        temperatureRange,
        weatherSuitability: [season],
        locationTags: ["urban"],
        source: "kaggle",
        createdAt: new Date(),
      });
    })
    .on("end", async () => {
      console.log(`📦 ${results.length} lignes valides trouvées`);
      if (results.length > 0) {
        try {
          await WardrobeItemForTraining.insertMany(results, { ordered: false });
          console.log(`✅ ${results.length} vêtements ajoutés depuis Kaggle`);
        } catch (err: any) {
          console.error("⚠️ Erreur pendant l'insertion:", err.message);
        }
      } else {
        console.warn("⚠️ Aucun vêtement valide trouvé.");
      }

      await mongoose.disconnect();
      console.log("🏁 Import Kaggle enrichi terminé.");
    });
}

ingestKaggleData().catch((err) => {
  console.error("❌ Erreur d'import Kaggle:", err);
  process.exit(1);
});

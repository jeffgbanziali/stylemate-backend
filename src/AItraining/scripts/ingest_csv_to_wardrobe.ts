import fs from "fs";
import path from "path";
import csv from "csv-parser";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";
const RAW_DIR = path.join(__dirname, "../datasets/raw");

const CATEGORY_KEYWORDS: Record<string, { category: string; subCategory?: string }> = {
  shirt: { category: "top", subCategory: "shirt" },
  blouse: { category: "top", subCategory: "blouse" },
  tshirt: { category: "top", subCategory: "t-shirt" },
  jeans: { category: "bottom", subCategory: "jeans" },
  trouser: { category: "bottom", subCategory: "trousers" },
  blazer: { category: "outerwear", subCategory: "blazer" },
  jacket: { category: "outerwear", subCategory: "jacket" },
  coat: { category: "outerwear", subCategory: "coat" },
  dress: { category: "dress", subCategory: "dress" },
  sneaker: { category: "shoes", subCategory: "sneakers" },
  boot: { category: "shoes", subCategory: "boots" },
  loafer: { category: "shoes", subCategory: "loafers" },
  heel: { category: "shoes", subCategory: "heels" },
  bag: { category: "bag", subCategory: "handbag" },
  scarf: { category: "accessory", subCategory: "scarf" },
  watch: { category: "accessory", subCategory: "watch" },
};

function detectCategory(name: string): { category: string; subCategory: string } {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_KEYWORDS)) {
    const match = CATEGORY_KEYWORDS[key];
    if (lower.includes(key)) {
      return {
        category: match.category,
        subCategory: match.subCategory || "misc",
      };
    }
  }
  return { category: "top", subCategory: "shirt" };
}

function detectGender(name: string, url: string): "male" | "female" | "unisex" {
  const lower = name.toLowerCase() + " " + url.toLowerCase();
  if (lower.includes("/women/") || lower.includes("women") || lower.includes("lady") || lower.includes("dress"))
    return "female";
  if (lower.includes("/men/") || lower.includes("men") || lower.includes("man") || lower.includes("suit"))
    return "male";
  return "unisex";
}

function detectBrandCategory(brand?: string): "luxury" | "fast_fashion" | "premium" | "mass_market" {
  if (!brand) return "mass_market";
  const lower = brand.toLowerCase();
  if (["gucci", "prada", "armani", "dior", "saint laurent"].some((b) => lower.includes(b)))
    return "luxury";
  if (["zara", "hm", "uniqlo", "asos"].some((b) => lower.includes(b)))
    return "fast_fashion";
  if (["ralph lauren", "calvin klein", "boss"].some((b) => lower.includes(b)))
    return "premium";
  return "mass_market";
}

function cleanPrice(raw: string): number {
  if (!raw) return 0;
  const num = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  return parseFloat(num) || 0;
}

async function ingestCSVFiles() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".csv"));
  if (!files.length) {
    console.log("⚠️ Aucun fichier CSV trouvé.");
    await mongoose.disconnect();
    return;
  }

  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    const source = file.replace(".csv", "");
    console.log(`📥 Lecture du fichier : ${filePath}`);

    const items: any[] = [];
    await new Promise<void>((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => items.push(row))
        .on("end", resolve);
    });

    console.log(`🔍 ${items.length} lignes chargées depuis ${file}`);

    let newItemsCount = 0;
    let existingItemsCount = 0;

    for (const [index, item] of items.entries()) {
      const name =
        item.description ||
        item.name ||
        item.title ||
        item["product_name"] ||
        `item_${index}`;

      let imageUrl =
        item["image-src"] ||
        item["image2-src"] ||
        item.image ||
        item.imageUrl ||
        "";

      if (imageUrl && imageUrl.startsWith("//")) {
        imageUrl = `https:${imageUrl}`;
      }

      const url = item.url || item.link || item["product_link"] || "";
      const brand = item.brand || "Unknown";
      const price = cleanPrice(item.price || item["price_value"] || "0");

      if (!name || !imageUrl) continue; // skip invalid rows

      // 🔍 Vérifier si déjà en base
      const exists = await WardrobeItemForTraining.findOne({
        name,
        brand,
        imageUrl,
      }).lean();

      if (exists) {
        existingItemsCount++;
        continue;
      }

      const description =
        item.description || item.details || item["product_description"] || "";

      const { category, subCategory } = detectCategory(name);
      const gender = detectGender(name, url);
      const brandCategory = detectBrandCategory(brand);

      const newItem = {
        name,
        brand,
        category,
        subCategory,
        gender,
        imageUrl,
        color: item.color || "unspecified",
        material: item.material || "unspecified",
        descriptionAI: description,
        source,
        brandCategory,
        formalityLevel: category === "outerwear" || category === "dress" ? "semi_formal" : "smart_casual",
        occasionTypes:
          category === "dress"
            ? ["evening", "date", "wedding"]
            : category === "outerwear"
            ? ["business", "travel"]
            : ["casual", "daily"],
        qualityTier: brandCategory === "luxury" ? "luxury" : "standard",
        styleArchetype: brandCategory === "luxury" ? "business" : "classic",
        dataQuality: {
          confidenceScore: imageUrl ? 0.95 : 0.4,
          isManuallyReviewed: false,
          needsReview: !imageUrl,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await WardrobeItemForTraining.create(newItem);
      newItemsCount++;
    }

    console.log(
      `✅ Fichier ${file}: ${newItemsCount} nouveaux / ${existingItemsCount} déjà en base`
    );
  }

  await mongoose.disconnect();
  console.log("🏁 Importation terminée avec succès !");
}

ingestCSVFiles().catch((err) => {
  console.error("❌ Erreur d’import :", err);
  process.exit(1);
});

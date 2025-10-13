import fs from "fs";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

// ✅ Mappings Nike → modèle interne StyleMate
const CATEGORY_MAP: Record<string, string> = {
  FOOTWEAR: "shoes",
  APPAREL: "top",
  ACCESSORIES: "accessory",
};

const SUBCATEGORY_MAP: Record<string, string> = {
  FOOTWEAR: "sneakers",
  APPAREL: "t-shirt",
};

// ✅ Déduire le genre à partir du sous-titre
function inferGender(subTitle: string): "male" | "female" | "unisex" {
  const lower = subTitle?.toLowerCase() || "";
  if (lower.includes("men")) return "male";
  if (lower.includes("women")) return "female";
  return "unisex";
}

// ✅ Déterminer la saison selon le type de produit
function inferSeason(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("air force") || lower.includes("sneaker")) return "all";
  if (lower.includes("boot")) return "winter";
  if (lower.includes("sandals")) return "summer";
  return "all";
}

// ✅ Déduire le pattern
function inferPattern(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("print")) return "printed";
  if (lower.includes("leather")) return "leather";
  if (lower.includes("suede")) return "suede";
  return "solid";
}

// ✅ Génération des tags de style
function getStyleTags(title: string, subTitle: string): string[] {
  const tags: string[] = [];
  const lower = title.toLowerCase() + " " + subTitle.toLowerCase();

  if (lower.includes("air force")) tags.push("classic", "streetwear");
  if (lower.includes("jordan")) tags.push("sport", "basketball");
  if (lower.includes("running")) tags.push("running", "performance");
  if (lower.includes("retro")) tags.push("vintage");
  if (lower.includes("low")) tags.push("low-cut");
  if (lower.includes("mid")) tags.push("mid-cut");
  if (lower.includes("high")) tags.push("high-cut");

  return [...new Set(tags)];
}

// ✅ Occasions probables
function getOccasions(title: string): string[] {
  const lower = title.toLowerCase();
  const occasions = ["daily"];
  if (lower.includes("sport") || lower.includes("running")) occasions.push("sports");
  if (lower.includes("air force") || lower.includes("jordan")) occasions.push("streetwear", "casual");
  if (lower.includes("boot")) occasions.push("outdoor");
  return [...new Set(occasions)];
}

// ✅ Saison → plage de température
function getTemperatureRange(season: string) {
  switch (season) {
    case "summer":
      return { min: 20, max: 35 };
    case "winter":
      return { min: -5, max: 15 };
    default:
      return { min: 5, max: 30 };
  }
}

async function ingestNikeData() {
  await mongoose.connect(MONGO_URI);
  console.log("📥 Lecture du fichier JSON Nike...");

  try {
    const rawData = fs.readFileSync("src/AItraining/datasets/raw/dataset_nike-product-scraper_2025-10-13_00-50-09-852.json");
    
    const nikeData = JSON.parse(rawData.toString());


    console.log(`📦 ${nikeData.length} produits Nike trouvés`);

    const validProducts = nikeData.filter((entry: any) => entry?.product?.copy?.title);

    console.log(`🔄 Traitement de ${validProducts.length} produits valides...`);

    const itemsToInsert = validProducts.map((entry: any, index: number) => {
      const product = entry.product;
      const title = product.copy.title || "Nike Product";
      const subTitle = product.copy.subTitle || "";
      const colorLabel = product.displayColors?.simpleColor?.label || "unspecified";
      const season = inferSeason(title);
      const gender = inferGender(subTitle);
      const category = CATEGORY_MAP[product.productType] || "shoes";
      const subCategory = SUBCATEGORY_MAP[product.productType] || "sneakers";
      const pattern = inferPattern(title);
      const styleTags = getStyleTags(title, subTitle);
      const occasions = getOccasions(title);
      const temperatureRange = getTemperatureRange(season);

      const imageUrl =
        product.colorwayImages?.portraitURL ||
        product.colorwayImages?.squarishURL ||
        "https://via.placeholder.com/400x400/cccccc/000000?text=Nike+Product";

      const price = product.prices?.currentPrice || 0;
      const currency = product.prices?.currency || "USD";

      return {
        user: null,
        name: title,
        category,
        subCategory,
        color: colorLabel.toLowerCase(),
        pattern,
        material: title.toLowerCase().includes("leather") ? "leather" : "synthetic",
        brand: "Nike",
        fit: "standard",
        gender,
        imageUrl,
        styleTags,
        season,
        occasion: occasions,
        temperatureRange,
        weatherSuitability: season === "winter" ? ["cold", "dry"] : ["mild", "warm"],
        locationTags: ["urban", "sport"],
        source: "nike_dataset_2025",
        isFavorite: false,
        usageCount: 0,
        metadata: {
          nikeProductCode: product.productCode,
          nikeProductId: product.globalProductId,
          price,
          currency,
          badge: product.badgeLabel || null,
          url: product.pdpUrl?.url,
        },
        createdAt: new Date(),
      };
    });

    console.log(`🧩 Préparation de ${itemsToInsert.length} items à insérer...`);

    if (itemsToInsert.length > 0) {
      try {
        const batchSize = 500;
        let inserted = 0;
        for (let i = 0; i < itemsToInsert.length; i += batchSize) {
          const batch = itemsToInsert.slice(i, i + batchSize);
          await WardrobeItemForTraining.insertMany(batch, { ordered: false });
          inserted += batch.length;
          console.log(`✅ Lot ${Math.floor(i / batchSize) + 1}: ${inserted}/${itemsToInsert.length}`);
        }
        console.log(`🎉 ${inserted} produits Nike ajoutés avec succès`);
      } catch (err) {
        console.error("⚠️ Erreur pendant l'insertion:", err);
      }
    } else {
      console.log("❌ Aucun produit valide à insérer");
    }

    await mongoose.disconnect();
    console.log("🏁 Import Nike terminé !");
  } catch (err) {
    console.error("❌ Erreur lors de l'import Nike:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

ingestNikeData().catch((err) => {
  console.error("❌ Erreur d'import Nike:", err);
  process.exit(1);
});

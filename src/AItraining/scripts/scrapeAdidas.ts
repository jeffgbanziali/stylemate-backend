import fs from "fs";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

// ✅ Mappings Adidas → modèle interne StyleMate
const CATEGORY_MAP: Record<string, string> = {
  "Women > Shoes": "shoes",
  "Men > Shoes": "shoes",
  "Women > Clothing": "top",
  "Men > Clothing": "top",
};

const SUBCATEGORY_MAP: Record<string, string> = {
  "Women > Shoes": "sneakers",
  "Men > Shoes": "sneakers",
  "Women > Clothing": "t-shirt",
  "Men > Clothing": "t-shirt",
};

// ✅ Déduire le genre à partir de la catégorie
function inferGender(category: string): "male" | "female" | "unisex" {
  if (category?.includes("Women")) return "female";
  if (category?.includes("Men")) return "male";
  return "unisex";
}

// ✅ Déterminer la saison selon le type de produit
function inferSeason(info: any): string {
  const color = info?.color?.toLowerCase() || "";
  const material = info?.material?.toLowerCase() || "";
  
  if (color.includes("white") || color.includes("light") || material.includes("mesh")) return "summer";
  if (color.includes("black") || color.includes("dark") || material.includes("leather")) return "winter";
  return "all";
}

// ✅ Déduire le fit à partir des informations produit
function inferFit(info: any): string {
  const fit = info?.fit?.toLowerCase() || "";
  if (fit.includes("regular")) return "regular";
  if (fit.includes("slim")) return "slim";
  if (fit.includes("wide")) return "relaxed";
  return "regular";
}

// ✅ Déduire le pattern
function inferPattern(title: string, color: string, info: any): string {
  const lowerTitle = title.toLowerCase();
  const material = info?.material?.toLowerCase() || "";
  
  if (lowerTitle.includes("snakeskin") || lowerTitle.includes("print")) return "printed";
  if (lowerTitle.includes("metallic") || material.includes("metallic")) return "metallic";
  if (lowerTitle.includes("pony hair")) return "textured";
  if (material.includes("suede") || material.includes("nubuck")) return "textured";
  return "solid";
}

// ✅ Génération des tags de style
function getStyleTags(title: string, info: any, category: string): string[] {
  const tags: string[] = ["sporty", "casual"];
  const lowerTitle = title.toLowerCase();
  const material = info?.material?.toLowerCase() || "";

  // Tags basés sur le modèle
  if (lowerTitle.includes("samba")) tags.push("classic", "retro", "streetwear");
  if (lowerTitle.includes("og")) tags.push("vintage", "heritage");
  
  // Tags basés sur les matériaux
  if (material.includes("leather")) tags.push("premium");
  if (material.includes("suede")) tags.push("textured", "luxury");
  if (material.includes("gum")) tags.push("utility");
  
  // Tags basés sur les collaborations
  if (lowerTitle.includes("liberty") || lowerTitle.includes("london")) {
    tags.push("collaboration", "fashion", "printed");
  }

  return [...new Set(tags)];
}

// ✅ Occasions probables
function getOccasions(title: string, category: string, info: any): string[] {
  const lowerTitle = title.toLowerCase();
  const occasions = ["daily", "casual", "urban"];
  
  if (lowerTitle.includes("samba")) {
    occasions.push("streetwear", "lifestyle", "outing");
  }
  
  if (info?.type?.includes("TRAINERS")) {
    occasions.push("walking", "comfort");
  }
  
  return [...new Set(occasions)];
}

// ✅ Saison → plage de température
function getTemperatureRange(season: string) {
  switch (season) {
    case "summer":
      return { min: 15, max: 35 };
    case "winter":
      return { min: -5, max: 15 };
    case "spring":
    case "autumn":
      return { min: 10, max: 25 };
    default:
      return { min: 5, max: 30 };
  }
}

// ✅ Déduire la compatibilité météo
function getWeatherSuitability(season: string, category: string, material: string): string[] {
  const suitability: string[] = [];
  const lowerMaterial = material.toLowerCase();
  
  if (season === "winter" || lowerMaterial.includes("leather")) {
    suitability.push("cold", "dry");
  }
  if (season === "summer" || lowerMaterial.includes("mesh")) {
    suitability.push("warm", "sunny");
  }
  if (category.includes("shoes") && lowerMaterial.includes("gum")) {
    suitability.push("all-weather", "grip");
  }
  
  return suitability.length > 0 ? suitability : ["dry", "mild"];
}

// ✅ Déduire les tags de localisation
function getLocationTags(styleTags: string[]): string[] {
  const locations: string[] = ["urban", "city"];
  
  if (styleTags.includes("streetwear")) locations.push("downtown", "shopping");
  if (styleTags.includes("sporty")) locations.push("gym", "outdoor");
  if (styleTags.includes("classic")) locations.push("cafe", "work");
  
  return [...new Set(locations)];
}

// ✅ Nettoyer et formater les couleurs
function cleanColor(color: string): string {
  if (!color) return "unspecified";
  
  return color.toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace("cloud-white", "white")
    .replace("core-black", "black")
    .replace("cream-white", "cream")
    .replace("wonder-white", "white")
    .replace("off-white", "off-white");
}

// ✅ Extraire les matériaux de la description
function extractMaterial(info: any): string {
  const material = info?.material || "";
  const specifications = info?.specifications || [];
  
  if (material) return material;
  
  // Extraire des spécifications
  const materialSpecs = specifications.filter((spec: string) => 
    spec.toLowerCase().includes("leather") || 
    spec.toLowerCase().includes("suede") ||
    spec.toLowerCase().includes("textile") ||
    spec.toLowerCase().includes("rubber") ||
    spec.toLowerCase().includes("synthetic")
  );
  
  return materialSpecs.length > 0 ? materialSpecs[0] : "leather";
}

async function ingestAdidasData() {
  await mongoose.connect(MONGO_URI);
  console.log("📥 Lecture du fichier JSON Adidas...");

  try {
    const rawData = fs.readFileSync("src/AItraining/datasets/raw/dataset_adidas-store-scraper_2025-10-13_00-10-23-703.json");
    const adidasData = JSON.parse(rawData.toString());

    console.log(`📦 ${adidasData.length} produits Adidas trouvés`);

    const itemsToInsert = [];

    for (const product of adidasData) {
      if (!product.title || !product.media?.main) continue;

      const category = CATEGORY_MAP[product.category?.fullPath] || "shoes";
      const subCategory = SUBCATEGORY_MAP[product.category?.fullPath] || "sneakers";
      const gender = inferGender(product.category?.fullPath);
      const season = inferSeason(product.info);
      const fit = inferFit(product.info);
      const material = extractMaterial(product.info);
      const styleTags = getStyleTags(product.title, product.info, category);
      const occasions = getOccasions(product.title, category, product.info);
      const temperatureRange = getTemperatureRange(season);
      const weatherSuitability = getWeatherSuitability(season, category, material);
      const locationTags = getLocationTags(styleTags);
      const color = cleanColor(product.info?.color);
      const pattern = inferPattern(product.title, color, product.info);

      const item = {
        user: null,
        name: product.title,
        category,
        subCategory,
        color,
        pattern,
        material,
        brand: "ADIDAS Originals",
        fit,
        gender,
        imageUrl: product.media.main,
        styleTags,
        season,
        occasion: occasions,
        temperatureRange,
        weatherSuitability,
        locationTags,
        source: "adidas_dataset_2025",
        isFavorite: false,
        usageCount: 0,
        lastWornDate: null,
        metadata: {
          adidasSKU: product.idCodes?.SKU,
          modelNumber: product.idCodes?.modelNumber,
          price: product.pricing?.salePrice,
          currency: product.pricing?.currencySymbol === "$" ? "USD" : "EUR",
          rating: product.rating?.itemRating,
          reviewCount: product.rating?.itemReviews,
          isAvailable: product.isAvailable,
          isSpecialLaunch: product.info?.isSpecialLaunch,
          colorDescription: product.info?.color,
          specifications: product.info?.specifications,
          variants: product.variants?.length || 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      itemsToInsert.push(item);
    }

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
        
        console.log(`🎉 ${inserted} produits Adidas ajoutés avec succès`);
      } catch (err) {
        console.error("⚠️ Erreur pendant l'insertion:", err);
      }
    } else {
      console.log("❌ Aucun produit valide à insérer");
    }

    await mongoose.disconnect();
    console.log("🏁 Import Adidas terminé !");
  } catch (err) {
    console.error("❌ Erreur lors de l'import Adidas:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Exécuter l'import
ingestAdidasData().catch((err) => {
  console.error("❌ Erreur d'import Adidas:", err);
  process.exit(1);
});
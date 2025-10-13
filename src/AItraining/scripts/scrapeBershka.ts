import fs from "fs";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

// ✅ Mappings Bershka → modèle interne StyleMate
const CATEGORY_MAP: Record<string, string> = {
  "men/clothes/jeans-n3676": "bottom",
  "women/clothes/jeans-n3676": "bottom",
  "men/clothes/trousers": "bottom",
  "women/clothes/trousers": "bottom",
  "men/clothes/shirts": "top",
  "women/clothes/shirts": "top",
  "men/clothes/t-shirts": "top",
  "women/clothes/t-shirts": "top",
  "men/clothes/jackets": "outerwear",
  "women/clothes/jackets": "outerwear",
};

const SUBCATEGORY_MAP: Record<string, string> = {
  "men/clothes/jeans-n3676": "jeans",
  "women/clothes/jeans-n3676": "jeans",
  "men/clothes/trousers": "trousers",
  "women/clothes/trousers": "trousers",
  "men/clothes/shirts": "shirt",
  "women/clothes/shirts": "shirt",
  "men/clothes/t-shirts": "t-shirt",
  "women/clothes/t-shirts": "t-shirt",
  "men/clothes/jackets": "jacket",
  "women/clothes/jackets": "jacket",
};

// ✅ Déduire le genre à partir de la catégorie
function inferGender(category: string): "male" | "female" | "unisex" {
  if (category?.includes("men")) return "male";
  if (category?.includes("women")) return "female";
  return "unisex";
}

// ✅ Déterminer la saison selon le type de produit
function inferSeason(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("jeans") || lower.includes("trousers")) return "all";
  if (lower.includes("shorts")) return "summer";
  if (lower.includes("jacket") || lower.includes("coat")) return "winter";
  return "all";
}

// ✅ Déduire le fit à partir du nom du produit
function inferFit(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("super baggy") || lower.includes("mega baggy")) return "baggy";
  if (lower.includes("baggy")) return "relaxed";
  if (lower.includes("skinny")) return "skinny";
  if (lower.includes("slim")) return "slim";
  if (lower.includes("regular")) return "regular";
  return "regular";
}

// ✅ Déduire le pattern
function inferPattern(name: string, color: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("print") || lower.includes("pattern")) return "printed";
  if (color?.includes("light") || color?.includes("dark")) return "solid";
  return "solid";
}

// ✅ Génération des tags de style
function getStyleTags(name: string, category: string): string[] {
  const tags: string[] = [];
  const lower = name.toLowerCase();

  if (lower.includes("baggy")) tags.push("streetwear", "casual", "urban");
  if (lower.includes("skater")) tags.push("skate", "youth", "casual");
  if (lower.includes("vintage")) tags.push("vintage", "retro");
  if (lower.includes("cargo")) tags.push("utility", "military");
  if (category?.includes("jeans")) tags.push("denim", "casual");

  // Tags basés sur le fit
  const fit = inferFit(name);
  if (fit === "baggy") tags.push("oversized", "comfort");
  if (fit === "slim") tags.push("modern", "tailored");

  return [...new Set(tags)];
}

// ✅ Occasions probables
function getOccasions(name: string, category: string): string[] {
  const lower = name.toLowerCase();
  const occasions = ["daily", "casual"];
  
  if (lower.includes("baggy") || lower.includes("skater")) occasions.push("streetwear", "urban");
  if (category?.includes("jeans")) occasions.push("weekend", "outing");
  
  return [...new Set(occasions)];
}

// ✅ Saison → plage de température
function getTemperatureRange(season: string) {
  switch (season) {
    case "summer":
      return { min: 20, max: 35 };
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
function getWeatherSuitability(season: string, category: string): string[] {
  const suitability: string[] = [];
  
  if (season === "winter" || category.includes("jacket")) {
    suitability.push("cold", "windy");
  }
  if (season === "summer") {
    suitability.push("warm", "sunny");
  }
  if (category.includes("jeans")) {
    suitability.push("dry", "mild");
  }
  
  return suitability.length > 0 ? suitability : ["mild", "dry"];
}

// ✅ Déduire les tags de localisation
function getLocationTags(styleTags: string[]): string[] {
  const locations: string[] = ["urban"];
  
  if (styleTags.includes("streetwear")) locations.push("city", "downtown");
  if (styleTags.includes("casual")) locations.push("cafe", "shopping");
  
  return [...new Set(locations)];
}

// ✅ Nettoyer et formater les couleurs
function cleanColor(color: string): string {
  if (!color) return "unspecified";
  
  const clean = color.toLowerCase()
    .replace("dark ", "dark-")
    .replace("light ", "light-")
    .replace(" ", "-");
  
  return clean;
}

// ✅ Extraire les matériaux de la composition
function extractMaterial(compositionDetail: any): string {
  if (!compositionDetail?.parts?.[0]?.components?.[0]) {
    return "cotton"; // Valeur par défaut pour Bershka
  }
  
  const components = compositionDetail.parts[0].components;
  const materials = components.map((comp: any) => comp.material).filter(Boolean);
  
  return materials.length > 0 ? materials.join(", ") : "cotton";
}

async function ingestBershkaData() {
  await mongoose.connect(MONGO_URI);
  console.log("📥 Lecture du fichier JSON Bershka...");

  try {
    const rawData = fs.readFileSync("src/AItraining/datasets/raw/dataset_bershka_2025-10-13_00-15-49-311.json");
    const bershkaData = JSON.parse(rawData.toString());

    console.log(`📦 ${bershkaData.length} produits Bershka trouvés`);

    const itemsToInsert = [];

    for (const product of bershkaData) {
      if (!product.name || !product.colorsSizesImagesJSON?.[0]) continue;

      const category = CATEGORY_MAP[product.category] || "bottom";
      const subCategory = SUBCATEGORY_MAP[product.category] || "jeans";
      const gender = inferGender(product.category);
      const season = inferSeason(product.name);
      const fit = inferFit(product.name);
      const material = extractMaterial(product.compositionDetail);
      const styleTags = getStyleTags(product.name, product.category);
      const occasions = getOccasions(product.name, product.category);
      const temperatureRange = getTemperatureRange(season);
      const weatherSuitability = getWeatherSuitability(season, product.category);
      const locationTags = getLocationTags(styleTags);

      // Traiter chaque couleur comme un item séparé
      for (const colorVariant of product.colorsSizesImagesJSON) {
        const color = cleanColor(colorVariant.name);
        const pattern = inferPattern(product.name, color);
        
        // Utiliser la première image disponible
        const imageUrl = colorVariant.xmedia?.[0] || product.mainImage || "https://via.placeholder.com/400x400/cccccc/000000?text=Bershka+Product";

        const item = {
          user: null,
          name: `${product.name} - ${colorVariant.name}`,
          category,
          subCategory,
          color,
          pattern,
          material,
          brand: "Bershka",
          fit,
          gender,
          imageUrl,
          styleTags,
          season,
          occasion: occasions,
          temperatureRange,
          weatherSuitability,
          locationTags,
          source: "bershka_dataset_2025",
          isFavorite: false,
          usageCount: 0,
          lastWornDate: null,
          metadata: {
            bershkaId: product.id,
            reference: product.reference,
            price: product.price / 100, // Convertir centimes en euros
            currency: "EUR",
            availabilityDate: product.availabilityDate,
            composition: product.composition,
            care: product.care,
            certifiedMaterials: product.certifiedMaterials?.show || false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        itemsToInsert.push(item);
      }
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
        
        console.log(`🎉 ${inserted} produits Bershka ajoutés avec succès`);
      } catch (err) {
        console.error("⚠️ Erreur pendant l'insertion:", err);
      }
    } else {
      console.log("❌ Aucun produit valide à insérer");
    }

    await mongoose.disconnect();
    console.log("🏁 Import Bershka terminé !");
  } catch (err) {
    console.error("❌ Erreur lors de l'import Bershka:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

ingestBershkaData().catch((err) => {
  console.error("❌ Erreur d'import Bershka:", err);
  process.exit(1);
});
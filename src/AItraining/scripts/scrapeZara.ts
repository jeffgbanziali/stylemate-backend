import fs from "fs";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI = "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

// Mapping des catégories Zara vers vos catégories
const CATEGORY_MAP: Record<string, string> = {
  "SHIRT": "top",
  "POLO SHIRT": "top", 
  "WIND-JACKET": "outerwear",
  "OVERSHIRT": "outerwear",
  "JACKET": "outerwear"
};

// Mapping des sous-catégories
const SUBCATEGORY_MAP: Record<string, string> = {
  "SHIRT": "shirt",
  "POLO SHIRT": "polo",
  "WIND-JACKET": "jacket",
  "OVERSHIRT": "jacket",
  "F. Jacket": "jacket",
  "B. Summer Shirt": "shirt",
  "Summer Shirt LS": "shirt",
  "F. Shirt": "shirt",
  "F. Summer Shirt": "shirt",
  "B. Shirt": "shirt",
  "ORIG Shirt": "shirt",
  "Polo L/S": "polo"
};

// Mapping des matériaux basés sur le nom du produit
const getMaterialFromName = (name: string): string => {
  if (!name) return "cotton";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("linen")) return "linen";
  if (lowerName.includes("cotton")) return "cotton";
  if (lowerName.includes("jacquard")) return "jacquard";
  if (lowerName.includes("oxford")) return "cotton";
  if (lowerName.includes("textured")) return "textured";
  if (lowerName.includes("stretch")) return "stretch";
  if (lowerName.includes("sweatshirt")) return "cotton";
  return "cotton";
};

// Mapping des saisons basé sur le nom de la famille/sous-famille
const getSeasonFromProduct = (familyName?: string, subfamilyName?: string): string => {
  const lowerFamily = (familyName || "").toLowerCase();
  const lowerSubfamily = (subfamilyName || "").toLowerCase();
  
  if (lowerSubfamily.includes("summer") || lowerFamily.includes("summer")) return "summer";
  if (lowerSubfamily.includes("winter") || lowerFamily.includes("winter")) return "winter";
  if (lowerSubfamily.includes("spring") || lowerFamily.includes("spring")) return "spring";
  if (lowerSubfamily.includes("autumn") || lowerFamily.includes("autumn")) return "autumn";
  
  return "all";
};

// Extraction des tags de style
const getStyleTags = (name?: string, familyName?: string, subfamilyName?: string): string[] => {
  const tags: string[] = [];
  const lowerName = (name || "").toLowerCase();
  const lowerFamily = (familyName || "").toLowerCase();
  const lowerSubfamily = (subfamilyName || "").toLowerCase();

  // Tags basés sur le nom
  if (lowerName.includes("regular fit")) tags.push("regular", "casual");
  if (lowerName.includes("slim fit")) tags.push("slim", "fitted");
  if (lowerName.includes("relaxed fit")) tags.push("relaxed", "comfort");
  if (lowerName.includes("textured")) tags.push("textured");
  if (lowerName.includes("plaid") || lowerName.includes("checked")) tags.push("plaid", "pattern");
  if (lowerName.includes("button-down")) tags.push("button-down", "classic");
  if (lowerName.includes("contrast")) tags.push("contrast", "modern");
  if (lowerName.includes("linen")) tags.push("linen", "breathable");

  // Tags basés sur la famille
  if (lowerFamily.includes("shirt")) tags.push("shirt-style");
  if (lowerFamily.includes("polo")) tags.push("polo-style");
  if (lowerFamily.includes("jacket")) tags.push("jacket-style");

  // Tags basés sur la sous-famille
  if (lowerSubfamily.includes("summer")) tags.push("summer-style", "lightweight");
  if (lowerSubfamily.includes("formal")) tags.push("formal", "elegant");
  if (lowerSubfamily.includes("casual")) tags.push("casual", "everyday");

  return [...new Set(tags)];
};

// Extraction des occasions
const getOccasions = (name?: string, familyName?: string): string[] => {
  const occasions: string[] = ["daily"];
  const lowerName = (name || "").toLowerCase();
  const lowerFamily = (familyName || "").toLowerCase();

  if (lowerName.includes("formal") || lowerFamily.includes("formal")) {
    occasions.push("formal", "business");
  }
  if (lowerName.includes("sweatshirt") || lowerName.includes("relaxed")) {
    occasions.push("casual", "weekend");
  }
  if (lowerName.includes("jacket") || lowerFamily.includes("jacket")) {
    occasions.push("outdoor", "layering");
  }

  return [...new Set(occasions)];
};

async function ingestZaraData() {
  await mongoose.connect(MONGO_URI);

  console.log("📥 Lecture du fichier JSON Zara...");

  try {
    const rawData = fs.readFileSync("src/AItraining/datasets/raw/dataset_zara-product-scraper_2025-10-13_00-50-47-144.json", "utf8");
    const zaraProducts = JSON.parse(rawData);

    console.log(`📦 ${zaraProducts.length} produits Zara trouvés`);

    // Filtrer les produits valides et les traiter
    const validProducts = zaraProducts.filter((product: any) => {
      return product && product.name; // S'assurer que le produit a au moins un nom
    });

    console.log(`🔄 Traitement de ${validProducts.length} produits valides...`);

    const itemsToInsert = validProducts.map((product: any, index: number) => {
      // Log pour debug tous les 1000 produits
      if (index % 1000 === 0) {
        console.log(`⏳ Traitement du produit ${index}/${validProducts.length}`);
      }

      const category = CATEGORY_MAP[product.familyName] || "top";
      const subCategory = SUBCATEGORY_MAP[product.familyName] || SUBCATEGORY_MAP[product.subfamilyName] || "shirt";
      const material = getMaterialFromName(product.name);
      const season = getSeasonFromProduct(product.familyName, product.subfamilyName);
      const styleTags = getStyleTags(product.name, product.familyName, product.subfamilyName);
      const occasions = getOccasions(product.name, product.familyName);

      // Utiliser la première image disponible avec gestion d'erreur
      let imageUrl = `https://via.placeholder.com/300x400/cccccc/666666?text=${encodeURIComponent(product.name || "Zara")}`;
      
      try {
        if (product.xmedia && product.xmedia[0] && product.xmedia[0].url) {
          imageUrl = product.xmedia[0].url.replace("{width}", "300");
        } else if (product.detail?.colors?.[0]?.xmedia?.[0]?.url) {
          imageUrl = product.detail.colors[0].xmedia[0].url.replace("{width}", "300");
        }
      } catch (error) {
        console.log(`⚠️ Erreur image pour le produit ${index}: ${product.name}`);
      }

      // Extraire la couleur principale avec gestion d'erreur
      let mainColor = "unspecified";
      try {
        mainColor = product.colorInfo?.mainColorHexCode || 
                   product.detail?.colors?.[0]?.name?.split("/")[0]?.trim() || 
                   "unspecified";
      } catch (error) {
        console.log(`⚠️ Erreur couleur pour le produit ${index}: ${product.name}`);
      }

      return {
        user: null,
        name: product.name || "Produit Zara",
        category,
        subCategory,
        color: mainColor.toLowerCase(),
        pattern: (product.name && (product.name.toLowerCase().includes("plaid") || 
                product.name.toLowerCase().includes("checked") || 
                product.name.toLowerCase().includes("jacquard"))) ? "patterned" : "solid",
        material,
        brand: "Zara",
        fit: (product.name && product.name.toLowerCase().includes("slim fit")) ? "slim" : 
             (product.name && product.name.toLowerCase().includes("regular fit")) ? "regular" : 
             (product.name && product.name.toLowerCase().includes("relaxed fit")) ? "relaxed" : "regular",
        gender: "male",
        imageUrl,
        styleTags,
        season,
        occasion: occasions,
        temperatureRange: {
          min: season === "summer" ? 20 : season === "winter" ? -5 : 10,
          max: season === "summer" ? 35 : season === "winter" ? 15 : 25
        },
        weatherSuitability: season === "summer" ? ["sunny", "warm"] : 
                           season === "winter" ? ["cold", "windy"] : 
                           ["mild", "variable"],
        locationTags: ["urban", "city", "casual"],
        source: "zara_dataset_2025",
        isFavorite: false,
        usageCount: 0,
        metadata: {
          zaraReference: product.reference || "unknown",
          zaraId: product.id || "unknown",
          price: product.price ? product.price / 100 : 0,
          familyName: product.familyName || "unknown",
          subfamilyName: product.subfamilyName || "unknown",
          availability: product.availability || "unknown",
          numColors: product.colorInfo?.numAdditionalColors ? product.colorInfo.numAdditionalColors + 1 : 1
        }
      };
    });

    console.log(`🔄 Préparation de ${itemsToInsert.length} éléments pour l'insertion...`);

    if (itemsToInsert.length > 0) {
      try {
        // Insérer par lots pour éviter les timeouts
        const batchSize = 1000;
        let insertedCount = 0;
        
        for (let i = 0; i < itemsToInsert.length; i += batchSize) {
          const batch = itemsToInsert.slice(i, i + batchSize);
          await WardrobeItemForTraining.insertMany(batch, { ordered: false });
          insertedCount += batch.length;
          console.log(`✅ Lot ${Math.floor(i/batchSize) + 1} inséré: ${insertedCount}/${itemsToInsert.length}`);
        }
        
        console.log(`🎉 ${insertedCount} produits Zara ajoutés à la base de formation`);
      } catch (err) {
        console.error("⚠️ Erreurs pendant l'insertion:", err);
      }
    } else {
      console.log("❌ Aucun élément à insérer");
    }

    await mongoose.disconnect();
    console.log("🏁 Import Zara terminé.");

  } catch (error) {
    console.error("❌ Erreur lors de l'import Zara:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

ingestZaraData().catch((err) => {
  console.error("❌ Erreur d'import Zara:", err);
  process.exit(1);
});
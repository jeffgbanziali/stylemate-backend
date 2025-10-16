import fs from "fs";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

// === 🧭 Mapping Zara → StyleMate ===
const CATEGORY_MAP: Record<string, string> = {
  "SHIRT": "top",
  "POLO SHIRT": "top",
  "WIND-JACKET": "outerwear",
  "OVERSHIRT": "outerwear",
  "JACKET": "outerwear",
};

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
  "Polo L/S": "polo",
};

// === 🧵 Détection de propriétés ===
const getMaterialFromName = (name: string): string => {
  if (!name) return "cotton";
  const lower = name.toLowerCase();
  if (lower.includes("linen")) return "linen";
  if (lower.includes("cotton")) return "cotton";
  if (lower.includes("jacquard")) return "jacquard";
  if (lower.includes("oxford")) return "cotton";
  if (lower.includes("textured")) return "textured";
  if (lower.includes("stretch")) return "stretch";
  if (lower.includes("sweatshirt")) return "cotton";
  return "cotton";
};

const getSeasonFromProduct = (familyName?: string, subfamilyName?: string): string => {
  const f = (familyName || "").toLowerCase();
  const s = (subfamilyName || "").toLowerCase();
  if (s.includes("summer") || f.includes("summer")) return "summer";
  if (s.includes("winter") || f.includes("winter")) return "winter";
  if (s.includes("spring") || f.includes("spring")) return "spring";
  if (s.includes("autumn") || f.includes("autumn")) return "autumn";
  return "all";
};

const getStyleTags = (name?: string, familyName?: string, subfamilyName?: string): string[] => {
  const tags: string[] = [];
  const n = (name || "").toLowerCase();
  const f = (familyName || "").toLowerCase();
  const s = (subfamilyName || "").toLowerCase();

  if (n.includes("regular fit")) tags.push("regular", "casual");
  if (n.includes("slim fit")) tags.push("slim", "fitted");
  if (n.includes("relaxed fit")) tags.push("relaxed", "comfort");
  if (n.includes("textured")) tags.push("textured");
  if (n.includes("plaid") || n.includes("checked")) tags.push("plaid", "pattern");
  if (n.includes("button-down")) tags.push("button-down", "classic");
  if (n.includes("contrast")) tags.push("contrast", "modern");
  if (n.includes("linen")) tags.push("linen", "breathable");

  if (f.includes("shirt")) tags.push("shirt-style");
  if (f.includes("polo")) tags.push("polo-style");
  if (f.includes("jacket")) tags.push("jacket-style");

  if (s.includes("summer")) tags.push("summer-style", "lightweight");
  if (s.includes("formal")) tags.push("formal", "elegant");
  if (s.includes("casual")) tags.push("casual", "everyday");

  return [...new Set(tags)];
};

const getOccasions = (name?: string, familyName?: string): string[] => {
  const occ: string[] = ["daily"];
  const n = (name || "").toLowerCase();
  const f = (familyName || "").toLowerCase();
  if (n.includes("formal") || f.includes("formal")) occ.push("formal", "business");
  if (n.includes("sweatshirt") || n.includes("relaxed")) occ.push("casual", "weekend");
  if (n.includes("jacket") || f.includes("jacket")) occ.push("outdoor", "layering");
  return [...new Set(occ)];
};

// === 🚀 Import principal ===
async function ingestZaraData() {
  await mongoose.connect(MONGO_URI);
  console.log("📥 Lecture du dataset Zara...");

  try {
    const rawData = fs.readFileSync(
      "src/AItraining/datasets/raw/dataset_zara_2025-10-14_21-18-15-120.json",
      "utf8"
    );
    const zaraProducts = JSON.parse(rawData);
    console.log(`📦 ${zaraProducts.length} produits trouvés`);

    const validProducts = zaraProducts.filter((p: any) => p && p.name);
    console.log(`🔄 ${validProducts.length} produits valides à traiter`);

    const itemsToInsert = validProducts.map((product: any, index: number) => {
      if (index % 1000 === 0) console.log(`⏳ Traitement du produit ${index}`);

      const category = CATEGORY_MAP[product.familyName] || "top";
      const subCategory =
        SUBCATEGORY_MAP[product.familyName] ||
        SUBCATEGORY_MAP[product.subfamilyName] ||
        "shirt";
      const material = getMaterialFromName(product.name);
      const season = getSeasonFromProduct(product.familyName, product.subfamilyName);
      const styleTags = getStyleTags(product.name, product.familyName, product.subfamilyName);
      const occasions = getOccasions(product.name, product.familyName);

      // Gestion des images
      let imageUrl = `https://via.placeholder.com/300x400/cccccc/666666?text=${encodeURIComponent(
        product.name || "Zara"
      )}`;
      try {
        if (product.xmedia && product.xmedia[0]) {
          imageUrl = product.xmedia[0].replace("{width}", "400");
        } else if (product.colorsSizesImagesJSON?.[0]?.xmedia?.[0]) {
          imageUrl = product.colorsSizesImagesJSON[0].xmedia[0].replace("{width}", "400");
        }
      } catch {
        console.warn(`⚠️ Image manquante pour : ${product.name}`);
      }

      const color =
        product.color ||
        product.colorsSizesImagesJSON?.[0]?.name?.split("/")[0]?.trim()?.toLowerCase() ||
        "unspecified";

      return {
        user: null,
        name: product.name,
        category,
        subCategory,
        color,
        pattern: /plaid|checked|jacquard/i.test(product.name) ? "patterned" : "solid",
        material,
        brand: "Zara",
        fit: /slim/i.test(product.name)
          ? "slim"
          : /regular/i.test(product.name)
          ? "regular"
          : /relaxed/i.test(product.name)
          ? "relaxed"
          : "regular",
        gender: /woman|female/i.test(product.category) ? "female" : "male",
        imageUrl,
        styleTags,
        season,
        occasion: occasions,
        temperatureRange: {
          min: season === "summer" ? 20 : season === "winter" ? -5 : 10,
          max: season === "summer" ? 35 : season === "winter" ? 15 : 25,
        },
        weatherSuitability:
          season === "summer"
            ? ["sunny", "warm"]
            : season === "winter"
            ? ["cold", "windy"]
            : ["mild", "variable"],
        locationTags: ["urban", "city", "casual"],
        source: "zara_dataset_2025",
        isFavorite: false,
        usageCount: 0,
      };
    });

    console.log(`🧩 ${itemsToInsert.length} articles prêts à être insérés`);

    // Insertion par lots
    const batchSize = 1000;
    let inserted = 0;
    for (let i = 0; i < itemsToInsert.length; i += batchSize) {
      const batch = itemsToInsert.slice(i, i + batchSize);
      await WardrobeItemForTraining.insertMany(batch, { ordered: false });
      inserted += batch.length;
      console.log(`✅ Lot ${Math.ceil(i / batchSize) + 1}: ${inserted}/${itemsToInsert.length}`);
    }

    console.log(`🎯 Insertion terminée : ${inserted} produits ajoutés à la base.`);
  } catch (err) {
    console.error("❌ Erreur pendant l'import :", err);
  } finally {
    await mongoose.disconnect();
    console.log("🏁 Déconnexion MongoDB — import terminé.");
  }
}

ingestZaraData().catch(console.error);

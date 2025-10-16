import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";
const REPORT_DIR = path.join(__dirname, "../reports");

// --- 🔹 DÉTECTION DES ATTRIBUTS --------------------------------------------

function detectStyleArchetype(name: string, brand: string, category: string): string {
  const text = `${name} ${brand} ${category}`.toLowerCase();

  if (/(blazer|suit|oxford|tie|shirt|business|formal|trousers)/.test(text))
    return "business";
  if (/(hoodie|bomber|cargo|sneakers|denim|oversized|street|urban)/.test(text))
    return "streetwear";
  if (/(training|sport|activewear|jogger|tracksuit|gym|runner)/.test(text))
    return "athleisure";
  if (/(floral|dress|lace|crochet|maxi|flowy|boho|print)/.test(text))
    return "bohemian";
  if (/(asymmetric|avant|sculptural|metallic|leather|futuristic)/.test(text))
    return "avant_garde";
  if (/(minimal|plain|neutral|beige|white|black|clean|sleek)/.test(text))
    return "minimalist";

  return "classic";
}

function detectBrandCategory(brand: string): string {
  const lower = (brand || "").toLowerCase();

  if (
    ["gucci", "prada", "dior", "versace", "balenciaga", "chanel", "saint laurent", "valentino"].some(b => lower.includes(b))
  )
    return "luxury";
  if (
    ["ralph lauren", "calvin klein", "tommy hilfiger", "diesel", "hugo boss", "levi"].some(b => lower.includes(b))
  )
    return "premium";
  if (
    ["zara", "hm", "h&m", "bershka", "pull&bear", "stradivarius", "asos"].some(b => lower.includes(b))
  )
    return "fast_fashion";
  if (
    ["nike", "adidas", "puma", "reebok", "under armour", "north face", "fila"].some(b => lower.includes(b))
  )
    return "sport";

  return "mass_market";
}

function detectQualityTier(brandCategory: string): string {
  switch (brandCategory) {
    case "luxury":
      return "luxury";
    case "premium":
      return "premium";
    case "fast_fashion":
      return "basic";
    case "sport":
    case "mass_market":
    default:
      return "standard";
  }
}

// --- 🔹 UTILITAIRE POUR RAPPORTS -------------------------------------------

function summarize(items: any[], field: string): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const item of items) {
    const val = (item[field] || "❓").toString();
    summary[val] = (summary[val] || 0) + 1;
  }
  return summary;
}

// --- 🔹 MAIN ---------------------------------------------------------------

async function enrichWardrobeAttributes() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté à MongoDB\n");

  const query = {
    $or: [
      { styleArchetype: { $in: [null, "", "❓", "classic"] } },
      { brandCategory: { $in: [null, "", "❓", "mass_market"] } },
      { qualityTier: { $in: [null, "", "❓", "standard"] } },
    ],
  };

  const totalToFix = await WardrobeItemForTraining.countDocuments(query);
  console.log(`🧾 Articles à enrichir : ${totalToFix}\n`);

  const beforeSample = await WardrobeItemForTraining.find(query).limit(2000).lean();
  const beforeSummary = {
    styleArchetype: summarize(beforeSample, "styleArchetype"),
    brandCategory: summarize(beforeSample, "brandCategory"),
    qualityTier: summarize(beforeSample, "qualityTier"),
  };

  const batchSize = 500;
  let fixedCount = 0;
  let batchIndex = 0;

  while (true) {
    const batch = await WardrobeItemForTraining.find(query).limit(batchSize);
    if (batch.length === 0) break;

    const updates = batch.map((item) => {
      const name = item.name || "";
      const brand = item.brand || "";
      const category = item.category || "";

      const newBrandCategory = detectBrandCategory(brand);
      const newStyle = detectStyleArchetype(name, brand, category);
      const newQuality = detectQualityTier(newBrandCategory);

      return {
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              styleArchetype: newStyle,
              brandCategory: newBrandCategory,
              qualityTier: newQuality,
              "dataQuality.confidenceScore": 0.95,
              "dataQuality.needsReview": false,
              "dataQuality.lastReviewDate": new Date(),
              updatedAt: new Date(),
            },
          },
        },
      };
    });

    const result = await WardrobeItemForTraining.bulkWrite(updates, { ordered: false });
    fixedCount += result.modifiedCount;
    batchIndex++;

    console.log(
      `✅ Lot ${batchIndex}: ${result.modifiedCount} modifiés, ${result.matchedCount} correspondants | Total ${Math.min(
        fixedCount,
        totalToFix
      )}/${totalToFix}`
    );

    if (fixedCount >= totalToFix) break; // ✅ Stop net si tout enrichi
  }

  // --- Rapport final -------------------------------------------------------
  const allItems = await WardrobeItemForTraining.find().lean();
  const afterSummary = {
    styleArchetype: summarize(allItems, "styleArchetype"),
    brandCategory: summarize(allItems, "brandCategory"),
    qualityTier: summarize(allItems, "qualityTier"),
  };

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `enrichment_report_${new Date().toISOString().split("T")[0]}.json`);

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        date: new Date().toISOString(),
        total: allItems.length,
        enriched: fixedCount,
        before: beforeSummary,
        after: afterSummary,
      },
      null,
      2
    )
  );

  console.log(`\n📊 Rapport enregistré dans : ${reportPath}`);
  console.log(`🎯 Total enrichis : ${fixedCount}/${totalToFix}`);
  console.log("🏁 Enrichissement terminé !");
  await mongoose.disconnect();
}

enrichWardrobeAttributes().catch((err) => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});

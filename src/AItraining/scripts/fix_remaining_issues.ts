import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI = "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

async function analyzeDistribution() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté à MongoDB\n");

  const total = await WardrobeItemForTraining.countDocuments();
  console.log(`📊 Total d'articles : ${total}\n`);

  // Fonction utilitaire pour afficher une répartition simple
  const showDistribution = async (field: string) => {
    const results = await WardrobeItemForTraining.aggregate([
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log(`🔹 Répartition par ${field}:`);
    results.forEach((r) => {
      const percent = ((r.count / total) * 100).toFixed(1);
      console.log(`   - ${r._id || "❓"} : ${r.count} (${percent}%)`);
    });
    console.log("");
  };

  await showDistribution("category");
  await showDistribution("subCategory");
  await showDistribution("gender");
  await showDistribution("formalityLevel");
  await showDistribution("styleArchetype");
  await showDistribution("season");
  await showDistribution("brandCategory");
  await showDistribution("qualityTier");

  console.log("🏁 Analyse terminée !");
  await mongoose.disconnect();
}

analyzeDistribution().catch((err) => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});

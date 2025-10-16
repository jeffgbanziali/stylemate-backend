import mongoose from "mongoose";
import axios from "axios";
import fs from "fs";
import WardrobeItem from "../models/WardrobeItemForTraining";

const MONGO_URI = "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

async function testUrl(url: string): Promise<string> {
  try {
    const res = await axios.head(url, { timeout: 8000 });
    if (res.status === 200) return "ok";
    return `${res.status}`;
  } catch (err: any) {
    if (err.code === "ECONNABORTED") return "timeout";
    if (err.response && err.response.status) return `${err.response.status}`;
    return "error";
  }
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  const items = await WardrobeItem.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: [] },
      { embedding: null }
    ]
  })
    .select("name imageUrl brand category")
    //.limit(200);

  console.log(`🔍 Vérification des images (${items.length})...`);

  const results: any[] = [];
  for (const item of items) {
    const status = await testUrl(item.imageUrl);
    results.push({
      name: item.name,
      url: item.imageUrl,
      status
    });
  }

  const ok = results.filter(r => r.status === "ok");
  const broken = results.filter(r => r.status !== "ok");

  console.log(`
=== RÉSULTATS ===
        ok: ${ok.length}
      403: ${broken.filter(b => b.status === "403").length}
      404: ${broken.filter(b => b.status === "404").length}
   timeout: ${broken.filter(b => b.status === "timeout").length}
     other: ${broken.filter(b => !["ok","403","404","timeout"].includes(b.status)).length}
  `);

  fs.writeFileSync(
    "src/AItraining/reports/image_check_report.json",
    JSON.stringify(results, null, 2)
  );

  console.log("📄 Rapport enregistré → src/AItraining/reports/image_check_report.json");

  await mongoose.disconnect();
  console.log("🏁 Terminé !");
}

run();

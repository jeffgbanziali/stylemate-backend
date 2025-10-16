import mongoose, { Types } from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";
import UserForTraining from "../models/UserForTraining";

const MONGO_URI =
  "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

type LeanUser = {
  _id: Types.ObjectId;
  preferences?: {
    style?: string[];
    color?: string[];
    season?: string[];
    occasion?: string[];
    gender?: string;
    brand?: string[];
  };
};

async function assignNewWardrobesToExistingUsers(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  // 🔹 1. Récupérer les utilisateurs existants
  const existingUsers = await UserForTraining.find({}, { _id: 1, preferences: 1 }).lean<LeanUser[]>();
  if (existingUsers.length === 0) {
    console.log("⚠️ Aucun utilisateur existant trouvé.");
    await mongoose.disconnect();
    return;
  }

  // 🔹 2. Récupérer les vêtements orphelins (non assignés)
  const unassignedItems = await WardrobeItemForTraining.find({
    $or: [{ user: { $exists: false } }, { user: null }],
  }).lean();

  if (unassignedItems.length === 0) {
    console.log("✅ Aucun vêtement orphelin trouvé. Rien à faire.");
    await mongoose.disconnect();
    return;
  }

  console.log(
    `👕 ${unassignedItems.length} vêtements orphelins à répartir entre ${existingUsers.length} utilisateurs.`
  );

  // 🔹 3. Préparer des structures utiles
  const userIds = existingUsers.map((u) => u._id.toString());
  const userPrefs = new Map(existingUsers.map((u) => [u._id.toString(), u.preferences || {}]));
  const userLoad: Record<string, number> = Object.fromEntries(userIds.map((id) => [id, 0]));
  let cursor = 0;

  // 🔹 4. Fonction de sélection d’un utilisateur compatible
  const pickUserForItem = (item: any): string => {
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < userIds.length; i++) {
        const idx = (cursor + i) % userIds.length;
        const uid = userIds[idx];
        const prefs = userPrefs.get(uid) || {};

        const styleMatch = (prefs.style || []).some((s) =>
          (item.styleTags || []).includes(s)
        );
        const colorMatch = (prefs.color || []).some((c) =>
          (item.color || "").toLowerCase().includes(c.toLowerCase())
        );
        const seasonMatch = (prefs.season || []).includes(item.season);
        const occasionMatch = (prefs.occasion || []).some((o) =>
          (item.occasion || []).includes(o)
        );
        const genderMatch = !prefs.gender || prefs.gender === item.gender;
        const brandMatch = (prefs.brand || []).includes(item.brand);

        if (
          styleMatch ||
          colorMatch ||
          seasonMatch ||
          occasionMatch ||
          genderMatch ||
          brandMatch
        ) {
          userLoad[uid]++;
          cursor = (idx + 1) % userIds.length;
          return uid;
        }
      }
    }

    // fallback → utilisateur suivant
    const uid = userIds[cursor];
    userLoad[uid]++;
    cursor = (cursor + 1) % userIds.length;
    return uid;
  };

  // 🔹 5. Assignation en batch
  const BATCH = 500;
  for (let i = 0; i < unassignedItems.length; i += BATCH) {
    const batch = unassignedItems.slice(i, i + BATCH);
    const ops = batch.map((item) => {
      const uid = pickUserForItem(item);
      return {
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { user: new Types.ObjectId(uid) } },
        },
      };
    });

    await WardrobeItemForTraining.bulkWrite(ops, { ordered: false });
    console.log(`✅ ${Math.min(i + BATCH, unassignedItems.length)}/${unassignedItems.length} vêtements assignés`);
  }

  console.log("🏁 Assignation terminée avec succès !");
  await mongoose.disconnect();
}

assignNewWardrobesToExistingUsers().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});

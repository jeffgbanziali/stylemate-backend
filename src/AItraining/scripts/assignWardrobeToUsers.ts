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

async function assignWardrobeToNewUsers(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connecté à MongoDB");

  const usersWithoutWardrobe = await UserForTraining.aggregate<LeanUser>([
    {
      $lookup: {
        from: "wardrobeitemfortrainings",
        localField: "_id",
        foreignField: "user",
        as: "wardrobe",
      },
    },
    { $match: { "wardrobe.0": { $exists: false } } },
    { $project: { _id: 1, preferences: 1, gender: 1 } },
  ]);

  if (usersWithoutWardrobe.length === 0) {
    console.log("⚠️ Aucun nouvel utilisateur sans wardrobe trouvé.");
    await mongoose.disconnect();
    return;
  }

  const unassignedItems = await WardrobeItemForTraining.find({
    $or: [{ user: { $exists: false } }, { user: null }],
  }).lean();

  console.log(
    `👤 ${usersWithoutWardrobe.length} nouveaux utilisateurs, 👕 ${unassignedItems.length} vêtements à répartir`
  );

  if (unassignedItems.length === 0) {
    console.log("⚠️ Aucun vêtement orphelin à distribuer. Rien à faire.");
    await mongoose.disconnect();
    return;
  }

  const userIds = usersWithoutWardrobe.map((u) => u._id.toString());
  const userPrefs = new Map(
    usersWithoutWardrobe.map((u) => [u._id.toString(), u.preferences || {}])
  );

  const baseCap = Math.max(1, Math.floor(unassignedItems.length / usersWithoutWardrobe.length));
  const userCount: Record<string, number> = Object.create(null);
  for (const id of userIds) userCount[id] = 0;
  let cursor = 0;

  const pickUserForItem = (item: any): string => {
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 0; k < userIds.length; k++) {
        const idx = (cursor + k) % userIds.length;
        const uid = userIds[idx];
        const cnt = userCount[uid] || 0;
        if (cnt >= baseCap && pass === 0) continue;

        const prefs = userPrefs.get(uid) || {};

        const styleMatch =
          (prefs.style || []).some((s: string) => (item.styleTags || []).includes(s));
        const colorMatch =
          (prefs.color || []).some((c: string) => (item.color || "").toLowerCase().includes(c.toLowerCase()));
        const seasonMatch =
          (prefs.season || []).includes(item.season);
        const occasionMatch =
          (prefs.occasion || []).some((o: string) => (item.occasion || []).includes(o));
        const genderMatch =
          !prefs.gender || prefs.gender === item.gender;
        const brandMatch =
          (prefs.brand || []).includes(item.brand);

        if (
          (pass === 1 || cnt < baseCap) &&
          (styleMatch || colorMatch || seasonMatch || occasionMatch || genderMatch || brandMatch)
        ) {
          userCount[uid] = cnt + 1;
          cursor = (idx + 1) % userIds.length;
          return uid;
        }
      }
    }
    const uid = userIds[cursor];
    userCount[uid] = (userCount[uid] || 0) + 1;
    cursor = (cursor + 1) % userIds.length;
    return uid;
  };

  const BATCH = 500;
  for (let i = 0; i < unassignedItems.length; i += BATCH) {
    const batch = unassignedItems.slice(i, i + BATCH);
    const ops = batch.map((it) => {
      const uid = pickUserForItem(it);
      return {
        updateOne: {
          filter: { _id: it._id },
          update: { $set: { user: new Types.ObjectId(uid) } },
        },
      };
    });
    await WardrobeItemForTraining.bulkWrite(ops, { ordered: false });
    console.log(`✅ ${Math.min(i + BATCH, unassignedItems.length)}/${unassignedItems.length} vêtements assignés`);
  }

  await mongoose.disconnect();
  console.log("🏁 Assignation terminée !");
}

assignWardrobeToNewUsers().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});

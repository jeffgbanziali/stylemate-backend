import { chromium } from "playwright";
import mongoose from "mongoose";
import WardrobeItemForTraining from "../models/WardrobeItemForTraining";

const MONGO_URI = "mongodb://root:example@localhost:27017/stylemate_training?authSource=admin";

const KIABICATEGORIES = [
  { url: "https://www.kiabi.com/homme_tshirts-np519706", category: "top" },
  { url: "https://www.kiabi.com/homme_pantalons-np519699", category: "bottom" },
  { url: "https://www.kiabi.com/homme_chaussures-np520040", category: "shoes" },
  { url: "https://www.kiabi.com/homme_accessoires-np520052", category: "accessory" },
];

async function scrapeKiabi() {
  await mongoose.connect(MONGO_URI);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const { url, category } of KIABICATEGORIES) {
    console.log(`👕 Scraping Kiabi: ${category}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const products = await page.$$eval(".product-item", (items, category) =>
      items.map((el) => {
        const name = el.querySelector(".product-item__name")?.textContent?.trim();
        const imageUrl = el.querySelector("img")?.src;
        return {
          name,
          category,
          color: "unspecified",
          imageUrl,
          styleTags: ["casual"],
          material: "cotton",
          season: "all",
          occasion: ["daily"],
          source: "kiabi",
        };
      }),
      category
    );

    if (products.length) {
      await WardrobeItemForTraining.insertMany(products);
      console.log(`✅ ${products.length} ${category} ajoutés`);
    }
  }

  await browser.close();
  await mongoose.disconnect();
  console.log("🏁 Scraping Kiabi terminé.");
}

scrapeKiabi();

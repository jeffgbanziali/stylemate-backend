// scripts/clean_and_categorize_data.ts
import { MongoClient, Collection, Document, UpdateFilter } from 'mongodb';

interface CleanupOperation {
  filter: Document;
  update: UpdateFilter<Document>;
}

interface WardrobeItem extends Document {
  _id: any;
  name: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  styleTags?: string[];
  formalityLevel?: string;
  embedding?: number[];
  cleanupFlag?: string;
  needsReview?: boolean;
}

class DataCleaner {
  private sportBrands: string[] = [
    'nike', 'adidas', 'jordan', 'puma', 'reebok', 
    'fila', 'skechers', 'under armour', 'converse', 'vans'
  ];
  
  private formalBrands: string[] = [
    'hugo boss', 'armani', 'calvin klein', 'tom ford', 
    'ralph lauren', 'brooks brothers'
  ];
  
  private exclusionKeywords: string[] = [
    'brief', 'boxer', 'underwear', 'sock', 'jersey', 'maillot', 'uniform'
  ];

  public async cleanDatabase(): Promise<void> {
    const client = new MongoClient('mongodb://root:example@localhost:27017');
    
    try {
      await client.connect();
      const db = client.db('stylemate_training');
      const collection = db.collection<WardrobeItem>('wardrobeitemfortrainings');

      console.log('🧹 NETTOYAGE COMPLET DE LA BASE DE DONNÉES...');

      const totalItems = await collection.countDocuments();
      console.log(`📊 Total items avant nettoyage: ${totalItems}`);

      // Étape 1: Nettoyage des catégories
      await this.cleanCategories(collection);
      
      // Étape 2: Ajout des métadonnées de formalité
      await this.addFormalityMetadata(collection);
      
      // Étape 3: Correction des embeddings problématiques
      await this.flagProblematicItems(collection);

      console.log('✅ NETTOYAGE TERMINÉ !');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    } finally {
      await client.close();
    }
  }

  private async cleanCategories(collection: Collection<WardrobeItem>): Promise<void> {
    console.log('\n🔧 CORRECTION DES CATÉGORIES...');
    
    const updates: CleanupOperation[] = [
      // Correction des chaussures mal classées
      {
        filter: { 
          name: { $regex: 'sneaker|shoe|boot|heel|sandal|loafer|oxford', $options: 'i' },
          category: { $ne: 'shoes' }
        },
        update: { $set: { category: 'shoes', subCategory: 'sneakers' } }
      },
      // Correction des vestes mal classées
      {
        filter: { 
          name: { $regex: 'jacket|coat|blazer|parka|windbreaker', $options: 'i' },
          category: { $ne: 'outerwear' }
        },
        update: { $set: { category: 'outerwear', subCategory: 'jacket' } }
      },
      // Exclusion des sous-vêtements
      {
        filter: { 
          name: { $regex: this.exclusionKeywords.join('|'), $options: 'i' }
        },
        update: { $set: { category: 'excluded', cleanupFlag: 'underwear_sport' } }
      },
      // Correction des accessoires mal classés
      {
        filter: { 
          name: { $regex: 'handbag|bag|purse|backpack|wallet|clutch', $options: 'i' },
          category: { $nin: ['accessory', 'bag'] }
        },
        update: { $set: { category: 'accessory', subCategory: 'bag' } }
      },
      // Correction des jeans mal classés
      {
        filter: { 
          name: { $regex: 'jeans|denim|trouser|pant', $options: 'i' },
          category: { $ne: 'bottom' }
        },
        update: { $set: { category: 'bottom', subCategory: 'jeans' } }
      }
    ];

    for (const operation of updates) {
      const result = await collection.updateMany(operation.filter, operation.update);
      const category = (operation.update.$set as any).category || 'unknown';
      console.log(`   ✅ ${category}: ${result.modifiedCount} corrections`);
    }
  }

  private async addFormalityMetadata(collection: Collection<WardrobeItem>): Promise<void> {
    console.log('\n🏷️  AJOUT DES MÉTADONNÉES DE FORMALITÉ...');
    
    let totalUpdates = 0;

    // Marques sportives → casual
    const sportResult = await collection.updateMany(
      { 
        brand: { $in: this.sportBrands },
        formalityLevel: { $exists: false }
      },
      { 
        $set: { formalityLevel: 'casual' },
        $addToSet: { styleTags: 'sporty' }
      }
    );
    totalUpdates += sportResult.modifiedCount;
    console.log(`   🏃‍♂️ Marques sportives: ${sportResult.modifiedCount} items`);

    // Articles formels
    const formalResult = await collection.updateMany(
      { 
        $or: [
          { subCategory: { $in: ['shirt', 'blouse', 'trousers', 'blazer'] } },
          { name: { $regex: 'dress|suit|oxford|loafer', $options: 'i' } }
        ],
        formalityLevel: { $exists: false }
      },
      { 
        $set: { formalityLevel: 'formal' },
        $addToSet: { styleTags: 'formal' }
      }
    );
    totalUpdates += formalResult.modifiedCount;
    console.log(`   👔 Articles formels: ${formalResult.modifiedCount} items`);

    // Articles décontractés
    const casualResult = await collection.updateMany(
      { 
        $or: [
          { subCategory: { $in: ['t-shirt', 'hoodie', 'jeans', 'sneakers'] } },
          { name: { $regex: 'casual|comfort|relaxed', $options: 'i' } }
        ],
        formalityLevel: { $exists: false }
      },
      { 
        $set: { formalityLevel: 'casual' },
        $addToSet: { styleTags: 'casual' }
      }
    );
    totalUpdates += casualResult.modifiedCount;
    console.log(`   😎 Articles décontractés: ${casualResult.modifiedCount} items`);

    console.log(`   ✅ Total métadonnées ajoutées: ${totalUpdates} items`);
  }

  private async flagProblematicItems(collection: Collection<WardrobeItem>): Promise<void> {
    console.log('\n🚨 MARQUAGE DES ITEMS PROBLÉMATIQUES...');
    
    // Items avec embeddings mais catégories incohérentes
    const problematicItems = await collection.find({
      embedding: { $exists: true },
      $or: [
        { category: 'top', name: { $regex: 'shoe|boot|sneaker', $options: 'i' } },
        { category: 'shoes', name: { $regex: 'shirt|pant|jeans', $options: 'i' } },
        { category: 'bottom', name: { $regex: 'shirt|top|jacket', $options: 'i' } },
        { category: 'outerwear', name: { $regex: 'shoe|pant|jeans', $options: 'i' } }
      ]
    }).toArray();

    console.log(`   🔍 ${problematicItems.length} items problématiques identifiés`);

    // Afficher les 5 premiers items problématiques
    for (let i = 0; i < Math.min(5, problematicItems.length); i++) {
      const item = problematicItems[i];
      console.log(`      - ${item.name} → ${item.category}`);
    }

    // Marquer les items problématiques
    if (problematicItems.length > 0) {
      const ids = problematicItems.map(item => item._id);
      const result = await collection.updateMany(
        { _id: { $in: ids } },
        { 
          $set: { 
            cleanupFlag: 'category_mismatch', 
            needsReview: true,
            formalityLevel: 'needs_review'
          } 
        }
      );
      console.log(`   ✅ ${result.modifiedCount} items marqués pour revue`);
    }
  }

  private async generateCleanupReport(collection: Collection<WardrobeItem>): Promise<void> {
    console.log('\n📊 RAPPORT DE NETTOYAGE...');
    
    const categories = await collection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();

    console.log('   📂 Répartition par catégorie:');
    categories.forEach((cat: any) => {
      console.log(`      - ${cat._id || 'non catégorisé'}: ${cat.count} items`);
    });

    const formalityLevels = await collection.aggregate([
      { $group: { _id: '$formalityLevel', count: { $sum: 1 } } }
    ]).toArray();

    console.log('   🎭 Niveaux de formalité:');
    formalityLevels.forEach((level: any) => {
      console.log(`      - ${level._id || 'non défini'}: ${level.count} items`);
    });

    const flaggedItems = await collection.countDocuments({
      $or: [
        { cleanupFlag: { $exists: true } },
        { needsReview: true }
      ]
    });

    console.log(`   🚩 Items nécessitant une revue: ${flaggedItems}`);
  }
}

// Exécution du script
async function main(): Promise<void> {
  const cleaner = new DataCleaner();
  
  try {
    await cleaner.cleanDatabase();
    console.log('\n🎉 NETTOYAGE COMPLÉTÉ AVEC SUCCÈS!');
  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE:', error);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { DataCleaner, WardrobeItem };
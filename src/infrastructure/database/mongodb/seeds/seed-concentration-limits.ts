import { Db, ObjectId } from 'mongodb';

export async function seedConcentrationLimits(db: Db): Promise<void> {
  const collection = db.collection('concentration_limits');

  // Check if already seeded
  const count = await collection.countDocuments({});
  if (count > 0) {
    console.log('Concentration limits already seeded, skipping...');
    return;
  }

  const now = new Date();

  await collection.insertMany([
    {
      _id: new ObjectId(),
      uf: null,
      limit: 0.1,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      uf: 'SP',
      limit: 0.2,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log('Concentration limits seeded successfully:');
  console.log('  - Default: 10%');
  console.log('  - SP: 20%');
}

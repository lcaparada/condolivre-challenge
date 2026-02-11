import { connectToDatabase, disconnectFromDatabase } from '../mongo-connection';
import { seedConcentrationLimits } from './seed-concentration-limits';

async function main() {
  try {
    console.log('Connecting to database...');
    const db = await connectToDatabase();

    console.log('Running seeds...');
    await seedConcentrationLimits(db);

    console.log('Seeds completed successfully!');
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  } finally {
    await disconnectFromDatabase();
  }
}

main();

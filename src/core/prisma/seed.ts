import { seedDatabase } from '../../common/seed-database';

async function main() {
  await seedDatabase();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

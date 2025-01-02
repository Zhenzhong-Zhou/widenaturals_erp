const readline = require('readline');
const { loadEnv } = require('../../config/env');
const env = loadEnv();
const knex = require('knex')(require('../../../knexfile')[env]);

/**
 * Reseeds the database by rolling back all migrations, reapplying them, and rerunning seed files.
 * - Skips reseeding in production.
 * - Allows optional specific seed file execution.
 */
const reseedDatabase = async () => {
  if (env === 'production') {
    console.error('Reseeding is not allowed in the production environment!');
    process.exit(1);
  }

  console.log(`Starting reseed process for the '${env}' environment...`);

  try {
    // Rollback all migrations
    console.log('Rolling back all migrations...');
    await knex.migrate.rollback(null, true);

    // Reapply migrations
    console.log('Reapplying migrations...');
    await knex.migrate.latest();

    // Run seeds
    console.log('Running seed files...');
    const specificSeed = process.argv[2]; // Optional specific seed file
    if (specificSeed) {
      console.log(`Running specific seed file: ${specificSeed}`);
      await knex.seed.run({ specific: specificSeed });
    } else {
      console.log('Running all seed files...');
      await knex.seed.run();
    }

    console.log('Database reseeded successfully.');
  } catch (err) {
    console.error('Error during reseed process:', err.message);
    process.exit(1); // Exit with failure
  } finally {
    // Ensure Knex connection is closed
    await knex.destroy();
    console.log('Knex connection destroyed.');
  }
};

/**
 * Starts the reseeding process with an optional confirmation prompt for staging.
 */
const startReseeding = async () => {
  try {
    if (env === 'staging') {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Await user confirmation for staging
      const confirmation = await new Promise((resolve) => {
        rl.question(
          'Are you sure you want to reseed the database in staging? (yes/no): ',
          (answer) => {
            rl.close(); // Close the readline interface
            resolve(answer.toLowerCase());
          }
        );
      });

      if (confirmation === 'yes') {
        console.log('Proceeding with reseeding...');
        await reseedDatabase();
      } else {
        console.log('Reseeding canceled.');
        process.exit(0); // Exit cleanly
      }
    } else {
      // Directly reseed for development and test environments
      await reseedDatabase();
    }
  } catch (err) {
    console.error('Error during startReseeding:', err.message);
    process.exit(1);
  }
};

// Call the async function
(async () => {
  try {
    await startReseeding();
  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
})();

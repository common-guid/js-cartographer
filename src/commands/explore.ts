import { cli } from '../cli.js';
import { createExplorerServer } from '../explorer/server.js';

export const explore = cli()
  .name('explore')
  .description('Launch an interactive web-based explorer for a deobfuscated project')
  .argument('<directory>', 'The output directory of a deobfuscated project')
  .option('-p, --port <number>', 'Port to listen on', '3000')
  .option('--no-open', 'Do not automatically open the browser')
  .action(async (directory, options) => {
    const port = parseInt(options.port, 10);
    const host = '127.0.0.1';

    console.log(`🗺️  Starting JS Cartographer Explorer...`);
    console.log(`   Project directory: ${directory}`);

    try {
      await createExplorerServer({ directory, port, host });

      const url = `http://${host}:${port}`;
      console.log(`✅ Explorer running at ${url}`);

      if (options.open !== false) {
        // Dynamic import to avoid issues with ESM
        const open = (await import('open')).default;
        await open(url);
        console.log(`   Opened browser automatically.`);
      }

      console.log(`   Press Ctrl+C to stop the server.`);
    } catch (error: any) {
      console.error(`❌ Failed to start explorer: ${error.message}`);
      process.exit(1);
    }
  });

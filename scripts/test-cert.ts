#!/usr/bin/env tsx

import * as path from 'path';
import { validateProgressive } from '../packages/testing/src';

async function main() {
  const templatePath = path.join(process.cwd(), 'templates', 'restaurant');

  console.log('Testing certification on restaurant template...');
  console.log(`Path: ${templatePath}`);

  try {
    const results = await validateProgressive({
      projectPath: templatePath,
      maxTier: 'tier2',
      stopOnFailure: false,
      onTierComplete: (tier, result) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${tier}: ${result.passed ? 'PASS' : 'FAIL'} (${result.duration}ms)`);

        if (!result.passed) {
          console.log(`   Errors: ${result.errors.length}`);
          if (result.errors.length > 0) {
            result.errors.slice(0, 3).forEach(e => {
              console.log(`   - ${e.file}: ${e.message}`);
            });
          }
        }
      },
    });

    console.log('\nResults:', results.length, 'tiers tested');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

/**
 * Main entry point for processing Figma JSON → Node Tree → React Native Code
 * 
 * Usage:
 * 1. Place your Figma JSON in input.json
 * 2. Run: npm start
 *    OR: npx ts-node src/index.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from './utils/logger';
import { generateUITree } from './parsers/ui-tree.parser';
import { generateCode } from './generators';
import { UITreeNode } from './types/ui-tree';

function loadFigmaJson(): any {
  const inputPath = path.join(process.cwd(), 'input.json');

  if (!fs.existsSync(inputPath)) {
    logger.error(`Input file not found: ${inputPath}`);
    logger.info('Please create input.json with your Figma JSON data');
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(inputPath, 'utf-8');
    const figmaData = JSON.parse(fileContent);

    logger.info('✅ Successfully loaded Figma JSON from input.json');
    logger.info('File name:', { name: figmaData.name || 'Unknown' });

    return figmaData;
  } catch (error) {
    logger.error('Failed to parse input.json', error);
    if (error instanceof SyntaxError) {
      logger.error('The file is not valid JSON');
    }
    process.exit(1);
  }
}

function saveOutput(uiTree: UITreeNode): void {
  const outputPath = path.join(process.cwd(), 'output.json');
  fs.writeFileSync(outputPath, JSON.stringify(uiTree, null, 2), 'utf-8');
  logger.info('💾 UI Tree saved to output.json');
}

function saveGeneratedCode(code: string): void {
  const outputPath = path.join(process.cwd(), 'output.tsx');
  fs.writeFileSync(outputPath, code, 'utf-8');
  logger.info('💾 React Native code saved to output.tsx');
}

function countNodes(node: UITreeNode): { total: number; byType: Record<string, number> } {
  const byType: Record<string, number> = {};
  let total = 0;

  function traverse(n: UITreeNode): void {
    total++;
    byType[n.componentType] = (byType[n.componentType] || 0) + 1;

    if (n.children) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return { total, byType };
}

async function main() {
  logger.info('🚀 Starting Figma JSON → React Native Code conversion...');

  // Step 1: Load Figma JSON from file
  const figmaData = loadFigmaJson();

  // Step 2: Generate UI Tree (parse Figma → semantic tree)
  logger.info('📊 Step 1: Generating UI Tree from Figma JSON...');
  const uiTree = generateUITree(figmaData);

  // Count nodes
  const stats = countNodes(uiTree);
  logger.info('UI Tree statistics:', {
    totalNodes: stats.total,
    byType: stats.byType,
  });

  // Save UI Tree to JSON
  saveOutput(uiTree);

  // Step 3: Generate React Native Code
  logger.info('⚙️ Step 2: Generating React Native code...');
  const reactNativeCode = generateCode(uiTree);

  // Save generated code
  saveGeneratedCode(reactNativeCode);

  logger.info('✅ Processing complete!');
  logger.info('Generated files:', {
    uiTree: 'output.json',
    reactNativeCode: 'output.tsx',
  });

  // Log a sample of the tree structure
  logger.info('Root component:', {
    id: uiTree.id,
    componentType: uiTree.componentType,
    componentName: uiTree.componentName,
    role: uiTree.role,
    childrenCount: uiTree.children?.length || 0,
  });

  return { uiTree, code: reactNativeCode };
}

// Run if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      logger.info('Done!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unexpected error', error);
      process.exit(1);
    });
}

export { main, loadFigmaJson, generateCode };

/**
 * Example usage of FigmaService to fetch Figma JSON from the Figma API
 * 
 * Usage:
 * 1. Set your Figma access token: export FIGMA_ACCESS_TOKEN=your_token_here
 * 2. Run: npx ts-node src/services/figma/example-usage.ts
 */

import { FigmaService } from './figma.service';

async function example() {
  const figmaService = new FigmaService();
  
  // Example: Get a Figma file
  // Replace with your actual file key (extracted from Figma URL)
  const fileKey = 'YOUR_FIGMA_FILE_KEY';
  const accessToken = process.env.FIGMA_ACCESS_TOKEN || '';
  
  if (!accessToken) {
    console.error('Please set FIGMA_ACCESS_TOKEN environment variable');
    process.exit(1);
  }
  
  try {
    // Fetch the entire file
    const fileData = await figmaService.getFile(fileKey, accessToken);
    console.log('Figma file fetched successfully!');
    console.log('File name:', fileData.name);
    console.log('Document structure:', JSON.stringify(fileData.document, null, 2));
    
    // Example: Get specific nodes
    // const nodeIds = ['node-id-1', 'node-id-2'];
    // const nodeData = await figmaService.getNodes(fileKey, nodeIds, accessToken);
    // console.log('Node data:', JSON.stringify(nodeData, null, 2));
    
  } catch (error) {
    console.error('Error fetching Figma data:', error);
  }
}

// Uncomment to run:
// example();



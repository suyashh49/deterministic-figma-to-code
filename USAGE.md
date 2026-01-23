# How to Use the Figma Service

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export FIGMA_ACCESS_TOKEN=your_figma_access_token_here
export FIGMA_FILE_KEY=your_figma_file_key_here
```

**How to get your Figma Access Token:**
- Go to https://www.figma.com/developers/api#access-tokens
- Generate a personal access token

**How to get your Figma File Key:**
- Open your Figma file in the browser
- Look at the URL: `https://www.figma.com/file/abc123xyz/Your-Design-Name`
- The file key is the part after `/file/` (e.g., `abc123xyz`)

### 3. Run the Script

```bash
npm start
```

Or using ts-node directly:

```bash
npx ts-node src/index.ts
```

## Usage Examples

### Example 1: Fetch Entire File (from index.ts)

```typescript
import { FigmaService } from './src/services/figma/figma.service';

const figmaService = new FigmaService();
const fileKey = process.env.FIGMA_FILE_KEY!;
const accessToken = process.env.FIGMA_ACCESS_TOKEN!;

const fileData = await figmaService.getFile(fileKey, accessToken);
console.log(fileData.document); // Full Figma JSON
```

### Example 2: Fetch Specific Nodes

```typescript
import { FigmaService } from './src/services/figma/figma.service';

const figmaService = new FigmaService();
const fileKey = 'your-file-key';
const accessToken = 'your-token';
const nodeIds = ['123:456', '789:012']; // Node IDs from Figma

const nodeData = await figmaService.getNodes(fileKey, nodeIds, accessToken);
console.log(nodeData.nodes); // Specific nodes data
```

### Example 3: Use in Your Own Code

```typescript
import { FigmaService, FigmaFileResponse } from './src/services/figma/figma.service';

async function processFigmaDesign() {
  const service = new FigmaService();
  
  // Fetch the file
  const fileData: FigmaFileResponse = await service.getFile(
    'your-file-key',
    'your-access-token'
  );
  
  // Now you can process fileData.document
  // This contains the full Figma JSON structure
  const document = fileData.document;
  
  // Access document properties
  console.log('Document name:', document.name);
  console.log('Document type:', document.type);
  console.log('Children:', document.children);
  
  // Process the JSON as needed
  return document;
}
```

## Response Structure

The `getFile()` method returns a `FigmaFileResponse` with:

```typescript
{
  name: string;                    // File name
  lastModified: string;            // Last modified timestamp
  thumbnailUrl: string;            // Thumbnail URL
  version: string;                 // File version
  document: FigmaNode;            // Main document tree (this is the JSON you want!)
  components: Record<string, unknown>;
  componentSets: Record<string, unknown>;
  styles: Record<string, unknown>;
  schemaVersion: number;
}
```

The `document` property contains the full Figma JSON structure with all nodes, frames, and design data.

## Error Handling

The service handles errors automatically:

- **Rate Limits (429)**: Throws `RateLimitError` with retry information
- **API Errors**: Throws `FigmaApiError` with status code
- **Network Errors**: Throws `FigmaApiError` with 500 status

Example error handling:

```typescript
import { FigmaService } from './src/services/figma/figma.service';
import { RateLimitError, FigmaApiError } from './src/utils/errors';

try {
  const fileData = await figmaService.getFile(fileKey, accessToken);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof FigmaApiError) {
    console.error('Figma API error:', error.message, error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```



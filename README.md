# Deterministic Figma to Code

This repository processes Figma JSON to extract and structure design data for code generation.

## Structure

```
src/
├── config/
│   └── figma.config.ts          # Figma API configuration
├── processors/
│   └── figma.processor.ts       # Main processor for Figma JSON
├── services/
│   └── figma/
│       ├── figma.service.ts      # Service for fetching Figma data (optional)
│       └── example-usage.ts      # Example usage
└── utils/
    ├── errors.ts                 # Error classes
    ├── http.ts                   # HTTP client wrapper using axios
    └── logger.ts                 # Simple logger utility
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Your Figma JSON

Place your Figma JSON file as `input.json` in the root directory. See `input.json.example` for the expected format.

### 3. Run the Processor

```bash
npm start
```

This will:
- Load the Figma JSON from `input.json`
- Process the document structure
- Extract pages, frames, and components
- Output a summary of the processed data

## Core Components

### FigmaProcessor

The main processor (`src/processors/figma.processor.ts`) extracts structured data from Figma JSON:

- **Pages**: All pages/canvases in the document
- **Frames**: All frames and components found in the design
- **Components**: Component definitions and sets
- **Summary**: Statistics about the processed data

### Processing Logic

The processor:
1. Traverses the Figma document tree
2. Identifies pages (CANVAS/PAGE nodes)
3. Recursively finds all frames and components
4. Extracts metadata (bounds, names, types)
5. Builds a structured output

## Usage

### Basic Example

```typescript
import { loadFigmaJson } from './src/index';
import { processFigmaDocument } from './src/processors/figma.processor';

// Load JSON from file
const figmaData = loadFigmaJson();

// Process the document
const result = processFigmaDocument(figmaData.document);

console.log(result.summary);
// { totalPages: 2, totalFrames: 15, totalComponents: 5 }
```

### Input Format

The `input.json` file should contain a Figma API response with this structure:

```json
{
  "name": "File Name",
  "document": {
    "id": "0:0",
    "type": "DOCUMENT",
    "children": [...]
  },
  ...
}
```

## Next Steps

The processing logic can be extended to:
- Extract specific design tokens (colors, typography, spacing)
- Identify component hierarchies
- Generate code-ready data structures
- Map Figma elements to code components


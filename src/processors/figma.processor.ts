import { FigmaNode } from '../services/figma/figma.service';
import { logger } from '../utils/logger';

/**
 * Processed result structure
 */
export interface ProcessedFigmaData {
  pages: ProcessedPage[];
  frames: ProcessedFrame[];
  components: ProcessedComponent[];
  summary: {
    totalPages: number;
    totalFrames: number;
    totalComponents: number;
  };
}

export interface ProcessedPage {
  id: string;
  name: string;
  type: string;
  frameCount: number;
}

export interface ProcessedFrame {
  id: string;
  name: string;
  type: string;
  pageId?: string;
  pageName?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  children?: ProcessedFrame[];
}

export interface ProcessedComponent {
  id: string;
  name: string;
  type: string;
}

/**
 * Main processor for Figma document
 */
export function processFigmaDocument(document: FigmaNode): ProcessedFigmaData {
  logger.info('Processing document:', {
    id: document.id,
    name: document.name,
    type: document.type,
  });

  const pages: ProcessedPage[] = [];
  const frames: ProcessedFrame[] = [];
  const components: ProcessedComponent[] = [];

  // Process pages (children of document)
  if (document.children) {
    for (const page of document.children) {
      if (page.type === 'CANVAS' || page.type === 'PAGE') {
        const processedPage = processPage(page);
        pages.push(processedPage.page);
        frames.push(...processedPage.frames);
        components.push(...processedPage.components);
      }
    }
  }

  return {
    pages,
    frames,
    components,
    summary: {
      totalPages: pages.length,
      totalFrames: frames.length,
      totalComponents: components.length,
    },
  };
}

/**
 * Process a single page
 */
function processPage(page: FigmaNode): {
  page: ProcessedPage;
  frames: ProcessedFrame[];
  components: ProcessedComponent[];
} {
  const frames: ProcessedFrame[] = [];
  const components: ProcessedComponent[] = [];
  let frameCount = 0;

  // Recursively find all frames and components
  const findFramesAndComponents = (node: FigmaNode, parentFrame?: ProcessedFrame): void => {
    // Check if this is a frame
    if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      const frame = extractFrame(node, page.id, page.name);
      frameCount++;
      
      if (parentFrame) {
        if (!parentFrame.children) {
          parentFrame.children = [];
        }
        parentFrame.children.push(frame);
      } else {
        frames.push(frame);
      }
      
      // Process children of this frame
      if (node.children) {
        for (const child of node.children) {
          findFramesAndComponents(child, frame);
        }
      }
    } 
    // Check if this is a component definition
    else if (node.type === 'COMPONENT_SET') {
      components.push({
        id: node.id,
        name: node.name || 'Unnamed Component',
        type: node.type,
      });
      
      // Process component children
      if (node.children) {
        for (const child of node.children) {
          findFramesAndComponents(child);
        }
      }
    }
    // Process other children
    else if (node.children) {
      for (const child of node.children) {
        findFramesAndComponents(child, parentFrame);
      }
    }
  };

  // Start processing from page children
  if (page.children) {
    for (const child of page.children) {
      findFramesAndComponents(child);
    }
  }

  return {
    page: {
      id: page.id,
      name: page.name || 'Unnamed Page',
      type: page.type,
      frameCount,
    },
    frames,
    components,
  };
}

/**
 * Extract frame information from a Figma node
 */
function extractFrame(
  node: FigmaNode,
  pageId: string,
  pageName: string
): ProcessedFrame {
  const frame: ProcessedFrame = {
    id: node.id,
    name: node.name || 'Unnamed Frame',
    type: node.type,
    pageId,
    pageName,
  };

  // Extract bounds if available
  if (node.absoluteBoundingBox) {
    const bounds = node.absoluteBoundingBox as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    frame.bounds = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  } else if (node.absoluteRenderBounds) {
    const bounds = node.absoluteRenderBounds as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    frame.bounds = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  return frame;
}



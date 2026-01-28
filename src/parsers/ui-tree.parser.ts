/**
 * Deterministic Figma JSON → Node Tree Parser
 * 
 * NEW BASELINE: Suffix-preserving, semantic collapse rules
 * - Preserve exact component type suffixes (no transformation)
 * - Implement semantic collapse rules
 * - Drop all Figma noise fields
 * - Enforce output invariants
 */

import { UITreeNode } from '../types/ui-tree';

/**
 * Figma node type (minimal interface - only whitelisted fields)
 */
interface FigmaNode {
  id: string;
  name?: string;
  type: string;
  visible?: boolean;
  opacity?: number;
  children?: FigmaNode[];
  characters?: string;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';
  style?: {
    fontSize?: number;
  };
  strokes?: unknown[];
  fills?: unknown[];
  [key: string]: unknown;
}

/**
 * Main entry point: Generate UI Tree from Figma JSON
 * Root is just another component following the naming pattern
 */
export function generateUITree(figmaJson: any): UITreeNode {
  // Find the document root
  const document = figmaJson.document || figmaJson;
  
  // Find the first top-level component (using skip rule)
  const topFrame = findTopLevelComponent(document);
  
  if (!topFrame) {
    throw new Error('No top-level component found in Figma JSON');
  }
  
  // Parse the root frame - no special handling needed
  return parseFigmaNode(topFrame);
}

/**
 * Skip rule: Only process nodes that look like components
 * Pattern: name_componentTypeinCAPS
 * NOTE: TEXT nodes are handled separately before this rule
 */
function shouldSkipNode(figmaNode: any): boolean {
  // TEXT nodes are never skipped (handled by TEXT rules)
  if (figmaNode.type === 'TEXT') return false;
  
  const name = figmaNode.name || '';
  
  // Check if name follows component pattern: name_componentTypeinCAPS
  const looksLikeComponent = /^[^_]+_([A-Z_]+)$/.test(name);
  
  // Also allow FRAMEs with single TEXT child (TEXT heuristic fallback)
  if ((figmaNode.type === 'FRAME' || figmaNode.type === 'COMPONENT') && figmaNode.children) {
    const children = figmaNode.children || [];
    if (children.length === 1 && children[0].type === 'TEXT' && !name.includes('_')) {
      return false; // Don't skip - will be handled by TEXT rule T3
    }
  }
  
  if (!looksLikeComponent) return true;
  if (figmaNode.type === 'DOCUMENT') return true;
  if (figmaNode.type === 'CANVAS') return true;
  if (figmaNode.type === 'PAGE') return true;
  
  return false;
}

/**
 * Find the first top-level component in the document tree
 * Uses skip rule to find nodes that follow the naming pattern
 */
function findTopLevelComponent(node: any): FigmaNode | null {
  // Skip non-component nodes
  if (shouldSkipNode(node)) {
    if (node.children) {
      for (const child of node.children) {
        const component = findTopLevelComponent(child);
        if (component) return component;
      }
    }
    return null;
  }
  
  // This is a component node
  return node as FigmaNode;
}

/**
 * Parse a Figma node into a UITreeNode
 * Implements semantic collapse rules based on componentType
 */
export function parseFigmaNode(figmaNode: FigmaNode): UITreeNode {
  // ============================================================================
  // TEXT DETECTION RULES (MUST RUN FIRST - BEFORE ALL OTHER LOGIC)
  // ============================================================================
  
  // RULE T1: Raw TEXT node
  if (figmaNode.type === 'TEXT') {
    return {
      id: figmaNode.id,
      componentType: 'TEXT',
      componentName: 'Text',
      role: figmaNode.name || '',
      text: (figmaNode as any).characters || '',
    };
  }
  
  // RULE T2: TEXT wrapper frame (name ends with _TEXT)
  if (figmaNode.type === 'FRAME' || figmaNode.type === 'COMPONENT') {
    const name = figmaNode.name || '';
    if (name.endsWith('_TEXT')) {
      const children = figmaNode.children || [];
      if (children.length === 1 && (children[0] as any).type === 'TEXT') {
        const textChild = children[0] as any;
        return {
          id: figmaNode.id,
          componentType: 'TEXT',
          componentName: name.replace(/_TEXT$/, ''),
          role: name,
          text: textChild.characters || '',
        };
      }
    }
  }
  
  // RULE T3: TEXT heuristic fallback (FRAME with single TEXT child, no underscore in name)
  if (figmaNode.type === 'FRAME' || figmaNode.type === 'COMPONENT') {
    const name = figmaNode.name || '';
    const children = figmaNode.children || [];
    
    if (children.length === 1 && (children[0] as any).type === 'TEXT' && !name.includes('_')) {
      const textChild = children[0] as any;
      return {
        id: figmaNode.id,
        componentType: 'TEXT',
        componentName: 'Text',
        role: name,
        text: textChild.characters || '',
      };
    }
  }
  
  // ============================================================================
  // REGULAR PARSING (after TEXT rules)
  // ============================================================================
  
  // Step 1: Parse component name and type from name
  let { componentName, componentType, role } = parseComponentName(figmaNode.name || '');
  
  // Step 1.5: Override componentType based on Figma type field if name doesn't have suffix
  // If Figma type is VECTOR, treat as ICON if not already classified
  if (figmaNode.type === 'VECTOR' && componentType === 'UNKNOWN') {
    componentType = 'ICON';
    componentName = figmaNode.name || undefined;
    role = figmaNode.name || '';
  }
  
  // Step 2: Handle TOUCHABLE_CARD special case
  if (componentType === 'TOUCHABLE_CARD') {
    return parseTouchableCard(figmaNode, componentName, role);
  }
  
  // Step 3: Create base node
  const node: UITreeNode = {
    id: figmaNode.id,
    componentType,
    componentName,
    role,
  };
  
  // Step 4: Extract layout (for layout containers)
  if (isLayoutContainer(componentType)) {
    const layout = extractLayout(figmaNode);
    if (layout) {
      node.layout = layout;
    }
  } else if (componentType === 'SAFEAREAVIEW') {
    // SAFEAREAVIEW is a layout container
    const layout = extractLayout(figmaNode);
    if (layout) {
      node.layout = layout;
    }
  }
  
  // Step 5: Component-type-specific extraction
  switch (componentType) {
    case 'TEXT':
      return parseTextNode(figmaNode, node);
    
    case 'BUTTON':
      return parseButtonNode(figmaNode, node);
    
    case 'CARD':
      return parseCardNode(figmaNode, node);
    
    case 'INPUT':
    case 'SEARCHABLE_INPUT':
      return parseInputNode(figmaNode, node);
    
    case 'SVG':
    case 'ICON':
      return parseIconNode(figmaNode, node);
    
    case 'VIEW':
    case 'SCROLLABLE_VIEW':
    case 'HEADER':
    case 'TOPBAR':
    case 'SAFEAREAVIEW':
      return parseLayoutNode(figmaNode, node);
    
    default:
      // For unknown types, treat as layout container if it has layoutMode
      if (figmaNode.layoutMode) {
        return parseLayoutNode(figmaNode, node);
      }
      // Otherwise, minimal node
      return node;
  }
}

/**
 * Step 1: Parse component name and type from Figma name
 * Pattern: name_componentTypeinCAPS
 * Finds the first underscore and checks that everything after is all caps
 * Example: "Button_TOUCHABLE_CARD" → componentName: "Button", componentType: "TOUCHABLE_CARD"
 * Example: "5.1 - Help_SAFEAREAVIEW" → componentName: "5.1 - Help", componentType: "SAFEAREAVIEW"
 * Example: "Container_SEARCHABLE_INPUT" → componentName: "Container", componentType: "SEARCHABLE_INPUT"
 */
function parseComponentName(fullName: string): {
  componentName: string | undefined;
  componentType: string;
  role: string;
} {
  const firstUnderscore = fullName.indexOf('_');
  
  if (firstUnderscore === -1) {
    // No underscore → componentType = "UNKNOWN"
    return {
      componentName: fullName || undefined,
      componentType: 'UNKNOWN',
      role: fullName,
    };
  }
  
  // Everything after the first underscore should be the component type (all caps)
  const componentType = fullName.slice(firstUnderscore + 1).trim();
  
  // Verify that component type is all caps (allowing underscores)
  const isAllCaps = /^[A-Z_]+$/.test(componentType);
  
  if (!isAllCaps) {
    // If not all caps, treat as UNKNOWN
    return {
      componentName: fullName || undefined,
      componentType: 'UNKNOWN',
      role: fullName,
    };
  }
  
  const componentName = fullName.slice(0, firstUnderscore).trim();
  
  return {
    componentName: componentName || undefined,
    componentType,
    role: fullName,
  };
}

/**
 * Step 2: Handle TOUCHABLE_CARD → CARD with action
 * Extracts title/subtitle from first two TEXT descendants
 * Does NOT recurse into grandchildren
 */
function parseTouchableCard(
  figmaNode: FigmaNode,
  componentName: string | undefined,
  role: string
): UITreeNode {
  const node: UITreeNode = {
    id: figmaNode.id,
    componentType: 'CARD', // Transform to CARD
    componentName,
    role,
    action: { type: 'press' },
  };
  
  // Extract variant from strokes/fills
  extractVariant(figmaNode, node);
  
  // Extract padding
  const layout = extractLayout(figmaNode);
  if (layout?.padding) {
    node.layout = { padding: layout.padding };
  }
  
  // Extract title and subtitle from first two TEXT descendants
  const textNodes: string[] = [];
  collectTextDescendants(figmaNode, textNodes, 2); // Limit to 2
  
  if (textNodes.length >= 1) {
    node.title = textNodes[0];
  }
  if (textNodes.length >= 2) {
    node.subtitle = textNodes[1];
  }
  
  // DO NOT recurse into children (semantic collapse)
  return node;
}

/**
 * Step 3A: Parse TEXT node
 * Rules: No children, no action, no layout
 * Text content is in the "name" field
 */
function parseTextNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Extract text from name field
  if (figmaNode.name) {
    node.text = figmaNode.name;
  }
  
  // Extract size from fontSize
  if (figmaNode.style?.fontSize) {
    const fontSize = figmaNode.style.fontSize;
    if (fontSize >= 12 && fontSize <= 14) {
      node.styleHints = { size: 'sm' };
    } else if (fontSize >= 15 && fontSize <= 17) {
      node.styleHints = { size: 'md' };
    } else if (fontSize >= 18) {
      node.styleHints = { size: 'lg' };
    }
  }
  
  // TEXT nodes NEVER have children (semantic collapse rule)
  return node;
}

/**
 * Step 3B: Parse BUTTON node
 * * Logic:
 * 1. Layout: Extract auto-layout properties.
 * 2. Variant: Determine visual style (regular, outline, ghost).
 * 3. Text: Find the first text node for content and size.
 * 4. Icons: Detect sibling nodes (icons) relative to text position.
 * 5. State: Detect disabled state via opacity.
 * 6. Collapse: Do not process children recursively; map them to props instead.
 */
function parseButtonNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // 1. Extract Layout
  const layout = extractLayout(figmaNode);
  if (layout) {
    node.layout = layout;
  }

  node.styleHints = node.styleHints || {};
  node.props = node.props || {};

  // 2. Extract Variant
  extractVariant(figmaNode, node);

  // 3. Extract Content
  if (figmaNode.children) {
    const textChild = findFirstTextDescendant(figmaNode);

    // -- Text Processing --
    if (textChild) {
      node.text = (textChild as any).characters || textChild.name;
      
      // Size Logic
      if (textChild.style?.fontSize) {
        const fontSize = textChild.style.fontSize;
        if (fontSize <= 12) node.styleHints.size = 'sm';
        else if (fontSize >= 13 && fontSize <= 16) node.styleHints.size = 'md';
        else if (fontSize >= 17) node.styleHints.size = 'lg';
      }
    }

    // -- Icon Processing (Reusing your standard logic) --
    // Filter children using the centralized helper
    const iconNodes = figmaNode.children.filter(child => 
      child.visible !== false && 
      child !== textChild && // Ensure we don't pick the text node
      isFigmaNodeIcon(child) // <--- USES YOUR SHARED LOGIC
    );

    if (iconNodes.length > 0 && textChild) {
      // We need coordinates to determine Left vs Right
      // (Cast to any if your simplified interface is missing absoluteBoundingBox)
      const textX = (textChild as any).absoluteBoundingBox?.x || 0;
      
      iconNodes.forEach(iconFigmaNode => {
        const iconX = (iconFigmaNode as any).absoluteBoundingBox?.x || 0;
        
        // PARSE the icon using your standard parser to get the correct name/role
        // We reuse your `parseComponentName` to get the clean name "Search" from "Search_ICON"
        const { componentName } = parseComponentName(iconFigmaNode.name || '');
        const cleanName = componentName || iconFigmaNode.name || 'Icon';

        // Assign to Props
        if (iconX < textX) {
          node.props!.leftIcon = cleanName;
        } else {
          node.props!.rightIcon = cleanName;
        }
      });
    }
  }

  // 4. Disabled State
  if (figmaNode.opacity !== undefined && figmaNode.opacity < 0.9) {
    node.props.disabled = true;
  }

  node.action = { type: 'press' };
  
  return node;
}


/**
 * Step 3C: Parse CARD node
 * Rules: Recurse only into VIEW, TEXT, SVG, BUTTON
 * Drop layout-only wrappers
 * Extract TEXT type children into parent's text field
 */
function parseCardNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Extract variant
  extractVariant(figmaNode, node);
  
  // Extract padding
  const layout = extractLayout(figmaNode);
  if (layout?.padding) {
    node.layout = { padding: layout.padding };
  }
  
  // Extract TEXT type children into parent's text field
  extractTextChildren(figmaNode, node);
  
  // Recurse into children (but apply semantic collapse)
  if (figmaNode.children && figmaNode.children.length > 0) {
    const children: UITreeNode[] = [];
    
    for (const child of figmaNode.children) {
      // Skip TEXT type children (already extracted)
      if ((child as any).type === 'TEXT') {
        continue;
      }
      
      const childName = child.name || '';
      const { componentType } = parseComponentName(childName);
      
      // Only recurse into semantic children
      if (isSemanticChild(componentType)) {
        const parsedChild = parseFigmaNode(child as FigmaNode);
        
        // Drop layout-only VIEW nodes with 0 semantic children
        if (parsedChild.componentType === 'VIEW' && !hasSemanticContent(parsedChild)) {
          // Skip this wrapper
          if (parsedChild.children) {
            children.push(...parsedChild.children);
          }
        } else {
          children.push(parsedChild);
        }
      }
    }
    
    if (children.length > 0) {
      node.children = children;
    }
  }
  
  return node;
}

/**
 * Step 3D: Parse INPUT node
 * Rules: Extract placeholder from first TEXT, label from label TEXT
 */
function parseInputNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Extract layout
  const layout = extractLayout(figmaNode);
  if (layout) {
    node.layout = layout;
  }
  
  // Extract placeholder and label from TEXT children
  // Text content is in the "name" field
  if (figmaNode.children) {
    const textNodes: Array<{ text: string; isLabel?: boolean }> = [];
    
    for (const child of figmaNode.children) {
      if ((child as any).type === 'TEXT') {
        const childName = (child as any).name || '';
        const text = childName; // Text is in the name field
        
        if (childName.toLowerCase().includes('label')) {
          textNodes.push({ text, isLabel: true });
        } else {
          textNodes.push({ text });
        }
      }
    }
    
    // First non-label TEXT is placeholder
    const placeholder = textNodes.find(t => !t.isLabel);
    if (placeholder) {
      node.text = placeholder.text;
    }
    
    // Label TEXT becomes title
    const label = textNodes.find(t => t.isLabel);
    if (label) {
      node.title = label.text;
    }
  }
  
  // INPUT nodes do NOT recurse (semantic collapse)
  return node;
}

/**
 * Step 3E: Parse ICON/SVG node
 * Rules: No recursion, no layout, no text, no action
 */
function parseIconNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // ICON/SVG nodes are minimal - no additional extraction
  return node;
}

/**
 * Step 3F: Parse layout container (VIEW, SCROLLABLE_VIEW, HEADER, TOPBAR)
 * Rules: Always recurse, no text/title/subtitle, no action
 * Extract TEXT type children into parent's text field
 */
function parseLayoutNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Extract layout
  const layout = extractLayout(figmaNode);
  if (layout) {
    node.layout = layout;
  }
  
  // Extract TEXT type children into parent's text field
  extractTextChildren(figmaNode, node);
  
  // Recurse into children (apply semantic collapse)
  if (figmaNode.children && figmaNode.children.length > 0) {
    const children: UITreeNode[] = [];
    
    for (const child of figmaNode.children) {
      // Skip TEXT type children (already extracted)
      if ((child as any).type === 'TEXT') {
        continue;
      }
      
      const parsedChild = parseFigmaNode(child as FigmaNode);
      
      // Drop layout-only VIEW nodes with 0 semantic children
      if (parsedChild.componentType === 'VIEW' && !hasSemanticContent(parsedChild)) {
        if (parsedChild.children) {
          children.push(...parsedChild.children);
        }
      } else {
        children.push(parsedChild);
      }
    }
    
    if (children.length > 0) {
      node.children = children;
    }
  }
  
  return node;
}

/**
 * Extract layout information (whitelist only)
 */
function extractLayout(figmaNode: FigmaNode): UITreeNode['layout'] | undefined {
  const layout: UITreeNode['layout'] = {};

  // Extract direction from layoutMode
  if (figmaNode.layoutMode === 'HORIZONTAL') {
    layout.direction = 'horizontal';
  } else if (figmaNode.layoutMode === 'VERTICAL') {
    layout.direction = 'vertical';
  }

  // Extract gap from itemSpacing
  if (typeof figmaNode.itemSpacing === 'number') {
    layout.gap = figmaNode.itemSpacing;
  }

  // Extract padding
  const padding: { top?: number; right?: number; bottom?: number; left?: number } = {};
  let hasPadding = false;

  if (typeof figmaNode.paddingTop === 'number') {
    padding.top = figmaNode.paddingTop;
    hasPadding = true;
  }
  if (typeof figmaNode.paddingRight === 'number') {
    padding.right = figmaNode.paddingRight;
    hasPadding = true;
  }
  if (typeof figmaNode.paddingBottom === 'number') {
    padding.bottom = figmaNode.paddingBottom;
    hasPadding = true;
  }
  if (typeof figmaNode.paddingLeft === 'number') {
    padding.left = figmaNode.paddingLeft;
    hasPadding = true;
  }

  if (hasPadding) {
    // If all padding values are the same, use a single number
    const values = [padding.top, padding.right, padding.bottom, padding.left].filter(v => v !== undefined);
    if (values.length === 4 && new Set(values).size === 1) {
      layout.padding = values[0]!;
    } else {
      layout.padding = padding as { top: number; right: number; bottom: number; left: number };
    }
  }

  // Extract align from counterAxisAlignItems
  if (figmaNode.counterAxisAlignItems) {
    const alignMap: Record<string, 'start' | 'center' | 'end' | 'stretch'> = {
      'MIN': 'start',
      'CENTER': 'center',
      'MAX': 'end',
      'STRETCH': 'stretch',
    };
    layout.align = alignMap[figmaNode.counterAxisAlignItems];
  }

  // Return layout only if it has at least one property
  if (Object.keys(layout).length > 0) {
    return layout;
  }

  return undefined;
}

/**
 * Helper: Determines button variant based on Fills/Strokes
 */
function extractVariant(figmaNode: FigmaNode, node: UITreeNode): void {
  // Ensure styleHints exists
  node.styleHints = node.styleHints || {};

  // Check for visible strokes
  // Cast to any because your interface has unknown[] for strokes/fills
  const hasStrokes = Array.isArray(figmaNode.strokes) && 
                     figmaNode.strokes.length > 0 && 
                     figmaNode.strokes.some((s: any) => s.visible !== false);

  // Check for visible solid fills
  const hasFills = Array.isArray(figmaNode.fills) && 
                   figmaNode.fills.length > 0 && 
                   figmaNode.fills.some((f: any) => f.visible !== false && f.type === 'SOLID');

  if (hasStrokes && !hasFills) {
    node.styleHints.variant = 'outline';
  } else if (hasFills) {
    node.styleHints.variant = 'regular'; // 'filled'
  } else {
    // No fill, No stroke = Ghost / Text variant
    node.styleHints.variant = 'ghost';
  }
}

/**
 * Shared Helper: Centralized logic for what counts as an "Icon"
 * Matches your Step 1.5 and Case logic from the main parser.
 */
function isFigmaNodeIcon(node: FigmaNode): boolean {
  // 1. Explicit Component Type (from name suffix)
  const { componentType } = parseComponentName(node.name || '');
  if (['ICON', 'SVG'].includes(componentType)) return true;

  // 2. Heuristic: Component Instances that explicitly say "Icon"
  if (node.type === 'INSTANCE' && node.name?.toLowerCase().includes('icon')) return true;

  // 3. Heuristic: Raw VECTORS (matches your Step 1.5)
  if (node.type === 'VECTOR') return true;

  return false;
}

/**
 * Helper: Check if component type is a layout container
 */
function isLayoutContainer(componentType: string): boolean {
  return ['VIEW', 'SCROLLABLE_VIEW', 'HEADER', 'TOPBAR', 'SAFEAREAVIEW', 'CARD', 'BUTTON', 'INPUT', 'SEARCHABLE_INPUT'].includes(componentType);
}

/**
 * Helper: Check if component type is a semantic child (allowed in CARD)
 */
function isSemanticChild(componentType: string): boolean {
  return ['VIEW', 'TEXT', 'SVG', 'ICON', 'BUTTON'].includes(componentType);
}

/**
 * Helper: Check if node has semantic content (not just layout wrappers)
 */
function hasSemanticContent(node: UITreeNode): boolean {
  if (node.text || node.title || node.subtitle) {
    return true;
  }
  
  if (node.children) {
    return node.children.some(child => 
      child.componentType !== 'VIEW' || hasSemanticContent(child)
    );
  }
  
  return false;
}

/**
 * Extract TEXT type children (Figma type === "TEXT") into parent's text field
 * TEXT children should not be created as separate nodes
 * Text content is in the "name" field of the TEXT element
 */
function extractTextChildren(figmaNode: FigmaNode, node: UITreeNode): void {
  if (!figmaNode.children) return;
  
  // Find all direct TEXT type children
  const textChildren = figmaNode.children.filter((child: any) => child.type === 'TEXT');
  
  if (textChildren.length > 0) {
    // Use the first TEXT child's name as the text
    const firstText = textChildren[0];
    if (firstText.name) {
      node.text = firstText.name;
      
      // Extract size from fontSize if available
      if (firstText.style?.fontSize) {
        const fontSize = firstText.style.fontSize;
        if (fontSize >= 12 && fontSize <= 14) {
          node.styleHints = { ...node.styleHints, size: 'sm' };
        } else if (fontSize >= 15 && fontSize <= 17) {
          node.styleHints = { ...node.styleHints, size: 'md' };
        } else if (fontSize >= 18) {
          node.styleHints = { ...node.styleHints, size: 'lg' };
        }
      }
    }
  }
}

/**
 * Helper: Find first TEXT descendant (for BUTTON text extraction)
 * Text content is in the "name" field
 */
function findFirstTextDescendant(figmaNode: FigmaNode): FigmaNode | null {
  if (figmaNode.type === 'TEXT' && figmaNode.name) {
    return figmaNode;
  }
  
  if (figmaNode.children) {
    for (const child of figmaNode.children) {
      const textNode = findFirstTextDescendant(child as FigmaNode);
      if (textNode) return textNode;
    }
  }
  
  return null;
}

/**
 * Helper: Collect TEXT descendants (for TOUCHABLE_CARD title/subtitle)
 * Text content is in the "name" field
 */
function collectTextDescendants(figmaNode: FigmaNode, texts: string[], limit: number = Infinity): void {
  if (texts.length >= limit) return;
  
  if (figmaNode.type === 'TEXT' && figmaNode.name) {
    texts.push(figmaNode.name);
    return;
  }
  
  if (figmaNode.children) {
    for (const child of figmaNode.children) {
      if (texts.length >= limit) break;
      collectTextDescendants(child as FigmaNode, texts, limit);
    }
  }
}

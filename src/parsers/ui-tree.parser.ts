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
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fontSize?: number;
  };
  strokes?: unknown[];
  fills?: unknown[];
  effects?: {
    type: string;
    visible?: boolean;
  }[];
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
    const textNode: UITreeNode = {
      id: figmaNode.id,
      componentType: 'TEXT',
      componentName: 'Text',
      role: figmaNode.name || '',
      text: (figmaNode as any).characters || '',
    };
    // Extract text styles (color, font)
    const styles = extractStyles(figmaNode);
    if (styles) {
      textNode.styles = styles;
    }
    return textNode;
  }

  // RULE T2: TEXT wrapper frame (name ends with _TEXT)
  // This handles containers like "Container_TEXT" which wrap multiple text elements
  if (figmaNode.type === 'FRAME' || figmaNode.type === 'COMPONENT') {
    const name = figmaNode.name || '';
    if (name.endsWith('_TEXT')) {
      // Collect ALL nested TEXT nodes as children
      const textChildren: UITreeNode[] = [];
      collectAllTextNodes(figmaNode, textChildren);

      if (textChildren.length === 1) {
        // Single TEXT: return as a single TEXT node
        return textChildren[0];
      } else if (textChildren.length > 1) {
        // Multiple TEXTs: return as a VIEW containing TEXT children
        return {
          id: figmaNode.id,
          componentType: 'VIEW',
          componentName: name.replace(/_TEXT$/, ''),
          role: name,
          children: textChildren,
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

  // Step 3.25: Extract bounds for visual position sorting
  const bounds = extractBounds(figmaNode);
  if (bounds) {
    node.bounds = bounds;
  }

  // Step 3.5: Extract visual styles (colors, borders, etc.)
  const styles = extractStyles(figmaNode);
  if (styles) {
    node.styles = styles;
  }

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

    case 'CHIP':
      return parseChipNode(figmaNode, node);

    case 'CARD':
      return parseCardNode(figmaNode, node);

    case 'INPUT':
    case 'SEARCHABLE_INPUT':
      return parseInputNode(figmaNode, node);

    case 'SVG':
    case 'ICON':
      return parseIconNode(figmaNode, node);

    case 'DROPDOWN':
      return parseDropdownNode(figmaNode, node);

    case 'CHECKBOX':
      return parseCheckboxNode(figmaNode, node);

    case 'RADIO':
      return parseRadioNode(figmaNode, node);

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

function parseChipNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // ... (Layout & Variant logic same as before) ...
  const layout = extractLayout(figmaNode);
  if (layout) node.layout = layout;

  node.styleHints = node.styleHints || {};
  node.props = node.props || {};
  node.styleHints.variant = 'flat';

  // Extract Content (Text, Icons, Selected)
  if (figmaNode.children) {
    const textChild = findFirstTextDescendant(figmaNode);
    if (textChild) node.text = (textChild as any).characters || textChild.name;

    const iconNodes = figmaNode.children.filter(child =>
      child.visible !== false && child !== textChild && isFigmaNodeIcon(child)
    );

    const tickIcon = iconNodes.find(icon =>
      (icon.name || '').toLowerCase().match(/tick|check/)
    );

    if (tickIcon) node.props.selected = true;

    const mainIcon = iconNodes.find(icon => icon !== tickIcon);
    if (mainIcon) {
      const { componentName } = parseComponentName(mainIcon.name || '');
      node.props.icon = componentName || mainIcon.name || 'Icon';
    }
  }

  // 4. Disabled State (✅ UPDATED)
  // Now checks Opacity OR Grey Fill
  if (isDisabled(figmaNode)) {
    node.props.disabled = true;
  }

  // 5. Interaction
  // Only add 'press' if has Icon/Selection AND not disabled
  const hasIcon = !!node.props.icon || !!node.props.selected;
  if (hasIcon && !node.props.disabled) {
    node.action = { type: 'press' };
  }

  return node;
}


/**
 * Helper: Visual-only disabled state detection
 * Checks:
 * 1. Opacity is significantly reduced (< 0.9)
 * 2. Background fill is Grey
 */
function isDisabled(node: FigmaNode): boolean {
  // 1. Check Opacity (Visual fade)
  if (node.opacity !== undefined && node.opacity < 0.9) {
    return true;
  }

  // 2. Check for Grey Fill (Visual disabled color)
  if (Array.isArray(node.fills)) {
    // Find the first visible solid fill
    const solidFill = node.fills.find((f: any) =>
      f.visible !== false &&
      f.type === 'SOLID' &&
      f.color
    );

    if (solidFill && isGrey((solidFill as any).color)) {
      return true;
    }
  }

  return false;
}

/**
 * Helper: Check if a color object is grey/grayscale
 * Logic: R, G, and B are close to each other.
 * Matches: #E0E0E0, #CCCCCC, #808080, etc.
 */
function isGrey(color: { r: number; g: number; b: number } | undefined): boolean {
  if (!color) return false;

  const { r, g, b } = color;

  // Check if they are roughly equal (within a small tolerance like 0.02)
  // Figma colors are 0-1 floats.
  return Math.abs(r - g) < 0.05 &&
    Math.abs(g - b) < 0.05 &&
    Math.abs(r - b) < 0.05;
}

/**
 * Step 3C: Parse CARD node
 * Logic:
 * 1. Variant: Elevated (Shadow) > Outlined (Stroke) > Filled (Fill).
 * 2. Padding: Map numeric padding to 'sm' | 'md' | 'lg' | 'none'.
 * 3. Children: RECURSIVE (Cards are containers).
 */
function parseCardNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Ensure containers exist
  node.styleHints = node.styleHints || {};
  node.props = node.props || {};

  // 1. Extract Variant
  // Populates node.props.variant
  extractCardVariant(figmaNode, node);

  // 2. Extract Padding
  // We use the raw layout data to map to semantic padding sizes
  const layout = extractLayout(figmaNode);

  if (layout && layout.padding) {
    // Determine the "dominant" padding value (prioritize top/all if object)
    const p = typeof layout.padding === 'number'
      ? layout.padding
      : (layout.padding.top || 0);

    // Map to CardPadding enum
    if (p === 0) {
      node.props.padding = 'none';
    } else if (p <= 12) {
      node.props.padding = 'sm';
    } else if (p <= 20) {
      // Matches your 16.5px JSON
      node.props.padding = 'md';
    } else {
      node.props.padding = 'lg';
    }
  } else {
    node.props.padding = 'none';
  }

  // 3. Recursive Children Processing
  // Cards wrap content, so we MUST parse children.
  if (figmaNode.children && figmaNode.children.length > 0) {
    const children: UITreeNode[] = [];

    // Sort children by visual position before processing
    const sortedFigmaChildren = sortChildrenByPosition(figmaNode.children as FigmaNode[], figmaNode.layoutMode);

    for (const child of sortedFigmaChildren) {
      // Parse every child using the main parser (recurses back to parseFigmaNode)
      const parsedChild = parseFigmaNode(child as FigmaNode);

      // Filter out empty/useless nodes (Layout containers with no semantic content)
      // This keeps the DOM tree clean: <Card><Text/></Card> instead of <Card><View><Text/></View></Card>
      if (parsedChild.componentType === 'VIEW' && !hasSemanticContent(parsedChild)) {
        // If it's a useless wrapper, try to hoist its children (flattening)
        if (parsedChild.children) {
          children.push(...parsedChild.children);
        }
      } else {
        // Keep valid semantic nodes (Text, Buttons, Inputs, or nested Views with content)
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
 * Helper: Card Variant Detection
 * Hierarchy: Elevated (Shadow) > Outlined (Border) > Filled (Default)
 */
function extractCardVariant(figmaNode: FigmaNode, node: UITreeNode): void {
  // 1. Check for Shadow (Elevation)
  // You need to ensure 'effects' is in your FigmaNode interface
  const hasShadow = Array.isArray(figmaNode.effects) &&
    figmaNode.effects.some((e: any) => e.visible !== false && e.type === 'DROP_SHADOW');

  if (hasShadow) {
    node.props!.variant = 'elevated';
    return;
  }

  // 2. Check for Stroke (Outlined)
  const hasStroke = Array.isArray(figmaNode.strokes) &&
    figmaNode.strokes.length > 0 &&
    figmaNode.strokes.some((s: any) => s.visible !== false);

  if (hasStroke) {
    node.props!.variant = 'outlined';
    return;
  }

  // 3. Default to Filled
  node.props!.variant = 'filled';
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
 * Step 3G: Parse DROPDOWN node
 * Extracts placeholder from inner TEXT node (e.g., "Select Option")
 * Props: placeholder, label, disabled
 */
function parseDropdownNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Extract layout
  const layout = extractLayout(figmaNode);
  if (layout) {
    node.layout = layout;
  }

  node.props = node.props || {};

  // Traverse children to find TEXT descendants for placeholder
  // Structure: DROPDOWN > GROUP (Label and Container_PLACEHOLDER) > FRAME (InputField_TEXT) > TEXT
  if (figmaNode.children) {
    const textDescendant = findFirstTextDescendant(figmaNode);
    if (textDescendant) {
      // The `characters` field contains the actual placeholder text
      const placeholderText = (textDescendant as any).characters || textDescendant.name || '';
      if (placeholderText) {
        node.props.placeholder = placeholderText;
      }
    }
  }

  // DROPDOWN nodes do NOT recurse (semantic collapse)
  return node;
}

/**
 * Step 3H: Parse CHECKBOX node
 * Extracts checked state from _TRUE/_FALSE child and label from TEXT child
 * Props: checked, label, disabled
 */
function parseCheckboxNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Extract layout
  const layout = extractLayout(figmaNode);
  if (layout) {
    node.layout = layout;
  }

  node.props = node.props || {};

  if (figmaNode.children) {
    for (const child of figmaNode.children) {
      const childName = child.name || '';

      // Check for _TRUE or _FALSE child to determine checked state
      if (childName === '_TRUE') {
        node.props.checked = true;
      } else if (childName === '_FALSE') {
        node.props.checked = false;
      }

      // Extract label from TEXT child (name contains "Label" or type is TEXT)
      if ((child as any).type === 'TEXT') {
        const labelText = (child as any).characters || child.name || '';
        if (labelText) {
          node.props.label = labelText;
        }
      }
    }
  }

  // CHECKBOX nodes do NOT recurse (semantic collapse)
  return node;
}

/**
 * Step 3I: Parse RADIO node
 * Extracts selected state from _TRUE/_FALSE child and label from TEXT child
 * For RadioGroup, this represents one option - the label becomes part of options array
 * Props: value (derived from componentName), label
 */
function parseRadioNode(figmaNode: FigmaNode, node: UITreeNode): UITreeNode {
  // Extract layout
  const layout = extractLayout(figmaNode);
  if (layout) {
    node.layout = layout;
  }

  node.props = node.props || {};

  if (figmaNode.children) {
    for (const child of figmaNode.children) {
      const childName = child.name || '';

      // Check for _TRUE or _FALSE child to determine selected state
      if (childName === '_TRUE') {
        node.props.selected = true;
      } else if (childName === '_FALSE') {
        node.props.selected = false;
      }

      // Extract label from TEXT child (name is "Text" or "Label", type is TEXT)
      if ((child as any).type === 'TEXT') {
        const labelText = (child as any).characters || '';
        if (labelText) {
          node.props.label = labelText;
        }
      }
    }
  }

  // RADIO nodes do NOT recurse (semantic collapse)
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

    // Sort children by visual position before processing
    const sortedFigmaChildren = sortChildrenByPosition(figmaNode.children as FigmaNode[], figmaNode.layoutMode);

    for (const child of sortedFigmaChildren) {
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
  return ['VIEW', 'SCROLLABLE_VIEW', 'HEADER', 'TOPBAR', 'SAFEAREAVIEW', 'CARD', 'BUTTON', 'INPUT', 'SEARCHABLE_INPUT', 'DROPDOWN', 'CHECKBOX', 'RADIO', 'CHIP'].includes(componentType);
}

/**
 * Helper: Check if component type is a semantic child (allowed in CARD)
 */
function isSemanticChild(componentType: string): boolean {
  return ['VIEW', 'TEXT', 'SVG', 'ICON', 'BUTTON', 'DROPDOWN', 'CHECKBOX', 'RADIO', 'CHIP'].includes(componentType);
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

// ============================================================================
// STYLE EXTRACTION UTILITIES
// ============================================================================

/**
 * Convert Figma color (0-1 float) to hex or rgba string
 */
function figmaColorToHex(color: { r: number; g: number; b: number; a?: number }, opacity: number = 1): string {
  if (!color) return 'transparent';

  const to255 = (n: number) => Math.round(n * 255);
  const finalAlpha = (color.a ?? 1) * opacity;

  // If alpha is 0, return transparent
  if (finalAlpha === 0) return 'transparent';

  const r = to255(color.r);
  const g = to255(color.g);
  const b = to255(color.b);

  // If alpha is less than 1, use rgba
  if (finalAlpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${finalAlpha.toFixed(2)})`;
  }

  // Otherwise, use hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Extract visual styles (colors, borders, etc.) from Figma node
 */
function extractStyles(figmaNode: FigmaNode): UITreeNode['styles'] | undefined {
  const styles: UITreeNode['styles'] = {};
  let hasStyles = false;

  // 1. Extract background color from fills
  if (Array.isArray(figmaNode.fills)) {
    const solidFill = figmaNode.fills.find((f: any) =>
      f.visible !== false && f.type === 'SOLID' && f.color
    ) as any;

    if (solidFill) {
      const color = figmaColorToHex(solidFill.color, solidFill.opacity ?? 1);
      if (color !== 'transparent') {
        styles.backgroundColor = color;
        hasStyles = true;
      }
    }
  }

  // 2. Extract border from strokes
  if (Array.isArray(figmaNode.strokes)) {
    const solidStroke = figmaNode.strokes.find((s: any) =>
      s.visible !== false && s.type === 'SOLID' && s.color
    ) as any;

    if (solidStroke) {
      styles.borderColor = figmaColorToHex(solidStroke.color, solidStroke.opacity ?? 1);
      styles.borderWidth = (figmaNode as any).strokeWeight ?? 1;
      hasStyles = true;
    }
  }

  // 3. Extract corner radius
  if (typeof (figmaNode as any).cornerRadius === 'number') {
    styles.borderRadius = (figmaNode as any).cornerRadius;
    hasStyles = true;
  }

  // 4. Extract opacity
  if (typeof figmaNode.opacity === 'number' && figmaNode.opacity < 1) {
    styles.opacity = figmaNode.opacity;
    hasStyles = true;
  }

  // 5. Extract text styles (for TEXT nodes)
  if (figmaNode.type === 'TEXT' || (figmaNode as any).characters) {
    const style = figmaNode.style || (figmaNode as any).style;
    if (style) {
      if (style.fontSize) {
        styles.fontSize = style.fontSize;
        hasStyles = true;
      }
      if ((style as any).fontWeight) {
        styles.fontWeight = (style as any).fontWeight;
        hasStyles = true;
      }
      if ((style as any).fontFamily) {
        styles.fontFamily = (style as any).fontFamily;
        hasStyles = true;
      }
    }

    // Text color from fills
    if (Array.isArray(figmaNode.fills)) {
      const textFill = figmaNode.fills.find((f: any) =>
        f.visible !== false && f.type === 'SOLID' && f.color
      ) as any;

      if (textFill) {
        styles.textColor = figmaColorToHex(textFill.color, textFill.opacity ?? 1);
        hasStyles = true;
      }
    }
  }

  return hasStyles ? styles : undefined;
}

/**
 * Extract position bounds from Figma node
 * Used for visual position-based sorting
 */
function extractBounds(figmaNode: FigmaNode): UITreeNode['bounds'] | undefined {
  const box = figmaNode.absoluteBoundingBox;
  if (!box) return undefined;

  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  };
}

/**
 * Sort children by visual position (ported from figma-to-code-manual)
 * - For horizontal layout: sort by X coordinate (left-to-right)
 * - For vertical/none layout: sort by Y coordinate (top-to-bottom)
 * - Uses 2px tolerance for items on the same line
 */
function sortChildrenByPosition(children: FigmaNode[], layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE'): FigmaNode[] {
  if (!children || children.length === 0) return [];

  // Filter out invisible nodes
  const visibleChildren = children.filter(c => c.visible !== false);

  return visibleChildren.sort((a, b) => {
    const aBox = a.absoluteBoundingBox;
    const bBox = b.absoluteBoundingBox;

    // If either node lacks bounds, maintain original order
    if (!aBox || !bBox) return 0;

    // If layout is horizontal, sort by X (left to right)
    if (layoutMode === 'HORIZONTAL') {
      return aBox.x - bBox.x;
    }

    // Default Vertical/None: Sort by Y (top to bottom)
    // Allow 2px tolerance for items roughly on the same line
    const yDiff = aBox.y - bBox.y;
    if (Math.abs(yDiff) < 2) {
      return aBox.x - bBox.x;
    }
    return yDiff;
  });
}

/**
 * Recursively collect all TEXT nodes from a Figma node tree
 * Used by _TEXT wrapper handling to extract all text descendants
 */
function collectAllTextNodes(figmaNode: FigmaNode, results: UITreeNode[]): void {
  if (figmaNode.type === 'TEXT') {
    const textNode: UITreeNode = {
      id: figmaNode.id,
      componentType: 'TEXT',
      componentName: figmaNode.name || 'Text',
      text: figmaNode.characters || '',
    };

    // Extract styles from the TEXT node
    const styles = extractStyles(figmaNode);
    if (styles && Object.keys(styles).length > 0) {
      textNode.styles = styles;
    }

    results.push(textNode);
    return;
  }

  // Recurse into children
  if (figmaNode.children) {
    for (const child of figmaNode.children) {
      collectAllTextNodes(child as FigmaNode, results);
    }
  }
}

export { figmaColorToHex, extractStyles, extractBounds, sortChildrenByPosition };

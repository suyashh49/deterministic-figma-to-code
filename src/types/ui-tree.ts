/**
 * Node Tree Schema - Suffix-Preserving Semantic Mirror
 * Preserves exact component type suffixes from Figma naming
 */

export interface UITreeNode {
  id: string;

  // EXACT suffix from Figma name (after underscore)
  componentType: string; // e.g. VIEW, TEXT, CARD, BUTTON, INPUT, SVG, TOUCHABLE_CARD

  // EXACT prefix from Figma name (before underscore)
  componentName?: string; // e.g. "Button", "Heading 3", "Container"

  // Full original name (for debugging)
  role?: string;

  // Content
  text?: string;      // for TEXT, BUTTON
  title?: string;     // for CARD-based list items
  subtitle?: string;  // for CARD-based list items

  // Layout intent
  layout?: {
    direction?: 'vertical' | 'horizontal';
    gap?: number;
    padding?: number | { top: number; right: number; bottom: number; left: number };
    align?: 'start' | 'center' | 'end' | 'stretch';
  };

  // Visual intent
  styleHints?: {
    variant?: string; // filled | outlined | regular | ghost
    size?: 'sm' | 'md' | 'lg';
  };

  // Interactivity intent
  action?: {
    type: 'press' | 'submit' | 'navigate';
    target?: string;
  };

  props?: Record<string, any>;

  children?: UITreeNode[];
}

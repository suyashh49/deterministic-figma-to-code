/**
 * Represents a specific point in a gradient (0-1 coordinates)
 */
export interface GradientPoint {
  x: number;
  y: number;
}

/**
 * Represents a single color stop in a gradient
 */
export interface GradientStop {
  color: string;  // Hex or RGBA string
  offset: number; // 0 to 1
}

/**
 * Definition for a Gradient background
 */
export interface Gradient {
  type: 'linear' | 'radial' | 'angular' | 'diamond';
  start: GradientPoint;
  end: GradientPoint;
  stops: GradientStop[];
}

/**
 * Visual styles associated with a node
 */
export interface UIStyle {
  backgroundColor?: string;
  // NEW: Support for gradients
  backgroundGradient?: Gradient;
  
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  
  opacity?: number;
  
  // Text specific styles
  textColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
}

/**
 * Main UI Tree Node Interface
 */
export interface UITreeNode {
  id: string;
  componentType: string; // 'VIEW', 'TEXT', 'BUTTON', etc.
  componentName?: string; // Original Figma name prefix
  role?: string;          // Full Figma name for debugging
  
  text?: string;          // For text nodes, buttons, inputs
  title?: string;         // For cards, headers
  subtitle?: string;      // For cards
  
  // Layout properties (flexbox)
  layout?: {
    direction?: 'horizontal' | 'vertical';
    justify?: 'start' | 'center' | 'end' | 'space-between';
    align?: 'start' | 'center' | 'end' | 'stretch';
    gap?: number;
    padding?: number | { top: number; right: number; bottom: number; left: number };
    width?: number | 'fill' | 'content';
    height?: number | 'fill' | 'content';
  };

  // Visual Styles (Updated)
  styles?: UIStyle;

  // Component-specific props (variant, size, icon, etc.)
  props?: Record<string, any>;
  
  // Visual hints (e.g. size='sm') derived from raw styles
  styleHints?: Record<string, any>;

  // Actions (press, toggle, etc.)
  action?: {
    type: string;
    destination?: string;
  };

  // Children nodes
  children?: UITreeNode[];
  
  // Raw bounds for sorting logic (optional in final output)
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
/**
 * Component Mapping: UITreeNode.componentType → Component Library Components
 * 
 * Maps semantic component types to React Native component library imports and prop transformers
 */

import { UITreeNode } from '../types/ui-tree';

/**
 * Mapping configuration for each component type
 */
export interface ComponentMapping {
    /** Component name to import from component library */
    component: string | ((node: UITreeNode) => string);

    /** Function to transform UITreeNode props to component props */
    propMapper: (node: UITreeNode) => Record<string, any>;

    /** Whether this component should have children */
    hasChildren?: boolean;

    /** Additional imports required */
    additionalImports?: string[];
}

/**
 * Master component mapping from componentType → Component
 */
export const COMPONENT_MAP: Record<string, ComponentMapping> = {
    // ============================================
    // Button Variants
    // ============================================
    'BUTTON': {
        component: 'Button',
        propMapper: (node) => ({
            text: node.text,
            variant: mapButtonVariant(node.styleHints?.variant),
            size: node.styleHints?.size || 'md',
            disabled: node.props?.disabled,
            leftIcon: node.props?.leftIcon,
            rightIcon: node.props?.rightIcon,
            onPress: '() => {}', // Placeholder
            // Apply custom styles if not matching design system
            ...(node.styles?.backgroundColor && {
                buttonStyle: { backgroundColor: node.styles.backgroundColor },
            }),
        }),
    },

    // ============================================
    // Cards
    // ============================================
    'CARD': {
        component: 'Card',
        hasChildren: true,
        propMapper: (node) => ({
            variant: mapCardVariant(node.props?.variant || node.styleHints?.variant),
            padding: node.props?.padding || 'md',
            onPress: node.action?.type === 'press' ? '() => {}' : undefined,
            // Apply custom styles if needed
            ...(node.styles?.backgroundColor && {
                containerStyle: { backgroundColor: node.styles.backgroundColor },
            }),
        }),
    },

    'TOUCHABLE_CARD': {
        component: 'Card',
        hasChildren: true,
        propMapper: (node) => ({
            variant: mapCardVariant(node.props?.variant || 'elevated'),
            padding: node.props?.padding || 'md',
            onPress: '() => {}', // Always touchable
        }),
    },

    // ============================================
    // Chip
    // ============================================
    'CHIP': {
        component: 'Chip',
        propMapper: (node) => ({
            text: node.text || '',
            selected: node.props?.selected || false,
            mode: node.styleHints?.variant === 'outline' ? 'outlined' : 'flat',
            icon: node.props?.icon,
            disabled: node.props?.disabled,
            onPress: node.action?.type === 'press' ? '() => {}' : undefined,
        }),
    },

    // ============================================
    // Form Components
    // ============================================
    'CHECKBOX': {
        component: 'Checkbox',
        propMapper: (node) => ({
            checked: node.props?.checked || false,
            onChange: '(value) => {}',
            label: node.props?.label || node.text,
            disabled: node.props?.disabled,
        }),
    },

    'RADIO': {
        component: 'RadioGroup',
        propMapper: (node) => ({
            options: [{ label: node.props?.label || node.text || 'Option', value: node.componentName || 'option' }],
            value: node.props?.selected ? (node.componentName || 'option') : undefined,
            onChange: '(value) => {}',
            disabled: node.props?.disabled,
        }),
    },

    'DROPDOWN': {
        component: 'Dropdown',
        propMapper: (node) => ({
            data: [], // Will be populated by parent
            value: undefined,
            onChange: '(value) => {}',
            placeholder: node.text || node.props?.placeholder || 'Select Option',
            label: node.title || node.props?.label,
            disabled: node.props?.disabled,
        }),
    },

    // ============================================
    // Lists
    // ============================================
    'LISTITEM': {
        component: 'ListItem',
        hasChildren: false,
        propMapper: (node) => ({
            title: node.text || node.title || 'List Item',
            subtitle: node.subtitle,
            leftElement: node.props?.leftElement,
            rightElement: node.props?.rightElement,
            onPress: node.action?.type === 'press' ? '() => {}' : undefined,
            disabled: node.props?.disabled,
            itemSeparator: node.props?.itemSeparator,
        }),
    },

    // ============================================
    // Media & Avatars
    // ============================================
    'AVATAR': {
        component: 'Avatar',
        propMapper: (node) => ({
            // 1. Map Name: Prioritize explicit prop (from JSON), fallback to text content
            name: node.props?.name || node.text,

            // 2. Map Size: Prioritize explicit prop (from JSON), fallback to styleHints
            size: mapAvatarSize(node.props?.size || node.styleHints?.size),

            // 3. Map Source: Handle source object or raw URL string
            source: node.props?.source || (node.props?.imageUrl ? { uri: node.props.imageUrl } : undefined),

            // 4. Interaction
            onPress: node.action?.type === 'press' ? '() => {}' : undefined,

            // 5. Visual Overrides: Map background color from 'styles' to containerStyle
            containerStyle: node.styles?.backgroundColor
                ? { backgroundColor: node.styles.backgroundColor }
                : undefined,
        }),
    },

    // ============================================
    // Layout Utilities
    // ============================================
    'SPACER': {
        component: 'Spacer',
        propMapper: (node) => ({
            size: node.props?.size || 0,
            horizontal: node.props?.horizontal,
        }),
    },

    'INPUT': {
        component: 'TextInput',
        propMapper: (node) => ({
            placeholder: node.text || 'Enter text',
            label: node.title,
            onChangeText: '(text) => {}',
            disabled: node.props?.disabled,
        }),
    },

    'SEARCHABLE_INPUT': {
        component: 'SearchableInput',
        propMapper: (node) => ({
            value: '',
            onChangeText: '(text) => {}',
            placeholder: node.text || 'Search...',
            disabled: node.props?.disabled,
        }),
    },

    'SWITCH': {
        component: 'Switch',
        propMapper: (node) => ({
            value: node.props?.checked || false,
            onValueChange: '(value) => {}',
            label: node.props?.label || node.text,
            disabled: node.props?.disabled,
        }),
    },

    // ============================================
    // Text
    // ============================================
    'TEXT': {
        component: 'Text',
        additionalImports: ['Text'],
        propMapper: (node) => ({
            // Text component uses children, not text prop
            _textContent: node.text || '',
            // Style props from extracted styles
            style: node.styles ? {
                ...(node.styles.textColor && { color: node.styles.textColor }),
                ...(node.styles.fontSize && { fontSize: node.styles.fontSize }),
                ...(node.styles.fontWeight && { fontWeight: node.styles.fontWeight }),
                ...(node.styles.fontFamily && { fontFamily: node.styles.fontFamily }),
            } : undefined,
        }),
    },

    // ============================================
    // Layout Containers
    // ============================================
    'VIEW': {
        // 1. Check for 'backgroundGradient' in styles
        component: (node) => {
            if (node.styles?.backgroundGradient?.type === 'linear') {
                return 'LinearGradient';
            }
            return 'View';
        },
        
        hasChildren: true,
        additionalImports: ['View'], 
        
        propMapper: (node) => {
            const style = buildLayoutStyle(node) || {};
            
            // 2. Handle Gradient Logic
            const bgGradient = node.styles?.backgroundGradient;
            
            if (bgGradient && bgGradient.type === 'linear') {
                // Transform your "stops" array [{color, offset}] -> Expo format
                const colors = bgGradient.stops.map((s: any) => s.color);
                const locations = bgGradient.stops.map((s: any) => s.offset);

                return {
                    colors: colors,
                    locations: locations, // Expo supports this to map offsets
                    start: bgGradient.start, // { x: 0, y: 0 }
                    end: bgGradient.end,     // { x: 1, y: 1 }
                    style: style // Apply layout/padding/radius to the Gradient itself
                };
            }

            // 3. Standard View
            return {
                style: Object.keys(style).length > 0 ? style : undefined,
            };
        },
    },

    'SCROLLABLE_VIEW': {
        component: 'ScrollView',
        hasChildren: true,
        additionalImports: ['ScrollView'],
        propMapper: (node) => ({
            contentContainerStyle: buildLayoutStyle(node),
            backgroundColor: '#FFFFFF', // Ensure background is set
            paddingHorizontal: 24
        }),
    },

    // ============================================
    // Navigation & Headers
    // ============================================
    'HEADER': {
        component: 'Header',
        additionalImports: ['TouchableOpacity'], // Only RN imports here
        propMapper: (node) => {
            // Find nodes
            const leftNode = findChildNode(node, n => n.role === 'Container_SVG');
            const rightNode = findChildNode(node, n => n.role === 'Button_SVG');
            const backNode = findChildNode(node, n => n.componentType === 'BACKBUTTON');
            const titleNode = findChildNode(node, n => n.componentType === 'TEXT');

            // Styles
            const style: Record<string, any> = {};
            if (node.styles?.borderColor) {
                style.borderBottomWidth = 1;
                style.borderBottomColor = node.styles.borderColor;
            }

            // --- SIMPLIFIED LOGIC: ALWAYS USE <Menu /> ---
            // You can replace 'Menu' with 'Icon' later if you create a generic wrapper.
            
            const leftActionJsx = leftNode 
                ? `(<Menu size={24} color="#000" />)` 
                : undefined;

            const rightActionJsx = rightNode 
                ? `(<TouchableOpacity onPress={() => {}}><Menu size={24} color="#000" /></TouchableOpacity>)` 
                : undefined;

            return {
                title: titleNode?.text || 'Header',
                backgroundColor: node.styles?.backgroundColor || '#FFFFFF',
                showBackButton: !!backNode,
                onBackPress: backNode ? '() => navigation.goBack()' : undefined,
                leftAction: leftActionJsx,
                rightAction: rightActionJsx,
                containerStyle: Object.keys(style).length > 0 ? style : undefined
            };
        },
    },

    'TOPBAR': {
        component: 'Header',
        propMapper: (node) => ({
            title: node.text || node.title,
        }),
    },

    'SAFEAREAVIEW': {
        component: 'SafeAreaView',
        hasChildren: true,
        additionalImports: ['SafeAreaView'],
        propMapper: (node) => ({
            style: { flex: 1, ...buildLayoutStyle(node), backgroundColor: '#FFFFFF', paddingHorizontal: 32 },
        }),
    },

    // ============================================
    // Icons
    // ============================================
    'ICON': {
        component: 'View',
        additionalImports: ['View'],
        propMapper: (node) => ({
            style: {
                width: 24,
                height: 24,
                backgroundColor: node.styles?.backgroundColor || '#E5E7EB',
                borderRadius: node.styles?.borderRadius || 4,
            },
        }),
    },

    'SVG': {
        component: 'View',
        additionalImports: ['View'],
        propMapper: (node) => ({
            style: {
                width: 24,
                height: 24,
                backgroundColor: '#E5E7EB',
            },
        }),
    },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Map UITreeNode variant to Button variant
 */
function mapButtonVariant(variant?: string): 'regular' | 'outline' | 'ghost' {
    switch (variant) {
        case 'outline':
        case 'outlined':
            return 'outline';
        case 'ghost':
        case 'text':
            return 'ghost';
        case 'regular':
        case 'filled':
        default:
            return 'regular';
    }
}

/**
 * Map UITreeNode variant to Card variant
 */
function mapCardVariant(variant?: string): 'elevated' | 'outlined' | 'filled' {
    switch (variant) {
        case 'outline':
        case 'outlined':
            return 'outlined';
        case 'filled':
            return 'filled';
        case 'elevated':
        default:
            return 'elevated';
    }
}

/**
 * Recursively find a child node matching a predicate
 */
function findChildNode(root: UITreeNode, predicate: (node: UITreeNode) => boolean): UITreeNode | undefined {
    if (predicate(root)) return root;
    
    if (root.children) {
        for (const child of root.children) {
            const found = findChildNode(child, predicate);
            if (found) return found;
        }
    }
    return undefined;
}

/**
 * Map generic string size to AvatarSize
 */
function mapAvatarSize(size?: string): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    switch (size) {
        case 'xs': return 'xs';
        case 'sm': return 'sm';
        case 'lg': return 'lg';
        case 'xl': return 'xl';
        case 'md':
        default:
            return 'md';
    }
}

/**
 * Build style object from layout properties
 * Updated to ensure borderRadius from your JSON is included
 */
function buildLayoutStyle(node: UITreeNode): Record<string, any> | undefined {
    const style: Record<string, any> = {};

    // 1. Layout Properties (Padding, Flex, Gap)
    if (node.layout) {
        if (node.layout.direction === 'horizontal') style.flexDirection = 'row';
        if (node.layout.gap) style.gap = node.layout.gap;
        
        // Alignment
        if (node.layout.align) {
            const alignMap: Record<string, string> = {
                'start': 'flex-start', 'center': 'center', 'end': 'flex-end',
            };
            style.alignItems = alignMap[node.layout.align] || 'flex-start';
        }

        // Padding
        if (node.layout.padding) {
            const p = node.layout.padding;
            if (typeof p === 'number') {
                style.padding = p;
            } else {
                if (p.top) style.paddingTop = p.top;
                if (p.right) style.paddingRight = p.right;
                if (p.bottom) style.paddingBottom = p.bottom;
                if (p.left) style.paddingLeft = p.left;
            }
        }
    }

    // 2. Visual Properties
    if (node.styles) {
        // Only apply solid background color if NO gradient exists
        // (If gradient exists, the LinearGradient component handles the background)
        if (node.styles.backgroundColor && !node.styles.backgroundGradient) {
            style.backgroundColor = node.styles.backgroundColor;
        }

        if (node.styles.borderRadius) {
            style.borderRadius = node.styles.borderRadius;
        }
        
        // Border
        if (node.styles.borderColor) {
            style.borderColor = node.styles.borderColor;
            style.borderWidth = node.styles.borderWidth || 1;
        }
    }

    return Object.keys(style).length > 0 ? style : undefined;
}
/**
 * Get mapping for a component type
 */
export function getComponentMapping(componentType: string): ComponentMapping | undefined {
    return COMPONENT_MAP[componentType];
}
/**
 * Check if a component type is supported
 */
export function isSupportedComponent(componentType: string): boolean {
    return componentType in COMPONENT_MAP;
}

export { buildLayoutStyle, mapButtonVariant, mapCardVariant };

/**
 * Code Generator: UITreeNode → React Native JSX Code
 * 
 * Recursively converts a UITreeNode tree into React Native code
 * using components from the component library.
 */

import { UITreeNode } from '../types/ui-tree';
import { COMPONENT_MAP, getComponentMapping, buildLayoutStyle } from './component-map';

// ============================================
// Main Code Generator
// ============================================

/**
 * Generate React Native code from a UITreeNode tree
 */
export function generateCode(uiTree: UITreeNode): string {
    const usedComponents = new Set<string>();
    const rnImports = new Set<string>();

    const componentCode = generateComponent(uiTree, 2, usedComponents, rnImports);
    const imports = generateImports(usedComponents, rnImports, componentCode);

    return generateScreenTemplate(imports, componentCode);
}
/**
 * Recursively generate component JSX
 */
function generateComponent(
    node: UITreeNode,
    depth: number,
    usedComponents: Set<string>,
    rnImports: Set<string>
): string {
    const indent = '  '.repeat(depth);
    const mapping = getComponentMapping(node.componentType);

    if (!mapping) {
        rnImports.add('View');
        return `${indent}<View />`; 
    }

    // =========================================================
    // FIX: Resolve component name immediately
    // Checks if mapping.component is a function or a string
    // =========================================================
    const componentName = typeof mapping.component === 'function'
        ? mapping.component(node)
        : mapping.component;

    // 2. Track Imports
    // Use 'componentName' (string) instead of 'mapping.component' (union)
    if (componentName !== 'LinearGradient') {
        // If it's a generic View or explicitly in additionalImports, it's a React Native component
        if (mapping.additionalImports?.includes(componentName) || componentName === 'View') {
            rnImports.add(componentName);
        } else {
            // Otherwise, it's a custom component
            usedComponents.add(componentName);
        }
    }
    
    // Add specific dependencies (e.g., TouchableOpacity, etc.)
    mapping.additionalImports?.forEach(imp => {
        if (imp !== 'LinearGradient') rnImports.add(imp);
    });

    // 3. Map Props
    const props = mapping.propMapper(node);

    // Text Special Case
    if (node.componentType === 'TEXT') {
        const textContent = props._textContent || node.text || '';
        delete props._textContent;
        const propsStr = generatePropsString(props, depth, usedComponents, rnImports);
        return `${indent}<Text${propsStr}>${escapeText(textContent)}</Text>`;
    }

    const propsStr = generatePropsString(props, depth, usedComponents, rnImports);

    // 4. Children Logic
    if (mapping.hasChildren && node.children && node.children.length > 0) {
        const gap = node.layout?.gap || 0;
        const isHorizontal = node.layout?.direction === 'horizontal';

        const childrenCode = node.children.map((child, index) => {
            const childCode = generateComponent(child, depth + 1, usedComponents, rnImports);
            
            // Spacer Logic
            const isLast = index === node.children!.length - 1;
            const shouldAddSpacer = !isLast && child.componentType === 'VIEW';

            if (shouldAddSpacer) {
                usedComponents.add('Spacer');
                const spacerIndent = '  '.repeat(depth + 1);
                const spacerProps = isHorizontal ? `horizontal size={${gap}}` : `size={12}`;
                return `${childCode}\n${spacerIndent}<Spacer ${spacerProps} />`;
            }
            return childCode;
        }).join('\n');

        return `${indent}<${componentName}${propsStr}>\n${childrenCode}\n${indent}</${componentName}>`;
    }

    return `${indent}<${componentName}${propsStr} />`;
}
/**
 * Generate props as JSX string
 * FIXED: Detects JSX strings starting with '(<' and wraps them in {}
 */
function generatePropsString(
    props: Record<string, any>,
    depth: number,
    usedComponents: Set<string>,
    rnImports: Set<string>
): string {
    const propEntries = Object.entries(props).filter(([_, v]) => v !== undefined && v !== null);

    if (propEntries.length === 0) return '';

    const propsArr = propEntries.map(([key, value]) => {
        
        // Handle Nested Components (UITreeNode)
        if (typeof value === 'object' && value !== null && 'componentType' in value) {
            const componentCode = generateComponent(value, depth + 1, usedComponents, rnImports);
            return `${key}={${componentCode.trimStart()}}`; 
        }

        if (typeof value === 'string') {
            // Function Placeholders
            if (value.startsWith('()') || value.startsWith('(val') || value.startsWith('(text')) {
                return `${key}={${value}}`;
            }
            
            // Injected JSX
            if (value.startsWith('(<')) {
                 return `${key}={${value}}`;
            }

            return `${key}="${value}"`;
        }
        
        if (typeof value === 'boolean') {
            return value ? key : `${key}={false}`;
        }
        
        return `${key}={${JSON.stringify(value)}}`;
    });

    if (propsArr.join(' ').length < 60) {
        return ' ' + propsArr.join(' ');
    }
    return '\n  ' + propsArr.join('\n  ') + '\n';
}

function generateImports(usedComponents: Set<string>, rnImports: Set<string>, fullSourceCode: string): string {
    const imports: string[] = [];
    imports.push("import React from 'react';");

    // 1. React Native
    if (rnImports.size > 0) {
        imports.push(`import { ${Array.from(rnImports).sort().join(', ')} } from 'react-native';`);
    }

    // 2. Linear Gradient (Expo)
    if (fullSourceCode.includes('<LinearGradient')) {
        imports.push("import { LinearGradient } from 'expo-linear-gradient';");
    }

    // 3. Component Library
    if (usedComponents.size > 0) {
        imports.push(`import { ${Array.from(usedComponents).sort().join(', ')} } from '../components';`);
    }
    
    // 4. Icons
    if (fullSourceCode.includes('<Menu')) {
        imports.push("import { Menu } from 'lucide-react-native';");
    }

    return imports.join('\n');
}

/**
 * Generate the full screen template
 */
function generateScreenTemplate(imports: string, componentCode: string): string {
    return `${imports}

export default function GeneratedScreen({ navigation }: any) {
  return (
${componentCode}
  );
}
`;
}

function escapeText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, ' ');
}

// ============================================
// Sorting Utilities (from figma-to-code-manual)
// ============================================

/**
 * Sort children by visual position
 * Ported from figma-to-code-manual/src/transformer.ts
 */
export function sortChildrenByPosition(children: UITreeNode[]): UITreeNode[] {
    if (!children || children.length === 0) return [];

    // UITreeNode doesn't have absoluteBoundingBox, so we just return as-is
    // The parser already handles ordering from Figma
    return children;
}

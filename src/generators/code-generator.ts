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
    // Track all used components for imports
    const usedComponents = new Set<string>();
    const rnImports = new Set<string>();

    // Generate component JSX
    const componentCode = generateComponent(uiTree, 2, usedComponents, rnImports);

    // Generate imports
    const imports = generateImports(usedComponents, rnImports);

    // Assemble the full file
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
        // Unknown component type - render as View with comment
        rnImports.add('View');
        const style = buildLayoutStyle(node);
        const styleStr = style ? ` style={${JSON.stringify(style)}}` : '';

        if (node.children && node.children.length > 0) {
            const childrenCode = node.children
                .map(child => generateComponent(child, depth + 1, usedComponents, rnImports))
                .join('\n');
            return `${indent}{/* Unknown: ${node.componentType} */}\n${indent}<View${styleStr}>\n${childrenCode}\n${indent}</View>`;
        }
        return `${indent}{/* Unknown: ${node.componentType} */}\n${indent}<View${styleStr} />`;
    }

    // Track component usage
    if (mapping.additionalImports) {
        mapping.additionalImports.forEach(imp => rnImports.add(imp));
    } else {
        usedComponents.add(mapping.component);
    }

    // Get props from mapper
    const props = mapping.propMapper(node);

    // Handle TEXT component specially (uses children)
    if (node.componentType === 'TEXT') {
        const textContent = props._textContent || node.text || '';
        delete props._textContent;

        const propsStr = generatePropsString(props);
        return `${indent}<Text${propsStr}>${escapeText(textContent)}</Text>`;
    }

    // Generate props string
    const propsStr = generatePropsString(props);

    // Handle components with children
    if (mapping.hasChildren && node.children && node.children.length > 0) {
        const childrenCode = node.children
            .map(child => generateComponent(child, depth + 1, usedComponents, rnImports))
            .join('\n');
        return `${indent}<${mapping.component}${propsStr}>\n${childrenCode}\n${indent}</${mapping.component}>`;
    }

    // Handle components without children (self-closing)
    return `${indent}<${mapping.component}${propsStr} />`;
}

/**
 * Generate props as JSX string
 */
function generatePropsString(props: Record<string, any>): string {
    const propEntries = Object.entries(props).filter(([_, v]) => v !== undefined && v !== null);

    if (propEntries.length === 0) return '';

    const propsArr = propEntries.map(([key, value]) => {
        if (typeof value === 'string') {
            // Check if it's a function placeholder
            if (value.startsWith('()') || value.startsWith('(value)') || value.startsWith('(text)')) {
                return `${key}={${value}}`;
            }
            return `${key}="${value}"`;
        }
        if (typeof value === 'boolean') {
            return value ? key : `${key}={false}`;
        }
        if (typeof value === 'number') {
            return `${key}={${value}}`;
        }
        if (typeof value === 'object') {
            return `${key}={${JSON.stringify(value)}}`;
        }
        return `${key}={${JSON.stringify(value)}}`;
    });

    // If props are short, keep on same line
    if (propsArr.join(' ').length < 60) {
        return ' ' + propsArr.join(' ');
    }

    // Otherwise, multi-line
    return '\n  ' + propsArr.join('\n  ') + '\n';
}

/**
 * Generate import statements
 */
function generateImports(usedComponents: Set<string>, rnImports: Set<string>): string {
    const imports: string[] = [];

    // React import
    imports.push("import React from 'react';");

    // React Native imports
    if (rnImports.size > 0) {
        const rnComponentList = Array.from(rnImports).sort().join(', ');
        imports.push(`import { ${rnComponentList} } from 'react-native';`);
    }

    // Component library imports
    if (usedComponents.size > 0) {
        const componentList = Array.from(usedComponents).sort().join(', ');
        imports.push(`import { ${componentList} } from '../components';`);
    }

    return imports.join('\n');
}

/**
 * Generate the full screen template
 */
function generateScreenTemplate(imports: string, componentCode: string): string {
    return `${imports}

export default function GeneratedScreen() {
  return (
${componentCode}
  );
}
`;
}

/**
 * Escape text content for JSX
 */
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

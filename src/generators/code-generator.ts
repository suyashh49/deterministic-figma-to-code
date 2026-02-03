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
    const imports = generateImports(usedComponents, rnImports, componentCode);

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

        const propsStr = generatePropsString(props, depth, usedComponents, rnImports);
        return `${indent}<Text${propsStr}>${escapeText(textContent)}</Text>`;
    }

    // Generate props string
    const propsStr = generatePropsString(props, depth, usedComponents, rnImports);

    // Handle components with children
    if (mapping.hasChildren && node.children && node.children.length > 0) {
        const gap = node.layout?.gap || 0;
        const isHorizontal = node.layout?.direction === 'horizontal';

        // Generate children code with conditional spacers
        const childrenCode = node.children.map((child, index) => {
            // 1. Generate the child's code
            const childCode = generateComponent(child, depth + 1, usedComponents, rnImports);

            // 2. Determine if we need a spacer after this child
            const isLast = index === node.children!.length - 1;

            // STRICT CHECK: Only add spacer if THIS child is a 'VIEW'
            // (You can add 'CARD' || 'SCROLLABLE_VIEW' here if those count as Views to you)
            const shouldAddSpacer = !isLast && child.componentType === 'VIEW';

            if (shouldAddSpacer) {
                usedComponents.add('Spacer');
                const spacerIndent = '  '.repeat(depth + 1);
                const spacerProps = isHorizontal ? `horizontal size={${gap}}` : `size={12}`;
                return `${childCode}\n${spacerIndent}<Spacer ${spacerProps} />`;
            }

            return childCode;
        }).join('\n');

        return `${indent}<${mapping.component}${propsStr}>\n${childrenCode}\n${indent}</${mapping.component}>`;
    }
    // Handle components without children (self-closing)
    return `${indent}<${mapping.component}${propsStr} />`;
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
        // Handle React Component props (UITreeNode)
        if (typeof value === 'object' && value !== null && 'componentType' in value) {
            const componentCode = generateComponent(value, depth + 1, usedComponents, rnImports);
            return `${key}={${componentCode.trimStart()}}`; // trimStart to remove initial indent for inline feel or let it be
        }

        if (typeof value === 'string') {
            // 1. Check for Function placeholders (e.g. "() => {}")
            if (value.startsWith('()') || value.startsWith('(value)') || value.startsWith('(text)')) {
                return `${key}={${value}}`;
            }
            
            // 2. Check for JSX placeholders (e.g. "(<Icon />)")  <-- THIS IS THE FIX
            if (value.startsWith('(<')) {
                 return `${key}={${value}}`;
            }

            // 3. Regular strings
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

    // Formatting logic
    if (propsArr.join(' ').length < 60) {
        return ' ' + propsArr.join(' ');
    }
    return '\n  ' + propsArr.join('\n  ') + '\n';
}

function generateImports(usedComponents: Set<string>, rnImports: Set<string>, fullSourceCode: string): string {
    const imports: string[] = [];
    imports.push("import React from 'react';");

    // 1. React Native Imports
    if (rnImports.size > 0) {
        imports.push(`import { ${Array.from(rnImports).sort().join(', ')} } from 'react-native';`);
    }

    // 2. Component Library Imports
    if (usedComponents.size > 0) {
        imports.push(`import { ${Array.from(usedComponents).sort().join(', ')} } from '../components';`);
    }

    // 3. Lucide Icons Import (The "1 Icon" Logic)
    // If the code contains <Menu, automatically import it.
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

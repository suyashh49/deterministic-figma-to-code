# Deterministic Figma to Code

A robust pipeline that transforms raw Figma JSON into clean, semantic React Native code. This project prioritizes **Deterministic Parsing**—relying on explicit naming conventions (like _BUTTON) over visual guessing to ensure perfect component mapping.

## 🚀 Project Setup

### Prerequisites
  Node.js (v18+ recommended)
  npm or yarn
  A Figma design file exported as JSON (using the Figma API or a plugin).

### Installation

1.  **Clone the repository**:
bash
    git clone <repository-url>
    cd deterministic-figma-to-code
   

2.  **Install dependencies**:
bash
    npm install
    # or
    yarn install
   

3.  **Prepare your Input**:
    *   Export your Figma selection to JSON.
    *   Save the file as input.json in the root of the project.

4.  **Run the Converter**:
bash
    npm start
   
    *   This generates two files:
        *   output.tsx: The generated React Native component code.
        *   output.json: The intermediate cleaning parsing tree (useful for debugging).

---

## 🏛️ System Architecture

The system operates as a linear extraction-transformation-generation pipeline.
mermaid
graph TD
    A[input.json] -->|Load| B(src/index.ts)
    B -->|Parse| C[src/parsers/ui-tree.parser.ts]
    C -->|Semantic Collapse| D{src/types/ui-tree.ts}
    D -->|Map| E[src/generators/component-map.ts]
    E -->|Generate| F[src/generators/code-generator.ts]
    F -->|Write| G[output.tsx]

### Core Concepts

1.  **Deterministic Parsing**: We don't guess. If a layer is named Submit_BUTTON, it **IS** a button. If it's named Hero_IMAGE, it **IS** an image.
2.  **Semantic Collapse**: We stop parsing children once we hit a leaf component. A BUTTON is a single node with props (text, icon), not a tree of 5 views and 2 texts.
3.  **Strict Contract**: The UITreeNode interface is the single source of truth that decouples Figma chaos from React Native order.

---

## 🔄 Execution Flow (File by File)

### 1. The Orchestrator (src/index.ts)
The entry point of the application. It manages the high-level lifecycle:
  **Loads** input.json from disk.
  **Calls** the Parser to generate the UITreeNode tree.
  **Calls** the Generator to create the React Native string.
  **Saves** debug files (output.json) and final code (output.tsx).

### 2. The Parser (src/parsers/ui-tree.parser.ts)
The "Brain" of the operation. It recursively traverses the messy Figma node tree.
  **Recursion**: Walks down the tree until it finds a component matching a known suffix.
  **Suffix Detection**: Identifies _BUTTON, _CARD, _INPUT, etc.
  **Prop Extraction**: Instead of generic recursion, it "looks inside" leaf components to find specific data:
    -   Buttons: Finds the first text child -> props.text. Finds vectors -> props.icon.
    -   Inputs: Finds "Label" text -> props.label.
  **Cleaning**: Discards 90% of Figma data (absolute IDs, unused strokes) to produce a clean UITreeNode.

### 3. The Contract (src/types/ui-tree.ts)
Defines the UITreeNode interface. This is the "Lingua Franca" between the parser and generator.
  **componentType**: BUTTON | CARD | TEXT | ...
  **props**: variant, size, disabled, placeholder.
  **styleHints**: Semantic tokens instead of hardcoded hex values.

### 4. The Mapper (src/generators/component-map.ts)
The "Translator" dictionary. It separates the "Figma World" from the "Code World".
  Maps componentType: 'BUTTON' -> component: 'Button' (React Native).
  Maps variant: 'filled' (Figma) -> variant: 'solid' (Code).
  Defines imports (import { Button } from '../components').

### 5. The Generator (src/generators/code-generator.ts)
The "Writer" that builds the final string.
  **Import Management**: Automatically collects imports based on used components.
  **Layout Injection**: Automatically inserts <Spacer /> components based on Figma AutoLayout itemSpacing.
  **JSX Building**: Assembles the final component properties into valid JSX syntax.

---

## 📊 Data Flow Summary

### Input (Figma JSON)
json
{
  "name": "Login_BUTTON",
  "type": "FRAME",
  "children": [
    { "type": "TEXT", "characters": "Sign In" },
    { "type": "VECTOR", "name": "ArrowRight_ICON" }
  ]
}

### ⬇️ Parsed (UITreeNode)
typescript
{
  componentType: "BUTTON",
  text: "Sign In",
  props: {
    rightIcon: "ArrowRight"
  },
  styleHints: {
    variant: "primary" // inferred from color/style
  }
}

### ⬇️ Mapped (Component Config)
typescript
{
  component: "Button",
  props: {
    text: "Sign In",
    rightIcon: "ArrowRight",
    variant: "solid", // mapped from 'primary'
    onPress: "() => {}" // injected default
  }
}

### ⬇️ Generated (React Native Code)
tsx
<Button
  text="Sign In"
  variant="solid"
  rightIcon="ArrowRight"
  onPress={() => {}}
/>

---

## 📂 Project Structure
src/
├── parsers/
│   └── ui-tree.parser.ts       # Figma JSON -> UITreeNode
├── generators/
│   ├── component-map.ts        # UITreeNode -> Component Props
│   └── code-generator.ts       # UITreeNode -> JSX String
├── types/
│   └── ui-tree.ts              # The unified data interface
├── index.ts                    # Main entry point
└── utils/                      # Loggers and helpers

## Quick Start

1.  **Place Figma JSON**: Save your Figma selection as input.json in the root.
2.  **Run**:
bash
    npm start
   
3.  **Result**: Check output.tsx for your generated React Native code.
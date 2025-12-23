#!/usr/bin/env node

/**
 * Build knowledge base from project documentation
 * This creates a searchable knowledge base for the AI bot
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');
const KB_OUTPUT = join(__dirname, 'knowledge-base.json');

/**
 * Read all markdown files from a directory recursively
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findMarkdownFiles(filePath, fileList);
    } else if (extname(file) === '.md') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract metadata from markdown file
 */
function parseMarkdown(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(PROJECT_ROOT, '').replace(/^\//, '');

  // Extract title (first # heading)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : relativePath;

  // Extract sections
  const sections = content.split(/^##\s+/m).filter(s => s.trim());

  return {
    path: relativePath,
    title,
    content,
    sections: sections.map(s => {
      const lines = s.split('\n');
      const heading = lines[0];
      const body = lines.slice(1).join('\n').trim();
      return { heading, body };
    }),
    wordCount: content.split(/\s+/).length,
  };
}

/**
 * Read package.json for metadata
 */
function getPackageInfo() {
  try {
    const pkgPath = join(PROJECT_ROOT, 'package.json');
    return JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch (error) {
    return {};
  }
}

/**
 * Extract code examples from markdown
 */
function extractCodeExamples(content) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const examples = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    examples.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return examples;
}

/**
 * Build complete knowledge base
 */
function buildKnowledgeBase() {
  console.log('🔨 Building knowledge base...\n');

  const mdFiles = findMarkdownFiles(PROJECT_ROOT);
  console.log(`Found ${mdFiles.length} markdown files\n`);

  const documents = mdFiles.map(file => {
    console.log(`  Processing: ${file.replace(PROJECT_ROOT, '')}`);
    return parseMarkdown(file);
  });

  const packageInfo = getPackageInfo();

  // Extract all code examples
  const allCodeExamples = documents.flatMap(doc =>
    extractCodeExamples(doc.content).map(ex => ({
      ...ex,
      source: doc.path
    }))
  );

  const kb = {
    metadata: {
      projectName: packageInfo.name || '@fabriquant/sdk',
      version: packageInfo.version || '0.2.0',
      description: packageInfo.description || '',
      keywords: packageInfo.keywords || [],
      repository: packageInfo.repository?.url || '',
      builtAt: new Date().toISOString(),
      documentCount: documents.length,
      codeExampleCount: allCodeExamples.length,
    },
    documents,
    codeExamples: allCodeExamples,
    quickFacts: {
      purpose: 'Precision execution stack for Solana - Engineered for Parallelism, Built for Autonomy',
      targetAudience: [
        'Solana developers',
        'AI agent builders',
        'DeFi protocol developers',
        'Trading bot creators'
      ],
      coreComponents: [
        'Loom (solfabric) - Parallel execution framework',
        'Guard (sol-ops-guard) - On-chain safety layer',
        'Flow (x-liquidity-engine) - Multi-DEX liquidity routing',
        'Risk (pulsar) - AI-driven risk assessment',
        'Privacy (arbor) - ZK Compression layer'
      ],
      keyFeatures: [
        'Real Jupiter V6 DEX integration',
        'Pattern library for common use cases',
        'Parallel transaction optimization',
        'Built-in security and risk management',
        'Privacy via ZK Compression',
        'Cross-chain abstraction (in progress)'
      ],
      installation: 'npm install @fabriquant/sdk',
      repository: 'https://github.com/fabriquant-labs/fabriquant',
      twitter: '@psyto',
      license: 'MIT - Open Source'
    }
  };

  writeFileSync(KB_OUTPUT, JSON.stringify(kb, null, 2));

  console.log(`\n✅ Knowledge base built successfully!`);
  console.log(`   Documents: ${kb.metadata.documentCount}`);
  console.log(`   Code examples: ${kb.metadata.codeExampleCount}`);
  console.log(`   Output: ${KB_OUTPUT}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildKnowledgeBase();
}

export { buildKnowledgeBase };

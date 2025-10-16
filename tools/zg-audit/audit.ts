#!/usr/bin/env node
import { globby } from 'globby';
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import prettier from 'prettier';
import { CTA_RULES, FORBIDDEN_PATTERNS } from './rules';

type Finding = {
  file: string;
  nodeType: string;
  text?: string;
  href?: string;
  suggestion?: string;
  ruleId?: string;
  note?: string;
  line?: number;
};

const SRC_DIRS = ['src', 'app', 'pages'];
const exts = ['tsx', 'jsx', 'ts', 'js'];

const autoFix = process.argv.includes('--fix');

(async function main() {
  const patterns = SRC_DIRS.map(d => `${d}/**/*.{${exts.join(',')}}`);
  const files = await globby(patterns, { gitignore: true });
  const findings: Finding[] = [];
  const pages: string[] = [];
  const components: string[] = [];

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    if (!code.trim()) continue;

    // quick catalog pages/components
    if (/\/(pages|app)\//.test(file) || /\/src\/pages\//.test(file)) pages.push(file);
    if (/\/components\//.test(file) || /\/mobile\//.test(file)) components.push(file);

    // forbidden checks
    FORBIDDEN_PATTERNS.forEach(re => {
      if (re.test(code)) {
        findings.push({ file, nodeType: 'Forbidden', suggestion: 'Remove usage', ruleId: 'forbidden', note: re.toString() });
      }
    });

    // Parse JSX/TSX
    let ast;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy']
      });
    } catch {
      continue; // skip unparsable
    }

    let changed = false;

    traverse(ast, {
      JSXElement(pathEl) {
        const opening = pathEl.node.openingElement;
        const name = (opening.name as any)?.name || '';

        // Inspect anchor <a> and button
        if (name === 'a' || name === 'button') {
          const attrs = opening.attributes || [];
          const hrefAttr = attrs.find((a: any) => a.name?.name === 'href') as any;
          const onClickAttr = attrs.find((a: any) => a.name?.name === 'onClick') as any;
          const roleAttr = attrs.find((a: any) => a.name?.name === 'role') as any;

          // Get inner text (naive)
          const text = (pathEl.node.children || [])
            .map((c: any) => (c.type === 'JSXText' ? c.value.trim() : ''))
            .join(' ')
            .trim();

          const href = hrefAttr?.value?.value as string | undefined;
          const role = roleAttr?.value?.value as string | undefined;
          const onClickSrc = onClickAttr ? generate(onClickAttr.value).code : undefined;

          // Match rules
          for (const rule of CTA_RULES) {
            const matchesText = !rule.match.text || rule.match.text.some(re => re.test(text));
            const matchesHref = !rule.match.hrefStartsWith || (href && rule.match.hrefStartsWith.some(p => href.startsWith(p)));
            const matchesOnClick = !rule.match.onClickContains || (onClickSrc && rule.match.onClickContains.some(re => re.test(onClickSrc)));
            const matchesRole = !rule.match.role || (role && rule.match.role.includes(role));

            if (matchesText && (matchesHref || matchesOnClick || !rule.match.hrefStartsWith)) {
              const out = rule.route({ file, existingHref: href, slugGuess: href?.split('/').pop() });
              const line = pathEl.node.loc?.start.line;

              // Record finding
              findings.push({
                file,
                nodeType: name,
                text,
                href,
                suggestion: out.href || out.onClickReplacement,
                ruleId: rule.id,
                note: out.note,
                line
              });

              // Auto-fix if requested
              if (autoFix) {
                if (out.href) {
                  // ensure href attribute exists
                  if (hrefAttr) {
                    hrefAttr.value.value = out.href;
                  } else {
                    opening.attributes.push({
                      type: 'JSXAttribute',
                      name: { type: 'JSXIdentifier', name: 'href' },
                      value: { type: 'StringLiteral', value: out.href }
                    } as any);
                  }
                  changed = true;
                }
                if (out.onClickReplacement && onClickAttr) {
                  // naive replace of onClick handler
                  onClickAttr.value = parse(out.onClickReplacement, { plugins: ['jsx', 'typescript'] }) as any;
                  changed = true;
                }
              }
              break; // stop after first hit
            }
          }
        }
      }
    });

    if (autoFix && changed) {
      const newCode = await prettier.format(generate(ast, { retainLines: true }).code, { parser: 'babel-ts' });
      fs.writeFileSync(file, newCode);
    }
  }

  // Report
  const reportDir = path.join('tools', 'zg-audit', 'out');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'findings.json'), JSON.stringify({ findings, pages, components }, null, 2));

  const byFile: Record<string, Finding[]> = {};
  findings.forEach(f => {
    byFile[f.file] = byFile[f.file] || [];
    byFile[f.file].push(f);
  });

  let md = `# ZhenGrowth CTA & Pages Audit\n\n## Summary\n- Files scanned: ${files.length}\n- Pages detected: ${pages.length}\n- Components detected: ${components.length}\n- Findings: ${findings.length}\n\n`;
  md += `## Routing Rules Applied\n${CTA_RULES.map(r => `- **${r.id}**`).join('\n')}\n\n`;
  md += `## Forbidden Patterns\n${FORBIDDEN_PATTERNS.map(p=>`- \`${p}\``).join('\n')}\n\n`;
  md += `## Findings by File\n`;
  Object.entries(byFile).forEach(([file, rows]) => {
    md += `\n### ${file}\n`;
    rows.forEach(r => {
      md += `- L${r.line || '?'}: <${r.nodeType}> "${r.text}" ${r.href ? `href="${r.href}"` : ''} → **${r.suggestion}** (${r.ruleId}) ${r.note ? `— _${r.note}_` : ''}\n`;
    });
  });

  fs.writeFileSync(path.join(reportDir, 'audit-report.md'), md);
  console.log('✅ Audit complete.\n- JSON: tools/zg-audit/out/findings.json\n- Report: tools/zg-audit/out/audit-report.md');
  if (autoFix) console.log('🛠️ Auto-fixes applied where possible.');
})();

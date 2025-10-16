# ZhenGrowth CTA & Routing Audit Tool

Automated auditing and fixing of CTAs, routing, and forbidden patterns across the codebase.

## Features

- **CTA Rule Enforcement**: Ensures all CTAs follow canonical routing patterns
- **Forbidden Pattern Detection**: Finds legacy paths and purged features
- **Auto-Fix Capability**: Can automatically update CTAs to follow rules
- **Comprehensive Reporting**: Generates JSON and Markdown reports

## Usage

### Dry Run (Report Only)
```bash
npm run audit:cta
# or
tsx tools/zg-audit/audit.ts
```

This will:
- Scan all source files
- Detect CTA issues
- Generate reports in `tools/zg-audit/out/`
- NOT modify any files

### Auto-Fix Mode
```bash
npm run audit:cta:fix
# or
tsx tools/zg-audit/audit.ts --fix
```

This will:
- Scan all source files
- Detect CTA issues
- Automatically fix common issues
- Update files in place
- Generate reports

## Rules

### CTA Routing Rules

1. **book->coaching**: Legacy `/book` links → `/coaching/discovery-60`
2. **book-btn-nohref->coaching**: Buttons with "book" text get coaching href
3. **go->coaching-hub**: "See all options" → `/coaching`
4. **events->register**: Event CTAs → `/events/:slug#register`
5. **contact->priority**: Priority consult → `/contact#priority`
6. **admin->install**: Admin install → `/admin#install`
7. **coaching->specific**: Specific program links → `/coaching/:slug`

### Forbidden Patterns

- `/book` - Legacy booking path
- `/book-session` - Legacy booking path
- `crypto|web3|metamask|ethers|nft|bitcoin|ethereum` - Purged features

## Reports

After running, check:

- **JSON Report**: `tools/zg-audit/out/findings.json`
  - Machine-readable findings
  - Full context for each issue

- **Markdown Report**: `tools/zg-audit/out/audit-report.md`
  - Human-readable summary
  - Organized by file
  - Includes line numbers and suggestions

## Reusable Link Components

Instead of manual `<a>` tags, use these standardized components:

### LinkCoaching
```tsx
import LinkCoaching from '@/components/LinkCoaching';

<LinkCoaching slug="discovery-60">Book a session</LinkCoaching>
```

### LinkCoachingHub
```tsx
import LinkCoachingHub from '@/components/LinkCoachingHub';

<LinkCoachingHub>See all options</LinkCoachingHub>
```

### LinkEventRegister
```tsx
import LinkEventRegister from '@/components/LinkEventRegister';

<LinkEventRegister slug="webinar-jan">Register</LinkEventRegister>
```

## Adding New Rules

Edit `tools/zg-audit/rules.ts`:

```typescript
export const CTA_RULES: CtaRule[] = [
  // ... existing rules
  {
    id: 'my-new-rule',
    match: { 
      text: [/pattern to match/i], 
      hrefStartsWith: ['/old-path'] 
    },
    route: ({ existingHref, slugGuess }) => ({ 
      href: `/new-path/${slugGuess}`, 
      note: 'Explanation' 
    })
  }
];
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Audit CTAs
  run: npm run audit:cta
  
- name: Check for issues
  run: |
    if [ -f tools/zg-audit/out/findings.json ]; then
      count=$(jq '.findings | length' tools/zg-audit/out/findings.json)
      if [ "$count" -gt 0 ]; then
        echo "Found $count CTA issues"
        exit 1
      fi
    fi
```

## Best Practices

1. **Run before commits**: `npm run audit:cta` to check for issues
2. **Review auto-fixes**: Always review changes made by `--fix` mode
3. **Use link components**: Prefer standardized components over manual links
4. **Update rules**: Keep rules.ts in sync with routing architecture
5. **Document changes**: Update this README when adding new rules

## Troubleshooting

### "Cannot find module 'globby'"
```bash
npm install -D globby @babel/parser @babel/traverse @babel/generator prettier
```

### "Permission denied"
```bash
chmod +x tools/zg-audit/audit.ts
```

### False Positives
Add exceptions to rules.ts or use more specific patterns.

## Example Report

```markdown
# ZhenGrowth CTA & Pages Audit

## Summary
- Files scanned: 156
- Pages detected: 24
- Components detected: 87
- Findings: 12

## Findings by File

### src/pages/Home.tsx
- L42: <a> "Book a session" href="/book" → **/coaching/discovery-60** (book->coaching) — _Rerouted legacy /book to /coaching_
- L89: <button> "See all options" → **/coaching** (go->coaching-hub) — _Hub page_
```

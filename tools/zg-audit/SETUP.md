# CTA Audit Tool - Setup Instructions

## Installation Complete ✅

All dependencies have been installed:
- `globby` - File pattern matching
- `@babel/parser` - AST parsing
- `@babel/traverse` - AST traversal
- `@babel/generator` - Code generation
- `@types/babel__traverse` - TypeScript types
- `@types/babel__generator` - TypeScript types
- `tsx` - TypeScript execution

## Manual Setup Required

### Add Scripts to package.json

Since `package.json` is read-only in this system, please manually add these scripts:

```json
{
  "scripts": {
    "audit:cta": "tsx tools/zg-audit/audit.ts",
    "audit:cta:fix": "tsx tools/zg-audit/audit.ts --fix"
  }
}
```

## Usage

Once scripts are added, run:

### Dry Run (Report Only)
```bash
npm run audit:cta
```

### Auto-Fix Mode
```bash
npm run audit:cta:fix
```

### Direct Execution (Alternative)
```bash
# Dry run
npx tsx tools/zg-audit/audit.ts

# Auto-fix
npx tsx tools/zg-audit/audit.ts --fix
```

## What This Tool Does

1. **Scans** all source files in `src/`, `app/`, `pages/`
2. **Detects** CTAs that don't follow routing rules
3. **Identifies** forbidden patterns (legacy paths, crypto references)
4. **Suggests** proper routing for each issue
5. **Auto-fixes** common issues (in `--fix` mode)
6. **Generates** reports in `tools/zg-audit/out/`

## First Run

After adding the scripts, run a dry audit:

```bash
npm run audit:cta
```

Check the generated reports:
- `tools/zg-audit/out/findings.json` - Machine-readable
- `tools/zg-audit/out/audit-report.md` - Human-readable

## Reusable Components

Three new link components have been created for standardized CTAs:

### 1. LinkCoaching
For specific coaching program links:
```tsx
import LinkCoaching from '@/components/LinkCoaching';

<LinkCoaching slug="discovery-60">Book Free Call</LinkCoaching>
<LinkCoaching slug="dreambuilder-3mo">Learn More</LinkCoaching>
```

### 2. LinkCoachingHub
For the coaching programs listing page:
```tsx
import LinkCoachingHub from '@/components/LinkCoachingHub';

<LinkCoachingHub>See All Programs</LinkCoachingHub>
<LinkCoachingHub>View Coaching Options</LinkCoachingHub>
```

### 3. LinkEventRegister
For event registration CTAs:
```tsx
import LinkEventRegister from '@/components/LinkEventRegister';

<LinkEventRegister slug="webinar-jan">Register Now</LinkEventRegister>
```

## Next Steps

1. **Add scripts** to package.json (see above)
2. **Run first audit**: `npm run audit:cta`
3. **Review findings** in `tools/zg-audit/out/audit-report.md`
4. **Apply fixes** carefully: `npm run audit:cta:fix`
5. **Verify changes** in git diff
6. **Refactor CTAs** to use new link components
7. **Integrate** into CI/CD pipeline

## Troubleshooting

### Scripts not working?
Make sure you've added them to package.json manually.

### Permission errors?
```bash
chmod +x tools/zg-audit/audit.ts
```

### Module not found?
Dependencies should be installed. If issues persist:
```bash
npm install
```

## Support

See `tools/zg-audit/README.md` for full documentation.

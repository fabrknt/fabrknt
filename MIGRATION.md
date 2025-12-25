# Migration Guide

This guide helps you migrate from older naming conventions to the new **Fabriquant** branding introduced in v0.1.0.

## Overview of Changes

The v0.1.0 release includes a complete rebranding with simplified, clearer component names. This guide covers:

1. Package name changes
2. Component naming updates
3. Code migration examples
4. Backward compatibility notes

## Package Name Change

### Old Package Name
```json
{
  "dependencies": {
    "@fabricant/sdk": "^0.0.x"
  }
}
```

### New Package Name
```json
{
  "dependencies": {
    "@fabrknt/sdk": "^0.1.0"
  }
}
```

### Migration Steps

1. **Uninstall the old package:**
   ```bash
   npm uninstall @fabricant/sdk
   ```

2. **Install the new package:**
   ```bash
   npm install @fabrknt/sdk
   ```

3. **Update import statements:**
   ```typescript
   // Old
   import { Guard, Pulsar } from "@fabricant/sdk";

   // New
   import { Guard, Pulsar } from "@fabrknt/sdk";
   ```

## Component Naming Changes

### Summary Table

| Category | Old Name | New Name | Class/Export | Backward Compatible? |
|----------|----------|----------|--------------|---------------------|
| **Project** | Fabricant | Fabriquant | - | ❌ Breaking change |
| **Package** | `@fabricant/sdk` | `@fabrknt/sdk` | - | ❌ Breaking change |
| **Risk Component** | Fabric Pulse | Risk | `Pulsar` | ✅ Yes (class name unchanged) |
| **Privacy Component** | Fabric Weave | Privacy | - | ✅ Yes (identifier unchanged) |
| **Suite Name** | Fabricant Suite | Fabriquant Suite | - | ❌ Documentation only |
| **Main Class** | Fabricant | Fabriquant | `Fabriquant` | ❌ Breaking change |

### Detailed Component Changes

#### 1. Risk Component (formerly "Fabric Pulse")

**Terminology Change:**
- **Old Name**: Fabric Pulse
- **New Name**: Risk
- **Implementation**: Still uses `Pulsar` class name for backward compatibility

**No Code Changes Required** ✅

The class is still exported as `Pulsar`, so your existing code continues to work:

```typescript
// This works in both old and new versions
import { Pulsar } from "@fabrknt/sdk";

const pulsar = new Pulsar({
  apiKey: "your-api-key",
  environment: "mainnet",
});
```

**Documentation References:**
- In documentation, we now refer to this as the "Risk" component
- The class name `Pulsar` is retained for backward compatibility
- When reading docs, "Risk" = "Pulsar" = "Fabric Pulse" (all refer to the same component)

#### 2. Privacy Component (formerly "Fabric Weave")

**Terminology Change:**
- **Old Name**: Fabric Weave
- **New Name**: Privacy
- **Implementation**: Provider identifier remains `"arbor"`

**No Code Changes Required** ✅

The provider identifier is unchanged, so your existing code works:

```typescript
// This works in both old and new versions
import { FabricCore } from "@fabrknt/sdk";

const tx = FabricCore.optimize(transaction, {
  enablePrivacy: true,
  privacyProvider: "arbor", // Identifier unchanged
});

await Fabriquant.executePrivate(tx, {
  with: guard,
  privacy: {
    provider: "arbor", // Identifier unchanged
    compression: true,
  },
});
```

**Documentation References:**
- In documentation, we now refer to this as the "Privacy" component
- The `"arbor"` identifier is retained for backward compatibility
- When reading docs, "Privacy" = "Arbor" = "Fabric Weave" (all refer to the same component)

#### 3. Main Orchestration Class

**Class Name Change:**
- **Old Name**: `Fabricant`
- **New Name**: `Fabriquant`

**Code Changes Required** ❌

Update all references to the main class:

```typescript
// Old
import { Fabricant } from "@fabricant/sdk";
await Fabricant.execute(tx, { with: guard });

// New
import { Fabriquant } from "@fabrknt/sdk";
await Fabriquant.execute(tx, { with: guard });
```

## Migration Examples

### Example 1: Basic Guard Usage

**Before (v0.0.x):**
```typescript
import { Fabricant, Guard } from "@fabricant/sdk";

const guard = new Guard({
  maxSlippage: 0.1,
  riskTolerance: "moderate",
  mode: "block",
});

const result = await Fabricant.execute(transaction, { with: guard });
```

**After (v0.1.0):**
```typescript
import { Fabriquant, Guard } from "@fabrknt/sdk";

const guard = new Guard({
  maxSlippage: 0.1,
  riskTolerance: "moderate",
  mode: "block",
});

const result = await Fabriquant.execute(transaction, { with: guard });
```

**Changes:**
1. ✅ Package name: `@fabricant/sdk` → `@fabrknt/sdk`
2. ✅ Class name: `Fabricant` → `Fabriquant`

### Example 2: Risk Integration (Pulsar)

**Before (v0.0.x):**
```typescript
import { Guard, Pulsar } from "@fabricant/sdk";

// Guard with Fabric Pulse (Risk) enabled
const guard = new Guard({
  pulsar: {
    enabled: true,
    riskThreshold: 0.7,
    cacheTTL: 60000,
  },
});
```

**After (v0.1.0):**
```typescript
import { Guard, Pulsar } from "@fabrknt/sdk";

// Guard with Risk enabled (class still named Pulsar for compatibility)
const guard = new Guard({
  pulsar: {
    enabled: true,
    riskThreshold: 0.7,
    cacheTTL: 60000,
  },
});
```

**Changes:**
1. ✅ Package name: `@fabricant/sdk` → `@fabrknt/sdk`
2. ✅ Config key `pulsar` remains unchanged
3. ✅ `Pulsar` class name remains unchanged
4. 📝 Documentation now calls this "Risk" instead of "Fabric Pulse"

### Example 3: Privacy Integration (Arbor)

**Before (v0.0.x):**
```typescript
import { Fabricant, FabricCore } from "@fabricant/sdk";

// Optimize with Fabric Weave (Privacy)
const optimized = FabricCore.optimize(tx, {
  enablePrivacy: true,
  privacyProvider: "arbor",
});

const result = await Fabricant.executePrivate(optimized, {
  privacy: { provider: "arbor" },
});
```

**After (v0.1.0):**
```typescript
import { Fabriquant, FabricCore } from "@fabrknt/sdk";

// Optimize with Privacy (provider identifier remains "arbor")
const optimized = FabricCore.optimize(tx, {
  enablePrivacy: true,
  privacyProvider: "arbor",
});

const result = await Fabriquant.executePrivate(optimized, {
  privacy: { provider: "arbor" },
});
```

**Changes:**
1. ✅ Package name: `@fabricant/sdk` → `@fabrknt/sdk`
2. ✅ Class name: `Fabricant` → `Fabriquant`
3. ✅ Provider identifier `"arbor"` remains unchanged
4. 📝 Documentation now calls this "Privacy" instead of "Fabric Weave"

### Example 4: Complete Integration

**Before (v0.0.x):**
```typescript
import { Fabricant, Guard, Pulsar, FabricCore, Loom } from "@fabricant/sdk";

// Initialize Guard with Fabric Pulse (Risk)
const guard = new Guard({
  pulsar: { enabled: true, riskThreshold: 0.7 },
  mode: "block",
});

// Create transaction with Loom
const tx = await Loom.weave({
  type: "MULTI_ROUTE_SWAP",
  input: "SOL",
  output: "USDC",
  amount: 100,
});

// Optimize with Fabric Weave (Privacy)
const optimized = FabricCore.optimize(tx, {
  enablePrivacy: true,
  privacyProvider: "arbor",
});

// Execute with Fabricant
const result = await Fabricant.executePrivate(optimized, {
  with: guard,
  privacy: { provider: "arbor", compression: true },
});
```

**After (v0.1.0):**
```typescript
import { Fabriquant, Guard, Pulsar, FabricCore, Loom } from "@fabrknt/sdk";

// Initialize Guard with Risk (class still named Pulsar)
const guard = new Guard({
  pulsar: { enabled: true, riskThreshold: 0.7 },
  mode: "block",
});

// Create transaction with Loom
const tx = await Loom.weave({
  type: "MULTI_ROUTE_SWAP",
  input: "SOL",
  output: "USDC",
  amount: 100,
});

// Optimize with Privacy (provider identifier still "arbor")
const optimized = FabricCore.optimize(tx, {
  enablePrivacy: true,
  privacyProvider: "arbor",
});

// Execute with Fabriquant
const result = await Fabriquant.executePrivate(optimized, {
  with: guard,
  privacy: { provider: "arbor", compression: true },
});
```

**Changes:**
1. ✅ Package name: `@fabricant/sdk` → `@fabrknt/sdk`
2. ✅ Class name: `Fabricant` → `Fabriquant`
3. ✅ All other APIs remain backward compatible

## Quick Migration Checklist

Use this checklist to ensure you've migrated everything:

### Package & Dependencies
- [ ] Updated `package.json` to use `@fabrknt/sdk` instead of `@fabricant/sdk`
- [ ] Ran `npm install` to install the new package
- [ ] Verified no references to old package name in `package-lock.json`

### Code Changes
- [ ] Updated all import statements from `@fabricant/sdk` to `@fabrknt/sdk`
- [ ] Renamed `Fabricant` class to `Fabriquant` in all files
- [ ] Verified `Pulsar` class usage (no changes needed)
- [ ] Verified `"arbor"` provider identifier usage (no changes needed)

### Documentation & Comments
- [ ] Updated code comments referring to "Fabricant" → "Fabriquant"
- [ ] Updated code comments referring to "Fabric Pulse" → "Risk"
- [ ] Updated code comments referring to "Fabric Weave" → "Privacy"

### Testing
- [ ] Ran test suite to verify functionality: `npm test`
- [ ] Ran linter to verify code quality: `npm run lint`
- [ ] Tested critical paths manually if applicable

## Backward Compatibility Promise

We've designed this migration to minimize breaking changes:

### What's Backward Compatible ✅
- `Pulsar` class name (represents Risk component)
- `"arbor"` provider identifier (represents Privacy component)
- All Guard configurations and APIs
- All FabricCore APIs
- All Loom APIs
- Configuration object structures

### What's Breaking ❌
- Package name: `@fabricant/sdk` → `@fabrknt/sdk`
- Main class: `Fabricant` → `Fabriquant`

## Why the Rebrand?

The rebranding from "Fabricant" to "Fabriquant" brings several benefits:

1. **Clearer Identity**: The French spelling "Fabriquant" (meaning "manufacturer" or "creator") better reflects the precision and craftsmanship of the SDK
2. **Component Clarity**: Simplified names (Risk, Privacy) are more intuitive than abstract names (Fabric Pulse, Fabric Weave)
3. **SEO & Discoverability**: Unique spelling improves searchability and brand recognition
4. **Unified Vision**: The "weaving" metaphor is now clearly expressed through component names and APIs

## Need Help?

If you encounter issues during migration:

1. **Check the examples**: See `examples/` directory for updated code samples
2. **Review documentation**: See `docs/` for detailed component documentation
3. **Open an issue**: [GitHub Issues](https://github.com/fabrknt/fabrknt/issues)
4. **Check the changelog**: See [CHANGELOG.md](./CHANGELOG.md) for complete list of changes

## Future Deprecations

We plan to maintain backward compatibility for the following in the near term:

- `Pulsar` class name (at least through v0.2.x)
- `"arbor"` provider identifier (at least through v0.2.x)

Future major versions (v1.0.0+) may remove these compatibility layers in favor of:
- `Risk` class to replace `Pulsar`
- `"privacy"` provider to replace `"arbor"`

We'll provide ample notice before any deprecations.

---

**Migration completed?** You're now ready to build with Fabriquant! 🎉

Check out the [README](./README.md) for usage examples and the [documentation](./docs/) for detailed API references.

# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native mobile app (Makit+)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Makit+ Mobile App

**Purpose**: Application de livraison du marché à domicile

### Features
- **Splash screen** with green theme + logo
- **Authentication**: Login, Register, Forgot password (AsyncStorage)
- **Client flow**: Home → Commander → Panier (3-step: articles → adresse → paiement) → Suivi
- **Livreur interface**: View/update all orders, status management
- **Order tracking**: 4-step status (en_attente → achat_en_cours → en_livraison → livre)
- **6 product categories**: Légumes, Tomates, Plantain, Poisson, Viande, Épices
- **Custom items**: Clients can add custom products with their prices
- **Delivery fee**: 750 FCFA fixed
- **Payment**: Cash on delivery or Mobile Money

### Test Accounts
- **Livreur**: phone `0000000000`, password `livreur123`
- **Client**: Create account via register screen

### Colors
- Primary: #4CAF50 (vert)
- Light: #81C784
- Lighter: #C8E6C9
- Dark: #388E3C

### State Management
- AuthContext: User authentication with AsyncStorage
- CartContext: Shopping cart state
- OrderContext: Orders persistence with AsyncStorage

### Routes
- `/` → Splash screen (auto-redirects based on auth state)
- `/(auth)/login` → Login
- `/(auth)/register` → Register
- `/(auth)/forgot` → Forgot password
- `/(tabs)/home` → Client home
- `/(tabs)/order` → Product catalog & ordering
- `/(tabs)/cart` → Shopping cart + checkout flow
- `/(tabs)/orders` → Order history
- `/(tabs)/profile` → User profile
- `/order-detail` → Order tracking detail
- `/(livreur)/orders` → Livreur dashboard

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app for Makit+. Uses AsyncStorage for all local persistence.

- Entry: `app/_layout.tsx` — providers setup
- Fonts: Inter 400/500/600/700
- Packages: expo-router, @expo/vector-icons, @tanstack/react-query, react-native-reanimated, @react-native-async-storage/async-storage

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config.

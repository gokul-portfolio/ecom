# Enterprise Module Architecture & Development Blueprint
> **System Architecture, Standards, and Developer Guide**  
> Reference Implementation: **Department (`departments`)** and **Role (`roles`)** Modules

---

## 1. Architectural Overview & Philosophy

Every module in this platform is engineered following an **Enterprise-Grade Single Page Architecture (SPA)** powered by **Next.js App Router**, **Prisma ORM (PostgreSQL)**, **Socket.io Real-Time Synchronization**, and **Strict Keyboard Accessibility**.

### Core Standards
1. **Full-Width Edge-to-Edge Responsive Layout**: No hardcoded artificial `max-w` containers on wide screens; content naturally flows across the display with standard grid gutters.
2. **2-Column Split Master Forms**: Create and Edit forms utilize a **65% Form Inputs + 35% Live Preview Panel** layout to maximize wide-screen efficiency and eliminate awkward visual voids.
3. **Smart Auto-Hiding Pagination**: Tables automatically conceal pagination bars when records fit on a single page (`totalPages <= 1` or `totalItems <= pageSize`).
4. **Zero-Click Real-time Synchronization**: Background updates are instantly pushed to all open tabs via Socket.io broadcast without requiring browser reloads.
5. **Keyboard-First Workflow**: Seamless field traversal using <kbd>Enter</kbd> / <kbd>↑</kbd> <kbd>↓</kbd>, saving via <kbd>Ctrl+S</kbd>, cancelling via <kbd>Esc</kbd>, and clearing via <kbd>F4</kbd>.

---

## 2. Standard Directory & File Hierarchy

To create a new module named `[module]` (e.g. `departments`, `roles`, `shifts`, `products`), adhere strictly to this file structure:

```
src/
├── app/
│   ├── (admin)/
│   │   └── [module]/
│   │       ├── page.tsx               # Server entry point (fetches initial data / SEO metadata)
│   │       ├── [Module]Client.tsx     # Client-side table, search, sort, and actions UI
│   │       └── form/
│   │           └── page.tsx           # 2-Column Split Create & Edit Master Form
│   └── api/
│       └── admin/
│           └── [module]/
│               ├── route.ts           # GET (paginated catalog) & POST (create + socket notify)
│               └── [id]/
│                   └── route.ts       # GET (details), PUT (update + socket), DELETE (remove + socket)
├── lib/
│   └── validations/
│       └── [module].ts                # Zod schemas: [module]Schema & [module]UpdateSchema
└── prisma/
    └── schema.prisma                  # Database Model, Indexes, Relations & Enums
```

---

## 3. Database & Schema Design (`prisma/schema.prisma`)

### A. Model Conventions
- Primary Keys: Always use **UUIDv4** (`@id @default(uuid())`).
- Business Identifiers: Auto-generated uppercase unique sequential code (e.g., `code String @unique` or `slug String @unique`).
- Operational Status: Boolean flag (`isActive Boolean @default(true)`) or Enum (`Status`).
- Audit Columns: Always include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.

### B. Concrete Example: `Department` & `Role` Models
```prisma
model Department {
  id          String      @id @default(uuid())
  code        String      @unique                  // Sequential code: DEP001, DEP002
  name        String
  description String?
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relationships
  roles       Role[]
  staff       AdminUser[]

  @@index([name])
  @@index([code])
}

model Role {
  id           String      @id @default(uuid())
  name         String
  slug         String      @unique                 // Sequential code: role_001, role_002
  description  String?
  isSystem     Boolean     @default(false)         // System protection flag
  departmentId String
  permissions  Json        @default("[]")          // Array of permission strings
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  department   Department  @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  staff        AdminUser[]

  @@index([name])
  @@index([slug])
  @@index([departmentId])
}
```

---

## 4. Backend API Layer (`/api/admin/[module]`)

### A. Collection Route (`route.ts`)
Handles paginated listings, multi-field search, sorting, and new record creation with Socket.io broadcast.

```typescript
// src/app/api/admin/[module]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { departmentSchema } from "@/lib/validations/department";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { staff: true, roles: true } },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = departmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    }

    const record = await prisma.department.create({ data: validation.data });

    // Broadcast Real-time event across all clients
    broadcastSocketEvent("departments:changed", { action: "CREATE", id: record.id });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create" }, { status: 500 });
  }
}
```

### B. Single Resource Route (`[id]/route.ts`)
Handles single record retrieval (`GET`), atomic updates (`PUT`), and protected deletion (`DELETE`).

```typescript
// Protect system records from deletion
if (existing.isSystem) {
  return NextResponse.json({ success: false, error: "Protected system records cannot be deleted." }, { status: 403 });
}
```

---

## 5. Real-Time Synchronization Architecture (Socket.io)

### Event Dispatch Workflow
1. A database write succeeds in Next.js API route (`POST`, `PUT`, `DELETE`).
2. API calls `broadcastSocketEvent("[module]:changed", { action: "CREATE" | "UPDATE" | "DELETE", id })`.
3. Background notification helper notifies the Node.js socket server (`socket-server.js`).
4. Client table hook `useServerTable` listens to `"[module]:changed"` and triggers an immediate silent re-fetch (`refetch()`).

### Supported System Broadcast Events (`src/server/socket.ts`):
- `departments:changed`
- `roles:changed`
- `shifts:changed`
- `products:changed`
- `categories:changed`

---

## 6. Table & Listing Page Design (`[Module]Client.tsx`)

### UI Rules for Listing Headers
- **No Redundant Navigation Pills**: Do not clutter the header with links to other modules (`Departments`, `Roles`, `Shifts`) — these belong exclusively in the main sidebar.
- **Single Primary Action Button**: Keep only the primary action button (`+ Add [Module]`) aligned to the right.
- **Unified TanStack `DataTable`**: Uses integrated search bar, column visibility toggles, CSV export, and server-side sorting.

### Common Auto-Hide Pagination Standard
Pagination must **ONLY** be displayed when records span multiple pages:
```typescript
// Inside src/components/ui/table/DataTable.tsx & Pagination.tsx:
const isPaginationNeeded = totalPages > 1 || totalItems > pageSize;

// Automatically hides when:
// 1. Total records <= 1 page (e.g. 4 records with pageSize 5)
// 2. Zero records exist
```

---

## 7. Master Form Architecture: 2-Column Split Layout (`form/page.tsx`)

The standard layout for all Create and Edit pages divides the interface into a **65% Primary Form Column** and a **35% Sticky Preview & Guidelines Column**.

```
+-----------------------------------------------------------------------------------------+
| [<- Back]  Create Department *DEP005                                           [Cancel] |
+------------------------------------------------------------+----------------------------+
| LEFT COLUMN (65% Width)                                    | RIGHT COLUMN (35% Width)   |
|                                                            |                            |
| +--------------------------------------------------------+ | +------------------------+ |
| | 01  IDENTIFICATION & BASIC INFO            Step 1 of 2 | | | ✨ LIVE PREVIEW        | |
| |                                                        | | |                        | |
| | [ Department Name * ]        [ Status Dropdown * ]     | | |  [Icon] Untitled Dept  | |
| |                                                        | | |         *DEP005 [Active| |
| |                                                        | | +------------------------+ |
| | 02  OPERATIONAL SCOPE & POLICIES           Step 2 of 2 | |                            |
| |                                                        | | +------------------------+ |
| | [ Scope Description / Responsibilities Textarea ]     | | | ℹ️ GOVERNANCE POLICIES   | |
| |                                                        | | |  • Rule 1: Codes ...   | |
| |--------------------------------------------------------| | |  • Rule 2: Staff ...   | |
| | [Clear Form (F4)]              [Create Department (Ctrl+S] | +------------------------+ |
| +--------------------------------------------------------+ |                            |
+------------------------------------------------------------+----------------------------+
```

### Key Form Implementation Rules
1. **Header Cleanliness**:
   - Title must show auto-generated code as **plain text** (e.g. `*DEP005` or `*role_001`), **NOT** wrapped in a badge or heavy background pill.
   - **No Duplicate Top Submit Button**: The primary action button lives at the card footer; header only contains `<Link href="...">Cancel</Link>` and the Back Arrow.
   - **No Keyboard Badges in Header**: Remove noisy `Ctrl+S save | Esc back` tags from the top bar.
2. **Left Column (65% Form)**:
   - Divided into numbered steps (`01`, `02`).
   - Every input has dedicated label, inline validation error (`AlertCircle`), and contextual helper text.
   - Form container must bind keyboard hooks (`useFormKeyboardNavigation`).
3. **Right Column (35% Sticky Sidebar)**:
   - **Live Preview Card**: Renders real-time visual badge/card of the item as it will appear in the application.
   - **Governance & Best Practices Card**: Explains business rules, sequential code logic, and relationship constraints.

---

## 8. Keyboard Navigation Specification

All modules must implement seamless keyboard accessibility using `src/hooks/useKeyboardNavigation.ts`:

| Shortcut | Context | Behavior |
| :--- | :--- | :--- |
| <kbd>Enter</kbd> | Form Inputs | Advances focus to the next logical input field |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Form Inputs | Moves focus up/down through vertical form fields |
| <kbd>Ctrl + Enter</kbd> | Form Inputs | Submits the form immediately |
| <kbd>Ctrl + S</kbd> / <kbd>Cmd + S</kbd> | Anywhere on Form Page | Saves / Submits the record |
| <kbd>Esc</kbd> | Form Page | Cancels and navigates back to list view (`router.push`) |
| <kbd>F4</kbd> | Create Form | Clears all inputs and resets focus to the first field |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Data Table | Navigates between rows in the table |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Data Table Row | Opens the selected item's view modal or detail page |
| <kbd>E</kbd> | Data Table Row | Navigates directly to the Edit Form (`/form?id=...`) |

---

## 9. Security & Role-Based Access Control (RBAC)

Use `useAdminAuth` to guard interactive capabilities:

```typescript
const { hasPermission } = useAdminAuth();

const canRead   = hasPermission("[module]:read") || hasPermission("*");
const canWrite  = hasPermission("[module]:write") || hasPermission("*");
const canExport = hasPermission("[module]:export") || hasPermission("*");
```

- If `!canWrite`, disable form submit buttons (`disabled={!canWrite}`) and hide Edit/Delete action triggers.
- In backend routes, return HTTP `403 Forbidden` if unauthorized.

---

## 10. Step-by-Step Developer Checklist: Adding a New Module

Follow these 7 steps to build any new module in ~15 minutes:

- [ ] **Step 1: Schema Definition**: Add model in `prisma/schema.prisma` with UUID ID, unique code/slug, audit timestamps, and run `npx prisma db push`.
- [ ] **Step 2: Zod Validations**: Create `src/lib/validations/[module].ts` with create & update schemas.
- [ ] **Step 3: Backend API**: Create `src/app/api/admin/[module]/route.ts` and `[id]/route.ts` with pagination, search, sort, and `broadcastSocketEvent("[module]:changed")`.
- [ ] **Step 4: Socket Registry**: Add `"[module]:changed"` event string to `ServerToClientEvents` in `src/server/socket.ts` and `AppBroadcastEvent` in `src/lib/socket-notify.ts`.
- [ ] **Step 5: Client Table Page**: Build `[Module]Client.tsx` using `useServerTable` with `socketEventName: "[module]:changed"`. Ensure header only has the single `+ Add` button.
- [ ] **Step 6: 2-Column Master Form**: Build `src/app/(admin)/[module]/form/page.tsx` with:
  - 65% Primary Form + 35% Live Preview Panel.
  - Plain text code `*CODE` in title.
  - Card footer with `Clear Form (F4)` and `Submit (Ctrl+S)`.
  - `useFormKeyboardNavigation` + `useKeyboardShortcuts`.
- [ ] **Step 7: Verification**: Run `npx tsc --noEmit` to verify 0 errors, test in browser, and commit under `gokul-portfolio`.

---

## 11. Master AI Prompt Template (Copy-Paste for Any New Module)

> **Instructions for Developers**:  
> Whenever you need to create a new module in this project (e.g., *Categories*, *Products*, *Suppliers*, *Customers*, *Inventory*, *Invoices*), copy the prompt box below, fill in the **Variables** at the top, and paste it to Antigravity / your AI coding assistant. It will autonomously generate the entire end-to-end module adhering 100% to this project's architecture!

```markdown
### TASK: Create New Enterprise Module for Next.js App Router Platform

You are working on the enterprise codebase in this repository. Follow the exact architectural pattern established by the **Department (`departments`)** and **Role (`roles`)** modules.

#### 1. MODULE CONFIGURATION & VARIABLES
- **Module Name (Singular)**: {{MODULE_NAME_SINGULAR}} (e.g., "Supplier")
- **Module Name (Plural/Folder)**: {{MODULE_NAME_PLURAL}} (e.g., "suppliers")
- **Database Model Name**: {{PRISMA_MODEL_NAME}} (e.g., "Supplier")
- **Sequential Code Prefix**: {{CODE_PREFIX}} (e.g., "SUP" -> generates "SUP001", "SUP002")
- **Permission Scope**: {{PERMISSION_PREFIX}} (e.g., "suppliers:read", "suppliers:write", "suppliers:delete")
- **Socket.io Event**: {{MODULE_NAME_PLURAL}}:changed (e.g., "suppliers:changed")
- **Fields Specification**:
  {{FIELDS_SPECIFICATION}}
  (Example:
   - name: String (required, min 2 chars)
   - contactPerson: String (required)
   - email: String (email format, optional)
   - phone: String (required)
   - address: String (optional)
   - taxNumber: String (optional)
   - isActive: Boolean (default true)
  )
- **Relationships**:
  {{RELATIONSHIPS}}
  (Example: Many-to-One with Company / One-to-Many with Products)

---

#### 2. STRICT ARCHITECTURAL REQUIREMENTS (Refer to `departments` and `roles`)

##### A. Prisma Database Layer (`prisma/schema.prisma`)
1. Create `model {{PRISMA_MODEL_NAME}}` with:
   - `id String @id @default(uuid())`
   - `code String @unique` (or `slug String @unique` if lower-snake-cased like roles)
   - All specified business fields
   - `isActive Boolean @default(true)`
   - `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
   - Necessary `@index` attributes on searchable columns (`name`, `code`, relation IDs).
2. Execute `npx prisma db push` and `npx prisma generate` to apply changes.

##### B. Zod Validation (`src/lib/validations/{{MODULE_NAME_PLURAL}}.ts` or singular)
1. Export `{{MODULE_NAME_SINGULAR_LOWER}}Schema` with clean error messages and field constraints.
2. Export `{{MODULE_NAME_SINGULAR_LOWER}}UpdateSchema` using `.partial()` or tailored update rules.

##### C. Backend API Routes (`src/app/api/admin/{{MODULE_NAME_PLURAL}}`)
1. **`route.ts`**:
   - `GET`: Handles server-side pagination (`page`, `limit`), case-insensitive `search` on text fields, multi-column `sortBy` and `sortOrder`, and returns `{ success: true, data, pagination: { page, limit, totalItems, totalPages } }`.
   - `POST`: Validates request body with Zod schema, creates record in database, dispatches `broadcastSocketEvent("{{MODULE_NAME_PLURAL}}:changed", { action: "CREATE", id: record.id })`, and returns HTTP 201.
2. **`[id]/route.ts`**:
   - `GET`: Returns the single record or 404.
   - `PUT`: Validates update payload, updates record, dispatches `broadcastSocketEvent("{{MODULE_NAME_PLURAL}}:changed", { action: "UPDATE", id })`.
   - `DELETE`: Verifies dependencies (restrict deletion if linked to other active records), deletes record, dispatches `broadcastSocketEvent("{{MODULE_NAME_PLURAL}}:changed", { action: "DELETE", id })`.

##### D. Socket Server Event Registry
1. Add `"{{MODULE_NAME_PLURAL}}:changed"` to `ServerToClientEvents` interface in `src/server/socket.ts`.
2. Add `"{{MODULE_NAME_PLURAL}}:changed"` to `AppBroadcastEvent` type in `src/lib/socket-notify.ts`.

##### E. Listing Page (`src/app/(admin)/{{MODULE_NAME_PLURAL}}`)
1. **`page.tsx`**: Server component loading metadata or initial data.
2. **`{{MODULE_NAME_SINGULAR}}Client.tsx`**: Client component:
   - Header: Clean title, descriptive subtitle, and ONLY the primary action button (`<Link href="/{{MODULE_NAME_PLURAL}}/form"><Plus /> Add {{MODULE_NAME_SINGULAR}}</Link>`). **DO NOT** add pill navigation links to other modules in the header.
   - TanStack DataTable using `useServerTable`:
     - Provide `socketEventName: "{{MODULE_NAME_PLURAL}}:changed"` for automatic zero-reload syncing.
     - Search input, CSV export, column filter, and action menus (View, Edit, Delete).
   - Auto-hiding pagination: DataTable automatically hides pagination when `totalPages <= 1` or `totalItems <= pageSize`.

##### F. 2-Column Split Master Form (`src/app/(admin)/{{MODULE_NAME_PLURAL}}/form/page.tsx`)
1. **Top Header**:
   - Left side: Back arrow button linking back to `/{{MODULE_NAME_PLURAL}}`, `<h1>{isEditMode ? "Edit {{MODULE_NAME_SINGULAR}}" : "Create {{MODULE_NAME_SINGULAR}}"}</h1>`, and auto-generated code rendered as **plain text** `*{autoCode}` (`text-slate-400 font-mono text-base font-semibold`). Do NOT use a pill badge.
   - Right side: Single `<Link href="/{{MODULE_NAME_PLURAL}}">Cancel</Link>` button.
   - **NO duplicate top submit button** and **NO keyboard shortcut badge** in the header.
2. **Form Layout (65% Left / 35% Right Grid)**:
   - Container class: `grid grid-cols-1 lg:grid-cols-12 gap-8 items-start`
   - **Left Column (`lg:col-span-8` - 65%)**:
     - Modern glass card with numbered steps (`01 IDENTIFICATION`, `02 DETAILS & CONFIGURATION`).
     - Clear input labels with red asterisk `*` for required fields.
     - Inline validation messages with `AlertCircle`.
     - Card Footer actions:
       - Create Mode: `Clear Form (F4)` button + `Create {{MODULE_NAME_SINGULAR}} (Ctrl+S)` primary submit button.
       - Edit Mode: `Cancel` button + `Save Changes (Ctrl+S)` primary submit button.
   - **Right Column (`lg:col-span-4` - 35%)**:
     - Sticky container (`sticky top-6 space-y-6`).
     - **Live Preview Card**: Real-time reactive card showing the name, code, status badge, and key attributes as the user types.
     - **Governance & Policy Card**: Explaining business rules, code format guidelines, and constraints.
3. **Keyboard Accessibility**:
   - Integrate `useFormKeyboardNavigation` on the `<form>` element (`Enter` to advance, `Arrows` to navigate vertical inputs).
   - Integrate `useKeyboardShortcuts` (`Ctrl+S` to submit, `Esc` to cancel/go back, `F4` to clear form).

##### G. Code Quality & Consistency
- Full-width layout (no restrictive `max-w` containers wrapping the page).
- Dark/Light theme token compatibility (`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`).
- Strict TypeScript: Ensure `npx tsc --noEmit` passes with 0 errors.
```

---

## 12. Quick Reference Comparison: Department vs. Role

| Architectural Feature | Department (`departments`) | Role (`roles`) | Your New Module Standard |
| :--- | :--- | :--- | :--- |
| **Model Primary Key** | UUID (`@default(uuid())`) | UUID (`@default(uuid())`) | UUID (`@default(uuid())`) |
| **Business Code/Slug** | `code` (e.g. `DEP001`) | `slug` (e.g. `role_001`) | `code` (e.g. `[PREFIX]001`) |
| **Header Code Display** | Plain text: `*DEP005` | Plain text: `*role_001` | Plain text: `*[CODE]` |
| **Header Actions** | Back Arrow + Cancel button | Back Arrow + Cancel button | Back Arrow + Cancel button |
| **Form Layout** | 65% Form / 35% Preview | 65% Form / 35% Preview | 65% Form / 35% Preview |
| **Footer Actions** | `Clear Form (F4)` + `Create (Ctrl+S)` | `Clear Form (F4)` + `Create (Ctrl+S)` | `Clear Form (F4)` + `Create (Ctrl+S)` |
| **Live Preview Card** | Reactive Dept card | Reactive Role card + permissions | Reactive Module card |
| **Table Header** | Single `+ Add Department` | Single `+ Add Role` | Single `+ Add [Module]` |
| **Auto-Hide Pagination** | Active (`totalPages <= 1`) | Active (`totalPages <= 1`) | Active (`totalPages <= 1`) |
| **Socket Notification** | `departments:changed` | `roles:changed` | `[module]:changed` |
| **Keyboard Navigation** | `Enter`, `↑/↓`, `Ctrl+S`, `Esc`, `F4` | `Enter`, `↑/↓`, `Ctrl+S`, `Esc`, `F4` | `Enter`, `↑/↓`, `Ctrl+S`, `Esc`, `F4` |

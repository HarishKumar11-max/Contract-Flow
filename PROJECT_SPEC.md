# PROJECT_SPEC.md — Contract Lifecycle Management (CLM)

> **Status:** APPROVED  
> **Source of Truth:** This specification governs the architecture, data models, role-based access rules, security guidelines, and safety practices for all phases of development. Re-read this document at the start of each phase.

---

## 1. Approved Technology Stack

- **Backend:**
  - Node.js (v24 LTS)
  - Express.js with TypeScript
  - Mongoose (MongoDB ODM)
  - Zod (Schema validation for HTTP requests)
  - Multer (Document upload management)
  - `node-cron` (Scheduled tasks for renewal notifications & compliance sweeps)
  - `pdfkit` & `json2csv` (Document & report generation)
  - `mongodb-memory-server` (Zero-setup embedded database fallback if external MongoDB is unavailable)
  - Vitest + Supertest (Backend API testing)

- **Frontend:**
  - React 19 / 18 with TypeScript
  - Vite (Build tool & development server)
  - Tailwind CSS (Utility-first styling with modern Blue & Slate SaaS theme)
  - Lucide React (Iconography)
  - React Router v6 (Client-side routing)
  - Vitest + React Testing Library (Frontend unit & component testing)

---

## 2. System Architecture

```
contract-lifecycle-management/
├── package.json                         # Root package scripts (concurrent dev/test/build)
├── PROJECT_SPEC.md                      # This specification
├── README.md                            # Project documentation
├── client/                              # Vite + React + TS Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/                  # Common, layout, domain-specific UI components
│   │   ├── context/                     # Auth, Notification, and Theme contexts
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── pages/                       # Application page views
│   │   ├── services/                    # API service layers
│   │   ├── types/                       # Shared frontend interfaces
│   │   ├── utils/                       # Date/currency formatters & helpers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── server/                              # Express + TS Backend
    ├── src/
    │   ├── config/                      # Database, environment, and constants
    │   ├── controllers/                 # Route handler logic
    │   ├── middleware/                  # Auth, RBAC, error handling, audit logging
    │   ├── models/                      # Mongoose data schemas
    │   ├── routes/                      # API endpoint definitions
    │   ├── services/                    # State machine, cron jobs, notifications, reports
    │   ├── utils/                       # JWT, logging, seeding, response formatting
    │   ├── types/                       # Backend TypeScript definitions
    │   ├── app.ts                       # Express app configuration
    │   └── server.ts                    # Server bootstrapping & DB initialization
    ├── uploads/                         # Contract files storage (.gitignored)
    ├── tests/                           # Integration and unit tests
    ├── package.json
    └── tsconfig.json
```

---

## 3. Data Models & Entity Definitions

### 3.1 User (`users`)
- `_id`: ObjectId
- `name`: String (required)
- `email`: String (unique, indexed, required)
- `passwordHash`: String (bcrypt hash, required)
- `role`: Enum `['Admin', 'Legal', 'Procurement', 'Finance', 'Approver', 'Viewer']`
- `department`: String
- `isActive`: Boolean (default: true)
- `avatarUrl`: String (optional)
- `createdAt`, `updatedAt`: Timestamps

### 3.2 Vendor (`vendors`)
- `_id`: ObjectId
- `name`: String (required, indexed)
- `code`: String (unique, required, e.g. `VEND-2026-001`)
- `category`: Enum `['Software/SaaS', 'Hardware', 'Professional Services', 'Consulting', 'Logistics', 'Other']`
- `contactPerson`: { name: String, email: String, phone: String }
- `address`: { street: String, city: String, state: String, country: String, postalCode: String }
- `taxId`: String
- `status`: Enum `['Active', 'Under Review', 'Suspended', 'Terminated']`
- `performanceRating`: Number (1.0 to 5.0, default: 3.0)
- `riskScore`: Enum `['Low', 'Medium', 'High', 'Critical']` (default: 'Low')
- `notes`: String
- `createdBy`: ObjectId (ref: User)
- `createdAt`, `updatedAt`: Timestamps

### 3.3 Contract (`contracts`)
- `_id`: ObjectId
- `contractNumber`: String (unique, auto-generated, e.g. `CTR-2026-0001`)
- `title`: String (required)
- `description`: String
- `type`: Enum `['MSA', 'NDA', 'SOW', 'SLA', 'Vendor Agreement', 'Employment', 'License', 'Other']`
- `vendorId`: ObjectId (ref: Vendor, required, indexed)
- `status`: Enum `['Draft', 'In Review', 'Pending Approval', 'Approved', 'Active', 'Expiring Soon', 'Expired', 'Terminated', 'Rejected', 'Amended']`
- `value`: Number (required, >= 0)
- `currency`: String (default: 'USD')
- `startDate`: Date (required)
- `endDate`: Date (required)
- `renewalType`: Enum `['Auto-Renew', 'Manual Review', 'Do Not Renew']`
- `renewalNoticeDays`: Number (default: 30)
- `autoRenewTermMonths`: Number (optional)
- `ownerId`: ObjectId (ref: User, required)
- `department`: String (required)
- `documents`: Array of:
  - `docId`: String (UUID)
  - `fileName`: String
  - `originalName`: String
  - `filePath`: String
  - `fileSize`: Number
  - `mimeType`: String
  - `version`: Number
  - `uploadedBy`: ObjectId (ref: User)
  - `uploadedAt`: Date
  - `notes`: String
- `currentVersion`: Number (default: 1)
- `complianceItems`: Array of:
  - `id`: String (UUID)
  - `title`: String
  - `description`: String
  - `status`: Enum `['Compliant', 'Non-Compliant', 'Pending Review']`
  - `dueDate`: Date
  - `verifiedBy`: ObjectId (ref: User)
  - `verifiedAt`: Date
- `tags`: Array of String
- `createdAt`, `updatedAt`: Timestamps

### 3.4 ApprovalWorkflow (`approval_workflows`)
- `_id`: ObjectId
- `contractId`: ObjectId (ref: Contract, required, indexed)
- `currentStepIndex`: Number (default: 0)
- `status`: Enum `['In Progress', 'Approved', 'Rejected']`
- `steps`: Array of:
  - `stepNumber`: Number
  - `roleRequired`: Enum `['Legal', 'Finance', 'Procurement', 'Admin', 'Approver']`
  - `assignedTo`: ObjectId (ref: User, optional)
  - `status`: Enum `['Pending', 'Approved', 'Rejected', 'Skipped']`
  - `comments`: String
  - `actionDate`: Date
  - `actedBy`: ObjectId (ref: User)
- `initiatedBy`: ObjectId (ref: User)
- `createdAt`, `updatedAt`: Timestamps

### 3.5 Notification (`notifications`)
- `_id`: ObjectId
- `recipientId`: ObjectId (ref: User, required, indexed)
- `type`: Enum `['Renewal Reminder', 'Expiry Warning', 'Approval Request', 'Approval Decision', 'Contract Status Change', 'Compliance Alert']`
- `title`: String (required)
- `message`: String (required)
- `contractId`: ObjectId (ref: Contract, optional)
- `isRead`: Boolean (default: false)
- `readAt`: Date
- `createdAt`: Date (default: Date.now)

### 3.6 AuditLog (`audit_logs`)
- `_id`: ObjectId
- `userId`: ObjectId (ref: User)
- `userEmail`: String
- `userRole`: String
- `action`: Enum `['CREATE', 'UPDATE', 'DELETE', 'STATUS_TRANSITION', 'DOCUMENT_UPLOAD', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'ACCESS_DENIED']`
- `entityType`: Enum `['Contract', 'Vendor', 'Approval', 'User', 'System']`
- `entityId`: String
- `changes`: { before: Object, after: Object }
- `ipAddress`: String
- `userAgent`: String
- `timestamp`: Date (default: Date.now)

---

## 4. Contract State Machine

Valid transitions:
- `Draft` -> `In Review`
- `In Review` -> `Draft` (returned with feedback)
- `In Review` -> `Pending Approval`
- `Pending Approval` -> `Approved` (all required steps approved)
- `Pending Approval` -> `Rejected` (any approver rejects)
- `Rejected` -> `Draft` (revised)
- `Approved` -> `Active` (effective date or explicit activation)
- `Active` -> `Expiring Soon` (current date >= endDate - renewalNoticeDays)
- `Expiring Soon` -> `Active` (auto-renewed or renewed manually)
- `Expiring Soon` -> `Expired` (current date > endDate)
- `Active` -> `Terminated` (early termination)
- `Active` -> `Amended` (formal amendment created)
- `Amended` -> `In Review`

Any attempt to execute an invalid transition must be rejected with HTTP 400 and a descriptive validation error.

---

## 5. Role-Permission Matrix (Deny-by-Default)

| Capability / Module | Admin | Procurement | Legal | Finance | Approver | Viewer / Auditor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Users & Roles** | Full CRUD | Denied | Denied | Denied | Denied | Denied |
| **Contracts: Create** | Yes | Yes (Draft) | Denied | Denied | Denied | Denied |
| **Contracts: Edit** | Full | Own only (Draft/Rejected) | Denied | Denied | Denied | Denied |
| **Contracts: Delete** | Full (Draft) | Own only (Draft) | Denied | Denied | Denied | Denied |
| **Contracts: View** | All | Own (Draft/Rejected) | All | All | Assigned | All (Read-only) |
| **Documents: Upload/Delete**| Full | Own contracts | Denied | Denied | Denied | Denied |
| **Documents: View/Download**| Full | Own contracts | Read | Read | Read | Read |
| **Vendors: Create / Edit** | Full | Yes (No blacklist) | Denied | Denied | Denied | Denied |
| **Vendors: Blacklist/Delete**| Full | Denied | Denied | Denied | Denied | Denied |
| **Vendors: View** | Full | Full | Denied | Read | Denied | Read |
| **Compliance: Create/Update**| Full | Denied | Full | Denied | Denied | Denied |
| **Compliance: View/Radar** | Full | Read | Read | Read | Denied | Read |
| **Approvals: Submit** | Full | Own contracts | Denied | Denied | Denied | Denied |
| **Approvals: Sign-Off** | Override/All | Denied | Tier 1/2/3 Legal | Tier 2/3 Finance | Tier 3 Approver | Denied |
| **Reports: View Analytics** | Full | Own scope | Own scope | Financial scope | Own scope | Denied |
| **Reports: Export (CSV/PDF)**| Full | Own contracts | Own scope | Financial scope | Own decisions | Denied |
| **Audit Logs: View** | Full | Denied | Denied | Denied | Denied | Read-only |
| **Audit Logs: Export** | Full | Denied | Denied | Denied | Denied | Denied |
| **Settings & Reminder Jobs** | Full | Denied | Denied | Denied | Denied | Denied |

---

## 6. Security & Safety Rules

1. **Authentication:**
   - Passwords must be hashed using `bcryptjs` with salt rounds >= 10.
   - JWT tokens must have a signed expiration (e.g. 7 days) and include `userId` and `role`.
   - All protected routes must verify the JWT token via `auth.middleware`.
2. **Authorization (RBAC):**
   - Access to sensitive operations must be guarded by `authorizeRoles(...)` middleware checking the role matrix.
   - Never trust role information passed in request bodies; read user role exclusively from verified JWT payload.
3. **Data Integrity & Validation:**
   - All incoming request bodies must be validated with Zod schemas.
   - IDs must be validated as valid MongoDB ObjectIds before database queries.
   - Deletion of non-draft contracts is strictly prohibited to preserve legal audit trails.
4. **Audit Logging:**
   - All state transitions, approvals, rejections, user creations, and document uploads must create an immutable `AuditLog` entry.
5. **Document Upload Safety:**
   - Only allow safe document mime types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx), `application/msword` (doc).
   - Maximum upload size restricted to 25MB per file.
   - File names must be sanitized and stored using unique UUIDs to prevent directory traversal or collision.
6. **Visual Standards:**
   - Clean, modern SaaS appearance.
   - Blue and slate palette (`bg-slate-50`, `text-slate-900`, `bg-blue-600`, `text-blue-600`, `border-slate-200`).
   - Inter font family, rounded cards (`rounded-xl`), subtle shadows (`shadow-sm`, `shadow-md`), clear visual hierarchy. No generic or unstyled components.

---

## 7. Development Phases & Completion Status

| Phase | Milestone Name | Status | Test Coverage |
| :---: | :--- | :---: | :---: |
| **Phase 1** | Foundation, Security & Authentication Architecture | ✅ Complete | Auth & Health test suites |
| **Phase 2** | User Administration & Role-Based Access Control | ✅ Complete | User management tests |
| **Phase 3** | Vendor Governance & Risk Evaluation Registry | ✅ Complete | Vendor registry tests |
| **Phase 4** | Contract Lifecycle Management & Finite State Machine | ✅ Complete | State machine & document tests |
| **Phase 5** | Multi-Tier Approval Matrix & Workflow Delegation | ✅ Complete | 3-tier approvals test suite |
| **Phase 6** | Expiry Radar, Continuous Monitoring & Alerts | ✅ Complete | Radar & notifications test suite |
| **Alignment** | Role Alignment Pass (Deny-by-default, 6-role RBAC, Settings) | ✅ Complete | 57 RBAC matrix tests |
| **Phase 7** | Executive Reports, Analytics Export & Audit Log Governance | ✅ Complete | 23 Reports & Audit tests |

**Overall Test Suite Status:** 161 Tests Passing (157 Server + 4 Client) — 100% Pass Rate.


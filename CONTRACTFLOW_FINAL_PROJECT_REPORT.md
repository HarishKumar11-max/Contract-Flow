# CONTRACT LIFECYCLE MANAGEMENT PLATFORM
### A PROJECT REPORT
**Submitted by**  
**HARISH KUMAR V (310624205079)**  

*in partial fulfilment for the award of the Degree of*  
**BACHELOR OF TECHNOLOGY**  
*in*  
**INFORMATION TECHNOLOGY**  

**FULL STACK DEVELOPMENT - 2311CSC503R**  
**EASWARI ENGINEERING COLLEGE, RAMAPURAM**  
*(AN AUTONOMOUS INSTITUTION) – AFFILIATED TO ANNA UNIVERSITY, CHENNAI*  
**OCTOBER 2026**

---

### EASWARI ENGINEERING COLLEGE
#### BONAFIDE CERTIFICATE

Certified that this project report titled **“CONTRACT LIFECYCLE MANAGEMENT PLATFORM”** is the Bonafide work of **“HARISH KUMAR V (310624205079)”**, who carried out the project work under my supervision.

| SIGNATURE | SIGNATURE |
| :--- | :--- |
| **Dr. N. Ananthi, M.E., Ph.D.** | **Ms. Grandhi Sai Lakshmi** |
| **HEAD OF THE DEPARTMENT** | **SUPERVISOR** |
| Information Technology | Information Technology |
| Easwari Engineering College | Easwari Engineering College |
| Ramapuram, Chennai. | Ramapuram, Chennai. |

---

### EASWARI ENGINEERING COLLEGE
#### Certificate of Viva-voce-Examination

This is to certify that the Viva Voce Examination of the Project Work entitled **“CONTRACT LIFECYCLE MANAGEMENT PLATFORM”** submitted by **Mr. HARISH KUMAR V (Reg. No. 310624205079)** in partial fulfilment of the requirements for the award of the degree of **BACHELOR OF TECHNOLOGY** was conducted on ______________ (Date) in the Department of **INFORMATION TECHNOLOGY**, Easwari Engineering College, Ramapuram – Chennai.

| INTERNAL EXAMINER | EXTERNAL EXAMINER |
| :--- | :--- |
| Name : | Name : |
| Designation : | Designation : |
| Address : | Address : |

**Date:**

---

### ABSTRACT

Contracts decide how much an organisation pays, what it receives and what it is liable for, yet many organisations still manage them through spreadsheets, e-mail and shared folders. This leads to missed renewals, uncontrolled high-value commitments, fragmented vendor information and audits that cannot show who authorised what. This project presents **ContractFlow**, an enterprise Contract Lifecycle Management platform built on the MERN stack (MongoDB, Express.js, React and Node.js) with TypeScript on both the client and the server.

The platform manages contracts through a ten-state lifecycle state machine that rejects invalid transitions. A submitted contract is routed for approval according to its value through one, two or three sequential approval stages, with mandatory comments on rejection and a complete approval history. A `node-cron` expiry radar runs every night, sends expiry and renewal reminders and moves contracts to the Expiring Soon and Expired states. The system also provides vendor management with risk tiers and performance scorecards, compliance requirement tracking, document management with validated uploads, in-app and e-mail notifications, role-scoped reports exported as PDF and CSV, and an immutable audit log that stores before and after values.

Access is controlled by a deny-by-default role-based access control model with six roles, in which only the Administrator has full access. Permissions are kept in one central configuration that is enforced by the server and mirrored in the user interface. Passwords are stored as bcrypt hashes, sessions use JSON Web Tokens, and all input is validated with Zod. The application is verified by 161 automated tests that all pass. The platform replaces manual contract tracking with a governed, auditable and automated process and can be extended with e-signature, AI-assisted clause extraction and ERP integration.

**KEYWORDS:** Contract Lifecycle Management, MERN stack, role-based access control, approval workflow, audit trail, expiry reminders, vendor management.

---

### ACKNOWLEDGEMENT

We express our sincere gratitude to the Principal **Dr. P. Deiva Sundari, M.E., Ph.D.**, and the Management of our college for providing us with the opportunity to carry out this project work.

We convey our heartfelt thanks to the Head of the Department, **Dr. N. Ananthi, M.E., Ph.D.**, Department of **INFORMATION TECHNOLOGY**, for the continuous encouragement and support.

We are extremely thankful to our Project Guide, **Ms. Grandhi Sai Lakshmi**, Department of **INFORMATION TECHNOLOGY**, for valuable guidance, suggestions and motivation throughout the completion of this project.

We would also like to extend our gratitude to all the faculty members of the Department of **INFORMATION TECHNOLOGY** for their support.

Finally, we thank our parents and friends for their constant encouragement and help during the course of this project.

---

### TABLE OF CONTENTS

| CHAPTER NO. | TITLE | PAGE No. |
| :---: | :--- | :---: |
| | **ABSTRACT** | iv |
| | **ACKNOWLEDGEMENT** | v |
| | **LIST OF TABLES** | viii |
| | **LIST OF FIGURES** | ix |
| | **LIST OF ABBREVIATIONS** | x |
| **1** | **INTRODUCTION** | **1** |
| | 1.1 OVERVIEW | 1 |
| | 1.2 PROBLEM DEFINITION | 1 |
| | 1.3 OBJECTIVE | 2 |
| | 1.4 SCOPE OF THE PROJECT | 3 |
| | 1.5 MOTIVATION | 3 |
| **2** | **RELATED WORK** | **4** |
| | 2.1 LITERATURE REVIEW | 4 |
| | 2.2 EXISTING SYSTEM | 5 |
| | 2.3 PROPOSED SYSTEM | 6 |
| **3** | **SYSTEM ANALYSIS** | **8** |
| | 3.1 SYSTEM REQUIREMENTS | 8 |
| | 3.1.1 FUNCTIONAL REQUIREMENTS | 8 |
| | 3.1.2 NON-FUNCTIONAL REQUIREMENTS | 9 |
| | 3.2 SOFTWARE AND HARDWARE REQUIREMENTS | 9 |
| | 3.2.1 SOFTWARE REQUIREMENTS | 9 |
| | 3.2.2 HARDWARE REQUIREMENTS | 10 |
| **4** | **SYSTEM DESIGN** | **11** |
| | 4.1 SYSTEM ARCHITECTURE | 11 |
| | 4.2 USER ROLES | 12 |
| | 4.3 MODULE DESCRIPTION | 13 |
| | 4.4 DATABASE DESIGN | 13 |
| | 4.5 CLASS DIAGRAM | 15 |
| | 4.6 SEQUENCE DIAGRAM | 16 |
| | 4.7 CONTRACT LIFECYCLE STATE MACHINE | 18 |
| **5** | **IMPLEMENTATION** | **19** |
| | 5.1 IMPLEMENTATION OVERVIEW | 19 |
| | 5.2 KEY FUNCTIONS (CODE EXPLANATION) | 20 |
| | 5.2.1 Role-Based Access Control | 20 |
| | 5.2.2 Contract State Machine | 22 |
| | 5.2.3 Value-Based Approval Routing | 22 |
| | 5.2.4 Automated Expiry and Renewal Radar | 23 |
| | 5.2.5 Immutable Audit Logging | 24 |
| | 5.3 TESTING AND RESULTS | 24 |
| **6** | **CONCLUSION & FUTURE WORK** | **26** |
| | 6.1 CONCLUSION | 26 |
| | 6.2 FUTURE ENHANCEMENTS | 26 |
| **APPENDIX A** | **PROJECT DIRECTORY AND CONFIGURATION** | **28** |
| **APPENDIX B** | **SELECTED SOURCE CODE SNIPPETS** | **30** |
| **APPENDIX C** | **DEPENDENCIES AND DEVELOPMENT TOOLS** | **42** |
| | **SCREENSHOTS OF THE PROJECT** | **44** |
| | **REFERENCES** | **48** |

---

### LIST OF TABLES

| TABLE NO. | TITLE | PAGE No. |
| :---: | :--- | :---: |
| 2.1 | INFERENCE OF LITERATURE REVIEW | 4 |
| 2.2 | COMPARISON OF EXISTING AND PROPOSED SYSTEM | 6 |
| 3.1 | SOFTWARE REQUIREMENTS | 9 |
| 3.2 | HARDWARE REQUIREMENTS | 10 |
| 4.1 | USER ROLES IN THE SYSTEM | 12 |
| 4.2 | MODULE DESCRIPTION | 13 |
| 4.3 | DATABASE COLLECTIONS AND INDEXES | 14 |
| 4.4 | CONTRACT LIFECYCLE STATES | 18 |
| 5.1 | REST API ENDPOINTS | 19 |
| 5.2 | ROLE-BASED ACCESS MATRIX | 21 |
| 5.3 | APPROVAL TIERS AND ROUTES | 23 |
| 5.4 | AUTOMATED TEST SUITES | 24 |
| A.1 | ENVIRONMENT CONFIGURATION | 29 |
| C.1 | DECLARED DEPENDENCIES | 42 |

---

### LIST OF FIGURES

| FIGURE NO. | TITLE | PAGE No. |
| :---: | :--- | :---: |
| 4.1 | SYSTEM ARCHITECTURE | 11 |
| 4.2 | DATABASE ER DIAGRAM | 15 |
| 4.3 | CLASS DIAGRAM | 16 |
| 4.4 | SEQUENCE DIAGRAM – CONTRACT SUBMISSION AND APPROVAL | 17 |
| 4.5 | SEQUENCE DIAGRAM – USER LOGIN AND DASHBOARD | 17 |
| 4.6 | CONTRACT LIFECYCLE STATE MACHINE | 18 |
| A.1 | PROJECT DIRECTORY STRUCTURE | 28 |
| S.1 | DASHBOARD OF THE CONTRACTFLOW PLATFORM | 44 |
| S.2 | CONTRACT REGISTRY WITH SEARCH AND FILTERS | 44 |
| S.3 | APPROVAL QUEUE AND APPROVAL HISTORY | 45 |
| S.4 | VENDOR REGISTRY AND PERFORMANCE SCORECARD | 45 |
| S.5 | AUDIT LOG VIEWER WITH STATE-DIFF MODAL | 46 |
| S.6 | ROLE-BASED ACCESS DENIED PAGE | 46 |

---

### LIST OF ABBREVIATIONS

| ABBREVIATION | FULL FORM |
| :--- | :--- |
| API | APPLICATION PROGRAMMING INTERFACE |
| CLM | CONTRACT LIFECYCLE MANAGEMENT |
| CORS | CROSS-ORIGIN RESOURCE SHARING |
| CRM | CUSTOMER RELATIONSHIP MANAGEMENT |
| CRUD | CREATE, READ, UPDATE, DELETE |
| CSV | COMMA-SEPARATED VALUES |
| DB | DATABASE |
| ER | ENTITY-RELATIONSHIP |
| ERP | ENTERPRISE RESOURCE PLANNING |
| HTTP / HTTPS | HYPERTEXT TRANSFER PROTOCOL (SECURE) |
| JSON | JAVASCRIPT OBJECT NOTATION |
| JWT | JSON WEB TOKEN |
| KPI | KEY PERFORMANCE INDICATOR |
| MERN | MONGODB, EXPRESS.JS, REACT, NODE.JS |
| MIME | MULTIPURPOSE INTERNET MAIL EXTENSIONS |
| NDA | NON-DISCLOSURE AGREEMENT |
| ODM | OBJECT DOCUMENT MAPPER |
| OCR | OPTICAL CHARACTER RECOGNITION |
| PDF | PORTABLE DOCUMENT FORMAT |
| RBAC | ROLE-BASED ACCESS CONTROL |
| REST | REPRESENTATIONAL STATE TRANSFER |
| SLA | SERVICE LEVEL AGREEMENT |
| SMTP | SIMPLE MAIL TRANSFER PROTOCOL |
| SPA | SINGLE PAGE APPLICATION |
| UI | USER INTERFACE |
| UUID | UNIVERSALLY UNIQUE IDENTIFIER |

---

## CHAPTER 1: INTRODUCTION

### 1.1 OVERVIEW
Contracts are the legal backbone of every commercial relationship. Supplier agreements, service contracts, licences, non-disclosure agreements and employment-related agreements decide how much an organisation pays, what it receives, how long it is bound and what it is liable for. Despite this importance, a large number of organisations still manage contracts through paper files, spreadsheets, e-mail threads and shared folders. Research on electronic contract systems notes that such manual contracting is inefficient, costly and time consuming because there is no standardised process to follow and no convenient way to access and manage the relevant documents [1].

Contract Lifecycle Management (CLM) addresses this problem by managing a contract from its first request, through drafting, review, approval and execution, to monitoring, renewal or termination [1][2]. A good CLM system makes each of these stages repeatable, visible and auditable, so that contracts are approved by the right people before they are signed and are not forgotten after they become active.

The ContractFlow platform developed in this project is an enterprise Contract Lifecycle Management web application. It provides a dashboard with contract statistics and upcoming deadlines, complete contract and document management, vendor management with performance tracking, value-based multi-tier approval workflows, automated expiry and renewal reminders, compliance requirement tracking, notifications, reports and an immutable audit history. Access is controlled by a deny-by-default role-based access control model with six roles, in which only the Administrator has full access to the system. The application is built entirely with the MERN stack, namely MongoDB, Express.js, React and Node.js, using TypeScript on both the client and the server.

### 1.2 PROBLEM DEFINITION
Organisations that manage contracts without a dedicated system face the following problems:
- **Missed expiries and renewals:** contracts that renew automatically can bind the organisation to unwanted multi-year obligations because nobody is alerted in time.
- **Uncontrolled commitments:** high-value agreements may be signed by e-mail without proper financial or legal vetting, because there is no enforced approval route.
- **Fragmented vendor oversight:** there is no single place to evaluate vendor risk, track ratings or see the total value committed to a vendor.
- **Compliance and audit blind spots:** it is difficult to prove who authorised a contract, who changed it and when, which makes internal and external audits slow and uncertain.
- **Scattered documents:** contract files, amendments and supporting evidence are spread across personal folders and mailboxes, with no version history.
- **No role discipline:** everyone with access to a shared drive can usually see or change everything, which violates the principle of least privilege.

The problem addressed by this project is therefore: to design and develop a secure web-based platform that manages the complete contract lifecycle, enforces value-based approval workflows and role-based access, automates expiry and renewal reminders, tracks compliance and vendor performance, and keeps an immutable audit history of every important action.

### 1.3 OBJECTIVE
The main objective of the project is to build a secure, auditable and automated Contract Lifecycle Management platform on the MERN stack that replaces spreadsheets and e-mail with a governed workflow. The specific objectives are:
1. To provide a dashboard that shows contract statistics, charts and upcoming deadlines adapted to the role of the logged-in user.
2. To support creation, editing, soft deletion, search, filtering and document management of contracts, controlled by a ten-state lifecycle state machine.
3. To manage vendors with categories, risk tiers and performance scorecards, and link every vendor to its contracts and financial exposure.
4. To implement role-based authentication and authorisation for six roles using a single central permission configuration enforced on the server and mirrored in the user interface.
5. To route contracts for approval according to their value through one, two or three sequential approval stages, with mandatory comments on rejection and a full approval history.
6. To run an automated daily expiry radar that sends renewal and expiry reminders and moves contracts to the Expiring Soon and Expired states.
7. To track compliance requirements per contract and to provide notifications, exportable reports (PDF and CSV) and an immutable audit trail with before and after values.

### 1.4 SCOPE OF THE PROJECT
The scope of the project covers the design, implementation, testing and demonstration of a complete working web application for contract lifecycle management inside an organisation. The system:
- Covers contracts of any type, such as service agreements, supplier contracts, licences and non-disclosure agreements, together with their vendors, documents, approvals and compliance requirements.
- Provides six role-specific workspaces (Administrator, Procurement, Legal, Finance, Approver and Viewer/Auditor), each with its own menu, dashboard and permissions.
- Runs in any modern web browser on desktops, tablets and smartphones through a responsive interface with light and dark themes.
- Can run against a local MongoDB server, MongoDB Atlas or an automatically started in-memory database, so that it can be demonstrated without any set-up.

The following are outside the present scope: legally binding electronic signatures, automatic extraction of clauses from scanned documents with artificial intelligence, and integration with external ERP or CRM systems. These are listed as future enhancements in Chapter 6.

### 1.5 MOTIVATION
The motivation for this project came from the gap between how important contracts are and how casually they are often managed. A missed renewal date or an unapproved high-value agreement can cost an organisation far more than the effort needed to prevent it, and yet the controls that prevent it, namely routing, reminders and audit trails, are easy to automate.

Technically, the project gave an opportunity to apply the full life cycle of modern web development in one system: designing a document database, building a secure and validated REST API with Node.js and Express.js, implementing role-based access control and a finite state machine, scheduling background jobs, generating reports and building a responsive React interface in TypeScript.

---

## CHAPTER 2: RELATED WORK

### 2.1 LITERATURE REVIEW
Contract management has been studied as an enterprise software problem, as a business process and compliance problem, and as a user-experience problem. Five works that are closely related to this project are summarised in Table 2.1.

**Table 2.1 Inference of Literature Review**
| S.No | Author(s) and Year | Work and Focus | Inference for this Project |
| :---: | :--- | :--- | :--- |
| 1 | Chieu, Nguyen, Maradugu and Kwok (2007) [1] | IBM research report proposing a service-oriented electronic contract system. | Routing, role-based security, notifications and a central repository with standard contract metadata are essential building blocks. |
| 2 | Nguyen (2013) [2] | Thesis on implementing customer contract management in an oilfield services company. | Compliance and visibility over contractual obligations drive the need for CLM, motivating compliance and audit modules. |
| 3 | Ahmad (2023) [3] | Research on collaborative features for a CLM tool using focus groups and usability tests. | The interface must be role-focused, and routine work such as reminders and approval routing must be automated. |
| 4 | Bradach (2021) [4] | Experimental comparison of MERN, MEAN and LAMP web development stacks. | The MERN stack performs well and offers a single language (JavaScript/TypeScript) from database to interface. |
| 5 | Ferraiolo, Sandhu, Gavrila, Kuhn and Chandramouli (2001) [5] | Proposed NIST standard for role-based access control. | A central role-to-permission map with least privilege and separation of duties is the standard model for security. |

### 2.2 EXISTING SYSTEM
At present, organisations that do not use a dedicated CLM platform rely on spreadsheets and shared folders, e-mail-based approvals, and paper-based processes. These approaches suffer from missed renewal dates, unenforceable approval routes, fragmented vendor oversight, absence of audit trails, and coarse folder-level access control.

### 2.3 PROPOSED SYSTEM
The proposed system, **ContractFlow**, is a MERN-stack web application that manages the whole contract lifecycle in one governed platform. A React and TypeScript single-page application communicates with an Express.js REST API, which validates every request, checks user permissions and stores data in MongoDB.

**Table 2.2 Comparison of Existing and Proposed System**
| Parameter | Existing Approaches | Proposed System |
| :--- | :--- | :--- |
| Contract storage | Files in shared folders and mailboxes | Central database with documents, versions and metadata |
| Approval | E-mail or paper, not enforced | Value-based sequential approval enforced by the server |
| Expiry and renewal | Manual date watching | Automatic daily radar with reminders and status changes |
| Vendor oversight | Separate lists, no scoring | Vendor registry with risk tiers and performance scores |
| Compliance | Checklists kept separately | Per-contract compliance requirements with due dates |
| Access control | Folder-level, coarse | Deny-by-default RBAC with six roles and record-level rules |
| Audit trail | None or editable | Immutable audit log with before and after values |
| Reports | Manual spreadsheets | One-click PDF and CSV exports scoped by role |
| Cost and setup | Paper cost or commercial licences | Open-source tools; runs locally or on small cloud instances |

---

## CHAPTER 3: SYSTEM ANALYSIS

### 3.1 SYSTEM REQUIREMENTS
#### 3.1.1 FUNCTIONAL REQUIREMENTS
- **Authentication:** Administrator-created users log in, log out and receive JWT tokens; failed attempts are audited.
- **Role-based access:** Grants each of the six roles only explicit modules and actions; returns 403 on denied attempts.
- **Contract management:** Creation, editing, viewing, searching, filtering, and soft deletion of contracts with auto-generated IDs (`CTR-2026-XXXX`).
- **Lifecycle control:** Moves a contract strictly through permitted transitions of the 10-state lifecycle.
- **Document management:** Validated file uploads (PDF/DOCX, 25MB limit), stored under sanitized UUID names.
- **Vendor management:** Registry tracking category, risk tier (Low, Medium, High, Critical), status and reviews.
- **Approval workflow:** Routes submitted contracts through Tier 1, 2 or 3 approval stages based on value thresholds.
- **Reminders & Expiry Radar:** Automated daily midnight sweeps transitioning nearing contracts to Expiring Soon and Expired.
- **Compliance, notifications and reports:** In-app notification center, simulated SMTP dispatch, and PDF/CSV export.
- **Audit:** Immutable forensic logging recording user, role, IP, entity, action, and before/after JSON diffs.

#### 3.1.2 NON-FUNCTIONAL REQUIREMENTS
- **Security:** Passwords hashed with bcrypt (salt rounds >= 10), JWT token expiration, and runtime Zod validation.
- **Usability:** Responsive SaaS layout using Tailwind CSS with role-tailored dashboards and navigation.
- **Performance:** Indexed database queries, server-side pagination, and sub-second Vite HMR.
- **Maintainability:** Modular architecture with central permission matrix and separation of concerns.

### 3.2 SOFTWARE AND HARDWARE REQUIREMENTS
**Table 3.1 Software Requirements**
| Component | Description |
| :--- | :--- |
| Operating system | Windows 10/11, Linux, macOS |
| Runtime | Node.js (v24 LTS) with npm |
| Database | MongoDB (local, MongoDB Atlas, or embedded MongoMemoryServer fallback) with Mongoose ODM |
| Back-end framework | Express.js with TypeScript, Zod, Multer, node-cron, jsonwebtoken, bcryptjs, pdfkit, json2csv |
| Front-end framework | React 18/19 with TypeScript, Vite, React Router v6, Tailwind CSS, Lucide React |
| Testing tools | Vitest, Supertest, React Testing Library |
| Development tools | Google Antigravity IDE, Visual Studio Code, Git |

**Table 3.2 Hardware Requirements**
| Item | Minimum | Recommended |
| :--- | :--- | :--- |
| Processor | Dual-core, 2.0 GHz (Intel Core i3) | Quad-core, 2.5 GHz or higher (Intel Core i5 / Ryzen 5) |
| RAM | 4 GB | 8 GB or more |
| Storage | 5 GB free disk space | 256 GB SSD with 10 GB free |
| Display | 1366 x 768 resolution | Full HD (1920 x 1080) |

---

## CHAPTER 4: SYSTEM DESIGN

### 4.1 SYSTEM ARCHITECTURE
The system follows a three-tier architecture separating presentation, application, and data tiers. React with TypeScript forms the presentation tier, Express.js with TypeScript forms the application tier, and MongoDB with file storage forms the data tier.

### 4.2 USER ROLES
**Table 4.1 User Roles in the System**
| Role | Responsibility | Key Access |
| :--- | :--- | :--- |
| **Admin** | System owner | Full access to every module: User Management, Settings, Reminder Jobs, Audit Logs. |
| **Procurement** | Drafts contracts & vendors | Creates/edits own contracts in Draft/Rejected, uploads documents, creates vendors, submits for approval. |
| **Legal** | Legal sign-off & compliance | Reads all contracts, manages compliance requirements, performs Tier 1, 2, 3 Legal approval. |
| **Finance** | Financial vetting | Reads all contracts and values, reads vendors, performs Tier 2 and Tier 3 Finance sign-off. |
| **Approver** | Executive sign-off | Performs final Tier 3 sign-off on contracts > $100K, views own approval metrics. |
| **Viewer / Auditor** | Independent oversight | Strictly read-only access to Contracts, Vendors, Compliance, and Audit Logs (no export). |

### 4.3 MODULE DESCRIPTION
**Table 4.2 Module Description**
| No. | Module | Description | Key Technologies |
| :---: | :--- | :--- | :--- |
| 1 | Authentication & RBAC | Login, logout, JWT token verification, central permission map enforcement. | JWT, bcryptjs, authorize middleware |
| 2 | Contract Management | CRUD, search, filters, pagination, 10-state lifecycle engine. | Express.js, Mongoose, StateMachine |
| 3 | Document Management | Validated file upload (25MB limit), UUID naming, download. | Multer, UUID |
| 4 | Vendor Management | Vendor directory, risk classification, performance scorecards. | Mongoose, React |
| 5 | Approval Workflow | Sequential 3-tier routing by contract value, mandatory comments. | Service layer, Zod |
| 6 | Expiry Radar | Automated midnight background sweeps, status transitions. | node-cron |
| 7 | Compliance Tracking | Contract compliance items, verification status, due dates. | Mongoose, React |
| 8 | Notifications | In-app notification center with unread badge, SMTP dispatch log. | MongoDB, NotificationService |
| 9 | Reports and Export | Executive KPIs, department spend allocation, PDF and CSV export. | pdfkit, json2csv |
| 10 | Audit Logging | Immutable audit ledger with before/after state diffs. | Mongoose, AuditService |

### 4.4 DATABASE DESIGN
**Table 4.3 Database Collections and Indexes**
| Collection | Purpose | Important Fields and Indexes |
| :--- | :--- | :--- |
| `users` | Accounts and roles | name, email (unique index), passwordHash, role, department, isActive |
| `vendors` | Vendor directory | code (unique index), name, taxId, category, riskScore, status, performanceRating |
| `contracts` | Contracts & state | contractNumber (unique index), title, type, value, vendorId, ownerId, status, renewalNoticeDays |
| `approval_workflows`| Approval workflows | contractId, currentStepIndex, status, steps (stepNumber, roleRequired, status, comments) |
| `notifications` | In-app alerts | recipientId, type, title, message, contractId, isRead, createdAt |
| `audit_logs` | Immutable audit trail | userId, userEmail, userRole, action, entityType, entityId, changes, ipAddress, timestamp |
| `system_settings` | Dynamic thresholds | tier1Threshold ($25,000), tier2Threshold ($100,000), smtpHost, notificationDays |

### 4.5 CONTRACT LIFECYCLE STATES
**Table 4.4 Contract Lifecycle States**
| No. | State | Description and Trigger |
| :---: | :--- | :--- |
| 1 | **Draft** | Initial drafting by Procurement; document uploads and renewal notice setup. |
| 2 | **In Review** | Preliminary review; can be returned to Draft with feedback comments. |
| 3 | **Pending Approval** | Locked into multi-tier sequential approval routing based on total value. |
| 4 | **Approved** | All required sequential sign-offs successfully obtained. |
| 5 | **Active** | Executed agreement currently in force and delivering services. |
| 6 | **Expiring Soon** | Automatically set by Expiry Radar when `today >= endDate - renewalNoticeDays`. |
| 7 | **Expired** | Automatically set by Expiry Radar when `today > endDate` without renewal. |
| 8 | **Renewed** | Re-enters Active state with extended term dates. |
| 9 | **Terminated** | Early contract termination with recorded justification notes. |
| 10 | **Amended** | Contract amendment drafted; re-enters approval review queue. |

---

## CHAPTER 5: IMPLEMENTATION

### 5.1 IMPLEMENTATION OVERVIEW
The project is implemented as two applications in one repository: `server/` (Node.js, Express, TypeScript) and `client/` (React, Vite, TypeScript). The REST endpoints are served under `/api` and are summarized in Table 5.1.

**Table 5.1 REST API Endpoints**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/login` | Public | Authenticates credentials and returns JWT session with permission map |
| GET | `/api/auth/me` | Authenticated | Returns current profile, role permissions, and demo mode flag |
| POST | `/api/auth/logout` | Authenticated | Logs out user and writes audit log entry |
| GET / POST | `/api/users` | Admin | Lists and creates system users |
| PUT / DELETE | `/api/users/:id` | Admin | Updates role/status or deactivates user accounts |
| GET / POST | `/api/contracts` | Role-based | Lists contracts with filters/search; creates draft contract |
| GET / PUT / DEL | `/api/contracts/:id` | Role-based | Retrieves, updates, or soft-deletes contract (own only for Procurement) |
| PATCH | `/api/contracts/:id/transition` | Role-based | Executes validated state machine transition |
| POST | `/api/contracts/:id/documents`| Role-based | Uploads document (MIME and 25MB size validated) |
| GET / POST | `/api/vendors` | Role-based | Lists and creates vendor records |
| POST | `/api/approvals/submit` | Procurement | Submits contract and instantiates 3-tier workflow |
| POST | `/api/approvals/:id/action` | Approvers | Approves or rejects step (rejection requires comment) |
| GET | `/api/compliance/radar` | Role-based | Retrieves expiry radar metrics and at-risk contracts |
| POST | `/api/compliance/sweep` | Admin | Manually triggers Expiry Radar sweep job |
| GET | `/api/reports/analytics` | Role-based | Aggregated financial and cycle-time analytics |
| GET | `/api/reports/contracts/export`| Role-based | Exports contract portfolio as PDF or CSV |
| GET | `/api/audit-logs` | Admin, Viewer | Queries immutable audit log entries with filters |
| GET | `/api/settings` | Admin | Retrieves dynamic approval thresholds and settings |

### 5.2 KEY FUNCTIONS (CODE EXPLANATION)

#### 5.2.1 Role-Based Access Control
All permissions are maintained in a central configuration (`server/src/config/permissions.ts`) using a strict **deny-by-default** model. The `authorize(module, action)` middleware enforces these rules on the server, writing an `ACCESS_DENIED` entry to the audit log upon any unauthorized request and returning HTTP 403.

```typescript
// server/src/config/permissions.ts
export type UserRole = 'Admin' | 'Legal' | 'Procurement' | 'Finance' | 'Approver' | 'Viewer';
export type ModuleName = 'users' | 'contracts' | 'documents' | 'vendors' | 'approvals' | 'compliance' | 'reports' | 'audit-logs' | 'reminder-jobs' | 'settings' | 'notifications' | 'profile';
export type ActionName = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject' | 'submit' | 'export' | 'run-job';

export const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<ModuleName, ActionName[]>>> = {
  Admin: {
    users: ['create', 'read', 'update', 'delete'],
    contracts: ['create', 'read', 'update', 'delete', 'submit', 'export'],
    documents: ['create', 'read', 'update', 'delete'],
    vendors: ['create', 'read', 'update', 'delete', 'export'],
    approvals: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'submit', 'export'],
    compliance: ['create', 'read', 'update', 'delete', 'export'],
    reports: ['create', 'read', 'update', 'delete', 'export'],
    'audit-logs': ['read', 'export'],
    'reminder-jobs': ['create', 'read', 'update', 'delete', 'run-job'],
    settings: ['create', 'read', 'update', 'delete'],
  },
  Procurement: {
    contracts: ['create', 'read', 'update', 'delete', 'submit'], // Record-level: own Draft/Rejected
    documents: ['create', 'read', 'delete'],
    vendors: ['create', 'read', 'update'],
    approvals: ['read', 'submit'],
    compliance: ['read'],
    reports: ['read', 'export'],
  },
  Legal: {
    contracts: ['read'],
    compliance: ['create', 'read', 'update'],
    approvals: ['read', 'approve', 'reject'],
    reports: ['read', 'export'],
  },
  Finance: {
    contracts: ['read'],
    vendors: ['read'],
    approvals: ['read', 'approve', 'reject'],
    reports: ['read', 'export'],
  },
  Approver: {
    contracts: ['read'],
    approvals: ['read', 'approve', 'reject'],
    reports: ['read', 'export'],
  },
  Viewer: {
    contracts: ['read'],
    vendors: ['read'],
    compliance: ['read'],
    approvals: ['read'],
    'audit-logs': ['read'], // Strictly read-only, no export
  },
};

export const hasPermission = (role: UserRole | undefined, module: ModuleName, action: ActionName): boolean => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role][module]?.includes(action) ?? false;
};
```

```typescript
// server/src/middleware/rbac.middleware.ts
export const authorize = (module: ModuleName, action: ActionName) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }
    const permitted = hasPermission(req.user.role, module, action);
    if (!permitted) {
      await recordAuditLog({
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'ACCESS_DENIED',
        entityType: 'System',
        entityId: req.originalUrl,
        changes: { after: { module, action, path: req.originalUrl, method: req.method } },
        ipAddress: req.ip,
      });
      res.status(403).json({ error: 'Forbidden', message: `Role '${req.user.role}' lacks '${action}' on '${module}'.` });
      return;
    }
    next();
  };
};
```

**Table 5.2 Role-Based Access Matrix**
| Capability | Admin | Procurement | Legal | Finance | Approver | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **User Administration & Settings** | Full CRUD | Denied | Denied | Denied | Denied | Denied |
| **Contract Creation & Draft Edit** | Full CRUD | Own Only | Denied | Denied | Denied | Denied |
| **Contract Viewing** | All Records | Own Scope | All Records | All Records | Assigned Only | All (Read-Only) |
| **Document Management** | Full CRUD | Own Contracts | View Only | View Only | View Only | View Only |
| **Vendors and Reviews** | Full CRUD | Create / Review | Denied | Read-Only | Denied | Read-Only |
| **Compliance Management** | Full CRUD | Read-Only | Full CRUD | Read-Only | Denied | Read-Only |
| **Approval Actions** | Full Override | Submit Own | Tier 1/2/3 Legal | Tier 2/3 Finance | Tier 3 Approver | Denied |
| **Audit Logs Inspection** | Full & Export | Denied | Denied | Denied | Denied | Read (No Export) |

#### 5.2.2 Contract State Machine
Permitted status transitions are defined deterministically in `server/src/services/stateMachine.service.ts`. Any illegal transition throws a `StateMachineError` (HTTP 400).

```typescript
// server/src/services/stateMachine.service.ts
export const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  Draft: ['In Review'],
  'In Review': ['Draft', 'Pending Approval'],
  'Pending Approval': ['Approved', 'Rejected'],
  Approved: ['Active'],
  Active: ['Expiring Soon', 'Terminated', 'Amended'],
  'Expiring Soon': ['Active', 'Expired'],
  Expired: [],
  Terminated: [],
  Rejected: ['Draft'],
  Amended: ['In Review'],
};

export const stateMachineService = {
  isValidTransition: (from: ContractStatus, to: ContractStatus): boolean => {
    return (VALID_TRANSITIONS[from] || []).includes(to);
  },
  validateAndExecute: async (contract: IContract, targetStatus: ContractStatus): Promise<IContract> => {
    if (!stateMachineService.isValidTransition(contract.status, targetStatus)) {
      throw new StateMachineError(`Invalid transition from '${contract.status}' to '${targetStatus}'.`);
    }
    contract.status = targetStatus;
    return contract.save();
  },
};
```

#### 5.2.3 Value-Based Approval Routing
When a contract is submitted, `approvalService.ts` evaluates its value against configurable thresholds and dynamically builds the sequential approval stages.

**Table 5.3 Approval Tiers and Routes**
| Tier | Contract Value | Approval Route |
| :---: | :--- | :--- |
| **Tier 1** | Under $25,000 | Legal |
| **Tier 2** | $25,000 to $100,000 | Legal ➔ Finance |
| **Tier 3** | Over $100,000 | Legal ➔ Finance ➔ Approver (Executive) |

```typescript
// server/src/services/approval.service.ts
export const approvalService = {
  getWorkflowStepsForValue: async (value: number): Promise<IApprovalStep[]> => {
    const settings = await settingsService.getSettings();
    const { tier1Threshold: t1, tier2Threshold: t2 } = settings;

    if (value < t1) {
      return [{ stepNumber: 1, roleRequired: 'Legal', status: 'Pending' }];
    } else if (value <= t2) {
      return [
        { stepNumber: 1, roleRequired: 'Legal', status: 'Pending' },
        { stepNumber: 2, roleRequired: 'Finance', status: 'Pending' },
      ];
    } else {
      return [
        { stepNumber: 1, roleRequired: 'Legal', status: 'Pending' },
        { stepNumber: 2, roleRequired: 'Finance', status: 'Pending' },
        { stepNumber: 3, roleRequired: 'Approver', status: 'Pending' },
      ];
    }
  },

  takeAction: async (workflowId: string, actor: IUser, action: 'Approve' | 'Reject', comments?: string) => {
    const workflow = await ApprovalWorkflow.findById(workflowId);
    const currentStep = workflow.steps[workflow.currentStepIndex];

    if (actor.role !== 'Admin' && actor.role !== currentStep.roleRequired) {
      throw new ApprovalError(`Role '${actor.role}' cannot act on '${currentStep.roleRequired}' step.`, 403);
    }

    if (action === 'Reject') {
      if (!comments?.trim()) throw new ApprovalError('Rejection comments are mandatory.', 400);
      currentStep.status = 'Rejected';
      currentStep.comments = comments;
      workflow.status = 'Rejected';
      await workflow.save();
      await stateMachineService.validateAndExecute(contract, 'Rejected');
      return { workflow, contract };
    }

    currentStep.status = 'Approved';
    currentStep.comments = comments || 'Approved';
    const isLastStep = workflow.currentStepIndex === workflow.steps.length - 1;

    if (isLastStep) {
      workflow.status = 'Approved';
      await stateMachineService.validateAndExecute(contract, 'Approved');
    } else {
      workflow.currentStepIndex += 1;
    }
    await workflow.save();
    return { workflow, contract };
  },
};
```

#### 5.2.4 Automated Expiry and Renewal Radar
A `node-cron` background daemon runs daily at midnight (`0 0 * * *`), identifying active contracts within their renewal notice window and auto-transitioning them to `Expiring Soon` or `Expired`.

```typescript
// server/src/services/radar.service.ts
export const radarService = {
  runSweep: async (): Promise<RadarSweepResult> => {
    const now = new Date();
    const candidateContracts = await Contract.find({ status: { $in: ['Active', 'Expiring Soon'] } });

    for (const contract of candidateContracts) {
      const endDate = new Date(contract.endDate);
      const noticeDays = contract.renewalNoticeDays || 30;
      const warningDate = new Date(endDate.getTime() - noticeDays * 24 * 60 * 60 * 1000);

      if (now > endDate) {
        await stateMachineService.validateAndExecute(contract, 'Expired');
      } else if (contract.status === 'Active' && now >= warningDate) {
        await stateMachineService.validateAndExecute(contract, 'Expiring Soon');
        await notificationService.createNotification({
          recipientId: contract.ownerId,
          type: 'Expiry Warning',
          title: `Contract Expiring Soon: ${contract.contractNumber}`,
          message: `Contract "${contract.title}" expires on ${endDate.toLocaleDateString()}.`,
        });
      }
    }
  },
  startCron: (cronExpr = '0 0 * * *'): void => {
    cron.schedule(cronExpr, () => radarService.runSweep());
  },
};
```

#### 5.2.5 Immutable Audit Logging
Audit entries cannot be updated or deleted once created. They store the user, role, IP, action, entity, and color-coded JSON before/after state diffs.

```typescript
// server/src/models/auditLog.model.ts
const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String, required: true, index: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  changes: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
```

### 5.3 TESTING AND RESULTS
The test suite consists of **161 automated tests, all of which pass with a 100% pass rate** (157 backend Vitest integration/unit tests + 4 frontend component/route tests).

**Table 5.4 Automated Test Suites**
| Area | Test File | Tests Passed | What Is Verified |
| :--- | :--- | :---: | :--- |
| Health Check | `health.test.ts` | 2 / 2 | Server availability, database connection to `contractflow` |
| Authentication & RBAC | `auth.test.ts` | 15 / 15 | Login, token issuance, user administration, password hashing |
| RBAC Matrix | `rbac.test.ts` | 57 / 57 | Every role against every module, 403 enforcement, `ACCESS_DENIED` logs |
| Vendors | `vendors.test.ts` | 13 / 13 | Vendor CRUD, risk ratings, categories, performance reviews |
| Contracts & State | `contracts.test.ts` | 13 / 13 | CRUD, search, document upload validation, 10-state lifecycle transitions |
| Approvals Matrix | `approvals.test.ts` | 20 / 20 | Tier 1/2/3 value routing, sequential sign-offs, rejection rationale |
| Compliance & Radar | `compliance.test.ts` | 14 / 14 | Expiry radar calculation, reminder sweeps, compliance tracking |
| Reports & Audit | `reports.test.ts` | 23 / 23 | Role-scoped analytics, PDF/CSV exports, immutable audit logging |
| Client Interface | `App.test.tsx` | 4 / 4 | Routing, role-based dashboard cards, `AccessDeniedPage` |
| **Total** | **9 Suites** | **161 / 161** | **100% Pass Rate** |

---

## CHAPTER 6: CONCLUSION & FUTURE WORK

### 6.1 CONCLUSION
The ContractFlow platform successfully brings the entire contract lifecycle into one governed, cloud-native web application. By combining a 10-state finite state machine, value-based multi-tier approvals, an automated expiry radar, vendor scorecards, compliance tracking, role-based dashboards, and an immutable audit log, it eliminates the principal vulnerabilities of manual contracting: missed renewals, uncontrolled commitments, and lack of audit evidence.

The use of TypeScript across both Node.js/Express and React ensures end-to-end type safety. MongoDB provides schema flexibility while Mongoose enforces validation, and `node-cron` guarantees automated midnight surveillance. The deny-by-default RBAC architecture across six roles, verified by 161 automated tests, ensures enterprise-grade access discipline.

### 6.2 FUTURE ENHANCEMENTS
1. **AI-Assisted Contract Ingestion:** OCR and LLM clause extraction to parse legacy PDF contracts and flag non-standard liability terms.
2. **Native E-Signature Integration:** Webhook-driven integration with DocuSign or Adobe Sign for digital signing.
3. **ERP & CRM Integration:** Two-way synchronization with SAP, NetSuite, and Salesforce for purchase order matching.
4. **Predictive Spend Analytics:** Machine learning models forecasting vendor price escalations and renewal budget impacts.
5. **Real SMTP & Push Notifications:** Integrating SendGrid/AWS SES for live e-mail dispatch and mobile push alerts.

---

## APPENDIX A: PROJECT DIRECTORY AND CONFIGURATION

The directory structure of the ContractFlow platform is shown in Figure A.1. The repository separates backend (`server/`) and frontend (`client/`) packages.

**Figure A.1 Project Directory Structure**
```
contract-lifecycle-management/
├── package.json                          # Root package scripts (concurrent dev/test/build)
├── PROJECT_SPEC.md                       # System specification & source of truth
├── README.md                             # Project setup & documentation
├── server/                               # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/                       # Database, environment, central permissions
│   │   │   ├── db.ts                     # MongoDB connection & in-memory fallback
│   │   │   ├── env.ts                    # Zod environment variable parsing
│   │   │   └── permissions.ts            # Central 6-role permission matrix
│   │   ├── controllers/                  # Route business logic handlers
│   │   │   ├── auth.controller.ts        # Login, profile, session management
│   │   │   ├── user.controller.ts        # Admin user administration
│   │   │   ├── contract.controller.ts    # Contract CRUD & document handling
│   │   │   ├── vendor.controller.ts      # Vendor registry & performance reviews
│   │   │   ├── approval.controller.ts    # 3-tier approval actions & history
│   │   │   ├── compliance.controller.ts  # Expiry radar & compliance tracking
│   │   │   ├── reports.controller.ts     # Analytics, PDF & CSV exports
│   │   │   ├── audit.controller.ts       # Forensic audit log search & diffs
│   │   │   └── settings.controller.ts    # Dynamic approval thresholds & SMTP
│   │   ├── middleware/                   # Authentication & validation guards
│   │   │   ├── auth.middleware.ts        # JWT token verification
│   │   │   ├── rbac.middleware.ts        # authorize(module, action) deny-by-default
│   │   │   ├── validate.middleware.ts    # Zod schema request validation
│   │   │   └── upload.middleware.ts      # Multer document upload validation
│   │   ├── models/                       # Mongoose data schemas
│   │   │   ├── user.model.ts             # User accounts & roles
│   │   │   ├── contract.model.ts         # Contract & document sub-documents
│   │   │   ├── vendor.model.ts           # Vendor registry & scorecards
│   │   │   ├── approval.model.ts         # Approval workflows & step states
│   │   │   ├── auditLog.model.ts         # Immutable audit trail
│   │   │   ├── notification.model.ts     # In-app notifications
│   │   │   └── settings.model.ts         # Dynamic system configuration
│   │   ├── routes/                       # Express router definitions
│   │   ├── services/                     # Domain services & scheduled jobs
│   │   │   ├── stateMachine.service.ts   # 10-state finite state machine
│   │   │   ├── approval.service.ts       # Tier resolution & sequential routing
│   │   │   ├── radar.service.ts          # Daily midnight node-cron sweeps
│   │   │   ├── notification.service.ts   # Multi-channel notification delivery
│   │   │   └── settings.service.ts       # Threshold configuration service
│   │   ├── utils/                        # JWT, bcrypt, seeding, audit helper
│   │   ├── app.ts                        # Express application configuration
│   │   └── server.ts                     # Server bootstrapping & listener
│   ├── tests/                            # Vitest automated integration test suites
│   ├── uploads/                          # Sanitized document storage (.gitignored)
│   ├── .env.example                      # Environment template
│   ├── package.json                      # Server dependencies & scripts
│   └── tsconfig.json                     # Server TypeScript configuration
└── client/                               # React + Vite + TypeScript Frontend
    ├── src/
    │   ├── components/                   # UI components
    │   │   ├── layout/                   # Navbar, Sidebar, AppLayout
    │   │   └── contracts/                # Contract forms & status badges
    │   ├── context/                      # State providers
    │   │   └── AuthContext.tsx           # Authentication state & role switcher
    │   ├── pages/                        # Role-specific application views
    │   │   ├── LoginPage.tsx             # Sign-in page
    │   │   ├── ContractsListPage.tsx     # Contract registry, search & filters
    │   │   ├── ContractDetailPage.tsx    # Details, documents, state transitions
    │   │   ├── ApprovalsInboxPage.tsx    # Role approval queue & sign-off
    │   │   ├── VendorsListPage.tsx       # Vendor directory & scorecards
    │   │   ├── ComplianceRadarPage.tsx   # Expiry Radar & compliance items
    │   │   ├── ReportsPage.tsx           # Executive analytics & PDF/CSV export
    │   │   ├── AuditLogsPage.tsx         # Forensic audit log & state diff modal
    │   │   └── UserManagementPage.tsx    # Admin user management
    │   ├── services/                     # Axios API clients
    │   ├── types/                        # Shared TypeScript interfaces
    │   ├── App.tsx                       # Client routing & AccessDeniedPage
    │   └── main.tsx                      # Client entrypoint
    ├── index.html                        # SPA HTML root
    ├── package.json                      # Client dependencies & scripts
    ├── tailwind.config.js                # Tailwind CSS styling config
    └── vite.config.ts                    # Vite build & proxy configuration
```

**Table A.1 Environment Configuration**
| Configuration Key | Purpose | Note |
| :--- | :--- | :--- |
| `PORT` | Backend listener port | Default: `5000` |
| `NODE_ENV` | Application environment | `development`, `production`, `test` |
| `MONGODB_URI` | Database connection URI | `mongodb://localhost:27017/contractflow` |
| `JWT_SECRET` | Secret key used to sign JWTs | Cryptographically strong random key |
| `JWT_EXPIRES_IN` | Token validity duration | Default: `7d` |
| `CLIENT_URL` | Allowed CORS origin | Default: `http://localhost:5173` |
| `DEMO_MODE` | Exposes role switcher menu | Set `true` for evaluation; `false` in production |
| `VITE_API_URL` | Frontend API target | Default: `http://localhost:5000/api` |

#### Local Setup Sequence
1. Install Node.js (v24 LTS or later) and npm.
2. In the project root, install all dependencies: `npm install && npm install --prefix server && npm install --prefix client`.
3. Configure `server/.env` based on `server/.env.example`.
4. Start MongoDB locally (or allow automatic fallback to the zero-config in-memory database).
5. Run the dev servers concurrently: `npm run dev`.
6. Open `http://localhost:5173` in a browser. The database automatically seeds the 6 demo persona accounts on first launch.
7. Run the test suite: `npm test` to verify all 161 automated tests pass.

---

## APPENDIX B: SELECTED SOURCE CODE SNIPPETS

### B.1 Server Initialization | `server/src/server.ts` & `server/src/app.ts`

```typescript
// server/src/server.ts
import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { seedDatabase } from './utils/seed';
import { env } from './config/env';
import { radarService } from './services/radar.service';

const startServer = async () => {
  try {
    console.log('[Server] Initializing database connection...');
    await connectDB();

    console.log('[Server] Checking and seeding default database demo accounts...');
    await seedDatabase();

    // Start background radar cron schedule (runs daily at midnight)
    radarService.startCron('0 0 * * *');

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] CLM API running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`[Server] Health check available at http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      radarService.stopCron();
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Server closed and database disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
```

```typescript
// server/src/app.ts (Route Mounting & Middleware)
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import auditRoutes from './routes/audit.routes';
import vendorRoutes from './routes/vendor.routes';
import contractRoutes from './routes/contract.routes';
import approvalRoutes from './routes/approval.routes';
import notificationRoutes from './routes/notification.routes';
import complianceRoutes from './routes/compliance.routes';
import settingsRoutes from './routes/settings.routes';
import reportsRoutes from './routes/reports.routes';
import { env } from './config/env';

const app: Express = express();

app.use(helmet());
app.use(cors({ origin: [env.CLIENT_URL, 'http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'NotFound', message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.name || 'InternalServerError', message: err.message || 'An error occurred' });
});

export default app;
```

---

### B.2 User Data Model | `server/src/models/user.model.ts`

```typescript
import mongoose, { Document, Schema, Model } from 'mongoose';

export type UserRole = 'Admin' | 'Legal' | 'Procurement' | 'Finance' | 'Approver' | 'Viewer';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Legal', 'Procurement', 'Finance', 'Approver', 'Viewer'],
      default: 'Viewer',
      required: true,
      index: true,
    },
    department: { type: String, required: true, trim: true, default: 'Operations' },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
```

---

### B.3 Contract Lifecycle Data Model | `server/src/models/contract.model.ts`

```typescript
import mongoose, { Document, Schema, Model } from 'mongoose';

export type ContractType = 'MSA' | 'NDA' | 'SOW' | 'SLA' | 'Vendor Agreement' | 'Employment' | 'License' | 'Other';
export type ContractStatus = 'Draft' | 'In Review' | 'Pending Approval' | 'Approved' | 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated' | 'Rejected' | 'Amended';
export type RenewalType = 'Auto-Renew' | 'Manual Review' | 'Do Not Renew';

export interface IContractDocument {
  docId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadedBy?: mongoose.Types.ObjectId;
  uploadedAt: Date;
  notes?: string;
}

export interface IContract extends Document {
  contractNumber: string;
  title: string;
  description: string;
  type: ContractType;
  vendorId: mongoose.Types.ObjectId;
  status: ContractStatus;
  value: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  renewalType: RenewalType;
  renewalNoticeDays: number;
  ownerId: mongoose.Types.ObjectId;
  department: string;
  documents: IContractDocument[];
  currentVersion: number;
  complianceItems: any[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<IContract>(
  {
    contractNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, required: true, enum: ['MSA', 'NDA', 'SOW', 'SLA', 'Vendor Agreement', 'Employment', 'License', 'Other'] },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'In Review', 'Pending Approval', 'Approved', 'Active', 'Expiring Soon', 'Expired', 'Terminated', 'Rejected', 'Amended'],
      default: 'Draft',
      index: true,
    },
    value: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    renewalType: { type: String, enum: ['Auto-Renew', 'Manual Review', 'Do Not Renew'], default: 'Manual Review' },
    renewalNoticeDays: { type: Number, default: 30 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: String, required: true },
    documents: [{
      docId: { type: String, required: true },
      fileName: { type: String, required: true },
      originalName: { type: String, required: true },
      filePath: { type: String, required: true },
      fileSize: { type: Number, required: true },
      mimeType: { type: String, required: true },
      version: { type: Number, default: 1 },
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date, default: Date.now },
    }],
    currentVersion: { type: Number, default: 1 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const Contract: Model<IContract> = mongoose.models.Contract || mongoose.model<IContract>('Contract', contractSchema);
```

---

### B.4 Approval Workflow Model | `server/src/models/approval.model.ts`

```typescript
import mongoose, { Document, Schema, Model } from 'mongoose';

export type ApprovalStepRole = 'Legal' | 'Finance' | 'Procurement' | 'Admin' | 'Approver';
export type ApprovalStepStatus = 'Pending' | 'Approved' | 'Rejected' | 'Skipped';

export interface IApprovalStep {
  stepNumber: number;
  roleRequired: ApprovalStepRole;
  assignedTo?: mongoose.Types.ObjectId;
  status: ApprovalStepStatus;
  comments?: string;
  actionDate?: Date;
  actedBy?: mongoose.Types.ObjectId;
}

export interface IApprovalWorkflow extends Document {
  contractId: mongoose.Types.ObjectId;
  currentStepIndex: number;
  status: 'In Progress' | 'Approved' | 'Rejected';
  steps: IApprovalStep[];
  initiatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const approvalStepSchema = new Schema<IApprovalStep>({
  stepNumber: { type: Number, required: true },
  roleRequired: { type: String, enum: ['Legal', 'Finance', 'Procurement', 'Admin', 'Approver'], required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Skipped'], default: 'Pending' },
  comments: { type: String, default: '' },
  actionDate: { type: Date },
  actedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const approvalWorkflowSchema = new Schema<IApprovalWorkflow>({
  contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
  currentStepIndex: { type: Number, default: 0 },
  status: { type: String, enum: ['In Progress', 'Approved', 'Rejected'], default: 'In Progress', index: true },
  steps: [approvalStepSchema],
  initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const ApprovalWorkflow: Model<IApprovalWorkflow> = mongoose.models.ApprovalWorkflow || mongoose.model<IApprovalWorkflow>('ApprovalWorkflow', approvalWorkflowSchema);
```

---

### B.5 Authentication Controller | `server/src/controllers/auth.controller.ts`

```typescript
import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { recordAuditLog } from '../utils/audit.util';
import { ROLE_PERMISSIONS } from '../config/permissions';
import { env } from '../config/env';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.isActive || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'AuthenticationError', message: 'Invalid email or password' });
    return;
  }

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    department: user.department,
  });

  await recordAuditLog({
    userId: user._id.toString(),
    userEmail: user.email,
    userRole: user.role,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user._id.toString(),
    req,
  });

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    permissions: ROLE_PERMISSIONS[user.role],
    demoMode: env.DEMO_MODE,
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    permissions: ROLE_PERMISSIONS[user.role],
    demoMode: env.DEMO_MODE,
  });
};
```

---

### B.6 Role-Based Access Control Middleware | `server/src/middleware/rbac.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ModuleName, ActionName, hasPermission } from '../config/permissions';
import { recordAuditLog } from '../utils/audit.util';

export const authorize = (module: ModuleName, action: ActionName) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const permitted = hasPermission(req.user.role, module, action);

    if (!permitted) {
      try {
        await recordAuditLog({
          userId: req.user._id.toString(),
          userEmail: req.user.email,
          userRole: req.user.role,
          action: 'ACCESS_DENIED',
          entityType: 'System',
          entityId: req.originalUrl,
          changes: {
            after: {
              module,
              action,
              path: req.originalUrl,
              method: req.method,
              reason: `Role '${req.user.role}' lacks '${action}' on '${module}'.`,
            },
          },
          ipAddress: req.ip,
        });
      } catch (err) {
        console.error('[RBAC] Error recording audit log:', err);
      }

      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role '${req.user.role}' is not authorized to perform '${action}' on '${module}'.`,
      });
      return;
    }

    next();
  };
};
```

---

### B.7 Contract Controller (Excerpt) | `server/src/controllers/contract.controller.ts`

```typescript
import { Request, Response } from 'express';
import { Contract } from '../models/contract.model';
import { recordAuditLog } from '../utils/audit.util';

export const listContracts = async (req: Request, res: Response): Promise<void> => {
  const { status, type, search, page = '1', limit = '10' } = req.query;
  const filter: any = {};

  // Record-level isolation: Procurement can only access own contracts in Draft/Rejected
  if (req.user?.role === 'Procurement') {
    filter.ownerId = req.user._id;
  }

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { contractNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const p = parseInt(page as string, 10);
  const l = parseInt(limit as string, 10);

  const [contracts, total] = await Promise.all([
    Contract.find(filter)
      .populate('vendorId', 'name code category')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l),
    Contract.countDocuments(filter),
  ]);

  res.status(200).json({ contracts, total, page: p, totalPages: Math.ceil(total / l) });
};

export const createContract = async (req: Request, res: Response): Promise<void> => {
  const contractNumber = `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const contract = await Contract.create({
    ...req.body,
    contractNumber,
    ownerId: req.user!._id,
    status: 'Draft',
  });

  await recordAuditLog({
    userId: req.user!._id.toString(),
    userEmail: req.user!.email,
    userRole: req.user!.role,
    action: 'CREATE',
    entityType: 'Contract',
    entityId: contract._id.toString(),
    changes: { after: contract.toObject() },
    req,
  });

  res.status(201).json({ message: 'Contract created successfully', contract });
};
```

---

### B.8 Contract Express Routes | `server/src/routes/contract.routes.ts`

```typescript
import { Router } from 'express';
import {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  transitionState,
  uploadDocument,
  downloadDocument,
} from '../controllers/contract.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { uploadContractDocument } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

// Read endpoints
router.get('/', authorize('contracts', 'read'), listContracts);
router.get('/:id', authorize('contracts', 'read'), getContractById);
router.get('/:id/documents/:docId/download', authorize('documents', 'read'), downloadDocument);

// Create, Update, Delete with RBAC guards
router.post('/', authorize('contracts', 'create'), createContract);
router.put('/:id', authorize('contracts', 'update'), updateContract);
router.delete('/:id', authorize('contracts', 'delete'), deleteContract);
router.patch('/:id/transition', authorize('contracts', 'submit'), transitionState);

// Upload document with Multer validation
router.post('/:id/documents', authorize('documents', 'create'), uploadContractDocument.single('file'), uploadDocument);

export default router;
```

---

### B.9 Frontend API Client | `client/src/services/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clm_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('clm_auth_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### B.10 Frontend Application Routes & Role Guards | `client/src/App.tsx` (Excerpt)

```typescript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ContractsListPage } from './pages/ContractsListPage';
import { ContractDetailPage } from './pages/ContractDetailPage';
import { ApprovalsInboxPage } from './pages/ApprovalsInboxPage';
import { VendorsListPage } from './pages/VendorsListPage';
import { ComplianceRadarPage } from './pages/ComplianceRadarPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ShieldAlert } from 'lucide-react';

const AccessDeniedPage: React.FC<{ path: string }> = ({ path }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
      <ShieldAlert className="w-8 h-8 text-red-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
    <p className="text-slate-500 mb-2">You don't have permission to view <span className="font-mono">{path}</span>.</p>
  </div>
);

export const App: React.FC = () => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) return <div className="p-8 text-center text-slate-500">Loading ContractFlow...</div>;
  if (!user) return <LoginPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/contracts" replace />} />
        <Route path="/contracts" element={hasPermission('contracts', 'read') ? <ContractsListPage /> : <AccessDeniedPage path="/contracts" />} />
        <Route path="/contracts/:id" element={hasPermission('contracts', 'read') ? <ContractDetailPage /> : <AccessDeniedPage path="/contracts/:id" />} />
        <Route path="/approvals" element={hasPermission('approvals', 'read') ? <ApprovalsInboxPage /> : <AccessDeniedPage path="/approvals" />} />
        <Route path="/vendors" element={hasPermission('vendors', 'read') ? <VendorsListPage /> : <AccessDeniedPage path="/vendors" />} />
        <Route path="/compliance" element={hasPermission('compliance', 'read') ? <ComplianceRadarPage /> : <AccessDeniedPage path="/compliance" />} />
        <Route path="/reports" element={hasPermission('reports', 'read') ? <ReportsPage /> : <AccessDeniedPage path="/reports" />} />
        <Route path="/audit-logs" element={hasPermission('audit-logs', 'read') ? <AuditLogsPage /> : <AccessDeniedPage path="/audit-logs" />} />
        <Route path="/settings/users" element={hasPermission('users', 'read') ? <UserManagementPage /> : <AccessDeniedPage path="/settings/users" />} />
        <Route path="*" element={<AccessDeniedPage path="Unknown" />} />
      </Routes>
    </AppLayout>
  );
};
```

---

### B.11 Authentication Context & Permission Helper | `client/src/context/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, PermissionMap, ModuleName, ActionName } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  permissions: PermissionMap;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: ModuleName, action: ActionName) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clm_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [demoMode, setDemoMode] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('clm_auth_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.user);
          setToken(storedToken);
          setPermissions(res.permissions || {});
          setDemoMode(res.demoMode ?? false);
        } catch {
          localStorage.removeItem('clm_auth_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('clm_auth_token', res.token);
    setUser(res.user);
    setToken(res.token);
    setPermissions(res.permissions || {});
    setDemoMode(res.demoMode ?? false);
  };

  const logout = async () => {
    await authService.logout().catch(() => {});
    localStorage.removeItem('clm_auth_token');
    setUser(null);
    setToken(null);
  };

  const hasPermission = (module: ModuleName, action: ActionName): boolean => {
    if (!user || !permissions) return false;
    const actions = permissions[module];
    return Array.isArray(actions) && actions.includes(action);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, permissions, demoMode, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
```

---

## APPENDIX C: DEPENDENCIES AND DEVELOPMENT TOOLS

This table lists the dependencies declared in the project packages. Version ranges reflect package declarations from `server/package.json` and `client/package.json`.

**Table C.1 Declared Dependencies**
| Scope | Package | Declared Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend** | `express` | `^4.21.2` | Enterprise RESTful API server & HTTP routing |
| **Backend** | `mongoose` | `^8.9.5` | MongoDB Object Document Modeling (ODM) |
| **Backend** | `jsonwebtoken` | `^9.0.2` | Cryptographic JWT session creation & verification |
| **Backend** | `bcryptjs` | `^2.4.3` | Password hashing with 10 salt rounds |
| **Backend** | `zod` | `^3.24.1` | Schema validation for HTTP request payloads |
| **Backend** | `multer` | `^2.4.0` | Multi-part document upload handling (25MB limit) |
| **Backend** | `node-cron` | `^4.6.0` | Midnight automated background task scheduler |
| **Backend** | `pdfkit` | `^0.20.2` | Vectorized PDF executive contract report generation |
| **Backend** | `json2csv` | `^6.0.0-alpha.2`| Universal CSV data export for BI integration |
| **Backend** | `helmet` | `^8.0.0` | Security headers and HTTP protection |
| **Backend** | `cors` | `^2.8.5` | Cross-Origin Resource Sharing control |
| **Backend** | `morgan` | `^1.10.0` | HTTP request logging for development |
| **Backend dev** | `tsx` | `^4.19.2` | TypeScript execution & hot reload watcher |
| **Backend dev** | `typescript` | `^5.7.3` | Strict type checking compiler |
| **Backend dev** | `vitest` | `^3.0.2` | High-performance unit & integration test runner |
| **Backend dev** | `supertest` | `^7.0.0` | HTTP endpoint assertion library |
| **Backend dev** | `mongodb-memory-server`| `^10.1.3` | Zero-configuration embedded database fallback |
| **Frontend** | `react` / `react-dom` | `^18.3.1` | Component-based UI library |
| **Frontend** | `vite` | `^6.0.7` | Sub-second frontend build tool & dev server |
| **Frontend** | `react-router-dom` | `^6.28.1` | Client-side routing and protected routes |
| **Frontend** | `axios` | `^1.7.9` | HTTP client with automatic bearer token injection |
| **Frontend** | `lucide-react` | `^0.469.0` | Modern SVG iconography |
| **Frontend** | `tailwindcss` | `^3.4.17` | Utility-first CSS styling system |
| **Frontend dev**| `@testing-library/react` | `^16.1.0` | React component testing framework |

#### Development Tools
- **Google Antigravity IDE & Visual Studio Code:** Integrated development environments used for code authoring, linting, and refactoring.
- **Git & GitHub:** Distributed version control and branch management.
- **Vitest & Supertest:** Automated test execution environment ensuring 100% test pass rate across 161 test cases.
- **Postman:** Manual API endpoint inspection and payload verification.

---

## SCREENSHOTS OF THE PROJECT

This section shows the main screens of the ContractFlow platform running on the local development server (`http://localhost:5173`).

*(Insert screenshots from running application above each caption)*

**FIG.S.1 – DASHBOARD OF THE CONTRACTFLOW PLATFORM**  
**Purpose:** Serves as the primary operational landing workspace tailored to the user's role.  
**What the screen shows:** Executive KPI summary cards (Total Contracts, Total Value in USD, Active Agreements, Expiring Soon, Pending Approvals), monthly spend distribution bars, and the upcoming expiration radar widget.

**FIG.S.2 – CONTRACT REGISTRY WITH SEARCH AND FILTERS**  
**Purpose:** Centralized searchable repository of all commercial agreements.  
**What the screen shows:** Full-text title and contract number search, category/type filter chips, status filters, vendor linkages, start/end dates, and server-side paginated tables.

**FIG.S.3 – APPROVAL QUEUE AND APPROVAL HISTORY**  
**Purpose:** Multi-tier sequential approval workspace for Legal, Finance, and Executive Approvers.  
**What the screen shows:** Pending sign-off queue with Approve and Reject action buttons, mandatory rejection comment modal, and historical audit trail of prior stage decisions.

**FIG.S.4 – VENDOR REGISTRY AND PERFORMANCE SCORECARD**  
**Purpose:** Master directory for tracking third-party suppliers and risk metrics.  
**What the screen shows:** Vendor codes, tax IDs, 4-tier risk classification badges (*Low, Medium, High, Critical*), 1–5 star performance ratings, and total financial exposure.

**FIG.S.5 – AUDIT LOG VIEWER WITH STATE-DIFF MODAL**  
**Purpose:** Immutable forensic ledger for regulatory and compliance auditing.  
**What the screen shows:** Filterable audit entries with timestamps, user emails, roles, IP addresses, and an interactive modal displaying color-coded JSON before/after state diffs.

**FIG.S.6 – ROLE-BASED ACCESS DENIED PAGE**  
**Purpose:** Visual verification of deny-by-default route protection.  
**What the screen shows:** A clean 403 Access Denied notification rendered when an unauthorized user attempts to open a forbidden URL (such as a Viewer navigating directly to `/settings/users`), accompanied by an immediate `ACCESS_DENIED` audit log entry.

---

## REFERENCES

1. Chieu, T. C., Nguyen, T., Maradugu, S., & Kwok, T. (2007) ‘An Enterprise Electronic Contract Management System Based on Service-Oriented Architecture’, *IBM Research Report RC24251 (W0705-009)*, IBM T. J. Watson Research Center, Yorktown Heights, NY.
2. Nguyen, P. H. M. (2013) ‘Contract Lifecycle Management on the sell-side: a case study in upstream Oil and Gas industry’, Thesis, Lahti University of Applied Sciences.
3. Ahmad, A. (2023) ‘Enhancing Contract Lifecycle Management through AI and Collaborative Tools: A Comprehensive Investigation’, *MSc Research Report*, Department of Computing, Goldsmiths, University of London.
4. Bradach, R. (2021) ‘Testing Relative Performance of MERN, MEAN, and LAMP Web Development Stacks’, *Winona State University Research Colloquium*.
5. Ferraiolo, D. F., Sandhu, R., Gavrila, S., Kuhn, D. R., & Chandramouli, R. (2001) ‘Proposed NIST Standard for Role-Based Access Control’, *ACM Transactions on Information and System Security*, vol. 4, no. 3, pp. 224–274.
6. Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996) ‘Role-Based Access Control Models’, *IEEE Computer*, vol. 29, no. 2, pp. 38–47.
7. Jones, M., Bradley, J., & Sakimura, N. (2015) ‘JSON Web Token (JWT)’, *RFC 7519*, Internet Engineering Task Force.
8. OWASP Foundation (2021) ‘OWASP Top Ten Web Application Security Risks’.
9. MongoDB, Inc. (2026) ‘MongoDB Documentation and Mongoose ODM Manual’.
10. Express.js (2026) ‘Express.js Fast, unopinionated, minimalist web framework for Node.js’.
11. Meta Platforms, Inc. (2026) ‘React: The library for web and native user interfaces’.
12. Vitest Team (2026) ‘Vitest: Next Generation Testing Framework’.
13. Zod (2026) ‘Zod: TypeScript-first schema validation with static type inference’.

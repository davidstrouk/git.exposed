import { pgTable, uuid, text, integer, timestamp, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from '@auth/core/adapters';

// --- Auth tables (Auth.js / Drizzle adapter) ---

export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => [
  primaryKey({ columns: [account.provider, account.providerAccountId] }),
]);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => [
  primaryKey({ columns: [vt.identifier, vt.token] }),
]);

// --- Subscription table (Lemon Squeezy billing) ---

export const subscriptions = pgTable('subscription', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lsCustomerId: text('ls_customer_id'),
  lsSubscriptionId: text('ls_subscription_id').unique(),
  variantId: text('variant_id'),
  status: text('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end'),
  customerPortalUrl: text('customer_portal_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Scan tables (existing) ---

export const scanStatusEnum = pgEnum('scan_status', ['pending', 'scanning', 'complete', 'failed']);
export const severityEnum = pgEnum('severity', ['critical', 'high', 'medium', 'low', 'info']);
export const gradeEnum = pgEnum('grade', ['A', 'B', 'C', 'D', 'F']);

export const scans = pgTable('scans', {
  id: uuid('id').defaultRandom().primaryKey(),
  repoOwner: text('repo_owner').notNull(),
  repoName: text('repo_name').notNull(),
  repoUrl: text('repo_url').notNull(),
  status: scanStatusEnum('status').notNull().default('pending'),
  score: integer('score'),
  grade: gradeEnum('grade'),
  findingsCount: integer('findings_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const findings = pgTable('findings', {
  id: uuid('id').defaultRandom().primaryKey(),
  scanId: uuid('scan_id').notNull().references(() => scans.id),
  checkName: text('check_name').notNull(),
  severity: severityEnum('severity').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  file: text('file').notNull(),
  line: integer('line'),
});

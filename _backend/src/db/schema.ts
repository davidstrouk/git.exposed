import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

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

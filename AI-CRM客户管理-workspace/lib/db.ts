import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

function getDbPath(): string {
  const configured = process.env.DB_PATH || "./data/crm.db";
  const abs = path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return abs;
}

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','manager','sales')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT,
      source TEXT,
      intent_level TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      claimed_by INTEGER,
      claimed_at TEXT,
      FOREIGN KEY (claimed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      owner_id INTEGER NOT NULL,
      company TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT,
      email TEXT,
      intent_level TEXT NOT NULL DEFAULT 'medium',
      follow_status TEXT NOT NULL DEFAULT 'following',
      requirement TEXT,
      last_contact_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      raw_input TEXT NOT NULL,
      extracted TEXT,
      intent_level TEXT,
      follow_status TEXT,
      contact_time TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS push_config (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      push_time TEXT NOT NULL DEFAULT '09:00',
      roles TEXT NOT NULL DEFAULT 'sales,manager',
      items TEXT NOT NULL DEFAULT 'new,status,pending,highlight',
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'daily_push',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    INSERT OR IGNORE INTO push_config (id) VALUES (1);
  `);
}

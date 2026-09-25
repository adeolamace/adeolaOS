import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const crmRecords = sqliteTable(
  "crm_records",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    clientId: text("client_id"),
    status: text("status").notNull().default("active"),
    value: integer("value").notNull().default(0),
    payload: text("payload").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_crm_records_type_status").on(table.type, table.status),
    index("idx_crm_records_client_id").on(table.clientId),
    index("idx_crm_records_updated_at").on(table.updatedAt),
  ],
);

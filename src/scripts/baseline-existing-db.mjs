import "dotenv/config";
import fs from "node:fs";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = await pool.connect();
try {
  const snapshot = JSON.parse(
    fs.readFileSync(
      "drizzle/20260905192330_legacy-auth-session-tables/snapshot.json",
      "utf8",
    ),
  );
  const columns = (
    await db.query(
      "select table_name,column_name,udt_name,is_nullable from information_schema.columns where table_schema='public'",
    )
  ).rows;
  const types = {
    integer: "int4",
    boolean: "bool",
    "timestamp with time zone": "timestamptz",
    "timestamp without time zone": "timestamp",
  };
  const issues = [];
  for (const expected of snapshot.ddl.filter(
    (d) => d.entityType === "columns",
  )) {
    const actual = columns.find(
      (c) => c.table_name === expected.table && c.column_name === expected.name,
    );
    const type = types[expected.type] ?? expected.type;
    if (
      !actual ||
      actual.udt_name !== type ||
      (expected.notNull && actual.is_nullable !== "NO")
    )
      issues.push(
        expected.table + "." + expected.name + " differs from baseline",
      );
  }
  const enums = (
    await db.query(
      "select t.typname,array_agg(e.enumlabel::text order by e.enumsortorder) as labels from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by t.typname",
    )
  ).rows;
  for (const expected of snapshot.ddl.filter((d) => d.entityType === "enums")) {
    const actual = enums.find((e) => e.typname === expected.name);
    if (
      !actual ||
      JSON.stringify(actual.labels) !== JSON.stringify(expected.values)
    )
      issues.push("Enum " + expected.name + " differs from baseline");
  }
  const constraints = (
    await db.query(`select r.relname as table_name,c.contype,
  array(select a.attname::text from unnest(c.conkey) with ordinality k(attnum,n) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum order by k.n) as columns,
  rt.relname as target_table,c.confdeltype,
  array(select a.attname::text from unnest(c.confkey) with ordinality k(attnum,n) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.attnum order by k.n) as target_columns
  from pg_constraint c join pg_class r on r.oid=c.conrelid join pg_namespace n on n.oid=r.relnamespace left join pg_class rt on rt.oid=c.confrelid where n.nspname='public'`)
  ).rows;
  const deletion = {
    CASCADE: "c",
    "NO ACTION": "a",
    "SET NULL": "n",
    RESTRICT: "r",
  };
  for (const expected of snapshot.ddl.filter((d) =>
    ["fks", "pks", "uniques"].includes(d.entityType),
  )) {
    const kind = { fks: "f", pks: "p", uniques: "u" }[expected.entityType];
    if (
      !constraints.some(
        (c) =>
          c.table_name === expected.table &&
          c.contype === kind &&
          JSON.stringify(c.columns) === JSON.stringify(expected.columns) &&
          (kind !== "f" ||
            (c.target_table === expected.tableTo &&
              JSON.stringify(c.target_columns) ===
                JSON.stringify(expected.columnsTo) &&
              c.confdeltype === deletion[expected.onDelete])),
      )
    )
      issues.push(
        "Constraint " +
          expected.table +
          "." +
          expected.name +
          " differs from baseline",
      );
  }
  if (issues.length)
    throw new Error("Baseline validation stopped:\n" + issues.join("\n"));
  const migrations = readMigrationFiles({ migrationsFolder: "drizzle" }).filter(
    (m) => m.name <= "20260905192330_legacy-auth-session-tables",
  );
  console.log(
    "Verified baseline tables, column types/nullability, enums, primary/unique keys, and foreign keys.",
  );
  if (process.argv.includes("--apply")) {
    await db.query("BEGIN");
    await db.query("LOCK TABLE drizzle.__drizzle_migrations IN EXCLUSIVE MODE");
    const history = await db.query(
      "select id from drizzle.__drizzle_migrations",
    );
    if (history.rowCount)
      throw new Error("Migration history is not empty; refusing to replace it");
    for (const migration of migrations)
      await db.query(
        "insert into drizzle.__drizzle_migrations(hash,created_at,name) values($1,$2,$3)",
        [migration.hash, migration.folderMillis, migration.name],
      );
    await db.query("COMMIT");
    console.log(
      "Recorded " +
        migrations.length +
        " already-applied migrations. No application records changed.",
    );
  } else
    console.log("Dry run only. Use --apply to record the verified baseline.");
} catch (error) {
  await db.query("ROLLBACK").catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db.release();
  await pool.end();
}

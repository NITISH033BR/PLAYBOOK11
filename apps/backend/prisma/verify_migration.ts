import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Run raw SQL checks
  const checks = await prisma.$queryRawUnsafe(`
    -- 1. Users table columns
    SELECT 'users' AS check_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position;
  `);

  const hierarchyCols = await prisma.$queryRawUnsafe(`
    -- 2. UserHierarchy columns (verify new columns exist)
    SELECT 'user_hierarchy' AS check_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'user_hierarchy'
    ORDER BY ordinal_position;
  `);

  const commTxCols = await prisma.$queryRawUnsafe(`
    -- 3. CommissionTransaction columns
    SELECT 'commission_transactions' AS check_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'commission_transactions'
    ORDER BY ordinal_position;
  `);

  const constraints = await prisma.$queryRawUnsafe(`
    -- 4. Foreign key constraints
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name IN ('users', 'user_hierarchy', 'commission_transactions')
      AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE')
    ORDER BY tc.table_name, tc.constraint_name;
  `);

  const indexes = await prisma.$queryRawUnsafe(`
    -- 5. Indexes
    SELECT
      tablename AS table_name,
      indexname AS index_name,
      indexdef AS index_def
    FROM pg_indexes
    WHERE tablename IN ('users', 'user_hierarchy', 'commission_transactions')
    ORDER BY tablename, indexname;
  `);

  const counts = await prisma.$queryRawUnsafe(`
    SELECT 'users' AS tbl, COUNT(*)::int AS cnt FROM users
    UNION ALL
    SELECT 'user_hierarchy', COUNT(*)::int FROM user_hierarchy
    UNION ALL
    SELECT 'commission_transactions', COUNT(*)::int FROM commission_transactions
    UNION ALL
    SELECT 'wallets', COUNT(*)::int FROM wallets
    ORDER BY tbl;
  `);

  console.log("=== USERS TABLE COLUMNS ===");
  console.table(checks);

  console.log("\n=== USER_HIERARCHY COLUMNS (verify credit_limit, exposure_limit, max_player_count exist) ===");
  console.table(hierarchyCols);

  console.log("\n=== COMMISSION_TRANSACTIONS COLUMNS ===");
  console.table(commTxCols);

  console.log("\n=== CONSTRAINTS ===");
  console.table(constraints);

  console.log("\n=== INDEXES ===");
  console.table(indexes);

  console.log("\n=== ROW COUNTS ===");
  console.table(counts);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

-- CreateEnum
-- (No new enums needed, using existing types)

-- CreateTable casino_categories
CREATE TABLE "casino_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casino_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable casino_providers
CREATE TABLE "casino_providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casino_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable casino_games
CREATE TABLE "casino_games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "provider_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "rtp" DECIMAL(5,2),
    "min_bet" DECIMAL(12,2) DEFAULT 1,
    "max_bet" DECIMAL(12,2) DEFAULT 10000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable casino_promotions
CREATE TABLE "casino_promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "link" TEXT,
    "badge" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casino_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "casino_categories_name_key" ON "casino_categories"("name");
CREATE UNIQUE INDEX "casino_categories_slug_key" ON "casino_categories"("slug");
CREATE UNIQUE INDEX "casino_providers_name_key" ON "casino_providers"("name");
CREATE UNIQUE INDEX "casino_providers_slug_key" ON "casino_providers"("slug");
CREATE UNIQUE INDEX "casino_games_slug_key" ON "casino_games"("slug");

-- AddForeignKeys
ALTER TABLE "casino_games" ADD CONSTRAINT "casino_games_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "casino_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "casino_games" ADD CONSTRAINT "casino_games_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "casino_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

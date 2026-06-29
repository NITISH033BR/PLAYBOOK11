-- AlterTable
ALTER TABLE "user_hierarchy" ADD COLUMN     "credit_limit" DECIMAL(12,2),
ADD COLUMN     "exposure_limit" DECIMAL(12,2),
ADD COLUMN     "max_player_count" INTEGER;

-- CreateTable
CREATE TABLE "commission_transactions" (
    "id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "source_bet_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "level" "HierarchyLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user_hierarchy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_source_bet_id_fkey" FOREIGN KEY ("source_bet_id") REFERENCES "bets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

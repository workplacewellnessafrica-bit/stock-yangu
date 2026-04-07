-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "storeConfig" JSONB;

-- CreateTable
CREATE TABLE "StoreCustomer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "sessionToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOrder" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "deliveryLocation" TEXT NOT NULL,
    "specialNote" TEXT,
    "paymentMethod" TEXT,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "channel" TEXT NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreCartSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreCartSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreCustomer_sessionToken_key" ON "StoreCustomer"("sessionToken");

-- CreateIndex
CREATE INDEX "StoreCustomer_businessId_idx" ON "StoreCustomer"("businessId");

-- CreateIndex
CREATE INDEX "StoreCustomer_sessionToken_idx" ON "StoreCustomer"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "StoreCustomer_businessId_phone_key" ON "StoreCustomer"("businessId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOrder_referenceId_key" ON "StoreOrder"("referenceId");

-- CreateIndex
CREATE INDEX "StoreOrder_businessId_idx" ON "StoreOrder"("businessId");

-- CreateIndex
CREATE INDEX "StoreOrder_customerId_idx" ON "StoreOrder"("customerId");

-- CreateIndex
CREATE INDEX "StoreOrder_businessId_status_idx" ON "StoreOrder"("businessId", "status");

-- CreateIndex
CREATE INDEX "StoreOrder_businessId_createdAt_idx" ON "StoreOrder"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoreCartSession_token_key" ON "StoreCartSession"("token");

-- CreateIndex
CREATE INDEX "StoreCartSession_businessId_idx" ON "StoreCartSession"("businessId");

-- CreateIndex
CREATE INDEX "StoreCartSession_token_idx" ON "StoreCartSession"("token");

-- AddForeignKey
ALTER TABLE "StoreCustomer" ADD CONSTRAINT "StoreCustomer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "StoreCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCartSession" ADD CONSTRAINT "StoreCartSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

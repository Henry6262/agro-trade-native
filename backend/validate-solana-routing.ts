import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { TradeOperationService } from './src/trade-operations/services/trade-operation.service';
import { TradePhase, UserRole } from '@prisma/client';
import { PrismaService } from './src/prisma/prisma.service';

async function validateSolanaRouting() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tradeService = app.get(TradeOperationService);
  const prisma = app.get(PrismaService);

  console.log('--- STARTING SOLANA ROUTING VALIDATION ---');

  let user, listing, trade;

  try {
    // 0. Setup dummy user and listing
    user = await prisma.user.create({
      data: {
        email: 'solana-validator-' + Date.now() + '@example.com',
        name: 'Solana Validator',
        role: UserRole.BUYER
      }
    });

    listing = await prisma.buyListing.create({
      data: {
        buyerId: user.id,
        productId: 'cmd-corn-maize', // Use existing seed ID
        quantity: 1000,
        unit: 'TON',
        maxPricePerUnit: 200,
        requiredByDate: new Date(),
        status: 'ACTIVE'
      }
    });

    // 1. Create a dummy trade with SOLANA metadata
    trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'SOL-TEST-VAL-' + Date.now(),
        buyListingId: listing.id,
        adminId: user.id, // Using same user for simplicity
        status: 'ACTIVE',
        phase: 'INITIATION',
        sellingPrice: 100,
        incoterm: 'EXW',
        metadata: {
          escrowChain: 'SOLANA'
        }
      }
    });

    console.log(`Created test trade: ${trade.id} with operation number: ${trade.operationNumber}`);

    console.log('Triggering IN_TRANSIT escrow...');
    await (tradeService as any).triggerEscrowForPhase(trade.id, TradePhase.IN_TRANSIT);
    
    const updated = await prisma.tradeOperation.findUnique({ where: { id: trade.id } });
    console.log('Trade metadata after trigger:', JSON.stringify(updated?.metadata, null, 2));

  } catch (error) {
    console.error('Validation failed:', error);
  } finally {
    // 3. Cleanup
    if (trade) await prisma.tradeOperation.delete({ where: { id: trade.id } }).catch(() => {});
    if (listing) await prisma.buyListing.delete({ where: { id: listing.id } }).catch(() => {});
    if (user) await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    console.log('Test data cleaned up.');
    await app.close();
  }
}

validateSolanaRouting()
  .then(() => console.log('Validation script finished.'))
  .catch(err => console.error('Script error:', err));

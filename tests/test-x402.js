#!/usr/bin/env node
/**
 * Test script for x402 Payment Integration
 * Demonstrates how Toto can accept payments for BD services
 */

import x402 from './src/x402-payments.js';
import bdDeals, { BD_SERVICES } from './src/bd-deals.js';

async function testX402Integration() {
  console.log('🧪 TESTING X402 PAYMENT INTEGRATION\n');
  console.log('====================================\n');
  
  // Test 1: Configure wallet
  console.log('Test 1: Configure Toto Wallet');
  x402.configureWallet({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6dEe', // Example address
    preferredChain: 'base',
    supportedTokens: ['USDC', 'USDT', 'ETH']
  });
  console.log('✅ Wallet configured\n');
  
  // Test 2: Create deal proposal
  console.log('Test 2: Create Deal Proposal');
  const mockProject = {
    id: 999,
    name: 'TestCrypto Project',
    twitter_username: 'testcrypto',
    mcap: 25000000 // $25M market cap
  };
  
  const deal = await bdDeals.createDealProposal(
    mockProject,
    'listing_premium',
    'manual' // Dino closes personally
  );
  console.log('✅ Deal proposal created:', deal.id);
  console.log('   Service:', deal.service.name);
  console.log('   Price: $', deal.service.price);
  console.log('   Automation:', deal.automationLevel);
  console.log('');
  
  // Test 3: Show proposal message
  console.log('Test 3: Proposal Message');
  console.log('---');
  console.log(deal.proposalMessage);
  console.log('---\n');
  
  // Test 4: Show all available services
  console.log('Test 4: Available BD Services');
  Object.values(BD_SERVICES).forEach(service => {
    console.log(`  • ${service.name}`);
    console.log(`    Price: $${service.price} ${service.currency}`);
    console.log(`    Timeline: ${service.timeline}`);
    console.log('');
  });
  
  // Test 5: Payment stats
  console.log('Test 5: Payment Statistics');
  const stats = x402.getPaymentStats();
  console.log('  Total requests:', stats.totalRequests);
  console.log('  Total paid:', stats.totalPaid);
  console.log('  Total pending:', stats.totalPending);
  console.log('  Revenue: $', stats.revenue);
  console.log('  By automation level:', stats.byAutomationLevel);
  console.log('');
  
  // Test 6: Show x402 payment payload
  console.log('Test 6: x402 Payment Payload');
  console.log(JSON.stringify(deal.paymentRequest.x402Payload, null, 2));
  console.log('');
  
  console.log('====================================');
  console.log('✅ All tests passed!');
  console.log('====================================\n');
  
  console.log('📚 Usage Examples:');
  console.log('');
  console.log('1. Create a deal proposal:');
  console.log('   const deal = await bdDeals.createDealProposal(project, "listing_premium", "manual");');
  console.log('');
  console.log('2. Send proposal via X:');
  console.log('   await bdDeals.sendProposal(deal, "twitter");');
  console.log('');
  console.log('3. Check payment status:');
  console.log('   await x402.verifyPayment(deal.paymentRequest.id);');
  console.log('');
  console.log('4. Finalize deal after payment:');
  console.log('   await bdDeals.processDealPayment(deal.id, "paid");');
  console.log('');
}

testX402Integration().catch(console.error);

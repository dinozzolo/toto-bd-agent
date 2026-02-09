/**
 * x402 Payment Integration Module
 * Enables Toto to pay and be paid for BD services
 * Supports both automated deal closing and facilitated payments
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PAYMENTS_PATH = join(__dirname, '../data/x402-payments.json');

// Payment configuration
const X402_CONFIG = {
  // Supported networks
  SUPPORTED_CHAINS: ['base', 'ethereum', 'polygon', 'solana'],
  
  // Default payment settings
  DEFAULTS: {
    currency: 'USDC',
    chain: 'base',
    expiryMinutes: 60, // Payment request expires in 1 hour
  },
  
  // Service pricing tiers
  PRICING_TIERS: {
    'listing_basic': {
      name: 'Basic Exchange Listing Package',
      amount: 5000, // $5,000
      description: 'Standard exchange listing submission with basic marketing'
    },
    'listing_premium': {
      name: 'Premium Listing Package',
      amount: 15000, // $15,000
      description: 'Priority listing with enhanced marketing and KOL introductions'
    },
    'listing_enterprise': {
      name: 'Enterprise Listing Package',
      amount: 50000, // $50,000
      description: 'Full-service listing with dedicated support and market making'
    },
    'marketing_basic': {
      name: 'Basic Marketing Campaign',
      amount: 3000, // $3,000
      description: 'Social media promotion and community engagement'
    },
    'marketing_premium': {
      name: 'Premium Marketing Campaign', 
      amount: 10000, // $10,000
      description: 'Full marketing campaign with KOL partnerships'
    },
    'consultation': {
      name: 'BD Strategy Consultation',
      amount: 500, // $500/hour
      description: 'One-on-one business development strategy session'
    }
  }
};

// Initialize payments database
function initPaymentsDb() {
  if (existsSync(PAYMENTS_PATH)) {
    return JSON.parse(readFileSync(PAYMENTS_PATH, 'utf8'));
  }
  
  const db = {
    paymentRequests: [], // Outbound payment requests (Toto asking to be paid)
    paymentSent: [],     // Outbound payments (Toto paying for services)
    paymentReceived: [], // Inbound payments (Clients paying Toto)
    pendingDeals: [],    // Deals awaiting payment/finalization
    wallet: {
      address: null,     // Toto's wallet address
      supportedTokens: ['USDC', 'USDT', 'ETH', 'SOL'],
      preferredChain: 'base'
    }
  };
  
  savePaymentsDb(db);
  return db;
}

function savePaymentsDb(db) {
  writeFileSync(PAYMENTS_PATH, JSON.stringify(db, null, 2));
}

// Load payments database
let paymentsDb = initPaymentsDb();

/**
 * Generate a payment request for BD services
 * @param {Object} deal - Deal details
 * @param {string} deal.projectId - Project identifier
 * @param {string} deal.projectName - Project name
 * @param {string} deal.serviceType - Type of service (listing_basic, marketing_premium, etc.)
 * @param {number} deal.customAmount - Optional custom amount (overrides pricing tier)
 * @param {string} deal.clientWallet - Client's wallet address
 * @param {string} deal.automationLevel - 'manual', 'assisted', or 'full'
 */
export async function generatePaymentRequest(deal) {
  const tier = X402_CONFIG.PRICING_TIERS[deal.serviceType];
  const amount = deal.customAmount || tier?.amount || 0;
  
  const paymentRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    projectId: deal.projectId,
    projectName: deal.projectName,
    serviceType: deal.serviceType,
    serviceName: tier?.name || 'Custom Service',
    amount: amount,
    currency: X402_CONFIG.DEFAULTS.currency,
    chain: X402_CONFIG.DEFAULTS.chain,
    description: tier?.description || 'Business Development Services',
    clientWallet: deal.clientWallet,
    totoWallet: paymentsDb.wallet.address,
    status: 'pending', // pending, paid, expired, cancelled
    automationLevel: deal.automationLevel || 'assisted', // manual, assisted, full
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + X402_CONFIG.DEFAULTS.expiryMinutes * 60000).toISOString(),
    x402Payload: null // Will be populated when generating actual x402 request
  };
  
  // Generate x402 compliant payload
  paymentRequest.x402Payload = generateX402Payload(paymentRequest);
  
  paymentsDb.paymentRequests.push(paymentRequest);
  savePaymentsDb(paymentsDb);
  
  console.log(`[x402] Payment request generated: ${paymentRequest.id}`);
  console.log(`[x402] Amount: $${amount} ${paymentRequest.currency}`);
  console.log(`[x402] Automation: ${paymentRequest.automationLevel}`);
  
  return paymentRequest;
}

/**
 * Generate x402 compliant payment payload
 */
function generateX402Payload(request) {
  return {
    schemaId: 'x402@1.0',
    payment: {
      amount: request.amount,
      currency: request.currency,
      chain: request.chain,
      recipient: request.totoWallet,
      sender: request.clientWallet,
      timestamp: request.createdAt,
      expiresAt: request.expiresAt
    },
    metadata: {
      service: request.serviceName,
      description: request.description,
      project: request.projectName,
      automationLevel: request.automationLevel
    },
    verification: {
      callbackUrl: `https://api.toto-bd-agent.com/x402/verify/${request.id}`,
      webhookUrl: `https://api.toto-bd-agent.com/x402/webhook/${request.id}`
    }
  };
}

/**
 * Process an outbound payment (Toto paying for services)
 * @param {Object} payment - Payment details
 */
export async function processOutboundPayment(payment) {
  const paymentRecord = {
    id: `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'outbound',
    recipient: payment.recipient,
    recipientName: payment.recipientName,
    amount: payment.amount,
    currency: payment.currency,
    chain: payment.chain,
    purpose: payment.purpose,
    status: 'pending',
    createdAt: new Date().toISOString(),
    txHash: null
  };
  
  paymentsDb.paymentSent.push(paymentRecord);
  savePaymentsDb(paymentsDb);
  
  console.log(`[x402] Outbound payment initiated: ${paymentRecord.id}`);
  console.log(`[x402] To: ${payment.recipientName} (${payment.amount} ${payment.currency})`);
  
  // In production, this would:
  // 1. Sign transaction with Toto's wallet
  // 2. Submit to blockchain
  // 3. Wait for confirmation
  // 4. Update status
  
  return paymentRecord;
}

/**
 * Verify if a payment has been received
 * @param {string} requestId - Payment request ID
 */
export async function verifyPayment(requestId) {
  const request = paymentsDb.paymentRequests.find(r => r.id === requestId);
  if (!request) {
    throw new Error(`Payment request not found: ${requestId}`);
  }
  
  // Check if expired
  if (new Date(request.expiresAt) < new Date()) {
    request.status = 'expired';
    savePaymentsDb(paymentsDb);
    return { status: 'expired', request };
  }
  
  // In production, this would:
  // 1. Query blockchain for transactions to Toto's wallet
  // 2. Match amount and sender
  // 3. Confirm payment
  
  // For now, simulate verification
  console.log(`[x402] Verifying payment: ${requestId}`);
  console.log(`[x402] Expected: $${request.amount} ${request.currency}`);
  
  return { status: 'pending', request };
}

/**
 * Handle deal finalization based on automation level
 * @param {string} dealId - Deal ID
 * @param {string} paymentStatus - Payment status
 */
export async function finalizeDeal(dealId, paymentStatus) {
  const deal = paymentsDb.pendingDeals.find(d => d.id === dealId);
  if (!deal) {
    throw new Error(`Deal not found: ${dealId}`);
  }
  
  switch (deal.automationLevel) {
    case 'manual':
      // Notify Dino to close deal personally
      console.log(`[x402] MANUAL DEAL READY: ${deal.projectName}`);
      console.log(`[x402] Payment status: ${paymentStatus}`);
      console.log(`[x402] Action required: Close deal personally`);
      
      // Send notification to Dino
      await notifyManualIntervention(deal);
      break;
      
    case 'assisted':
      // Auto-generate documents, Dino approves
      console.log(`[x402] ASSISTED DEAL: ${deal.projectName}`);
      console.log(`[x402] Auto-generating documents...`);
      
      const docs = await generateDealDocuments(deal);
      await notifyApprovalNeeded(deal, docs);
      break;
      
    case 'full':
      // Full automation - close deal automatically
      console.log(`[x402] FULL AUTO DEAL: ${deal.projectName}`);
      console.log(`[x402] Processing automatically...`);
      
      await processAutomaticDeal(deal);
      break;
  }
  
  deal.status = paymentStatus === 'paid' ? 'payment_received' : deal.status;
  deal.finalizedAt = new Date().toISOString();
  savePaymentsDb(paymentsDb);
  
  return deal;
}

/**
 * Notify for manual intervention
 */
async function notifyManualIntervention(deal) {
  // In production, send to Dino's dashboard/telegram/email
  console.log(`[x402] 📧 Notification sent to Dino:`);
  console.log(`  - Project: ${deal.projectName}`);
  console.log(`  - Amount: $${deal.amount}`);
  console.log(`  - Service: ${deal.serviceName}`);
  console.log(`  - Action: Close deal personally`);
}

/**
 * Generate deal documents
 */
async function generateDealDocuments(deal) {
  const documents = {
    agreement: `BD_Service_Agreement_${deal.id}.pdf`,
    invoice: `Invoice_${deal.id}.pdf`,
    serviceDescription: deal.serviceName,
    amount: deal.amount,
    currency: deal.currency,
    generatedAt: new Date().toISOString()
  };
  
  console.log(`[x402] Documents generated for ${deal.projectName}`);
  return documents;
}

/**
 * Notify that approval is needed
 */
async function notifyApprovalNeeded(deal, documents) {
  console.log(`[x402] 📧 Approval needed from Dino:`);
  console.log(`  - Project: ${deal.projectName}`);
  console.log(`  - Documents: ${Object.keys(documents).join(', ')}`);
  console.log(`  - Action: Review and approve`);
}

/**
 * Process automatic deal
 */
async function processAutomaticDeal(deal) {
  console.log(`[x402] 🤖 Processing automatic deal:`);
  console.log(`  - Project: ${deal.projectName}`);
  console.log(`  - Amount: $${deal.amount}`);
  console.log(`  - Status: Deal closed automatically`);
  
  // Auto-generate all documents
  // Auto-send to client
  // Auto-schedule onboarding
  // Update CRM
  
  deal.autoClosed = true;
  return deal;
}

/**
 * Get payment statistics
 */
export function getPaymentStats() {
  return {
    totalRequests: paymentsDb.paymentRequests.length,
    totalPaid: paymentsDb.paymentRequests.filter(r => r.status === 'paid').length,
    totalPending: paymentsDb.paymentRequests.filter(r => r.status === 'pending').length,
    totalExpired: paymentsDb.paymentRequests.filter(r => r.status === 'expired').length,
    totalOutbound: paymentsDb.paymentSent.length,
    totalReceived: paymentsDb.paymentReceived.length,
    revenue: paymentsDb.paymentReceived.reduce((sum, p) => sum + (p.amount || 0), 0),
    expenses: paymentsDb.paymentSent.reduce((sum, p) => sum + (p.amount || 0), 0),
    byAutomationLevel: {
      manual: paymentsDb.pendingDeals.filter(d => d.automationLevel === 'manual').length,
      assisted: paymentsDb.pendingDeals.filter(d => d.automationLevel === 'assisted').length,
      full: paymentsDb.pendingDeals.filter(d => d.automationLevel === 'full').length
    }
  };
}

/**
 * Configure Toto's wallet
 */
export function configureWallet(config) {
  paymentsDb.wallet = {
    ...paymentsDb.wallet,
    ...config
  };
  savePaymentsDb(paymentsDb);
  console.log('[x402] Wallet configured:', config.address);
}

// Export configuration
export { X402_CONFIG };

// Default export
export default {
  generatePaymentRequest,
  processOutboundPayment,
  verifyPayment,
  finalizeDeal,
  getPaymentStats,
  configureWallet,
  X402_CONFIG
};

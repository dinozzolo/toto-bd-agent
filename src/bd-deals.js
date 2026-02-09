/**
 * BD Deal Management with x402 Integration
 * Automates deal closing from initial contact to payment
 */

import x402 from './x402-payments.js';
import { dbQueries } from './database.js';

/**
 * BD Service Tiers - Available packages Toto can sell
 */
const BD_SERVICES = {
  // Exchange Listing Packages
  LISTING_BASIC: {
    id: 'listing_basic',
    name: 'Basic Exchange Listing',
    price: 5000,
    currency: 'USDC',
    description: 'Standard exchange listing submission with basic marketing support',
    deliverables: [
      'Exchange listing application submission',
      'Basic social media announcement',
      'Community introduction post',
      'Standard support (email)'
    ],
    timeline: '2-4 weeks'
  },
  
  LISTING_PREMIUM: {
    id: 'listing_premium',
    name: 'Premium Exchange Listing',
    price: 15000,
    currency: 'USDC',
    description: 'Priority listing with enhanced marketing and KOL introductions',
    deliverables: [
      'Priority exchange listing submission',
      'Enhanced social media campaign',
      'KOL introduction (3-5 influencers)',
      'Press release distribution',
      'Dedicated support (Telegram)'
    ],
    timeline: '1-2 weeks'
  },
  
  LISTING_ENTERPRISE: {
    id: 'listing_enterprise',
    name: 'Enterprise Listing Package',
    price: 50000,
    currency: 'USDC',
    description: 'Full-service listing with dedicated support and market making',
    deliverables: [
      'White-glove listing service',
      'Comprehensive marketing campaign',
      'KOL partnerships (10+ influencers)',
      'Market making introduction',
      'Liquidity support consultation',
      '24/7 dedicated support',
      'Quarterly strategy reviews'
    ],
    timeline: '5-7 days'
  },
  
  // Marketing Packages
  MARKETING_BASIC: {
    id: 'marketing_basic',
    name: 'Basic Marketing Campaign',
    price: 3000,
    currency: 'USDC',
    description: 'Social media promotion and community engagement',
    deliverables: [
      'Twitter campaign (10 posts)',
      'Community engagement strategy',
      'Basic analytics report'
    ],
    timeline: '2 weeks'
  },
  
  MARKETING_PREMIUM: {
    id: 'marketing_premium',
    name: 'Premium Marketing Campaign',
    price: 10000,
    currency: 'USDC',
    description: 'Full marketing campaign with KOL partnerships',
    deliverables: [
      'Comprehensive social campaign',
      'KOL partnerships (5-8 influencers)',
      'Content creation (articles, threads)',
      'Community AMA setup',
      'Analytics and optimization'
    ],
    timeline: '4 weeks'
  },
  
  // Consultation
  CONSULTATION: {
    id: 'consultation',
    name: 'BD Strategy Consultation',
    price: 500,
    currency: 'USDC',
    description: 'One-on-one business development strategy session',
    deliverables: [
      '1-hour strategy call',
      'Custom BD roadmap',
      'Exchange targeting recommendations',
      'Follow-up summary document'
    ],
    timeline: '1 week'
  }
};

/**
 * Create a deal proposal for a project
 * @param {Object} project - Project from database
 * @param {string} serviceId - Service tier ID
 * @param {string} automationLevel - 'manual', 'assisted', or 'full'
 */
export async function createDealProposal(project, serviceId, automationLevel = 'manual') {
  // Get service by ID
  const serviceKey = Object.keys(BD_SERVICES).find(
    key => key.toLowerCase() === serviceId.toLowerCase() || 
           BD_SERVICES[key].id === serviceId
  );
  const service = BD_SERVICES[serviceKey];
  if (!service) {
    throw new Error(`Service not found: ${serviceId}`);
  }
  
  console.log(`[BD Deal] Creating proposal for ${project.name}`);
  console.log(`[BD Deal] Service: ${service.name}`);
  
  // Generate payment request
  const paymentRequest = await x402.generatePaymentRequest({
    projectId: project.id,
    projectName: project.name,
    serviceType: serviceId,
    clientWallet: null,
    automationLevel: automationLevel
  });
  
  // Create deal record
  const deal = {
    id: `deal_${Date.now()}`,
    projectId: project.id,
    projectName: project.name,
    projectTwitter: project.twitter_username,
    service: service,
    paymentRequest: paymentRequest,
    automationLevel: automationLevel,
    status: 'proposal_sent',
    createdAt: new Date().toISOString()
  };
  
  // Generate message
  deal.proposalMessage = generateProposalMessage(project, service, paymentRequest, automationLevel);
  
  console.log(`[BD Deal] Proposal created: ${deal.id}`);
  
  return deal;
}

/**
 * Generate proposal message
 */
function generateProposalMessage(project, service, paymentRequest, automationLevel) {
  const messages = {
    manual: `Hi ${project.name} team! 👋\n\nWe've reviewed your project and would love to help you get listed on exchanges. \n\nBased on your needs, I recommend our **${service.name}**:\n${service.description}\n\n💰 Investment: $${service.price} ${service.currency}\n⏱️ Timeline: ${service.timeline}\n\n**What's included:**\n${service.deliverables.map(d => `✅ ${d}`).join('\n')}\n\nI'm personally handling your case. Let me know if you'd like to proceed!\n\nPayment link: ${paymentRequest.x402Payload?.verification?.callbackUrl || 'Secure link'}`,

    assisted: `Hi ${project.name}! 🚀\n\nToto AI recommends our **${service.name}** for your project.\n\n${service.description}\n\nPackage details:\n💰 $${service.price} ${service.currency}\n⏱️ ${service.timeline}\n\nI'll prepare everything once you approve here: ${paymentRequest.x402Payload?.verification?.callbackUrl || 'Approval link'}`,

    full: `Hi ${project.name}! 🤖\n\nToto here - I recommend our **${service.name}**.\n\nPrice: $${service.price} ${service.currency}\nTimeline: ${service.timeline}\n\nPay instantly to begin: ${paymentRequest.x402Payload?.verification?.callbackUrl || 'Secure payment'}`
  };
  
  return messages[automationLevel] || messages.manual;
}

/**
 * Send deal proposal
 */
export async function sendProposal(deal, channel = 'twitter') {
  console.log(`[BD Deal] Sending proposal via ${channel}`);
  deal.sentAt = new Date().toISOString();
  return deal;
}

/**
 * Process payment and finalize deal
 */
export async function processDealPayment(dealId, paymentStatus) {
  console.log(`[BD Deal] Processing payment for ${dealId} - Status: ${paymentStatus}`);
  return { status: paymentStatus };
}

/**
 * Get deal analytics
 */
export function getDealAnalytics() {
  return x402.getPaymentStats();
}

/**
 * Automated deal closing workflow
 */
export async function automatedDealClosing(project, stage = 'initial') {
  console.log(`[BD Auto] Processing deal for ${project.name} - Stage: ${stage}`);
  return 'Processing...';
}

export { BD_SERVICES };

export default {
  createDealProposal,
  sendProposal,
  processDealPayment,
  getDealAnalytics,
  automatedDealClosing,
  BD_SERVICES
};

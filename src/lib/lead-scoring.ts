export interface LeadScoreCriteria {
  source: number;
  destinationCountry: number;
  productInterest: number;
  communicationMethod: number;
  responseTime: number;
  companySize: number;
  budget: number;
  urgency: number;
}

export const LEAD_SCORING_WEIGHTS: LeadScoreCriteria = {
  source: 20,
  destinationCountry: 15,
  productInterest: 25,
  communicationMethod: 10,
  responseTime: 15,
  companySize: 10,
  budget: 20,
  urgency: 15
};

export const calculateLeadScore = (lead: any): number => {
  let score = 0;
  
  // Source scoring
  const sourceScores: Record<string, number> = {
    'referral': 100,
    'tradeShow': 80,
    'website': 60,
    'whatsapp': 70,
    'facebookLeadAds': 50,
    'manual': 40
  };
  score += (sourceScores[lead.source] || 30) * (LEAD_SCORING_WEIGHTS.source / 100);
  
  // Destination country scoring
  const highValueCountries = ['USA', 'UK', 'Germany', 'France', 'Canada', 'Australia'];
  if (highValueCountries.includes(lead.destinationCountry)) {
    score += 100 * (LEAD_SCORING_WEIGHTS.destinationCountry / 100);
  }
  
  // Product interest scoring
  const highValueProducts = ['Cardamom', 'Saffron', 'Vanilla'];
  if (highValueProducts.includes(lead.productInterest)) {
    score += 100 * (LEAD_SCORING_WEIGHTS.productInterest / 100);
  }
  
  // Urgency factors
  if (lead.priority === 'hot') score += 50 * (LEAD_SCORING_WEIGHTS.urgency / 100);
  if (lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
    score += 30 * (LEAD_SCORING_WEIGHTS.urgency / 100);
  }
  
  return Math.min(100, Math.round(score));
};

export const getLeadGrade = (score: number): string => {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
};

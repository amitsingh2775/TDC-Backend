import { IClient, IMatchProfile, IMatchResult, IndustryTier, EducationTier } from '../interfaces';
import { PROFILE_POOL } from '../data/mockDb';

// Education ranking for compatibility checking
const EDU_TIER_RANK: Record<EducationTier, number> = {
  diploma: 1,
  tier3: 2,
  tier2: 3,
  tier1: 4,
  postgrad: 5,
  doctorate: 6,
};

// Cross-industry compatibility mapping
const INDUSTRY_COMPAT: Record<IndustryTier, IndustryTier[]> = {
  tech: ['tech', 'finance', 'business'],
  finance: ['finance', 'tech', 'business', 'legal'],
  medical: ['medical', 'government', 'education'],
  legal: ['legal', 'finance', 'government'],
  government: ['government', 'education', 'medical', 'legal'],
  arts: ['arts', 'business', 'education'],
  business: ['business', 'finance', 'tech', 'arts'],
  education: ['education', 'government', 'arts'],
  other: ['other', 'business', 'arts'],
};

export function runMatchingAlgorithm(
  client: IClient,
  limit: number = 20
): Array<{ candidate: IMatchProfile; algorithmScore: number }> {
  const gender = client.personal.gender;

  // Filter out candidates already sent
  const sentIds = new Set(client.sentMatches.map((m) => m.candidateId));
  const candidatePool = PROFILE_POOL.filter(
    (p) =>
      p.id !== client.id &&
      !sentIds.has(p.id) &&
      p.isActive
  );

  const scored: Array<{ candidate: IMatchProfile; algorithmScore: number }> = [];

  for (const candidate of candidatePool) {
    const score = gender === 'male'
      ? scoreMaleClient(client, candidate)
      : scoreFemaleClient(client, candidate);

    if (score > 0) {
      scored.push({ candidate, algorithmScore: score });
    }
  }

  return scored
    .sort((a, b) => b.algorithmScore - a.algorithmScore)
    .slice(0, limit);
}

// ----------------------------------------------------
// MALE CUSTOMER LOGIC
// ----------------------------------------------------
function scoreMaleClient(client: IClient, candidate: IMatchProfile): number {
  if (candidate.personal.gender !== 'female') return 0;

  let score = 0;

  // 1. Must be younger
  if (candidate.personal.age >= client.personal.age) return 0; 
  const ageDiff = client.personal.age - candidate.personal.age;
  if (ageDiff >= 1 && ageDiff <= 4) score += 25;
  else if (ageDiff >= 5 && ageDiff <= 7) score += 15;
  else if (ageDiff > 7) score += 5;

  // 2. Must be shorter
  if (candidate.personal.heightCm >= client.personal.heightCm) return 0; 
  const heightDiff = client.personal.heightCm - candidate.personal.heightCm;
  if (heightDiff >= 5 && heightDiff <= 15) score += 20;
  else if (heightDiff > 15) score += 10;

  // 3. Must earn less
  if (candidate.professional.annualIncomeLPA >= client.professional.annualIncomeLPA) return 0;
  const incomeRatio = candidate.professional.annualIncomeLPA / client.professional.annualIncomeLPA;
  if (incomeRatio >= 0.5) score += 15;
  else score += 8;

  // 4. Matching views on children
  // Note: Added safe navigation (?) in case preferences object is undefined
  if (client.preferences?.wantKids !== candidate.preferences?.wantKids) return 0;
  score += 20;

  // --- Cultural & Lifestyle Boosts ---
  if (client.cultural.religion === candidate.cultural.religion) score += 10;
  if (client.preferences?.openToRelocation === candidate.preferences?.openToRelocation) score += 5;
  if (client.cultural.diet === candidate.cultural.diet) score += 5;
  if (client.personal.city === candidate.personal.city) score += 5;

  return Math.min(Math.round(score), 100);
}

// ----------------------------------------------------
// FEMALE CUSTOMER LOGIC
// ----------------------------------------------------
function scoreFemaleClient(client: IClient, candidate: IMatchProfile): number {
  if (candidate.personal.gender !== 'male') return 0;

  let score = 0;

  // 1. Income Compatibility (Male should earn generally equal or more)
  if (candidate.professional.annualIncomeLPA < client.professional.annualIncomeLPA * 0.9) return 0;
  score += 15;

  // 2. Height Compatibility (Male should be same height or taller)
  if (candidate.personal.heightCm < client.personal.heightCm) return 0;
  
  // 3. Age Compatibility (Male should be older or same age)
  const ageDiff = candidate.personal.age - client.personal.age;
  if (ageDiff < 0) return 0; 
  if (ageDiff >= 0 && ageDiff <= 4) score += 10;
  else if (ageDiff > 4 && ageDiff <= 7) score += 5;

  // 4. Values (Diet) Compatibility
  if (client.cultural.diet === 'vegetarian' && candidate.cultural.diet === 'non-vegetarian') return 0;

  // 5. Relocation Logic Fix
  // If she doesn't want to move, he MUST be from the same city OR willing to move
  if (!client.preferences?.openToRelocation) {
    if (client.personal.city !== candidate.personal.city && !candidate.preferences?.openToRelocation) {
      return 0; 
    }
  } else {
    score += 10; // Boost if she is flexible
  }

  // 6. Industry/Profession Compatibility
  const compatibleIndustries = INDUSTRY_COMPAT[client.professional.industryTier] ?? [];
  if (!compatibleIndustries.includes(candidate.professional.industryTier)) return 0;
  if (client.professional.industryTier === candidate.professional.industryTier) score += 20;
  else score += 10;

  // 7. Education Rank Logic
  const clientEduRank = EDU_TIER_RANK[client.education.educationTier];
  const candidateEduRank = EDU_TIER_RANK[candidate.education.educationTier];
  const eduDiff = candidateEduRank - clientEduRank; 
  if (eduDiff >= 0) score += 15;
  else if (eduDiff === -1) score += 5; // Slight drop but acceptable
  else return 0; // Huge drop in education tier -> reject

  // 8. Matching views on children
  if (client.preferences?.wantKids !== candidate.preferences?.wantKids) return 0;
  score += 10;

  // --- Cultural & Lifestyle Boosts ---
  if (client.cultural.religion === candidate.cultural.religion) score += 10;
  if (client.cultural.diet === candidate.cultural.diet) score += 5;
  
  // Manglik specific Indian context check
  if (
    client.cultural.manglik === 'doesnt-matter' ||
    candidate.cultural.manglik === 'doesnt-matter' ||
    client.cultural.manglik === candidate.cultural.manglik
  ) {
    score += 5;
  }

  return Math.min(Math.round(score), 100);
}

// ----------------------------------------------------
// EXPORT TOP MATCHES
// ----------------------------------------------------
export function getTopMatches(client: IClient, topN: number = 5): IMatchResult[] {
  const results = runMatchingAlgorithm(client, topN);
  return results.map(({ candidate, algorithmScore }) => ({
    candidate,
    algorithmScore,
    aiScore: null as any,       // Will be populated by AI service later
    introEmail: null as any,    // Will be populated by AI service later
  }));
}
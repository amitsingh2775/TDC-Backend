import { IClient, IMatchProfile, IAIMatchScore, IAIIntroEmail } from '../interfaces';
import { AIConfig, getOpenAIClient, getGoogleClient } from '../config';

function buildProfileSummary(p: IMatchProfile | IClient, role: 'CLIENT' | 'CANDIDATE'): string {
  const get = (val: any, fallback = 'N/A') => val ?? fallback;
  return `
=== ${role} PROFILE ===
Name: ${p.personal.firstName} ${p.personal.lastName}
Age: ${p.personal.age} | Gender: ${p.personal.gender} | Height: ${p.personal.heightCm}cm
Location: ${get(p.personal.city)}, ${get((p as any).personal.state)}
Religion: ${get(p.cultural.religion)} | Caste: ${get(p.cultural.caste)} | Manglik: ${get(p.cultural.manglik)}
Diet: ${get(p.cultural.diet)}
Education: ${p.education.highestDegree} from ${p.education.collegeOrUniversity}
Occupation: ${p.professional.occupation} at ${p.professional.company}
Annual Income: ₹${p.professional.annualIncomeLPA}L PA
Open to Relocation: ${p.preferences?.openToRelocation ? 'Yes' : 'No'}
Wants Kids: ${p.preferences?.wantKids ? 'Yes' : 'No'} | Open to Pets: ${p.preferences?.openToPets ? 'Yes' : 'No'}
Bio: "${(p as any).bio || 'No bio provided'}"
`.trim();
}

// ── COMBINED PROMPT: Ek hi call mein Score aur Email dono mangenge ──
function buildCombinedAIPrompt(client: IClient, candidate: IMatchProfile): string {
  return `You are Priya, a senior matchmaker at "The Date Crew (TDC)". Evaluate compatibility and write an intro email.
  
  ${buildProfileSummary(client, 'CLIENT')}
  ${buildProfileSummary(candidate, 'CANDIDATE')}
  
  TASK: Return ONLY a valid JSON object with exactly this structure:
  {
    "score": <0-100>,
    "label": "<Exceptional Match | High Potential | Good Fit | Average Compatibility | Low Compatibility>",
    "rationale": "<2 sentences explaining why they are compatible>",
    "keyHighlights": ["<trait 1>", "<trait 2>"],
    "emailSubject": "<Catchy subject line for client>",
    "emailBody": "<Warm email body introducing the candidate to the client>",
    "emailSignOff": "Warm regards, Priya"
  }`.trim();
}

async function callLLM(prompt: string): Promise<string> {
  try {
    if (AIConfig.PROVIDER === 'google') {
      const genai = getGoogleClient();
      const result = await genai.models.generateContent({ model: AIConfig.GOOGLE_MODEL, contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      return result.text ?? '{}';
    } else {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: AIConfig.OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      return response.choices[0]?.message?.content ?? '{}';
    }
  } catch (err: any) {
    console.error(`[AI-Service] LLM Call Failed:`, err.message);
    throw err;
  }
}

function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    console.error(`[AI-Service] JSON Parse Error`);
    return fallback;
  }
}

// ── SEQUENTIAL ENRICHMENT: API Rate Limit se bachne ke liye ──
export async function enrichMatchesWithAI(
  client: IClient,
  matches: Array<{ candidate: IMatchProfile; algorithmScore: number }>
) {
  console.log(`[AI-Service] Sequentially enriching ${matches.length} matches to prevent Rate Limits...`);
  const enriched = [];

  for (const m of matches) {
    const fallbackScore: IAIMatchScore = { score: m.algorithmScore, label: 'Analysis Pending', rationale: 'AI busy.', keyHighlights: [] };
    const fallbackEmail: IAIIntroEmail = { subject: 'New Match', body: 'Please review this profile.', signOff: 'Regards' };
    
    try {
      console.log(`[AI-Service] Evaluating candidate: ${m.candidate.personal.firstName}...`);
      const raw = await callLLM(buildCombinedAIPrompt(client, m.candidate));
      const parsed = safeParseJSON<any>(raw, {});

      const aiScore: IAIMatchScore = {
        score: parsed.score ?? fallbackScore.score,
        label: parsed.label ?? fallbackScore.label,
        rationale: parsed.rationale ?? fallbackScore.rationale,
        keyHighlights: parsed.keyHighlights ?? fallbackScore.keyHighlights,
      };

      const introEmail: IAIIntroEmail = {
        subject: parsed.emailSubject ?? fallbackEmail.subject,
        body: parsed.emailBody ?? fallbackEmail.body,
        signOff: parsed.emailSignOff ?? fallbackEmail.signOff,
      };

      enriched.push({ ...m, aiScore, introEmail });
      
      // Delay to avoid hitting OpenAI limits (800ms)
      await new Promise(resolve => setTimeout(resolve, 800)); 
    } catch (err) {
      console.error(`[AI-Service] Failed for candidate ${m.candidate.id}`);
      enriched.push({ ...m, aiScore: fallbackScore, introEmail: fallbackEmail });
    }
  }

  return enriched.sort((a, b) => b.aiScore.score - a.aiScore.score);
}
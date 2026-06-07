

import { Request, Response, NextFunction } from 'express';
import { CLIENTS, PROFILE_POOL } from '../data/mockDb';
import { IApiSuccess, ISentMatch } from '../interfaces';
import { AppError } from '../middleware/errorHandler';
import { getTopMatches } from '../services/matchService';
import { enrichMatchesWithAI } from '../services/aiService';


export async function getMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const matcherId = req.matcher?.matcherId;

    const client = CLIENTS.find((c) => c.id === id);
    if (!client) throw new AppError(`Client with ID "${id}" not found.`, 404);
    if (client.assignedMatcherId !== matcherId) {
      throw new AppError('Access denied. This client is not assigned to you.', 403);
    }

    // Step 1: Run heuristic matching algorithm → get top 5 raw matches
    const topN = parseInt(String(req.query['topN']), 10) || 5;
    const rawMatches = getTopMatches(client, topN);

    if (rawMatches.length === 0) {
      res.json({
        success: true,
        message: 'No suitable matches found at this time. The algorithm found no candidates matching all criteria.',
        data: {
          clientId: id,
          clientName: `${client.personal.firstName} ${client.personal.lastName}`,
          matches: [],
          generatedAt: new Date().toISOString(),
        },
      });
      return;
    }

 
    const enriched = await enrichMatchesWithAI(client, rawMatches);

    // Step 3: Shape response
    const matches = enriched.map((m) => ({
      candidateId: m.candidate.id,
      candidateName: `${m.candidate.personal.firstName} ${m.candidate.personal.lastName}`,
      candidateSummary: {
        age: m.candidate.personal.age,
        city: m.candidate.personal.city,
        occupation: m.candidate.professional.occupation,
        company: m.candidate.professional.company,
        industryTier: m.candidate.professional.industryTier,
        incomeLPA: m.candidate.professional.annualIncomeLPA,
        religion: m.candidate.cultural.religion,
        caste: m.candidate.cultural.caste,
        education: `${m.candidate.education.highestDegree} — ${m.candidate.education.collegeOrUniversity}`,
        openToRelocation: m.candidate.preferences.openToRelocation,
        wantKids: m.candidate.wantKids,
        openToPets: m.candidate.openToPets,
        bio: m.candidate.bio,
      },
      scores: {
        algorithmScore: m.algorithmScore,
        aiScore: m.aiScore,
      },
      introEmail: m.introEmail,
    }));

    res.json({
      success: true,
      message: `Found ${matches.length} AI-enriched matches for ${client.personal.firstName}.`,
      data: {
        clientId: id,
        clientName: `${client.personal.firstName} ${client.personal.lastName}`,
        matches,
        generatedAt: new Date().toISOString(),
      },
    } satisfies IApiSuccess<{
      clientId: string;
      clientName: string;
      matches: typeof matches;
      generatedAt: string;
    }>);
  } catch (err) {
    next(err);
  }
}

export async function sendMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matcherId = req.matcher?.matcherId;
    const { clientId, candidateId } = req.body as { clientId: string; candidateId: string };

    if (!clientId || !candidateId) {
      throw new AppError('Both clientId and candidateId are required.', 400);
    }

    const client = CLIENTS.find((c) => c.id === clientId);
    if (!client) throw new AppError(`Client with ID "${clientId}" not found.`, 404);
    if (client.assignedMatcherId !== matcherId) {
      throw new AppError('Access denied. This client is not assigned to you.', 403);
    }

    const candidate = PROFILE_POOL.find((p) => p.id === candidateId);
    if (!candidate) throw new AppError(`Candidate with ID "${candidateId}" not found.`, 404);

    // Check if already sent
    const alreadySent = client.sentMatches.some((m) => m.candidateId === candidateId);
    if (alreadySent) {
      throw new AppError(
        `This match has already been sent to ${client.personal.firstName}. Check the sent matches log.`,
        409
      );
    }

    // Append to in-memory log
    const sentRecord: ISentMatch = {
      candidateId,
      sentAt: new Date().toISOString(),
      matcherId: matcherId ?? '',
      status: 'sent',
    };

    client.sentMatches.push(sentRecord);

    // Simulate async email delivery
    const simulatedEmail = {
      to: `${client.personal.firstName.toLowerCase()}.${client.personal.lastName.toLowerCase()}@example.com`,
      subject: `[TDC] A Special Introduction for You 💌`,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      messageId: `msg-${Date.now()}`,
    };

    console.log(
      `[matchController] Match sent — Client: ${client.personal.firstName} → Candidate: ${candidate.personal.firstName} | by Matcher: ${matcherId}`
    );

    res.status(201).json({
      success: true,
      message: `Introduction successfully sent to ${client.personal.firstName} ${client.personal.lastName}!`,
      data: {
        matchLog: sentRecord,
        emailSimulation: simulatedEmail,
        totalSentMatches: client.sentMatches.length,
      },
    });
  } catch (err) {
    next(err);
  }
}


export async function getSentMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { clientId } = req.params as { clientId: string };
    const matcherId = req.matcher?.matcherId;

    const client = CLIENTS.find((c) => c.id === clientId);
    if (!client) throw new AppError(`Client with ID "${clientId}" not found.`, 404);
    if (client.assignedMatcherId !== matcherId) {
      throw new AppError('Access denied.', 403);
    }

    // Hydrate candidate details
    const hydratedMatches = client.sentMatches.map((sm) => {
      const candidate = PROFILE_POOL.find((p) => p.id === sm.candidateId);
      return {
        ...sm,
        candidateName: candidate
          ? `${candidate.personal.firstName} ${candidate.personal.lastName}`
          : 'Unknown',
        candidateOccupation: candidate?.professional.occupation ?? 'N/A',
        candidateCity: candidate?.personal.city ?? 'N/A',
      };
    });

    res.json({
      success: true,
      data: {
        clientId,
        clientName: `${client.personal.firstName} ${client.personal.lastName}`,
        sentMatches: hydratedMatches,
        total: hydratedMatches.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

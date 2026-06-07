

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CLIENTS, MATCHMAKERS } from '../data/mockDb';
import { IApiSuccess, IMatcherNote, NoteType } from '../interfaces';
import { AppError } from '../middleware/errorHandler';

export async function getAllClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matcherId = req.matcher?.matcherId;
    const matcher = MATCHMAKERS.find((m) => m.id === matcherId);

    if (!matcher) throw new AppError('Matchmaker account not found.', 404);

    
    const assignedClients = CLIENTS.filter((c) =>
      matcher.assignedClientIds.includes(c.id)
    );

    res.json({
      success: true,
      data: assignedClients, 
    });
  } catch (err) {
    next(err);
  }
}

export async function getClientById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const matcherId = req.matcher?.matcherId;

    const client = CLIENTS.find((c) => c.id === id);
    if (!client) throw new AppError(`Client with ID "${id}" not found.`, 404);

  
    if (client.assignedMatcherId !== matcherId) {
      throw new AppError('Access denied. This client is not assigned to you.', 403);
    }

    res.json({
      success: true,
      data: client,
    } satisfies IApiSuccess<typeof client>);
  } catch (err) {
    next(err);
  }
}


export async function addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const matcherId = req.matcher?.matcherId;

    const { text, type = 'general' } = req.body as { text: string; type?: NoteType };

    if (!text || text.trim().length === 0) {
      throw new AppError('Note text cannot be empty.', 400);
    }
    if (text.length > 2000) {
      throw new AppError('Note text cannot exceed 2000 characters.', 400);
    }

    const client = CLIENTS.find((c) => c.id === id);
    if (!client) throw new AppError(`Client with ID "${id}" not found.`, 404);
    if (client.assignedMatcherId !== matcherId) {
      throw new AppError('Access denied. This client is not assigned to you.', 403);
    }

    const validNoteTypes: NoteType[] = ['general', 'feedback', 'meeting', 'follow-up'];
    if (!validNoteTypes.includes(type)) {
      throw new AppError(`Invalid note type. Must be one of: ${validNoteTypes.join(', ')}.`, 400);
    }

    const newNote: IMatcherNote = {
      id: `note-${uuidv4()}`,
      text: text.trim(),
      type,
      createdAt: new Date().toISOString(),
      matcherId: matcherId ?? '',
    };

    // Mutate in-memory store (mock DB)
    client.notes.push(newNote);

    res.status(201).json({
      success: true,
      message: 'Note added successfully.',
      data: {
        note: newNote,
        totalNotes: client.notes.length,
      },
    } satisfies IApiSuccess<{ note: IMatcherNote; totalNotes: number }>);
  } catch (err) {
    next(err);
  }
}

export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const matcherId = req.matcher?.matcherId;

    const client = CLIENTS.find((c) => c.id === id);
    if (!client) throw new AppError(`Client with ID "${id}" not found.`, 404);
    if (client.assignedMatcherId !== matcherId) {
      throw new AppError('Access denied.', 403);
    }

    const sorted = [...client.notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      data: {
        clientId: id,
        clientName: `${client.personal.firstName} ${client.personal.lastName}`,
        notes: sorted,
        total: sorted.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

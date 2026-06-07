
import { Request, Response, NextFunction } from 'express';
import { PROFILE_POOL } from '../data/mockDb';
import { IApiSuccess } from '../interfaces';

export async function getPool(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Return all active profiles from the pool
    const activeProfiles = PROFILE_POOL.filter(p => p.isActive);

    res.json({
      success: true,
      message: `Successfully fetched ${activeProfiles.length} profiles from the pool.`,
      data: activeProfiles,
    } satisfies IApiSuccess<typeof activeProfiles>);
  } catch (err) {
    next(err);
  }
}
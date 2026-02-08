// Clubs API - placeholder until backend supports clubs (Step 24+)
// Mirrors web API structure for future integration

export interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

// Placeholder - will call backend when clubs feature is implemented
export async function listMyClubs(): Promise<Club[]> {
  return [];
}

export async function listClubs(): Promise<Club[]> {
  return [];
}

export async function getClub(id: string): Promise<Club | null> {
  return null;
}

export async function createClub(_body: { name: string; description?: string }): Promise<Club> {
  throw new Error('Clubs coming soon');
}

export async function joinClub(_id: string): Promise<void> {
  throw new Error('Clubs coming soon');
}

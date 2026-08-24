import { describe, it, expect } from 'vitest';
import { computeScorecard, computeResidentDashboardStats } from '../src/utils/scorecardHelpers.js';

describe('performance scorecard', () => {
  it('computes councillor scorecard from ward data', () => {
    const result = computeScorecard(
      [{ status: 'Completed' }, { status: 'In Progress' }],
      [{ status: 'forwarded_to_councillor' }],
      [{ id: 'p1' }],
      [{ id: 'a1' }, { id: 'a2' }],
    );
    expect(Number(result.overall)).toBeGreaterThan(0);
    expect(result.ratings.delivery).toBeGreaterThanOrEqual(1);
    expect(result.ratings.transparency).toBe(4);
  });

  it('computes resident dashboard stats', () => {
    const stats = computeResidentDashboardStats(
      [{ status: 'Completed', averageRating: 4 }, { status: 'In Progress' }],
      [{ status: 'Pending' }],
      [{ status: 'pending' }],
    );
    expect(stats.totalProjects).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.openRequests).toBe(1);
    expect(stats.openComplaints).toBe(1);
    expect(stats.avgRating).toBe(4);
  });
});

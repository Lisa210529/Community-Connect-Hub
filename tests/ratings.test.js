import { describe, it, expect } from 'vitest';
import { canRateProjectStatus, computeOverallScore } from '../src/constants/ratings.js';

describe('project rating module', () => {
  it('allows rating for funded/completed statuses', () => {
    expect(canRateProjectStatus('Funded')).toBe(true);
    expect(canRateProjectStatus('Completed')).toBe(true);
    expect(canRateProjectStatus('Pending')).toBe(false);
  });

  it('computes average overall score from categories', () => {
    const scores = {
      category1Score: 4,
      category2Score: 5,
      category3Score: 3,
      category4Score: 4,
      category5Score: 4,
    };
    expect(computeOverallScore(scores)).toBe(4);
  });
});

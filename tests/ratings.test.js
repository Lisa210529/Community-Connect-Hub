import { describe, it, expect } from 'vitest';
import {
  canRateProjectStatus,
  canResidentRateProject,
  computeOverallScore,
  computeProjectMidDate,
  getRatingEligibility,
  isRatingWindowOpen,
} from '../src/constants/ratings.js';

describe('project rating module', () => {
  it('allows rating for funded/in-progress/completed statuses', () => {
    expect(canRateProjectStatus('Funded')).toBe(true);
    expect(canRateProjectStatus('In Progress')).toBe(true);
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

  it('computes mid-date between start and end', () => {
    const mid = computeProjectMidDate('2026-01-01', '2026-01-31');
    expect(mid.toISOString().slice(0, 10)).toBe('2026-01-16');
  });

  it('blocks rating before mid-date but allows after', () => {
    const project = {
      status: 'In Progress',
      startDate: '2026-06-01',
      endDate: '2026-12-31',
    };
    const beforeMid = new Date('2026-08-01');
    const afterMid = new Date('2026-10-01');

    expect(isRatingWindowOpen(project, beforeMid)).toBe(false);
    expect(isRatingWindowOpen(project, afterMid)).toBe(true);
    expect(canResidentRateProject(project, { alreadyRated: false, now: beforeMid })).toBe(false);
    expect(canResidentRateProject(project, { alreadyRated: false, now: afterMid })).toBe(true);
  });

  it('allows rating completed projects after mid-date', () => {
    const project = {
      status: 'Completed',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    };
    expect(canResidentRateProject(project, { now: new Date('2026-05-01') })).toBe(true);
  });

  it('allows legacy projects without dates when status is rateable', () => {
    expect(canResidentRateProject({ status: 'Funded' })).toBe(true);
  });

  it('returns eligibility reason before mid-date', () => {
    const project = {
      status: 'Funded',
      startDate: '2026-06-01',
      endDate: '2026-12-31',
    };
    const result = getRatingEligibility(project, { now: new Date('2026-07-01') });
    expect(result.canRate).toBe(false);
    expect(result.reason).toBe('before_mid_date');
    expect(result.midDate).toBeTruthy();
  });
});

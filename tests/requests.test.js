import { describe, it, expect } from 'vitest';
import {
  normalizeRequestStatus,
  isProjectRequest,
  filterProjectRequests,
  groupRequestsByCategory,
} from '../src/utils/wdcHelpers.js';

describe('request management helpers', () => {
  it('normalizes request status strings', () => {
    expect(normalizeRequestStatus('Pending')).toBe('pending');
    expect(normalizeRequestStatus('FORWARDED_TO_COUNCILLOR')).toBe('forwarded_to_councillor');
  });

  it('detects project vs letter requests', () => {
    expect(isProjectRequest({ requestType: 'project' })).toBe(true);
    expect(isProjectRequest({ requestType: 'letter' })).toBe(false);
  });

  it('filters project requests only', () => {
    const list = [
      { id: '1', requestType: 'project', category: 'Road' },
      { id: '2', requestType: 'letter', category: 'Reference' },
    ];
    expect(filterProjectRequests(list)).toHaveLength(1);
    expect(filterProjectRequests(list)[0].id).toBe('1');
  });

  it('groups requests by category when threshold met', () => {
    const requests = [
      { id: 'a', requestType: 'project', category: 'Water', residentId: 'r1' },
      { id: 'b', requestType: 'project', category: 'Water', residentId: 'r2' },
      { id: 'c', requestType: 'project', category: 'Water', residentId: 'r3' },
    ];
    const groups = groupRequestsByCategory(requests, 3);
    expect(groups).toHaveLength(1);
    expect(groups[0].residentCount).toBe(3);
    expect(groups[0].isCommunityNeed).toBe(true);
  });
});

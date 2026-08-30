import { describe, it, expect } from 'vitest';
import { answerAssistantQuestion } from '../src/services/assistantService';
import { ASSISTANT_SCOPE_MESSAGE } from '../src/constants/assistantKnowledge';

describe('assistantService', () => {
  it('answers in-scope questions about system purpose', () => {
    const result = answerAssistantQuestion('What is Community Connect Hub?');
    expect(result.inScope).toBe(true);
    expect(result.answer).toContain('Digital Governance');
    expect(result.answer).toContain('Madang Province');
  });

  it('answers registration questions', () => {
    const result = answerAssistantQuestion('How do I register as a resident?');
    expect(result.inScope).toBe(true);
    expect(result.answer).toContain('Get Started');
    expect(result.answer).toContain('NID');
  });

  it('answers how to use the system with a step guide', () => {
    const result = answerAssistantQuestion('how can I use it');
    expect(result.inScope).toBe(true);
    expect(result.answer).toContain('1. Register');
    expect(result.matchedId).toBe('getting-started');
  });

  it('answers login questions phrased conversationally', () => {
    const result = answerAssistantQuestion('how can I log in');
    expect(result.inScope).toBe(true);
    expect(result.answer).toContain('How to log in');
    expect(result.answer).toContain('Forgot Password');
    expect(result.matchedId).toBe('login');
  });
  it('rejects out-of-scope questions', () => {
    const result = answerAssistantQuestion('What is the weather in Port Moresby today?');
    expect(result.inScope).toBe(false);
    expect(result.answer).toBe(ASSISTANT_SCOPE_MESSAGE);
  });

  it('rejects unrelated general knowledge', () => {
    const result = answerAssistantQuestion('Who won the FIFA World Cup?');
    expect(result.inScope).toBe(false);
    expect(result.answer).toBe(ASSISTANT_SCOPE_MESSAGE);
  });
});

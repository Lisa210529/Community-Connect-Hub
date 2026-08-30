import { describe, it, expect } from 'vitest';
import {
  buildCharacterReferenceLetter,
  buildLetterContent,
  buildStatutoryDeclarationLetter,
  buildSupportLetter,
  formatCouncillorWardTitle,
} from '../src/utils/letterTemplates';

describe('letterTemplates', () => {
  it('formats ward title for councillor office line', () => {
    expect(formatCouncillorWardTitle('Ward 5', '5')).toBe('Ward Five (05)');
  });

  it('builds MULLG character reference matching official template', () => {
    const content = buildCharacterReferenceLetter({
      residentName: 'Basil Poma',
      ward: 'Ward 5',
      wardNumber: '5',
      councillorName: 'Mr Julius Savin',
      date: '2026-08-29',
    });

    expect(content).toContain('MADANG URBAN\nLOCAL LEVEL\nGOVERNMENT');
    expect(content).toContain('Striving for Beauty');
    expect(content).toContain('P.O BOX 2107');
    expect(content).toContain('Office of the Councilor Ward Five (05) Mr Julius Savin');
    expect(content).toContain('TO WHOM IT MAY CONCERN');
    expect(content).toContain('CHARACTER REFERENCE – BASIL POMA (MR/MRS)');
    expect(content).toContain('I have known Basil Poma for the last [___] years');
    expect(content).toContain('associate members of my Ward area');
    expect(content).toContain('I certify that the statement herein is true in every particular');
    expect(content).toContain('CR. JULIUS SAVIN');
  });

  it('builds PNG statutory declaration matching official form', () => {
    const content = buildStatutoryDeclarationLetter({
      residentName: 'Basil Poma',
      ward: 'Ward 5',
      wardNumber: '5',
      councillorName: 'Mr Julius Savin',
      purpose: 'I declare that I am a resident of Ward 5.',
      date: '2026-08-29',
    });

    expect(content).toContain('PAPUA NEW GUINEA\nSTATUTORY DECLARATION');
    expect(content).toContain('I, (a) Basil Poma of Ward 5, Madang Urban LLG, Madang Province');
    expect(content).toContain('Oaths, Affirmation and Statutory Declarations Acts 1962');
    expect(content).toContain('Declared at MADANG');
    expect(content).toContain('Ward Councillor, Ward Five (05) — Mr Julius Savin');
    expect(content).toContain('willfully makes a false statement');
  });

  it('selects reference template by letter type', () => {
    const content = buildLetterContent({
      letterType: 'reference',
      residentName: 'Jane Doe',
      ward: 'Ward 5',
      wardNumber: '5',
      councillorName: 'Councillor Test',
    });

    expect(content).toContain('CHARACTER REFERENCE – JANE DOE (MR/MRS)');
  });

  it('selects statutory declaration template by letter type', () => {
    const content = buildLetterContent({
      letterType: 'statutory_declaration',
      residentName: 'Jane Doe',
      ward: 'Ward 5',
      wardNumber: '5',
      councillorName: 'Councillor Test',
      purpose: 'Employment verification.',
    });

    expect(content).toContain('STATUTORY DECLARATION');
    expect(content).toContain('Employment verification.');
  });

  it('selects support template for support letters', () => {
    const content = buildLetterContent({
      letterType: 'support',
      residentName: 'Jane Doe',
      ward: 'Ward 5',
      wardNumber: '5',
      councillorName: 'Councillor Test',
      purpose: 'School enrolment',
    });

    expect(content).toContain('Letter of Support for JANE DOE');
    expect(content).toContain('School enrolment');
  });
});

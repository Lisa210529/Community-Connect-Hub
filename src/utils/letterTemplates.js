import { formatOfficialDate } from './fileHelpers';

const WARD_WORDS = [
  '', 'One', 'Two', 'Three', 'Four', 'Five',
  'Six', 'Seven', 'Eight', 'Nine', 'Ten',
];

const MULLG_CONTACT = `MADANG URBAN
LOCAL LEVEL
GOVERNMENT
Striving for Beauty

P.O BOX 2107
MADANG 511
MADANG PROVINCE
TELEPHONE: 4222633
FACSIMILE: 4222653
DIGICEL: 70523281`;

function extractWardNumber(ward = '', wardNumber = '') {
  if (wardNumber) return Number(wardNumber);
  const match = String(ward).match(/\d+/);
  return match ? Number(match[0]) : null;
}

/** e.g. Ward 5 → "Ward Five (05)" */
export function formatCouncillorWardTitle(ward = '', wardNumber = '') {
  const num = extractWardNumber(ward, wardNumber);
  if (!num || num < 1 || num > 10) {
    return String(ward).trim() || '________________';
  }
  const padded = String(num).padStart(2, '0');
  return `Ward ${WARD_WORDS[num]} (${padded})`;
}

function formatResidentSubjectName(name = '') {
  const trimmed = String(name).trim();
  return trimmed ? trimmed.toUpperCase() : '________________';
}

function formatCouncillorSignatureName(name = '') {
  const trimmed = String(name).trim();
  if (!trimmed) return 'CR. ________________';
  const withoutTitle = trimmed.replace(/^(mr|mrs|ms|miss|dr|cr\.?)\s+/i, '').trim();
  return `CR. ${withoutTitle.toUpperCase()}`;
}

function resolveResidentName(name = '') {
  return String(name).trim() || '[Name]';
}

function resolveDeclarationMatter(description = '') {
  const text = String(description ?? '').trim();
  return text || '[Insert the matter declared to. Where the matter is long, set out in numbered paragraphs.]';
}

function resolveDeclarationAddress(ward = '', zone = '') {
  const wardLabel = String(ward).trim() || '________________';
  if (zone && zone !== 'All Ward') {
    return `${wardLabel}, ${zone}, Madang Urban LLG, Madang Province`;
  }
  return `${wardLabel}, Madang Urban LLG, Madang Province`;
}

function splitDeclarationDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) {
    return { day: '___', month: '___________', year: new Date().getFullYear() };
  }
  return {
    day: String(value.getDate()),
    month: value.toLocaleDateString('en-PG', { month: 'long' }),
    year: value.getFullYear(),
  };
}

/**
 * Madang Urban LLG character reference — matches official councillor letterhead template.
 * @see docs/assets — Office of the Councilor Ward [N] template
 */
export function buildCharacterReferenceLetter({
  residentName = '',
  ward = '',
  wardNumber = '',
  councillorName = 'Ward Councillor',
  date = new Date(),
} = {}) {
  const formattedDate = formatOfficialDate(date);
  const name = resolveResidentName(residentName);
  const subjectName = formatResidentSubjectName(residentName);
  const wardTitle = formatCouncillorWardTitle(ward, wardNumber);
  const councillorLine = String(councillorName).trim() || '________________';
  const signatureLine = formatCouncillorSignatureName(councillorName);

  return `${MULLG_CONTACT}

DATE: ${formattedDate}
FILE:
ACTION OFFICER:
DESIGNATION:
EMAIL:

Office of the Councilor ${wardTitle} ${councillorLine}

TO WHOM IT MAY CONCERN

Dear Sir/Madam,

CHARACTER REFERENCE – ${subjectName} (MR/MRS)

I have known ${name} for the last [___] years since [his/her] childhood, living in the above ward area.

${name} is one of the associate members of my Ward area. [He/She] is an honest, reliable, and hardworking [man/woman] who enjoys working in indoor and outdoor activities and has good leadership qualities with Christian principles.

I certify that the statement herein is true in every particular.

Your response in assisting [him/her] would be very much appreciated.

For further information, please contact the undersigned.

Yours faithfully,


${signatureLine}`;
}

/** Support letter — kept for non-reference letter requests. */
export function buildSupportLetter({
  residentName = '',
  ward = '',
  wardNumber = '',
  councillorName = 'Ward Councillor',
  purpose = '',
  date = new Date(),
} = {}) {
  const formattedDate = formatOfficialDate(date);
  const resident = resolveResidentName(residentName);
  const wardTitle = formatCouncillorWardTitle(ward, wardNumber);
  const purposeText = resolveDeclarationMatter(purpose);
  const signatureLine = formatCouncillorSignatureName(councillorName);

  return `${MULLG_CONTACT}

DATE: ${formattedDate}

Office of the Councilor ${wardTitle} ${councillorName}

Re: Letter of Support for ${resident.toUpperCase()}

Dear Sir/Madam,

I, ${councillorName}, Ward Councillor for ${wardTitle}, Madang Urban Local Level Government, Madang Province, write to confirm that ${resident} is a resident of the above ward and is known to me as a responsible member of our community.

This letter is issued in support of the following matter:

${purposeText}

I respectfully recommend favourable consideration of this request.

Yours faithfully,


${signatureLine}`;
}

/**
 * Papua New Guinea Statutory Declaration — matches official PNG form template.
 */
export function buildStatutoryDeclarationLetter({
  residentName = '',
  ward = '',
  wardNumber = '',
  councillorName = 'Ward Councillor',
  purpose = '',
  zone = '',
  date = new Date(),
} = {}) {
  const resident = resolveResidentName(residentName);
  const address = resolveDeclarationAddress(ward, zone);
  const matter = resolveDeclarationMatter(purpose);
  const { day, month, year } = splitDeclarationDate(date);
  const wardTitle = formatCouncillorWardTitle(ward, wardNumber);
  const witnessTitle = `Ward Councillor, ${wardTitle}`;

  return `PAPUA NEW GUINEA
STATUTORY DECLARATION

I, (a) ${resident} of ${address}
do solemnly and sincerely declare that (b)

${matter}

And I make this solemn declaration by virtue of the Oaths, Affirmation and Statutory Declarations Acts 1962 conscientiously believing the statements contained therein to be true in every particular.

Declared at MADANG                          (c) _________________________________
The ${day} day of ${month}, ${year}         Before me
                                            (d) _________________________________
                                            (e) ${witnessTitle} — ${councillorName}

(a) Here insert name, address and occupation of person making the declaration.
(b) Here insert the matter declared to. Where the matter is long, it should be set out in numbered paragraphs.
(c) Signature of person making the declaration.
(d) Signature of person before whom the declaration is made.
(e) Here insert title of person before whom the declaration is made.

Note: Any person who willfully makes a false statement in a Statutory Declaration is guilty of an indictable Offence, and is liable of imprisonment, with or without hard labour, for four years.`;
}

/** Pick the correct letter draft for a resident request. */
export function buildLetterContent({
  letterType = 'reference',
  category = '',
  residentName = '',
  ward = '',
  wardNumber = '',
  councillorName = 'Ward Councillor',
  purpose = '',
  zone = '',
  date = new Date(),
} = {}) {
  const normalizedType = String(letterType ?? '').toLowerCase().replace(/\s+/g, '_');
  const normalizedCategory = String(category ?? '').toLowerCase();

  const isReference =
    normalizedType === 'reference' ||
    normalizedCategory.includes('reference') ||
    normalizedCategory.includes('character');

  if (isReference) {
    return buildCharacterReferenceLetter({
      residentName,
      ward,
      wardNumber,
      councillorName,
      date,
    });
  }

  if (normalizedType === 'statutory_declaration' || normalizedCategory.includes('statutory')) {
    return buildStatutoryDeclarationLetter({
      residentName,
      ward,
      wardNumber,
      councillorName,
      purpose,
      zone,
      date,
    });
  }

  return buildSupportLetter({
    residentName,
    ward,
    wardNumber,
    councillorName,
    purpose,
    date,
  });
}

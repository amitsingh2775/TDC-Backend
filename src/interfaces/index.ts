

export type Gender = 'male' | 'female' | 'non-binary';
export type MaritalStatus = 'never-married' | 'divorced' | 'widowed' | 'separated';
export type Diet = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'jain' | 'eggetarian';
export type Manglik = 'yes' | 'no' | 'partial' | 'doesnt-matter';
export type Religion =
  | 'hindu'
  | 'muslim'
  | 'christian'
  | 'sikh'
  | 'jain'
  | 'buddhist'
  | 'parsi'
  | 'other';
export type EducationTier = 'tier1' | 'tier2' | 'tier3' | 'diploma' | 'postgrad' | 'doctorate';
export type IndustryTier = 'tech' | 'finance' | 'medical' | 'legal' | 'government' | 'arts' | 'business' | 'education' | 'other';
export type ClientStatus = 'active' | 'paused' | 'matched' | 'closed';
export type NoteType = 'general' | 'feedback' | 'meeting' | 'follow-up';

// ── Core Profile Entity ────────────────────────

export interface IPersonalDetails {
  firstName: string;
  lastName: string;
  age: number;                  
  dateOfBirth: string;        
  gender: Gender;
  heightCm: number;             
  weightKg: number;
  complexion: string;           
  maritalStatus: MaritalStatus;
  city: string;
  state: string;
  country: string;
  nationality: string;
  nativePlace: string;
  photoUrl?: string;
}

export interface ICulturalDetails {
  religion: Religion;
  caste: string;               
  subCaste?: string;
  gotra?: string;             
  manglik: Manglik;
  motherTongue: string;
  diet: Diet;
  smokingHabit: 'never' | 'occasionally' | 'regularly';
  drinkingHabit: 'never' | 'occasionally' | 'regularly';
}

export interface IEducationDetails {
  highestDegree: string;       
  educationTier: EducationTier;
  collegeOrUniversity: string;
  fieldOfStudy: string;
  graduationYear: number;
}

export interface IProfessionalDetails {
  occupation: string;          
  company: string;
  industryTier: IndustryTier;
  annualIncomeLPA: number;     
  workCity: string;
  designation: string;
  
}

export interface IFamilyDetails {
  fatherOccupation: string;
  motherOccupation: string;
  siblings: number;
  familyType: 'joint' | 'nuclear';
  familyValues: 'traditional' | 'moderate' | 'liberal';
  familyStatus: 'middle-class' | 'upper-middle-class' | 'affluent' | 'high-net-worth';
}

export interface IPartnerPreferences {
  minAge: number;
  maxAge: number;
  minHeightCm: number;
  maxHeightCm: number;
  preferredReligions: Religion[];
  preferredCastes: string[];   
  preferredDiet: Diet[];
  preferredIndustries: IndustryTier[];
  minIncomeLPA: number;
  wantKids: boolean;
  openToPets: boolean;
  preferredLocations: string[];
  manglikPreference: Manglik;
  openToInterCaste: boolean;
  openToInterReligion: boolean;
  notes?: string;
  openToRelocation: boolean;
}


export interface IMatchProfile {
  id: string;
  personal: IPersonalDetails;
  cultural: ICulturalDetails;
  education: IEducationDetails;
  professional: IProfessionalDetails;
  family: IFamilyDetails;
  preferences: IPartnerPreferences;
  wantKids: boolean;
  openToPets: boolean;
  bio: string;
  isActive: boolean;
  createdAt: string;
}



export interface IMatcherNote {
  id: string;
  text: string;
  type: NoteType;
  createdAt: string;
  matcherId: string;
}

export interface ISentMatch {
  candidateId: string;
  sentAt: string;
  matcherId: string;
  status: 'sent' | 'viewed' | 'interested' | 'declined';
}

export interface IClient extends IMatchProfile {
  status: ClientStatus;
  assignedMatcherId: string;
  notes: IMatcherNote[];
  sentMatches: ISentMatch[];
  onboardedAt: string;
}



export interface IMatchmaker {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  assignedClientIds: string[];
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthPayload {
  matcherId: string;
  email: string;
  name: string;
}

// ── AI Service Responses ───────────────────────

export interface IAIMatchScore {
  score: number;               
  label: string;               
  rationale: string;          
  keyHighlights: string[];     
}

export interface IAIIntroEmail {
  subject: string;
  body: string;
  signOff: string;
}

export interface IMatchResult {
  candidate: IMatchProfile;
  algorithmScore: number;       
  aiScore: IAIMatchScore | null;
  introEmail: IAIIntroEmail | null;
}



export interface IApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface IApiError {
  success: false;
  error: string;
  details?: string;
  statusCode: number;
}


export interface IAuthenticatedRequest extends Express.Request {
  matcher?: IAuthPayload;
}

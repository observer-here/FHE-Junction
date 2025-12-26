export enum Role {
  None = 0,
  Individual = 1,
  Company = 2,
}

export enum EducationLevel {
  Bachelor = 0,
  Master = 1,
  PhD = 2,
  Other = 3,
}

export enum WorkPreference {
  Remote = 0,
  Hybrid = 1,
  OnSite = 2,
}

export enum PrimaryField {
  Software = 0,
  Banking = 1,
  AI = 2,
  Web3 = 3,
  Other = 4,
}

export enum Sex {
  Male = 0,
  Female = 1,
  Other = 2,
}

export interface IndividualProfile {
  expectedSalary: number;
  experience: number;
  education: EducationLevel;
  sex: Sex;
  contactEmail?: any;
  contactPhone?: any;
  version: number;
  exists: boolean;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  website: string;
  contactEmail: string;
  location: string;
  owner: string;
  exists: boolean;
}

export interface Job {
  company: string;
  title: string;
  location: string;
  workPreference: WorkPreference;
  primaryField: PrimaryField;
  maxSalary: any;
  minExperience: any;
  minEducation: any;
  preferredSex: any;
  applicationDeadline: bigint;
  vacancyCount: number;
  exists: boolean;
}

export interface Application {
  salary: any;
  experience: any;
  education: any;
  sex: any;
  profileVersion: number;
  contactEmail: any;
  contactPhone: any;
  eligible: any;
  evaluated: boolean;
  applied: boolean;
}


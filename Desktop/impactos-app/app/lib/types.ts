export type Project = {
  id: number;
  title: string;
  description: string;
  location: string;
  beneficiaries: string;
  fundingGoal: number;
  raised: number;
  createdAt?: string;
};

export type ProjectFormData = {
  title: string;
  description: string;
  location: string;
  beneficiaries: string;
  fundingGoal: number;
};

export type Donation = {
  id: number;
  amount: number;
  donorName: string | null;
  createdAt: string;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  location: string;
  beneficiaries: string;
  fundingGoal: number;
  raised: number;
  createdAt?: string;
  donations?: Donation[];
};

export type ProjectFormData = {
  title: string;
  description: string;
  location: string;
  beneficiaries: string;
  fundingGoal: number;
};

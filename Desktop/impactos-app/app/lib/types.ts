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
  status: string;
  createdAt?: string;
  donations?: Donation[];
  owner?: { name: string | null; email: string | null };
};

export type ProjectFormData = {
  title: string;
  description: string;
  location: string;
  beneficiaries: string;
  fundingGoal: number;
};

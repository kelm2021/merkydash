

export interface User {
  id: string;
  userId: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userWalletId?: string | null;
  userType?: string | null;
  companyName?: string | null;
  userName?: string | null;
  isAdmin: boolean;
  totalETHarvested: number;
  totalMERCRewards: number;
}

export interface StakingRecord {
  id: string;
  stakerAddress: string;
  stakedAmount: number;
  lockPeriod: number;
  apy: number;
  rewardsEarned: number;
  stakingDate: Date;
  chain: 'ETH' | 'BASE';
  status: 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN';
  createdAt: Date;
  updatedAt: Date;
  userId?: string | null;
  user?: User | null;
  stakingHash?: string | null;
  transactionType?: 'ONCHAIN' | 'AUTO_RESTAKED' | null;
}

export interface AggregatedUserStaking {
  userId: string | null;
  userDisplayName: string; // Name or wallet address
  walletAddress: string;
  totalStakedMERC: number;
  totalMERCRewards: number;
  totalETHarvested: number;
  rewardsPaidOut: number;
  rewardsUnpaid: number;
  activeRecordsCount: number;
  firstName?: string | null;
  lastName?: string | null;
}

export interface StakingSummary {
  totalStaked: number;
  totalStakers: number;
  totalRewards: number;
  ethStaked: number;
  baseStaked: number;
  activeStakers: number;
}

export interface CreateStakingRecord {
  stakerAddress: string;
  stakedAmount: number;
  lockPeriod: number;
  apy: number;
  rewardsEarned?: number;
  stakingDate: string;
  chain: 'ETH' | 'BASE';
  status?: 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN';
  stakingHash?: string;
  transactionType?: 'ONCHAIN' | 'AUTO_RESTAKED';
}

export interface UpdateStakingRecord extends Partial<CreateStakingRecord> {
  id: string;
}


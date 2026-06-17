export const PLANTATION_ROUND_ABI = [
  'function createRound(string cropType, uint256 targetCUSD, uint256 pricePerShareCUSD, uint256 harvestDeadline, string metadataURI) returns (uint256)',
  'function invest(uint256 roundId, uint256 shareCount)',
  'function unlockCapital(uint256 roundId)',
  'function distributeHarvest(uint256 roundId, uint256 totalSaleCUSD)',
  'function claimDistribution(uint256 tokenId)',
  'function getRound(uint256 roundId) view returns (tuple(address farmer, string cropType, uint256 targetCUSD, uint256 pricePerShareCUSD, uint256 totalShares, uint256 sharesSold, uint256 harvestDeadline, string metadataURI, uint8 status, uint256 totalDistributionCUSD))',
  'function getTokenInfo(uint256 tokenId) view returns (tuple(uint256 roundId, uint256 shareIndex, uint256 claimedCUSD))',
  'event RoundCreated(uint256 indexed roundId, address indexed farmer, string cropType, uint256 targetCUSD)',
  'event SharesPurchased(uint256 indexed roundId, address indexed investor, uint256[] tokenIds)',
  'event CapitalUnlocked(uint256 indexed roundId, address indexed farmer, uint256 amount)',
  'event HarvestDistributed(uint256 indexed roundId, uint256 totalCUSD)',
];

export const GROVE_STAKING_ABI = [
  'function stake(uint256 tokenId)',
  'function unstake(uint256 tokenId)',
  'function claimYield(uint256 tokenId)',
  'function pendingYield(uint256 tokenId) view returns (uint256)',
  'event Staked(uint256 indexed tokenId, address indexed owner)',
  'event Unstaked(uint256 indexed tokenId, address indexed owner)',
  'event YieldClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount)',
];

/**
 * Commission calculation utilities for different commission structures
 */

// Commission structure types
export enum CommissionStructureType {
  FLAT_RATE = 'flat_rate',
  PER_PARTICIPANT = 'per_participant',
  TIERED_PARTICIPANT = 'tiered_participant',
  PERCENTAGE = 'percentage'
}

// Configuration interfaces for different structure types
export interface FlatRateConfig {
  rate: number;
}

export interface PerParticipantConfig {
  ratePerParticipant: number;
}

export interface TieredParticipantConfig {
  tiers: Array<{
    min: number;
    max: number;
    rate: number;
  }>;
}

export interface PercentageConfig {
  percentage: number;
}

// Union type for all possible configurations
export type CommissionConfig = 
  | FlatRateConfig
  | PerParticipantConfig
  | TieredParticipantConfig
  | PercentageConfig;

/**
 * Calculate commission amount based on structure type and parameters
 * @param structureType The type of commission structure
 * @param configData Configuration data (as a JSON string or parsed object)
 * @param participantCount Number of participants
 * @param transactionValue Optional transaction value (required for percentage-based calculations)
 * @returns Calculated commission amount
 */
export function calculateCommission(
  structureType: CommissionStructureType,
  configData: string | object,
  participantCount: number,
  transactionValue?: number
): number {
  // Parse config if it's a string
  const config = typeof configData === 'string' 
    ? JSON.parse(configData) 
    : configData;

  switch (structureType) {
    case CommissionStructureType.FLAT_RATE:
      return calculateFlatRate(config as FlatRateConfig);

    case CommissionStructureType.PER_PARTICIPANT:
      return calculatePerParticipant(config as PerParticipantConfig, participantCount);

    case CommissionStructureType.TIERED_PARTICIPANT:
      return calculateTieredParticipant(config as TieredParticipantConfig, participantCount);

    case CommissionStructureType.PERCENTAGE:
      if (transactionValue === undefined) {
        throw new Error('Transaction value is required for percentage-based calculations');
      }
      return calculatePercentage(config as PercentageConfig, transactionValue);

    default:
      // Fallback to simple per participant calculation if unknown structure type
      return participantCount * 2; // Default $2 per participant
  }
}

/**
 * Calculate flat rate commission
 */
function calculateFlatRate(config: FlatRateConfig): number {
  return config.rate;
}

/**
 * Calculate per-participant commission
 */
function calculatePerParticipant(
  config: PerParticipantConfig,
  participantCount: number
): number {
  return config.ratePerParticipant * participantCount;
}

/**
 * Calculate tiered participant-based commission
 */
function calculateTieredParticipant(
  config: TieredParticipantConfig,
  participantCount: number
): number {
  // Find the applicable tier
  const tier = config.tiers.find(
    t => participantCount >= t.min && (t.max === -1 || participantCount <= t.max)
  );

  // Use the tier rate or default to the last tier's rate
  const rate = tier?.rate || config.tiers[config.tiers.length - 1]?.rate || 2;
  
  return rate * participantCount;
}

/**
 * Calculate percentage-based commission
 */
function calculatePercentage(
  config: PercentageConfig,
  transactionValue: number
): number {
  return (config.percentage / 100) * transactionValue;
}

/**
 * Format the commission structure for display
 */
export function formatCommissionStructure(
  structureType: CommissionStructureType,
  configData: string | object
): string {
  const config = typeof configData === 'string' 
    ? JSON.parse(configData) 
    : configData;

  switch (structureType) {
    case CommissionStructureType.FLAT_RATE:
      return `Flat rate: $${(config as FlatRateConfig).rate.toFixed(2)}`;

    case CommissionStructureType.PER_PARTICIPANT:
      return `$${(config as PerParticipantConfig).ratePerParticipant.toFixed(2)} per participant`;

    case CommissionStructureType.TIERED_PARTICIPANT:
      return `Tiered: ${(config as TieredParticipantConfig).tiers.length} tiers`;

    case CommissionStructureType.PERCENTAGE:
      return `${(config as PercentageConfig).percentage.toFixed(2)}% of transaction value`;

    default:
      return 'Unknown structure';
  }
}
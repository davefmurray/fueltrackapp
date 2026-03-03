/**
 * Calculate fuel reimbursement per the JJ Service Fixed Operations LLC contract.
 *
 * Formula: (Excess Miles ÷ Vehicle MPG) × Gas Price per Gallon
 * Excess Miles = max(0, Total Daily Miles - Round-Trip Commute Miles)
 */

export function calculateExcessMiles(
  totalMiles: number,
  commuteMiles: number
): number {
  return Math.max(0, totalMiles - commuteMiles);
}

export function calculateReimbursement(
  excessMiles: number,
  vehicleMpg: number,
  gasPricePerGallon: number
): number {
  if (vehicleMpg <= 0) return 0;
  return (excessMiles / vehicleMpg) * gasPricePerGallon;
}

export function calculateDailyReimbursement(params: {
  startMiles: number;
  endMiles: number;
  commuteMiles: number;
  vehicleMpg: number;
  gasPricePerGallon: number;
}): { totalMiles: number; excessMiles: number; reimbursement: number } {
  const totalMiles = Math.max(0, params.endMiles - params.startMiles);
  const excessMiles = calculateExcessMiles(totalMiles, params.commuteMiles);
  const reimbursement = calculateReimbursement(
    excessMiles,
    params.vehicleMpg,
    params.gasPricePerGallon
  );

  return {
    totalMiles: Math.round(totalMiles * 100) / 100,
    excessMiles: Math.round(excessMiles * 100) / 100,
    reimbursement: Math.round(reimbursement * 100) / 100,
  };
}

import api from '../../utils/axios';

/**
 * Fetches real aggregate token efficiency telemetry from backend.
 * @returns {Promise<Object>}
 */
export async function getTokenEfficiency() {
  try {
    const { data } = await api.get("/api/agent/research/analytics");
    return data?.tokenEfficiency || {
      tokensSaved: 0,
      contextReductionPercent: 0,
      totalExecutions: 0,
      fullContextEstimate: 0,
      cortexContext: 0,
      mechanisms: {}
    };
  } catch (error) {
    console.warn("[getTokenEfficiency] Failed to fetch token efficiency telemetry:", error?.message);
    return {
      tokensSaved: 0,
      contextReductionPercent: 0,
      totalExecutions: 0,
      fullContextEstimate: 0,
      cortexContext: 0,
      mechanisms: {}
    };
  }
}

export default getTokenEfficiency;

import api from '../../utils/axios';

/**
 * Fetch supported AI model providers and connection status
 */
export async function getProviders() {
  try {
    const { data } = await api.get('/api/auth/providers');
    return data;
  } catch (error) {
    console.error('[getProviders Error]', error?.message);
    return {
      providers: [],
      hasCompletedOnboarding: false,
      securityInfo: { encryption: 'AES-256-GCM', keysStoredSecurely: true }
    };
  }
}

/**
 * Securely connect an API key with AES-256-GCM encryption
 */
export async function connectProvider(provider, apiKey) {
  try {
    const { data } = await api.post('/api/auth/providers/connect', { provider, apiKey });
    return data;
  } catch (error) {
    console.error('[connectProvider Error]', error?.response?.data || error?.message);
    throw error?.response?.data || { message: error.message || 'Connection failed' };
  }
}

/**
 * Disconnect a provider key
 */
export async function disconnectProvider(provider) {
  try {
    const { data } = await api.delete(`/api/auth/providers/${provider}`);
    return data;
  } catch (error) {
    console.error('[disconnectProvider Error]', error?.message);
    throw error?.response?.data || { message: 'Disconnect failed' };
  }
}

/**
 * Mark onboarding workflow completed
 */
export async function completeOnboarding() {
  try {
    const { data } = await api.post('/api/auth/onboarding/complete');
    return data;
  } catch (error) {
    console.error('[completeOnboarding Error]', error?.message);
    return { success: false };
  }
}

/**
 * Get comprehensive profile stats
 */
export async function getUserProfile() {
  try {
    const { data } = await api.get('/api/auth/profile');
    return data;
  } catch (error) {
    console.error('[getUserProfile Error]', error?.message);
    return null;
  }
}

/**
 * Fetch past task executions with full breakdown and telemetry
 */
export async function getExecutions(limit = 20) {
  try {
    const { data } = await api.get(`/api/agent/executions?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[getExecutions Error]', error?.message);
    return [];
  }
}

import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import api from '../services/api';

// Shared threshold for unlocking messaging and other gates
export const PROFILE_GATE_THRESHOLD = 80;

// Normalize any API value to 0–100 scale and clamp/round
export function toPercent100(p) {
  const n = Number(p);
  if (Number.isNaN(n) || n == null) return 0;
  // Handle 0–1 range (e.g., 0.91 => 91)
  const raw = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Normalize missingFields to an array<string>
 */
function normalizeMissingFields(missing) {
  if (!missing) return [];
  if (Array.isArray(missing)) return missing;
  if (typeof missing === 'object') return Object.values(missing).flat().filter(Boolean);
  return [];
}

/**
 * Local completion calculation for VA profiles
 */
function computeLocalVA(profile) {
  if (!profile) return { percentage: 0, missingFields: [] };

  const isDefaultName = profile.name === profile.email?.split('@')[0];

  const requiredFields = [
    { field: 'name', weight: 10, check: () => profile.name?.trim() && !isDefaultName && profile.name.length > 2 },
    { field: 'hero', weight: 10, check: () => {
      const heroValue = profile.hero || profile.heroStatement;
      return heroValue?.trim() && heroValue.length > 10;
    }},
    { field: 'bio', weight: 15, check: () => profile.bio?.trim() && profile.bio.length >= 100 },
    { field: 'location', weight: 10, check: () => {
      if (profile.location) {
        if (typeof profile.location === 'object' && profile.location !== null) {
          const hasCity = profile.location.city?.trim();
          const hasProvince = profile.location.province?.trim() || profile.location.state?.trim();
          return !!(hasCity && hasProvince);
        } else if (typeof profile.location === 'string') {
          return true;
        }
      }
      return !!(profile.city?.trim() && (profile.state?.trim() || profile.province?.trim()));
    }},
    { field: 'email', weight: 10, check: () => profile.email?.trim() && profile.email.includes('@') },
    { field: 'specialties', weight: 15, check: () => profile.specialties?.length > 0 || profile.specialtyIds?.length > 0 },
    { field: 'roleType', weight: 5, check: () => !!(profile.roleType && (typeof profile.roleType === 'string' || profile.roleType._id)) },
    { field: 'roleLevel', weight: 5, check: () => !!(profile.roleLevel && (typeof profile.roleLevel === 'string' || profile.roleLevel._id)) },
    { field: 'hourlyRate', weight: 10, check: () =>
      Number(profile.preferredMinHourlyRate) > 0 &&
      Number(profile.preferredMaxHourlyRate) > 0 &&
      Number(profile.preferredMaxHourlyRate) >= Number(profile.preferredMinHourlyRate)
    },
    { field: 'phone', weight: 5, check: () => profile.phone?.trim() && profile.phone.length >= 10 },
    { field: 'onlinePresence', weight: 5, check: () => profile.website?.trim() || profile.linkedin?.trim() },
    { field: 'discAssessment', weight: 10, check: () => profile.discAssessment?.primaryType }
  ];

  const totalWeight = requiredFields.reduce((sum, f) => sum + f.weight, 0);
  const completedWeight = requiredFields.reduce((sum, f) => sum + (f.check() ? f.weight : 0), 0);
  const percentage = Math.round((completedWeight / totalWeight) * 100);
  const missingFields = requiredFields.filter(f => !f.check()).map(f => f.field);

  return { percentage, missingFields };
}

/**
 * Local completion calculation for Business profiles
 */
function computeLocalBusiness(profile) {
  if (!profile) return { percentage: 0, missingFields: [] };

  const requiredFields = [
    { field: 'contactName', weight: 15, check: () => profile.contactName?.trim() && profile.contactName.length > 2 },
    { field: 'company', weight: 15, check: () => profile.company?.trim() && profile.company.length > 2 },
    { field: 'bio', weight: 15, check: () => profile.bio?.trim() && profile.bio.length >= 50 },
    { field: 'email', weight: 10, check: () => profile.email?.trim() && profile.email.includes('@') },
    { field: 'phone', weight: 10, check: () => profile.phone?.trim() && profile.phone.length >= 10 },
    { field: 'industry', weight: 10, check: () => profile.industry?.trim() },
    { field: 'employeeCount', weight: 5, check: () => Number(profile.employeeCount) > 0 },
    { field: 'website', weight: 10, check: () => profile.website?.trim() },
    { field: 'location', weight: 10, check: () => {
      if (profile.location) {
        if (typeof profile.location === 'object' && profile.location !== null) {
          const hasCity = profile.location.city?.trim();
          const hasProvince = profile.location.province?.trim() || profile.location.state?.trim();
          return !!(hasCity && hasProvince);
        } else if (typeof profile.location === 'string') {
          return true;
        }
      }
      return !!(profile.city?.trim() && (profile.state?.trim() || profile.province?.trim()));
    }},
  ];

  const totalWeight = requiredFields.reduce((sum, f) => sum + f.weight, 0);
  const completedWeight = requiredFields.reduce((sum, f) => sum + (f.check() ? f.weight : 0), 0);
  const percentage = Math.round((completedWeight / totalWeight) * 100);
  const missingFields = requiredFields.filter(f => !f.check()).map(f => f.field);

  return { percentage, missingFields };
}

/**
 * Single source of truth for profile completion across the app.
 */
export function useProfileCompletion(options = {}) {
  const { user } = useAuth();
  const { branding } = useBranding();

  const query = useQuery({
    queryKey: ['profile-completion', user?.id, branding?.isESystemsMode],
    queryFn: async ({ signal }) => {
      if (!user) {
        return { percent: 0, source: 'none', lastUpdated: Date.now(), missingFields: [], eligible: false };
      }

      // Concurrent requests with graceful failure
      const completionReq = api.get('/profile/completion', { signal }).catch(() => null);
      const profileReq = branding?.isESystemsMode
        ? api.get('/profile/business', { signal }).catch(() => null)
        : api.get('/users/profile', { signal }).catch(() => null);
      const vaMeReq = branding?.isESystemsMode
        ? Promise.resolve(null)
        : api.get('/vas/me', { signal }).catch(() => null);

      const [completionRes, profileRes, vaRes] = await Promise.all([completionReq, profileReq, vaMeReq]);

      // Extract explicit API completion
      const explicitRaw = completionRes?.data?.profileCompletion || completionRes?.data?.completion || null;
      const explicitPct = toPercent100(
        typeof explicitRaw?.percentage === 'number' ? explicitRaw.percentage : explicitRaw?.percentage
      );
      const explicitMissing = explicitRaw ? normalizeMissingFields(explicitRaw.missingFields) : [];

      // Extract from profile payloads
      const profileData = profileRes?.data || {};
      const userLevelRaw = profileData?.user?.profileCompletion || profileData?.profileCompletion || null;
      const userLevelPct = toPercent100(
        typeof userLevelRaw?.percentage === 'number' ? userLevelRaw.percentage : userLevelRaw?.percentage
      );
      const userLevelMissing = userLevelRaw ? normalizeMissingFields(userLevelRaw.missingFields) : [];

      // Concrete profile for local calculation
      let vaProfile = null;
      let businessProfile = null;
      if (branding?.isESystemsMode) {
        businessProfile = profileData?.data || null;
      } else {
        vaProfile = profileData?.data?.va || null;
        if (!vaProfile) vaProfile = vaRes?.data?.data || null;
      }

      const localCalc = branding?.isESystemsMode
        ? computeLocalBusiness(businessProfile)
        : computeLocalVA(vaProfile);
      const localPct = toPercent100(localCalc.percentage || 0);

      const candidates = [
        { label: 'api', value: explicitPct, missing: explicitMissing },
        { label: 'user', value: userLevelPct, missing: userLevelMissing },
        { label: 'local', value: localPct, missing: localCalc.missingFields || [] },
      ];

      // Highest non-zero wins
      let best = candidates.reduce((acc, cur) => (cur.value > acc.value ? cur : acc), { label: 'none', value: 0, missing: [] });

      // Persist/restore last non-zero value
      const cacheKey = 'profileCompletion:lastPercent';
      const cacheAtKey = 'profileCompletion:lastUpdated';
      const cached = Number(localStorage.getItem(cacheKey) || 0);
      const cachedAt = Number(localStorage.getItem(cacheAtKey) || 0);

      if (best.value === 0 && cached > 0) {
        best = { label: 'cached', value: cached, missing: [] };
      }

      if (best.value > 0 && best.label !== 'cached') {
        localStorage.setItem(cacheKey, String(best.value));
        localStorage.setItem(cacheAtKey, String(Date.now()));
      }

      const percent100 = toPercent100(best.value || 0);
      const eligible = percent100 >= PROFILE_GATE_THRESHOLD;

      return {
        percent: percent100,
        source: best.label,
        lastUpdated: best.label === 'cached' ? cachedAt : Date.now(),
        missingFields: best.missing || [],
        eligible
      };
    },
    enabled: !!user,
    staleTime: options.staleTime ?? 0,
    refetchInterval: options.refetchInterval ?? 4000,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    refetchOnReconnect: options.refetchOnReconnect ?? true,
    refetchOnMount: options.refetchOnMount ?? 'always',
  });

  const data = query.data ?? { percent: 0, source: 'none', lastUpdated: 0, missingFields: [], eligible: false };

  return useMemo(() => ({
    percent: data.percent,
    source: data.source,
    isLoading: query.isLoading,
    error: query.error ?? null,
    lastUpdated: data.lastUpdated,
    missingFields: data.missingFields,
    eligible: data.eligible
  }), [data.percent, data.source, query.isLoading, query.error, data.lastUpdated, data.missingFields, data.eligible]);
}

export default useProfileCompletion;
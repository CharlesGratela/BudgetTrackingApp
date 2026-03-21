import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  getDefaultLandingPath,
  getDefaultPreferencesForUser,
  getPreferenceSetupError,
  normalizeUserPreferences,
} from "@/lib/preferences";
import type { UserPreferences, UserPreferencesInput } from "@/types/preferences";

const USER_PREFERENCES_QUERY_KEY = "user-preferences";

export const useUserPreferences = (userId?: string) =>
  useQuery({
    queryKey: [USER_PREFERENCES_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserPreferences> => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw getPreferenceSetupError(error);
      }

      if (!data) {
        return getDefaultPreferencesForUser(userId!);
      }

      return normalizeUserPreferences(data);
    },
  });

export const useSaveUserPreferences = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UserPreferencesInput) => {
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            ...payload,
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();

      if (error) {
        throw getPreferenceSetupError(error);
      }

      return normalizeUserPreferences(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [USER_PREFERENCES_QUERY_KEY, userId] });
    },
  });
};

export const getUserDefaultLandingPath = async (userId?: string) => {
  if (!userId) {
    return "/dashboard";
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("default_landing_page")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return "/dashboard";
  }

  const landingPage = data?.default_landing_page ?? "dashboard";
  return getDefaultLandingPath(landingPage);
};

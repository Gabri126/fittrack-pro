import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, checkSupabaseHealth } from '../lib/supabase';

const SupabaseContext = createContext(null);

export function useSupabase() {
  return useContext(SupabaseContext);
}

export default function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseHealth, setSupabaseHealth] = useState({ ok: true, error: null });

  // ---------- Supabase Health Check ----------
  useEffect(() => {
    checkSupabaseHealth().then(status => {
      setSupabaseHealth(status);
    });
  }, []);

  // ---------- Network status ----------
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // ---------- Auth listener ----------
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---------- Profile helpers ----------
  const fetchProfile = async (userId) => {
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      localStorage.setItem('fittrack_profile_cache', JSON.stringify(data));
    }
    return data;
  };

  const updateProfile = async (updates) => {
    if (!supabase || !session?.user) return;
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, ...updates }, { onConflict: 'id' })
      .select()
      .single();
    if (data) {
      setProfile(data);
      localStorage.setItem('fittrack_profile_cache', JSON.stringify(data));
    }
    return { data, error };
  };

  // ---------- Auth actions ----------
  const signInWithEmail = async (email, password) => {
    if (!supabase) return { error: { message: 'Servizio non disponibile. Verifica la connessione.' } };
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUpWithEmail = async (email, password, username) => {
    if (!supabase) return { error: { message: 'Servizio non disponibile. Verifica la connessione.' } };
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: { message: 'Servizio non disponibile. Verifica la connessione.' } };
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    localStorage.removeItem('fittrack_profile_cache');
  };

  // ---------- Plan sharing ----------
  const sharePlan = async (plan) => {
    if (!supabase || !session?.user) return { error: 'Non autenticato' };
    const slug = `${plan.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from('shared_plans').insert({
      creator_id: session.user.id,
      plan_data: plan,
      slug
    }).select().single();
    return { data, slug, error };
  };

  const fetchSharedPlan = async (slug) => {
    if (!supabase) return { data: null, error: 'Offline' };
    const { data, error } = await supabase
      .from('shared_plans')
      .select('*, profiles!creator_id(username, avatar_url)')
      .eq('slug', slug)
      .single();
    return { data, error };
  };

  // ---------- Social / friendships ----------
  const followUser = async (targetUserId) => {
    if (!supabase || !session?.user) return;
    return supabase.from('friendships').upsert({
      follower_id: session.user.id,
      following_id: targetUserId
    }, { onConflict: 'follower_id,following_id' });
  };

  const unfollowUser = async (targetUserId) => {
    if (!supabase || !session?.user) return;
    return supabase.from('friendships')
      .delete()
      .match({ follower_id: session.user.id, following_id: targetUserId });
  };

  const searchUsers = async (query) => {
    if (!supabase || !query) return [];
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level, xp')
      .ilike('username', `%${query}%`)
      .limit(10);
    return data || [];
  };

  const getFeed = async () => {
    if (!supabase || !session?.user) return [];
    // Get who I follow
    const { data: friends } = await supabase
      .from('friendships')
      .select('following_id')
      .eq('follower_id', session.user.id);
    if (!friends || friends.length === 0) return [];

    const friendIds = friends.map(f => f.following_id);
    // Get their recent shared sessions (stored as shared_plans with type 'session_log')
    const { data: feed } = await supabase
      .from('shared_plans')
      .select('*, profiles!creator_id(username, avatar_url)')
      .in('creator_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(20);
    return feed || [];
  };

  // ---------- Sync helper ----------
  const syncLocalData = useCallback(async (library, history) => {
    if (!supabase || !session?.user || !isOnline) return;
    // Upsert user's local data to profiles as a backup
    await supabase.from('profiles').upsert({
      id: session.user.id,
      local_library_backup: library,
      local_history_backup: history,
      last_sync: new Date().toISOString()
    }, { onConflict: 'id' });
  }, [session, isOnline]);

  // Load cached profile when offline
  useEffect(() => {
    if (!profile && !session) {
      const cached = localStorage.getItem('fittrack_profile_cache');
      if (cached) {
        try { setProfile(JSON.parse(cached)); } catch { }
      }
    }
  }, [profile, session]);

  const value = {
    supabase,
    session,
    profile,
    loading,
    isOnline,
    supabaseHealth,
    // Auth
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    // Profile
    fetchProfile,
    updateProfile,
    // Sharing
    sharePlan,
    fetchSharedPlan,
    // Social
    followUser,
    unfollowUser,
    searchUsers,
    getFeed,
    // Sync
    syncLocalData,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

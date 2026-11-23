import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys injected via Expo environment variables (optional)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with database
// Fails gracefully if keys aren't provided yet so offline apps never crash
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Auth: Sign In with Email & Password
 */
export const signInUser = async (email, password) => {
  if (!supabase) return { error: { message: 'Servicio de nube no configurado. La app opera 100% localmente.' } };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { data, error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Auth: Sign Up with Email & Password
 */
export const signUpUser = async (email, password) => {
  if (!supabase) return { error: { message: 'Servicio de nube no configurado. La app opera 100% localmente.' } };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    return { data, error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Auth: Sign In Anonymously (Offline-First strategy)
 */
export const signInAnonymously = async () => {
  if (!supabase) return { error: { message: 'Servicio de nube no configurado. La app opera 100% localmente.' } };
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    return { data, error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Auth: Send Magic Link to upgrade anonymous account or login
 */
export const sendMagicLink = async (email) => {
  if (!supabase) return { error: { message: 'Servicio de nube no configurado.' } };
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // En producción, aquí pones la URL de tu app (Deep Link) o Web
        shouldCreateUser: true,
      }
    });
    return { data, error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Auth: Upgrade current anonymous session to permanent by updating email
 * Requiere que el usuario ingrese un OTP o valide el link
 */
export const updateUserEmail = async (email) => {
  if (!supabase) return { error: { message: 'Nube no configurada.' } };
  try {
    const { data, error } = await supabase.auth.updateUser({ email: email.trim() });
    return { data, error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Sign Out
 */
export const signOutUser = async () => {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Sign out error:', err);
  }
};

/**
 * Get current authenticated user (if any)
 */
export const getCurrentUser = async () => {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch (err) {
    return null;
  }
};

/**
 * Opt-in Telemetry: Logs errors to the database ONLY if user explicitly opted in.
 */
export const logError = async (appName, errorMessage, deviceOs) => {
  if (!supabase) return;
  
  try {
    const isTelemetryEnabled = await AsyncStorage.getItem('telemetry_enabled') === 'true';
    if (!isTelemetryEnabled) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('app_errors').insert([
      {
        user_id: user?.id || null,
        app_name: appName,
        error_message: errorMessage,
        device_os: deviceOs,
      }
    ]);
  } catch (error) {
    // Silent fail
  }
};

/**
 * Multi-App Sync: Saves a JSON payload of settings for a specific app (Opt-in only)
 */
export const syncUserData = async (appName, payload) => {
  if (!supabase) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only sync if user is explicitly authenticated

    const { error } = await supabase.from('user_sync_data').upsert({
      user_id: user.id,
      app_name: appName,
      sync_payload: payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, app_name' });
    
    if (error) throw error;
  } catch (error) {
    // Silent fail offline
  }
};

/**
 * Multi-App Sync: Retrieves a JSON payload of settings for a specific app
 */
export const getUserData = async (appName) => {
  if (!supabase) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_sync_data')
      .select('sync_payload')
      .eq('user_id', user.id)
      .eq('app_name', appName)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    return data?.sync_payload || null;
  } catch (error) {
    return null;
  }
};

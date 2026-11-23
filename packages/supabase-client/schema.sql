-- =================================================================================
-- Ecosistema 4All - Esquema Maestro Supabase (Fase 1)
-- Filosofía: Offline-First. Tablas Específicas por App.
-- =================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================================
-- TABLA: user_profiles
-- Rastrea el estado de la cuenta (Anónima vs Permanente)
-- =================================================================================
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_anonymous BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- TABLA: apuntes_4all_notes
-- Específica para la app de notas.
-- =================================================================================
CREATE TABLE apuntes_4all_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    folder_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- TABLA: cuentas_4all_history
-- Específica para la app de cuentas compartidas.
-- =================================================================================
CREATE TABLE cuentas_4all_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_name TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    people_count INTEGER NOT NULL,
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- TABLA: qr_4all_history
-- Específica para la app de Códigos QR.
-- =================================================================================
CREATE TABLE qr_4all_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    qr_type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- TABLA: user_sync_data
-- Sincronización multi-app genérica (payload JSONB por app y usuario, estrictamente opt-in)
-- =================================================================================
CREATE TABLE user_sync_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    app_name TEXT NOT NULL,
    sync_payload JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, app_name)
);

-- =================================================================================
-- TABLA: app_errors
-- Registro de telemetría de errores (estrictamente voluntario / opt-in)
-- =================================================================================
CREATE TABLE app_errors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    app_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    device_os TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =================================================================================
-- SEGURIDAD: Row Level Security (RLS)
-- Garantiza que un usuario (anónimo o no) solo pueda leer/escribir sus propios datos.
-- =================================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apuntes_4all_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_4all_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_4all_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sync_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_errors ENABLE ROW LEVEL SECURITY;

-- Políticas de Privacidad Absoluta (Solo el dueño ve sus datos)
CREATE POLICY "Dueño lee perfil" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Dueño actualiza perfil" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Dueño CRUD apuntes" ON apuntes_4all_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Dueño CRUD cuentas" ON cuentas_4all_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Dueño CRUD qr" ON qr_4all_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Dueño CRUD user_sync_data" ON user_sync_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Inserción app_errors" ON app_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "Dueño lee sus propios app_errors" ON app_errors FOR SELECT USING (auth.uid() = user_id);

-- =================================================================================
-- TRIGGER: Auto-crear Perfil al registrarse en Auth
-- =================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Si el correo es nulo, significa que entró como anónimo
  INSERT INTO public.user_profiles (id, is_anonymous)
  VALUES (new.id, new.email IS NULL);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

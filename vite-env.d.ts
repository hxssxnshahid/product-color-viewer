/// <reference types="vite/client" />

declare module 'heic2any';
declare module 'browser-image-compression';

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/* ==========================================================================
   N2SA — Client Supabase
   Configuré avec les vraies clés du projet "Bibliothèque N2SA".
   ========================================================================== */

const SUPABASE_URL = "https://mqienmchazvmvlqiyrjl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xaWVubWNoYXp2bXZscWl5cmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMzMyMTAsImV4cCI6MjEwMTcwOTIxMH0.cNA-scRGidGuLk8kSs3XfRVJwl30Eo9VTyeF7h-Aph8";

// Le SDK Supabase (chargé via le <script> CDN dans le <head> de chaque page)
// expose un objet global `supabase` qu'on utilise ici pour créer le client.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

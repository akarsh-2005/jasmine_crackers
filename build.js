// Vercel build step: writes js/config.js from environment variables (no secrets; anon key is public).
const fs=require("fs"),e=process.env;
fs.writeFileSync("js/config.js",`window.JC_CONFIG=${JSON.stringify({SUPABASE_URL:e.SUPABASE_URL||"",SUPABASE_ANON_KEY:e.SUPABASE_ANON_KEY||""})};\n`);
console.log("config.js written",e.SUPABASE_URL?"(Supabase configured)":"(NO Supabase env vars: site uses sample data)");

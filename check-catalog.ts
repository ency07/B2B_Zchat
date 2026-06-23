process.env.SUPABASE_URL = 'https://jcsjfvrfsohahnoovjgf.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjc2pmdnJmc29oYWhub292amdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTk2MzMsImV4cCI6MjA5NzM3NTYzM30.46ltF9GrCZHyUnog7uaUPcR0pnrV4hDrGeqIkVKv6wM';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjc2pmdnJmc29oYWhub292amdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5OTYzMywiZXhwIjoyMDk3Mzc1NjMzfQ.gARcJaWv-rBd0pR3v66Kxiy7InFpYVDJeP9t3prX0tM';

import { supabaseAdmin } from './src/utils/supabase';

async function main() {
  try {
    const { data: cats, error: errCats } = await supabaseAdmin
      .from('product_categories')
      .select('id, category_code, name')
      .is('deleted_at', null);

    console.log('--- CATEGORÍAS ---', errCats || '', cats);

    const { data: subcats, error: errSubs } = await supabaseAdmin
      .from('product_subcategories')
      .select('id, subcategory_code, name')
      .is('deleted_at', null);

    console.log('--- SUBCATEGORÍAS ---', errSubs || '', subcats);

    const { data: prods, error: errProds } = await supabaseAdmin
      .from('products')
      .select('id, product_code, name')
      .is('deleted_at', null);

    console.log('--- PRODUCTOS ---', errProds || '', prods);

  } catch (err: any) {
    console.error('Error:', err);
  }
}

main();

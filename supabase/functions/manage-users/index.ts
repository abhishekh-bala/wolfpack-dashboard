import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate easy-to-remember password
function generateEasyPassword(): string {
  const adjectives = ['Happy', 'Lucky', 'Swift', 'Brave', 'Clever', 'Bright', 'Quick', 'Smart', 'Cool', 'Bold'];
  const nouns = ['Wolf', 'Star', 'Moon', 'Sun', 'Fire', 'Storm', 'Wind', 'Rock', 'Wave', 'Lion'];
  const numbers = Math.floor(Math.random() * 900) + 100; // 100-999
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj}${noun}${numbers}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create regular client to verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'create_user': {
        const { email, displayName, loginName, role } = params;
        const password = generateEasyPassword();

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update user_roles with the correct role
        await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', authData.user.id);

        // Create user_account record
        const { error: accountError } = await supabaseAdmin
          .from('user_accounts')
          .insert({
            user_id: authData.user.id,
            email,
            display_name: displayName,
            login_name: loginName,
            role,
            password_hint: password,
            created_by: user.id,
          });

        if (accountError) {
          // Rollback: delete the auth user if account creation fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          return new Response(JSON.stringify({ error: accountError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          user: { 
            id: authData.user.id, 
            email, 
            displayName, 
            loginName, 
            role,
            password 
          } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_user': {
        const { userId, email, displayName, loginName, role, isActive } = params;

        // Update user_account
        const { error: accountError } = await supabaseAdmin
          .from('user_accounts')
          .update({
            email,
            display_name: displayName,
            login_name: loginName,
            role,
            is_active: isActive,
          })
          .eq('user_id', userId);

        if (accountError) {
          return new Response(JSON.stringify({ error: accountError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update role in user_roles
        await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        // Update email in auth if changed
        if (email) {
          await supabaseAdmin.auth.admin.updateUserById(userId, { email });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'reset_password': {
        const { userId } = params;
        const newPassword = generateEasyPassword();

        // Update auth password
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update password hint
        await supabaseAdmin
          .from('user_accounts')
          .update({ password_hint: newPassword })
          .eq('user_id', userId);

        return new Response(JSON.stringify({ success: true, password: newPassword }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_user': {
        const { userId } = params;

        // Delete auth user (cascades to user_roles and user_accounts)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_users': {
        const { data, error } = await supabaseAdmin
          .from('user_accounts')
          .select('*')
          .order('display_name');

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ users: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_create_from_guides': {
        const { data: guides, error: guidesError } = await supabaseAdmin
          .from('guide_targets')
          .select('name, login_name')
          .not('login_name', 'is', null);

        if (guidesError) {
          return new Response(JSON.stringify({ error: guidesError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const results: { success: string[]; failed: { name: string; error: string }[] } = {
          success: [],
          failed: [],
        };

        for (const guide of guides || []) {
          if (!guide.login_name) continue;

          const email = `${guide.login_name}@wolfpack.local`;
          const password = generateEasyPassword();

          try {
            // Check if user already exists
            const { data: existing } = await supabaseAdmin
              .from('user_accounts')
              .select('id')
              .eq('login_name', guide.login_name)
              .maybeSingle();

            if (existing) {
              results.failed.push({ name: guide.name, error: 'Already exists' });
              continue;
            }

            // Create auth user
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
            });

            if (authError) {
              results.failed.push({ name: guide.name, error: authError.message });
              continue;
            }

            // Update role to guide
            await supabaseAdmin
              .from('user_roles')
              .update({ role: 'guide' })
              .eq('user_id', authData.user.id);

            // Create user_account
            await supabaseAdmin
              .from('user_accounts')
              .insert({
                user_id: authData.user.id,
                email,
                display_name: guide.name,
                login_name: guide.login_name,
                role: 'guide',
                password_hint: password,
                created_by: user.id,
              });

            results.success.push(guide.name);
          } catch (err) {
            results.failed.push({ name: guide.name, error: String(err) });
          }
        }

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
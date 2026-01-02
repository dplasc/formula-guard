import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/app/admin/actions';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/admin/set-plan
 * Admin-only endpoint to set a user's plan (pro or free)
 * 
 * Body: { email: string, plan: "pro" | "free" }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify requester is admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const role = await getUserRole();
    if (role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { email, plan } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: email is required' },
        { status: 400 }
      );
    }

    // Normalize email input
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json(
        { error: 'Invalid request: email cannot be empty' },
        { status: 400 }
      );
    }

    if (plan !== 'pro' && plan !== 'free') {
      return NextResponse.json(
        { error: 'Invalid request: plan must be "pro" or "free"' },
        { status: 400 }
      );
    }

    // 3. Use admin client to update user metadata
    const adminClient = createAdminClient();
    
    // Find user by email with pagination guard
    const perPage = 200;
    const maxPages = 5;
    let targetUser = null;
    let page = 1;

    // Try pagination first
    while (page <= maxPages && !targetUser) {
      const { data: users, error: listError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        );
      }

      // Case-insensitive email comparison
      targetUser = users.users.find(
        (u) => (u.email ?? '').trim().toLowerCase() === normalizedEmail
      );

      // If no more users or found the user, break
      if (!users.users.length || targetUser) {
        break;
      }

      page++;
    }

    // Fallback: if pagination didn't work (first page returned all users), use safety check
    if (!targetUser) {
      const { data: allUsers, error: fallbackError } = await adminClient.auth.admin.listUsers();
      if (fallbackError) {
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        );
      }

      // Safety check for very large user lists (pagination not working)
      if (allUsers.users.length > 5000) {
        return NextResponse.json(
          { error: 'User search too large; please use user ID.' },
          { status: 413 }
        );
      }

      // Case-insensitive email comparison
      targetUser = allUsers.users.find(
        (u) => (u.email ?? '').trim().toLowerCase() === normalizedEmail
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Update app_metadata.plan
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUser.id,
      {
        app_metadata: {
          ...targetUser.app_metadata,
          plan: plan,
        },
      }
    );

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User plan set to ${plan}`,
      user: {
        email: updatedUser.user.email,
        plan: updatedUser.user.app_metadata?.plan,
      },
    });
  } catch (error) {
    console.error('Error setting user plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


'use server';

import { requireAdminUser } from '@/lib/auth/requireAdminUser';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

type ContactStatus = 'new' | 'in_progress' | 'replied' | 'closed';

interface SaveContactAdminParams {
  requestId: string;
  status: string;
  internalNotes: string;
}

export async function saveContactAdmin(params: SaveContactAdminParams) {
  try {
    // Require admin user and get admin user id
    const adminUser = await requireAdminUser();

    // Validate status
    const validStatuses: ContactStatus[] = ['new', 'in_progress', 'replied', 'closed'];
    if (!validStatuses.includes(params.status as ContactStatus)) {
      return {
        success: false,
        error: 'Invalid status value',
      };
    }

    // Coerce notes to string or null
    const internalNotes = params.internalNotes?.trim() || null;

    // Upsert admin metadata
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('contact_request_admin')
      .upsert(
        {
          request_id: params.requestId,
          status: params.status as ContactStatus,
          internal_notes: internalNotes,
          handled_by: adminUser.id,
        },
        { onConflict: 'request_id' }
      );

    if (error) {
      console.error('SAVE_CONTACT_ADMIN_FAILED', {
        code: error.code,
        message: error.message,
      });
      return {
        success: false,
        error: 'Failed to save',
      };
    }

    // Revalidate paths
    revalidatePath(`/admin/contact/${params.requestId}`);
    revalidatePath('/admin/contact');

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('SAVE_CONTACT_ADMIN_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: 'An error occurred',
    };
  }
}

export async function markReplied(requestId: string) {
  try {
    // Require admin user and get admin user id
    const adminUser = await requireAdminUser();

    // Upsert admin metadata with status='replied' and responded_at=now()
    const adminClient = createAdminClient();
    const now = new Date().toISOString();
    const { error } = await adminClient
      .from('contact_request_admin')
      .upsert(
        {
          request_id: requestId,
          status: 'replied' as ContactStatus,
          handled_by: adminUser.id,
          responded_at: now,
        },
        { onConflict: 'request_id' }
      );

    if (error) {
      console.error('MARK_REPLIED_FAILED', {
        code: error.code,
        message: error.message,
      });
      return {
        success: false,
        error: 'Failed to mark as replied',
      };
    }

    // Revalidate paths
    revalidatePath(`/admin/contact/${requestId}`);
    revalidatePath('/admin/contact');

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('MARK_REPLIED_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: 'An error occurred',
    };
  }
}


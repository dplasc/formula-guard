import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth/requireAdminUser';
import { createAdminClient } from '@/lib/supabase/admin';
import ContactAdminForm from './ContactAdminForm';

type ContactStatus = 'new' | 'in_progress' | 'replied' | 'closed';

interface PageProps {
  params: { id: string };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminContactDetailPage({ params }: PageProps) {
  // Security: Require admin user - return notFound() if not authorized
  try {
    await requireAdminUser();
  } catch {
    return notFound();
  }

  const { id } = params;

  // Fetch contact request
  const adminClient = createAdminClient();
  
  const { data: request, error: requestError } = await adminClient
    .from('contact_requests')
    .select('id, created_at, name, email, message, ip, user_agent')
    .eq('id', id)
    .single();

  if (requestError || !request) {
    return notFound();
  }

  // Fetch admin metadata
  const { data: adminData } = await adminClient
    .from('contact_request_admin')
    .select('request_id, status, internal_notes, handled_by, responded_at, updated_at')
    .eq('request_id', id)
    .maybeSingle();

  const status: ContactStatus = (adminData?.status as ContactStatus) || 'new';
  const internalNotes = adminData?.internal_notes || '';

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/admin/contact"
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
      >
        ← Back to Contact Inbox
      </Link>

      <h1 className="text-3xl font-bold mt-4">Contact Request</h1>

      {/* From Section */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">From</h2>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Name: </span>
            <span className="text-sm text-gray-900">{request.name || '—'}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Email: </span>
            <a
              href={`mailto:${request.email}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {request.email}
            </a>
          </div>
          <div>
            <span className="text-sm text-gray-500">Date: </span>
            <span className="text-sm text-gray-900">{formatDate(request.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Message Section */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Message</h2>
        <div className="whitespace-pre-wrap text-sm text-gray-900">{request.message}</div>
      </div>

      {/* Metadata Section */}
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Metadata</h2>
        <div className="space-y-1 text-xs text-gray-600">
          <div>
            <span className="font-medium">IP: </span>
            <span>{request.ip || '—'}</span>
          </div>
          <div>
            <span className="font-medium">User Agent: </span>
            <span>{request.user_agent || '—'}</span>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Admin Controls</h2>
        <ContactAdminForm
          requestId={id}
          initialStatus={status}
          initialNotes={internalNotes}
        />
      </div>
    </div>
  );
}


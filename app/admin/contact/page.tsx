import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth/requireAdminUser';
import { createAdminClient } from '@/lib/supabase/admin';

type ContactRequest = {
  id: string;
  created_at: string;
  name: string | null;
  email: string;
  message: string;
  status: 'new' | 'in_progress' | 'replied' | 'closed';
};

type StatusFilter = 'new' | 'in_progress' | 'replied' | 'closed' | null;

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

function previewMessage(message: string, maxLength: number = 120): string {
  const cleaned = message.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.substring(0, maxLength) + '...';
}

function getStatusBadgeClass(status: ContactRequest['status']): string {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'replied':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

interface PageProps {
  searchParams?: { status?: string };
}

export default async function AdminContactPage({ searchParams }: PageProps) {
  // Security: Require admin user - return notFound() if not authorized
  try {
    await requireAdminUser();
  } catch {
    return notFound();
  }

  // Parse status filter from query params
  const statusFilter: StatusFilter = 
    searchParams?.status && ['new', 'in_progress', 'replied', 'closed'].includes(searchParams.status)
      ? (searchParams.status as StatusFilter)
      : null;

  // Fetch contact requests
  const adminClient = createAdminClient();
  
  const { data: requests, error: requestsError } = await adminClient
    .from('contact_requests')
    .select('id, created_at, name, email, message')
    .order('created_at', { ascending: false })
    .limit(100);

  if (requestsError) {
    console.error('FETCH_CONTACT_REQUESTS_FAILED', {
      code: requestsError.code,
      message: requestsError.message,
    });
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold">Contact Inbox</h1>
        <p className="mt-4 text-red-600">Failed to load contact requests.</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold">Contact Inbox</h1>
        <p className="mt-2 text-gray-600">Latest 100 messages</p>
        <p className="mt-8 text-gray-500">No contact requests found.</p>
      </div>
    );
  }

  // Fetch admin metadata for these requests
  const requestIds = requests.map(r => r.id);
  const { data: adminMetadata, error: adminError } = await adminClient
    .from('contact_request_admin')
    .select('request_id, status, updated_at')
    .in('request_id', requestIds);

  if (adminError) {
    // Log but don't fail - we'll default status to 'new'
    console.error('FETCH_CONTACT_ADMIN_METADATA_FAILED', {
      code: adminError.code,
      message: adminError.message,
    });
  }

  // Create map of request_id -> status
  const statusMap = new Map<string, 'new' | 'in_progress' | 'replied' | 'closed'>();
  adminMetadata?.forEach(meta => {
    if (meta.status && ['new', 'in_progress', 'replied', 'closed'].includes(meta.status)) {
      statusMap.set(meta.request_id, meta.status as ContactRequest['status']);
    }
  });

  // Merge data and build ContactRequest array
  let mergedRequests: ContactRequest[] = requests.map(req => ({
    id: req.id,
    created_at: req.created_at,
    name: req.name,
    email: req.email,
    message: req.message,
    status: statusMap.get(req.id) || 'new',
  }));

  // Apply status filter if provided
  if (statusFilter) {
    mergedRequests = mergedRequests.filter(req => req.status === statusFilter);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Contact Inbox</h1>
      <p className="mt-2 text-gray-600">Latest 100 messages</p>

      {/* Status Filter */}
      <div className="mt-6 mb-6 flex gap-2 border-b border-gray-200 pb-4">
        <Link
          href="/admin/contact"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/contact?status=new"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'new'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          New
        </Link>
        <Link
          href="/admin/contact?status=in_progress"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'in_progress'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          In Progress
        </Link>
        <Link
          href="/admin/contact?status=replied"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'replied'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Replied
        </Link>
        <Link
          href="/admin/contact?status=closed"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'closed'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Closed
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mergedRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-gray-900">{request.name || '—'}</div>
                    <div className="text-gray-500">{request.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                        request.status
                      )}`}
                    >
                      {request.status === 'in_progress' ? 'In Progress' : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {previewMessage(request.message)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/contact/${request.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mergedRequests.length === 0 && (
        <p className="mt-8 text-center text-gray-500">
          No contact requests found{statusFilter ? ` with status "${statusFilter}"` : ''}.
        </p>
      )}
    </div>
  );
}


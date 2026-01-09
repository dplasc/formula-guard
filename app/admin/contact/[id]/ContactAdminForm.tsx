'use client';

import { useState, useTransition } from 'react';
import { saveContactAdmin, markReplied } from './actions';

interface ContactAdminFormProps {
  requestId: string;
  initialStatus: 'new' | 'in_progress' | 'replied' | 'closed';
  initialNotes: string;
}

export default function ContactAdminForm({
  requestId,
  initialStatus,
  initialNotes,
}: ContactAdminFormProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveContactAdmin({
          requestId,
          status,
          internalNotes: notes,
        });
        if (result.success) {
          setMessage({ type: 'success', text: 'Saved successfully' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to save' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'An error occurred while saving' });
      }
    });
  };

  const handleMarkReplied = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await markReplied(requestId);
        if (result.success) {
          setStatus('replied');
          setMessage({ type: 'success', text: 'Marked as replied' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to mark as replied' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'An error occurred' });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isPending}
        >
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isPending}
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleMarkReplied}
          disabled={isPending}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark Replied
        </button>
      </div>
    </div>
  );
}


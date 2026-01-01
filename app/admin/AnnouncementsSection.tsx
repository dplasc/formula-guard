'use client';

import { useState, useEffect } from 'react';
import { createAnnouncement, getAnnouncements, deleteAnnouncement, type Announcement } from './announcements-actions';
import { X, Trash2 } from 'lucide-react';

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    link: '',
    audience: 'all' as 'all' | 'logged_in' | 'pro_only',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    const result = await getAnnouncements();
    if (result.data) {
      setAnnouncements(result.data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await createAnnouncement({
        title: formData.title,
        body: formData.body,
        link: formData.link || null,
        audience: formData.audience,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Announcement created successfully' });
        setFormData({ title: '', body: '', link: '', audience: 'all' });
        setShowForm(false);
        await loadAnnouncements();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create announcement' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while creating announcement' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    const result = await deleteAnnouncement(id);
    if (result.success) {
      await loadAnnouncements();
    } else {
      alert('Failed to delete announcement: ' + result.error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 min-h-[44px] bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors font-medium text-sm"
        >
          {showForm ? 'Cancel' : 'Create Announcement'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md border ${
            message.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Announcement title"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                Body *
              </label>
              <textarea
                id="body"
                required
                rows={4}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Announcement body text"
              />
            </div>

            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                Link (optional)
              </label>
              <input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
                Audience *
              </label>
              <select
                id="audience"
                required
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="all">All Users</option>
                <option value="logged_in">Logged In Users</option>
                <option value="pro_only">Pro Only</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 min-h-[44px] bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Announcement'}
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p className="text-gray-500 text-sm">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-4 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {announcement.audience}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{announcement.body}</p>
                  {announcement.link && (
                    <a
                      href={announcement.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      {announcement.link}
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Published: {formatDate(announcement.published_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Delete announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadAnnouncementCount, getUserAnnouncements, markAllAnnouncementsAsRead, type UserAnnouncement } from '@/app/announcements/actions';
import { X } from 'lucide-react';

export default function AnnouncementBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<UserAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAnnouncements();
    }
  }, [isOpen]);

  const loadUnreadCount = async () => {
    const count = await getUnreadAnnouncementCount();
    setUnreadCount(count);
  };

  const loadAnnouncements = async () => {
    setIsLoading(true);
    const result = await getUserAnnouncements();
    if (result.data) {
      setAnnouncements(result.data);
    }
    setIsLoading(false);
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAnnouncementsAsRead();
    if (result.success) {
      await loadAnnouncements();
      await loadUnreadCount();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-700 hover:text-teal-600 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Announcements"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Announcements Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-20 right-4 w-full max-w-md bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <p className="text-gray-500 text-sm text-center py-4">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No announcements.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`p-4 border rounded-md ${
                        announcement.is_read
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-teal-200 bg-teal-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                        {!announcement.is_read && (
                          <span className="ml-2 flex-shrink-0 w-2 h-2 bg-teal-500 rounded-full"></span>
                        )}
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
                        {formatDate(announcement.published_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}



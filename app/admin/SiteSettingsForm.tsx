'use client';

import { useState } from 'react';
import { updateSiteSettings } from './actions';

interface SiteSettingsFormProps {
  initialSettings: Record<string, string>;
}

export default function SiteSettingsForm({ initialSettings }: SiteSettingsFormProps) {
  // Parse social media links from JSON
  let parsedSocial = { facebook: '', instagram: '', tiktok: '', youtube: '' };
  if (initialSettings.social) {
    try {
      const parsed = JSON.parse(initialSettings.social);
      parsedSocial = {
        facebook: parsed.facebook || '',
        instagram: parsed.instagram || '',
        tiktok: parsed.tiktok || '',
        youtube: parsed.youtube || '',
      };
    } catch (e) {
      // Invalid JSON, use defaults
    }
  }

  const [settings, setSettings] = useState({
    instagram_url: initialSettings.instagram_url || '',
    facebook_url: initialSettings.facebook_url || '',
    tiktok_url: initialSettings.tiktok_url || '',
    linkedin_url: initialSettings.linkedin_url || '',
    contact_email: initialSettings.contact_email || '',
  });
  const [social, setSocial] = useState({
    facebook: parsedSocial.facebook || '',
    instagram: parsedSocial.instagram || '',
    tiktok: parsedSocial.tiktok || '',
    youtube: parsedSocial.youtube || '',
  });
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateSocialUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Validate social URLs
    const errors: Record<string, string> = {};
    if (!validateSocialUrl(social.facebook)) {
      errors.facebook = 'URL must start with http:// or https://';
    }
    if (!validateSocialUrl(social.instagram)) {
      errors.instagram = 'URL must start with http:// or https://';
    }
    if (!validateSocialUrl(social.tiktok)) {
      errors.tiktok = 'URL must start with http:// or https://';
    }
    if (!validateSocialUrl(social.youtube)) {
      errors.youtube = 'URL must start with http:// or https://';
    }

    if (Object.keys(errors).length > 0) {
      setSocialErrors(errors);
      setIsSaving(false);
      return;
    }

    setSocialErrors({});

    try {
      // Stringify social media links as JSON
      const settingsToSave = {
        ...settings,
        social: JSON.stringify(social),
      };
      const result = await updateSiteSettings(settingsToSave);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSocialChange = (key: string, value: string) => {
    setSocial((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (socialErrors[key]) {
      setSocialErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-md border ${
            message.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="instagram_url" className="block text-sm font-medium text-gray-700 mb-1">
            Instagram URL
          </label>
          <input
            id="instagram_url"
            type="url"
            value={settings.instagram_url}
            onChange={(e) => handleChange('instagram_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            placeholder="https://instagram.com/yourhandle"
          />
        </div>

        <div>
          <label htmlFor="facebook_url" className="block text-sm font-medium text-gray-700 mb-1">
            Facebook URL
          </label>
          <input
            id="facebook_url"
            type="url"
            value={settings.facebook_url}
            onChange={(e) => handleChange('facebook_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            placeholder="https://facebook.com/yourpage"
          />
        </div>

        <div>
          <label htmlFor="tiktok_url" className="block text-sm font-medium text-gray-700 mb-1">
            TikTok URL
          </label>
          <input
            id="tiktok_url"
            type="url"
            value={settings.tiktok_url}
            onChange={(e) => handleChange('tiktok_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            placeholder="https://tiktok.com/@yourhandle"
          />
        </div>

        <div>
          <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL
          </label>
          <input
            id="linkedin_url"
            type="url"
            value={settings.linkedin_url}
            onChange={(e) => handleChange('linkedin_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            placeholder="https://linkedin.com/company/yourcompany"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email
          </label>
          <input
            id="contact_email"
            type="email"
            value={settings.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            placeholder="contact@example.com"
          />
        </div>
      </div>

      {/* Social Media Links Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="social_facebook" className="block text-sm font-medium text-gray-700 mb-1">
              Facebook URL
            </label>
            <input
              id="social_facebook"
              type="url"
              value={social.facebook}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm ${
                socialErrors.facebook ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://facebook.com/yourpage"
            />
            {socialErrors.facebook && (
              <p className="mt-1 text-sm text-red-600">{socialErrors.facebook}</p>
            )}
          </div>

          <div>
            <label htmlFor="social_instagram" className="block text-sm font-medium text-gray-700 mb-1">
              Instagram URL
            </label>
            <input
              id="social_instagram"
              type="url"
              value={social.instagram}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm ${
                socialErrors.instagram ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://instagram.com/yourhandle"
            />
            {socialErrors.instagram && (
              <p className="mt-1 text-sm text-red-600">{socialErrors.instagram}</p>
            )}
          </div>

          <div>
            <label htmlFor="social_tiktok" className="block text-sm font-medium text-gray-700 mb-1">
              TikTok URL
            </label>
            <input
              id="social_tiktok"
              type="url"
              value={social.tiktok}
              onChange={(e) => handleSocialChange('tiktok', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm ${
                socialErrors.tiktok ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://tiktok.com/@yourhandle"
            />
            {socialErrors.tiktok && (
              <p className="mt-1 text-sm text-red-600">{socialErrors.tiktok}</p>
            )}
          </div>

          <div>
            <label htmlFor="social_youtube" className="block text-sm font-medium text-gray-700 mb-1">
              YouTube URL
            </label>
            <input
              id="social_youtube"
              type="url"
              value={social.youtube}
              onChange={(e) => handleSocialChange('youtube', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm ${
                socialErrors.youtube ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://youtube.com/@yourchannel"
            />
            {socialErrors.youtube && (
              <p className="mt-1 text-sm text-red-600">{socialErrors.youtube}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 min-h-[44px] bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}


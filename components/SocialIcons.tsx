'use client';

import { Facebook, Instagram, Youtube, Play } from 'lucide-react';
import type { SocialLinks } from '@/lib/siteSettings';

interface SocialIconsProps {
  socialLinks: SocialLinks;
}

export default function SocialIcons({ socialLinks }: SocialIconsProps) {
  const links = [
    { key: 'facebook', url: socialLinks.facebook, icon: Facebook, label: 'Facebook' },
    { key: 'instagram', url: socialLinks.instagram, icon: Instagram, label: 'Instagram' },
    { key: 'tiktok', url: socialLinks.tiktok, icon: Play, label: 'TikTok' },
    { key: 'youtube', url: socialLinks.youtube, icon: Youtube, label: 'YouTube' },
  ].filter((link) => link.url && link.url.trim() !== '');

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {links.map(({ key, url, icon: Icon, label }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-gray-600 hover:text-teal-600 transition-colors"
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}


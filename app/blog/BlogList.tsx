'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import type { BlogPost } from '@/lib/blog';

const ALLOWED_CATEGORIES = ['Latest', 'Guides', 'IFRA', 'Regulatory', 'Updates'] as const;
type Category = typeof ALLOWED_CATEGORIES[number];

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  const [selectedTab, setSelectedTab] = useState<Category>('Latest');

  // Normalize category: if not in allowed list, treat as "Other" (but don't show tab)
  const normalizeCategory = (category?: string): Category | 'Other' => {
    if (!category) return 'Other';
    const normalized = category as Category;
    return ALLOWED_CATEGORIES.includes(normalized) ? normalized : 'Other';
  };

  // Filter posts based on selected tab
  const filteredPosts = selectedTab === 'Latest'
    ? posts
    : posts.filter(post => normalizeCategory(post.category) === selectedTab);

  return (
    <>
      {/* Category Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex flex-wrap gap-2 -mb-px">
          {ALLOWED_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedTab(category)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === category
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>

      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-600">
            No posts yet in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                {post.cover ? (
                  <Image
                    src={post.cover}
                    alt={post.title}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                    <FileText className="w-12 h-12 text-teal-600 opacity-50" />
                  </div>
                )}
              </div>
              
              {/* Card Content */}
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors mb-2 line-clamp-2">
                  {post.title}
                </h2>
                <div className="flex items-center justify-between mb-3">
                  <time
                    dateTime={post.date}
                    className="text-sm text-gray-500"
                  >
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  {post.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-600 bg-gray-50">
                      {post.category}
                    </span>
                  )}
                </div>
                {post.description && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}



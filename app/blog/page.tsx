import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import BlogList from './BlogList';

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description: 'Articles and guides about natural cosmetics formulation, safety standards, and compliance.',
  path: '/blog',
});

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Blog Header */}
        <header className="mb-12">
          <div className="w-full mb-6">
            <Image
              src="/blog/blog-header.jpg"
              alt="FormulaGuard blog header featuring cosmetic formulation tools and ingredients"
              width={1600}
              height={500}
              className="w-full h-auto rounded-lg"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-lg text-gray-600">
            Insights, guides, and updates for cosmetic formulators.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Coming soon
            </h2>
            <p className="text-gray-600">
              We're working on some great content. Check back soon!
            </p>
          </div>
        ) : (
          <BlogList posts={posts} />
        )}
      </div>
    </div>
  );
}


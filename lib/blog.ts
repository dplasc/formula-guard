import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content', 'blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  cover?: string;
  category?: string;
  content: string;
}

export interface BlogPostFrontmatter {
  title: string;
  date: string;
  description: string;
  cover?: string;
  category?: string;
}

/**
 * Check if blog posts directory exists and has at least one post
 */
export function hasPosts(): boolean {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return false;
    }
    const files = fs.readdirSync(postsDirectory);
    const mdxFiles = files.filter((file) => file.endsWith('.mdx'));
    return mdxFiles.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get all blog posts, sorted by date (newest first)
 */
export function getAllPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }

    const files = fs.readdirSync(postsDirectory);
    const mdxFiles = files.filter((file) => file.endsWith('.mdx'));

    const posts = mdxFiles
      .map((file) => {
        const slug = file.replace(/\.mdx$/, '');
        const filePath = path.join(postsDirectory, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);

        const frontmatter = data as BlogPostFrontmatter;

        return {
          slug,
          title: frontmatter.title,
          date: frontmatter.date,
          description: frontmatter.description,
          cover: frontmatter.cover,
          category: frontmatter.category,
          content,
        };
      })
      .filter((post) => post.title && post.date) // Filter out invalid posts
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    return posts;
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const filePath = path.join(postsDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const frontmatter = data as BlogPostFrontmatter;

    if (!frontmatter.title || !frontmatter.date) {
      return null;
    }

    return {
      slug,
      title: frontmatter.title,
      date: frontmatter.date,
      description: frontmatter.description || '',
      cover: frontmatter.cover,
      category: frontmatter.category,
      content,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

/**
 * Get all post slugs for static generation
 */
export function getAllPostSlugs(): string[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }

    const files = fs.readdirSync(postsDirectory);
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(/\.mdx$/, ''));
  } catch {
    return [];
  }
}


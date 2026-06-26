import { Helmet } from 'react-helmet-async';
import type { BlogPost } from '../types';

const SITE_NAME = 'Luminary';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://luminary.blog';
const DEFAULT_DESC = 'A premium blogging platform where every article passes a 3-stage AI authenticity pipeline. No filler. No fluff.';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  author?: string;
  tags?: string[];
  noindex?: boolean;
}

export default function SEO({ title, description, canonical, image, type, publishedAt, author, tags, noindex }: SEOProps) {
  const pageTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Premium AI-Powered Blog`;
  const desc = description || DEFAULT_DESC;
  const url = canonical || SITE_URL;
  const img = image || `${SITE_URL}/hero-bg.jpg`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type || 'website'} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {author && <meta name="author" content={author} />}
      {tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
    </Helmet>
  );
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESC,
    sameAs: [
      'https://twitter.com/luminaryblog',
      'https://github.com/luminary-blog',
    ],
  };

  return (
    <script type="application/ld+json">{JSON.stringify(schema)}</script>
  );
}

export function BlogPostingSchema({ post }: { post: BlogPost }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt,
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
    keywords: post.keywords.join(', '),
    wordCount: post.wordCount,
    image: post.coverImage || undefined,
  };

  return (
    <script type="application/ld+json">{JSON.stringify(schema)}</script>
  );
}

export function CollectionPageSchema({ totalPosts }: { totalPosts: number }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog Archive — Luminary',
    description: `Browse ${totalPosts} verified articles.`,
    url: `${SITE_URL}/blog`,
  };

  return (
    <script type="application/ld+json">{JSON.stringify(schema)}</script>
  );
}

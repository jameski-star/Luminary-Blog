import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { ArrowLeft } from 'lucide-react';

const CONTENT: Record<string, { title: string; sections: { h: string; p: string }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        h: 'Information We Collect',
        p: 'When you create an account, we collect your name and email address. When you publish articles, we collect the content, metadata, and analytics data such as page views and read time. We use localStorage to persist your session and preferences locally in your browser.',
      },
      {
        h: 'How We Use Your Information',
        p: 'Your information is used solely to operate the Luminary platform — authenticate you, store your posts, display your content to readers, and provide analytics. We do not sell, rent, or share your personal data with third parties for their marketing purposes.',
      },
      {
        h: 'Data Storage & Security',
        p: 'All data is stored locally in your browser via localStorage. No data is transmitted to external servers except when you optionally use the Gemini AI API key you provide (data is sent to Google\'s Gemini API for content generation and validation). We recommend using a dedicated API key and revoking it if you no longer need the service.',
      },
      {
        h: 'Cookies',
        p: 'Luminary does not use tracking cookies. We use localStorage (a browser storage mechanism) to remember your preferences and session. This data never leaves your browser unless you explicitly share content.',
      },
      {
        h: 'Third-Party Services',
        p: 'The only third-party service integrated is Google\'s Gemini API, which you opt into by providing your own API key. Content sent to Gemini is processed according to Google\'s privacy policy. No other third-party scripts, trackers, or analytics services are loaded.',
      },
      {
        h: 'Your Rights',
        p: 'You can delete your account and all associated data at any time by clearing your browser\'s localStorage. Since all data is stored locally, no centralized deletion request is necessary.',
      },
      {
        h: 'Changes to This Policy',
        p: 'We may update this privacy policy from time to time. Changes will be reflected on this page. Continued use of the platform after changes constitutes acceptance of the updated policy.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        h: 'Acceptance of Terms',
        p: 'By using Luminary, you agree to these Terms of Service. If you do not agree, do not use the platform. We reserve the right to update these terms at any time.',
      },
      {
        h: 'User Accounts',
        p: 'You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years of age to use this platform. You may not use the platform for any unlawful purpose.',
      },
      {
        h: 'Content Ownership',
        p: 'You retain full ownership of the content you publish on Luminary. By publishing, you grant Luminary a non-exclusive, royalty-free license to display and distribute your content through the platform.',
      },
      {
        h: 'Content Standards',
        p: 'You agree not to publish content that is unlawful, defamatory, fraudulent, or infringes on the rights of others. Luminary reserves the right to remove content that violates these standards or fails the authenticity validation gate (scoring below 65/100).',
      },
      {
        h: 'AI-Generated Content',
        p: 'Content generated using the AutoPost AI feature is created by Google\'s Gemini API based on your inputs. You are responsible for reviewing and fact-checking AI-generated content before publication. Luminary provides authenticity scoring but does not guarantee factual accuracy.',
      },
      {
        h: 'Limitation of Liability',
        p: 'Luminary is provided "as is" without warranties of any kind. We are not liable for damages arising from the use or inability to use the platform, including but not limited to data loss or service interruptions.',
      },
      {
        h: 'Termination',
        p: 'We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by clearing your localStorage data.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    sections: [
      {
        h: 'What Are Cookies',
        p: 'Cookies are small text files stored on your device by websites you visit. Luminary takes a privacy-first approach and does not use tracking cookies, advertising cookies, or any third-party cookies.',
      },
      {
        h: 'Local Storage',
        p: 'Instead of cookies, Luminary uses the browser\'s localStorage API to store your session, preferences (including theme preference), and application data. This data remains in your browser and is not transmitted to any server.',
      },
      {
        h: 'What We Store Locally',
        p: 'We store your user profile, published articles, draft posts, Gemini API key (if provided), and theme preference. All of this data stays in your browser and is never sent to us or any third party without your explicit action.',
      },
      {
        h: 'Managing Your Data',
        p: 'You can clear all stored data at any time by going to your browser settings and clearing localStorage for this site. This will reset your account and remove all locally stored posts.',
      },
      {
        h: 'Updates',
        p: 'We may update this Cookie Policy to reflect changes in our practices. We encourage you to review this page periodically.',
      },
    ],
  },
};

export default function LegalPage({ page }: { page: 'privacy' | 'terms' | 'cookies' }) {
  const { setCurrentPage } = useApp();
  const content = CONTENT[page];

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO title={content.title} description={`${content.title} for Luminary Blog.`} noindex />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        <h1 className="font-heading text-4xl font-bold text-primary mb-2">{content.title}</h1>
        <p className="text-sm text-secondary mb-10">Last updated: June 2026</p>

        <div className="space-y-8">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold text-primary mb-2">{section.h}</h2>
              <p className="text-secondary leading-relaxed">{section.p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

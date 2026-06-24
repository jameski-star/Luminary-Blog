# Luminary — AI-Powered Blogging

Luminary is a modern blogging platform where every article passes a 3-stage AI validation pipeline. No filler. No fluff.

## Features

- **AI AutoPost** — Enter a topic, and Gemini drafts, audits, and polishes a complete article for you
- **Markdown Editor** — Full-featured with formatting toolbar, live preview, and word count
- **Smart Search** — Full-text search across every word of every article
- **Admin Panel** — Review, approve, quarantine, or publish posts; manage users
- **Dark / Light Theme** — Toggle to your preference
- **Responsive** — Works on desktop, tablet, and mobile

## How It Works

1. **Sign up** — Create an account. The first user on a fresh platform becomes the admin.
2. **Write** — Use the editor to write manually, or generate a post with AI.
3. **Review** — Every article is scored by the AI audit pipeline for quality and vulnerabilities.
4. **Publish** — The admin reviews and publishes approved posts to the blog.
5. **Read** — Readers browse, search, and like published articles.

## AI Pipeline (AutoPost)

The 3-stage Gemini pipeline:

| Stage | What it does |
|---|---|
| **Draft** | Generates a full article with outline from your topic + keywords |
| **Audit** | Scores the draft for quality, checks for vulnerabilities, flags issues |
| **Polish** | Refines the final output based on audit results |

You can also paste existing content into the **Validate** tool for an audit-only pass.

## Running Locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. No database or API key needed for basic use — the app runs entirely in your browser. To use AI features, enter a Gemini API key in the AutoPost page.

## Tech Stack

React 19 · TypeScript · Tailwind CSS · Vite · Gemini AI · Lucide Icons

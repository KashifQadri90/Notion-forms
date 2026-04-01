# Qbil Self-Report Form

A lightweight, browser-based self-report form for the Qbil Transformation Programme. Team members submit their monthly self-reports without needing a Notion account. Submissions are written directly into the Employee Development Notion database via a Vercel Edge Function.

## How it works

```
Team member fills form (index.html)
        ↓
POST request to /api/submit (Vercel Edge Function)
        ↓
Notion API creates a new page in the Employee Development database
```

## Project structure

```
├── api/
│   └── submit.js       # Vercel Edge Function — Notion proxy
├── public/
│   └── index.html      # The form team members fill in
└── vercel.json         # Routes /api/submit to the function
```

## Deployment

See the [Vercel Deployment Guide](https://www.notion.so/Self-Report-Form-Vercel-Deployment-Guide-33498824617b814a80cdef328ccb87bb) for full step-by-step instructions.

### Quick summary

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Connect the integration to the Employee Development database
3. Deploy this repo on [Vercel](https://vercel.com)
4. Add the `NOTION_TOKEN` environment variable in Vercel project settings
5. Update `API_URL` in `public/index.html` with your Vercel deployment URL

## Environment variables

| Variable | Description |
|---|---|
| `NOTION_TOKEN` | Notion Internal Integration Token (starts with `ntn_` or `secret_`) |

> Never commit the token to GitHub. Set it only in Vercel's Environment Variables settings.

## Tech stack

- **Frontend:** Plain HTML/CSS/JS — no build step, no dependencies
- **Backend:** Vercel Edge Function (Node.js)
- **Database:** Notion API
- **Hosting:** Vercel (free tier)

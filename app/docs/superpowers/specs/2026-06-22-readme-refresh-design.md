# Aura Wardrobe README Refresh Design

## Goal

Rewrite the repository-level README as a bilingual product and engineering case study suitable for GitHub visitors and technical interviews. It must explain what Aura Wardrobe does, demonstrate that the main user journey is complete, and provide accurate setup and deployment instructions.

## Audience

- Interviewers evaluating product thinking, frontend execution, and full-stack delivery
- Developers evaluating the architecture or running the project locally
- Product-oriented readers who need to understand the workflow without reading the code

## Language Strategy

Use Chinese as the primary explanatory language with concise English summaries for the project introduction, product workflow, engineering highlights, and architecture. Avoid translating every sentence twice because that would make the document repetitive and difficult to scan.

## Document Structure

1. Project title, concise bilingual positioning, production link, repository status badges
2. Screenshot and demo placeholders that can be replaced later without restructuring the README
3. Product problem and target users
4. End-to-end workflow:
   - Upload portrait
   - Decide optional innerwear and hat
   - Select colors by clothing slot
   - Select styling direction
   - Choose pieces from the wardrobe
   - Generate, save, and download the preview
5. Core product capabilities
6. Engineering highlights and architectural decisions
7. Technology stack
8. Project structure
9. Local development setup
10. Environment variables
11. Database strategy and Vercel deployment
12. Testing and common commands
13. Current limitations and next steps

## Visual Placeholders

Reserve three clearly labelled image slots:

- Homepage cinematic canvas and flower background
- Color and style planning workflow
- Wardrobe selection and generated preview

Use HTML comments and predictable asset paths under `docs/images/` so screenshots can be added later without showing broken images on GitHub. Keep `app/README.md` as a short link to the canonical repository-level document.

## Accuracy Requirements

- Local development uses SQLite through `prisma/schema.prisma`.
- Vercel production uses Neon PostgreSQL through `prisma/schema.postgresql.prisma`.
- The Vercel build requires `DATABASE_URL`.
- DashScope powers real AI try-on when `DASHSCOPE_API_KEY` is configured.
- Development may use an explicitly labelled fallback preview; production does not silently use the fallback.
- Do not claim features that are not implemented.
- Describe Canvas/WebGL as the homepage presentation layer, not as the implementation of every application screen.

## Presentation Style

- Product and engineering receive equal emphasis.
- Keep paragraphs short and use tables only where they improve comparison.
- Prefer concrete descriptions over marketing language.
- Make the production demo and quick-start commands visible near the top.
- Keep the README useful even before screenshots are added.

## Validation

Before completion:

- Check every referenced script against `package.json`.
- Check environment variables against `.env.example`.
- Check deployment instructions against `vercel.json` and both Prisma schemas.
- Run Markdown-oriented checks available in the repository, plus `git diff --check`.
- Verify all internal paths and external links are valid in structure.

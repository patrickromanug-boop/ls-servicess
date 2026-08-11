# LS Job Hub

am goint to provide for you different prompts for my website i want you to build  so you will run prompt by prompt  but please i need it to be beautiful attractive and unquie so that my clent appreates                                                                                                                                           I am building a public website for LS Services, a company in Uganda whose 

main objective is helping Ugandans find jobs. This is the FIRST of three 

prompts I will give you to build this site in stages — for this prompt, only 

build what is listed under "Scope for this prompt." I will provide the 

remaining pages (user dashboard, plans, document generation, and the full 

admin portal) in separate prompts after this one.

This website connects to an EXISTING Supabase project already shared with a 

separate mobile app. Before starting, connect to this existing Supabase 

project using Lovable's Supabase integration — do NOT create a new Supabase 

project, and do not use any of Lovable's own built-in backend, storage, 

hosting, or database features at any point. All authentication, database 

access, and file storage must go through my connected Supabase project only, 

using standard Supabase client libraries. The final codebase must be fully 

independent and portable, with no Lovable-specific infrastructure 

dependencies. If Lovable's interface offers to set up its own database, 

storage bucket, or auth system at any point, decline that and use my 

connected Supabase project instead.

## Existing Supabase schema (DO NOT recreate — paste your actual schema 

output here, from running this in Supabase's SQL Editor:

SELECT table_name, column_name, data_type, is_nullable, column_default 

FROM information_schema.columns WHERE table_schema = 'public' 

ORDER BY table_name, ordinal_position;

— replace this line with that real output before sending this prompt)

## Branding

Colors: primary blue #1F3FD4, accent orange #F7931E, black #111111, white 

#FFFFFF. Logo lockup: "LS" (L blue, S orange, bold geometric sans-serif) 

followed by "Services" in a small blue pill badge with white text. Clean, 

bold, flat design, no heavy shadows or gradients.

## Homepage design direction

Model the homepage's job browsing experience closely on a mobile app version 

of this same product that already exists, specifically:

- A search bar at the top

- A collapsible "Filters" button (closed by default) that expands into a 

  panel directly below it with Category, Location, and Job Type dropdowns — 

  not a separate page, not a popup, an inline expanding panel

- Job cards showing: a small badge with the organization's initials, job 

  title, organization name, location/job type/views count as small icon + 

  text rows, and a "days remaining until deadline" pill — styled red/urgent 

  if 3 days or fewer remain, neutral grey otherwise

- Above the job list, a live count: "X jobs found" (or "0 jobs found" with 

  an empty state message if nothing matches current filters/search)

- Hero section above all this: clear framing that this is a job portal 

  whose main purpose is helping Ugandans find work — "Find work" and "Hire 

  talent" as the two primary paths

## Job detail — "popup that's really a page" (for SEO)

This is important: implement job details so they FEEL like an instant popup/

modal overlaying the list (same UX as tapping a card in a mobile app), BUT 

give each job a real, unique, crawlable URL underneath (e.g. 

/jobs/[slug]-[id]) that updates in the browser's address bar when opened, 

and that works correctly if someone visits that URL directly or shares it. 

Use Next.js-style routing/parallel routes or an equivalent pattern to 

achieve "modal overlay + real URL + proper page metadata" simultaneously — 

do not implement this as a pure client-side-only popup with no distinct URL, 

since that's invisible to search engines. Each job page needs a real <title> 

and meta description built from the job's title and organization.

Content of the detail popup/page: job title, organization, location, job 

type, deadline, purpose, requirements, other_details, official application 

link. Include:

- A "Report this job" option (small flag icon, opens a short reason form, 

  inserts into reported_jobs — assume this table already exists in the 

  schema)

- A share row using native Web Share API (with a clipboard-copy fallback for 

  browsers that don't support it) sharing the job title + that job's real 

  URL

- An "Apply Now" button — see the login-gating behavior below

## Employer side (no account, no dashboard)

A clear "Hire Talent / Advertise a Job" call-to-action (homepage and its own 

simple page). Tapping it opens a WhatsApp link to this number: 

https://wa.me/256772702263?text=Hi%2C%20I%27m%20interested%20in%20hiring%20

for%20a%20job%20opening — store this as a named constant (LS_ADMIN_WHATSAPP), 

never display the raw number as visible text anywhere on the page. No 

employer login or dashboard — intentionally simple.

## Login-gated apply flow

Browsing job listings and viewing job details requires NO login. The moment 

a user clicks "Apply Now" on a specific job, show a login/signup screen 

BEFORE proceeding — if already logged in, skip straight through. After 

successful login/signup, redirect back to that same job's page to continue, 

not to the homepage. For this prompt, "applying" means showing the job's 

official_link with an "Apply on official site" button — do not build a full 

CV/auto-apply system here.

## Authentication

- Standard Supabase Auth: email/password + Google sign-in

- Required checkbox before signup completes: "I agree to the Terms & 

  Conditions and Privacy Policy" (linking to real pages, placeholder legal 

  content, clearly commented as needing real legal review before launch)

- "Forgot password" flow using Supabase Auth's built-in password reset email

- If an account was created via Google, and they try "forgot password," show 

  a message directing them to use "Continue with Google" instead of sending 

  a reset email

## Other Services section (homepage)

Two cards:

- "Bulk SMS & Business Compliance Services" — short general description 

  hinting at registrations/documentation/compliance support, without naming 

  NSSF/TIN/NIRA individually — button opens 

  https://wa.me/256772702263?text=Hi%2C%20I%27m%20interested%20in%20Bulk%20

  SMS%20or%20Compliance%20Services

- "Web Development" — websites, apps, and systems — button opens 

  https://wa.me/256706631094?text=Hi%2C%20I%27m%20interested%20in%20Web%20

  Development%20services

Store both numbers as named constants, never as visible text.

## Additional pages for this prompt

- About Us — simple page about LS Services

- Contact Us — simple page with contact details/form

- Terms & Conditions, Privacy Policy, Cancellation & Refund Policy — 

  placeholder legal content, each its own page, refund policy kept separate 

  from the general terms

## Trust messaging

On the signup form, show a short visible reassurance line near the form: 

"Your information is safe with us. We never sell or share your data — it's 

only used to help you find work or prepare your documents."

## Scope for THIS prompt only

1. Homepage (hero, job feed with search/filters, Other Services section)

2. Job listing + job detail (popup-with-real-URL pattern) pages

3. Hire Talent page

4. About Us, Contact Us pages

5. Terms & Conditions, Privacy Policy, Cancellation & Refund Policy pages

6. Login, Sign-up (with T&Cs checkbox), Forgot Password

7. The login-gated "Apply Now" redirect behavior

Do NOT build the user dashboard, plans/subscription screen, document 

generation, or any admin functionality yet — those come in the next two 

prompts. Confirm you understand this scope before starting, and ask me 

anything unclear about the schema, the modal-with-real-URL pattern, or the 

Supabase-only constraint before you begin.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ls-workforce-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2521016d-678b-4a72-9733-8bad08997023).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

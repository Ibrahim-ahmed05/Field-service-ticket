# Deploy FieldFlow to Vercel

## Current readiness

The application builds server-rendered pages and API routes with Nitro's Vercel
Node preset. It is not a static Vite site. Do not set `dist` as the output directory
or add a catch-all rewrite to `index.html`.

The frontend reads and writes operational data through `/api/v1` routes. The
production ticket service connects those routes to MongoDB. Browser localStorage
is not used; a small cookie stores only the light/dark theme preference.

Authentication currently trusts mock request headers and defaults to manager.
Use demo data and restrict deployment access with Vercel Deployment Protection
where available. Do not expose real customer data until verified authentication,
ownership checks, and database persistence are integrated.

## Import the repository

1. Push the deployment configuration changes to the branch you want to deploy.
2. In Vercel, choose Add New Project and import `Ibrahim-ahmed05/Field-service-ticket`.
3. Use the repository root as Root Directory. The local parent folder named
   `Field Service Ticket System` is not part of this repository.
4. Framework Preset: TanStack Start. Node.js: 24.x.
5. Install Command: `npm ci`. Build Command: `npm run build`.
6. Leave Output Directory at the framework default. Nitro generates
   `.vercel/output`, including both static assets and server functions.

## Environment variables

Add these in Vercel Project Settings > Environment Variables, using the values
provided by your backend developer. Local `.env` files are not automatically
available to Git-based Vercel builds.

| Name | Value |
| --- | --- |
| MONGODB_URI | The supplied MongoDB connection string; keep it server-only |
| MONGODB_DB | The supplied database name |
| NOTIFICATION_PROVIDER | `DevLog` for this demo |

Select Production and, if needed, Preview. Prefer a separate demo database for
previews. Do not prefix database credentials with `VITE_`: those variables can
be exposed to the browser. Do not commit `.env` or paste credentials into logs.
Vercel manages PORT and NODE_ENV; do not copy local values for those settings.
Redeploy after changing environment variables.

MongoDB Atlas must allow connections from the deployment's network. Configure
network access with the database owner according to the project's access policy.

## Build and deploy

Click Deploy after configuring the project and environment variables. Subsequent
pushes to the configured production branch trigger deployments automatically.
Other branches normally create previews.

Local verification: `npm ci`, then `npm run build`. The build should generate
`.vercel/output/config.json` and a Node server function under
`.vercel/output/functions`.

The build script explicitly sets NODE_ENV=production so a local development
setting cannot generate incompatible React server code.

Do not add `npm run seed` to the install or build commands. The existing seed
script deletes all records in its target collections before inserting demo data.
Run it only after the database owner explicitly approves resetting that database.

## Verify the deployment

- Open the landing page and dashboard, then refresh a nested route.
- Check `/api/v1/tickets` returns JSON rather than an HTML fallback.
- Check Vercel function logs for runtime errors without sharing credentials.
- Confirm the theme toggle and mobile navigation work.
- Create a test ticket, refresh the page, and verify it from a second browser and
  in MongoDB. Confirm assignment, status, note and evidence changes the same way.

Before production use, replace the current demo identity headers with verified
authenticated sessions. The MongoDB persistence and frontend API integration are
already enabled.

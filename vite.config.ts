// Vite and TanStack Start build configuration for FieldFlow
// Standard TanStack devtools, React plugin, Tailwind CSS, TypeScript path aliases,
// Nitro build configuration, and environment handling.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});


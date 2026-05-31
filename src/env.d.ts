/// <reference types="astro/client" />

// The @fontsource-variable/* packages are imported only for their CSS side
// effects and ship no type declarations; declare them so `astro check` (strict)
// does not flag the side-effect imports in BaseLayout.astro.
declare module "@fontsource-variable/*";

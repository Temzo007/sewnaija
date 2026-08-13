// Tailwind v4 is wired through @tailwindcss/vite, so no PostCSS plugins are
// needed here. This empty config exists to stop postcss-load-config from
// walking up into the parent workspace (which carries a Tailwind v3 config)
// and breaking this project's build when the folder is nested inside it.
export default {
  plugins: {},
};

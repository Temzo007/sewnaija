export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'), // <- instead of require('tailwindcss')
    require('autoprefixer'),
  ],
};

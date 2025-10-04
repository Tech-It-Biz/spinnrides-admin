module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#db532a',
      },
      fontFamily: {
        'humane': ['Humane', 'sans-serif'],
        'caveat': ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}
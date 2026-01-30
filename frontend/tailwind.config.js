/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sns-primary': '#dc2626', // Custom red from screenshots
            },
        },
    },
    plugins: [],
}

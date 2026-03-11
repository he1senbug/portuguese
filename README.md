# Português — AI Language Learning App

Modern web application for learning European Portuguese, with interface in Ukrainian.
Built with Angular 17, Tailwind CSS, Firebase (Auth + Firestore), and Gemini AI.

## Features
- 🧠 **AI-Powered Topics**: Generates custom vocabulary sets based on your profession or interests.
- 📚 **Rich Word Data**: Noun genders/plurals, verb conjugations, adjective degrees, translations, phonetic transcriptions, and usage examples.
- 🎓 **Interactive Exams**: Translate words, choose correct genders, form plurals, conjugate verbs.
- 📈 **Smart Progress Tracking**: Tracks score per word. 100% mastery requires net positive correct answers.
- 🏆 **Global Exams**: Train hardest words, least-seen words, or random mixes.
- 🤖 **Gradual AI Mode**: Switches between Gemini models automatically if rate limits are reached.
- 📱 **PWA Support**: Installable offline-first app on mobile and desktop.

---

## Local Development

### Prerequisites
- Node.js 18+
- Angular CLI 17+ (`npm i -g @angular/cli@17`)
- Firebase project configured (see `firebase_setup.md`)

### Setup

1. Clone and install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and fill in your Firebase config:
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

3. Run locally:
   ```bash
   npm start
   ```
   Open `http://localhost:4200` in your browser.

> Note: To use the AI topic generation, you must enter a free Gemini API key in the app's Settings page. Get one from Google AI Studio.

---

## Deployment to GitHub Pages

This app is configured for automatic deployment via GitHub Actions.

1. Go to your GitHub repository **Settings -> Secrets and variables -> Actions**.
2. Add the following Repository Secrets (from your `.env` file):
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
3. Optional: Add `CUSTOM_DOMAIN` secret if you are deploying to a custom domain (e.g., `learn-pt.com`).
4. Commit and push to the `master` branch. The Action will build and deploy the app to the `gh-pages` branch.
5. In your repo **Settings -> Pages**, set the source to deploy from the `gh-pages` branch.

*If deploying to a subdirectory (like `username.github.io/portuguese/`), ensure the `--base-href` flag in `.github/workflows/deploy.yml` matches your repo name.*

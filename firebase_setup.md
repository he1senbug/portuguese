# Firebase & PWA Setup Guide

This guide walks you through setting up Firebase and deploying the application to GitHub Pages with PWA (Progressive Web App) support.

## 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project**.
3. Name it (e.g., `portuguese-learning-app`). Turn off Google Analytics if you don't need it.

### Web App Registration
1. In the Project Overview, click the Web icon (`</>`) to add an app.
2. Register the app (e.g., `pt-web`).
3. Copy the `firebaseConfig` block. You will need these values for your `.env` file and GitHub Secrets.

---

## 2. Authentication Setup

1. Go to **Authentication** in the left menu -> **Get Started**.
2. Select the **Sign-in method** tab.

### Email/Password
- Click **Email/Password**.
- Enable both "Email/Password" and "Email link". Click Save.

### Google Login
- Click **Add new provider** -> **Google**.
- Enable it. Select your support email. Click Save.

### Facebook Login (Optional)
1. Click **Add new provider** -> **Facebook**.
2. Enable it.
3. You will need an **App ID** and **App Secret** from the [Facebook Developer Portal](https://developers.facebook.com/).
4. Create a Facebook app, select "Consumer" or "None" type.
5. Add the "Facebook Login" product.
6. **Important**: Under Facebook Login settings -> Valid OAuth Redirect URIs, paste the URI provided in the Firebase Console (usually `https://[YOUR-PROJECT-ID].firebaseapp.com/__/auth/handler`).

---

## 3. Firestore Database Setup

1. Go to **Firestore Database** in the left menu.
2. Click **Create database**. Start in **Production mode**.
3. Go to the **Rules** tab and paste these security rules. They ensure users can only read/write their own data in their subcollections (`users/{uid}/*`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // User can only read/write their own overarching doc
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Allow access to all subcollections inside the user's document
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```
4. Click **Publish**.

---

## 4. GitHub Pages & Custom Domain

### GitHub Secrets
Since the app uses environment variables for Firebase keys injected at build time, you must add them to your GitHub repo so the Actions pipeline can build the app.

Go to Repository **Settings -> Secrets and variables -> Actions**, and add:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

### Custom Domain
If you have your own domain (e.g., `learnportuguese.com`):
1. In GitHub repo **Settings -> Pages**, enter your Custom Domain. GitHub will automatically provision a Let's Encrypt SSL cert.
2. In your domain registrar (GoDaddy, Namecheap, etc.), add four `A` records pointing to GitHub's IPs (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
3. Add a Repository Secret called `CUSTOM_DOMAIN` with your domain (e.g., `learnportuguese.com`). This tells the GitHub Action to generate a `CNAME` file.
4. **Important**: In `.github/workflows/deploy.yml`, remove `--base-href /portuguese/` from the build step and change it to `--base-href /`.
5. **Important**: Add your custom domain to the **Authorized domains** list in Firebase Authentication settings.

---

## 5. PWA (Progressive Web App)

The app is already configured for PWA. The criteria for browsers to show the "Install App" prompt are:
1. Valid `manifest.webmanifest` (included).
2. Registered Service Worker (included).
3. Served over **HTTPS** (GitHub Pages provides this by default).

Once deployed, users will see an "Install" button in the app's settings menu, or they can install it directly from the Chrome/Safari URL bar.

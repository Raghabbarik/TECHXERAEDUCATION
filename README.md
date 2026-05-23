
# TechXera Campus Portal

A modern, high-performance campus management ecosystem designed for TechXera students and administrators.

## Deployment to GitHub

To push this project to your repository, run the following commands in your terminal:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/mmywebsitescom-byte/TECHXERAEDUCATION.git
git push -u origin main
```

## Deployment to Vercel

1. Push your code to your GitHub repository.
2. Connect the repository to Vercel.
3. In the Vercel project settings, add the following Environment Variables:
   - `GEMINI_API_KEY`: `AIzaSyB3pajL682m1oUDcA3d-yYwQMYYRLG1bdw`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: (Your Project ID)
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: (Your App ID)
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: (Your Firebase API Key)
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: (Your Auth Domain)
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: (Your Sender ID)
4. Deploy!

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Architecture**: Tailwind CSS + ShadCN UI
- **Animations**: GSAP + Framer Motion
- **Database/Auth**: Firebase Firestore & Firebase Auth
- **AI Core**: Genkit with Gemini 2.5 Flash

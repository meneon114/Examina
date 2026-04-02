# Examina - MCQ Platform

Examina is a smart MCQ platform powered by Next.js, Firebase, and Gemini AI. It allows teachers to upload exams (via JSON) and students to take them, auto-grade their answers, and receive AI-powered explanations for every question.

## Tech Stack
- **Frontend & Backend**: Next.js (App Router), React, Tailwind CSS
- **Database & Authentication**: Firebase (Firestore, Google Auth)
- **AI Integrations**: Google Gemini API (`gemini-1.5-flash`)

## Environment Variables

Create a `.env.local` file in the root of the project and add the following variables:

```env
# Gemini API Key for AI Explanations
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Teacher Account Email (to determine role)
NEXT_PUBLIC_TEACHER_EMAIL=your_email@gmail.com
```

### Setup Instructions

1. **Firebase**:
   - Create a Firebase project.
   - Enable **Firestore Database** and set it to test mode or configure security rules.
   - Enable **Authentication** and turn on the "Google" sign-in provider.
   - Register a Web App in settings and copy the Firebase config variables into `.env.local`.

2. **Gemini API Key**:
   - Go to Google AI Studio and create an API key. 
   - Add it to `GEMINI_API_KEY`.

3. **Teacher Setup**:
   - Set `NEXT_PUBLIC_TEACHER_EMAIL` to your exact Google account email address. When you log in with this account, you will have access to the Teacher Dashboard.

## How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Example Exam JSON Schema

When uploading an exam as a teacher, ensure your `.json` file follows this exact strict structure:

```json
{
  "examTitle": "Physics Midterm",
  "examDescription": "A test on classical mechanics.",
  "questions": [
    {
      "id": "q1",
      "questionText": "What is Newton's Second Law of Motion?",
      "options": ["F = ma", "E = mc^2", "v = d/t", "a = v^2/r"],
      "correctAnswer": "F = ma"
    }
  ]
}
```

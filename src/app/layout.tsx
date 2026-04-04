import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ExamHeaderProvider } from "@/components/ExamHeaderContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Examina - MCQ Platform",
  description: "A platform for teachers and students to conduct MCQ exams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen relative`} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `window.history.scrollRestoration = "manual"` }} />
        {/* Dynamic Background Elements */}
        <div className="bg-mesh" aria-hidden="true" />
        <div className="bg-dot-pattern" aria-hidden="true" />
        
        <AuthProvider>
          <ExamHeaderProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 min-h-[calc(100vh-160px)]">
              {children}
            </main>
            <Footer />

          </ExamHeaderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

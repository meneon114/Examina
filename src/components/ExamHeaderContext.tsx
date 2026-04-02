"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ExamHeaderData {
  timeLeft: number;
  totalQuestions: number;
  answeredCount: number;
  examTitle: string;
}

interface ExamHeaderContextType {
  headerData: ExamHeaderData | null;
  setHeaderData: (data: ExamHeaderData | null) => void;
}

const ExamHeaderContext = createContext<ExamHeaderContextType | undefined>(undefined);

export function ExamHeaderProvider({ children }: { children: ReactNode }) {
  const [headerData, setHeaderData] = useState<ExamHeaderData | null>(null);

  return (
    <ExamHeaderContext.Provider value={{ headerData, setHeaderData }}>
      {children}
    </ExamHeaderContext.Provider>
  );
}

export function useExamHeader() {
  const context = useContext(ExamHeaderContext);
  if (context === undefined) {
    throw new Error("useExamHeader must be used within an ExamHeaderProvider");
  }
  return context;
}

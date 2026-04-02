import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { Exam, ExamResult } from "./types";

const EXAMS_COLLECTION = "exams";
const RESULTS_COLLECTION = "results";

export async function saveExam(examData: Omit<Exam, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, EXAMS_COLLECTION), examData);
  return docRef.id;
}

export async function getTeacherExams(teacherEmail: string): Promise<Exam[]> {
  const q = query(
    collection(db, EXAMS_COLLECTION),
    where("creatorEmail", "==", teacherEmail),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
}

export async function getAllExams(): Promise<Exam[]> {
  const q = query(collection(db, EXAMS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
}

export async function getExamById(id: string): Promise<Exam | null> {
  const docRef = doc(db, EXAMS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Exam;
  }
  return null;
}

export async function deleteExam(id: string): Promise<void> {
  await deleteDoc(doc(db, EXAMS_COLLECTION, id));
}

export async function updateExam(id: string, examData: Omit<Exam, "id">): Promise<void> {
  await updateDoc(doc(db, EXAMS_COLLECTION, id), examData as any);
}

export async function saveExamResult(result: ExamResult): Promise<string> {
  const docRef = await addDoc(collection(db, RESULTS_COLLECTION), result);
  return docRef.id;
}

export async function getStudentResults(email: string): Promise<ExamResult[]> {
  const q = query(
    collection(db, RESULTS_COLLECTION),
    where("studentEmail", "==", email),
    orderBy("submittedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamResult));
}

export async function getAllResults(): Promise<ExamResult[]> {
  const q = query(
    collection(db, RESULTS_COLLECTION),
    orderBy("submittedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamResult));
}

export async function getResultById(id: string): Promise<ExamResult | null> {
  const docRef = doc(db, RESULTS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as ExamResult;
  }
  return null;
}

export async function deleteResult(id: string): Promise<void> {
  await deleteDoc(doc(db, RESULTS_COLLECTION, id));
}

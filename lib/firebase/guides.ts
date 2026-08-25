import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GuideCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string; // markdown
  categoryId: string;
  tags: string[];
  icon: string; // emoji
  readTime: string;
  coverImage: string | null;
  published: boolean;
  authorId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type GuideInput = Omit<Guide, "id" | "createdAt" | "updatedAt">;
export type GuideCategoryInput = Omit<GuideCategory, "id">;

// ─── Categories ──────────────────────────────────────────────────────────────

const categoriesRef = collection(db, "guideCategories");

export async function getCategories(): Promise<GuideCategory[]> {
  const snap = await getDocs(query(categoriesRef, orderBy("order", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GuideCategory);
}

export async function getCategoryById(id: string): Promise<GuideCategory | null> {
  const snap = await getDoc(doc(db, "guideCategories", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as GuideCategory;
}

export async function createCategory(data: GuideCategoryInput): Promise<string> {
  const docRef = await addDoc(categoriesRef, data);
  return docRef.id;
}

export async function updateCategory(id: string, data: Partial<GuideCategoryInput>): Promise<void> {
  await updateDoc(doc(db, "guideCategories", id), data);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "guideCategories", id));
}

// ─── Guides ──────────────────────────────────────────────────────────────────

const guidesRef = collection(db, "guides");

export async function getGuides(): Promise<Guide[]> {
  const snap = await getDocs(query(guidesRef, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Guide);
}

export async function getPublishedGuides(): Promise<Guide[]> {
  const snap = await getDocs(
    query(guidesRef, where("published", "==", true), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Guide);
}

export async function getGuidesByCategory(categoryId: string): Promise<Guide[]> {
  const snap = await getDocs(
    query(
      guidesRef,
      where("published", "==", true),
      where("categoryId", "==", categoryId),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Guide);
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  const snap = await getDocs(query(guidesRef, where("slug", "==", slug)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Guide;
}

export async function getGuideById(id: string): Promise<Guide | null> {
  const snap = await getDoc(doc(db, "guides", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Guide;
}

export async function createGuide(data: GuideInput): Promise<string> {
  const docRef = await addDoc(guidesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateGuide(id: string, data: Partial<GuideInput>): Promise<void> {
  await updateDoc(doc(db, "guides", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGuide(id: string): Promise<void> {
  await deleteDoc(doc(db, "guides", id));
}

// ─── Storage (images) ────────────────────────────────────────────────────────

/**
 * Uploads an image file to Firebase Storage under `guides/images/`.
 * Returns the public download URL.
 */
export async function uploadGuideImage(file: File): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `guides/images/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

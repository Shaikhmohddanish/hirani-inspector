import { create } from "zustand";

export type ImageStatus = "pending" | "analyzing" | "completed" | "error";

export type LogEntry = {
  timestamp: string;
  message: string;
  type: "default" | "info" | "error" | "cost";
};

export type AnnotationBox = {
  id: string;
  label?: string;
  coords: [number, number, number, number];
};

export type ImageRecord = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  status: ImageStatus;
  comment: string;
  annotations: AnnotationBox[];
  hasAnnotatedAsset: boolean;
  dataUrl?: string; // Base64 data URL for client-side storage
};

interface AppState {
  images: ImageRecord[];
  logs: LogEntry[];
  addImages: (records: ImageRecord[]) => void;
  updateStatus: (id: string, status: ImageStatus, comment?: string) => void;
  toggleAnnotation: (id: string, hasAnnotation: boolean) => void;
  removeImage: (id: string) => void;
  updateAnnotations: (id: string, annotations: AnnotationBox[]) => void;
  addLog: (message: string, type?: LogEntry["type"]) => void;
  clearLogs: () => void;
  clear: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  images: [],
  logs: [],
  addImages: (records) =>
    set((state) => ({
      images: [...records, ...state.images],
    })),
  updateStatus: (id, status, comment) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              status,
              comment: comment ?? img.comment,
            }
          : img,
      ),
    })),
  toggleAnnotation: (id, hasAnnotation) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              hasAnnotatedAsset: hasAnnotation,
            }
          : img,
      ),
    })),
  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
    })),
  updateAnnotations: (id, annotations) =>
    set((state) => ({
      images: state.images.map((img) => (img.id === id ? { ...img, annotations } : img)),
    })),
  addLog: (message, type = "default") =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type,
        },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
  clear: () => set({ images: [], logs: [] }),
}));

// Polyfill for crypto.randomUUID() for environments that don't support it
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function fabricateRecordsFromFiles(files: FileList | null): Promise<ImageRecord[]> {
  if (!files || !files.length) return [];
  const records = await Promise.all(
    Array.from(files).map(async (file) => {
      // Convert to data URL for client-side storage
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      return {
        id: generateUUID(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: "pending" as ImageStatus,
        comment: "",
        annotations: [],
        hasAnnotatedAsset: false,
        dataUrl,
      };
    })
  );
  return records;
}

// Compressed version for reports - reduces payload size
export async function fabricateRecordsFromFilesCompressed(files: FileList | null): Promise<ImageRecord[]> {
  if (!files || !files.length) return [];
  const records = await Promise.all(
    Array.from(files).map(async (file) => {
      // Compress image to reduce payload size
      const compressedDataUrl = await compressImage(file, 0.7, 1200);
      return {
        id: generateUUID(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: "pending" as ImageStatus,
        comment: "",
        annotations: [],
        hasAnnotatedAsset: false,
        dataUrl: compressedDataUrl,
      };
    })
  );
  return records;
}

// Compress image using canvas
async function compressImage(file: File, quality: number = 0.7, maxDimension: number = 1200): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

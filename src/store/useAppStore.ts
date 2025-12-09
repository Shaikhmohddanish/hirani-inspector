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

export function fabricateRecordsFromFiles(files: FileList | null): ImageRecord[] {
  if (!files || !files.length) return [];
  return Array.from(files).map((file) => ({
    id: generateUUID(),
    name: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    status: "pending" as ImageStatus,
    comment: "",
    annotations: [],
    hasAnnotatedAsset: false,
  }));
}

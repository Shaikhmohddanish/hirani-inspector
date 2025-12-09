"use client";

import { useState } from "react";
import { useAppStore, AnnotationBox } from "@/store/useAppStore";
import { ImageCanvas } from "@/components/analysis/ImageCanvas";
import { LogTerminal } from "@/components/common/LogTerminal";
import { fabricateRecordsFromFilesCompressed } from "@/store/useAppStore";

export function UnifiedInspectorPanel() {
  const images = useAppStore((state) => state.images);
  const addImages = useAppStore((state) => state.addImages);
  const removeImage = useAppStore((state) => state.removeImage);
  const updateStatus = useAppStore((state) => state.updateStatus);
  const updateAnnotations = useAppStore((state) => state.updateAnnotations);
  const addLog = useAppStore((state) => state.addLog);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [rateSeconds, setRateSeconds] = useState(1.0);
  const [generating, setGenerating] = useState(false);

  const currentImage = images[currentIndex];

  // Upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    // Compress images before storing
    addLog(`Loading and compressing ${files?.length || 0} images...`, "info");
    const records = await fabricateRecordsFromFilesCompressed(files);
    if (!records.length) return;

    addImages(records);
    addLog(`Loaded ${records.length} images`, "info");
    
    // Upload to Cloudinary for persistent storage
    addLog(`Uploading ${records.length} images to cloud storage...`, "info");
    let uploaded = 0;
    try {
      for (const record of records) {
        if (!record.dataUrl) continue;
        const base64Data = record.dataUrl.split(',')[1];
        const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        await fetch(`/api/images/${record.id}`, {
          method: "POST",
          body: buffer,
        });
        uploaded++;
        
        if (uploaded % 10 === 0) {
          addLog(`Uploaded ${uploaded}/${records.length}...`, "info");
        }
      }
      addLog(`Successfully uploaded ${uploaded} images`, "info");
    } catch (error) {
      addLog(`Upload error: ${error instanceof Error ? error.message : 'Unknown'}`, "error");
    }
    
    event.target.value = "";
  };

  // Analysis handlers - Batch analyze all pending images
  const handleAnalyzeAll = async () => {
    const pending = images.filter((img) => img.status === "pending");
    if (!pending.length) return;

    addLog(`Starting batch analysis of ${pending.length} images`, "info");
    setAnalyzing(true);
    setStopRequested(false);
    setBatchProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      if (stopRequested) {
        addLog("Analysis stopped by user", "info");
        break;
      }
      const img = pending[i];
      updateStatus(img.id, "analyzing");
      setBatchProgress({ current: i + 1, total: pending.length });

      try {
        // Extract base64 from data URL
        const base64Data = img.dataUrl?.split(',')[1] || '';
        
        const formData = new FormData();
        formData.append("imageBase64", base64Data);

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (result.success && result.comment) {
          updateStatus(img.id, "completed", result.comment);
          addLog(`Image ${i + 1}/${pending.length}: "${img.name}" completed`, "info");
          if (result.costUsd) {
            addLog(result.costUsd.toFixed(6), "cost");
          }
        } else {
          updateStatus(img.id, "error", result.error || "Analysis failed");
          addLog(`Image ${i + 1}: Error - ${result.error}`, "error");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        updateStatus(img.id, "error", errorMsg);
        addLog(`Image ${i + 1}: Exception - ${errorMsg}`, "error");
      }

      if (i < pending.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, rateSeconds * 1000));
      }
    }

    addLog(`Batch analysis completed`, "info");
    setAnalyzing(false);
    setBatchProgress({ current: 0, total: 0 });
  };

  const handleStopAnalysis = () => {
    setStopRequested(true);
    addLog("Requested stop of analysis", "info");
  };

  // Annotation handlers
  const handleBoxAdded = (box: AnnotationBox) => {
    if (!currentImage) return;
    const updated = [...currentImage.annotations, box];
    updateAnnotations(currentImage.id, updated);
  };

  const handleBoxRemoved = (boxId: string) => {
    if (!currentImage) return;
    const updated = currentImage.annotations.filter((b) => b.id !== boxId);
    updateAnnotations(currentImage.id, updated);
  };

  const handleSaveAllAnnotations = async () => {
    const imagesWithBoxes = images.filter((img) => img.annotations.length > 0);
    if (!imagesWithBoxes.length) {
      addLog("No annotations to save", "info");
      return;
    }

    addLog(`Saving ${imagesWithBoxes.length} annotated images...`, "info");
    let saved = 0;

    for (const img of imagesWithBoxes) {
      try {
        const response = await fetch(`/api/images/${img.id}/annotated`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ annotations: img.annotations }),
        });

        if (response.ok) {
          saved++;
          useAppStore.getState().toggleAnnotation(img.id, true);
        }
      } catch (error) {
        addLog(`Error saving annotations for "${img.name}"`, "error");
      }
    }

    addLog(`Saved ${saved} annotated images`, "info");
  };

  const handleClearBoxes = () => {
    if (!currentImage) return;
    updateAnnotations(currentImage.id, []);
    useAppStore.getState().toggleAnnotation(currentImage.id, false);
    addLog("Cleared boxes for current image", "info");
  };

  // Report handlers
  const handleGenerateNormal = async () => {
    if (!images.length) return;
    setGenerating(true);
    addLog("Generating normal report...", "info");
    try {
      // Upload metadata for all images
      addLog("Syncing metadata...", "info");
      await Promise.all(
        images.map((img) =>
          fetch(`/api/images/${img.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              comment: img.comment, 
              annotations: img.annotations,
              name: img.name
            }),
          })
        )
      );

      // Generate report using image IDs
      addLog("Generating document...", "info");
      const response = await fetch("/api/reports/normal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: images.map(img => img.id) }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Report failed: ${errorText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `inspection-report-${new Date().toISOString().split("T")[0]}.docx`;
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addLog(`Normal report saved: ${filename}`, "info");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      addLog(`Report generation error: ${errorMsg}`, "error");
      alert(`Error: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateModified = async () => {
    if (!images.length) return;
    setGenerating(true);
    addLog("Generating modified report...", "info");
    try {
      // Upload metadata for all images
      addLog("Syncing metadata...", "info");
      await Promise.all(
        images.map((img) =>
          fetch(`/api/images/${img.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              comment: img.comment, 
              annotations: img.annotations,
              name: img.name
            }),
          })
        )
      );

      // Generate report using image IDs
      addLog("Generating document...", "info");
      const response = await fetch("/api/reports/modified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: images.map(img => img.id) }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Report failed: ${errorText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `inspection-report-annotated-${new Date().toISOString().split("T")[0]}.docx`;
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addLog(`Modified report saved: ${filename}`, "info");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      addLog(`Report generation error: ${errorMsg}`, "error");
      alert(`Error: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  // Navigation
  const goPrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1));

  const completedCount = images.filter((img) => img.status === "completed").length;
  const pendingCount = images.filter((img) => img.status === "pending").length;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-300 bg-white px-6 py-3">
        <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
          Load Images
        </label>
        <button
          onClick={handleAnalyzeAll}
          disabled={analyzing || pendingCount === 0}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-slate-300"
        >
          Start GPT Analysis
        </button>
        <button
          onClick={handleStopAnalysis}
          disabled={!analyzing}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-slate-300"
        >
          Stop Analysis
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Rate (s per image):
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={rateSeconds}
            onChange={(e) => setRateSeconds(parseFloat(e.target.value))}
            className="w-20 rounded border border-slate-300 px-2 py-1"
          />
        </label>
        <div className="ml-auto flex items-center gap-4">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </form>
          {batchProgress.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
              <span className="text-sm text-slate-600">
                {batchProgress.current}/{batchProgress.total}
              </span>
            </div>
          )}
          <span className="text-sm text-slate-600">
            {images.length} images | {completedCount} analyzed | {pendingCount} pending
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Canvas */}
        <div className="flex flex-1 flex-col border-r border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <div>
              <span className="text-sm font-semibold text-slate-900">
                Image {images.length > 0 ? currentIndex + 1 : 0} of {images.length}
              </span>
              <span
                className={`ml-3 text-sm ${
                  currentImage?.status === "completed"
                    ? "text-green-600"
                    : currentImage?.status === "analyzing"
                      ? "text-blue-600"
                      : currentImage?.status === "error"
                        ? "text-rose-600"
                        : "text-slate-400"
                }`}
              >
                {currentImage?.status || "No images"}
              </span>
            </div>
          </div>

          <div className="flex-1 bg-slate-900">
            {currentImage && currentImage.dataUrl ? (
              <ImageCanvas
                imageSrc={currentImage.dataUrl}
                boxes={currentImage.annotations}
                onBoxAdded={handleBoxAdded}
                onBoxRemoved={handleBoxRemoved}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                No image loaded
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={goNext}
              disabled={!images.length || currentIndex === images.length - 1}
              className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
            >
              Next
            </button>
            <button
              onClick={handleSaveAllAnnotations}
              className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Save All Annotations
            </button>
            <button
              onClick={handleClearBoxes}
              disabled={!currentImage}
              className="rounded bg-slate-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
            >
              Clear Boxes
            </button>
          </div>
        </div>

        {/* Right: Comments & Tools */}
        <div className="flex w-96 flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* GPT Comment */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                GPT Comment (editable):
              </label>
              <textarea
                value={currentImage?.comment || ""}
                onChange={(e) =>
                  currentImage && updateStatus(currentImage.id, currentImage.status, e.target.value)
                }
                placeholder="Analysis results will appear here..."
                className="h-32 w-full text-black rounded border border-slate-300 p-2 text-sm"
              />
            </div>

            {/* Annotation Tools */}
            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Annotation Tools</h3>
              <p className="mb-2 text-xs text-slate-600">Draw Mode: Rectangle Box</p>
              <p className="mb-3 text-xs text-slate-500">Instructions: Click-drag to draw box on image.</p>
              <div className="mb-2 text-xs font-semibold text-slate-700">Boxes:</div>
              <div className="max-h-32 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs">
                {!currentImage || currentImage.annotations.length === 0 ? (
                  <p className="text-slate-400">No boxes drawn</p>
                ) : (
                  currentImage.annotations.map((box, idx) => (
                    <div key={box.id} className="text-slate-600">
                      {idx + 1}: {box.coords.map((c) => Math.round(c)).join(", ")}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Report Generation */}
            <div className="space-y-2">
              <button
                onClick={handleGenerateNormal}
                disabled={generating || !images.length}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                Generate Normal Report
              </button>
              <button
                onClick={handleGenerateModified}
                disabled={generating || !images.length}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300"
              >
                Generate Modified Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Log Terminal */}
      <div className="border-t border-slate-300">
        <LogTerminal />
      </div>
    </div>
  );
}

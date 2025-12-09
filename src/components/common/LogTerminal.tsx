"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

export function LogTerminal() {
  const logs = useAppStore((state) => state.logs);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50">
      <div className="border-b border-slate-300 bg-slate-100 px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-700">Operation Log</h3>
      </div>
      <div className="h-40 overflow-y-auto p-3 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-400">No operations yet...</p>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log, index) => (
              <div key={index} className="text-slate-700">
                <span className="text-slate-500">[{log.timestamp}]</span>{" "}
                {log.type === "cost" && (
                  <span className="text-green-700 font-semibold">${log.message}</span>
                )}
                {log.type === "error" && (
                  <span className="text-red-700">{log.message}</span>
                )}
                {log.type === "info" && (
                  <span className="text-blue-700">{log.message}</span>
                )}
                {log.type === "default" && log.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

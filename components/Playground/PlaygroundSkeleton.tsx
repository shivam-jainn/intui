"use client";

import React from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-700/50 rounded-md ${className}`} />
);

const PlaygroundSkeleton = () => {
  return (
    <div style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }} className="bg-background p-4">
      <PanelGroup direction="horizontal">
        {/* Left Panel: Question Metadata & Description */}
        <Panel>
          <div className="flex flex-col h-full gap-4 pr-4">
            <Skeleton className="h-10 w-3/4 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle style={{ width: "0.5rem" }} className="bg-transparent" />

        {/* Right Panel: Editor & Tests */}
        <Panel>
          <PanelGroup direction="vertical">
            {/* Editor Area */}
            <Panel minSize={50}>
              <div className="h-full flex flex-col pl-4">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-8 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
                <Skeleton className="flex-1 w-full" />
              </div>
            </Panel>

            <PanelResizeHandle style={{ height: "0.5rem" }} className="bg-transparent" />

            {/* Test Results Area */}
            <Panel defaultSize={30} minSize={20} maxSize={40}>
              <div className="h-full pl-4 pt-4">
                <div className="flex gap-4 mb-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-full w-full" />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default PlaygroundSkeleton;

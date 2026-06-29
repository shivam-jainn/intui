"use client";

import React, { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import QuestionPanel from "@/components/Playground/QuestionPanel";
import { getDesc, getTestCases } from "@/lib/common/playground/desc_and_driver";
import CodeEditor from "@/components/Playground/CodeEditor";
import RunAndSubmissionBar from "@/components/Playground/TestCard";
import PlaygroundSkeleton from "@/components/Playground/PlaygroundSkeleton";
import ScreenLockUp from "@/components/ScreenLockUp";

interface QuestionData {
  name: string;
  difficulty: string;
  description: string;
  testCases: string[];
  companies?: string[];
  topics?: string[];
}

export default function Page({ params }: { params: { questionid: string } }) {
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (code: string) => {
    void code;
  };

  async function fetchQuestion() {
    try {
      setLoading(true);
      setError(null);

      const questionId = decodeURIComponent(params.questionid);
      const [apiResponse, questionDescription, testCases] = await Promise.all([
        fetch(`/api/question/${questionId}`).then((res) => res.json()),
        getDesc(questionId),
        getTestCases(questionId),
      ]);

      setQuestionData({
        ...apiResponse,
        description: questionDescription.question_description,
        testCases: testCases,
      });
    } catch (err) {
      console.error("Error fetching question data:", err);
      setError("Failed to fetch question data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.questionid) {
      fetchQuestion();
    }
  }, [params.questionid]);

  if (loading) {
    return <PlaygroundSkeleton />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!questionData) {
    return <div>No question data found</div>;
  }

  return (
    <div className="playground-page-shell">
      <ScreenLockUp />
      <PanelGroup direction="horizontal">
        <Panel className="playground-panel">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <QuestionPanel
                questionSlug={params.questionid}
                questionTitle={questionData.name}
                difficulty={questionData.difficulty}
                description={questionData.description}
                companies={questionData.companies || []}
                topics={questionData.topics || []}
              />
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="playground-resize-handle playground-resize-handle--vertical" />
        <Panel className="playground-panel">
          <PanelGroup direction="vertical">
            <Panel minSize={50} className="playground-panel">
              <CodeEditor
                questionSlug={params.questionid}
              />
            </Panel>
            <PanelResizeHandle className="playground-resize-handle playground-resize-handle--horizontal" />
            <Panel defaultSize={30} minSize={30} maxSize={30} className="playground-panel" style={{ overflow: 'hidden' }}>
              <RunAndSubmissionBar testCases={questionData.testCases} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

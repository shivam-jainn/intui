"use client";

import React, { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import QuestionPanel from "@/components/Playground/QuestionPanel";
import { getDesc, getTestCases } from "@/lib/common/playground/desc_and_driver";
import CodeEditor from "@/components/Playground/CodeEditor";
import RunAndSubmissionBar from "@/components/Playground/TestCard";
import PlaygroundSkeleton from "@/components/Playground/PlaygroundSkeleton";

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
    console.log("Code changed:", code);
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
    <div style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      <PanelGroup direction="horizontal">
        <Panel>
          <QuestionPanel
            questionSlug={params.questionid}
            questionTitle={questionData.name}
            difficulty={questionData.difficulty}
            description={questionData.description}
            companies={questionData.companies || []}
            topics={questionData.topics || []}
          />
        </Panel>
        <PanelResizeHandle style={{ width: "0.5rem" }} />
        <Panel>
          <PanelGroup direction="vertical">
            <Panel minSize={50}>
              <CodeEditor questionSlug={params.questionid} />
            </Panel>
            <PanelResizeHandle style={{ height: "0.5rem" }} />
            <Panel defaultSize={30} minSize={20} maxSize={40} style={{ overflow: 'auto' }}>
              <RunAndSubmissionBar testCases={questionData.testCases} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

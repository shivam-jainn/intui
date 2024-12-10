"use client";

import React, { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import QuestionPanel from "@/components/Playground/QuestionPanel";
import { getDesc } from "@/lib/common/playground/desc_and_driver";
import CodeEditor from "@/components/Playground/CodeEditor";
import RunAndSubmissionBar from "@/components/Playground/TestCard";

interface QuestionData {
  name: string;
  difficulty: string;
  description: string;
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
      const [apiResponse, questionDescription] = await Promise.all([
        fetch(`/api/question/${questionId}`).then((res) => res.json()),
        getDesc(questionId),
      ]);

      setQuestionData({
        ...apiResponse,
        description: questionDescription.question_description,
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!questionData) {
    return <div>No question data found</div>;
  }

  return (
    <PanelGroup direction="horizontal">
      <Panel>
        <QuestionPanel
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
          <CodeEditor questionName={params.questionid} />
        </Panel>
        <PanelResizeHandle style={{ height: "0.5rem" }} />
        <Panel defaultSize={30} minSize={20} maxSize={40}>
          <RunAndSubmissionBar />
        </Panel>
      </PanelGroup>
     </Panel>
    </PanelGroup>
  );
}

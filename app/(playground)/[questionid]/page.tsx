"use client";

import React, { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import QuestionPanel from "@/components/Playground/QuestionPanel";
import { getDesc, getTestCases } from "@/lib/common/playground/desc_and_driver";
import CodeEditor from "@/components/Playground/CodeEditor";
import RunAndSubmissionBar from "@/components/Playground/TestCard";
import PlaygroundSkeleton from "@/components/Playground/PlaygroundSkeleton";

interface Submission {
  id: number;
  code: string;
  language: string;
  status: string;
  timeTaken: number | null;
  spaceTaken: number | null;
  createdAt: string;
}

interface QuestionData {
  name: string;
  difficulty: string;
  description: string;
  testCases: string[];
  companies?: string[];
  topics?: string[];
  submissions?: Submission[];
}

function enrichSubmissions(submissions: Submission[]): Submission[] {
  return submissions.map((s) => ({
    ...s,
    timeTaken: s.timeTaken ?? Math.round(Math.random() * 200 + 20),
    spaceTaken: s.spaceTaken ?? Math.round(Math.random() * 15 + 5),
  }));
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
        submissions: enrichSubmissions(apiResponse.Submission ?? []),
      });
    } catch (err: any) {
      console.error("Error fetching question data:", err);
      if (err.message?.includes("Failed to retrieve question description")) {
        setError("Could not load the question description. The question may not exist or is temporarily unavailable.");
      } else if (err.message?.includes("Failed to retrieve driver code")) {
        setError("Could not load the starter code. Please try refreshing the page.");
      } else if (err.message?.includes("storage") || err.message?.includes("download")) {
        setError("Unable to connect to storage service. Please check your internet connection and try again.");
      } else {
        setError("Something went wrong while loading the question. Please try again or refresh the page.");
      }
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
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 80px)',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '400px',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e03131',
          backgroundColor: 'rgba(224, 49, 49, 0.1)',
        }}>
          <h3 style={{ color: '#e03131', margin: '0 0 8px 0', fontSize: '16px' }}>Error Loading Question</h3>
          <p style={{ color: '#868e96', margin: '0 0 16px 0', fontSize: '14px' }}>{error}</p>
          <button
            onClick={() => fetchQuestion()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 80px)',
        color: '#868e96',
      }}>
        <p>No question data found. Please check the URL and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      <PanelGroup direction="horizontal">
        <Panel>
          <QuestionPanel
            questionTitle={questionData.name}
            difficulty={questionData.difficulty}
            description={questionData.description}
            companies={questionData.companies || []}
            topics={questionData.topics || []}
            submissions={questionData.submissions || []}
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

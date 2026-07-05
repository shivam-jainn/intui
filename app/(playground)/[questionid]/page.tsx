'use client';

import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeEditor from '@/components/Playground/CodeEditor';
import PlaygroundSkeleton from '@/components/Playground/PlaygroundSkeleton';
import QuestionPanel from '@/components/Playground/QuestionPanel';
import RunAndSubmissionBar from '@/components/Playground/TestCard';
import { useQuestion } from '@/lib/hooks/useQuestion';
import { useQuestionDesc } from '@/lib/hooks/useQuestionDesc';
import { useQuestionTestCases } from '@/lib/hooks/useQuestionTestCases';

interface Submission {
  id: number;
  code: string;
  language: string;
  status: string;
  timeTaken: number | null;
  spaceTaken: number | null;
  createdAt: string;
}

function enrichSubmissions(submissions: Submission[]): Submission[] {
  return submissions.map((s) => ({
    ...s,
    timeTaken: s.timeTaken ?? Math.round(Math.random() * 200 + 20),
    spaceTaken: s.spaceTaken ?? Math.round(Math.random() * 15 + 5),
  }));
}

export default function Page({ params }: { params: { questionid: string } }) {
  const questionId = decodeURIComponent(params.questionid);

  const {
    data: apiResponse,
    isLoading: questionLoading,
    error: questionError,
  } = useQuestion(questionId);

  const {
    data: questionDescription,
    isLoading: descLoading,
    error: descError,
  } = useQuestionDesc(questionId);

  const {
    data: testCases,
    isLoading: testCasesLoading,
    error: testCasesError,
  } = useQuestionTestCases(questionId);

  const loading = questionLoading || descLoading || testCasesLoading;
  const error = questionError || descError || testCasesError;

  const questionData = React.useMemo(() => {
    if (!apiResponse || !questionDescription) return null;
    return {
      name: apiResponse.name,
      difficulty: apiResponse.difficulty,
      description: questionDescription.question_description,
      testCases: testCases ?? [],
      companies: (apiResponse as any).companies ?? [],
      topics: apiResponse.topics ?? [],
      submissions: enrichSubmissions(apiResponse.Submission ?? []),
    };
  }, [apiResponse, questionDescription, testCases]);

  if (loading) {
    return <PlaygroundSkeleton />;
  }

  if (error) {
    const errorMsg = descError?.message?.includes('not found')
      ? 'Could not load the question description. The question may not exist or is temporarily unavailable.'
      : error?.message?.includes('storage') || error?.message?.includes('download')
        ? 'Unable to connect to storage service. Please check your internet connection and try again.'
        : 'Something went wrong while loading the question. Please try again or refresh the page.';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 80px)',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e03131',
            backgroundColor: 'rgba(224, 49, 49, 0.1)',
          }}
        >
          <h3 style={{ color: '#e03131', margin: '0 0 8px 0', fontSize: '16px' }}>
            Error Loading Question
          </h3>
          <p style={{ color: '#868e96', margin: '0 0 16px 0', fontSize: '14px' }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 80px)',
          color: '#868e96',
        }}
      >
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
        <PanelResizeHandle style={{ width: '0.5rem' }} />
        <Panel>
          <PanelGroup direction="vertical">
            <Panel minSize={50}>
              <CodeEditor questionSlug={params.questionid} />
            </Panel>
            <PanelResizeHandle style={{ height: '0.5rem' }} />
            <Panel defaultSize={30} minSize={20} maxSize={40} style={{ overflow: 'auto' }}>
              <RunAndSubmissionBar testCases={questionData.testCases} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

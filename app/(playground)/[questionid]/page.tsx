"use client";
import React, { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import QuestionPanel from "@/components/Playground/QuestionPanel";
import { getDescAndDriver } from "@/lib/common/playground/desc_and_driver";
import CodeEditor from "@/components/Playground/CodeEditor";

export default function Page({ params }: { params: { questionid: string } }) {
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("Question Name : ",params.questionid);

  const handleCodeChange = (code: string) => {
    console.log('Code changed:', code);
    // Handle code changes, save to state/database
  };

  useEffect(() => {
    async function fetchQuestion() {
      try {
        setLoading(true);

        const response = await fetch(`/api/question/${params.questionid}`);
        const data = await response.json();


        const {question_description,driver_code} = await getDescAndDriver(params.questionid)
        data['description'] = question_description.data; 
        data['driver_code'] = driver_code.data;
        setQuestionData(data);
      } catch (error) {
        console.error("Error fetching question data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.questionid) {
      fetchQuestion();
    }
  }, [params.questionid]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={40} minSize={20}>
        {questionData ? (
          <QuestionPanel
            questionTitle={questionData.name}
            difficulty={questionData.difficulty}
            description={questionData.description}
            companies={questionData.companies || []}
            topics={questionData.topics || []}
          />
        ) : (
          <div>No question data found</div>
        )}
      </Panel>
      <PanelResizeHandle style={{ width: "0.5rem", backgroundColor: "blue" }} />
      <Panel defaultSize={60} minSize={20} style={{height:'100vh'}}>
        <CodeEditor
          initialCode={questionData.driver_code}
          onChange={handleCodeChange}
        />
      </Panel>
    </PanelGroup>
  );
}

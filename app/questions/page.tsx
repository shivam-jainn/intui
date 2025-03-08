"use client";
import React, { useEffect, useState } from "react";
import { Table, Badge } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function Page() {
  const [data, setData] = useState([]);
  const router = useRouter();

  async function fetchAllQuestions(page = 1) {
    try {
      const response = await fetch(`/api/questions?page=${page}`);
      if (!response.ok) throw new Error("Failed to fetch questions");

      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  }

  useEffect(() => {
    fetchAllQuestions();
  }, []);

  const tableRows = data.map((q:any) => (
    <tr
      key={q.id}
      onClick={() => router.push(`/${q.name}`)}
      style={{
        cursor: "pointer",
        transition: "background 0.2s ease-in-out",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <td style={{ textAlign: "center", padding: "12px" }}>{q.id}</td>
      <td style={{ textAlign: "center", padding: "12px", fontWeight: "bold" }}>{q.name}</td>
      <td style={{ textAlign: "center", padding: "12px"}}>
        {q.difficulty}
      </td>
      <td style={{ textAlign: "center", padding: "12px" }}>
        {q.topics.map((topic: any) => (
          <Badge key={topic.topic.name} color="blue" variant="light" mx={4} radius="sm">
            {topic.topic.name}
          </Badge>
        ))}
      </td>
    </tr>
  ));

  return (
      <Table
        withColumnBorders
        highlightOnHover
        verticalSpacing="md"
        horizontalSpacing="lg"
        style={{
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <thead style={{ backgroundColor: "#f0f0f0" }}>
          <tr>
            <th style={{ textAlign: "center", padding: "12px" }}>ID</th>
            <th style={{ textAlign: "center", padding: "12px" }}>Name</th>
            <th style={{ textAlign: "center", padding: "12px" }}>Difficulty</th>
            <th style={{ textAlign: "center", padding: "12px" }}>Topics</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </Table>
  );
}

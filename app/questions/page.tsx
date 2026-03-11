"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Table, Badge, TextInput, SegmentedControl, Text, MultiSelect } from "@mantine/core";
import { useRouter } from "next/navigation";

const difficultyColor: Record<string, string> = {
  Easy: "blue",
  Medium: "yellow",
  Hard: "red",
};

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [topics, setTopics] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    data.forEach((q) => q.topics.forEach((t: any) => set.add(t.topic.name)));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((q) => {
      const matchesSearch = q.name.toLowerCase().includes(search.toLowerCase());
      const matchesDiff = difficulty === "All" || q.difficulty === difficulty;
      const matchesTopics =
        topics.length === 0 ||
        topics.some((topic) => q.topics.some((t: any) => t.topic.name === topic));
      return matchesSearch && matchesDiff && matchesTopics;
    });
  }, [data, search, difficulty, topics]);

  return (
    <div style={{ padding: "2rem" }}>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <TextInput
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <SegmentedControl
          value={difficulty}
          onChange={setDifficulty}
          data={["All", "Easy", "Medium", "Hard"]}
        />
        <MultiSelect
          placeholder="Filter by topic"
          data={allTopics}
          value={topics}
          onChange={setTopics}
          clearable
          searchable
          style={{ minWidth: 220 }}
        />
      </div>

      {/* Table */}
      <div style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
        <Table withColumnBorders verticalSpacing="md" horizontalSpacing="lg">
          <thead style={{ backgroundColor: "#1a1a1a" }}>
            <tr>
              <th style={{ textAlign: "center", padding: "12px", color: "#aaa" }}>#</th>
              <th style={{ textAlign: "center", padding: "12px", color: "#aaa" }}>Name</th>
              <th style={{ textAlign: "center", padding: "12px", color: "#aaa" }}>Difficulty</th>
              <th style={{ textAlign: "center", padding: "12px", color: "#aaa" }}>Topics</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                  No questions match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/${q.slug}`)}
                  style={{ cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ textAlign: "center", padding: "12px", color: "#888" }}>{q.id}</td>
                  <td style={{ textAlign: "center", padding: "12px", fontWeight: 600 }}>{q.name}</td>
                  <td style={{ textAlign: "center", padding: "12px" }}>
                    <Badge color={difficultyColor[q.difficulty] ?? "gray"} variant="light">
                      {q.difficulty}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "12px" }}>
                    {q.topics.map((t: any) => (
                      <Badge key={t.topic.name} color="blue" variant="light" mx={4} radius="sm">
                        {t.topic.name}
                      </Badge>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Text size="sm" c="dimmed" mt="sm">
        {filtered.length} / {data.length} questions
      </Text>
    </div>
  );
}

"use client";

import { Box, Text, Group, Stack, ThemeIcon, UnstyledButton } from "@mantine/core";
import { useAtom } from "jotai";
import { activeFilePathAtom, incidentFilesAtom } from "@/contexts/IncidentContext";
import { IconFile, IconFolder, IconLock } from "@tabler/icons-react";
import React, { useMemo } from "react";

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  readonly: boolean;
  children?: TreeNode[];
}

function buildTree(files: { path: string; readonly: boolean }[]): TreeNode[] {
  const root: TreeNode[] = [];
  const dirMap: Record<string, TreeNode> = {};

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join("/");
      if (!dirMap[dirPath]) {
        const node: TreeNode = {
          name: parts[i],
          path: dirPath,
          isDir: true,
          readonly: false,
          children: [],
        };
        dirMap[dirPath] = node;
        current.push(node);
      }
      current = dirMap[dirPath].children!;
    }

    current.push({
      name: parts[parts.length - 1],
      path: file.path,
      isDir: false,
      readonly: file.readonly,
      children: undefined,
    });
  }

  return root;
}

function TreeNodeItem({
  node,
  depth = 0,
  activeFile,
  onSelect,
}: {
  node: TreeNode;
  depth?: number;
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  if (node.isDir) {
    return (
      <Box>
        <Group gap={4} py={2} pl={depth * 16}>
          <ThemeIcon size="xs" variant="transparent" color="blue">
            <IconFolder size={14} />
          </ThemeIcon>
          <Text size="xs" c="dimmed" fw={600}>
            {node.name}
          </Text>
        </Group>
        {node.children?.map((child) => (
          <TreeNodeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            onSelect={onSelect}
          />
        ))}
      </Box>
    );
  }

  const isActive = node.path === activeFile;

  return (
    <UnstyledButton
      onClick={() => onSelect(node.path)}
      w="100%"
      py={3}
      px={4}
      pl={depth * 16 + 4}
      style={{
        borderRadius: "var(--mantine-radius-sm)",
        backgroundColor: isActive ? "var(--mantine-color-blue-9)" : "transparent",
        cursor: "pointer",
      }}
    >
      <Group gap={4}>
        <ThemeIcon size="xs" variant="transparent" color={node.readonly ? "gray" : "green"}>
          <IconFile size={13} />
        </ThemeIcon>
        <Text size="xs" c={isActive ? "white" : "gray.3"} style={{ fontFamily: "monospace" }}>
          {node.name}
        </Text>
        {node.readonly && (
          <ThemeIcon size="xs" variant="transparent" color="gray">
            <IconLock size={10} />
          </ThemeIcon>
        )}
      </Group>
    </UnstyledButton>
  );
}

export default function FileTree() {
  const [files] = useAtom(incidentFilesAtom);
  const [activeFile, setActiveFile] = useAtom(activeFilePathAtom);

  const tree = useMemo(
    () => buildTree(files.map((f) => ({ path: f.path, readonly: f.readonly }))),
    [files]
  );

  return (
    <Stack gap={2} p="xs" style={{ overflowY: "auto", height: "100%" }}>
      <Text size="xs" fw={700} c="dimmed" mb={4} px={4}>
        FILES
      </Text>
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          activeFile={activeFile}
          onSelect={setActiveFile}
        />
      ))}
    </Stack>
  );
}

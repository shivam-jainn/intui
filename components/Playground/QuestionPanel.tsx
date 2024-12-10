"use client";
import { Stack, Title, Group, Badge, Container, SegmentedControl, Accordion, Text } from '@mantine/core';
import React, { useState } from 'react';
import Markdown from 'react-markdown';

export default function QuestionPanel({
    questionTitle,
    difficulty,
    companies,
    description,
    topics
}: {
    questionTitle: string;
    difficulty: string;
    companies: string[];
    description: string;
    topics: any[];
}) {
    const [tab, setTab] = useState<string>('description');

    return (
        <Stack h='100%'>
            <Container bg="gray" w="100%" p="sm">
                <SegmentedControl
                    value={tab}
                    onChange={setTab}
                    data={[
                        { label: 'Description', value: 'description' },
                        { label: 'Submission', value: 'submission' },
                    ]}
                />
            </Container>
            
            {
                tab === 'description' ?

            <div style={{
                overflowY : "auto"
            }}>
            <Stack style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} w="100%">
                <Title order={1}>{questionTitle}</Title>

                <Group style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Badge>{difficulty}</Badge>

                    {companies.map((company, index) => (
                        <Badge key={index} color="orange">
                            {company}
                        </Badge>
                    ))}
                </Group>
                     
        <Markdown>{description}</Markdown>
            </Stack>

            <Stack>
                <Accordion defaultValue="topics" chevronPosition="right">
                    <Accordion.Item key="topics" value="topics">
                        <Accordion.Control>Topics</Accordion.Control>
                        <Accordion.Panel>
                            {topics.map((element, index) => (
                                <Badge key={index}>{element.topic.name}</Badge>
                            ))}
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Stack>
            </div>

            :

             <Stack>
                TODO : Submission 
            </Stack>
            }
        </Stack>
    );
}

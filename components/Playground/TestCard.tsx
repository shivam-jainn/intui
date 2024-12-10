"use client";

import { Card, SegmentedControl } from '@mantine/core'
import React, { useState } from 'react'

export default function TestCard() {
    const [tab, setTab] = useState<string>('testcases');
    const [testcase, setTestCase] = useState<string>('0');
    const testcases = [
        {
            "output": "1",
            "value": "[1,2,3]",
        },
        {
            "output": "4",
            "value": "[5,2,3]",
        }
    ];

    return (
        <Card display="flex" style={{
            gap:'1rem',
        }} >
            <SegmentedControl
                value={tab}
                onChange={setTab}
                data={[
                    { label: 'Test Cases', value: 'testcases' },
                    { label: 'Results', value: 'results' },
                ]}
                
            />

            <div style={{
                display:'flex',
                flexDirection:'column',
            }}>
                <SegmentedControl
                    value={testcase}
                    onChange={setTestCase}
                    data={testcases.map((_, index) => ({ label: `Case ${index}`, value: `${index}` }))}
                    key={testcase}
                    size='xs'
                    fullWidth={false}
                />

                <div style={{
                    backgroundColor: '#242424',
                    color : 'white',
                    fontWeight : 'bold',
                    padding: '1rem'
                }}>
                    {testcases[Number(testcase)].value}
                </div>
            </div>

        </Card>
    )
}

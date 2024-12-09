"use client";

import { Card, SegmentedControl } from '@mantine/core'
import React,{useState} from 'react'

export default function TestCard() {
    const [tab, setTab] = useState<string>('testcases');
    const testcases = [
            {
                "output" : "1",
                "value" : "[1,2,3]",
            }        
    ];

  return (
    <Card>
        <SegmentedControl
                    value={tab}
                    onChange={setTab}
                    data={[
                        { label: 'Test Cases', value: 'testcases' },
                        { label: 'Results', value: 'results' },
                    ]}
        />

        {
            testcases.map((testcase)=>(
                <Card>
                    {testcase.case}
                </Card>
            ))
        }

    </Card>
  )
}

import { keyGenerator } from "@/lib/storage/keygen";
import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/storage/Upload";

export async function POST(req:NextRequest) {
    
    console.log(req);
    const data = await req.json();

    if(data.description.length < 150){
        return NextResponse.json({
            message : "Your description is less than 150 characters . Please provide a more detailed description"
        },{
            status:400
        });
    }

    const keyName = await keyGenerator(data.name);

    const {response,url} = await uploadToStorage(keyName,data.description);

    const newQuestion = await prisma.question.create({
        data:{
            name: data.name,
            difficulty: data.difficulty,
            description: url as string,
            topics: data.topics,
        }
    });


    return NextResponse.json({
        message : "Question created successfully",
    },{
        status: 200
    });

}
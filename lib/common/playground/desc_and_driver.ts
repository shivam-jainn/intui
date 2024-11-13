import { getFileFromStorage } from "@/lib/storage/Upload";

export async function getDescAndDriver(question_name : string){

    const bucketName = 'intui-bucket';

    const desc_key = bucketName + "-" + question_name;
    const driver_key = bucketName + "-" + question_name;

    const question_description = await getFileFromStorage(desc_key);
    const driver_code = await getFileFromStorage(driver_key);
    
    return {question_description,driver_code}
} 
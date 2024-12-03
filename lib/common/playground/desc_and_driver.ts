import { storage } from "../clients";

export async function getDescAndDriver(question_name : string){

    const desc_key =  "description-"+question_name;
    const driver_key =  "driver-"+question_name;

    const question_description = await storage.download(desc_key);
    const driver_code = await storage.download(driver_key);

    return {question_description,driver_code}
} 
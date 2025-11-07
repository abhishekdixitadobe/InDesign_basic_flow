import axios from "axios";
import { getPresignedURL } from "./presignURL";


export const dataMergeOutputOptions = [
    {
        label: 'JPEG',
        value: 'image/jpeg'
    },
    {
        label: 'PNG',
        value: 'image/png'
    },
    {
        label: 'Indesign file',
        value: 'application/x-indesign'
    },
    {
        label: 'PDF',
        value: 'application/pdf'
    }
]
export const renditionOutputOptions = [
    {
        label: 'JPEG',
        value: 'image/jpeg'
    },
    {
        label: 'PNG',
        value: 'image/png'
    },
    {
        label: 'PDF',
        value: 'application/pdf'
    }
]


export const dataMerge = async (uploadedFiles, action, operation) => {
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));
    formData.append("action", action);
    formData.append("operation", operation);
    const res = await fetch("/middleware/upload-and-process", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();
    return data.resultURLs; // array of final URLs

} 
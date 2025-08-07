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

const buildPayload = (preSignedUrlsArr, action) => {

    const indesignFile = preSignedUrlsArr.filter((obj) => obj.name.endsWith('.indd'))
    const csvFile = preSignedUrlsArr.filter((obj) => obj.name.endsWith('.csv'))
    const assets = preSignedUrlsArr.map((signedUrl) => {
        return {
            "source": {
                "url": signedUrl.url
            },
            "destination": signedUrl.name
        }
    })
    return {
        "assets": assets,
        "params": {
            "dataSource": csvFile[0].name,
            "targetDocument": indesignFile[0].name,
            "outputMediaType": action
        }
    }
}

const buildRenditionPayload = (preSignedUrlsArr, action) => {
    const indesignFile = preSignedUrlsArr.filter((obj) => obj.name.endsWith('.indd'))
    return {
        "assets": [
            {
                "source": {
                    "url": indesignFile[0].url
                },
                "destination": indesignFile[0].name
            }
        ],
        "params": {
            "targetDocuments": [
                indesignFile[0].name
            ],
            "outputMediaType": action
        }
    }
}
const makeCalltoWebHook = async (presignedUrls, action, operation) => {
    const endpoint = operation === 'data-merge' ? 'merge-data' : 'create-rendition'
    const payload = operation === 'data-merge' ? buildPayload(presignedUrls, action) : buildRenditionPayload(presignedUrls, action)
    const result = await axios.post("https://hook.fusion.adobe.com/enxjyg96ti56d8piy1ztn4as4kwcd5jr", {
        endpoint,
        payload
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    })
    return result.data
}

export const dataMerge = async (updloadedFiles, action, operation) => {
    const results = await Promise.all(updloadedFiles.map((file) => getPresignedURL(file, file.name)))
    const downloadUrls = await makeCalltoWebHook(results, action, operation)
    const result = downloadUrls.outputs.map((elm) => elm.destination.url)
    return result

} 
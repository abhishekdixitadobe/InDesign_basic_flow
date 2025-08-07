/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2024 Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
**************************************************************************/

import { getSignedURL, putObject } from '../utils/aws-client';
import { getUUID } from "../utils/fileUtils";
import { handleError } from '../utils/logging';
import {
    setCurrentCall,
    setCurrentCallResponse,
    updateCurrentCallStatus,
    addCurrentCallToLog
} from '../redux/apis';
import { API_EVENT } from '../utils/data';

const AWS_WORKING_FOLDER = process.env.REACT_APP_AWS_WORKING_FOLDER;

export class CCAPIActions {
    dispatch = null;
    sdk = null;


    constructor(dispatch) {
        this.dispatch = dispatch;
    }

    async init() {
        //this.sdk = await initSDK();
    }

    recordAPICallData(type, name, status, request = '') {
        const call = {
            type: type,
            name: name,
            status: status,
            properties: {
                request: request
            }
        }

        this.dispatch(setCurrentCall(call));
    }

    setAPICallStatus(status) {
        this.dispatch(updateCurrentCallStatus(status));
    }

    setAPICallResponse(response) {
        this.dispatch(setCurrentCallResponse(response))
    }

    commitAPICall() {
        this.dispatch(addCurrentCallToLog());
    }

    async uploadFileToS3(fileToUpload) {
        try {
            //const awsResource = `${AWS_WORKING_FOLDER}/${fileToUpload.name}`;

            // Upload a file to AWS S3 and record.

            this.recordAPICallData(API_EVENT.aws.upload, API_EVENT.aws.actions.upload, API_EVENT.status.start, `File: ${fileToUpload.name}`);
            //console.log('putting file in ' + AWS_WORKING_FOLDER);
            await putObject(fileToUpload);
            this.setAPICallStatus(API_EVENT.status.done);
            this.setAPICallResponse('200 OK');
            this.commitAPICall();
            // Generate signedURL to AWS s3 resource and record.
            this.recordAPICallData(API_EVENT.aws.upload, API_EVENT.aws.actions.signedURL, API_EVENT.status.start, awsResource);
            const signedURL = await getSignedURL('getObject', '${fileToUpload.name}');
            console.log(signedURL)
            this.setAPICallStatus(API_EVENT.status.done);
            this.setAPICallResponse(signedURL);
            this.commitAPICall();

            return signedURL;
        } catch (e) {
            handleError(`AWS: File Upload Error: ${e}`);
        }
    }

    async generateS3OutputUrl(outputFileName) {
        try {
            const awsResource = `${AWS_WORKING_FOLDER}/${outputFileName}`
            this.recordAPICallData(API_EVENT.aws.actions.signedURL, API_EVENT.aws.actions.signedURL, awsResource);
            const outputFileURL = await getSignedURL('putObject', awsResource);
            this.setAPICallStatus(API_EVENT.status.done);
            this.setAPICallResponse(outputFileURL);
            this.commitAPICall();

            return outputFileURL;
        } catch (e) {
            handleError(`AWS: Generate signedURL Error: ${e}`);
        }
    }

    async uploadFileToFirefly(file) {
        try {
            console.log(file)
            this.recordAPICallData(API_EVENT.firefly.upload, API_EVENT.firefly.actions.upload, API_EVENT.status.start, `File: ${file.name}`);
            const assetIds = await fileUpload(file);
            this.setAPICallStatus(API_EVENT.status.done);
            this.setAPICallResponse(assetIds);
            this.commitAPICall();

            console.log(assetIds)

            return assetIds.images[0].id;
        } catch (e) {
            handleError(`Firefly API: Error while uploading file to Firefly: ${e}`);
        }

    }
}

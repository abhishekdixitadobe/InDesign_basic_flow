import React, { useEffect, useState } from "react";
import DragAndDrop from "../drag-and-drop";
import { Heading, ComboBox, Item } from "@adobe/react-spectrum";
import { dataMergeOutputOptions, renditionOutputOptions } from "../../utils/indesignHelper";
const IndesignOpForm = ({ action, onChange, setUploadFiles }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedAction, setSelectedAction] = useState(null)
    const [operation, setSelectedOperation] = useState('data-merge')

    const onSelectBoxChange = (e) => {
        setSelectedAction(e);
        setSelectedFiles([])
    }
    const onOperationBoxChange = (e) => {
        setSelectedOperation(e)
        setSelectedFiles([])
    }

    const getOutputOptions = () => {
        const dataSource = operation === 'data-merge' ? dataMergeOutputOptions : renditionOutputOptions
        return dataSource.map((item) => <Item key={item.value}>{item.label}</Item>)
    }

    useEffect(() => {
        if (onChange) {
            const filesBlob = selectedFiles.map((file) => {
                return URL.createObjectURL(file);
            });
            onChange({ operation: operation, files: selectedFiles, action: selectedAction });
        }
    }, [selectedFiles, selectedAction, operation]);

    return (
        <>
            <ComboBox label="Select operation" onSelectionChange={onOperationBoxChange} isRequired width={'200px'} selectedKey={operation}>
                <Item key="data-merge">Data Merge</Item>
                <Item key="rendition">Rendition</Item>
            </ComboBox>
            <ComboBox label="Select output type" onSelectionChange={onSelectBoxChange} isRequired width={'200px'}>
                {getOutputOptions()}
            </ComboBox>

            <Heading level={4} UNSAFE_style={{ marginBottom: "0px" }}>
                Upload Indesign File / Images / Fonts
            </Heading>
            <DragAndDrop
                heading="Drag and drop (indesign file or images or fonts)"
                description="Or, select file from your computer"
                acceptedFileTypes={[
                    "image/jpeg",
                    "image/png",
                    "image/vnd.adobe.photoshop",
                    "image/x-photoshop",
                    "image/psd",
                    "application/photoshop",
                    "application/psd",
                    "zz-application/zz-winassoc-psd",
                    "application/octet-stream",
                ]}
                allowsMultiple={true}
                onImageDrop={(file) => {
                    setSelectedFiles(file);
                }}
                setUploadFiles={setUploadFiles}
            />
            {operation === 'data-merge' && <>
                <Heading level={4} UNSAFE_style={{ marginBottom: "0px" }}>
                    Upload CSV
                </Heading>
                <DragAndDrop
                    heading="Drag and drop CSV"
                    description="Or, select single CSV file from your computer"
                    acceptedFileTypes={["text/csv"]}
                    onImageDrop={(files) => {
                        setSelectedFiles(files);
                    }}
                />
            </>}
        </>
    );
};

export default IndesignOpForm;

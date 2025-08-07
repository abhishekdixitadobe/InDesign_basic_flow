import { ActionButton, Grid, Image, Text, View } from "@adobe/react-spectrum";
import Download from "@spectrum-icons/workflow/Download";
import React, { useEffect, useState } from "react";
import Footer from "../../components/footer";
import InddIcon from '../../components/drag-and-drop/images/indesign.png'
import PdfIcon from '../../components/drag-and-drop/images/pdf.png'
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";

const Result = () => {
  const resultImages = useSelector((state) => state.downloadURLs.downloadURLs) || [];
  // ['https://assets-at-scale.s3.us-west-1.amazonaws.com/sample.indd?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA53OJKPNG2IZHLYXP%2F20250508%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20250508T055058Z&X-Amz-Expires=86400&X-Amz-Signature=b9688c1aa0d883c62c3effa34ba63a20f48bd0a72f47f8fc25c399cf3729335e&X-Amz-SignedHeaders=host']
  // useSelector((state) => state.downloadURLs.downloadURLs) || [];
  console.log(resultImages);
  const downloadImage = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const filename = url.split("/").pop();
    saveAs(blob, filename);
  };

  const getImageNameFromUrl = (url) => {
    if (url) {
      const urlWithoutQueryString = url.split('?')[0]
      const fileName = urlWithoutQueryString.split('/').pop()
      return fileName
    }
    return ""
  }

  const downloadAllasZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("images");
    for (let i = 0; i < resultImages.length; i++) {
      const imgData = await fetch(resultImages[i]).then((r) => r.blob());
      const fileName = getImageNameFromUrl(resultImages[i]);
      if (fileName && fileName.endsWith('.indd')) {
        folder.file(
          `${fileName}.indd`,
          imgData,
          { binary: true }
        );
      } else if (fileName && fileName.endsWith('.pdf')) {
        folder.file(
          `${fileName}.pdf`,
          imgData,
          { binary: true }
        );
      } else {
        folder.file(`image${i + 1}.jpg`, imgData, { binary: true });
      }
    }
    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, "result.zip");
    });
  };

  return (
    <Grid
      areas={["content", "footer"]}
      height="100%" // Subtract the height of the footer
      width="100%"
      columns={["1fr"]}
      rows={["1fr", "auto"]}
      marginTop={"size-200"}
    >
      <View gridArea="content" width="75%" marginX="auto" overflow="auto">
        <Grid columns={"1fr 1fr 1fr 1fr 1fr"} gap="size-400">
          {resultImages.map((src, index) => {
            const imageName = getImageNameFromUrl(src)
            return (
              <View
                position="relative"
                key={index}
                width="size-3600"
                height="size-3600"
              >
                {imageName.endsWith('.indd') &&
                  (<><a href={src} target="_blank" rel="noopener noreferrer">
                    <Image src={InddIcon} alt={`Image ${index + 1}`} objectFit="contain" width="100%"
                      height="100%" />
                  </a>
                    <Text>{imageName}</Text>
                  </>)}
                {imageName.endsWith('.pdf') &&
                  (<><a href={src} target="_blank" rel="noopener noreferrer">
                    <Image src={PdfIcon} alt={`Image ${index + 1}`} objectFit="contain" width="100%"
                      height="100%" />
                  </a>
                    <Text>{imageName}</Text>
                  </>)}
                {!imageName.endsWith('.indd') && !imageName.endsWith('.pdf') && (<><a href={src} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={src}
                    objectFit="contain"
                    width="100%"
                    height="100%"
                    alt=""
                  />
                </a>
                  <View position="absolute" top="size-50" end="size-50">
                    <ActionButton
                      onPress={() => downloadImage(resultImages[index])}
                      isQuiet
                    >
                      <Download />
                    </ActionButton>
                  </View></>)}

              </View>
            )
          })}
        </Grid>
      </View>
      <View gridArea="footer" width="100%" height={"size-1000"}>
        <Footer
          showDownload={true}
          downloadOnPress={async () => {
            // Download all the images in a zip
            downloadAllasZip();
          }}
        />
      </View>
    </Grid>
  );
};

export default Result;

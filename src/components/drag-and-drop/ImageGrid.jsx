import { ActionButton, Button, Flex, Image, View } from "@adobe/react-spectrum";
import Close from "@spectrum-icons/workflow/Close";
import React from "react";
import PhotoshopIcon from "./images/photoshop.png";
import IndesignIcon from './images/indesign.png';
const ImageGrid = ({
  filledSrc,
  handleRemoveIndividualClick,
  handleRemoveClick,
}) => {
  const checkFileType = (src) => {
    if (src) {
      const ext = src.name.split(".").pop()
      if (ext === "psd")
        return PhotoshopIcon
      else if (ext === "indd")
        return IndesignIcon
      else
        return src.url
    }
    return ""
  }
  return (
    <Flex direction="column" gap={30} alignItems="center">
      <Flex wrap="wrap" justifyContent="center" gap="size-100">
        {filledSrc.map((src, index) => (
          <View
            position="relative"
            key={index}
            width="size-2000"
            height="size-2000"
          >
            <Image
              src={checkFileType(src)}
              objectFit="contain"
              width="100%"
              height="100%"
              alt=""
            />
            <View position="absolute" top="size-50" end="size-50">
              <ActionButton
                onPress={() => handleRemoveIndividualClick(index)}
                isQuiet
              >
                <Close />
              </ActionButton>
            </View>
          </View>
        ))}
      </Flex>
      <Button variant="negative" onClick={handleRemoveClick}>
        Remove all images
      </Button>
    </Flex>
  )
};

export default ImageGrid;

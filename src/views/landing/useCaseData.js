import SocialMediaImage from "./images/PD-DSUC1-CardImage.png";

const useCaseData = [
  {
    id: 5,
    name: "Data merge using indesign apis",
    description:
      "Merge Data using indesign apis",
    cardImageUrl: SocialMediaImage,
    configs: {
      page: "/upload",
      formComponentId: "IndesignDocs",
      api: "/api/indesignDataMerge",
    },
    isDisabled: false,
  }
];

export default useCaseData;

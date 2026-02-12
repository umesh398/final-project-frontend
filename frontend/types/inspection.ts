export type InspectionImage = {
  uri: string;
  description: string;
  base64?: string;
};

export type InspectionForm = {
  date: string;
  shipName: string;
  shipType: string;
  port: string;
  inspector: string;
  clientLogo: string | null;
};

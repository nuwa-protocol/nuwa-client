type NuwaCapUIType = 'embed-NuwaCapUI' | 'artifact-ui';
export type NuwaCapUIURI = `capui://${NuwaCapUIType}/${string}`;

export type NuwaCapUIResource = {
  uri: NuwaCapUIURI;
  name: string;
  text: string;
  annotations: {
    height?: number;
  };
};

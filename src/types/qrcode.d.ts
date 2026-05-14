declare module "qrcode" {
  export interface QRCodeToStringOptions {
    type?: "svg" | "utf8" | "terminal";
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  const QRCode: {
    toString(text: string, options?: QRCodeToStringOptions): Promise<string>;
  };

  export default QRCode;
}

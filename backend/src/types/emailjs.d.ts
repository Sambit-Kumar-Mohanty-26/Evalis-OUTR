declare module '@emailjs/nodejs' {
  interface EmailJSOptions {
    publicKey?: string;
    privateKey?: string;
  }

  function send(
    serviceId: string,
    templateId: string,
    templateParams?: Record<string, unknown>,
    options?: EmailJSOptions
  ): Promise<{ status: number; text: string }>;
}

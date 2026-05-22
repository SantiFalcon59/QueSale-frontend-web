import QRCode from 'qrcode';

export async function generateQrCode(data: string): Promise<string> {
  try {
    const url = await QRCode.toDataURL(data, {
      margin: 1,
      scale: 10,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return url;
  } catch (err) {
    console.error('QR Generation Error:', err);
    throw err;
  }
}

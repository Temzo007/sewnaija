// client/src/utils/sendPinRequest.ts

export async function sendPinRequest(whatsappNumber: string): Promise<boolean> {
  try {
    const response = await fetch('https://formspree.io/f/{your-form-id}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsapp: whatsappNumber,
        timestamp: new Date().toLocaleString(),
        userAgent: navigator.userAgent,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send PIN request:', error);
    return false;
  }
}

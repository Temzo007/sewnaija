// client/src/utils/sendPinRequest.ts

const FORMSPREE_ID = https://formspree.io/f/xyklogwy; // ← replace with your real ID

export async function sendPinRequest(whatsappNumber: string): Promise<boolean> {
  try {
    const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

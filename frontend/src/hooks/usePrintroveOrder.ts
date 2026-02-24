import { useState, useCallback } from 'react';

// TODO: Replace console.log with a POST request to https://printrove.com/api/orders
// using fetch() and include VITE_PRINTROVE_API_KEY as Authorization header.
const PRINTROVE_API_KEY = import.meta.env.VITE_PRINTROVE_API_KEY as string | undefined;

export interface PrintOrderPayload {
  photo: Blob | string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  city: string;
  pinCode: string;
  printSize: '4x6' | '5x7' | '8x10';
}

export function usePrintroveOrder() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPrintOrder = useCallback(async (payload: PrintOrderPayload): Promise<{ success: boolean }> => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual Printrove API call:
      // const response = await fetch('https://printrove.com/api/orders', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${PRINTROVE_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ ...payload, photo: '<base64 or URL>' }),
      // });
      console.log('[Printrove] Print order payload:', {
        recipientName: payload.recipientName,
        phone: payload.phone,
        addressLine1: payload.addressLine1,
        city: payload.city,
        pinCode: payload.pinCode,
        printSize: payload.printSize,
        apiKey: PRINTROVE_API_KEY ? '(set)' : '(not set)',
        photoType: payload.photo instanceof Blob ? 'Blob' : 'string',
      });
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 800));
      return { success: true };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitPrintOrder, isSubmitting };
}

import { useState } from 'react';

const FIREFLY_CLIENT_ID = import.meta.env.VITE_ADOBE_FIREFLY_CLIENT_ID as string | undefined;
const FIREFLY_CLIENT_SECRET = import.meta.env.VITE_ADOBE_FIREFLY_CLIENT_SECRET as string | undefined;

export function usePhotoBlending() {
  const [isBlending, setIsBlending] = useState(false);

  const blendPhoto = async (compositeBlob: Blob): Promise<Blob> => {
    setIsBlending(true);
    try {
      if (!FIREFLY_CLIENT_ID || !FIREFLY_CLIENT_SECRET) {
        throw new Error('Adobe Firefly API credentials not configured');
      }

      // Get access token
      const tokenRes = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: FIREFLY_CLIENT_ID,
          client_secret: FIREFLY_CLIENT_SECRET,
          scope: 'openid,AdobeID,firefly_api',
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Adobe auth failed: ${tokenRes.statusText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken: string = tokenData.access_token;

      // Upload image to Firefly
      const uploadRes = await fetch('https://firefly-api.adobe.io/v2/storage/image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Api-Key': FIREFLY_CLIENT_ID,
          'Content-Type': compositeBlob.type || 'image/jpeg',
        },
        body: compositeBlob,
      });

      if (!uploadRes.ok) {
        throw new Error(`Firefly upload failed: ${uploadRes.statusText}`);
      }

      const uploadData = await uploadRes.json();
      const imageId: string = uploadData?.images?.[0]?.id;

      if (!imageId) {
        throw new Error('Firefly did not return an image ID');
      }

      // Apply generative fill / blending
      const blendRes = await fetch('https://firefly-api.adobe.io/v3/images/expand', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Api-Key': FIREFLY_CLIENT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: { id: imageId },
          prompt: 'Seamlessly blend shadows and colors for a natural composite photo',
          size: { width: 1920, height: 1080 },
        }),
      });

      if (!blendRes.ok) {
        throw new Error(`Firefly blending failed: ${blendRes.statusText}`);
      }

      const blendData = await blendRes.json();
      const outputUrl: string = blendData?.outputs?.[0]?.image?.url;

      if (!outputUrl) {
        throw new Error('Firefly did not return an output URL');
      }

      const imgRes = await fetch(outputUrl);
      if (!imgRes.ok) throw new Error('Failed to download blended image');
      return imgRes.blob();
    } catch (err) {
      console.warn('Adobe Firefly blending failed:', err);
      throw err;
    } finally {
      setIsBlending(false);
    }
  };

  return { blendPhoto, isBlending };
}

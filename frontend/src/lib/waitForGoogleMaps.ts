export async function waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (window.google?.maps?.DirectionsService) resolve();
        else setTimeout(check, 200);
      };
      check();
    });
  }
  
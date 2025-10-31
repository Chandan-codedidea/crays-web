import { onMount, createSignal } from 'solid-js';

const CryptoRedirect = () => {

  const [error, setError] = createSignal<string | null>(null);


  onMount(() => {
    try {
      // const profileUrl = import.meta.env.VITE_CRYPTO_PROFILE_URL;
      const profileUrl = 'https://crays.net/p/nprofile1qqsxzyttdge3z04sunl2984zhj230gahmqs37pcw5p8zxdwxdfs772cw3pjtq';

      if (!profileUrl) {
        throw new Error('Profile URL not configured');
      }

      console.log('Redirecting to Cryptonomicon Profile:', profileUrl);
      window.location.replace(profileUrl);
    } catch (err) {
      console.error('Redirect failed:', err);
      setError(err.message);
      // Optional: Redirect to fallback after delay

      setTimeout(() => {

        window.location.replace('/');

      }, 3000);

    }

  });



  return (

    <div>

      {error() ? (

        <div>

          <p>Error: {error()}</p>

          <p>Redirecting to home page...</p>

        </div>

      ) : (

        <div>Redirecting to Cryptonomicon Profile…</div>

      )}

    </div>

  );

};



export default CryptoRedirect;
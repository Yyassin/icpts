import 'css/global.css';
import 'css/index.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>icp-ts</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />;
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

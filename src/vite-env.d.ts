/// <reference types="vite/client" />

interface ImportMetaEnv {
 readonly VITE_RAZORPAY_KEY_ID?: string;
 readonly [key: string]: any;
}

interface ImportMeta {
 readonly env: ImportMetaEnv;
}
declare module '*firebase-applet-config.json' { const value: any; export default value; }

import { Client, Databases, ID, Query } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
  console.warn('Appwrite 服务器端配置不完整');
}

const serverClient = new Client();

serverClient
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

if (APPWRITE_API_KEY) {
  serverClient.setKey(APPWRITE_API_KEY);
}

const serverDatabases = new Databases(serverClient);

export { serverClient, serverDatabases, ID, Query };
export default serverClient;

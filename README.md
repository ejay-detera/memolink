# MemoLink

This is an [Expo](https://expo.dev) project created for **MemoLink**.

## 🚀 Setup & Run the Project

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npm run start
   ```

   In the output, you'll find options to open the app in a:
   - Development build
   - Android emulator
   - iOS simulator
   - Expo Go

## 🛠️ MCP Integrations

This project is supercharged with AI capabilities using the Model Context Protocol (MCP).

### Stitch MCP Setup
Stitch allows the AI assistant to design and generate screens directly into this project.
- **Enable the Stitch MCP server** in your IDE settings.
- You can now simply ask the AI to *"Create a design system"* or *"Generate a login screen"*.
- The AI will use Stitch to generate the React Native code and pull it straight into your project's components.

### Supabase MCP Setup
Supabase provides the backend infrastructure (Database, Auth, Storage, Edge Functions).
- **Enable the Supabase MCP server** in your IDE settings.
- Ensure your `mcp_config.json` is configured with your Supabase access token so the AI can communicate with your project.
- The AI can now perform database migrations, list tables, manage Edge Functions, and query data on your behalf.

## 🗄️ Adding Supabase to the Project Code

To integrate Supabase in the codebase so your app can communicate with the backend, follow these steps:

1. **Environment Variables**
   Create a `.env` file in the root directory and add your project URL and Anon Key. (These must be prefixed with `EXPO_PUBLIC_` to be accessible in the app):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. **Supabase Client Initialization**
   The client is initialized at `src/lib/supabase.ts`. It uses `AsyncStorage` to securely persist user sessions on the device:
   ```typescript
   import 'react-native-url-polyfill/auto';
   import { createClient } from '@supabase/supabase-js';
   import AsyncStorage from '@react-native-async-storage/async-storage';

   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
   const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       storage: AsyncStorage,
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: false,
     },
   });
   ```

3. **Using Supabase in Components**
   Simply import the initialized client anywhere in your app to interact with your backend:
   ```tsx
   import { supabase } from '../lib/supabase';

   // Example: Fetch data
   async function fetchData() {
     const { data, error } = await supabase.from('your_table').select('*');
     if (error) console.error(error);
     else console.log(data);
   }
   ```

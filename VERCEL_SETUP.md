# Setting Up Environment Variables in Vercel

This guide will help you set up your environment variables in Vercel to keep your API keys secure.

## Step 1: Create Your Vercel Project

If you haven't already, push your code to GitHub and create a new project in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Click "Import"

## Step 2: Add Environment Variables

1. In the Vercel dashboard, select your project
2. Go to the "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add your variables:
   - Name: `NEXT_PUBLIC_RAPIDAPI_KEY`
   - Value: (Your RapidAPI key)
5. Select which environments this applies to (Production, Preview, Development)
6. Click "Save"

![Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables/images/environment-variables-create.png)

## Step 3: Redeploy Your Project

After adding environment variables, you need to redeploy your project:

1. Go to the "Deployments" tab
2. Find your latest deployment
3. Click on the three dots (•••) menu
4. Select "Redeploy" 

## Accessing Variables in Your Code

Your API keys are now accessible in your code via `process.env.NEXT_PUBLIC_RAPIDAPI_KEY`.

## Security Notes

1. Never commit your `.env` file to Git (it should be in your `.gitignore`)
2. Only prefix variables with `NEXT_PUBLIC_` if they need to be accessible in the browser
3. For server-side only variables, omit the `NEXT_PUBLIC_` prefix

## Testing Locally

To test your application locally with environment variables:

1. Create a `.env.local` file in your project root
2. Add your variables in the format `NEXT_PUBLIC_RAPIDAPI_KEY=your_api_key`
3. Run your development server with `npm run dev` or `yarn dev` 
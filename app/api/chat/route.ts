import { Configuration, OpenAIApi } from 'openai';
import { NextResponse, type NextRequest } from 'next/server';

const configuration = new Configuration({
  organization: 'org-UTD5uFzQzn85yhW8Jn9YIpM0',
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });
    return NextResponse.json({
      message: response.data.choices[0].message,
    });
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ message: 'Error occurred', error: error.message }),
      { status: 500 },
    );
  }
}

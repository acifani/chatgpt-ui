import './globals.css';

export const metadata = {
  title: 'ChatGPT UI',
  description: 'UI to chat with OpenAI GPT models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

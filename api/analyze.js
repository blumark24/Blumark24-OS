import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return res.status(400).json({ error: "الرجاء رفع صورة للتحليل." });
    }

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "حلل محتوى هذه الصورة وصفاً ميدانياً تنفيذياً:" },
            { type: "image_url", image_url: image },
          ],
        },
      ],
    });

    res.status(200).json({ result: result.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ أثناء التحليل." });
  }
}

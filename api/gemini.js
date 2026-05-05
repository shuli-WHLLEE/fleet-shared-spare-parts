export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { prompt, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
  ];

  for (const model of models) {
    for (let i = 0; i < 3; i++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );

        const data = await response.json();

        if (response.ok) {
          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
          return res.status(200).json({ text });
        }

        if (response.status !== 503) {
          return res.status(response.status).json(data);
        }

        await new Promise(r => setTimeout(r, 1500 * (i + 1)));

      } catch (err) {
        if (i === 2) continue;
      }
    }
  }

  return res.status(503).json({
    error: "Gemini 目前繁忙，請稍後再試"
  });
}

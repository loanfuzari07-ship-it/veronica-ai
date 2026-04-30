exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { sentimento } = JSON.parse(event.body || "{}");

  if (!sentimento || sentimento.trim().length < 5) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Por favor, describe tu situación." }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Servidor no configurado." }),
    };
  }

  const prompt = `Eres Verónica, una asistente de oración cristiana especializada en restauración y fortalecimiento matrimonial.

La persona ha compartido lo siguiente sobre su matrimonio: "${sentimento}"

Escribe una oración en español, profunda y específica para ESTE momento matrimonial. Sigue estas pautas:
- Habla directamente a Dios en nombre de la persona (usa "Señor", "Padre", "Dios")
- La oración debe ser completamente específica a lo que la persona describió, sin ser genérica
- Menciona elementos concretos de la situación compartida
- El enfoque debe ser restauración, reconciliación, fortalecimiento del vínculo matrimonial y amor renovado
- Tono: íntimo, esperanzador, como una conversación real con Dios en este momento
- Extensión: 6 a 9 líneas
- Sin asteriscos, guiones, viñetas ni ningún tipo de formato especial
- Solo el texto de la oración, nada más
- Escribe en español, siempre en español, sin excepción`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 700 },
        }),
      }
    );

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) throw new Error("Respuesta vacía.");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oracao: texto }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

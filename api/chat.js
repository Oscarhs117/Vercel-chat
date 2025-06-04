export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { message } = req.body;

  const apiKey = process.env.OPENAI_API_KEY;
  const assistantId = process.env.OPENAI_ASSISTANT_ID;

  try {
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }]
      })
    });

    const threadData = await threadRes.json();
    const threadId = threadData.id;

    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({ assistant_id: assistantId })
    });

    const runData = await runRes.json();

    // Esperar respuesta
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000)); // espera 1 segundo

      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });

      const messagesData = await messagesRes.json();
      if (messagesData?.data?.length > 1) {
        const reply = messagesData.data[0].content[0].text.value;
        return res.status(200).json({ reply });
      }
    }

    res.status(408).json({ error: 'Tiempo de espera agotado' });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor', details: err.message });
  }
}

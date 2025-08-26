const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { message } = req.body || {};
  if (!message) {
    res.status(200).json({ answer: 'Geen vraag ontvangen.' });
    return;
  }

  let kb = [];
  try {
    const kbPath = path.join(__dirname, '..', 'knowledge.json');
    kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
  } catch (e) {
    kb = [];
  }
  const kbText = kb.map(item => `- ${item.q}: ${item.a}`).join('\n');

  const system = "Je bent de AI-assistent voor Lukkes Outdoor (tuinmeubelen, Wolvega). "
    + "Antwoord kort en vriendelijk. Antwoord in het Nederlands.";

  const userPrompt = `BEDRIJFSKENNIS:\n${kbText}\n---\nVRAAG VAN KLANT: ${message}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(200).json({ answer: 'API key ontbreekt.' });
    return;
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });
    const data = await resp.json();
    const answer = data?.choices?.[0]?.message?.content || 'Geen antwoord.';
    res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(200).json({ answer: 'Fout bij ophalen antwoord.' });
  }
};

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const prompt = process.argv.slice(2).join(" ") || "Hello!";

console.log("Prompt:", prompt);
console.log("Thinking...\n");

const stream = client.messages.stream({
  model: "claude-opus-4-6",
  max_tokens: 4096,
  thinking: { type: "adaptive" },
  messages: [{ role: "user", content: prompt }],
});

for await (const event of stream) {
  if (
    event.type === "content_block_delta" &&
    event.delta.type === "text_delta"
  ) {
    process.stdout.write(event.delta.text);
  }
}

console.log("\n\nDone.");

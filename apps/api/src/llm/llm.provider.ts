import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class LlmProvider {
  private client: OpenAI;
  private model: string;
  private embeddingModel: string;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.enabled = Boolean(apiKey && apiKey.trim().length > 0);
    this.client = new OpenAI({
      apiKey: apiKey || 'disabled',
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.enabled) {
      throw new Error('LLM disabled: OPENAI_API_KEY not configured');
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned no choices');
    }
    return content;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.enabled) {
      throw new Error('Embedding disabled: OPENAI_API_KEY not configured');
    }

    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });

    const embedding = response.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('Embedding generation failed');
    }
    return embedding;
  }
}

require 'spec_helper'

RSpec.describe 'Streaming Ruby OpenAI Integration' do
  let(:client) { create_test_client }

  describe 'basic streaming completion' do
    it 'returns streaming response chunks' do
      received_chunks = []
      content_parts = []
      found_finish_reason = false

      client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'user', content: 'Hello Stream' }
          ],
          stream: proc do |chunk, _bytesize|
            received_chunks << chunk
            
            # Collect content from delta
            if chunk.dig('choices', 0, 'delta', 'content')
              content_parts << chunk.dig('choices', 0, 'delta', 'content')
            end
            
            # Check for finish reason
            if chunk.dig('choices', 0, 'finish_reason')
              found_finish_reason = true
              expect(chunk.dig('choices', 0, 'finish_reason')).to eq('stop')
            end
          end
        }
      )

      expect(received_chunks).not_to be_empty
      expect(content_parts.join).to eq('Hello Stream')
      expect(found_finish_reason).to be true
      
      # Verify stream structure
      first_chunk = received_chunks.first
      expect(first_chunk['model']).to eq('echo')
      expect(first_chunk['object']).to eq('chat.completion.chunk')
      expect(first_chunk['id']).to be_truthy
      expect(first_chunk['created']).to be_truthy
    end
  end

  describe 'streaming content reconstruction' do
    it 'reconstructs multiline content correctly' do
      multiline_message = "Line 1\nLine 2\nLine 3"
      content_parts = []

      client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'user', content: multiline_message }
          ],
          stream: proc do |chunk, _bytesize|
            if chunk.dig('choices', 0, 'delta', 'content')
              content_parts << chunk.dig('choices', 0, 'delta', 'content')
            end
          end
        }
      )

      expect(content_parts.join).to eq(multiline_message)
    end
  end

  describe 'streaming with special characters' do
    it 'preserves special characters and unicode' do
      special_message = "Hello! 🌟 Special: @#$%^&*()"
      content_parts = []

      client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'user', content: special_message }
          ],
          stream: proc do |chunk, _bytesize|
            if chunk.dig('choices', 0, 'delta', 'content')
              content_parts << chunk.dig('choices', 0, 'delta', 'content')
            end
          end
        }
      )

      expect(content_parts.join).to eq(special_message)
    end
  end

  describe 'streaming response structure validation' do
    it 'has proper chunk structure' do
      chunks_with_content = []

      client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'user', content: 'Structure test' }
          ],
          stream: proc do |chunk, _bytesize|
            # Each chunk should have basic structure
            expect(chunk['id']).to be_truthy
            expect(chunk['object']).to eq('chat.completion.chunk')
            expect(chunk['model']).to eq('echo')
            expect(chunk['choices']).to be_an(Array)
            
            # Check choice structure
            choice = chunk['choices'][0]
            expect(choice['index']).to eq(0)
            expect(choice['delta']).to be_truthy
            
            # If this chunk has content, track it
            if chunk.dig('choices', 0, 'delta', 'content')
              chunks_with_content << chunk
            end
          end
        }
      )

      expect(chunks_with_content).not_to be_empty
    end
  end

  describe 'empty message streaming' do
    it 'handles empty input in streaming mode' do
      received_any_chunk = false

      client.chat(
        parameters: {
          model: 'echo',
          messages: [
            { role: 'user', content: '' }
          ],
          stream: proc do |chunk, _bytesize|
            received_any_chunk = true
          end
        }
      )

      expect(received_any_chunk).to be true
    end
  end
end